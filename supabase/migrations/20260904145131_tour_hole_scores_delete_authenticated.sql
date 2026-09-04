-- Allow any signed-in player to clear a hole score (live scoring can go back to 0).

drop policy if exists "Tour hole scores delete authenticated" on public.tour_hole_scores;

create policy "Tour hole scores delete authenticated"
  on public.tour_hole_scores for delete to authenticated
  using (true);
