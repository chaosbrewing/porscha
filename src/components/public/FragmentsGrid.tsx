"use client";

import Image from "next/image";
import { useState } from "react";
import type { Fragment } from "@/content/site/schema";
import { Annotation } from "./Annotation";

/**
 * Fragments: small cards in a loose grid, with a row of filters when
 * the fragments carry tags. "All" is always first; the rest follow in
 * the order the tags first appear. Without tags there is no row.
 */

const SPAN: Record<"small" | "wide" | "tall", string> = {
  small: "",
  wide: "sm:col-span-2",
  tall: "sm:row-span-2",
};

function FragmentCard({ fragment }: { fragment: Fragment }) {
  const span = SPAN[fragment.size];

  if (fragment.kind === "image") {
    return (
      <li className={`reveal-view ${span}`}>
        <figure className="relative h-full min-h-[11rem] overflow-hidden rounded-[3px] bg-ink-well sm:min-h-[12rem]">
          <Image
            src={fragment.image.src}
            alt={fragment.image.alt}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
          />
          {fragment.caption ? (
            <>
              <span
                aria-hidden="true"
                className="absolute inset-0 bg-gradient-to-t from-ink-well/80 via-ink-well/20 to-transparent"
              />
              <figcaption className="type-heading absolute inset-x-0 bottom-0 p-4 text-[1.125rem] leading-snug text-ink-inverse sm:p-5">
                {fragment.caption}
              </figcaption>
            </>
          ) : null}
        </figure>
      </li>
    );
  }

  const annotation = fragment.tone === "annotation";
  return (
    <li
      className={`reveal-view flex min-h-[9rem] items-end rounded-[3px] border border-line bg-paper-raised p-4 sm:min-h-[11rem] sm:p-5 ${span}`}
    >
      {annotation ? (
        <Annotation mark>{fragment.text}</Annotation>
      ) : (
        <p className="type-heading text-[1.125rem] leading-snug sm:text-[1.25rem]">
          {fragment.text}
        </p>
      )}
    </li>
  );
}

export function FragmentsGrid({ items }: { items: Fragment[] }) {
  const tags = items.map((f) => f.tag).filter((t, i, all) => t && all.indexOf(t) === i);
  const [active, setActive] = useState("All");
  const shown = active === "All" ? items : items.filter((f) => f.tag === active);

  return (
    <div>
      {tags.length > 0 ? (
        <div role="group" aria-label="Show fragments" className="mt-8 flex flex-wrap gap-2">
          {["All", ...tags].map((tag) => {
            const on = tag === active;
            return (
              <button
                key={tag}
                type="button"
                aria-pressed={on}
                onClick={() => setActive(tag)}
                className={`chip ${on ? "chip-on" : ""}`}
              >
                {tag}
              </button>
            );
          })}
        </div>
      ) : null}

      <ul className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        {shown.map((fragment, index) => (
          <FragmentCard key={`${active}-${index}`} fragment={fragment} />
        ))}
      </ul>
      {shown.length === 0 ? (
        <p className="mt-8 text-sm text-ink-faint">Nothing under that one yet.</p>
      ) : null}
    </div>
  );
}
