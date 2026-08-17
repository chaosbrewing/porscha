CREATE TABLE "gallery_admin_events" (
	"id" text PRIMARY KEY NOT NULL,
	"slug" text,
	"actor_id" text NOT NULL,
	"action" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "alt" text;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "aspect" text;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "body" text;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "origin" text DEFAULT 'file' NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "hidden" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "position" integer;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "gallery_admin_events_time_idx" ON "gallery_admin_events" USING btree ("created_at");