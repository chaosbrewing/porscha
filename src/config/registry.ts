import type { ProjectConfig } from "@/types/core";

/**
 * The project registry.
 *
 * This is the single source of truth for which projects exist, which
 * repositories they connect to, and — critically — which GitHub-derived
 * signals each project is allowed to expose publicly.
 *
 * Nothing appears on the public site unless it is registered here, and
 * no GitHub signal is exposed unless its visibility flag is explicitly
 * true. New repositories are registered by adding an entry to this
 * array; `npm run db:sync` (or any webhook/sync pass) upserts registry
 * entries into the database.
 */
export const projectRegistry: ProjectConfig[] = [
  {
    slug: "kubli",
    name: "Kubli",
    description:
      "A place-based capture tool for stashing ideas, links, and fragments where you'll actually find them again.",
    type: "app",
    status: "building",
    featured: true,
    isApp: true,
    github: {
      repository: "chaosbrewing/kubli",
      publicRepository: false,
    },
    visibility: {
      lastActivity: true,
      releases: true,
      progress: true,
      milestones: true,
      issueCounts: false,
      pullRequestCounts: false,
      ciSummary: false,
    },
    currentMilestone: "capture-flow",
    milestones: [
      {
        slug: "capture-flow",
        title: "Capture flow",
        publicSummary: "Getting the core capture experience right.",
        workItems: [
          { title: "Quick-capture entry point", done: true },
          { title: "Location tagging", done: true },
          { title: "Offline queue", done: false },
          { title: "Capture review pass", done: false },
        ],
      },
      {
        slug: "first-release",
        title: "First release",
        workItems: [
          { title: "Onboarding", done: false },
          { title: "Release packaging", done: false },
        ],
      },
    ],
  },
  {
    slug: "prism",
    name: "PRISM",
    description:
      "An experiment in personal data reflection — turning scattered records into something you can actually look at.",
    type: "app",
    status: "active",
    featured: true,
    isApp: true,
    github: {
      repository: "chaosbrewing/PRISM",
      publicRepository: false,
    },
    visibility: {
      lastActivity: true,
      releases: true,
      progress: true,
      milestones: true,
      issueCounts: false,
      pullRequestCounts: false,
      ciSummary: false,
    },
    currentMilestone: "reflection-views",
    milestones: [
      {
        slug: "reflection-views",
        title: "Reflection views",
        publicSummary: "First set of views that make the data worth looking at.",
        workItems: [
          { title: "Timeline view", done: true },
          { title: "Density view", done: false },
          { title: "Export", done: false },
        ],
      },
    ],
  },
  {
    slug: "habi",
    name: "habi",
    description:
      "A small, forgiving habit companion. It assumes you will miss days and is built around coming back.",
    type: "app",
    status: "quiet",
    featured: true,
    isApp: true,
    github: {
      repository: "chaosbrewing/habi",
      publicRepository: false,
    },
    visibility: {
      lastActivity: true,
      releases: true,
      progress: false,
      milestones: false,
      issueCounts: false,
      pullRequestCounts: false,
      ciSummary: false,
    },
  },
  {
    slug: "the-whispering-city",
    name: "The Whispering City",
    description:
      "An interactive fiction experiment about a city that remembers what its citizens forget.",
    type: "experiment",
    status: "experimenting",
    isApp: false,
    github: {
      repository: "chaosbrewing/the-whispering-city",
      publicRepository: false,
    },
    visibility: {
      lastActivity: true,
      releases: false,
      progress: false,
      milestones: false,
      issueCounts: false,
      pullRequestCounts: false,
      ciSummary: false,
    },
  },
  {
    slug: "cloakli",
    name: "cloakli",
    description:
      "An earlier take on private capture. Retired, but it taught the lessons Kubli is built on.",
    type: "app",
    status: "archived",
    isApp: false,
    github: {
      repository: "chaosbrewing/cloakli",
      publicRepository: false,
    },
    visibility: {
      lastActivity: false,
      releases: false,
      progress: false,
      milestones: false,
      issueCounts: false,
      pullRequestCounts: false,
      ciSummary: false,
    },
  },
];

export function getProjectConfig(slug: string): ProjectConfig | undefined {
  return projectRegistry.find((p) => p.slug === slug);
}

export function getProjectConfigByRepo(
  repoFullName: string,
): ProjectConfig | undefined {
  return projectRegistry.find(
    (p) => p.github?.repository.toLowerCase() === repoFullName.toLowerCase(),
  );
}
