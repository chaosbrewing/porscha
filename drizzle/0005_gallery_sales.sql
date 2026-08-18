ALTER TABLE "gallery_items" ADD COLUMN "reserved_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "stripe_session_id" text;--> statement-breakpoint
ALTER TABLE "gallery_items" ADD COLUMN "stripe_payment_intent_id" text;