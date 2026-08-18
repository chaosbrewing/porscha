import { siteConfig } from "@/config/site";

/**
 * The masthead: POR$CHA, with the dollar sign struck in copper.
 *
 * The name is written the way it is set — the `$` is part of the
 * identity, not a decoration, so it stays in the text content and is
 * only coloured. Screen readers get an accessible name that reads as
 * the word rather than as currency.
 */
export function Wordmark({
  className = "",
  as: Tag = "span",
}: {
  className?: string;
  as?: "span" | "h1" | "h2" | "p";
}) {
  return (
    <Tag
      className={`type-masthead inline-block ${className}`}
      aria-label={siteConfig.name}
    >
      <span aria-hidden="true">
        POR<span className="text-accent">$</span>CHA
      </span>
    </Tag>
  );
}
