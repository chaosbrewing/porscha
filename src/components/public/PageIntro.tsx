import type { ReactNode } from "react";
import { Eyebrow } from "./Eyebrow";

/**
 * The standard page opening: optional eyebrow, an oversized heading,
 * and a one-line introduction held to a readable measure.
 */
export function PageIntro({
  eyebrow,
  heading,
  intro,
  children,
}: {
  eyebrow?: string;
  heading: ReactNode;
  intro?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <header className="reveal">
      {eyebrow ? <Eyebrow className="mb-5">{eyebrow}</Eyebrow> : null}
      <h1 className="type-display text-[clamp(2.75rem,8vw,5.5rem)]">{heading}</h1>
      {intro ? (
        <p className="mt-6 max-w-[34rem] text-[1.0625rem] leading-relaxed text-ink-soft sm:text-lg">
          {intro}
        </p>
      ) : null}
      {children}
    </header>
  );
}
