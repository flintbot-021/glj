-- Idempotent repair when remote (or a branch DB) missed earlier migrations.
-- Ensures course_handicap (renamed from handicap_used) and present_player_ids exist.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'strokeplay_rounds' and column_name = 'handicap_used'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'strokeplay_rounds' and column_name = 'course_handicap'
  ) then
    alter table public.strokeplay_rounds rename column handicap_used to course_handicap;
  end if;
end $$;

comment on column public.strokeplay_rounds.course_handicap is
  'Course handicap for this round (entered when submitting the score).';

alter table public.strokeplay_rounds
  add column if not exists present_player_ids uuid[] not null default '{}';

update public.strokeplay_rounds
set present_player_ids = array[player_id]
where coalesce(array_length(present_player_ids, 1), 0) = 0;

alter table public.strokeplay_rounds drop constraint if exists strokeplay_rounds_present_players_nonempty;
alter table public.strokeplay_rounds
  add constraint strokeplay_rounds_present_players_nonempty
  check (coalesce(array_length(present_player_ids, 1), 0) >= 1);

comment on column public.strokeplay_rounds.present_player_ids is
  'Players present for this round; must include at least one (typically includes scorer).';
