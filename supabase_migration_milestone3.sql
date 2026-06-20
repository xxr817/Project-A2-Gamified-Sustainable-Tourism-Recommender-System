-- ===========================================================================
-- EcoTrail · Milestone 3 — consolidated migration
-- Run this ONCE in Supabase Dashboard -> SQL Editor.
-- It is idempotent: safe to re-run. It does NOT touch existing user data.
-- ===========================================================================

-- 1. GRANTs ------------------------------------------------------------------
--    Tables created through the SQL editor don't get automatic privileges,
--    so the auto REST API can silently return nothing. Re-applying is harmless.
grant usage on schema public to anon, authenticated;
grant select on all tables in schema public to anon, authenticated;
grant insert, update, delete on all tables in schema public to authenticated;

-- 2. Leaderboard read access -------------------------------------------------
--    The leaderboard must read every user's profile, so profiles need a
--    public SELECT policy (replaces the old "own profile only" policy).
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Public read on profiles for leaderboard" on public.profiles;
create policy "Public read on profiles for leaderboard"
  on public.profiles for select using (true);

-- 3. Account reset needs delete on own activity ------------------------------
drop policy if exists "Users can delete their own activity" on public.user_activity;
create policy "Users can delete their own activity"
  on public.user_activity for delete using (auth.uid() = user_id);

-- 4. Preferences storage (NEW for Milestone 3) -------------------------------
--    Onboarding + Profile now save the user's interests / transport / pace
--    into this jsonb column. Default {} so existing rows stay valid.
alter table public.profiles
  add column if not exists preferences jsonb not null default '{}'::jsonb;

-- 5. Badge progress needs an UPDATE policy (NEW) -----------------------------
--    user_badges had SELECT + INSERT but no UPDATE, so badge progress could be
--    written once but never advanced/unlocked. The achievement engine needs it.
drop policy if exists "Users can update their own badges" on public.user_badges;
create policy "Users can update their own badges"
  on public.user_badges for update using (auth.uid() = user_id);

-- Done. Verify in Table editor -> profiles has `preferences`; user_badges has an UPDATE policy.
