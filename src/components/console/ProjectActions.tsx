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

/**
 * Delete a console-created project.
 *
 * Only rendered for projects absent from `src/config/registry.ts` —
 * the server refuses the rest, because `syncRegistryToDb` would
 * re-create them on the next page load. Confirmation is by typed name,
 * not an OK button: this cascades milestones, work items, activity, and
 * the snapshot, and there is no undo.
 */
export function DeleteProjectButton({
  slug,
  name,
}: {
  slug: string;
  name: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function remove() {
    const typed = window.prompt(
      `Delete ${name} permanently? Its milestones, work items, activity, and ` +
        `snapshot go with it, and this cannot be undone.\n\n` +
        `Type the project name to confirm:`,
    );
    if (typed === null) return;
    if (typed.trim() !== name) {
      setError("That didn't match the project name — nothing was deleted.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/console/admin/projects/${slug}`, {
        method: "DELETE",
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Deleting failed.");
        return;
      }
      router.push("/console/projects");
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
        onClick={remove}
        disabled={busy}
        className="border border-alert/50 px-3.5 py-2 text-xs rounded-[3px] text-alert hover:border-alert transition-colors duration-[var(--duration-micro)] disabled:opacity-60"
      >
        {busy ? "Deleting…" : "Delete project"}
      </button>
    </span>
  );
}
