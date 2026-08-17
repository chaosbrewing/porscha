import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/server/env";
import { isCloudflareWorkers, requireCloudflareContext } from "@/server/runtime";
import * as schema from "./schema";

export type Db = NodePgDatabase<typeof schema>;

/**
 * Database client, runtime-aware.
 *
 * Node.js (dev/build/start/tests): a single pg Pool per process from
 * DATABASE_URL — exactly the pre-migration behavior. Survives Next.js
 * dev-mode module reloads via globalThis.
 *
 * Cloudflare Workers: connections come from the HYPERDRIVE binding.
 * Workers forbid sharing TCP connections across requests ("Cannot
 * perform I/O on behalf of a different request"), so a fresh Pool is
 * created per request and cached on the request's ExecutionContext.
 * Hyperdrive keeps the real pool warm next to Postgres, which makes
 * per-request connection setup cheap; workerd tears the sockets down
 * with the request context.
 */

const globalForDb = globalThis as unknown as {
  __porschaPool?: Pool;
};

function createNodePool() {
  const pool = new Pool({
    connectionString: env.DATABASE_URL,
    max: 10,
    connectionTimeoutMillis: 5_000,
  });
  // Keep a failed connection from crashing the process; callers handle
  // query errors and degrade to stale/empty states.
  pool.on("error", (err) => {
    console.error("[db] pool error:", err.message);
  });
  return pool;
}

let nodeDb: Db | undefined;

function getNodeDb(): Db {
  if (nodeDb) return nodeDb;
  const pool = globalForDb.__porschaPool ?? createNodePool();
  if (!env.isProduction) globalForDb.__porschaPool = pool;
  nodeDb = drizzle(pool, { schema });
  return nodeDb;
}

const workerDbPerRequest = new WeakMap<object, Db>();

function getWorkersDb(): Db {
  const { env: cfEnv, ctx } = requireCloudflareContext();
  const cached = workerDbPerRequest.get(ctx);
  if (cached) return cached;

  const hyperdrive = cfEnv.HYPERDRIVE;
  if (!hyperdrive?.connectionString) {
    throw new Error(
      "HYPERDRIVE binding is not configured. Create a Hyperdrive config " +
        "pointing at the Supabase Postgres database and bind it as " +
        "HYPERDRIVE in wrangler.jsonc.",
    );
  }

  const pool = new Pool({
    connectionString: hyperdrive.connectionString,
    // Hyperdrive multiplexes onto its own server-side pool; a small
    // per-request cap is plenty and stays under Workers' socket limits.
    max: 5,
    connectionTimeoutMillis: 10_000,
  });
  pool.on("error", (err) => {
    console.error("[db] pool error:", err.message);
  });

  const instance = drizzle(pool, { schema });
  workerDbPerRequest.set(ctx, instance);
  return instance;
}

function resolveDb(): Db {
  return isCloudflareWorkers ? getWorkersDb() : getNodeDb();
}

/**
 * Runtime-dispatching facade so every existing `db.select()...` call
 * site keeps working unchanged. Each property access resolves against
 * the runtime-appropriate drizzle instance.
 */
export const db: Db = new Proxy({} as Db, {
  get(_target, prop) {
    const real = resolveDb();
    const value = Reflect.get(real, prop) as unknown;
    return typeof value === "function"
      ? (value as (...args: unknown[]) => unknown).bind(real)
      : value;
  },
});

export { schema };
