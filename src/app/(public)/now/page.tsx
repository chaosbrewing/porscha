import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/public/Container";
import { Doodle } from "@/components/public/Doodle";
import { getSiteContent } from "@/server/site/service";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { now, global } = await getSiteContent();
  return {
    title: now.heading.replace(/\.$/, ""),
    description: `What ${global.name} is building, exploring, making and thinking about — updated ${now.updated}.`,
    alternates: { canonical: "/now" },
  };
}

/**
 * The living snapshot: one quiet picture on the left, the rows on the
 * right. Without a picture the rows take the width.
 */
export default async function NowPage() {
  const { now: currently } = await getSiteContent();
  const rows = [
    ...currently.entries,
    { label: "Updated", value: currently.updated, href: "", muted: true },
  ];

  return (
    <Container className="pb-20 pt-8 sm:pt-12 lg:pb-32">
      <div
        className={`grid gap-y-10 ${
          currently.visual
            ? "lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-x-16"
            : "max-w-3xl"
        }`}
      >
        {currently.visual ? (
          <figure className="reveal relative mx-auto w-full max-w-[24rem] overflow-hidden rounded-[3px] bg-paper-sunken lg:sticky lg:top-8 lg:mx-0 lg:max-w-none lg:self-start">
            <div className="relative aspect-[4/5]">
              <Image
                src={currently.visual.src}
                alt={currently.visual.alt}
                fill
                priority
                sizes="(max-width: 1024px) 384px, 40vw"
                className="object-cover"
              />
            </div>
          </figure>
        ) : null}

        <div>
          <header className="reveal">
            <h1 className="type-display text-[clamp(2.5rem,6.5vw,4.5rem)]">{currently.heading}</h1>
          </header>

          <dl
            className="reveal mt-8 border-t border-line lg:mt-10"
            style={{ ["--reveal-step" as string]: 1 }}
          >
            {rows.map((entry, i) => (
              <div
                key={i}
                className="grid gap-y-1 border-b border-line py-4 sm:grid-cols-[9rem_minmax(0,1fr)] sm:gap-x-8 sm:py-5"
              >
                <dt className="type-meta pt-1 text-ink-faint">{entry.label}</dt>
                <dd
                  className={`type-heading text-[1.125rem] sm:text-[1.25rem] ${
                    "muted" in entry && entry.muted ? "text-ink-soft" : ""
                  }`}
                >
                  {entry.href ? (
                    <Link
                      href={entry.href}
                      className="inline-block py-0.5 underline decoration-line-strong decoration-1 underline-offset-[5px] transition-colors duration-[var(--duration-micro)] hover:text-accent-deep hover:decoration-accent"
                    >
                      {entry.value}
                    </Link>
                  ) : (
                    entry.value
                  )}
                </dd>
              </div>
            ))}
          </dl>

          {currently.annotation ? (
            <p
              className="reveal type-annotation mt-8 flex items-start justify-end gap-2 text-[1.125rem] sm:text-[1.25rem]"
              style={{ ["--reveal-step" as string]: 2 }}
            >
              <Doodle direction="left" className="mt-1 shrink-0" />
              <span className="-rotate-2">{currently.annotation}</span>
            </p>
          ) : null}
        </div>
      </div>
    </Container>
  );
}
