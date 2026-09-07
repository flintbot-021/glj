-- Production is missing slot_index even though 20260415160000 is in history.
-- Restore so QF/SF/Final slots can be inserted during the playoff draw.

alter table public.knockout_fixtures
  add column if not exists slot_index integer not null default 1;

create unique index if not exists knockout_fixtures_season_round_slot_idx
  on public.knockout_fixtures (season_id, round, slot_index);

alter table public.knockout_fixtures
  drop constraint if exists knockout_slot_bounds;

alter table public.knockout_fixtures
  add constraint knockout_slot_bounds check (
    (round = 'qf' and slot_index between 1 and 4)
    or (round = 'sf' and slot_index between 1 and 2)
    or (round = 'final' and slot_index = 1)
  );

notify pgrst, 'reload schema';
