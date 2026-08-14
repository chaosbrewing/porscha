"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Manual reconciliation trigger — the fallback for missed webhooks. */
export function SyncButton() {
  const router = useRouter();
  const [state, setState] = useState<"idle" | "syncing" | "done" | "failed">(
    "idle",
  );
  const [message, setMessage] = useState<string | null>(null);

  async function sync() {
    setState("syncing");
    setMessage(null);
    try {
      const res = await fetch("/api/console/sync", { method: "POST" });
      const json = (await res.json()) as {
        synced?: number;
        failed?: number;
        skipped?: boolean;
        message?: string;
      };
      if (!res.ok) {
        setState("failed");
        setMessage("Sync failed — check the server logs.");
        return;
      }
      if (json.skipped) {
        setState("failed");
        setMessage(json.message ?? "Sync is not configured.");
        return;
      }
      setState(json.failed ? "failed" : "done");
      setMessage(
        json.failed
          ? `${json.synced} synced, ${json.failed} failed`
          : `${json.synced} project${json.synced === 1 ? "" : "s"} refreshed`,
      );
      router.refresh();
    } catch {
      setState("failed");
      setMessage("Could not reach the server.");
    } finally {
      setTimeout(() => setState("idle"), 4000);
    }
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={sync}
        disabled={state === "syncing"}
        className="border border-line-strong px-3.5 py-2 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)] disabled:opacity-60"
      >
        {state === "syncing" ? "Syncing…" : "Sync from GitHub"}
      </button>
      {message ? (
        <span
          role="status"
          className={`text-xs ${state === "failed" ? "text-alert" : "text-ink-faint"}`}
        >
          {message}
        </span>
      ) : null}
    </span>
  );
}
