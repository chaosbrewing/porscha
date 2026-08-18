import type { Metadata } from "next";
import Link from "next/link";
import type { PublicProjectView } from "@/types/core";
import { StatusMark } from "@/components/shared/StatusMark";
import { ProjectGlyph } from "@/components/public/ProjectGlyph";
import { EmptyState } from "@/components/shared/EmptyState";
import { SectionLabel } from "@/components/public/editorial/SectionLabel";
import { EditorialPhoto } from "@/components/public/editorial/EditorialPhoto";
import { getPublicProjects } from "@/server/projects/service";
import { getLabExperiments, getNotes } from "@/server/content/loader";
import { projectRegistry } from "@/config/registry";
import { sectionNumber, siteConfig } from "@/config/site";
import { formatDate, timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Headquarters",
  description:
    "The operating layer of porscha.today — current focus, builds in progress, notes, and experiments, kept public on purpose.",
  alternates: { canonical: "/headquarters" },
};

/**
 * HEADQUARTERS — the working studio, published.
 *
 * This is the site as it was before the ART/APPS split, given an
 * editorial front door: current focus, what is on the bench, what has
 * been written down, and what is being tried. The rooms themselves —
 * workshop, notes, lab — are unchanged and linked from here; the
 * private console is behind the same door it always was.
 */

/** One project on the bench: an editorial row, not a card. */
function BenchRow({ project }: { project: PublicProjectView }) {
  const percent = project.progress?.percent ?? null;

  return (
    <article className="grid gap-x-8 gap-y-4 border-t border-line py-7 lg:grid-cols-[minmax(0,2.2fr)_minmax(0,0.8fr)_minmax(0,1.2fr)_minmax(0,0.9fr)] lg:items-baseline">
      <div className="flex items-start gap-4">
        <ProjectGlyph slug={project.slug} logo={project.logoPath} />
        <div className="min-w-0">
          <h3 className="type-heading text-xl">
            <Link
              href={`/workshop/${project.slug}`}
              className="transition-colors duration-[var(--duration-micro)] hover:text-accent-deep"
            >
              {project.name}
            </Link>
          </h3>
          <p className="type-caption mt-1.5 max-w-md">{project.description}</p>
        </div>
      </div>

      <div>
        <p className="type-kicker text-ink-faint">Status</p>
        <div className="mt-1.5">
          <StatusMark status={project.status} />
        </div>
      </div>

      <div>
        <p className="type-kicker text-ink-faint">Milestone</p>
        <p className="mt-1.5 text-sm">
          {project.currentMilestone ? project.currentMilestone.title : "—"}
        </p>
        {project.lastPublicActivityAt ? (
          <p className="type-caption mt-1">
            {timeAgo(project.lastPublicActivityAt)}
          </p>
        ) : null}
      </div>

      <div>
        <p className="type-kicker text-ink-faint">Progress</p>
        {percent !== null && project.progress ? (
          <div className="mt-1.5">
            <p className="type-numeral text-xl">{percent}%</p>
            <div
              role="progressbar"
              aria-valuenow={project.progress.done}
              aria-valuemin={0}
              aria-valuemax={project.progress.total}
              aria-label={`${project.name} milestone progress: ${project.progress.done} of ${project.progress.total} items done`}
              className="mt-2 h-px w-full max-w-[7.5rem] bg-line-strong"
            >
              <div
                className="h-full bg-accent"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="mt-1.5 text-sm text-ink-soft">
            {project.status === "quiet" || project.status === "paused"
              ? "Resting"
              : "Active development"}
          </p>
        )}
      </div>
    </article>
  );
}

export default async function HeadquartersPage() {
  const [{ projects, degraded }, notes, experiments] = await Promise.all([
    getPublicProjects(),
    Promise.resolve(getNotes()),
    Promise.resolve(getLabExperiments()),
  ]);

  const bench = projects.filter((p) => p.featured).slice(0, 4);
  const building =
    projects.find((p) => p.status === "building" && p.featured) ??
    projects.find((p) => p.status === "building");
  const focus = building
    ? [building.name, building.currentMilestone?.title]
        .filter(Boolean)
        .join(" · ")
    : siteConfig.currently;

  return (
    <div className="mx-auto max-w-[88rem] px-5 sm:px-10">
      {/* Opening spread */}
      <header className="pt-12 lg:pt-20">
        <SectionLabel
          number={sectionNumber(3)}
          label="Headquarters"
          aside="The operating layer"
        />

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)] lg:items-end lg:gap-16">
          <div>
            <h1 className="type-feature text-[clamp(2.75rem,8vw,5.5rem)]">
              The room the work is made in.
            </h1>
            <p className="type-standfirst mt-7 max-w-lg">
              Everything upstairs is finished enough to show. This is the
              floor it was made on: what is being built right now, what was
              written down, and what is being tried and might not work.
            </p>

            <p className="mt-8 flex items-center gap-3">
              <span
                aria-hidden="true"
                className="inline-flex size-4 items-center justify-center rounded-full border border-accent/50"
              >
                <span className="size-1.5 rounded-full bg-accent pulse-live" />
              </span>
              <span className="type-kicker text-accent-deep">
                Focus · {focus}
              </span>
            </p>
          </div>

          <EditorialPhoto
            slot="headquarters-opening"
            mono
            sizes="(max-width: 1024px) 100vw, 44vw"
          />
        </div>
      </header>

      {degraded ? (
        <p className="mt-10 border border-line px-4 py-3 type-caption">
          Live project signals are briefly unavailable — showing the registry
          without recent activity.
        </p>
      ) : null}

      {/* On the bench */}
      <section aria-labelledby="bench-heading" className="mt-20">
        <SectionLabel
          label="On the bench"
          aside={
            <Link
              href="/workshop"
              className="hover:text-ink transition-colors duration-[var(--duration-micro)]"
            >
              All projects →
            </Link>
          }
        />
        <h2 id="bench-heading" className="sr-only">
          On the bench
        </h2>

        {bench.length > 0 ? (
          <div className="mt-8">
            {bench.map((project) => (
              <BenchRow key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState title="The bench is clear">
              Nothing is pinned up right now — the full collection lives in
              the{" "}
              <Link href="/workshop" className="underline">
                workshop
              </Link>
              .
            </EmptyState>
          </div>
        )}
      </section>

      {/* Written down / being tried */}
      <div className="mt-20 grid gap-16 lg:grid-cols-2 lg:gap-20">
        <section aria-labelledby="notes-heading">
          <SectionLabel
            label="Written down"
            aside={
              <Link
                href="/notes"
                className="hover:text-ink transition-colors duration-[var(--duration-micro)]"
              >
                All notes →
              </Link>
            }
          />
          <h2 id="notes-heading" className="sr-only">
            Written down
          </h2>

          {notes.length > 0 ? (
            <ul className="mt-6">
              {notes.slice(0, 4).map((note) => (
                <li key={note.slug} className="border-t border-line">
                  <Link href={`/notes/${note.slug}`} className="group block py-5">
                    <p className="type-kicker text-ink-faint">
                      {formatDate(note.date)}
                    </p>
                    <h3 className="type-heading mt-1.5 text-xl transition-colors duration-[var(--duration-micro)] group-hover:text-accent-deep">
                      {note.title}
                    </h3>
                    <p className="type-caption mt-1.5 line-clamp-2">
                      {note.excerpt}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-caption mt-6">Nothing written down yet.</p>
          )}
        </section>

        <section aria-labelledby="lab-heading">
          <SectionLabel
            label="Being tried"
            aside={
              <Link
                href="/lab"
                className="hover:text-ink transition-colors duration-[var(--duration-micro)]"
              >
                All experiments →
              </Link>
            }
          />
          <h2 id="lab-heading" className="sr-only">
            Being tried
          </h2>

          {experiments.length > 0 ? (
            <ul className="mt-6">
              {experiments.slice(0, 4).map((experiment) => (
                <li key={experiment.slug} className="border-t border-line">
                  <Link
                    href={`/lab/${experiment.slug}`}
                    className="group flex gap-5 py-5"
                  >
                    <span className="type-numeral text-xl text-accent">
                      {String(experiment.number).padStart(2, "0")}
                    </span>
                    <span className="min-w-0">
                      <span className="type-heading block text-xl transition-colors duration-[var(--duration-micro)] group-hover:text-accent-deep">
                        {experiment.name}
                      </span>
                      <span className="type-caption mt-1.5 block line-clamp-2">
                        {experiment.hypothesis}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="type-caption mt-6">The lab is empty tonight.</p>
          )}
        </section>
      </div>

      {/* The private layer */}
      <section
        aria-labelledby="console-heading"
        className="mt-20 border-t border-line pt-10 lg:mt-28"
      >
        <div className="grid gap-10 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-16">
          <div>
            <p className="type-kicker flex items-center gap-2.5 text-accent">
              Private console
              <svg
                aria-hidden="true"
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <rect x="3" y="7" width="10" height="7" rx="1.5" />
                <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
              </svg>
            </p>
            <h2
              id="console-heading"
              className="type-feature mt-4 text-[clamp(2rem,4.5vw,3rem)]"
            >
              The deeper layer.
            </h2>
            <p className="type-standfirst mt-5 max-w-md">
              Operational state, project admin, the gallery&rsquo;s settings
              and the sales ledger. This part is private for a reason — and
              it stays a working tool, not a display.
            </p>
            <Link
              href="/console"
              className="group mt-8 inline-flex items-center gap-3 border border-line-strong px-6 py-3.5 type-kicker text-ink transition-colors duration-[var(--duration-micro)] hover:border-accent hover:text-accent-deep"
            >
              Enter console
              <span
                aria-hidden="true"
                className="transition-transform duration-[var(--duration-micro)] group-hover:translate-x-1"
              >
                →
              </span>
            </Link>
          </div>

          {/* Public-safe counts only — nothing here is private state. */}
          <div className="border border-line bg-paper-raised p-6 font-mono text-[0.8125rem] leading-relaxed sm:p-8">
            <p>
              <span className="text-accent">porscha@console</span>
              <span className="text-ink-faint">:~$ </span>
              <span className="text-ink">status</span>
            </p>
            <dl className="mt-4 space-y-1.5">
              {[
                ["projects", String(projectRegistry.length)],
                ["experiments", String(experiments.length)],
                ["notes", String(notes.length)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6">
                  <dt className="text-ink-faint">&gt; {label}</dt>
                  <dd className="text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="my-4 border-t border-line" />
            <div className="flex justify-between gap-6">
              <span className="text-ink-faint">&gt; focus</span>
              <span className="text-accent">{focus}</span>
            </div>
          </div>
        </div>
      </section>

      {/* Rooms */}
      <nav aria-label="Inside Headquarters" className="mt-20">
        <SectionLabel label="Rooms" />
        <ul className="mt-6 grid gap-x-10 sm:grid-cols-2 lg:grid-cols-4">
          {siteConfig.secondaryNav.map((room) => (
            <li key={room.href} className="border-t border-line">
              <Link
                href={room.href}
                className="group block py-5 type-heading text-2xl transition-colors duration-[var(--duration-micro)] hover:text-accent-deep"
              >
                {room.label}
                <span
                  aria-hidden="true"
                  className="ml-3 inline-block text-accent transition-transform duration-[var(--duration-micro)] group-hover:translate-x-1"
                >
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
