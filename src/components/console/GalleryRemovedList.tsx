"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * File-backed pieces the console has removed.
 *
 * They get their own list rather than disappearing: the Markdown still
 * ships in every build, so "removed" is a row saying *don't show this*
 * — and something reversible needs somewhere to be reversed from.
 */

export type RemovedPiece = {
  slug: string;
  title: string;
  categoryLabel: string;
  year: string;
  media: string;
};

export function GalleryRemovedList({ pieces }: { pieces: RemovedPiece[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (pieces.length === 0) return null;

  async function restore(piece: RemovedPiece) {
    setBusy(piece.slug);
    setError(null);
    try {
      const res = await fetch(
        `/api/console/admin/gallery/pieces/${piece.slug}/restore`,
        { method: "POST" },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Restoring failed.");
        return;
      }
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <h2 className="type-heading text-xl">Removed</h2>
      <p className="mt-2 text-sm text-ink-soft">
        Off the site, but still in the repo as Markdown. Delete the file in{" "}
        <code>src/content/gallery</code> to be rid of a piece for good.
      </p>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded border border-alert/40 bg-alert-wash px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <ul className="mt-5 divide-y divide-line border-y border-line">
        {pieces.map((piece) => (
          <li
            key={piece.slug}
            className="flex flex-wrap items-center gap-4 py-4 opacity-70"
          >
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-[3px] border border-line bg-paper-raised grayscale">
              {piece.media ? (
                <Image
                  src={piece.media}
                  alt=""
                  width={48}
                  height={48}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="min-w-48 flex-1">
              <span className="type-heading text-base">{piece.title}</span>
              <span className="mt-0.5 block text-xs text-ink-faint">
                {piece.categoryLabel} · {piece.year} · Markdown file
              </span>
            </div>
            <button
              type="button"
              onClick={() => restore(piece)}
              disabled={busy === piece.slug}
              className="rounded-[3px] border border-line-strong px-3.5 py-2 text-xs hover:border-ink transition-colors duration-[var(--duration-micro)] disabled:opacity-50"
            >
              {busy === piece.slug ? "Restoring…" : "Put back"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
