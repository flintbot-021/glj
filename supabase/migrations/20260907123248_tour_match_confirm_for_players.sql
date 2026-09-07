-- Confirm / wager: only players in the match. Result is computed from hole scores
-- (not from client-written tour_matches.team_*_points, which RLS blocked for non-admins).

create or replace function public.tour_uid_in_match(p_match_id uuid, p_uid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.tour_match_players mp
    join public.tour_players tp on tp.id = mp.tour_player_id
    where mp.match_id = p_match_id and tp.player_id = p_uid
  );
$$;

create or replace function public.tour_side_hole_value(
  p_match_id uuid,
  p_player_ids uuid[],
  p_hole int,
  p_par int,
  p_mode text,
  p_compare text,
  p_par3 text,
  p_par4 text,
  p_par5 text
)
returns numeric
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_id uuid;
  v_v numeric;
  v_values numeric[] := '{}';
  v_combine text;
  v_prod numeric;
  v_n int;
begin
  if p_player_ids is null or coalesce(array_length(p_player_ids, 1), 0) = 0 then
    return null;
  end if;

  foreach v_id in array p_player_ids loop
    if p_compare = 'lower_net' then
      select hs.net_score into v_v
      from public.tour_hole_scores hs
      where hs.match_id = p_match_id
        and hs.tour_player_id = v_id
        and hs.hole_number = p_hole;
    else
      select hs.stableford_points into v_v
      from public.tour_hole_scores hs
      where hs.match_id = p_match_id
        and hs.tour_player_id = v_id
        and hs.hole_number = p_hole;
    end if;
    if v_v is not null then
      v_values := v_values || v_v;
    end if;
  end loop;

  v_n := coalesce(array_length(v_values, 1), 0);
  if v_n = 0 then
    return null;
  end if;

  if p_mode = 'by_par' then
    v_combine := case p_par
      when 3 then coalesce(nullif(p_par3, ''), 'sum')
      when 4 then coalesce(nullif(p_par4, ''), 'better_ball')
      when 5 then coalesce(nullif(p_par5, ''), 'product')
      else 'better_ball'
    end;
  elsif p_mode = 'better_ball' then
    v_combine := 'better_ball';
  else
    v_combine := 'sum';
  end if;

  if v_combine = 'better_ball' then
    return (select max(x) from unnest(v_values) as t(x));
  end if;

  if v_n < coalesce(array_length(p_player_ids, 1), 0) then
    return null;
  end if;

  if v_combine = 'product' then
    v_prod := 1;
    foreach v_v in array v_values loop
      v_prod := v_prod * v_v;
    end loop;
    return v_prod;
  end if;

  return (select sum(x) from unnest(v_values) as t(x));
end;
$$;

create or replace function public.tour_match_compute_result(p_match_id uuid)
returns table (points_a numeric, points_b numeric, decided boolean, holes_played int)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_match public.tour_matches;
  v_rules jsonb;
  v_course_id uuid;
  v_mode text;
  v_compare text;
  v_par3 text;
  v_par4 text;
  v_par5 text;
  v_ids_a uuid[];
  v_ids_b uuid[];
  v_n int;
  v_par int;
  v_a numeric;
  v_b numeric;
  v_a_wins int := 0;
  v_b_wins int := 0;
  v_played int := 0;
  v_decided boolean := false;
  v_remaining int;
  v_lead int;
  v_points_a numeric := 0;
  v_points_b numeric := 0;
  v_preset text;
  v_agg text;
  v_win text;
begin
  select * into v_match from public.tour_matches where id = p_match_id;
  if not found then
    raise exception 'Match not found';
  end if;

  select f.scoring_rules, d.course_id
    into v_rules, v_course_id
  from public.tour_days d
  join public.tour_formats f on f.id = d.format_id
  where d.id = v_match.tour_day_id;

  v_rules := coalesce(v_rules, '{}'::jsonb);
  v_preset := v_rules->>'preset';
  v_agg := v_rules->>'team_aggregation';
  v_win := v_rules->>'hole_win';

  if v_preset = 'mixed_par_stableford' or v_agg = 'by_par' then
    v_mode := 'by_par';
    v_compare := 'higher';
    v_par3 := coalesce(v_rules->'par_rules'->>'3', 'sum');
    v_par4 := coalesce(v_rules->'par_rules'->>'4', 'better_ball');
    v_par5 := coalesce(v_rules->'par_rules'->>'5', 'product');
  elsif v_preset = 'singles_matchplay' or v_win = 'lower_net' then
    v_mode := 'individual';
    v_compare := 'lower_net';
    v_par3 := 'better_ball';
    v_par4 := 'better_ball';
    v_par5 := 'better_ball';
  elsif v_preset = 'singles_stableford' or v_agg = 'individual' then
    v_mode := 'individual';
    v_compare := 'higher';
    v_par3 := 'better_ball';
    v_par4 := 'better_ball';
    v_par5 := 'better_ball';
  else
    v_mode := 'better_ball';
    v_compare := 'higher';
    v_par3 := 'better_ball';
    v_par4 := 'better_ball';
    v_par5 := 'better_ball';
  end if;

  select array_agg(mp.tour_player_id order by mp.pair_index)
    into v_ids_a
  from public.tour_match_players mp
  where mp.match_id = p_match_id and mp.team = v_match.team_a;

  select array_agg(mp.tour_player_id order by mp.pair_index)
    into v_ids_b
  from public.tour_match_players mp
  where mp.match_id = p_match_id and mp.team = v_match.team_b;

  for v_n in 1..18 loop
    select h.par into v_par
    from public.tour_holes h
    where h.course_id = v_course_id and h.hole_number = v_n;
    v_par := coalesce(v_par, 4);

    v_a := public.tour_side_hole_value(
      p_match_id, v_ids_a, v_n, v_par, v_mode, v_compare, v_par3, v_par4, v_par5
    );
    v_b := public.tour_side_hole_value(
      p_match_id, v_ids_b, v_n, v_par, v_mode, v_compare, v_par3, v_par4, v_par5
    );

    if v_a is null or v_b is null or v_decided then
      continue;
    end if;

    if v_a = v_b then
      null;
    elsif v_compare = 'lower_net' then
      if v_a < v_b then v_a_wins := v_a_wins + 1; else v_b_wins := v_b_wins + 1; end if;
    else
      if v_a > v_b then v_a_wins := v_a_wins + 1; else v_b_wins := v_b_wins + 1; end if;
    end if;

    v_played := v_played + 1;
    v_remaining := 18 - v_played;
    v_lead := v_a_wins - v_b_wins;
    if v_remaining = 0 or abs(v_lead) > v_remaining then
      v_decided := true;
    end if;
  end loop;

  v_lead := v_a_wins - v_b_wins;
  if v_decided then
    if v_lead > 0 then
      v_points_a := 1;
      v_points_b := 0;
    elsif v_lead < 0 then
      v_points_a := 0;
      v_points_b := 1;
    else
      v_points_a := 0.5;
      v_points_b := 0.5;
    end if;
  end if;

  points_a := v_points_a;
  points_b := v_points_b;
  decided := v_decided;
  holes_played := v_played;
  return next;
end;
$$;

create or replace function public.rollup_tour_match(p_match_id uuid)
returns public.tour_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.tour_matches;
  v_points_a numeric;
  v_points_b numeric;
  v_decided boolean;
  v_played int;
  v_status text;
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

  select r.points_a, r.points_b, r.decided, r.holes_played
    into v_points_a, v_points_b, v_decided, v_played
  from public.tour_match_compute_result(p_match_id) r;

  v_status := case
    when v_played > 0 or v_decided then 'in_progress'
    else 'scheduled'
  end;

  update public.tour_matches
  set status = v_status,
      team_a_points = coalesce(v_points_a, 0),
      team_b_points = coalesce(v_points_b, 0)
  where id = p_match_id
  returning * into v_row;

  return v_row;
end;
$$;

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

  if not public.tour_uid_in_match(p_match_id, v_uid) then
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

  if not public.tour_uid_in_match(p_match_id, v_uid) then
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
  v_team_a_profiles uuid[];
  v_team_b_profiles uuid[];
  v_pid uuid;
  v_h int;
  v_amt numeric(10, 2);
  v_winner_team text;
  v_half boolean;
  v_points_a numeric;
  v_points_b numeric;
  v_decided boolean;
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

  if not public.tour_uid_in_match(p_match_id, v_uid) then
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

  select r.points_a, r.points_b, r.decided
    into v_points_a, v_points_b, v_decided
  from public.tour_match_compute_result(p_match_id) r;

  if not coalesce(v_decided, false) then
    raise exception 'Match is not decided yet';
  end if;

  v_half := (v_points_a = v_points_b);
  if v_points_a > v_points_b then
    v_winner_team := v_row.team_a;
  elsif v_points_b > v_points_a then
    v_winner_team := v_row.team_b;
  else
    v_winner_team := null;
  end if;

  update public.tour_matches
  set card_confirmed_at = now(),
      status = 'complete',
      team_a_points = v_points_a,
      team_b_points = v_points_b
  where id = p_match_id
  returning * into v_row;

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

revoke all on function public.tour_uid_in_match(uuid, uuid) from public;
revoke all on function public.tour_side_hole_value(uuid, uuid[], int, int, text, text, text, text, text) from public;
revoke all on function public.tour_match_compute_result(uuid) from public;
revoke all on function public.rollup_tour_match(uuid) from public;
revoke all on function public.set_tour_match_wager(uuid, numeric) from public;
revoke all on function public.clear_tour_match_wager(uuid) from public;
revoke all on function public.confirm_tour_match_card(uuid) from public;

grant execute on function public.tour_match_compute_result(uuid) to authenticated;
grant execute on function public.rollup_tour_match(uuid) to authenticated;
grant execute on function public.set_tour_match_wager(uuid, numeric) to authenticated;
grant execute on function public.clear_tour_match_wager(uuid) to authenticated;
grant execute on function public.confirm_tour_match_card(uuid) to authenticated;
