ALTER TABLE "gallery_items" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "for_sale" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "price_cents" integer;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "currency" text;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "edition_size" integer;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "sold_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "stripe_price_id" text;