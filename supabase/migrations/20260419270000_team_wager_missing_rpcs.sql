-- Create team wager RPCs that were missing (table was applied manually, functions weren't).

create or replace function public.accept_team_wager (p_team_wager_id uuid)
returns public.team_wagers
language plpgsql
security definer
set search_path = public
as $$
declare
  tw public.team_wagers;
  uid uuid := auth.uid();
begin
  select * into tw from public.team_wagers where id = p_team_wager_id for update;
  if not found then
    raise exception 'Team wager not found';
  end if;
  if uid is null or uid not in (tw.team_b_p1, tw.team_b_p2) then
    raise exception 'Only a player on the challenged team can accept';
  end if;
  if tw.status <> 'pending_acceptance' then
    raise exception 'This challenge is not pending';
  end if;

  update public.team_wagers
  set status = 'active'
  where id = p_team_wager_id
  returning * into tw;

  return tw;
end;
$$;

create or replace function public.dispute_team_wager_outcome (p_team_wager_id uuid)
returns public.team_wagers
language plpgsql
security definer
set search_path = public
as $$
declare
  tw public.team_wagers;
  uid uuid := auth.uid();
begin
  select * into tw from public.team_wagers where id = p_team_wager_id for update;
  if not found then
    raise exception 'Team wager not found';
  end if;
  if uid is null or uid not in (tw.team_a_p1, tw.team_a_p2, tw.team_b_p1, tw.team_b_p2) then
    raise exception 'Not a participant';
  end if;
  if tw.status <> 'pending_confirmation' then
    raise exception 'Can only dispute while awaiting confirmation';
  end if;

  update public.team_wagers
  set
    status = 'disputed',
    team_a_confirmed = false,
    team_b_confirmed = false
  where id = p_team_wager_id
  returning * into tw;

  return tw;
end;
$$;

create or replace function public.reopen_disputed_team_wager (p_team_wager_id uuid)
returns public.team_wagers
language plpgsql
security definer
set search_path = public
as $$
declare
  tw public.team_wagers;
  uid uuid := auth.uid();
begin
  select * into tw from public.team_wagers where id = p_team_wager_id for update;
  if not found then
    raise exception 'Team wager not found';
  end if;
  if uid is null or uid not in (tw.team_a_p1, tw.team_a_p2, tw.team_b_p1, tw.team_b_p2) then
    raise exception 'Not a participant';
  end if;
  if tw.status <> 'disputed' then
    raise exception 'Not disputed';
  end if;

  update public.team_wagers
  set
    status = 'active',
    result_winner_team = null,
    result_margin = null,
    result_course = null,
    result_played_at = null,
    team_a_confirmed = false,
    team_b_confirmed = false,
    settled_at = null
  where id = p_team_wager_id
  returning * into tw;

  return tw;
end;
$$;

grant execute on function public.accept_team_wager(uuid) to authenticated;
grant execute on function public.dispute_team_wager_outcome(uuid) to authenticated;
grant execute on function public.reopen_disputed_team_wager(uuid) to authenticated;
