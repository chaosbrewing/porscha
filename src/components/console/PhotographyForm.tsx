"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type {
  PhotographySettings,
  PhotoOverride,
} from "@/server/photography/validation";

/**
 * Every editorial photograph on the public site, in one editor.
 *
 * Each row is a slot: where it appears, what it currently shows, and
 * the brief for what belongs there. Uploading measures the file's own
 * aspect ratio and stores it with the path, so the layout reserves the
 * right box before the image loads.
 *
 * Three states per slot, and the buttons say which is which:
 *   - a photograph (uploaded, or a path already in `public/`);
 *   - held on purpose — the public page shows the reserved plate;
 *   - untouched, falling back to the site's default for that slot.
 */

export type SlotRow = {
  key: string;
  where: string;
  label: string;
  brief: string;
  /** What the public page shows right now, defaults and overrides merged. */
  current: { src: string | null; alt: string; aspect: string; focal?: string; caption?: string };
  /** What this slot falls back to when the console says nothing. */
  fallback: { src: string | null; aspect: string };
};

const FOCAL_CHOICES = [
  { value: "50% 50%", label: "Centre" },
  { value: "50% 22%", label: "Face — high" },
  { value: "50% 30%", label: "Face — upper third" },
  { value: "50% 0%", label: "Top" },
  { value: "50% 100%", label: "Bottom" },
  { value: "0% 50%", label: "Left" },
  { value: "100% 50%", label: "Right" },
];

export function PhotographyForm({
  rows,
  initial,
  uploadsConfigured,
}: {
  rows: SlotRow[];
  initial: PhotographySettings;
  /** R2 is a Workers binding, so uploading only exists in production. */
  uploadsConfigured: boolean;
}) {
  const router = useRouter();
  const [slots, setSlots] = useState<Record<string, PhotoOverride>>(
    initial.slots,
  );
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  function patch(key: string, next: PhotoOverride) {
    setSlots((s) => ({ ...s, [key]: { ...s[key], ...next } }));
    setSaved(false);
  }

  function reset(key: string) {
    setSlots((s) => {
      const next = { ...s };
      delete next[key];
      return next;
    });
    setSaved(false);
  }

  /** The value a field shows: the override if set, else the default. */
  function shown(row: SlotRow, field: "alt" | "focal" | "caption"): string {
    const override = slots[row.key]?.[field];
    if (typeof override === "string") return override;
    return row.current[field] ?? "";
  }

  function srcOf(row: SlotRow): string | null {
    const override = slots[row.key]?.src;
    if (override === undefined) return row.current.src;
    return override;
  }

  async function upload(row: SlotRow, file: File) {
    setUploading(row.key);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("slot", row.key);
      const res = await fetch("/api/console/admin/photography/media", {
        method: "POST",
        body,
      });
      const json = (await res.json()) as {
        src?: string;
        aspect?: string;
        error?: string;
      };
      if (!res.ok || !json.src) {
        setError(json.error ?? "The upload didn't complete.");
        return;
      }
      patch(row.key, { src: json.src, aspect: json.aspect });
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setUploading(null);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Empty strings mean "say nothing about this field", not "blank
      // it out" — the server reads absence as fall back to the default.
      const cleaned: Record<string, PhotoOverride> = {};
      for (const [key, value] of Object.entries(slots)) {
        const entry: PhotoOverride = {};
        if (value.src !== undefined) entry.src = value.src;
        if (value.aspect) entry.aspect = value.aspect;
        if (value.alt?.trim()) entry.alt = value.alt.trim();
        if (value.focal?.trim()) entry.focal = value.focal.trim();
        if (value.caption?.trim()) entry.caption = value.caption.trim();
        if (Object.keys(entry).length > 0) cleaned[key] = entry;
      }

      const res = await fetch("/api/console/admin/photography", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slots: cleaned }),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Saving failed.");
        return;
      }
      setSlots(cleaned);
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
    <form onSubmit={save}>
      <p className="max-w-2xl text-sm text-ink-soft leading-relaxed">
        Every photograph on the public site lives here — the cover, the
        section openers, and one frame per app. A slot with no photograph
        shows a reserved plate at the same proportions, so swapping one in
        never moves the layout.
      </p>

      {!uploadsConfigured ? (
        <p className="mt-4 max-w-2xl border border-line px-4 py-3 text-sm text-ink-soft">
          Uploads need the R2 media binding, which only exists in
          production. Locally, point a slot at an image already in{" "}
          <code>public/</code> — the path field takes anything the site
          serves.
        </p>
      ) : null}

      <div className="mt-8 space-y-10">
        {rows.map((row) => {
          const src = srcOf(row);
          const overridden = slots[row.key] !== undefined;

          return (
            <section
              key={row.key}
              className="border-t border-line pt-6 md:grid md:grid-cols-[220px_1fr] md:gap-8"
            >
              <div>
                <p className="type-meta text-ink-faint">{row.where}</p>
                <h3 className="type-heading mt-1 text-lg">{row.label}</h3>
                <p className="mt-2 text-xs text-ink-soft leading-relaxed">
                  {row.brief}
                </p>

                <div
                  className="mt-3 overflow-hidden rounded-[3px] border border-line bg-paper-sunken"
                  style={{ aspectRatio: (slots[row.key]?.aspect ?? row.current.aspect).replace("/", " / ") }}
                >
                  {src ? (
                    // Deliberately a plain <img>: this is a console
                    // preview of an arbitrary path, and it must render
                    // the moment an upload returns.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={src}
                      alt=""
                      className="h-full w-full object-cover"
                      style={{ objectPosition: shown(row, "focal") || "50% 50%" }}
                    />
                  ) : (
                    <span className="flex h-full items-center justify-center px-3 text-center text-xs text-ink-faint">
                      Held — the page shows a reserved plate
                    </span>
                  )}
                </div>

                <p className="mt-2 text-xs text-ink-faint">
                  {overridden ? "Set in the console" : "Site default"}
                </p>
              </div>

              <div className="mt-5 md:mt-0">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="inline-flex cursor-pointer items-center rounded-[3px] border border-line-strong px-4 py-2 text-sm text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]">
                    {uploading === row.key ? "Uploading…" : "Upload photograph"}
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="sr-only"
                      disabled={uploading !== null}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = "";
                        if (file) void upload(row, file);
                      }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => patch(row.key, { src: null })}
                    className="rounded-[3px] border border-line-strong px-4 py-2 text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
                  >
                    Hold this slot
                  </button>

                  <button
                    type="button"
                    onClick={() => reset(row.key)}
                    disabled={!overridden}
                    className="rounded-[3px] px-3 py-2 text-sm text-ink-faint hover:text-ink disabled:opacity-40 transition-colors duration-[var(--duration-micro)]"
                  >
                    Reset to default
                  </button>
                </div>

                <label className="mt-4 block text-sm">
                  <span className="text-ink-soft">Image path</span>
                  <input
                    value={src ?? ""}
                    placeholder={row.fallback.src ?? "/media/photography/…"}
                    onChange={(e) =>
                      patch(row.key, {
                        src: e.target.value.trim() === "" ? null : e.target.value,
                      })
                    }
                    className={`${field} font-mono text-xs`}
                  />
                </label>

                <label className="mt-4 block text-sm">
                  <span className="text-ink-soft">
                    Alt text — what the photograph shows
                  </span>
                  <textarea
                    value={shown(row, "alt")}
                    onChange={(e) => patch(row.key, { alt: e.target.value })}
                    rows={2}
                    maxLength={300}
                    className={field}
                  />
                </label>

                <div className="mt-4 grid gap-4 sm:grid-cols-3">
                  <label className="block text-sm">
                    <span className="text-ink-soft">Crop</span>
                    <select
                      value={
                        FOCAL_CHOICES.some((c) => c.value === shown(row, "focal"))
                          ? shown(row, "focal")
                          : "50% 50%"
                      }
                      onChange={(e) => patch(row.key, { focal: e.target.value })}
                      className={field}
                    >
                      {FOCAL_CHOICES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="block text-sm">
                    <span className="text-ink-soft">Proportions</span>
                    <input
                      value={slots[row.key]?.aspect ?? row.current.aspect}
                      onChange={(e) => patch(row.key, { aspect: e.target.value })}
                      className={`${field} font-mono text-xs`}
                    />
                  </label>

                  <label className="block text-sm">
                    <span className="text-ink-soft">Caption</span>
                    <input
                      value={shown(row, "caption")}
                      onChange={(e) => patch(row.key, { caption: e.target.value })}
                      maxLength={160}
                      className={field}
                    />
                  </label>
                </div>
              </div>
            </section>
          );
        })}
      </div>

      {error ? (
        <p
          role="alert"
          className="mt-8 rounded border border-alert/40 bg-alert-wash px-4 py-3 text-sm"
        >
          {error}
        </p>
      ) : null}

      <div className="mt-8 flex items-center gap-4 border-t border-line pt-6">
        <button
          type="submit"
          disabled={busy}
          className="rounded-[3px] bg-accent px-5 py-3 text-sm text-accent-on hover:bg-accent-deep disabled:opacity-60 transition-colors duration-[var(--duration-micro)]"
        >
          {busy ? "Saving…" : "Save photography"}
        </button>
        {saved ? (
          <span role="status" className="text-sm text-ok">
            Saved.
          </span>
        ) : null}
      </div>
    </form>
  );
}
