"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { normalizeCategory, SUGGESTED_CATEGORIES } from "@/config/gallery";

/**
 * Create/edit form for a console-authored gallery piece.
 *
 * The image is uploaded, never typed: the upload returns both the
 * path it wrote and the aspect ratio it read out of the file's own
 * header, so neither is a question worth asking. Alt text is derived
 * server-side from the title — the field is gone, the attribute is
 * not.
 *
 * Uploading needs the R2 binding, which only exists in the Workers
 * runtime; where it is absent the endpoint says so plainly.
 */

export type PieceFormValue = {
  slug: string;
  title: string;
  category: string;
  year: string;
  media: string;
  aspect: string;
  note: string;
  body: string;
  forSale: boolean;
  price: string;
  currency: string;
};

export const emptyPieceDraft: PieceFormValue = {
  slug: "",
  title: "",
  category: "digital",
  year: String(new Date().getFullYear()),
  media: "",
  aspect: "4/5",
  note: "",
  body: "",
  forSale: false,
  price: "",
  currency: "",
};

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function GalleryPieceForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial: PieceFormValue;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  // Only auto-derive the slug until the user takes it over.
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  function patch(next: Partial<PieceFormValue>) {
    setValue((v) => ({ ...v, ...next }));
  }

  function onTitle(title: string) {
    patch(slugTouched ? { title } : { title, slug: slugify(title) });
  }

  async function upload(file: File) {
    if (!value.slug) {
      setError("Give the piece a title or slug before uploading.");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("slug", value.slug);
      const res = await fetch("/api/console/admin/gallery/media", {
        method: "POST",
        body,
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "The upload failed.");
        return;
      }
      patch({ media: json.media, aspect: json.aspect ?? value.aspect });
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const url =
        mode === "create"
          ? "/api/console/admin/gallery/pieces"
          : `/api/console/admin/gallery/pieces/${initial.slug}`;
      const payload =
        mode === "create" ? value : (({ slug: _slug, ...rest }) => rest)(value);

      const res = await fetch(url, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "Saving failed.");
        return;
      }
      router.push("/console/settings/gallery");
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  const field =
    "mt-1.5 w-full rounded-[3px] border border-line-strong bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";
  const valid = value.title && value.slug && value.category && value.media;

  return (
    <form onSubmit={save} className="grid gap-10 lg:grid-cols-[1fr_300px]">
      <div className="max-w-xl">
        <label className="block text-sm">
          <span className="text-ink-soft">Title</span>
          <input
            value={value.title}
            onChange={(e) => onTitle(e.target.value)}
            maxLength={120}
            required
            className={field}
          />
        </label>

        <label className="mt-4 block text-sm">
          <span className="text-ink-soft">Slug</span>
          <input
            value={value.slug}
            onChange={(e) => {
              setSlugTouched(true);
              patch({ slug: e.target.value });
            }}
            disabled={mode === "edit"}
            maxLength={80}
            required
            className={`${field} disabled:opacity-60`}
          />
          <span className="mt-1 block text-xs text-ink-faint">
            {mode === "edit"
              ? "The slug is the piece's address; it doesn't change."
              : "Lowercase words separated by hyphens."}
          </span>
        </label>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-ink-soft">Category</span>
            <input
              value={value.category}
              onChange={(e) => patch({ category: e.target.value })}
              onBlur={(e) => patch({ category: normalizeCategory(e.target.value) })}
              list="gallery-category-suggestions"
              placeholder="digital"
              maxLength={40}
              required
              className={field}
            />
            {/* Suggestions, not a vocabulary — anything typed becomes a
                category the moment a piece uses it. */}
            <datalist id="gallery-category-suggestions">
              {SUGGESTED_CATEGORIES.map((c) => (
                <option key={c} value={c} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm">
            <span className="text-ink-soft">Year</span>
            <input
              value={value.year}
              onChange={(e) => patch({ year: e.target.value })}
              inputMode="numeric"
              maxLength={4}
              className={field}
            />
          </label>
        </div>

        <div className="mt-6">
          <span className="block text-sm text-ink-soft">Image</span>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <input
              ref={fileInput}
              type="file"
              accept="image/png,image/svg+xml,image/jpeg,image/webp"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
              }}
              className="hidden"
              id="gallery-media-upload"
            />
            <label
              htmlFor="gallery-media-upload"
              className="cursor-pointer rounded-[3px] border border-line-strong px-4 py-2 text-sm hover:border-ink transition-colors duration-[var(--duration-micro)]"
            >
              {uploading
                ? "Uploading…"
                : value.media
                  ? "Replace image"
                  : "Upload image"}
            </label>
            <span className="text-xs text-ink-faint">
              PNG, SVG, JPG, or WebP.
            </span>
          </div>
          {value.media ? (
            <p className="mt-2 text-xs text-ink-faint">
              Uploaded · shape read as {value.aspect || "4/5"}
            </p>
          ) : null}
        </div>

        <label className="mt-6 block text-sm">
          <span className="text-ink-soft">Note</span>
          <input
            value={value.note}
            onChange={(e) => patch({ note: e.target.value })}
            maxLength={300}
            className={field}
          />
        </label>

        <fieldset className="mt-8 border-t border-line pt-6">
          <legend className="type-meta text-ink-faint">Selling</legend>
          <label className="mt-3 flex items-start gap-3 text-sm">
            <input
              type="checkbox"
              checked={value.forSale}
              onChange={(e) => patch({ forSale: e.target.checked })}
              className="mt-0.5"
            />
            <span>
              Offer this original for sale
              <span className="block text-ink-faint">
                One-off: it sells once, then shows as sold.
              </span>
            </span>
          </label>

          {value.forSale ? (
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="text-ink-soft">Price</span>
                <input
                  value={value.price}
                  onChange={(e) => patch({ price: e.target.value })}
                  placeholder="850"
                  inputMode="decimal"
                  className={field}
                />
              </label>
              <label className="block text-sm">
                <span className="text-ink-soft">Currency</span>
                <input
                  value={value.currency}
                  onChange={(e) =>
                    patch({ currency: e.target.value.toUpperCase() })
                  }
                  placeholder="AUD"
                  maxLength={3}
                  className={field}
                />
              </label>
            </div>
          ) : null}
        </fieldset>

        <label className="mt-4 block text-sm">
          <span className="text-ink-soft">Body (Markdown)</span>
          <textarea
            value={value.body}
            onChange={(e) => patch({ body: e.target.value })}
            rows={6}
            maxLength={8000}
            className={field}
          />
        </label>

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
            disabled={busy || !valid}
            className="rounded-[4px] bg-accent px-5 py-2.5 text-sm font-medium text-ink-inverse hover:bg-accent-deep disabled:opacity-50 transition-colors duration-[var(--duration-micro)]"
          >
            {busy ? "Saving…" : mode === "create" ? "Add piece" : "Save piece"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/console/settings/gallery")}
            className="text-sm text-ink-soft hover:text-ink"
          >
            Cancel
          </button>
        </div>
      </div>

      <aside>
        <h2 className="type-meta text-ink-faint">Preview</h2>
        <div
          className="mt-3 overflow-hidden rounded-[4px] border border-line bg-paper-raised"
          style={{ aspectRatio: value.aspect.replace("/", " / ") }}
        >
          {value.media ? (
            <Image
              src={value.media}
              alt={value.title}
              width={600}
              height={750}
              className="h-full w-full object-cover"
            />
          ) : null}
        </div>
        <p className="mt-3 type-heading text-base">{value.title || "Untitled"}</p>
        <p className="type-meta text-ink-faint">
          {value.category} · {value.year}
        </p>
      </aside>
    </form>
  );
}
