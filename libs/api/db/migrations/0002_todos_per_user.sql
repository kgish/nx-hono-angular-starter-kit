-- Todos from before accounts existed belong to nobody, and user_id is required.
DELETE FROM "todos";--> statement-breakpoint
ALTER TABLE "todos" ADD COLUMN "user_id" text NOT NULL;--> statement-breakpoint
ALTER TABLE "todos" ADD CONSTRAINT "todos_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "todos_user_id_idx" ON "todos" USING btree ("user_id");