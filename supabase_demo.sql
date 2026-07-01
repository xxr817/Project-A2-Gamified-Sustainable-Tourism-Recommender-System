-- EcoTrail demo content
-- Run once after schema + seed. Populates the current user with realistic
-- gamification state, and adds Munich community members for the leaderboard.


------------------------------------------------------------
-- 1. Upgrade the current user's profile
------------------------------------------------------------

update public.profiles
set
  level              = 7,
  level_name         = 'Eco Explorer',
  points             = 2847,
  next_level_at      = 3000,
  points_this_week   = 184,
  co2_saved_total_kg = 412,
  co2_saved_month_kg = 38.2,
  off_peak_trips     = 4,
  trips_count        = 9,
  city               = coalesce(city, 'Munich, DE'),
  updated_at         = now();


------------------------------------------------------------
-- 2. Unlock 6 badges + 1 in-progress
------------------------------------------------------------

with me as (select id from public.profiles limit 1)
insert into public.user_badges (user_id, badge_id, unlocked_at)
select me.id, b.badge_id, now() - (b.days_ago || ' days')::interval
from me, (values
  ('low-carbon-pioneer', 18),
  ('off-peak-hero',      29),
  ('bike-champ',         39),
  ('rail-romantic',      46),
  ('plant-powered',      54),
  ('green-sleeper',      64)
) as b(badge_id, days_ago)
on conflict (user_id, badge_id) do nothing;

with me as (select id from public.profiles limit 1)
insert into public.user_badges (user_id, badge_id, unlocked_at, progress, progress_text)
select me.id, 'no-taxi-ninja', now(), 43, 'Day 3/7' from me
on conflict (user_id, badge_id) do nothing;


------------------------------------------------------------
-- 3. Join active challenge with progress
------------------------------------------------------------

with me as (select id from public.profiles limit 1)
insert into public.user_challenges (user_id, challenge_id, is_active, joined_at, progress)
select me.id,
       'c2',
       true,
       now() - interval '3 days',
       '{"count": 0, "target": 1}'::jsonb
from me
on conflict (user_id, challenge_id) do nothing;


------------------------------------------------------------
-- 4. Recent activity feed
------------------------------------------------------------

with me as (select id from public.profiles limit 1)
insert into public.user_activity
  (user_id, activity_type, emoji, title, detail, points_earned, co2_saved_kg, background_tone, created_at)
select me.id, 'transport',      '🚆', 'Train booked',    'Munich → Salzburg',         8,  18, 'forest', now() - interval '12 minutes' from me
union all
select me.id, 'eco_checkin',    '🥗', 'Eco-checkin',     'at Tian (vegan)',           1,  0,  'moss',   now() - interval '1 day'      from me
union all
select me.id, 'badge_unlocked', '🏅', 'Badge unlocked',  'Low-Carbon Pioneer',        50, 0,  'gold',   now() - interval '3 days'     from me
union all
select me.id, 'stay',           '🏨', 'Stayed at',       'Hotel Hubertus (GreenKey)', 5,  0,  'forest', now() - interval '4 days'     from me;


------------------------------------------------------------
-- 5. Leaderboard seed (Munich community)
------------------------------------------------------------

create table if not exists public.leaderboard_seed (
  id                  text primary key,
  first_name          text not null,
  city                text default 'Munich, DE',
  level_name          text,
  points              int not null default 0,
  points_this_week    int not null default 0,
  co2_saved_total_kg  numeric default 0,
  co2_saved_month_kg  numeric default 0,
  created_at          timestamptz not null default now()
);

alter table public.leaderboard_seed enable row level security;

drop policy if exists "Public read on leaderboard_seed" on public.leaderboard_seed;
create policy "Public read on leaderboard_seed"
  on public.leaderboard_seed for select using (true);

insert into public.leaderboard_seed
  (id, first_name, level_name, points, points_this_week, co2_saved_total_kg, co2_saved_month_kg)
values
  ('sophie_a',  'Sophie Albrecht', 'Trail Legend',    12500, 3420, 580, 52),
  ('lukas_m',   'Lukas Maier',     'Eco Pathfinder',  11200, 2990, 510, 38),
  ('jana_k',    'Jana Kraus',      'Eco Explorer',    10800, 2776, 488, 24),
  ('felix_b',   'Felix Bauer',     'Eco Explorer',    10400, 2602, 462, 42),
  ('mira_s',    'Mira Singh',      'Eco Explorer',     9800, 2488, 415, 31),
  ('anton_w',   'Anton Weber',     'Eco Explorer',     9600, 2401, 398, 28),
  ('elena_r',   'Elena Romano',    'Eco Pathfinder',   9300, 2310, 376, 22),
  ('henrik_o',  'Henrik Olsen',    'Eco Pathfinder',   8900, 2205, 348, 18)
on conflict (id) do nothing;
