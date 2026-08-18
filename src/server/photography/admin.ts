import "server-only";
import { randomUUID } from "node:crypto";
import { db, schema } from "@/server/db/client";
import { writePhotographySettings } from "./store";
import type { PhotographySettings } from "./validation";

/**
 * Photography administration.
 *
 * One write, behind a two_factor_verified session (the API route
 * enforces it), recorded in the same editorial audit log the gallery
 * uses — these are site-wide edits, so the event carries no slug of
 * its own but names which slots moved.
 */

export async function savePhotography(
  actorId: string,
  settings: PhotographySettings,
): Promise<void> {
  await writePhotographySettings(settings);

  await db
    .insert(schema.galleryAdminEvents)
    .values({
      id: randomUUID(),
      slug: null,
      actorId,
      action: "photography.saved",
      detail: { slots: Object.keys(settings.slots).sort() },
    })
    .catch((err) => {
      // An audit write must never fail the mutation it describes; the
      // console would report a failure that already took effect.
      console.error("[photography] failed to record admin event:", err);
    });
}
