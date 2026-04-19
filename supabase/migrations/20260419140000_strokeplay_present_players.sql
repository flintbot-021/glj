-- Who was present for this strokeplay round (for validation / disputes).
alter table public.strokeplay_rounds
  add column if not exists present_player_ids uuid[] not null default '{}';

update public.strokeplay_rounds
set present_player_ids = array[player_id]
where coalesce(array_length(present_player_ids, 1), 0) = 0;

alter table public.strokeplay_rounds
  add constraint strokeplay_rounds_present_players_nonempty
  check (coalesce(array_length(present_player_ids, 1), 0) >= 1);

comment on column public.strokeplay_rounds.present_player_ids is
  'Players present for this round; must include at least one (typically includes scorer).';
