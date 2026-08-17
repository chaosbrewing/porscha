"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { GalleryDisplaySettings } from "@/server/gallery/validation";

/**
 * Page-level gallery settings. Saves the whole blob at once — the
 * server validates it and the public page reads it on next render.
 */

const SORTS: Array<{ value: GalleryDisplaySettings["sort"]; label: string }> = [
  { value: "year-desc", label: "Newest first" },
  { value: "year-asc", label: "Oldest first" },
  { value: "title", label: "By title" },
  { value: "manual", label: "Manual order" },
];

export function GalleryDisplayForm({
  initial,
}: {
  initial: GalleryDisplaySettings;
}) {
  const router = useRouter();
  const [value, setValue] = useState<GalleryDisplaySettings>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function patch(next: Partial<GalleryDisplaySettings>) {
    setValue((v) => ({ ...v, ...next }));
    setSaved(false);
  }

  function patchCategory(key: string, next: { label?: string; visible?: boolean }) {
    setValue((v) => ({
      ...v,
      categories: v.categories.map((c) => (c.key === key ? { ...c, ...next } : c)),
    }));
    setSaved(false);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/console/admin/gallery/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(value),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Saving failed.");
        return;
      }
      setSaved(true);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-[3px] border border-line-strong bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <form onSubmit={save} className="max-w-2xl">
      <h2 className="type-heading text-xl">Page</h2>

      <label className="mt-5 block text-sm">
        <span className="text-ink-soft">Heading</span>
        <input
          value={value.heading}
          onChange={(e) => patch({ heading: e.target.value })}
          maxLength={80}
          className={field}
        />
      </label>

      <label className="mt-4 block text-sm">
        <span className="text-ink-soft">Intro</span>
        <textarea
          value={value.intro}
          onChange={(e) => patch({ intro: e.target.value })}
          rows={3}
          maxLength={400}
          className={field}
        />
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-soft">Columns</span>
          <select
            value={value.columns}
            onChange={(e) => patch({ columns: Number(e.target.value) })}
            className={field}
          >
            {[1, 2, 3, 4].map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink-soft">Order</span>
          <select
            value={value.sort}
            onChange={(e) =>
              patch({ sort: e.target.value as GalleryDisplaySettings["sort"] })
            }
            className={field}
          >
            {SORTS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="mt-4 flex items-start gap-3 text-sm">
        <input
          type="checkbox"
          checked={value.featuredFirst}
          onChange={(e) => patch({ featuredFirst: e.target.checked })}
          className="mt-0.5"
        />
        <span>
          Featured pieces first
          <span className="block text-ink-faint">
            Pins featured pieces to the front, whatever the order above.
          </span>
        </span>
      </label>

      <h2 className="type-heading text-xl mt-10">Categories</h2>
      <p className="mt-1 text-sm text-ink-soft">
        Rename them, or hide a whole category from the public wall.
      </p>

      <ul className="mt-4 divide-y divide-line border-y border-line">
        {value.categories.map((c) => (
          <li key={c.key} className="flex flex-wrap items-center gap-3 py-3">
            <input
              value={c.label}
              onChange={(e) => patchCategory(c.key, { label: e.target.value })}
              maxLength={40}
              aria-label={`Label for ${c.key}`}
              className="flex-1 min-w-40 rounded-[3px] border border-line-strong bg-paper px-3 py-1.5 text-sm focus:border-accent focus:outline-none"
            />
            <code className="type-meta text-ink-faint">{c.key}</code>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={c.visible}
                onChange={(e) => patchCategory(c.key, { visible: e.target.checked })}
              />
              Visible
            </label>
          </li>
        ))}
      </ul>

      {error ? (
        <p
          role="alert"
          className="mt-6 rounded border border-alert/40 bg-alert-wash px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverse hover:bg-accent-deep disabled:opacity-50 transition-colors duration-[var(--duration-micro)]"
        >
          {busy ? "Saving…" : "Save settings"}
        </button>
        <span aria-live="polite" className="text-sm text-ink-soft">
          {saved ? "Saved." : ""}
        </span>
      </div>
    </form>
  );
}
