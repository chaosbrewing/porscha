#!/usr/bin/env node
/**
 * Production migration runner.
 *
 * Applies the SQL migrations in ./drizzle using drizzle-orm's built-in
 * migrator. Run as an explicit deployment step (the Deploy to
 * Cloudflare workflow calls it before `wrangler deploy`; the Worker
 * itself never migrates). Uses the same `drizzle.__drizzle_migrations`
 * journal as `npm run db:migrate`, so the two are interchangeable and
 * already-applied migrations are skipped.
 */
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("[migrate] DATABASE_URL is required");
  process.exit(1);
}

const pool = new pg.Pool({ connectionString: url, max: 1 });
try {
  await migrate(drizzle(pool), { migrationsFolder: "./drizzle" });
  console.log("[migrate] database is up to date");
} catch (err) {
  console.error("[migrate] migration failed:", err);
  process.exit(1);
} finally {
  await pool.end();
}
