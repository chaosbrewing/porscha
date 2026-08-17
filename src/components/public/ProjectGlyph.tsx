import Image from "next/image";

/**
 * Small identity tiles for workbench rows.
 *
 * The default is a hand-drawn geometric glyph — a quiet mark, not a
 * logo. A project that has had a logo uploaded through the console
 * shows that instead, on the same tile, at the same size.
 */

const STROKE = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinejoin: "round" as const,
  strokeLinecap: "round" as const,
};

function GlyphSvg({ slug }: { slug: string }) {
  switch (slug) {
    case "kubli":
      // wireframe cube — a stashed box
      return (
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
          <path d="M12 3.5 20 8v8l-8 4.5L4 16V8l8-4.5Z" />
          <path d="M12 3.5V12m0 0 8-4M12 12 4 8m8 4v8.5" />
        </svg>
      );
    case "prism":
      // prism splitting a ray
      return (
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
          <path d="M12 4 20.5 19h-17L12 4Z" />
          <path d="M2.5 12h5M16 13.5l5.5-2M16.5 15.5l5 2.5" />
        </svg>
      );
    case "habi":
      // small sprout — the gentle return
      return (
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
          <path d="M12 20v-8" />
          <path d="M12 12c0-3.5 2.5-6 6-6 0 3.5-2.5 6-6 6Z" />
          <path d="M12 15c0-2.6-1.9-4.5-4.5-4.5 0 2.6 1.9 4.5 4.5 4.5Z" />
        </svg>
      );
    default:
      return (
        <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" {...STROKE}>
          <circle cx="12" cy="12" r="7" />
        </svg>
      );
  }
}

const TILE_TONE: Record<string, string> = {
  kubli: "bg-[#3b2420] text-[#e8b48f]",
  prism: "bg-ink-well text-ink-inverse",
  habi: "bg-paper-sunken text-ink-soft border border-line-strong",
};

export function ProjectGlyph({
  slug,
  logo,
}: {
  slug: string;
  logo?: string | null;
}) {
  if (logo) {
    return (
      <span className="inline-flex size-12 shrink-0 overflow-hidden rounded-[6px] border border-line bg-paper-raised">
        <Image
          src={logo}
          // The project name sits beside the tile, so the mark adds
          // nothing for a screen reader.
          alt=""
          width={48}
          height={48}
          className="h-full w-full object-cover"
        />
      </span>
    );
  }

  const tone = TILE_TONE[slug] ?? "bg-paper-sunken text-ink-soft border border-line-strong";
  return (
    <span
      aria-hidden="true"
      className={`inline-flex size-12 shrink-0 items-center justify-center rounded-[6px] ${tone}`}
    >
      <GlyphSvg slug={slug} />
    </span>
  );
}
