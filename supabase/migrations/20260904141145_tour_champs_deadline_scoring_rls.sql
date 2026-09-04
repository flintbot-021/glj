-- Tour Champs pick deadline + allow live scoring from any signed-in player.

alter table public.tour_events
  add column if not exists champs_deadline timestamptz;

update public.tour_events
  set champs_deadline = '2026-09-10 08:00:00+00'
  where champs_deadline is null;

comment on column public.tour_events.champs_deadline is
  'Tour Champs picks lock at this instant (Thu 10:00 SAST = 08:00 UTC for Winelands 2026).';

drop policy if exists "Tour hole scores write admin" on public.tour_hole_scores;

create policy "Tour hole scores insert authenticated"
  on public.tour_hole_scores for insert to authenticated
  with check (true);

create policy "Tour hole scores update authenticated"
  on public.tour_hole_scores for update to authenticated
  using (true)
  with check (true);
