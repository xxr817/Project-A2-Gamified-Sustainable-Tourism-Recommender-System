drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Public read on profiles for leaderboard" on public.profiles;

create policy "Public read on profiles for leaderboard"
  on public.profiles for select using (true);
