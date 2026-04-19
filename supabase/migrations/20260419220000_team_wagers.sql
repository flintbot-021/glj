-- 2v2 team wagers: Team A (2 players) vs Team B (2 players), stake per losing player.
-- One member of Team B can accept. Outcome submit + one member of the other team confirms.
-- Settlement: each winner +amount, each loser -amount (four ledger rows).

create table public.team_wagers (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.profiles (id),
  team_a_p1 uuid not null references public.profiles (id),
  team_a_p2 uuid not null references public.profiles (id),
  team_b_p1 uuid not null references public.profiles (id),
  team_b_p2 uuid not null references public.profiles (id),
  amount numeric(10, 2) not null check (amount > 0),
  status text not null,
  result_winner_team text,
  result_margin text,
  result_course text,
  result_played_at date,
  team_a_confirmed boolean not null default false,
  team_b_confirmed boolean not null default false,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint team_wagers_status check (
    status in (
      'pending_acceptance',
      'active',
      'pending_confirmation',
      'settled',
      'disputed'
    )
  ),
  constraint team_wagers_winner_team check (
    result_winner_team is null or result_winner_team in ('a', 'b')
  ),
  constraint team_wagers_four_distinct check (
    team_a_p1 <> team_a_p2
    and team_a_p1 <> team_b_p1
    and team_a_p1 <> team_b_p2
    and team_a_p2 <> team_b_p1
    and team_a_p2 <> team_b_p2
    and team_b_p1 <> team_b_p2
  )
);

create index idx_team_wagers_team_a_p1 on public.team_wagers (team_a_p1);
create index idx_team_wagers_team_b_p1 on public.team_wagers (team_b_p1);

alter table public.team_wagers enable row level security;

create policy "Team wagers read participants"
  on public.team_wagers for select to authenticated
  using (
    auth.uid() in (team_a_p1, team_a_p2, team_b_p1, team_b_p2)
    or public.is_admin ()
  );

create policy "Team wagers insert creator as a1"
  on public.team_wagers for insert to authenticated
  with check (
    auth.uid() = created_by
    and auth.uid() = team_a_p1
  );

-- Status / result changes go through SECURITY DEFINER RPCs only (prevents client-side tampering).
create policy "Team wagers update admin"
  on public.team_wagers for update to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

create policy "Team wagers delete pending"
  on public.team_wagers for delete to authenticated
  using (
    status = 'pending_acceptance'
    and (
      auth.uid() = created_by
      or auth.uid() in (team_b_p1, team_b_p2)
    )
  );

-- Reuse notification cleanup (reference_id = wager id).
drop trigger if exists team_wagers_clean_notifications on public.team_wagers;

create trigger team_wagers_clean_notifications
  before delete on public.team_wagers
  for each row
  execute function public.delete_notifications_for_wager ();

create or replace function public.notify_team_wager_opponents ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  msg text;
  creator_name text;
begin
  if new.status is distinct from 'pending_acceptance' then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), display_name)
  into creator_name
  from public.profiles
  where id = new.created_by;

  creator_name := coalesce(creator_name, 'Someone');

  msg :=
    creator_name
    || ' challenged your team (2v2) — R '
    || trim(to_char(new.amount, 'FM999999990.00'))
    || ' per player on the losing side. Open Wagers to accept.';

  insert into public.notifications (recipient_id, type, reference_id, message)
  values
    (new.team_b_p1, 'wager_request', new.id, msg),
    (new.team_b_p2, 'wager_request', new.id, msg);

  return new;
end;
$$;

drop trigger if exists team_wagers_notify_opponents on public.team_wagers;

create trigger team_wagers_notify_opponents
  after insert on public.team_wagers
  for each row
  execute function public.notify_team_wager_opponents ();

create or replace function public.submit_team_wager_outcome (
  p_team_wager_id uuid,
  p_result_winner_team text,
  p_result_margin text,
  p_result_course text,
  p_result_played_at date
)
returns public.team_wagers
language plpgsql
security definer
set search_path = public
as $$
declare
  tw public.team_wagers;
  uid uuid := auth.uid();
  in_a boolean;
  in_b boolean;
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
  if tw.status <> 'active' then
    raise exception 'Team wager is not active';
  end if;

  if p_result_winner_team is not null and p_result_winner_team not in ('a', 'b') then
    raise exception 'Invalid winner team';
  end if;

  update public.team_wagers
  set
    result_winner_team = p_result_winner_team,
    result_margin = nullif(trim(p_result_margin), ''),
    result_course = nullif(trim(p_result_course), ''),
    result_played_at = p_result_played_at,
    status = 'pending_confirmation',
    team_a_confirmed = in_a,
    team_b_confirmed = in_b
  where id = p_team_wager_id
  returning * into tw;

  return tw;
end;
$$;

create or replace function public.confirm_team_wager_outcome (p_team_wager_id uuid)
returns public.team_wagers
language plpgsql
security definer
set search_path = public
as $$
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

  -- Submitter's team is already true; only the other team may confirm.
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

grant execute on function public.accept_team_wager (uuid) to authenticated;
grant execute on function public.submit_team_wager_outcome (uuid, text, text, text, date) to authenticated;
grant execute on function public.confirm_team_wager_outcome (uuid) to authenticated;
grant execute on function public.dispute_team_wager_outcome (uuid) to authenticated;
grant execute on function public.reopen_disputed_team_wager (uuid) to authenticated;
