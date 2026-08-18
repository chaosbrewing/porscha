import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex-1 flex items-center justify-center px-5 py-24">
      <div className="text-center max-w-md">
        <p className="type-kicker text-ink-faint">404</p>
        <h1 className="type-display text-5xl mt-3">
          Not on this bench.
        </h1>
        <p className="mt-4 text-ink-soft leading-relaxed">
          Whatever was here has been filed somewhere else — or never existed.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 bg-accent text-accent-on px-5 py-3 text-sm rounded-[3px] hover:bg-accent-deep transition-colors duration-[var(--duration-micro)]"
        >
          Back to the cover
        </Link>
      </div>
    </div>
  );
}
