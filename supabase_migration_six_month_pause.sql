-- Adds the auto-tracked challenge for going six months without a travel action.
-- Run once in Supabase -> SQL Editor. Safe to re-run.

insert into public.challenges (id, emoji, name, detail, reward, duration) values
  ('c11', '⏸️', 'Six-Month Travel Pause',
   'Go 6 months without selecting transport, stays, food, or activities. Any new selection restarts the timer.',
   300, 'six months')
on conflict (id) do update
  set emoji = excluded.emoji,
      name = excluded.name,
      detail = excluded.detail,
      reward = excluded.reward,
      duration = excluded.duration;
