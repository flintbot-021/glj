-- Tour match: optional side wager + card confirmation (settle without counterparty confirm).

alter table public.tour_matches
  add column if not exists wager_amount numeric(10, 2),
  add column if not exists wager_created_by uuid references public.profiles (id),
  add column if not exists card_confirmed_at timestamptz,
  add column if not exists wager_settled_at timestamptz;

comment on column public.tour_matches.wager_amount is
  'Optional stake per player on the losing side (winners each receive the same). Null = no wager. Half = no wallet move.';
comment on column public.tour_matches.card_confirmed_at is
  'Set when the full 18-hole card is confirmed; match status becomes complete and wager may settle.';

create or replace function public.set_tour_match_wager(p_match_id uuid, p_amount numeric)
returns public.tour_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.tour_matches;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_amount is null or p_amount <= 0 then
    raise exception 'Wager amount must be greater than zero';
  end if;

  select * into v_row from public.tour_matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;
  if v_row.card_confirmed_at is not null then
    raise exception 'Match card already confirmed';
  end if;
  if v_row.wager_settled_at is not null then
    raise exception 'Wager already settled';
  end if;

  if not public.is_admin() and not exists (
    select 1
    from public.tour_match_players mp
    join public.tour_players tp on tp.id = mp.tour_player_id
    where mp.match_id = p_match_id and tp.player_id = v_uid
  ) then
    raise exception 'Only match players can set a wager';
  end if;

  if exists (
    select 1 from public.tour_hole_scores hs
    where hs.match_id = p_match_id and hs.gross_score >= 1
  ) then
    raise exception 'Wager must be set before scoring starts';
  end if;

  update public.tour_matches
  set wager_amount = round(p_amount, 2),
      wager_created_by = v_uid
  where id = p_match_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.clear_tour_match_wager(p_match_id uuid)
returns public.tour_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.tour_matches;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row from public.tour_matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;
  if v_row.card_confirmed_at is not null or v_row.wager_settled_at is not null then
    raise exception 'Cannot clear wager after confirm';
  end if;

  if not public.is_admin() and not exists (
    select 1
    from public.tour_match_players mp
    join public.tour_players tp on tp.id = mp.tour_player_id
    where mp.match_id = p_match_id and tp.player_id = v_uid
  ) then
    raise exception 'Only match players can clear a wager';
  end if;

  if exists (
    select 1 from public.tour_hole_scores hs
    where hs.match_id = p_match_id and hs.gross_score >= 1
  ) then
    raise exception 'Cannot clear wager after scoring starts';
  end if;

  update public.tour_matches
  set wager_amount = null,
      wager_created_by = null
  where id = p_match_id
  returning * into v_row;

  return v_row;
end;
$$;

create or replace function public.confirm_tour_match_card(p_match_id uuid)
returns public.tour_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.tour_matches;
  v_player_ids uuid[];
  v_profile_ids uuid[];
  v_team_a_profiles uuid[];
  v_team_b_profiles uuid[];
  v_pid uuid;
  v_h int;
  v_amt numeric(10, 2);
  v_winner_team text;
  v_half boolean;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row from public.tour_matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;
  if v_row.card_confirmed_at is not null then
    return v_row;
  end if;

  if not public.is_admin() and not exists (
    select 1
    from public.tour_match_players mp
    join public.tour_players tp on tp.id = mp.tour_player_id
    where mp.match_id = p_match_id and tp.player_id = v_uid
  ) then
    raise exception 'Only match players can confirm the card';
  end if;

  select array_agg(mp.tour_player_id order by mp.pair_index)
    into v_player_ids
  from public.tour_match_players mp
  where mp.match_id = p_match_id;

  if v_player_ids is null or coalesce(array_length(v_player_ids, 1), 0) = 0 then
    raise exception 'Match has no players';
  end if;

  foreach v_pid in array v_player_ids loop
    for v_h in 1..18 loop
      if not exists (
        select 1 from public.tour_hole_scores hs
        where hs.match_id = p_match_id
          and hs.tour_player_id = v_pid
          and hs.hole_number = v_h
          and hs.gross_score >= 1
      ) then
        raise exception 'All 18 holes must be scored for every player before confirm';
      end if;
    end loop;
  end loop;

  -- Team points must already reflect a decided match (set by client rollup).
  if coalesce(v_row.team_a_points, 0) = 0 and coalesce(v_row.team_b_points, 0) = 0 then
    raise exception 'Match is not decided yet';
  end if;

  v_half := (v_row.team_a_points = v_row.team_b_points);
  if v_row.team_a_points > v_row.team_b_points then
    v_winner_team := v_row.team_a;
  elsif v_row.team_b_points > v_row.team_a_points then
    v_winner_team := v_row.team_b;
  else
    v_winner_team := null;
  end if;

  update public.tour_matches
  set card_confirmed_at = now(),
      status = 'complete'
  where id = p_match_id
  returning * into v_row;

  -- Settle optional wager (no counterparty confirm). Half = refund (no transfer).
  if v_row.wager_amount is not null and v_row.wager_settled_at is null then
    v_amt := v_row.wager_amount;

    select array_agg(tp.player_id order by mp.pair_index)
      into v_team_a_profiles
    from public.tour_match_players mp
    join public.tour_players tp on tp.id = mp.tour_player_id
    where mp.match_id = p_match_id and mp.team = v_row.team_a;

    select array_agg(tp.player_id order by mp.pair_index)
      into v_team_b_profiles
    from public.tour_match_players mp
    join public.tour_players tp on tp.id = mp.tour_player_id
    where mp.match_id = p_match_id and mp.team = v_row.team_b;

    if not v_half and v_winner_team is not null then
      if v_winner_team = v_row.team_a then
        foreach v_pid in array coalesce(v_team_a_profiles, array[]::uuid[]) loop
          update public.profiles set wallet_balance = wallet_balance + v_amt where id = v_pid;
          insert into public.wallet_transactions (player_id, amount, type, reference_id, note)
          values (v_pid, v_amt, 'wager_win', p_match_id, 'Tour match wager');
        end loop;
        foreach v_pid in array coalesce(v_team_b_profiles, array[]::uuid[]) loop
          update public.profiles set wallet_balance = wallet_balance - v_amt where id = v_pid;
          insert into public.wallet_transactions (player_id, amount, type, reference_id, note)
          values (v_pid, -v_amt, 'wager_loss', p_match_id, 'Tour match wager');
        end loop;
      else
        foreach v_pid in array coalesce(v_team_b_profiles, array[]::uuid[]) loop
          update public.profiles set wallet_balance = wallet_balance + v_amt where id = v_pid;
          insert into public.wallet_transactions (player_id, amount, type, reference_id, note)
          values (v_pid, v_amt, 'wager_win', p_match_id, 'Tour match wager');
        end loop;
        foreach v_pid in array coalesce(v_team_a_profiles, array[]::uuid[]) loop
          update public.profiles set wallet_balance = wallet_balance - v_amt where id = v_pid;
          insert into public.wallet_transactions (player_id, amount, type, reference_id, note)
          values (v_pid, -v_amt, 'wager_loss', p_match_id, 'Tour match wager');
        end loop;
      end if;
    end if;

    update public.tour_matches
    set wager_settled_at = now()
    where id = p_match_id
    returning * into v_row;
  end if;

  return v_row;
end;
$$;

revoke all on function public.set_tour_match_wager(uuid, numeric) from public;
revoke all on function public.clear_tour_match_wager(uuid) from public;
revoke all on function public.confirm_tour_match_card(uuid) from public;
grant execute on function public.set_tour_match_wager(uuid, numeric) to authenticated;
grant execute on function public.clear_tour_match_wager(uuid) to authenticated;
grant execute on function public.confirm_tour_match_card(uuid) to authenticated;
