"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { PAGE_KEYS, PAGE_META, type PageKey } from "@/content/site/schema";
import { PAGE_FIELDS } from "./fields";
import { FieldRenderer, type Doc } from "./FieldRenderer";

/**
 * Settings → Pages. Pick a page, edit every word, list and image on it,
 * see it in the preview, save. "Back to defaults" drops the override
 * so the page returns to what the code ships.
 */
export function PageEditor({
  page,
  initial,
  overridden,
}: {
  page: PageKey;
  initial: Doc;
  overridden: boolean;
}) {
  const router = useRouter();
  const [doc, setDoc] = useState<Doc>(initial);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [previewKey, setPreviewKey] = useState(0);
  const meta = PAGE_META[page];

  function change(next: Doc) {
    setDoc(next);
    setDirty(true);
    setSaved(false);
  }

  function choosePage(next: string) {
    if (dirty && !window.confirm("You have unsaved changes on this page. Leave without saving?")) return;
    router.push(`/console/settings/pages?page=${next}`);
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/console/admin/site/${page}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doc),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Saving failed.");
        return;
      }
      setDirty(false);
      setSaved(true);
      setPreviewKey((k) => k + 1);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!window.confirm(`Put “${meta.label}” back to its defaults? Your edits to this page will be discarded.`)) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/console/admin/site/${page}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Resetting failed.");
        return;
      }
      router.refresh();
      router.push(`/console/settings/pages?page=${page}`);
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "rounded-[3px] border border-line-strong bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <label className="block text-sm">
          <span className="text-ink-soft">Page</span>
          <select value={page} onChange={(e) => choosePage(e.target.value)} className={`${field} mt-1.5 block min-w-[16rem]`}>
            {PAGE_KEYS.map((key) => (
              <option key={key} value={key}>
                {PAGE_META[key].label}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-3 text-xs text-ink-faint">
          <span>{overridden ? "Edited in the console" : "Showing the defaults"}</span>
          <a href={meta.path} target="_blank" rel="noopener" className="underline underline-offset-4 hover:text-ink">
            Open page ↗
          </a>
        </div>
      </div>
      <p className="mt-2 text-sm text-ink-soft">{meta.blurb}</p>

      <div className="mt-8 grid gap-10 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <form onSubmit={save} className="space-y-6">
          {PAGE_FIELDS[page].map((spec, i) => (
            <FieldRenderer key={`${page}-${i}`} spec={spec} doc={doc} base="" onChange={change} uploadSlug={`page-${page}`} />
          ))}

          <div className="sticky bottom-0 -mx-1 flex flex-wrap items-center gap-4 border-t border-line bg-paper px-1 py-4">
            <button
              type="submit"
              disabled={busy || !dirty}
              className="rounded-[3px] bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverse hover:bg-accent-deep disabled:opacity-50 transition-colors duration-[var(--duration-micro)]"
            >
              {busy ? "Saving…" : "Save page"}
            </button>
            {overridden ? (
              <button type="button" onClick={reset} disabled={busy} className="text-sm text-ink-soft underline underline-offset-4 hover:text-ink disabled:opacity-50">
                Back to defaults
              </button>
            ) : null}
            <span className="text-xs text-ink-faint" aria-live="polite">
              {saved ? "Saved — it's live." : dirty ? "Unsaved changes" : ""}
            </span>
            {error ? (
              <p role="alert" className="w-full rounded border border-alert/40 bg-alert-wash px-4 py-3 text-sm">
                {error}
              </p>
            ) : null}
          </div>
        </form>

        <aside className="hidden xl:block">
          <div className="sticky top-8">
            <p className="type-meta text-ink-faint">Preview · updates when you save</p>
            <div className="mt-3 overflow-hidden rounded-[6px] border border-line bg-paper-raised">
              <iframe
                key={previewKey}
                title={`Preview of ${meta.label}`}
                src={`${meta.path}${meta.path.includes("?") ? "&" : "?"}preview=${previewKey}`}
                className="h-[70vh] w-full"
              />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
