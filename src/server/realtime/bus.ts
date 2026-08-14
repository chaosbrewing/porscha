import "server-only";
import { EventEmitter } from "node:events";

/**
 * In-process realtime bus. Webhook ingestion and sync publish here;
 * the console SSE stream subscribes. Single-process by design for v1 —
 * the SSE clients also fall back to periodic refresh, so a multi-
 * instance deployment degrades gracefully rather than breaking.
 */

export type RealtimeEvent =
  | { kind: "activity"; projectSlug: string; activityType: string; at: string }
  | { kind: "snapshot"; projectSlug: string; at: string }
  | { kind: "sync"; status: "started" | "finished" | "failed"; at: string };

const globalForBus = globalThis as unknown as {
  __porschaBus?: EventEmitter;
};

export const realtimeBus: EventEmitter =
  globalForBus.__porschaBus ?? new EventEmitter();
realtimeBus.setMaxListeners(100);
globalForBus.__porschaBus = realtimeBus;

export function publishRealtime(event: RealtimeEvent) {
  realtimeBus.emit("event", event);
}
