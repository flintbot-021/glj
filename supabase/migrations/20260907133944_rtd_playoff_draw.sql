-- RTD playoff draw: 8 qualifiers in 4 pots, placed into 8 QF slots.

create table public.playoff_draws (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  status text not null default 'setup'
    check (status in ('setup', 'drawing', 'complete')),
  phase text not null default 'setup'
    check (phase in ('setup', 'await_spin', 'revealed', 'complete')),
  current_spinner_id uuid references public.profiles (id) on delete set null,
  last_assigned_slot text
    check (
      last_assigned_slot is null
      or last_assigned_slot in (
        'qf1_a', 'qf1_b', 'qf2_a', 'qf2_b',
        'qf3_a', 'qf3_b', 'qf4_a', 'qf4_b'
      )
    ),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint playoff_draws_season_unique unique (season_id)
);

create table public.playoff_entries (
  id uuid primary key default gen_random_uuid(),
  draw_id uuid not null references public.playoff_draws (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  pot smallint not null check (pot between 1 and 4),
  slot_key text
    check (
      slot_key is null
      or slot_key in (
        'qf1_a', 'qf1_b', 'qf2_a', 'qf2_b',
        'qf3_a', 'qf3_b', 'qf4_a', 'qf4_b'
      )
    ),
  drawn_at timestamptz,
  constraint playoff_entries_player_unique unique (draw_id, player_id)
);

create unique index playoff_entries_slot_unique
  on public.playoff_entries (draw_id, slot_key)
  where slot_key is not null;

create index playoff_entries_draw_idx on public.playoff_entries (draw_id);

alter table public.playoff_draws enable row level security;
alter table public.playoff_entries enable row level security;

create policy "Playoff draws read"
  on public.playoff_draws for select to authenticated
  using (true);

create policy "Playoff draws admin write"
  on public.playoff_draws for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "Playoff entries read"
  on public.playoff_entries for select to authenticated
  using (true);

create policy "Playoff entries admin write"
  on public.playoff_entries for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());
