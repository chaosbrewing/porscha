CREATE TABLE "gallery_items" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"category" text NOT NULL,
	"year" text,
	"note" text,
	"media_path" text,
	"related_project" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "lab_experiments" (
	"slug" text PRIMARY KEY NOT NULL,
	"number" integer,
	"name" text NOT NULL,
	"hypothesis" text,
	"result" text,
	"related_project" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notes" (
	"slug" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"published_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_activity" (
	"id" text PRIMARY KEY NOT NULL,
	"project_slug" text NOT NULL,
	"type" text NOT NULL,
	"occurred_at" timestamp with time zone NOT NULL,
	"public_summary" text,
	"private_payload" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_github_connections" (
	"project_slug" text PRIMARY KEY NOT NULL,
	"repo_full_name" text NOT NULL,
	"public_repository" boolean DEFAULT false NOT NULL,
	"last_synced_at" timestamp with time zone,
	"last_sync_error" text
);
--> statement-breakpoint
CREATE TABLE "project_milestones" (
	"id" text PRIMARY KEY NOT NULL,
	"project_slug" text NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"public_summary" text,
	"sort_order" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_snapshots" (
	"project_slug" text PRIMARY KEY NOT NULL,
	"data" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_work_items" (
	"id" text PRIMARY KEY NOT NULL,
	"milestone_id" text NOT NULL,
	"title" text NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"github_issue_number" integer,
	"sort_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projects" (
	"slug" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"type" text NOT NULL,
	"status" text NOT NULL,
	"featured" boolean DEFAULT false NOT NULL,
	"is_app" boolean DEFAULT false NOT NULL,
	"current_milestone" text,
	"visibility" jsonb NOT NULL,
	"links" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "site_settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"github_login" text NOT NULL,
	"display_name" text,
	"avatar_url" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "webhook_deliveries" (
	"delivery_id" text PRIMARY KEY NOT NULL,
	"event" text NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "project_activity" ADD CONSTRAINT "project_activity_project_slug_projects_slug_fk" FOREIGN KEY ("project_slug") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_github_connections" ADD CONSTRAINT "project_github_connections_project_slug_projects_slug_fk" FOREIGN KEY ("project_slug") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_milestones" ADD CONSTRAINT "project_milestones_project_slug_projects_slug_fk" FOREIGN KEY ("project_slug") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_snapshots" ADD CONSTRAINT "project_snapshots_project_slug_projects_slug_fk" FOREIGN KEY ("project_slug") REFERENCES "public"."projects"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_work_items" ADD CONSTRAINT "project_work_items_milestone_id_project_milestones_id_fk" FOREIGN KEY ("milestone_id") REFERENCES "public"."project_milestones"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "activity_project_time_idx" ON "project_activity" USING btree ("project_slug","occurred_at");--> statement-breakpoint
CREATE INDEX "activity_time_idx" ON "project_activity" USING btree ("occurred_at");--> statement-breakpoint
CREATE UNIQUE INDEX "connections_repo_idx" ON "project_github_connections" USING btree ("repo_full_name");--> statement-breakpoint
CREATE INDEX "milestones_project_idx" ON "project_milestones" USING btree ("project_slug");--> statement-breakpoint
CREATE INDEX "work_items_milestone_idx" ON "project_work_items" USING btree ("milestone_id");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_time_idx" ON "webhook_deliveries" USING btree ("received_at");