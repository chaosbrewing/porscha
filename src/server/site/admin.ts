import "server-only";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/server/db/client";
import type { PageKey, SiteContent } from "@/content/site/schema";
import { deletePageOverride, writePageOverride } from "./store";

/**
 * Page content administration. Every mutation runs behind a
 * two_factor_verified session (the API routes enforce it) and records
 * an audit event in the same log the gallery uses, keyed `page:<key>`,
 * so one place still answers "what changed on the site, and when".
 */

async function record(actorId: string, action: string, key: PageKey): Promise<void> {
  await db
    .insert(schema.galleryAdminEvents)
    .values({ id: randomUUID(), slug: `page:${key}`, actorId, action, detail: null })
    .catch((err) => {
      console.error("[site] failed to record admin event %s:", action, err);
    });
}

export async function savePage<K extends PageKey>(
  actorId: string,
  key: K,
  value: SiteContent[K],
): Promise<void> {
  await writePageOverride(key, value);
  await record(actorId, "page_saved", key);
}

export async function resetPage(actorId: string, key: PageKey): Promise<void> {
  await deletePageOverride(key);
  await record(actorId, "page_reset", key);
}
