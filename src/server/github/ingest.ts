import "server-only";
import { getProjectConfigByRepo } from "@/config/registry";
import { normalizeWebhookEvent } from "./normalize";
import {
  insertActivity,
  patchSnapshot,
  recordWebhookDelivery,
} from "@/server/projects/store";
import { publishRealtime } from "@/server/realtime/bus";

/**
 * Webhook ingestion: called by the route handler after signature
 * verification. Deduplicates deliveries, maps repository → registered
 * project, normalizes, persists, and publishes to the realtime bus.
 */

export type IngestResult =
  | { outcome: "processed"; projectSlug: string; activityType: string | null }
  | { outcome: "duplicate" }
  | { outcome: "unregistered_repository" }
  | { outcome: "ignored" };

export async function ingestWebhookEvent(
  eventName: string,
  deliveryId: string,
  payload: unknown,
): Promise<IngestResult> {
  const fresh = await recordWebhookDelivery(deliveryId, eventName);
  if (!fresh) return { outcome: "duplicate" };

  const normalized = normalizeWebhookEvent(eventName, payload);
  if (!normalized.repoFullName) return { outcome: "ignored" };

  const project = getProjectConfigByRepo(normalized.repoFullName);
  if (!project) return { outcome: "unregistered_repository" };

  if (!normalized.activity && !normalized.snapshotPatch) {
    return { outcome: "ignored" };
  }

  if (normalized.activity) {
    await insertActivity({
      id: `wh:${deliveryId}`,
      projectSlug: project.slug,
      type: normalized.activity.type,
      occurredAt: new Date(normalized.activity.occurredAt),
      publicSummary: normalized.activity.publicSummary,
      privatePayload: normalized.activity.privatePayload,
    });
  }

  if (normalized.snapshotPatch) {
    await patchSnapshot(project.slug, normalized.snapshotPatch);
  }

  publishRealtime({
    kind: "activity",
    projectSlug: project.slug,
    activityType: normalized.activity?.type ?? "snapshot",
    at: new Date().toISOString(),
  });

  return {
    outcome: "processed",
    projectSlug: project.slug,
    activityType: normalized.activity?.type ?? null,
  };
}
