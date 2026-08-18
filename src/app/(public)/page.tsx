import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { Wordmark } from "@/components/public/editorial/Wordmark";
import { SocialLinks } from "@/components/public/editorial/SocialLinks";
import { SectionLabel } from "@/components/public/editorial/SectionLabel";
import { EditorialPhoto } from "@/components/public/editorial/EditorialPhoto";
import { getPublicProjects } from "@/server/projects/service";
import { getPublicGalleryView } from "@/server/gallery/service";
import { getLabExperiments, getNotes } from "@/server/content/loader";
import { roleLine, sectionNumber, siteConfig } from "@/config/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "POR$CHA — Founder, Artist, Builder",
  description:
    "POR$CHA — Founder, Artist, Builder. Art from the OBRA studio, apps by Chaos Origins, and the headquarters where both get built.",
  alternates: { canonical: "/" },
};

/* --------------------------- Contents entry -------------------------- */

/**
 * One of the three worlds, set as an editorial contents entry: numeral,
 * headline, standfirst, and a metadata line of real counts. Not a card
 * — the rule above it and the numeral beside it do the framing work.
 */
function WorldEntry({
  index,
  label,
  brand,
  href,
  headline,
  standfirst,
  meta,
  figure,
  flip = false,
}: {
  index: number;
  label: string;
  brand: string;
  href: string;
  headline: string;
  standfirst: string;
  meta: string[];
  figure?: React.ReactNode;
  /** Sets the figure on the left, so the spread alternates down the page. */
  flip?: boolean;
}) {
  return (
    <li className="border-t border-line pt-8 sm:pt-10">
      <div
        className={`grid gap-8 lg:gap-14 ${
          figure ? "lg:grid-cols-[minmax(0,1.15fr)_minmax(0,0.85fr)]" : ""
        }`}
      >
        <div className={flip ? "lg:order-2" : undefined}>
          <div className="flex items-baseline gap-5">
            <span className="type-numeral text-3xl text-accent">
              {sectionNumber(index)}
            </span>
            <span className="type-kicker text-ink-faint">{label}</span>
          </div>

          <h3 className="type-feature mt-5 text-[clamp(2.5rem,6vw,4.25rem)]">
            <Link
              href={href}
              className="transition-colors duration-[var(--duration-micro)] hover:text-accent-deep"
            >
              {headline}
            </Link>
          </h3>

          <p className="type-kicker mt-4 text-accent">{brand}</p>

          <p className="type-standfirst mt-5 max-w-lg">{standfirst}</p>

          <p className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1 type-caption">
            {meta.map((item, i) => (
              <span key={item} className="flex items-center gap-3">
                {i > 0 ? (
                  <span aria-hidden="true" className="text-ink-faint">
                    ·
                  </span>
                ) : null}
                {item}
              </span>
            ))}
          </p>

          <p className="mt-7">
            <Link
              href={href}
              className="group type-kicker inline-flex items-center gap-3 text-ink hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
            >
              Enter {label}
              <span
                aria-hidden="true"
                className="inline-block transition-transform duration-[var(--duration-micro)] group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </p>
        </div>

        {figure ? (
          <div className={flip ? "lg:order-1" : undefined}>{figure}</div>
        ) : null}
      </div>
    </li>
  );
}

/* ------------------------------- Page -------------------------------- */

export default async function HomePage() {
  const [{ projects }, gallery, notes, experiments] = await Promise.all([
    getPublicProjects(),
    getPublicGalleryView(),
    Promise.resolve(getNotes()),
    Promise.resolve(getLabExperiments()),
  ]);

  const apps = projects.filter((p) => p.isApp);
  const building =
    projects.find((p) => p.status === "building" && p.featured) ??
    projects.find((p) => p.status === "building");
  const signal = building
    ? `Currently building ${building.name}`
    : siteConfig.currently;

  // The ART entry leads with a real piece off the wall rather than a
  // stand-in: the first featured piece, falling back to the newest.
  const lead = gallery.pieces[0] ?? null;
  const categories = new Set(gallery.pieces.map((p) => p.category));

  return (
    <>
      {/* ---------------------------- Cover ---------------------------- */}
      <section className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,0.86fr)] lg:items-stretch">
        <div className="reveal px-5 pt-14 pb-12 sm:pl-[max(2.5rem,calc((100vw-88rem)/2+2.5rem))] sm:pr-10 lg:pt-24 lg:pb-20 lg:pr-16">
          <p className="type-kicker flex items-center gap-3 text-ink-faint">
            {siteConfig.domain}
            <span aria-hidden="true" className="rule-copper w-10" />
          </p>

          <Wordmark
            as="h1"
            className="mt-8 text-[clamp(3.6rem,13vw,8.5rem)]"
          />

          <p className="type-kicker mt-7 text-ink-soft">{roleLine("  •  ")}</p>

          <div className="mt-8 max-w-md">
            <span aria-hidden="true" className="rule block" />
            <p className="type-standfirst mt-6">
              An art practice, a software company, and the room where both get
              made. Nothing here is staged as finished.
            </p>
          </div>

          <SocialLinks className="mt-9" />

          <p className="mt-10 flex items-center gap-3">
            <span
              aria-hidden="true"
              className="inline-flex size-4 items-center justify-center rounded-full border border-accent/50"
            >
              <span className="size-1.5 rounded-full bg-accent pulse-live" />
            </span>
            <span className="type-kicker text-accent-deep">{signal}</span>
          </p>
        </div>

        {/* The cover portrait bleeds to the right page edge. */}
        <EditorialPhoto
          slot="home-cover"
          preload
          caption={false}
          fillParent
          sizes="(max-width: 1024px) 100vw, 46vw"
          className="reveal-late min-h-[70vh] lg:min-h-[42rem]"
        />
      </section>

      {/* --------------------------- Contents -------------------------- */}
      <section
        aria-labelledby="contents-heading"
        className="mx-auto mt-20 max-w-[88rem] px-5 sm:px-10 lg:mt-28"
      >
        <SectionLabel
          label="Contents"
          aside="Three worlds"
          className="mb-10 lg:mb-14"
        />
        <h2 id="contents-heading" className="sr-only">
          The three worlds
        </h2>

        <ol className="space-y-16 lg:space-y-24">
          <WorldEntry
            index={1}
            label="Art"
            brand="OBRA by Porscha"
            href="/art"
            headline="Work made by hand, one of one."
            standfirst="Originals, studies and sketches from the OBRA studio. Each piece is sold once, if it is sold at all — the wall is not a catalogue."
            meta={[
              `${gallery.pieces.length} ${gallery.pieces.length === 1 ? "piece" : "pieces"} on the wall`,
              `${categories.size} ${categories.size === 1 ? "category" : "categories"}`,
            ]}
            figure={
              lead ? (
                <Link href={`/art/${lead.slug}`} className="group block">
                  <figure>
                    <div
                      className="photo"
                      style={{
                        aspectRatio: lead.aspect.replace("/", " / "),
                      }}
                    >
                      <Image
                        src={lead.media}
                        alt={lead.alt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 38vw"
                      />
                    </div>
                    <figcaption className="type-caption mt-3 flex items-center gap-3">
                      <span
                        aria-hidden="true"
                        className="rule-copper w-6 shrink-0"
                      />
                      {lead.title} · {lead.year}
                    </figcaption>
                  </figure>
                </Link>
              ) : null
            }
          />

          <WorldEntry
            index={2}
            label="Apps"
            brand="Apps by Chaos Origins"
            href="/apps"
            headline="Small software, built with a temper."
            standfirst="Chaos Origins makes tools for people, not funnels: capture that remembers where you were, reflection that isn't a quarterly report, a habit companion that forgives you."
            meta={
              apps.length > 0
                ? [
                    `${apps.length} ${apps.length === 1 ? "product" : "products"}`,
                    apps
                      .slice(0, 3)
                      .map((app) => app.name)
                      .join(" · "),
                  ]
                : ["In development"]
            }
            flip
            figure={
              <EditorialPhoto
                slot="apps-opening"
                sizes="(max-width: 1024px) 100vw, 38vw"
              />
            }
          />

          <WorldEntry
            index={3}
            label="Headquarters"
            brand="The operating layer"
            href="/headquarters"
            headline="The room the work is made in."
            standfirst="Current focus, builds in progress, notes and experiments — the working state of everything above, kept public on purpose."
            meta={[
              `${projects.length} ${projects.length === 1 ? "project" : "projects"}`,
              `${notes.length} ${notes.length === 1 ? "note" : "notes"}`,
              `${experiments.length} ${experiments.length === 1 ? "experiment" : "experiments"}`,
            ]}
          />
        </ol>
      </section>

      {/* --------------------------- Closing --------------------------- */}
      <section className="mx-auto mt-24 max-w-[88rem] px-5 sm:px-10 lg:mt-32">
        <EditorialPhoto
          slot="home-wide"
          mono
          sizes="(max-width: 1024px) 100vw, 88rem"
        />

        <div className="mt-10 flex flex-wrap items-end justify-between gap-6 border-t border-line pt-6">
          <p className="type-heading max-w-lg text-2xl">
            Built in the open, published when it&rsquo;s honest.
          </p>
          {/* The workshop door. Unlabelled on purpose: curiosity is what
              opens it, and the console is not advertised. */}
          <Link
            href="/login"
            aria-label="Owner sign-in"
            title="Owner sign-in"
            className="inline-flex h-11 w-11 items-center justify-center text-ink-faint hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
          >
            <svg
              aria-hidden="true"
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="6.5" />
              <path d="m15.8 15.8 4.7 4.7M11 8v3.5M11 14.6v.1" />
            </svg>
          </Link>
        </div>
      </section>
    </>
  );
}
