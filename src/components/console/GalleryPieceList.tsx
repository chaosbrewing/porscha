"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

/**
 * The wall, as the console sees it — hidden pieces included.
 *
 * File-backed pieces and console-authored ones sit in one list on
 * purpose: visibility, featuring, and ordering work identically for
 * both. Only content editing distinguishes them, and the list says so.
 */

export type AdminPiece = {
  slug: string;
  title: string;
  category: string;
  categoryLabel: string;
  year: string;
  media: string;
  alt: string;
  origin: "file" | "console";
  hidden: boolean;
  featured: boolean;
};

export function GalleryPieceList({
  pieces,
  manualOrder,
}: {
  pieces: AdminPiece[];
  manualOrder: boolean;
}) {
  const router = useRouter();
  const [order, setOrder] = useState(pieces);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);

  async function patchOverlay(piece: AdminPiece, next: Partial<AdminPiece>) {
    setBusy(piece.slug);
    setError(null);
    try {
      const res = await fetch(
        `/api/console/admin/gallery/pieces/${piece.slug}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            hidden: next.hidden ?? piece.hidden,
            featured: next.featured ?? piece.featured,
            position: null,
          }),
        },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "That didn't save.");
        return;
      }
      setOrder((list) =>
        list.map((p) => (p.slug === piece.slug ? { ...p, ...next } : p)),
      );
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  function move(index: number, delta: number) {
    const target = index + delta;
    if (target < 0 || target >= order.length) return;
    const next = [...order];
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    setDirty(true);
  }

  async function saveOrder() {
    setBusy("__order");
    setError(null);
    try {
      const res = await fetch("/api/console/admin/gallery/pieces", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: order.map((p) => p.slug) }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Reordering didn't save.");
        return;
      }
      setDirty(false);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  async function remove(piece: AdminPiece) {
    if (
      !confirm(
        `Delete “${piece.title}”? This removes the piece and its settings for good.`,
      )
    ) {
      return;
    }
    setBusy(piece.slug);
    setError(null);
    try {
      const res = await fetch(
        `/api/console/admin/gallery/pieces/${piece.slug}`,
        { method: "DELETE" },
      );
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Deleting failed.");
        return;
      }
      setOrder((list) => list.filter((p) => p.slug !== piece.slug));
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h2 className="type-heading text-xl">Pieces</h2>
        <Link
          href="/console/settings/gallery/new"
          className="rounded-[4px] bg-accent px-4 py-2 text-sm font-medium text-ink-inverse hover:bg-accent-deep transition-colors duration-[var(--duration-micro)]"
        >
          + Add piece
        </Link>
      </div>

      {manualOrder ? (
        <p className="mt-2 text-sm text-ink-soft">
          Manual order is on — the arrows set the wall&rsquo;s sequence.
        </p>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">
          Ordering is automatic. Switch the page order to{" "}
          <strong>Manual order</strong> above to arrange pieces by hand.
        </p>
      )}

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded border border-alert/40 bg-alert-wash px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <ul className="mt-5 divide-y divide-line border-y border-line">
        {order.map((piece, i) => (
          <li
            key={piece.slug}
            className={`flex flex-wrap items-center gap-4 py-4 ${
              piece.hidden ? "opacity-60" : ""
            }`}
          >
            <div className="h-14 w-14 shrink-0 overflow-hidden rounded-[3px] border border-line bg-paper-raised">
              {piece.media ? (
                <Image
                  src={piece.media}
                  alt=""
                  width={56}
                  height={56}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>

            <div className="min-w-48 flex-1">
              <span className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
                <span className="type-heading text-base">{piece.title}</span>
                {piece.featured ? (
                  <span className="type-meta text-accent-deep">Featured</span>
                ) : null}
                {piece.hidden ? (
                  <span className="type-meta text-ink-faint">Hidden</span>
                ) : null}
              </span>
              <span className="mt-0.5 block text-xs text-ink-faint">
                {piece.categoryLabel} · {piece.year} ·{" "}
                {piece.origin === "file" ? "Markdown file" : "Console"}
              </span>
            </div>

            {manualOrder ? (
              <span className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  aria-label={`Move ${piece.title} up`}
                  className="h-9 w-9 rounded-[3px] border border-line-strong text-sm disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  disabled={i === order.length - 1}
                  aria-label={`Move ${piece.title} down`}
                  className="h-9 w-9 rounded-[3px] border border-line-strong text-sm disabled:opacity-30"
                >
                  ↓
                </button>
              </span>
            ) : null}

            <span className="flex flex-wrap items-center gap-4 text-sm">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!piece.hidden}
                  disabled={busy === piece.slug}
                  onChange={(e) =>
                    patchOverlay(piece, { hidden: !e.target.checked })
                  }
                />
                Visible
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={piece.featured}
                  disabled={busy === piece.slug}
                  onChange={(e) =>
                    patchOverlay(piece, { featured: e.target.checked })
                  }
                />
                Feature
              </label>

              {piece.origin === "console" ? (
                <>
                  <Link
                    href={`/console/settings/gallery/${piece.slug}`}
                    className="text-accent-deep hover:underline"
                  >
                    Edit
                  </Link>
                  <button
                    type="button"
                    onClick={() => remove(piece)}
                    disabled={busy === piece.slug}
                    className="text-alert hover:underline disabled:opacity-50"
                  >
                    Delete
                  </button>
                </>
              ) : (
                <span
                  className="text-xs text-ink-faint"
                  title="Content lives in src/content/gallery — edit the Markdown file"
                >
                  File-backed
                </span>
              )}
            </span>
          </li>
        ))}
      </ul>

      {order.length === 0 ? (
        <p className="py-8 text-sm text-ink-soft">
          No pieces yet. Add one, or drop a Markdown file in
          {" "}
          <code>src/content/gallery</code>.
        </p>
      ) : null}

      {manualOrder && dirty ? (
        <div className="mt-5 flex items-center gap-4">
          <button
            type="button"
            onClick={saveOrder}
            disabled={busy === "__order"}
            className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverse hover:bg-accent-deep disabled:opacity-50 transition-colors duration-[var(--duration-micro)]"
          >
            {busy === "__order" ? "Saving…" : "Save order"}
          </button>
          <span className="text-sm text-ink-soft">Order not saved yet.</span>
        </div>
      ) : null}
    </div>
  );
}
