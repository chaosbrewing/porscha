import { describe, expect, it } from "vitest";
import { computeMilestoneProgress } from "./progress";

describe("computeMilestoneProgress", () => {
  it("computes percent from scoped work items", () => {
    const progress = computeMilestoneProgress(
      {
        slug: "m1",
        title: "M1",
        workItems: [{ done: true }, { done: true }, { done: false }],
      },
      "m1",
    );
    expect(progress.done).toBe(2);
    expect(progress.total).toBe(3);
    expect(progress.percent).toBe(67);
    expect(progress.isCurrent).toBe(true);
  });

  it("returns null percent with no scoped work items (no invented numbers)", () => {
    const progress = computeMilestoneProgress(
      { slug: "m1", title: "M1", workItems: [] },
      null,
    );
    expect(progress.percent).toBeNull();
  });

  it("marks non-current milestones", () => {
    const progress = computeMilestoneProgress(
      { slug: "m2", title: "M2", workItems: [{ done: false }] },
      "m1",
    );
    expect(progress.isCurrent).toBe(false);
  });
});
