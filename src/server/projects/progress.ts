import type { MilestoneProgress } from "@/types/core";

/**
 * Milestone progress. Progress derives ONLY from explicitly scoped work
 * items — never from commit counts, lines of code, or activity volume.
 */

export type MilestoneInput = {
  slug: string;
  title: string;
  publicSummary?: string | null;
  workItems: Array<{ done: boolean }>;
};

export function computeMilestoneProgress(
  milestone: MilestoneInput,
  currentMilestoneSlug?: string | null,
): MilestoneProgress {
  const total = milestone.workItems.length;
  const done = milestone.workItems.filter((w) => w.done).length;
  return {
    slug: milestone.slug,
    title: milestone.title,
    publicSummary: milestone.publicSummary ?? undefined,
    done,
    total,
    // No scoped work items → no percentage. Callers render
    // "Active development" instead of inventing a number.
    percent: total === 0 ? null : Math.round((done / total) * 100),
    isCurrent: milestone.slug === currentMilestoneSlug,
  };
}

export function computeAllMilestones(
  milestones: MilestoneInput[],
  currentMilestoneSlug?: string | null,
): MilestoneProgress[] {
  return milestones.map((m) =>
    computeMilestoneProgress(m, currentMilestoneSlug),
  );
}
