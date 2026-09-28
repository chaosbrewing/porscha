import "server-only";
import { eq, like } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import type { PageKey } from "@/content/site/schema";

/**
 * Page content persistence: one JSON row per page in `site_settings`,
 * under `site.page.<key>`. Reads degrade to "no override" so a
 * database that is down leaves the site on its defaults rather than
 * failing; writes propagate their errors so the console knows a save
 * did not stick.
 */

const PREFIX = "site.page.";

export function pageSettingKey(key: PageKey): string {
  return `${PREFIX}${key}`;
}

export async function readPageOverrides(): Promise<Map<PageKey, unknown>> {
  const out = new Map<PageKey, unknown>();
  try {
    const rows = await db
      .select()
      .from(schema.siteSettings)
      .where(like(schema.siteSettings.key, `${PREFIX}%`));
    for (const row of rows) {
      out.set(row.key.slice(PREFIX.length) as PageKey, row.value);
    }
  } catch (err) {
    console.error("[site] page override read failed:", err);
  }
  return out;
}

export async function readPageOverride(key: PageKey): Promise<unknown | undefined> {
  try {
    const [row] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, pageSettingKey(key)))
      .limit(1);
    return row?.value;
  } catch (err) {
    console.error("[site] page override read failed:", err);
    return undefined;
  }
}

export async function writePageOverride(key: PageKey, value: unknown): Promise<void> {
  await db
    .insert(schema.siteSettings)
    .values({ key: pageSettingKey(key), value })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value, updatedAt: new Date() },
    });
}

export async function deletePageOverride(key: PageKey): Promise<void> {
  await db.delete(schema.siteSettings).where(eq(schema.siteSettings.key, pageSettingKey(key)));
}
