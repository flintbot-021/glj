-- Fixed knockout slots per round: QF 1–4, SF 1–2, Final 1

alter table public.knockout_fixtures
  add column if not exists slot_index integer not null default 1;

-- Trim overflow rows (keeps newest by created_at within each season + round)
with ranked as (
  select
    id,
    row_number() over (
      partition by season_id, round
      order by created_at desc
    ) as rn,
    round
  from public.knockout_fixtures
)
delete from public.knockout_fixtures k
using ranked r
where k.id = r.id
  and (
    (r.round = 'qf' and r.rn > 4)
    or (r.round = 'sf' and r.rn > 2)
    or (r.round = 'final' and r.rn > 1)
  );

-- Stable slot order: oldest first within each season + round
with numbered as (
  select
    id,
    row_number() over (
      partition by season_id, round
      order by created_at asc
    ) as rn
  from public.knockout_fixtures
)
update public.knockout_fixtures k
set slot_index = numbered.rn
from numbered
where k.id = numbered.id;

create unique index if not exists knockout_fixtures_season_round_slot_idx
  on public.knockout_fixtures (season_id, round, slot_index);

alter table public.knockout_fixtures
  add constraint knockout_slot_bounds check (
    (round = 'qf' and slot_index between 1 and 4)
    or (round = 'sf' and slot_index between 1 and 2)
    or (round = 'final' and slot_index = 1)
  );
