-- EcoTrail database schema
-- TUM Lab Course: Recommender Systems SS2026, Project A2

------------------------------------------------------------
-- Reference tables
------------------------------------------------------------

create table public.transport_modes (
  id                 text primary key,
  mode               text not null,
  emoji              text,
  co2_grams_per_km   numeric not null default 0,
  relative_emission  numeric not null default 0,
  tone               text,
  created_at         timestamptz not null default now()
);

create table public.destinations (
  id             text primary key,
  name           text not null,
  country        text,
  tag            text,
  points_reward  int  not null default 0,
  green_score    int  not null default 0,
  nights         int,
  from_price     text,
  crowd_level    int,
  gradient       text,
  detail         text,
  created_at     timestamptz not null default now()
);

create table public.transport_options (
  id              text primary key,
  destination_id  text references public.destinations(id) on delete cascade,
  emoji           text,
  title           text not null,
  tag             text,
  points_reward   int not null default 0,
  detail          text,
  duration        text,
  price           text,
  co2             text,
  co2_kg          numeric,
  green_score     int,
  tone            text,
  why             text,
  warning         text,
  created_at      timestamptz not null default now()
);

create table public.stays (
  id              text primary key,
  destination_id  text references public.destinations(id) on delete cascade,
  name            text not null,
  certification   text,
  district        text,
  price           text,
  green_score     int,
  gradient        text,
  created_at      timestamptz not null default now()
);

create table public.eats (
  id              text primary key,
  destination_id  text references public.destinations(id) on delete cascade,
  emoji           text,
  name            text not null,
  district        text,
  tags            text[],
  price_tier      text,
  green_score     int,
  created_at      timestamptz not null default now()
);

create table public.activities (
  id              text primary key,
  destination_id  text references public.destinations(id) on delete cascade,
  name            text not null,
  tag             text,
  points_reward   int not null default 0,
  detail          text,
  crowd_level     int,
  green_score     int,
  gradient        text,
  warning         boolean default false,
  created_at      timestamptz not null default now()
);

create table public.challenges (
  id          text primary key,
  emoji       text,
  name        text not null,
  detail      text,
  reward      int not null default 0,
  duration    text,
  created_at  timestamptz not null default now()
);

create table public.badges (
  id                text primary key,
  emoji             text,
  name              text not null,
  detail            text,
  unlock_criteria   text,
  created_at        timestamptz not null default now()
);


------------------------------------------------------------
-- User tables
------------------------------------------------------------

create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  first_name          text,
  email               text,
  city                text,
  avatar_url          text,
  level               int not null default 1,
  level_name          text not null default 'Eco Beginner',
  points              int not null default 0,
  next_level_at       int not null default 100,
  co2_saved_month_kg  numeric not null default 0,
  co2_saved_total_kg  numeric not null default 0,
  points_this_week    int not null default 0,
  off_peak_trips      int not null default 0,
  trips_count         int not null default 0,
  join_date           timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

create table public.user_badges (
  id            bigserial primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  badge_id      text not null references public.badges(id) on delete cascade,
  unlocked_at   timestamptz not null default now(),
  progress      int not null default 100,
  progress_text text,
  unique (user_id, badge_id)
);
create index on public.user_badges (user_id);

create table public.user_challenges (
  id            bigserial primary key,
  user_id       uuid not null references public.profiles(id) on delete cascade,
  challenge_id  text not null references public.challenges(id) on delete cascade,
  joined_at     timestamptz not null default now(),
  progress      jsonb,
  is_active     boolean not null default true,
  completed_at  timestamptz,
  unique (user_id, challenge_id)
);
create index on public.user_challenges (user_id);

create table public.trips (
  id                    bigserial primary key,
  user_id               uuid not null references public.profiles(id) on delete cascade,
  destination_id        text references public.destinations(id),
  start_date            date,
  end_date              date,
  status                text not null default 'planned',
  selected_transport_id text references public.transport_options(id),
  selected_stay_id      text references public.stays(id),
  co2_total_kg          numeric,
  points_earned         int default 0,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
create index on public.trips (user_id);

create table public.user_activity (
  id              bigserial primary key,
  user_id         uuid not null references public.profiles(id) on delete cascade,
  activity_type   text not null,
  emoji           text,
  title           text not null,
  detail          text,
  points_earned   int default 0,
  co2_saved_kg    numeric default 0,
  background_tone text,
  created_at      timestamptz not null default now()
);
create index on public.user_activity (user_id, created_at desc);


------------------------------------------------------------
-- Auto-create profile on signup
------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, first_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name',
             split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


------------------------------------------------------------
-- Row Level Security
------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.user_badges       enable row level security;
alter table public.user_challenges   enable row level security;
alter table public.trips             enable row level security;
alter table public.user_activity     enable row level security;
alter table public.transport_modes   enable row level security;
alter table public.destinations      enable row level security;
alter table public.transport_options enable row level security;
alter table public.stays             enable row level security;
alter table public.eats              enable row level security;
alter table public.activities        enable row level security;
alter table public.challenges        enable row level security;
alter table public.badges            enable row level security;

create policy "Public read on transport_modes"   on public.transport_modes   for select using (true);
create policy "Public read on destinations"      on public.destinations      for select using (true);
create policy "Public read on transport_options" on public.transport_options for select using (true);
create policy "Public read on stays"             on public.stays             for select using (true);
create policy "Public read on eats"              on public.eats              for select using (true);
create policy "Public read on activities"        on public.activities        for select using (true);
create policy "Public read on challenges"        on public.challenges        for select using (true);
create policy "Public read on badges"            on public.badges            for select using (true);

create policy "Public read on profiles for leaderboard"
  on public.profiles for select using (true);
create policy "Users can update their own profile"
  on public.profiles for update using (auth.uid() = id);

create policy "Users can view their own badges"
  on public.user_badges for select using (auth.uid() = user_id);
create policy "Users can insert their own badges"
  on public.user_badges for insert with check (auth.uid() = user_id);

create policy "Users can view their own challenges"
  on public.user_challenges for select using (auth.uid() = user_id);
create policy "Users can insert their own challenges"
  on public.user_challenges for insert with check (auth.uid() = user_id);
create policy "Users can update their own challenges"
  on public.user_challenges for update using (auth.uid() = user_id);

create policy "Users can view their own trips"
  on public.trips for select using (auth.uid() = user_id);
create policy "Users can insert their own trips"
  on public.trips for insert with check (auth.uid() = user_id);
create policy "Users can update their own trips"
  on public.trips for update using (auth.uid() = user_id);
create policy "Users can delete their own trips"
  on public.trips for delete using (auth.uid() = user_id);

create policy "Users can view their own activity"
  on public.user_activity for select using (auth.uid() = user_id);
create policy "Users can insert their own activity"
  on public.user_activity for insert with check (auth.uid() = user_id);
create policy "Users can delete their own activity"
  on public.user_activity for delete using (auth.uid() = user_id);
