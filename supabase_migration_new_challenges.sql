-- ============================================================================
--  New auto-tracked challenges (c7–c10) — one per Plan tab.
--  Run ONCE in Supabase → SQL Editor. Safe to re-run (idempotent).
--  Pairs with src/achievements.js CHALLENGE_DEFS (added 2026-07-03):
--    c7  -> activity x2   c8 -> food x1   c9 -> transport x1   c10 -> stay x1
-- ============================================================================

insert into public.challenges (id, emoji, name, detail, reward, duration) values
  ('c7',  '🎯', 'Green Explorer', 'Log 2 low-impact activities on your trip.',            25, 'trip'),
  ('c8',  '🥗', 'Veggie Voyager', 'Enjoy 1 plant-based meal on your trip.',               15, 'trip'),
  ('c9',  '🚆', 'Rail Rookie',    'Choose 1 low-carbon transport option.',                20, 'trip'),
  ('c10', '🏨', 'Eco Sleeper',    'Book 1 eco-certified (GreenKey / EU-Ecolabel) stay.',  20, 'trip')
on conflict (id) do update
  set emoji    = excluded.emoji,
      name     = excluded.name,
      detail   = excluded.detail,
      reward   = excluded.reward,
      duration = excluded.duration;

-- Verify what the app will now show:
-- select id, name, reward, duration from public.challenges order by id;
