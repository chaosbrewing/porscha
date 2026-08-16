import { describe, expect, it } from "vitest";
import {
  closedVisibility,
  projectAdminInputSchema,
  slugifyMilestone,
} from "./validation";

const valid = {
  slug: "test-project",
  name: "Test Project",
  description: "A perfectly reasonable project.",
  type: "app",
  status: "building",
  featured: false,
  isApp: false,
  isPublic: false,
  github: null,
  visibility: { ...closedVisibility },
  currentMilestone: null,
  milestones: [],
};

describe("projectAdminInputSchema", () => {
  it("accepts a valid minimal project", () => {
    expect(projectAdminInputSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects bad slugs", () => {
    for (const slug of ["", "A", "UPPER", "has space", "-lead", "trail-", "a"]) {
      const result = projectAdminInputSchema.safeParse({ ...valid, slug });
      expect(result.success, `slug "${slug}" should fail`).toBe(false);
    }
  });

  it("rejects unknown types and statuses", () => {
    expect(
      projectAdminInputSchema.safeParse({ ...valid, type: "startup" }).success,
    ).toBe(false);
    expect(
      projectAdminInputSchema.safeParse({ ...valid, status: "vibing" }).success,
    ).toBe(false);
  });

  it("rejects malformed repository names", () => {
    for (const repository of ["justname", "owner/", "/repo", "a b/c", "o/r/extra"]) {
      const result = projectAdminInputSchema.safeParse({
        ...valid,
        github: { repository, publicRepository: false },
      });
      expect(result.success, `repo "${repository}" should fail`).toBe(false);
    }
    expect(
      projectAdminInputSchema.safeParse({
        ...valid,
        github: { repository: "chaosbrewing/kubli", publicRepository: false },
      }).success,
    ).toBe(true);
  });

  it("rejects incomplete visibility structures", () => {
    const { lastActivity: _dropped, ...partial } = closedVisibility;
    expect(
      projectAdminInputSchema.safeParse({ ...valid, visibility: partial })
        .success,
    ).toBe(false);
  });

  it("requires the current milestone to exist", () => {
    const result = projectAdminInputSchema.safeParse({
      ...valid,
      currentMilestone: "ghost",
      milestones: [
        { slug: "real", title: "Real", workItems: [] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects duplicate milestone slugs", () => {
    const result = projectAdminInputSchema.safeParse({
      ...valid,
      milestones: [
        { slug: "same", title: "One", workItems: [] },
        { slug: "same", title: "Two", workItems: [] },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty work-item titles", () => {
    const result = projectAdminInputSchema.safeParse({
      ...valid,
      milestones: [
        {
          slug: "m1",
          title: "M1",
          workItems: [{ title: "  ", done: false }],
        },
      ],
    });
    expect(result.success).toBe(false);
  });

  it("speaks plain language in errors", () => {
    const result = projectAdminInputSchema.safeParse({ ...valid, slug: "!" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toMatch(/lowercase/);
    }
  });
});

describe("slugifyMilestone", () => {
  it("derives clean slugs from titles", () => {
    expect(slugifyMilestone("Capture Flow!")).toBe("capture-flow");
    expect(slugifyMilestone("  V0.2 — Studio Sync ")).toBe("v0-2-studio-sync");
  });
});
