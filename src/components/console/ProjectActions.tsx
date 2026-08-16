"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

/** Archive action with explicit confirmation. Archival, not deletion. */
export function ArchiveProjectButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function archive() {
    if (
      !window.confirm(
        `Archive ${name}? It moves to “archived”, leaves the public site, and can be brought back later by editing its status.`,
      )
    ) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/console/admin/projects/${slug}/archive`, {
        method: "POST",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Archiving failed.");
        return;
      }
      router.push(`/console/projects/${slug}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-3">
      {error ? <span className="text-sm text-alert">{error}</span> : null}
      <button
        type="button"
        onClick={archive}
        disabled={busy}
        className="border border-alert/50 px-3.5 py-2 text-xs rounded-[3px] text-alert hover:border-alert transition-colors duration-[var(--duration-micro)] disabled:opacity-60"
      >
        {busy ? "Archiving…" : "Archive project"}
      </button>
    </span>
  );
}
