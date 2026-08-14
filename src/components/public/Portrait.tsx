import fs from "node:fs";
import path from "node:path";
import Image from "next/image";

/**
 * The hero portrait. Renders Porscha's editorial portrait from
 * `public/portrait/porscha.{jpg,png,webp}` (see the README in that
 * folder). Until the asset exists, an intentional placeholder
 * composition holds the slot — never a stock photo, avatar, or
 * generated person.
 */

const CANDIDATES = ["porscha.jpg", "porscha.png", "porscha.webp"];

function findPortrait(): string | null {
  for (const file of CANDIDATES) {
    if (fs.existsSync(path.join(process.cwd(), "public", "portrait", file))) {
      return `/portrait/${file}`;
    }
  }
  return null;
}

export function Portrait({ className = "" }: { className?: string }) {
  const src = findPortrait();

  if (src) {
    return (
      <figure className={`relative ${className}`}>
        <Image
          src={src}
          alt="Porscha in her workshop"
          width={1600}
          height={2000}
          priority
          sizes="(max-width: 768px) 100vw, 45vw"
          className="w-full h-auto aspect-[4/5] object-cover object-top rounded-[4px]"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-[4px] ring-1 ring-inset ring-ink/10"
        />
      </figure>
    );
  }

  // Intentional placeholder: a quiet workbench still-life in the house
  // palette, clearly a held slot rather than a substitute person.
  return (
    <figure className={`relative ${className}`}>
      <div className="aspect-[4/5] w-full rounded-[4px] border border-line-strong bg-paper-sunken overflow-hidden relative">
        <svg
          aria-hidden="true"
          viewBox="0 0 400 500"
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="xMidYMid slice"
        >
          <rect width="400" height="500" fill="var(--color-paper-sunken)" />
          <rect x="0" y="360" width="400" height="140" fill="var(--color-line)" opacity="0.55" />
          <rect x="48" y="330" width="130" height="8" rx="2" fill="var(--color-line-strong)" />
          <rect x="60" y="300" width="70" height="30" rx="3" fill="var(--color-ink-well)" opacity="0.85" />
          <circle cx="290" cy="250" r="58" fill="none" stroke="var(--color-line-strong)" strokeWidth="2" />
          <path d="M60 180 C 140 150, 240 210, 344 168" stroke="var(--color-accent)" strokeWidth="4" fill="none" strokeLinecap="round" />
          <rect x="230" y="330" width="110" height="38" rx="3" fill="none" stroke="var(--color-line-strong)" strokeWidth="2" />
        </svg>
        <figcaption className="absolute bottom-4 left-4 right-4">
          <span className="type-meta text-ink-faint">
            Portrait — reserved for Porscha
          </span>
        </figcaption>
      </div>
    </figure>
  );
}
