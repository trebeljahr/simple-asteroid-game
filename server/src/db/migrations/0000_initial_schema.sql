CREATE TABLE "user_achievements" (
	"user_id" uuid NOT NULL,
	"achievement_id" text NOT NULL,
	"unlocked_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_achievements_user_id_achievement_id_pk" PRIMARY KEY("user_id","achievement_id")
);
--> statement-breakpoint
CREATE TABLE "user_stats" (
	"user_id" uuid PRIMARY KEY NOT NULL,
	"run_attempts" integer DEFAULT 0 NOT NULL,
	"run_completions" integer DEFAULT 0 NOT NULL,
	"run_best_time_ms" integer,
	"multiplayer_wins" integer DEFAULT 0 NOT NULL,
	"multiplayer_losses" integer DEFAULT 0 NOT NULL,
	"multiplayer_draws" integer DEFAULT 0 NOT NULL,
	"br_matches" integer DEFAULT 0 NOT NULL,
	"br_wins" integer DEFAULT 0 NOT NULL,
	"br_top_three" integer DEFAULT 0 NOT NULL,
	"asteroids_destroyed" integer DEFAULT 0 NOT NULL,
	"bullets_fired" integer DEFAULT 0 NOT NULL,
	"hearts_collected" integer DEFAULT 0 NOT NULL,
	"ammo_collected" integer DEFAULT 0 NOT NULL,
	"goals_cleared" integer DEFAULT 0 NOT NULL,
	"opponents_eliminated" integer DEFAULT 0 NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"device_token" text NOT NULL,
	"email" text,
	"password_hash" text,
	"display_name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_seen_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_device_token_unique" UNIQUE("device_token"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "user_achievements" ADD CONSTRAINT "user_achievements_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_stats" ADD CONSTRAINT "user_stats_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;