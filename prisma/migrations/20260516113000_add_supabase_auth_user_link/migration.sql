-- Link application users to Supabase Auth users without requiring real auth
-- for existing dev/seed accounts during the transition.
ALTER TABLE "users" ADD COLUMN "auth_user_id" TEXT;

CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");
