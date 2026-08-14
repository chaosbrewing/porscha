import "server-only";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { env } from "@/server/env";
import * as schema from "./schema";

/**
 * Database client. A single pool per server process; survives Next.js
 * dev-mode module reloads via globalThis.
 */
const globalForDb = globalThis as unknown as {
  __porschaPool?: Pool;
};

function createPool() {
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

const pool = globalForDb.__porschaPool ?? createPool();
if (!env.isProduction) globalForDb.__porschaPool = pool;

export const db: NodePgDatabase<typeof schema> = drizzle(pool, { schema });
export { schema };
