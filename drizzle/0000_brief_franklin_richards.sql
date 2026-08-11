CREATE TYPE "public"."currency" AS ENUM('RUB', 'USD', 'EUR');--> statement-breakpoint
CREATE TYPE "public"."wish_priority" AS ENUM('dream', 'want_badly', 'would_be_nice');--> statement-breakpoint
CREATE TABLE "guests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"token_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "guests_token_hash_unique" UNIQUE("token_hash")
);
--> statement-breakpoint
CREATE TABLE "reservations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wish_id" uuid NOT NULL,
	"guest_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wishlist_id" uuid NOT NULL,
	"title" text NOT NULL,
	"url" text,
	"price" numeric(12, 2) NOT NULL,
	"currency" "currency" NOT NULL,
	"image_url" text,
	"priority" "wish_priority" NOT NULL,
	"note" text,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "wishlists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"note" text,
	"owner_name" text NOT NULL,
	"occasion" text,
	"occasion_date" date,
	CONSTRAINT "wishlists_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_wish_id_wishes_id_fk" FOREIGN KEY ("wish_id") REFERENCES "public"."wishes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_guest_id_guests_id_fk" FOREIGN KEY ("guest_id") REFERENCES "public"."guests"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "wishes" ADD CONSTRAINT "wishes_wishlist_id_wishlists_id_fk" FOREIGN KEY ("wishlist_id") REFERENCES "public"."wishlists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "reservations_wish_id_unique" ON "reservations" USING btree ("wish_id");