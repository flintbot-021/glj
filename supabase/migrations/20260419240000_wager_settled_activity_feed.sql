-- When a 1v1 or 2v2 wager settles, add a public activity_feed row (same pattern as matchplay).

create or replace function public._feed_active_season_id ()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $func$
declare
  v_season_id uuid;
begin
  select id
  into v_season_id
  from public.seasons
  where is_active = true
  order by created_at desc
  limit 1;

  if v_season_id is not null then
    return v_season_id;
  end if;

  select id
  into v_season_id
  from public.seasons
  order by year desc, created_at desc
  limit 1;

  return v_season_id;
end;
$func$;

create or replace function public.insert_activity_feed_wager_settled_1v1 (p_wager_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $func$
declare
  w public.wagers;
  v_season_id uuid;
  proposer_name text;
  opp_name text;
  winner_name text;
  desc_txt text;
  meta jsonb;
begin
  select * into w from public.wagers where id = p_wager_id;
  if not found or w.status <> 'settled' then
    return;
  end if;

  v_season_id := public._feed_active_season_id();
  if v_season_id is null then
    return;
  end if;

  select coalesce(nullif(trim(full_name), ''), display_name)
  into proposer_name
  from public.profiles
  where id = w.proposer_id;

  select coalesce(nullif(trim(full_name), ''), display_name)
  into opp_name
  from public.profiles
  where id = w.opponent_id;

  proposer_name := coalesce(proposer_name, '?');
  opp_name := coalesce(opp_name, '?');

  if w.result_winner_id is null then
    desc_txt := format(
      '%s vs %s · Wager halved · R %s stake',
      proposer_name,
      opp_name,
      trim(to_char(w.amount, 'FM999999990.00'))
    );
    meta :=
      jsonb_build_object(
        'wager_id',
        w.id,
        'amount',
        w.amount,
        'halved',
        true,
        'margin',
        w.result_margin,
        'course',
        w.result_course,
        'played_at',
        w.result_played_at
      );
  else
    select coalesce(nullif(trim(full_name), ''), display_name)
    into winner_name
    from public.profiles
    where id = w.result_winner_id;

    winner_name := coalesce(winner_name, '?');
    desc_txt := format(
      '%s vs %s · %s wins · R %s',
      proposer_name,
      opp_name,
      winner_name,
      trim(to_char(w.amount, 'FM999999990.00'))
    );
    if w.result_course is not null and trim(w.result_course) <> '' then
      desc_txt := desc_txt || ' · ' || trim(w.result_course);
    end if;
    meta :=
      jsonb_build_object(
        'wager_id',
        w.id,
        'amount',
        w.amount,
        'winner_id',
        w.result_winner_id,
        'margin',
        w.result_margin,
        'course',
        w.result_course,
        'played_at',
        w.result_played_at
      );
  end if;

  insert into public.activity_feed (season_id, type, actor_id, secondary_actor_id, description, metadata)
  values (v_season_id, 'wager', w.proposer_id, w.opponent_id, desc_txt, meta);
end;
$func$;

create or replace function public.insert_activity_feed_wager_settled_team (p_team_wager_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $func$
declare
  tw public.team_wagers;
  v_season_id uuid;
  a1n text;
  a2n text;
  b1n text;
  b2n text;
  desc_txt text;
  meta jsonb;
  teams_line text;
  winners_line text;
begin
  select * into tw from public.team_wagers where id = p_team_wager_id;
  if not found or tw.status <> 'settled' then
    return;
  end if;

  v_season_id := public._feed_active_season_id();
  if v_season_id is null then
    return;
  end if;

  select coalesce(nullif(trim(full_name), ''), display_name) into a1n from public.profiles where id = tw.team_a_p1;
  select coalesce(nullif(trim(full_name), ''), display_name) into a2n from public.profiles where id = tw.team_a_p2;
  select coalesce(nullif(trim(full_name), ''), display_name) into b1n from public.profiles where id = tw.team_b_p1;
  select coalesce(nullif(trim(full_name), ''), display_name) into b2n from public.profiles where id = tw.team_b_p2;

  a1n := coalesce(a1n, '?');
  a2n := coalesce(a2n, '?');
  b1n := coalesce(b1n, '?');
  b2n := coalesce(b2n, '?');

  teams_line := format('%s & %s vs %s & %s', a1n, a2n, b1n, b2n);

  if tw.result_winner_team is null then
    desc_txt := format(
      '%s · Halved · R %s per loser',
      teams_line,
      trim(to_char(tw.amount, 'FM999999990.00'))
    );
    meta :=
      jsonb_build_object(
        'team_wager_id',
        tw.id,
        'amount',
        tw.amount,
        'halved',
        true,
        'team_wager',
        true,
        'margin',
        tw.result_margin,
        'course',
        tw.result_course,
        'played_at',
        tw.result_played_at
      );
  else
    if tw.result_winner_team = 'a' then
      winners_line := format('%s & %s', a1n, a2n);
    else
      winners_line := format('%s & %s', b1n, b2n);
    end if;
    desc_txt := format(
      '%s · %s win · R %s per loser',
      teams_line,
      winners_line,
      trim(to_char(tw.amount, 'FM999999990.00'))
    );
    if tw.result_course is not null and trim(tw.result_course) <> '' then
      desc_txt := desc_txt || ' · ' || trim(tw.result_course);
    end if;
    meta :=
      jsonb_build_object(
        'team_wager_id',
        tw.id,
        'amount',
        tw.amount,
        'winner_team',
        tw.result_winner_team,
        'team_wager',
        true,
        'margin',
        tw.result_margin,
        'course',
        tw.result_course,
        'played_at',
        tw.result_played_at
      );
  end if;

  insert into public.activity_feed (season_id, type, actor_id, secondary_actor_id, description, metadata)
  values (v_season_id, 'wager', tw.created_by, tw.team_b_p1, desc_txt, meta);
end;
$func$;

create or replace function public.confirm_wager_outcome (p_wager_id uuid)
returns public.wagers
language plpgsql
security definer
set search_path = public
as $func$
declare
  w public.wagers;
  uid uuid := auth.uid();
  loser_id uuid;
  amt numeric(10, 2);
  loser_bal numeric(10, 2);
begin
  select * into w from public.wagers where id = p_wager_id for update;
  if not found then
    raise exception 'Wager not found';
  end if;
  if uid is null or uid not in (w.proposer_id, w.opponent_id) then
    raise exception 'Not a participant in this wager';
  end if;
  if w.status <> 'pending_confirmation' then
    raise exception 'This wager is not waiting for confirmation';
  end if;

  if uid = w.proposer_id and w.proposer_confirmed then
    raise exception 'You already confirmed this outcome';
  end if;
  if uid = w.opponent_id and w.opponent_confirmed then
    raise exception 'You already confirmed this outcome';
  end if;

  update public.wagers
  set
    proposer_confirmed = case when uid = proposer_id then true else proposer_confirmed end,
    opponent_confirmed = case when uid = opponent_id then true else opponent_confirmed end
  where id = p_wager_id
  returning * into w;

  if w.proposer_confirmed and w.opponent_confirmed then
    if w.result_winner_id is null then
      update public.wagers
      set status = 'settled', settled_at = now()
      where id = p_wager_id
      returning * into w;
    else
      loser_id :=
        case
          when w.result_winner_id = w.proposer_id then w.opponent_id
          else w.proposer_id
        end;
      amt := w.amount;

      select wallet_balance into loser_bal from public.profiles where id = loser_id;
      if loser_bal is null then
        raise exception 'Could not read loser wallet';
      end if;
      if loser_bal < amt then
        raise exception 'Loser''s wallet balance is too low to settle this wager (need at least %)', amt;
      end if;

      insert into public.wallet_transactions (player_id, amount, type, reference_id, note)
      values
        (w.result_winner_id, amt, 'wager_win', p_wager_id, null),
        (loser_id, -amt, 'wager_loss', p_wager_id, null);

      update public.profiles
      set wallet_balance = wallet_balance + amt
      where id = w.result_winner_id;

      update public.profiles
      set wallet_balance = wallet_balance - amt
      where id = loser_id;

      update public.wagers
      set status = 'settled', settled_at = now()
      where id = p_wager_id
      returning * into w;
    end if;
  end if;

  if w.status = 'settled' then
    perform public.insert_activity_feed_wager_settled_1v1 (w.id);
  end if;

  return w;
end;
$func$;

create or replace function public.confirm_team_wager_outcome (p_team_wager_id uuid)
returns public.team_wagers
language plpgsql
security definer
set search_path = public
as $func$
declare
  tw public.team_wagers;
  uid uuid := auth.uid();
  in_a boolean;
  in_b boolean;
  w1 uuid;
  w2 uuid;
  l1 uuid;
  l2 uuid;
  amt numeric(10, 2);
  b1 numeric(10, 2);
  b2 numeric(10, 2);
begin
  select * into tw from public.team_wagers where id = p_team_wager_id for update;
  if not found then
    raise exception 'Team wager not found';
  end if;
  if uid is null then
    raise exception 'Not signed in';
  end if;

  in_a := uid in (tw.team_a_p1, tw.team_a_p2);
  in_b := uid in (tw.team_b_p1, tw.team_b_p2);
  if not in_a and not in_b then
    raise exception 'Not a participant';
  end if;
  if tw.status <> 'pending_confirmation' then
    raise exception 'Not waiting for confirmation';
  end if;

  if tw.team_a_confirmed and not tw.team_b_confirmed then
    if in_a then
      raise exception 'Wait for someone on the other team to confirm';
    end if;
    if not in_b then
      raise exception 'Not a participant';
    end if;
  elsif tw.team_b_confirmed and not tw.team_a_confirmed then
    if in_b then
      raise exception 'Wait for someone on the other team to confirm';
    end if;
    if not in_a then
      raise exception 'Not a participant';
    end if;
  else
    raise exception 'Invalid confirmation state';
  end if;

  update public.team_wagers
  set
    team_a_confirmed = case when in_a then true else team_a_confirmed end,
    team_b_confirmed = case when in_b then true else team_b_confirmed end
  where id = p_team_wager_id
  returning * into tw;

  if tw.team_a_confirmed and tw.team_b_confirmed then
    if tw.result_winner_team is null then
      update public.team_wagers
      set status = 'settled', settled_at = now()
      where id = p_team_wager_id
      returning * into tw;
    else
      amt := tw.amount;
      if tw.result_winner_team = 'a' then
        w1 := tw.team_a_p1;
        w2 := tw.team_a_p2;
        l1 := tw.team_b_p1;
        l2 := tw.team_b_p2;
      else
        w1 := tw.team_b_p1;
        w2 := tw.team_b_p2;
        l1 := tw.team_a_p1;
        l2 := tw.team_a_p2;
      end if;

      select wallet_balance into b1 from public.profiles where id = l1;
      select wallet_balance into b2 from public.profiles where id = l2;
      if b1 is null or b2 is null then
        raise exception 'Could not read wallets';
      end if;
      if b1 < amt or b2 < amt then
        raise exception 'A losing player''s wallet is too low to settle (each loser needs at least the stake amount)';
      end if;

      insert into public.wallet_transactions (player_id, amount, type, reference_id, note)
      values
        (w1, amt, 'wager_win', p_team_wager_id, null),
        (w2, amt, 'wager_win', p_team_wager_id, null),
        (l1, -amt, 'wager_loss', p_team_wager_id, null),
        (l2, -amt, 'wager_loss', p_team_wager_id, null);

      update public.profiles set wallet_balance = wallet_balance + amt where id = w1;
      update public.profiles set wallet_balance = wallet_balance + amt where id = w2;
      update public.profiles set wallet_balance = wallet_balance - amt where id = l1;
      update public.profiles set wallet_balance = wallet_balance - amt where id = l2;

      update public.team_wagers
      set status = 'settled', settled_at = now()
      where id = p_team_wager_id
      returning * into tw;
    end if;
  end if;

  if tw.status = 'settled' then
    perform public.insert_activity_feed_wager_settled_team (tw.id);
  end if;

  return tw;
end;
$func$;
