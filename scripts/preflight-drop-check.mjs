#!/usr/bin/env node
/**
 * Read-only preflight for migration 0006, which drops
 * `gallery_items.edition_size` and `gallery_items.stripe_price_id`.
 *
 * A DROP COLUMN is irreversible without a restore, so this proves the
 * columns hold nothing before the deploy runs it. Read-only by
 * construction: it issues SELECTs and never writes.
 *
 * Exit codes:
 *   0  safe to drop (columns absent, or present and entirely NULL)
 *   1  DATA FOUND — do not deploy; the drop would destroy values
 *   2  could not check (no DATABASE_URL, or the database is unreachable)
 *
 * Usage:
 *   DATABASE_URL=postgres://... node scripts/preflight-drop-check.mjs
 */

import pg from "pg";

const TABLE = "gallery_items";
const DOOMED = ["edition_size", "stripe_price_id"];

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("preflight: DATABASE_URL is not set — cannot verify.");
  process.exit(2);
}

const client = new pg.Client({ connectionString: url });

try {
  await client.connect();

  // Which of the doomed columns actually exist right now? On a database
  // that has not yet run 0004 they do not exist at all, which is the
  // strongest possible evidence that nothing can be lost.
  const { rows: present } = await client.query(
    `select column_name
       from information_schema.columns
      where table_schema = current_schema()
        and table_name = $1
        and column_name = any($2::text[])`,
    [TABLE, DOOMED],
  );
  const existing = present.map((r) => r.column_name);
  const absent = DOOMED.filter((c) => !existing.includes(c));

  for (const column of absent) {
    console.log(`preflight: ${TABLE}.${column} does not exist — nothing to lose.`);
  }

  let populated = 0;
  for (const column of existing) {
    // Identifiers cannot be parameterised; every value in DOOMED is a
    // hard-coded literal above, never user input.
    const { rows } = await client.query(
      `select count(*)::int as n from "${TABLE}" where "${column}" is not null`,
    );
    const n = rows[0].n;
    if (n === 0) {
      console.log(`preflight: ${TABLE}.${column} exists and is entirely NULL (0 rows).`);
    } else {
      populated += n;
      console.error(
        `preflight: ${TABLE}.${column} holds ${n} non-NULL value(s) — DROP WOULD DESTROY DATA.`,
      );
    }
  }

  const { rows: totals } = await client.query(
    `select count(*)::int as n from "${TABLE}"`,
  );
  console.log(`preflight: ${TABLE} has ${totals[0].n} row(s) total.`);

  if (populated > 0) {
    console.error(
      "preflight: FAILED — migration 0006 must not run until these values are preserved.",
    );
    process.exit(1);
  }
  console.log("preflight: OK — 0006 is safe to apply.");
  process.exit(0);
} catch (err) {
  console.error(`preflight: could not verify — ${err.message}`);
  process.exit(2);
} finally {
  await client.end().catch(() => {});
}
