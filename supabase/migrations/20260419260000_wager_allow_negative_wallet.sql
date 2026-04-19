-- Allow wallets to go into credit when settling wagers (remove minimum balance guards).

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
