import "server-only";
import { eq } from "drizzle-orm";
import { db, schema } from "@/server/db/client";
import {
  PHOTOGRAPHY_DEFAULTS,
  photographySettingsSchema,
  type PhotographySettings,
} from "./validation";

/**
 * Photography persistence: one JSON row in `site_settings`, holding
 * only what the console has changed.
 *
 * Reads degrade rather than throw — a database that is down or
 * un-migrated must leave every page rendering its registry defaults,
 * not 500. Writes propagate their errors; the console needs to know a
 * save failed.
 */

const PHOTOGRAPHY_KEY = "site.photography";

export async function readPhotographySettings(): Promise<PhotographySettings> {
  try {
    const [row] = await db
      .select()
      .from(schema.siteSettings)
      .where(eq(schema.siteSettings.key, PHOTOGRAPHY_KEY))
      .limit(1);
    if (!row) return PHOTOGRAPHY_DEFAULTS;

    const parsed = photographySettingsSchema.safeParse(row.value);
    if (!parsed.success) {
      console.error("[photography] stored settings are invalid; using defaults");
      return PHOTOGRAPHY_DEFAULTS;
    }
    return parsed.data;
  } catch (err) {
    console.error("[photography] settings read failed:", err);
    return PHOTOGRAPHY_DEFAULTS;
  }
}

export async function writePhotographySettings(
  settings: PhotographySettings,
): Promise<void> {
  await db
    .insert(schema.siteSettings)
    .values({ key: PHOTOGRAPHY_KEY, value: settings })
    .onConflictDoUpdate({
      target: schema.siteSettings.key,
      set: { value: settings, updatedAt: new Date() },
    });
}
