-- App wiring: client-safe tour scoring + decline pending wagers + larger tour bracket

-- Tour can include more than 16 seeded players (e.g. full RTD roster)
do $$
declare
  cname text;
begin
  select con.conname into cname
  from pg_constraint con
  join pg_class rel on rel.oid = con.conrelid
  where rel.relname = 'tour_players'
    and rel.relnamespace = (select oid from pg_namespace where nspname = 'public')
    and con.contype = 'c'
    and pg_get_constraintdef(con.oid) ilike '%seed%';
  if cname is not null then
    execute format('alter table public.tour_players drop constraint %I', cname);
  end if;
end $$;

alter table public.tour_players
  add constraint tour_players_seed_range check (seed between 1 and 32);

-- Players may record their own hole scores (tour_player belongs to auth user)
create policy "Tour hole scores insert own"
  on public.tour_hole_scores for insert to authenticated
  with check (
    exists (
      select 1 from public.tour_players tp
      where tp.id = tour_player_id and tp.player_id = auth.uid()
    )
  );

create policy "Tour hole scores update own"
  on public.tour_hole_scores for update to authenticated
  using (
    exists (
      select 1 from public.tour_players tp
      where tp.id = tour_player_id and tp.player_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.tour_players tp
      where tp.id = tour_player_id and tp.player_id = auth.uid()
    )
  );

-- Opponent or proposer can remove a wager still awaiting acceptance (decline)
create policy "Wagers delete pending participation"
  on public.wagers for delete to authenticated
  using (
    status = 'pending_acceptance'
    and auth.uid() in (proposer_id, opponent_id)
  );
