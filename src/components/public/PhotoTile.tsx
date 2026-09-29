import Image from "next/image";
import Link from "next/link";
import type { SiteImage } from "@/content/site/schema";

/**
 * A door: a photograph with a label over its lower-left corner and an
 * arrow. The whole tile is the link. Without a picture it falls back
 * to a dark, quiet surface so the row still reads as a row.
 *
 * Two layouts: "door" (label above its arrow, for the home grid) and
 * "banner" (title and a line on the left, arrow on the right, for the
 * wide windows on /work).
 */
export function PhotoTile({
  href,
  label,
  description,
  image,
  layout = "door",
  sizes,
  priority = false,
  className = "",
}: {
  href: string;
  label: string;
  description?: string;
  image: SiteImage | null;
  layout?: "door" | "banner";
  sizes: string;
  priority?: boolean;
  className?: string;
}) {
  const external = !href.startsWith("/");
  const classes = `group relative block overflow-hidden rounded-[3px] bg-ink-well text-ink-inverse ${className}`;

  const picture = image ? (
    <Image
      src={image.src}
      alt=""
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover transition-transform duration-[var(--duration-reveal)] ease-[var(--ease-out-soft)] group-hover:scale-[1.03] motion-reduce:transform-none"
    />
  ) : (
    <span
      aria-hidden="true"
      className="absolute inset-0 bg-[radial-gradient(120%_80%_at_20%_0%,#3a352c_0%,#1f1d18_60%)]"
    />
  );

  const shade = (
    <span
      aria-hidden="true"
      className="absolute inset-0 bg-gradient-to-t from-ink-well/85 via-ink-well/30 to-ink-well/10 transition-opacity duration-[var(--duration-normal)] group-hover:opacity-90"
    />
  );

  const content =
    layout === "door" ? (
      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-2 p-4 sm:p-5">
        <span className="type-heading text-[1.25rem] leading-tight sm:text-[1.5rem]">
          {label}
        </span>
        <span aria-hidden="true" className="tile-arrow text-lg">
          →
        </span>
      </span>
    ) : (
      <span className="absolute inset-0 flex items-end justify-between gap-6 p-5 sm:items-center sm:p-8 lg:px-10">
        <span className="min-w-0">
          <span className="type-heading block text-[1.5rem] leading-tight sm:text-[1.875rem]">
            {label}
          </span>
          {description ? (
            <span className="mt-1.5 block max-w-[30rem] text-sm leading-relaxed text-ink-inverse-soft sm:text-[0.9375rem]">
              {description}
            </span>
          ) : null}
        </span>
        <span aria-hidden="true" className="tile-arrow shrink-0 text-2xl">
          →
        </span>
      </span>
    );

  const inner = (
    <>
      {picture}
      {shade}
      {content}
    </>
  );

  if (external) {
    return (
      <a href={href} rel="noopener" className={classes}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {inner}
    </Link>
  );
}
