-- Course handicap can change by day (different courses / slopes). Stored per tour_day + tour_player.

create table public.tour_player_day_handicaps (
  id uuid primary key default gen_random_uuid(),
  tour_day_id uuid not null references public.tour_days (id) on delete cascade,
  tour_player_id uuid not null references public.tour_players (id) on delete cascade,
  course_handicap numeric(4, 1) not null,
  created_at timestamptz not null default now (),
  unique (tour_day_id, tour_player_id)
);

create index idx_tp_day_hc_day on public.tour_player_day_handicaps (tour_day_id);
create index idx_tp_day_hc_player on public.tour_player_day_handicaps (tour_player_id);

alter table public.tour_player_day_handicaps enable row level security;

create policy "Tour player day handicaps read"
  on public.tour_player_day_handicaps for select to authenticated using (true);

create policy "Tour player day handicaps write admin"
  on public.tour_player_day_handicaps for all to authenticated using (public.is_admin ())
  with check (public.is_admin ());

comment on table public.tour_player_day_handicaps is 'Playing / course handicap for each player on each tour day (overrides tour_players.locked_handicap for that day).';
