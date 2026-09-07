-- Reset a tour match card: wipe scores, clear wager / confirm, reverse settled wallets.

create or replace function public.reset_tour_match_card(p_match_id uuid)
returns public.tour_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.tour_matches;
  v_tx record;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select * into v_row from public.tour_matches where id = p_match_id for update;
  if not found then
    raise exception 'Match not found';
  end if;

  if not public.is_admin() and not exists (
    select 1
    from public.tour_match_players mp
    join public.tour_players tp on tp.id = mp.tour_player_id
    where mp.match_id = p_match_id and tp.player_id = v_uid
  ) then
    raise exception 'Only match players can reset the scorecard';
  end if;

  -- Reverse any settled tour-match wager ledger rows for this match.
  if v_row.wager_settled_at is not null then
    for v_tx in
      select id, player_id, amount, type
      from public.wallet_transactions
      where reference_id = p_match_id
        and type in ('wager_win', 'wager_loss')
        and note = 'Tour match wager'
    loop
      update public.profiles
      set wallet_balance = wallet_balance - v_tx.amount
      where id = v_tx.player_id;

      insert into public.wallet_transactions (player_id, amount, type, reference_id, note)
      values (
        v_tx.player_id,
        -v_tx.amount,
        case when v_tx.type = 'wager_win' then 'wager_loss' else 'wager_win' end,
        p_match_id,
        'Tour match wager reset'
      );
    end loop;
  end if;

  delete from public.tour_hole_scores where match_id = p_match_id;

  update public.tour_matches
  set status = 'scheduled',
      team_a_points = 0,
      team_b_points = 0,
      wager_amount = null,
      wager_created_by = null,
      card_confirmed_at = null,
      wager_settled_at = null
  where id = p_match_id
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.reset_tour_match_card(uuid) from public;
grant execute on function public.reset_tour_match_card(uuid) to authenticated;
