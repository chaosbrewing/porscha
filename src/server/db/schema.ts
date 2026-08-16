import {
  bigint,
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

/**
 * Database schema.
 *
 * Projects, milestones, and work items are mirrored from the typed
 * registry (`src/config/registry.ts`) by the sync layer so queries can
 * join against GitHub-derived state. Gallery items, lab experiments,
 * and notes are file-backed in v1; their tables exist as the extension
 * point for the future private editing interface.
 */

export const users = pgTable("users", {
  id: text("id").primaryKey(), // "github:<login>" or "dev:<name>"
  githubLogin: text("github_login").notNull(),
  displayName: text("display_name"),
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
});

export const projects = pgTable("projects", {
  slug: text("slug").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  type: text("type").notNull(),
  status: text("status").notNull(),
  featured: boolean("featured").notNull().default(false),
  isApp: boolean("is_app").notNull().default(false),
  currentMilestone: text("current_milestone"),
  visibility: jsonb("visibility").notNull(),
  links: jsonb("links"),
  /** Whether the project appears on the public site at all. */
  isPublic: boolean("is_public").notNull().default(true),
  /**
   * Set when the project is edited through the console. Once set, the
   * registry bootstrap never overwrites this project's configuration —
   * the database is authoritative for console-managed state.
   */
  configEditedAt: timestamp("config_edited_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const projectGithubConnections = pgTable(
  "project_github_connections",
  {
    projectSlug: text("project_slug")
      .primaryKey()
      .references(() => projects.slug, { onDelete: "cascade" }),
    repoFullName: text("repo_full_name").notNull(),
    publicRepository: boolean("public_repository").notNull().default(false),
    lastSyncedAt: timestamp("last_synced_at", { withTimezone: true }),
    lastSyncError: text("last_sync_error"),
  },
  (t) => [uniqueIndex("connections_repo_idx").on(t.repoFullName)],
);

export const projectMilestones = pgTable(
  "project_milestones",
  {
    id: text("id").primaryKey(), // "<project>/<milestone-slug>"
    projectSlug: text("project_slug")
      .notNull()
      .references(() => projects.slug, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title").notNull(),
    publicSummary: text("public_summary"),
    sortOrder: integer("sort_order").notNull().default(0),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("milestones_project_idx").on(t.projectSlug)],
);

export const projectWorkItems = pgTable(
  "project_work_items",
  {
    id: text("id").primaryKey(), // "<project>/<milestone>/<n>"
    milestoneId: text("milestone_id")
      .notNull()
      .references(() => projectMilestones.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    done: boolean("done").notNull().default(false),
    githubIssueNumber: integer("github_issue_number"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("work_items_milestone_idx").on(t.milestoneId)],
);

export const projectActivity = pgTable(
  "project_activity",
  {
    id: text("id").primaryKey(),
    projectSlug: text("project_slug")
      .notNull()
      .references(() => projects.slug, { onDelete: "cascade" }),
    type: text("type").notNull(),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    publicSummary: text("public_summary"),
    privatePayload: jsonb("private_payload"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("activity_project_time_idx").on(t.projectSlug, t.occurredAt),
    index("activity_time_idx").on(t.occurredAt),
  ],
);

export const projectSnapshots = pgTable("project_snapshots", {
  projectSlug: text("project_slug")
    .primaryKey()
    .references(() => projects.slug, { onDelete: "cascade" }),
  data: jsonb("data").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/** Processed webhook delivery IDs, for duplicate-delivery protection. */
export const webhookDeliveries = pgTable(
  "webhook_deliveries",
  {
    deliveryId: text("delivery_id").primaryKey(),
    event: text("event").notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("webhook_deliveries_time_idx").on(t.receivedAt)],
);

/* ------------------------- Two-factor auth ------------------------ */

export const userTwoFactor = pgTable("user_two_factor", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** AES-256-GCM encrypted TOTP secret (never stored in plaintext). */
  secretEnc: text("secret_enc").notNull(),
  /** Encrypted replacement secret awaiting confirmation. */
  pendingSecretEnc: text("pending_secret_enc"),
  /** Null until the first code is verified — enrollment incomplete. */
  enabledAt: timestamp("enabled_at", { withTimezone: true }),
  /** Last accepted TOTP time-step, for replay prevention. */
  lastUsedCounter: bigint("last_used_counter", { mode: "number" })
    .notNull()
    .default(0),
  /** Sessions issued at or before this instant are invalid. */
  sessionsInvalidatedAt: timestamp("sessions_invalidated_at", {
    withTimezone: true,
  }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const recoveryCodes = pgTable(
  "recovery_codes",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** SHA-256 of the code. Plaintext is shown exactly once. */
    codeHash: text("code_hash").notNull(),
    consumedAt: timestamp("consumed_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("recovery_codes_user_idx").on(t.userId)],
);

export const securityEvents = pgTable(
  "security_events",
  {
    id: text("id").primaryKey(),
    userId: text("user_id"),
    type: text("type").notNull(),
    /** Safe structured detail only — never codes, secrets, or tokens. */
    detail: jsonb("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("security_events_user_time_idx").on(t.userId, t.createdAt)],
);

/* --------------------- Project administration --------------------- */

/** Audit trail for project administration. Deliberately un-FK'd so the
 *  record outlives whatever it describes. */
export const projectAdminEvents = pgTable(
  "project_admin_events",
  {
    id: text("id").primaryKey(),
    projectSlug: text("project_slug").notNull(),
    actorId: text("actor_id").notNull(),
    action: text("action").notNull(),
    detail: jsonb("detail"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("admin_events_project_time_idx").on(t.projectSlug, t.createdAt),
  ],
);

export const siteSettings = pgTable("site_settings", {
  key: text("key").primaryKey(),
  value: jsonb("value").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

/* File-backed in v1; extension points for the future editing interface. */

export const galleryItems = pgTable("gallery_items", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  category: text("category").notNull(),
  year: text("year"),
  note: text("note"),
  mediaPath: text("media_path"),
  relatedProject: text("related_project"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const labExperiments = pgTable("lab_experiments", {
  slug: text("slug").primaryKey(),
  number: integer("number"),
  name: text("name").notNull(),
  hypothesis: text("hypothesis"),
  result: text("result"),
  relatedProject: text("related_project"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const notes = pgTable("notes", {
  slug: text("slug").primaryKey(),
  title: text("title").notNull(),
  publishedAt: timestamp("published_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
