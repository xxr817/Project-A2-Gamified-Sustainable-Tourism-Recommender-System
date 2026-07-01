-- Cleanup removed challenges and rename Plant-Based Weekend.
-- Run this once against an existing Supabase project.

update public.challenges
set
  name = 'Plant-Based Meals',
  detail = 'Choose 3 plant-based meals during your trip.',
  duration = 'trip'
where id = 'c1';

delete from public.challenges
where id in ('green-commuter-week', 'c4', 'c5');

delete from public.badges
where id = 'no-taxi-ninja';
