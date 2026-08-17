import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { PublicProjectView } from "@/types/core";
import { ProjectGlyph } from "@/components/public/ProjectGlyph";
import { StatusMark } from "@/components/shared/StatusMark";
import { EmptyState } from "@/components/shared/EmptyState";
import { getPublicProjects } from "@/server/projects/service";
import {
  getGalleryPieces,
  getLabExperiments,
  getNotes,
} from "@/server/content/loader";
import { projectRegistry } from "@/config/registry";
import { siteConfig } from "@/config/site";
import { formatDate, timeAgo } from "@/lib/dates";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Porscha is the process",
  description:
    "Software. Experiments. Art. This is where Porscha builds, breaks, and refines what matters — publicly.",
  alternates: { canonical: "/" },
};

/* ------------------------------ Hero ------------------------------ */

const TOOLS: Array<{ label: string; icon: React.ReactNode }> = [
  {
    label: "Code",
    icon: (
      <path d="M8.5 7 4 12l4.5 5M15.5 7 20 12l-4.5 5M13 5l-2 14" />
    ),
  },
  {
    label: "Systems",
    icon: (
      <>
        <circle cx="12" cy="5.5" r="2" />
        <circle cx="5.5" cy="17" r="2" />
        <circle cx="18.5" cy="17" r="2" />
        <path d="M11 7.3 6.6 15.2M13 7.3l4.4 7.9M7.5 17h9" />
      </>
    ),
  },
  {
    label: "Design",
    icon: (
      <path d="m14.5 4.5 5 5L8 21H3v-5L14.5 4.5ZM12 7l5 5" />
    ),
  },
  {
    label: "Curiosity",
    icon: (
      <>
        <circle cx="11" cy="11" r="6.5" />
        <path d="m15.8 15.8 4.7 4.7M11 8v3.5M11 14.6v.1" />
      </>
    ),
  },
];

function ToolIcon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden="true"
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

/* -------------------------- Workbench row ------------------------- */

function RowLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="block type-meta text-[0.625rem] text-ink-faint mb-1.5">
      {children}
    </span>
  );
}

function WorkbenchRow({ project }: { project: PublicProjectView }) {
  const percent = project.progress?.percent ?? null;

  return (
    <article className="group grid gap-x-6 gap-y-5 px-5 py-6 sm:px-7 lg:grid-cols-[minmax(0,2.3fr)_minmax(0,0.8fr)_minmax(0,1.25fr)_minmax(0,1.25fr)_minmax(0,0.9fr)] lg:items-center transition-colors duration-[var(--duration-micro)] hover:bg-paper/60">
    {/* Identity */}
      <div className="flex items-start gap-4 lg:items-center">
        <ProjectGlyph slug={project.slug} logo={project.logoPath} />
        <div className="min-w-0">
          <h3 className="type-heading text-xl leading-snug">
            <Link
              href={`/workshop/${project.slug}`}
              className="hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
            >
              {project.name}
            </Link>
          </h3>
          <p className="mt-1 text-sm text-ink-soft leading-relaxed">
            {project.description}
          </p>
        </div>
      </div>

      {/* Status */}
      <div className="lg:border-l lg:border-line lg:pl-6">
        <RowLabel>Status</RowLabel>
        <StatusMark status={project.status} />
      </div>

      {/* Latest milestone */}
      <div className="lg:border-l lg:border-line lg:pl-6">
        <RowLabel>Latest milestone</RowLabel>
        {project.currentMilestone ? (
          <>
            <p className="text-sm font-medium leading-snug">
              {project.currentMilestone.title}
            </p>
            {project.latestRelease ? (
              <p className="mt-0.5 text-xs text-ink-faint">
                Released {formatDate(project.latestRelease.publishedAt)}
              </p>
            ) : project.currentMilestone.publicSummary ? (
              <p className="mt-0.5 text-xs text-ink-faint line-clamp-1">
                {project.currentMilestone.publicSummary}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-ink-soft">—</p>
        )}
      </div>

      {/* Recent activity */}
      <div className="lg:border-l lg:border-line lg:pl-6">
        <RowLabel>Recent activity</RowLabel>
        {project.activitySignal ? (
          <>
            <p className="text-sm leading-snug">{project.activitySignal}</p>
            {project.lastPublicActivityAt ? (
              <p className="mt-0.5 text-xs text-ink-faint">
                {timeAgo(project.lastPublicActivityAt)}
              </p>
            ) : null}
          </>
        ) : (
          <p className="text-sm text-ink-soft">Quietly resting</p>
        )}
      </div>

      {/* Progress — milestone-derived only */}
      <div className="lg:border-l lg:border-line lg:pl-6">
        <RowLabel>Progress</RowLabel>
        {percent !== null && project.progress ? (
          <div>
            <p className="type-heading text-xl leading-none">{percent}%</p>
            <div
              role="progressbar"
              aria-valuenow={project.progress.done}
              aria-valuemin={0}
              aria-valuemax={project.progress.total}
              aria-label={`${project.name} milestone progress: ${project.progress.done} of ${project.progress.total} items done`}
              className="mt-2 h-[3px] w-full max-w-[7.5rem] rounded-full bg-line"
            >
              <div
                className="h-full rounded-full bg-accent"
                style={{ width: `${percent}%` }}
              />
            </div>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            {project.status === "quiet" || project.status === "paused"
              ? "Resting"
              : "Active development"}
          </p>
        )}
      </div>
    </article>
  );
}

/* ------------------------------ Page ------------------------------ */

export default async function HomePage() {
  const [{ projects }, notes, experiments, gallery] = await Promise.all([
    getPublicProjects(),
    Promise.resolve(getNotes()),
    Promise.resolve(getLabExperiments()),
    Promise.resolve(getGalleryPieces()),
  ]);

  const workbench = projects.filter((p) => p.featured).slice(0, 3);
  const building =
    projects.find((p) => p.status === "building" && p.featured) ??
    projects.find((p) => p.status === "building");
  const buildSignal = building
    ? `Currently building ${building.name}`
    : siteConfig.currently;
  const focus = building
    ? [building.name, building.currentMilestone?.title]
        .filter(Boolean)
        .join(" · ")
    : siteConfig.currently;

  return (
    <>
      {/* Hero — editorial portrait introduction. Text aligns with the
          header container; the portrait bleeds to the right page edge. */}
      <section className="grid lg:grid-cols-[52fr_48fr] lg:grid-rows-[auto_1fr]">
        <div className="reveal px-5 pt-12 sm:pr-10 sm:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] lg:col-start-1 lg:row-start-1 lg:pt-20 lg:pr-16">
          <p className="type-meta text-ink flex items-center gap-2.5">
            Welcome to my headquarters
            <span aria-hidden="true" className="size-1.5 rounded-full bg-accent" />
          </p>
          <h1 className="type-display mt-6 text-[clamp(3.25rem,8.5vw,6.25rem)]">
            Porscha is
            <br />
            the process.
          </h1>
          <div className="mt-7 max-w-md text-[1.0625rem] text-ink-soft leading-relaxed">
            <p>Software. Experiments. Art.</p>
            <p>
              This is where I build, break, and refine what
              matters&thinsp;—&thinsp;publicly.
            </p>
          </div>
        </div>

        <figure className="relative mx-5 mt-10 aspect-[4/5] sm:mx-10 sm:aspect-[3/3.2] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mx-0 lg:mt-0 lg:aspect-auto lg:min-h-[680px]">
          <Image
            src="/portrait/porscha.jpg"
            alt="Porscha — a warm editorial portrait, direct gaze, copper hair, deep burgundy turtleneck"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 45vw"
            className="object-cover object-[50%_24%]"
          />
        </figure>

        <div className="reveal-late px-5 pt-10 pb-14 sm:pr-10 sm:pl-[max(2.5rem,calc((100vw-80rem)/2+2.5rem))] lg:col-start-1 lg:row-start-2 lg:pr-16 lg:pt-8 lg:pb-20 self-start">
          <p className="flex items-center gap-2.5">
            <span
              aria-hidden="true"
              className="inline-flex size-4 items-center justify-center rounded-full border border-accent/50"
            >
              <span className="size-1.5 rounded-full bg-accent pulse-live" />
            </span>
            <span className="type-meta text-accent-deep">{buildSignal}</span>
          </p>

          <div className="mt-6">
            <Link
              href="/workshop"
              className="group inline-flex items-center gap-3 rounded-[4px] bg-accent px-6 py-3.5 text-[0.9375rem] font-medium text-ink-inverse transition-colors duration-[var(--duration-micro)] hover:bg-accent-deep"
            >
              Enter the workshop
              <span
                aria-hidden="true"
                className="transition-transform duration-[var(--duration-micro)] group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>

          <div className="mt-12 max-w-sm">
            <p className="flex items-center gap-4">
              <span className="type-meta text-ink-faint whitespace-nowrap">
                Tools of the trade
              </span>
              <span aria-hidden="true" className="h-px flex-1 bg-line-strong" />
            </p>
            <ul className="mt-5 flex gap-9">
              {TOOLS.map((tool) => (
                <li key={tool.label} className="flex flex-col items-center gap-2">
                  {tool.label === "Curiosity" ? (
                    // The workshop door. Unlabelled on purpose: it reads
                    // as one of the tools, and curiosity is what opens it.
                    <Link
                      href="/login"
                      aria-label="Owner sign-in"
                      title="Owner sign-in"
                      className="text-ink hover:text-accent-deep transition-colors duration-[var(--duration-micro)]"
                    >
                      <ToolIcon>{tool.icon}</ToolIcon>
                    </Link>
                  ) : (
                    <span className="text-ink">
                      <ToolIcon>{tool.icon}</ToolIcon>
                    </span>
                  )}
                  <span className="text-xs text-ink-soft">{tool.label}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* On the workbench */}
      <section
        aria-labelledby="workbench-heading"
        className="mx-auto max-w-7xl px-5 sm:px-10 mt-16 lg:mt-24"
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="type-meta text-accent-deep">Currently</p>
            <h2 id="workbench-heading" className="type-display text-4xl sm:text-[2.75rem] mt-2">
              On the workbench.
            </h2>
          </div>
          <Link
            href="/workshop"
            className="group text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)] pb-1"
          >
            View all projects{" "}
            <span
              aria-hidden="true"
              className="inline-block transition-transform duration-[var(--duration-micro)] group-hover:translate-x-0.5"
            >
              →
            </span>
          </Link>
        </div>

        {workbench.length > 0 ? (
          <div className="mt-8 divide-y divide-line rounded-[6px] border border-line bg-paper-raised">
            {workbench.map((project) => (
              <WorkbenchRow key={project.slug} project={project} />
            ))}
          </div>
        ) : (
          <div className="mt-8">
            <EmptyState title="The workbench is clear">
              Nothing is pinned up right now — the full collection lives in
              the <Link href="/workshop" className="underline">workshop</Link>.
            </EmptyState>
          </div>
        )}
      </section>

      {/* Private console teaser */}
      <section
        aria-labelledby="console-heading"
        className="mx-auto max-w-7xl px-5 sm:px-10 mt-16 lg:mt-24"
      >
        <div className="grid gap-10 rounded-[6px] bg-ink-well px-6 py-10 sm:px-10 sm:py-12 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:gap-14 lg:px-14">
          <div>
            <p className="flex items-center gap-2.5">
              <span className="type-meta text-accent">Private console</span>
              <svg
                aria-hidden="true"
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="var(--color-accent)"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <rect x="3" y="7" width="10" height="7" rx="1.5" />
                <path d="M5.5 7V5.5a2.5 2.5 0 0 1 5 0V7" />
              </svg>
            </p>
            <h2
              id="console-heading"
              className="type-display mt-4 text-4xl sm:text-[2.75rem] text-ink-inverse"
            >
              The deeper layer.
            </h2>
            <p className="mt-4 max-w-md text-[0.9375rem] leading-relaxed text-ink-inverse-soft">
              Notes. Experiments. In-progress ideas and the operational state
              of every project. This part is private for a reason.
            </p>
            <Link
              href="/console"
              className="group mt-7 inline-flex items-center gap-3 rounded-[4px] border border-ink-inverse-soft/40 px-5 py-3 text-sm text-ink-inverse transition-colors duration-[var(--duration-micro)] hover:border-ink-inverse-soft"
            >
              Enter console
              <span
                aria-hidden="true"
                className="transition-transform duration-[var(--duration-micro)] group-hover:translate-x-0.5"
              >
                →
              </span>
            </Link>
          </div>

          {/* Compact status panel — real, public-safe counts only. */}
          <div className="rounded-[6px] border border-ink-inverse-soft/20 bg-black/25 p-5 sm:p-6 font-mono text-[0.8125rem] leading-relaxed">
            <p>
              <span className="text-accent">porscha@console</span>
              <span className="text-ink-inverse-soft">:~$ </span>
              <span className="text-ink-inverse">status</span>
            </p>
            <dl className="mt-4 space-y-1.5">
              {[
                ["projects", String(projectRegistry.length)],
                ["experiments", String(experiments.length)],
                ["notes", String(notes.length)],
                ["gallery", String(gallery.length)],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-6">
                  <dt className="text-ink-inverse-soft">&gt; {label}</dt>
                  <dd className="text-ink-inverse">{value}</dd>
                </div>
              ))}
            </dl>
            <div className="my-4 border-t border-ink-inverse-soft/20" />
            <div className="flex justify-between gap-6">
              <span className="text-ink-inverse-soft">&gt; focus</span>
              <span className="text-accent">{focus}</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
