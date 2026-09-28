"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";
import type { FieldSpec } from "./fields";
import { appendAt, getAt, joinPath, moveAt, removeAt, setAt } from "./paths";

/**
 * Renders one field spec against the page document. Everything edits
 * the document by path, so nested lists and sections just recurse
 * with a longer base path.
 */

const input =
  "mt-1.5 w-full rounded-[3px] border border-line-strong bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none";
const small = "mt-1 block text-xs text-ink-faint";
const button =
  "rounded-[3px] border border-line-strong px-3 py-1.5 text-xs text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)] disabled:opacity-40";

export type Doc = Record<string, unknown>;

type Props = {
  spec: FieldSpec;
  doc: Doc;
  base: string;
  onChange: (next: Doc) => void;
  /** Slug for uploads; keeps the bucket legible. */
  uploadSlug: string;
};

function visible(spec: FieldSpec, doc: Doc, base: string): boolean {
  if (!("showIf" in spec) || !spec.showIf) return true;
  return getAt(doc, joinPath(base, spec.showIf.path)) === spec.showIf.equals;
}

export function FieldRenderer({ spec, doc, base, onChange, uploadSlug }: Props) {
  if (!visible(spec, doc, base)) return null;

  if (spec.kind === "section") {
    return (
      <fieldset className="border-t border-line pt-6">
        <legend className="type-meta text-ink-faint">{spec.label}</legend>
        {spec.help ? <p className="mt-2 text-xs text-ink-faint">{spec.help}</p> : null}
        <div className="mt-4 space-y-5">
          {spec.fields.map((f, i) => (
            <FieldRenderer key={i} spec={f} doc={doc} base={base} onChange={onChange} uploadSlug={uploadSlug} />
          ))}
        </div>
      </fieldset>
    );
  }

  const path = joinPath(base, spec.path);
  const value = getAt(doc, path);

  switch (spec.kind) {
    case "text":
      return (
        <label className="block text-sm">
          <span className="text-ink-soft">{spec.label}</span>
          <input
            value={typeof value === "string" ? value : ""}
            maxLength={spec.maxLength}
            onChange={(e) => onChange(setAt(doc, path, e.target.value))}
            className={input}
          />
          {spec.help ? <span className={small}>{spec.help}</span> : null}
        </label>
      );

    case "textarea":
      return (
        <label className="block text-sm">
          <span className="text-ink-soft">{spec.label}</span>
          <textarea
            value={typeof value === "string" ? value : ""}
            rows={spec.rows ?? 3}
            onChange={(e) => onChange(setAt(doc, path, e.target.value))}
            className={input}
          />
          {spec.help ? <span className={small}>{spec.help}</span> : null}
        </label>
      );

    case "lines": {
      const lines = Array.isArray(value) ? (value as string[]) : [];
      return (
        <label className="block text-sm">
          <span className="text-ink-soft">{spec.label}</span>
          <textarea
            value={lines.join("\n")}
            rows={spec.rows ?? 4}
            onChange={(e) => onChange(setAt(doc, path, e.target.value.split("\n")))}
            className={input}
          />
          <span className={small}>{spec.help ?? "One per row."}</span>
        </label>
      );
    }

    case "select":
      return (
        <label className="block text-sm">
          <span className="text-ink-soft">{spec.label}</span>
          <select
            value={typeof value === "string" ? value : spec.options[0]?.value}
            onChange={(e) => onChange(setAt(doc, path, e.target.value))}
            className={input}
          >
            {spec.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {spec.help ? <span className={small}>{spec.help}</span> : null}
        </label>
      );

    case "image":
      return (
        <ImageField
          label={spec.label}
          help={spec.help}
          value={(value ?? { src: "", alt: "", width: 0, height: 0 }) as ImageValue}
          onChange={(next) => onChange(setAt(doc, path, next))}
          uploadSlug={uploadSlug}
        />
      );

    case "list": {
      const items = Array.isArray(value) ? (value as unknown[]) : [];
      return (
        <div className="text-sm">
          <div className="flex items-baseline justify-between gap-4">
            <span className="text-ink-soft">{spec.label}</span>
            <span className="text-xs text-ink-faint">{items.length}</span>
          </div>
          {spec.help ? <p className={small}>{spec.help}</p> : null}
          <ol className="mt-2 space-y-3">
            {items.map((item, i) => {
              const itemPath = joinPath(path, i);
              const title =
                spec.titleField && typeof getAt(item, spec.titleField) === "string"
                  ? (getAt(item, spec.titleField) as string)
                  : "";
              return (
                <li key={i} className="rounded-[3px] border border-line bg-paper-raised p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="type-meta text-ink-faint">
                      {spec.itemLabel} {i + 1}
                      {title ? <span className="ml-2 normal-case tracking-normal text-ink-soft">· {title.slice(0, 40)}</span> : null}
                    </span>
                    <span className="flex gap-1.5">
                      <button type="button" className={button} disabled={i === 0} onClick={() => onChange(moveAt(doc, path, i, i - 1))} aria-label={`Move ${spec.itemLabel} ${i + 1} up`}>
                        ↑
                      </button>
                      <button type="button" className={button} disabled={i === items.length - 1} onClick={() => onChange(moveAt(doc, path, i, i + 1))} aria-label={`Move ${spec.itemLabel} ${i + 1} down`}>
                        ↓
                      </button>
                      <button type="button" className={`${button} text-alert hover:text-alert`} onClick={() => onChange(removeAt(doc, path, i))} aria-label={`Remove ${spec.itemLabel} ${i + 1}`}>
                        Remove
                      </button>
                    </span>
                  </div>
                  <div className="mt-3 space-y-4">
                    {spec.fields.map((f, j) => (
                      <FieldRenderer key={j} spec={f} doc={doc} base={itemPath} onChange={onChange} uploadSlug={uploadSlug} />
                    ))}
                  </div>
                </li>
              );
            })}
          </ol>
          <button
            type="button"
            className={`${button} mt-3`}
            onClick={() => onChange(appendAt(doc, path, structuredClone(spec.blank)))}
          >
            Add {spec.itemLabel}
          </button>
        </div>
      );
    }
  }
}

/* ------------------------------ Images ---------------------------- */

type ImageValue = { src: string; alt: string; width: number; height: number };

function ImageField({
  label,
  help,
  value,
  onChange,
  uploadSlug,
}: {
  label: string;
  help?: string;
  value: ImageValue;
  onChange: (next: ImageValue) => void;
  uploadSlug: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const id = `img-${useId()}`;

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("slug", uploadSlug);
      const res = await fetch("/api/console/admin/site/media", { method: "POST", body });
      const json = await res.json();
      if (!res.ok) {
        setError(json.error ?? "The upload failed.");
        return;
      }
      onChange({
        src: json.media,
        alt: value.alt,
        width: json.width ?? value.width ?? 1,
        height: json.height ?? value.height ?? 1,
      });
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="text-sm">
      <span className="text-ink-soft">{label}</span>
      <div className="mt-2 flex flex-wrap items-start gap-4">
        <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-[3px] border border-line bg-paper-sunken">
          {value.src ? (
            <Image src={value.src} alt="" fill sizes="96px" className="object-cover" unoptimized={value.src.endsWith(".svg")} />
          ) : null}
        </div>
        <div className="min-w-0 flex-1">
          <input
            ref={fileInput}
            id={id}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) upload(f);
            }}
          />
          <label htmlFor={id} className={`${button} inline-block cursor-pointer`}>
            {uploading ? "Uploading…" : value.src ? "Replace image" : "Upload image"}
          </label>
          <p className="mt-1.5 truncate text-xs text-ink-faint" title={value.src}>
            {value.src || "No image yet"}
            {value.width && value.height ? ` · ${value.width}×${value.height}` : ""}
          </p>
          <label className="mt-3 block">
            <span className="text-ink-soft">Description for screen readers</span>
            <input
              value={value.alt}
              maxLength={300}
              placeholder="Leave blank if the picture is decorative"
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              className={input}
            />
          </label>
          {help ? <p className={small}>{help}</p> : null}
          {error ? <p role="alert" className="mt-2 text-xs text-alert">{error}</p> : null}
        </div>
      </div>
    </div>
  );
}
