"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PublicProjectView } from "@/types/core";
import { ProjectEntry } from "@/components/public/ProjectEntry";

/**
 * Project administration form, used by both create and edit. Submits
 * the full mutable configuration; the server validates with zod and
 * records audit events. The preview panel calls the real public
 * serializer — never a parallel fake model.
 */

type WorkItemDraft = { title: string; done: boolean };
type MilestoneDraft = {
  slug: string;
  title: string;
  publicSummary: string;
  workItems: WorkItemDraft[];
};

export type ProjectFormValue = {
  slug: string;
  name: string;
  description: string;
  type: string;
  status: string;
  featured: boolean;
  isApp: boolean;
  isPublic: boolean;
  github: { repository: string; publicRepository: boolean } | null;
  visibility: Record<string, boolean>;
  currentMilestone: string | null;
  milestones: MilestoneDraft[];
};

const TYPES = ["app", "experiment", "art", "other"];
const STATUSES = [
  "building",
  "active",
  "experimenting",
  "quiet",
  "paused",
  "shipped",
  "archived",
];

const SIGNALS: Array<{ key: string; label: string; hint: string }> = [
  { key: "lastActivity", label: "Recent activity", hint: "Coarse activity signal (“Activity this week”)" },
  { key: "releases", label: "Releases", hint: "Latest release tag and date" },
  { key: "progress", label: "Progress", hint: "Milestone-derived progress meter" },
  { key: "milestones", label: "Current milestone", hint: "Milestone title and public summary" },
  { key: "issueCounts", label: "Issue counts", hint: "Reserved for future public use" },
  { key: "pullRequestCounts", label: "PR counts", hint: "Reserved for future public use" },
  { key: "ciSummary", label: "CI summary", hint: "Reserved for future public use" },
];

export const emptyProjectDraft: ProjectFormValue = {
  slug: "",
  name: "",
  description: "",
  type: "app",
  status: "building",
  featured: false,
  isApp: false,
  isPublic: false,
  github: null,
  // New projects expose nothing until each signal is switched on.
  visibility: {
    lastActivity: false,
    releases: false,
    progress: false,
    milestones: false,
    issueCounts: false,
    pullRequestCounts: false,
    ciSummary: false,
  },
  currentMilestone: null,
  milestones: [],
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 50);
}

function move<T>(list: T[], from: number, to: number): T[] {
  if (to < 0 || to >= list.length) return list;
  const next = [...list];
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}

const inputClass =
  "mt-1.5 w-full rounded-[4px] border border-line-strong bg-paper-raised px-3.5 py-2.5 text-sm";
const labelClass = "type-meta text-ink-faint block";

export function ProjectForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: ProjectFormValue;
}) {
  const router = useRouter();
  const [value, setValue] = useState<ProjectFormValue>(
    initial ?? emptyProjectDraft,
  );
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [slugTouched, setSlugTouched] = useState(mode === "edit");

  const set = useCallback(
    (patch: Partial<ProjectFormValue>) =>
      setValue((v) => ({ ...v, ...patch })),
    [],
  );

  /* ------------------------- Repository picker ------------------- */
  const [repoQuery, setRepoQuery] = useState("");
  const [repoResults, setRepoResults] = useState<
    Array<{ fullName: string; private: boolean; archived: boolean }>
  >([]);
  const [repoNotice, setRepoNotice] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    if (searchTimer.current) clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/console/admin/repos?q=${encodeURIComponent(repoQuery)}`,
        );
        const json = (await res.json()) as {
          repos: Array<{ fullName: string; private: boolean; archived: boolean }>;
          unavailable?: boolean;
          message?: string;
        };
        setRepoResults(json.repos ?? []);
        setRepoNotice(json.unavailable ? (json.message ?? null) : null);
      } catch {
        setRepoNotice("GitHub is unreachable right now.");
      }
    }, 250);
    return () => {
      if (searchTimer.current) clearTimeout(searchTimer.current);
    };
  }, [repoQuery, pickerOpen]);

  function chooseRepo(fullName: string) {
    const replacing =
      mode === "edit" && value.github && value.github.repository !== fullName;
    if (
      replacing &&
      !window.confirm(
        `Replace ${value.github!.repository} with ${fullName}? The stored repository snapshot will be rebuilt on the next sync.`,
      )
    ) {
      return;
    }
    set({
      github: { repository: fullName, publicRepository: false },
    });
    setPickerOpen(false);
  }

  /* ----------------------------- Preview -------------------------- */
  const [preview, setPreview] = useState<
    | { state: "idle" }
    | { state: "hidden" }
    | { state: "ready"; view: PublicProjectView }
    | { state: "error"; message: string }
  >({ state: "idle" });

  async function refreshPreview() {
    try {
      const res = await fetch("/api/console/admin/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serialize(value)),
      });
      const json = (await res.json()) as {
        hidden?: boolean;
        view?: PublicProjectView;
        error?: string;
      };
      if (!res.ok) {
        setPreview({ state: "error", message: json.error ?? "Preview failed" });
      } else if (json.hidden) {
        setPreview({ state: "hidden" });
      } else if (json.view) {
        setPreview({ state: "ready", view: json.view });
      }
    } catch {
      setPreview({ state: "error", message: "Couldn't reach the server." });
    }
  }

  /* ------------------------------ Save ---------------------------- */

  function serialize(v: ProjectFormValue) {
    return {
      ...v,
      currentMilestone: v.currentMilestone || null,
      milestones: v.milestones.map((m) => ({
        slug: m.slug,
        title: m.title,
        publicSummary: m.publicSummary || undefined,
        workItems: m.workItems.map((w) => ({ title: w.title, done: w.done })),
      })),
    };
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const url =
        mode === "create"
          ? "/api/console/admin/projects"
          : `/api/console/admin/projects/${value.slug}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(serialize(value)),
      });
      const json = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !json.ok) {
        setError(json.error ?? "Saving failed.");
        return;
      }
      router.push(`/console/projects/${value.slug}`);
      router.refresh();
    } catch {
      setError("Couldn't reach the server.");
    } finally {
      setBusy(false);
    }
  }

  /* ---------------------------- Render ----------------------------- */

  return (
    <form onSubmit={save} className="grid gap-10 lg:grid-cols-[1fr_360px]">
      <div className="space-y-10 min-w-0">
        {/* Basics */}
        <section aria-labelledby="basics-h">
          <h2 id="basics-h" className="type-heading text-lg mb-4">
            Basics
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-name" className={labelClass}>Name</label>
              <input
                id="p-name"
                required
                value={value.name}
                onChange={(e) => {
                  const name = e.target.value;
                  set(
                    slugTouched
                      ? { name }
                      : { name, slug: slugify(name) },
                  );
                }}
                className={inputClass}
              />
            </div>
            <div>
              <label htmlFor="p-slug" className={labelClass}>
                Slug {mode === "edit" ? "(fixed)" : ""}
              </label>
              <input
                id="p-slug"
                required
                value={value.slug}
                disabled={mode === "edit"}
                onChange={(e) => {
                  setSlugTouched(true);
                  set({ slug: slugify(e.target.value) });
                }}
                className={`${inputClass} font-mono disabled:opacity-60`}
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="p-desc" className={labelClass}>Description</label>
            <textarea
              id="p-desc"
              required
              rows={2}
              maxLength={300}
              value={value.description}
              onChange={(e) => set({ description: e.target.value })}
              className={inputClass}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="p-type" className={labelClass}>Type</label>
              <select
                id="p-type"
                value={value.type}
                onChange={(e) => set({ type: e.target.value })}
                className={inputClass}
              >
                {TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="p-status" className={labelClass}>Status</label>
              <select
                id="p-status"
                value={value.status}
                onChange={(e) => set({ status: e.target.value })}
                className={inputClass}
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-3 text-sm">
            {(
              [
                ["isPublic", "Visible on the public site"],
                ["featured", "Featured on the homepage workbench"],
                ["isApp", "Shown on the Apps shelf"],
              ] as const
            ).map(([key, label]) => (
              <label key={key} className="flex items-center gap-2.5">
                <input
                  type="checkbox"
                  checked={value[key]}
                  onChange={(e) => set({ [key]: e.target.checked })}
                  className="size-4 accent-[var(--color-accent)]"
                />
                {label}
              </label>
            ))}
          </div>
        </section>

        {/* GitHub */}
        <section aria-labelledby="gh-h">
          <h2 id="gh-h" className="type-heading text-lg mb-4">
            GitHub connection
          </h2>
          {value.github ? (
            <div className="border border-line rounded-md px-4 py-3.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="font-mono text-sm">{value.github.repository}</p>
                <button
                  type="button"
                  onClick={() => set({ github: null })}
                  className="text-xs text-ink-soft underline underline-offset-4 decoration-line-strong hover:text-ink"
                >
                  Disconnect
                </button>
              </div>
              <label className="mt-3 flex items-start gap-2.5 text-sm leading-relaxed">
                <input
                  type="checkbox"
                  checked={value.github.publicRepository}
                  onChange={(e) =>
                    set({
                      github: {
                        ...value.github!,
                        publicRepository: e.target.checked,
                      },
                    })
                  }
                  className="mt-0.5 size-4 accent-[var(--color-accent)]"
                />
                This repository is public on GitHub, and its URL may be
                linked from the public site.
              </label>
            </div>
          ) : (
            <div>
              <button
                type="button"
                onClick={() => setPickerOpen((v) => !v)}
                className="border border-line-strong px-4 py-2.5 text-sm rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
              >
                {pickerOpen ? "Close picker" : "Connect a repository"}
              </button>
              <p className="mt-2 text-xs text-ink-faint">
                Optional — projects don&rsquo;t need a repository. Connecting
                one never makes anything public by itself.
              </p>
            </div>
          )}

          {pickerOpen && !value.github ? (
            <div className="mt-4 border border-line rounded-md p-4">
              <label htmlFor="repo-q" className={labelClass}>
                Search repositories
              </label>
              <input
                id="repo-q"
                value={repoQuery}
                onChange={(e) => setRepoQuery(e.target.value)}
                placeholder="owner/name"
                className={inputClass}
              />
              {repoNotice ? (
                <p className="mt-3 text-sm text-warn">{repoNotice}</p>
              ) : null}
              <ul className="mt-3 max-h-56 overflow-y-auto divide-y divide-line">
                {repoResults.map((r) => (
                  <li key={r.fullName}>
                    <button
                      type="button"
                      onClick={() => chooseRepo(r.fullName)}
                      className="flex w-full items-center justify-between gap-4 px-2 py-2.5 text-left text-sm hover:bg-paper transition-colors duration-[var(--duration-micro)]"
                    >
                      <span className="font-mono truncate">{r.fullName}</span>
                      <span className="type-meta text-ink-faint shrink-0">
                        {r.private ? "Private" : "Public"}
                        {r.archived ? " · Archived" : ""}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <details className="mt-3 text-sm text-ink-soft">
                <summary className="cursor-pointer underline underline-offset-4 decoration-line-strong">
                  Or type owner/repo by hand
                </summary>
                <ManualRepoEntry onChoose={chooseRepo} />
              </details>
            </div>
          ) : null}
        </section>

        {/* Public signals */}
        <section aria-labelledby="signals-h">
          <h2 id="signals-h" className="type-heading text-lg mb-1.5">
            Public signals
          </h2>
          <p className="text-sm text-ink-soft mb-4 max-w-lg">
            Each GitHub-derived signal is off until you switch it on — a
            public repository never implies public signals.
          </p>
          <ul className="border border-line rounded-md divide-y divide-line">
            {SIGNALS.map((s) => (
              <li key={s.key} className="flex items-center justify-between gap-4 px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{s.label}</p>
                  <p className="text-xs text-ink-faint">{s.hint}</p>
                </div>
                <label className="inline-flex items-center gap-2 text-xs text-ink-soft">
                  <input
                    type="checkbox"
                    checked={Boolean(value.visibility[s.key])}
                    onChange={(e) =>
                      set({
                        visibility: {
                          ...value.visibility,
                          [s.key]: e.target.checked,
                        },
                      })
                    }
                    className="size-4 accent-[var(--color-accent)]"
                  />
                  {value.visibility[s.key] ? "Public" : "Hidden"}
                </label>
              </li>
            ))}
          </ul>
        </section>

        {/* Milestones */}
        <section aria-labelledby="ms-h">
          <div className="flex items-center justify-between mb-1.5">
            <h2 id="ms-h" className="type-heading text-lg">Milestones</h2>
            <button
              type="button"
              onClick={() =>
                set({
                  milestones: [
                    ...value.milestones,
                    { slug: "", title: "", publicSummary: "", workItems: [] },
                  ],
                })
              }
              className="border border-line-strong px-3.5 py-2 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
            >
              + Add milestone
            </button>
          </div>
          <p className="text-sm text-ink-soft mb-4 max-w-lg">
            Progress derives only from these scoped work items — never from
            commit counts. No work items, no percentage.
          </p>

          {value.milestones.length === 0 ? (
            <p className="text-sm text-ink-soft border border-line rounded-md px-4 py-4">
              No milestones yet. Public pages will show honest state instead
              of a number.
            </p>
          ) : (
            <ol className="space-y-4">
              {value.milestones.map((m, mi) => (
                <li key={mi} className="border border-line rounded-md p-4">
                  <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                    <div>
                      <label htmlFor={`ms-title-${mi}`} className={labelClass}>
                        Milestone title
                      </label>
                      <input
                        id={`ms-title-${mi}`}
                        required
                        value={m.title}
                        onChange={(e) => {
                          const milestones = [...value.milestones];
                          const title = e.target.value;
                          milestones[mi] = {
                            ...m,
                            title,
                            slug: slugify(title) || m.slug,
                          };
                          const renamed = milestones[mi].slug;
                          set({
                            milestones,
                            currentMilestone:
                              value.currentMilestone === m.slug
                                ? renamed
                                : value.currentMilestone,
                          });
                        }}
                        className={inputClass}
                      />
                    </div>
                    <div className="flex items-end gap-1.5">
                      <button
                        type="button"
                        aria-label={`Move milestone ${m.title || mi + 1} up`}
                        onClick={() =>
                          set({ milestones: move(value.milestones, mi, mi - 1) })
                        }
                        className="h-10 w-10 border border-line rounded-[3px] text-ink-soft hover:text-ink"
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={`Move milestone ${m.title || mi + 1} down`}
                        onClick={() =>
                          set({ milestones: move(value.milestones, mi, mi + 1) })
                        }
                        className="h-10 w-10 border border-line rounded-[3px] text-ink-soft hover:text-ink"
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        aria-label={`Remove milestone ${m.title || mi + 1}`}
                        onClick={() => {
                          const milestones = value.milestones.filter(
                            (_, i) => i !== mi,
                          );
                          set({
                            milestones,
                            currentMilestone:
                              value.currentMilestone === m.slug
                                ? null
                                : value.currentMilestone,
                          });
                        }}
                        className="h-10 w-10 border border-line rounded-[3px] text-alert hover:border-alert"
                      >
                        ✕
                      </button>
                    </div>
                  </div>

                  <div className="mt-3">
                    <label htmlFor={`ms-sum-${mi}`} className={labelClass}>
                      Public summary (optional)
                    </label>
                    <input
                      id={`ms-sum-${mi}`}
                      value={m.publicSummary}
                      maxLength={240}
                      onChange={(e) => {
                        const milestones = [...value.milestones];
                        milestones[mi] = { ...m, publicSummary: e.target.value };
                        set({ milestones });
                      }}
                      className={inputClass}
                    />
                  </div>

                  <label className="mt-3 flex items-center gap-2.5 text-sm">
                    <input
                      type="radio"
                      name="current-milestone"
                      checked={value.currentMilestone === m.slug && m.slug !== ""}
                      onChange={() => set({ currentMilestone: m.slug })}
                      className="size-4 accent-[var(--color-accent)]"
                    />
                    Current milestone
                  </label>

                  {/* Work items */}
                  <div className="mt-4 border-t border-line pt-3">
                    <div className="flex items-center justify-between">
                      <p className={labelClass}>Work items</p>
                      <button
                        type="button"
                        onClick={() => {
                          const milestones = [...value.milestones];
                          milestones[mi] = {
                            ...m,
                            workItems: [...m.workItems, { title: "", done: false }],
                          };
                          set({ milestones });
                        }}
                        className="text-xs text-ink-soft underline underline-offset-4 decoration-line-strong hover:text-ink"
                      >
                        + Add item
                      </button>
                    </div>
                    <ul className="mt-2 space-y-2">
                      {m.workItems.map((w, wi) => (
                        <li key={wi} className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            aria-label={`Mark “${w.title || `item ${wi + 1}`}” done`}
                            checked={w.done}
                            onChange={(e) => {
                              const milestones = [...value.milestones];
                              const workItems = [...m.workItems];
                              workItems[wi] = { ...w, done: e.target.checked };
                              milestones[mi] = { ...m, workItems };
                              set({ milestones });
                            }}
                            className="size-4 accent-[var(--color-accent)]"
                          />
                          <input
                            aria-label={`Work item ${wi + 1} title`}
                            required
                            value={w.title}
                            onChange={(e) => {
                              const milestones = [...value.milestones];
                              const workItems = [...m.workItems];
                              workItems[wi] = { ...w, title: e.target.value };
                              milestones[mi] = { ...m, workItems };
                              set({ milestones });
                            }}
                            className="flex-1 rounded-[4px] border border-line bg-paper-raised px-3 py-2 text-sm"
                          />
                          <button
                            type="button"
                            aria-label={`Move item ${wi + 1} up`}
                            onClick={() => {
                              const milestones = [...value.milestones];
                              milestones[mi] = {
                                ...m,
                                workItems: move(m.workItems, wi, wi - 1),
                              };
                              set({ milestones });
                            }}
                            className="h-9 w-9 border border-line rounded-[3px] text-ink-soft hover:text-ink"
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            aria-label={`Move item ${wi + 1} down`}
                            onClick={() => {
                              const milestones = [...value.milestones];
                              milestones[mi] = {
                                ...m,
                                workItems: move(m.workItems, wi, wi + 1),
                              };
                              set({ milestones });
                            }}
                            className="h-9 w-9 border border-line rounded-[3px] text-ink-soft hover:text-ink"
                          >
                            ↓
                          </button>
                          <button
                            type="button"
                            aria-label={`Remove item ${wi + 1}`}
                            onClick={() => {
                              const milestones = [...value.milestones];
                              milestones[mi] = {
                                ...m,
                                workItems: m.workItems.filter((_, i) => i !== wi),
                              };
                              set({ milestones });
                            }}
                            className="h-9 w-9 border border-line rounded-[3px] text-alert hover:border-alert"
                          >
                            ✕
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        {error ? (
          <p role="alert" className="rounded border border-alert/40 bg-alert-wash px-4 py-3 text-sm">
            {error}
          </p>
        ) : null}

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={busy}
            className="rounded-[4px] bg-accent px-6 py-3 text-[0.9375rem] font-medium text-ink-inverse hover:bg-accent-deep transition-colors duration-[var(--duration-micro)] disabled:opacity-60"
          >
            {busy
              ? "Saving…"
              : mode === "create"
                ? "Create project"
                : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm text-ink-soft hover:text-ink transition-colors duration-[var(--duration-micro)]"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Preview rail */}
      <aside aria-label="Public preview" className="lg:border-l lg:border-line lg:pl-8">
        <div className="sticky top-8">
          <div className="flex items-center justify-between">
            <h2 className="type-heading text-lg">What visitors will see</h2>
            <button
              type="button"
              onClick={refreshPreview}
              className="border border-line-strong px-3 py-1.5 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink transition-colors duration-[var(--duration-micro)]"
            >
              Refresh
            </button>
          </div>
          <div className="mt-4 border border-line rounded-md px-4 bg-paper-raised overflow-hidden">
            {preview.state === "idle" ? (
              <p className="py-6 text-sm text-ink-soft">
                Hit refresh to run the draft through the real public
                serializer.
              </p>
            ) : preview.state === "hidden" ? (
              <p className="py-6 text-sm text-ink-soft">
                This project is hidden from the public site — visitors see
                nothing at all.
              </p>
            ) : preview.state === "error" ? (
              <p className="py-6 text-sm text-alert">{preview.message}</p>
            ) : (
              <ProjectEntry project={preview.view} />
            )}
          </div>
          <p className="mt-3 text-xs text-ink-faint leading-relaxed">
            Rendered by the same serializer and component as the public
            workshop. GitHub-derived signals appear once a synced snapshot
            exists.
          </p>
        </div>
      </aside>
    </form>
  );
}

function ManualRepoEntry({ onChoose }: { onChoose: (repo: string) => void }) {
  const [manual, setManual] = useState("");
  const valid = /^[\w.-]+\/[\w.-]+$/.test(manual);
  return (
    <div className="mt-2 flex gap-2">
      <input
        aria-label="Repository owner/name"
        value={manual}
        onChange={(e) => setManual(e.target.value)}
        placeholder="owner/repo"
        className="flex-1 rounded-[4px] border border-line bg-paper-raised px-3 py-2 font-mono text-sm"
      />
      <button
        type="button"
        disabled={!valid}
        onClick={() => onChoose(manual)}
        className="border border-line-strong px-3.5 py-2 text-xs rounded-[3px] text-ink-soft hover:text-ink hover:border-ink disabled:opacity-50"
      >
        Use
      </button>
    </div>
  );
}
