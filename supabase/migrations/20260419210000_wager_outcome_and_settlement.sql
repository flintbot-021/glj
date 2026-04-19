-- Wager outcome flow: submit result → counterparty confirms → wallet transfer (or halved).
-- Also: clean notifications when a wager row is deleted (decline/cancel).

create or replace function public.delete_notifications_for_wager ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.notifications where reference_id = old.id;
  return old;
end;
$$;

drop trigger if exists wagers_clean_notifications on public.wagers;

create trigger wagers_clean_notifications
  before delete on public.wagers
  for each row
  execute function public.delete_notifications_for_wager ();

-- Participant submits outcome while wager is active.
create or replace function public.submit_wager_outcome (
  p_wager_id uuid,
  p_result_winner_id uuid,
  p_result_margin text,
  p_result_course text,
  p_result_played_at date
)
returns public.wagers
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.wagers;
  uid uuid := auth.uid();
begin
  select * into w from public.wagers where id = p_wager_id for update;
  if not found then
    raise exception 'Wager not found';
  end if;
  if uid is null or uid not in (w.proposer_id, w.opponent_id) then
    raise exception 'Not a participant in this wager';
  end if;
  if w.status <> 'active' then
    raise exception 'Wager is not active';
  end if;

  if p_result_winner_id is not null then
    if p_result_winner_id not in (w.proposer_id, w.opponent_id) then
      raise exception 'Winner must be one of the two players';
    end if;
  end if;

  update public.wagers
  set
    result_winner_id = p_result_winner_id,
    result_margin = nullif(trim(p_result_margin), ''),
    result_course = nullif(trim(p_result_course), ''),
    result_played_at = p_result_played_at,
    status = 'pending_confirmation',
    proposer_confirmed = (uid = proposer_id),
    opponent_confirmed = (uid = opponent_id)
  where id = p_wager_id
  returning * into w;

  return w;
end;
$$;

-- Counterparty confirms; when both agree, settle wallets (or halved with no transfer).
create or replace function public.confirm_wager_outcome (p_wager_id uuid)
returns public.wagers
language plpgsql
security definer
set search_path = public
as $$
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

  return w;
end;
$$;

create or replace function public.dispute_wager_outcome (p_wager_id uuid)
returns public.wagers
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.wagers;
  uid uuid := auth.uid();
begin
  select * into w from public.wagers where id = p_wager_id for update;
  if not found then
    raise exception 'Wager not found';
  end if;
  if uid is null or uid not in (w.proposer_id, w.opponent_id) then
    raise exception 'Not a participant in this wager';
  end if;
  if w.status <> 'pending_confirmation' then
    raise exception 'You can only dispute a wager that is waiting for result confirmation';
  end if;

  update public.wagers
  set
    status = 'disputed',
    proposer_confirmed = false,
    opponent_confirmed = false
  where id = p_wager_id
  returning * into w;

  return w;
end;
$$;

-- After a dispute, either player can clear and return to active to submit a new outcome.
create or replace function public.reopen_disputed_wager (p_wager_id uuid)
returns public.wagers
language plpgsql
security definer
set search_path = public
as $$
declare
  w public.wagers;
  uid uuid := auth.uid();
begin
  select * into w from public.wagers where id = p_wager_id for update;
  if not found then
    raise exception 'Wager not found';
  end if;
  if uid is null or uid not in (w.proposer_id, w.opponent_id) then
    raise exception 'Not a participant in this wager';
  end if;
  if w.status <> 'disputed' then
    raise exception 'Wager is not disputed';
  end if;

  update public.wagers
  set
    status = 'active',
    result_winner_id = null,
    result_margin = null,
    result_course = null,
    result_played_at = null,
    proposer_confirmed = false,
    opponent_confirmed = false,
    settled_at = null
  where id = p_wager_id
  returning * into w;

  return w;
end;
$$;

grant execute on function public.submit_wager_outcome (uuid, uuid, text, text, date) to authenticated;
grant execute on function public.confirm_wager_outcome (uuid) to authenticated;
grant execute on function public.dispute_wager_outcome (uuid) to authenticated;
grant execute on function public.reopen_disputed_wager (uuid) to authenticated;
