import { z } from "zod";

/**
 * Validation for project administration input. Errors are plain
 * language — they surface directly in the console UI.
 */

export const PROJECT_TYPES = ["app", "experiment", "art", "other"] as const;
export const PROJECT_STATUSES = [
  "building",
  "active",
  "experimenting",
  "quiet",
  "paused",
  "shipped",
  "archived",
] as const;

const slugSchema = z
  .string()
  .regex(
    /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/,
    "Slugs are 3–50 characters of lowercase letters, numbers, and hyphens",
  );

const repoSchema = z
  .string()
  .regex(
    /^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/,
    "Repositories look like owner/name",
  );

export const visibilitySchema = z.object({
  lastActivity: z.boolean(),
  releases: z.boolean(),
  progress: z.boolean(),
  milestones: z.boolean(),
  issueCounts: z.boolean(),
  pullRequestCounts: z.boolean(),
  ciSummary: z.boolean(),
});

/** All GitHub-derived public signals default to OFF. */
export const closedVisibility = {
  lastActivity: false,
  releases: false,
  progress: false,
  milestones: false,
  issueCounts: false,
  pullRequestCounts: false,
  ciSummary: false,
};

const workItemSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Work items need a title")
    .max(200, "Keep work-item titles under 200 characters"),
  done: z.boolean(),
  githubIssue: z.number().int().positive().optional(),
});

const milestoneSchema = z.object({
  slug: slugSchema,
  title: z
    .string()
    .trim()
    .min(1, "Milestones need a title")
    .max(120, "Keep milestone titles under 120 characters"),
  publicSummary: z
    .string()
    .trim()
    .max(240, "Keep public summaries under 240 characters")
    .optional()
    .or(z.literal("").transform(() => undefined)),
  workItems: z.array(workItemSchema).max(50, "That's a lot of work items — cap is 50"),
});

export const projectAdminInputSchema = z
  .object({
    slug: slugSchema,
    name: z
      .string()
      .trim()
      .min(1, "Projects need a name")
      .max(80, "Keep names under 80 characters"),
    description: z
      .string()
      .trim()
      .min(1, "A short description helps visitors — add one")
      .max(300, "Keep descriptions under 300 characters"),
    type: z.enum(PROJECT_TYPES, { error: "Pick a valid project type" }),
    status: z.enum(PROJECT_STATUSES, { error: "Pick a valid status" }),
    featured: z.boolean(),
    isApp: z.boolean(),
    isPublic: z.boolean(),
    /**
     * Uploaded mark, or null to fall back to the drawn glyph. Optional
     * on the wire: a payload that predates logos, or never touched one,
     * simply doesn't carry it.
     */
    logoPath: z
      .string()
      .trim()
      .refine((v) => v.startsWith("/"), "Logo must be a path on this site")
      .nullable()
      .default(null),
    github: z
      .object({
        repository: repoSchema,
        publicRepository: z.boolean(),
      })
      .nullable(),
    visibility: visibilitySchema,
    currentMilestone: z.string().nullable(),
    milestones: z.array(milestoneSchema).max(20, "Cap is 20 milestones"),
  })
  .superRefine((value, ctx) => {
    const slugs = value.milestones.map((m) => m.slug);
    if (new Set(slugs).size !== slugs.length) {
      ctx.addIssue({
        code: "custom",
        path: ["milestones"],
        message: "Two milestones ended up with the same identifier",
      });
    }
    if (value.currentMilestone && !slugs.includes(value.currentMilestone)) {
      ctx.addIssue({
        code: "custom",
        path: ["currentMilestone"],
        message: "The current milestone must be one of the listed milestones",
      });
    }
  });

export type ProjectAdminInput = z.infer<typeof projectAdminInputSchema>;

export function firstValidationMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "That input didn't validate";
}

/** Derive a milestone slug from its title (used by the console form). */
export function slugifyMilestone(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base.length >= 3 ? base : `m-${base}`.padEnd(3, "x");
}
