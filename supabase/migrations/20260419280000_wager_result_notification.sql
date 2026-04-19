-- Notify counterparty when a wager result is submitted and awaiting their confirmation.

-- ── 1v1 ──────────────────────────────────────────────────────────────────────

create or replace function public.notify_wager_result_submitted ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  submitter_label text;
  recipient_id    uuid;
  msg             text;
begin
  -- Only fire when transitioning into pending_confirmation
  if new.status is distinct from 'pending_confirmation' then
    return new;
  end if;
  if old.status = 'pending_confirmation' then
    return new;
  end if;

  -- The submitter is whichever side just set their confirmed flag to true
  if new.proposer_confirmed and not coalesce(old.proposer_confirmed, false) then
    recipient_id := new.opponent_id;
    select coalesce(nullif(trim(full_name), ''), display_name)
    into submitter_label
    from public.profiles
    where id = new.proposer_id;
  else
    recipient_id := new.proposer_id;
    select coalesce(nullif(trim(full_name), ''), display_name)
    into submitter_label
    from public.profiles
    where id = new.opponent_id;
  end if;

  submitter_label := coalesce(submitter_label, 'Someone');

  msg :=
    submitter_label
    || ' submitted a result for your R '
    || trim(to_char(new.amount, 'FM999999990.00'))
    || ' wager. Open Wagers to confirm or dispute.';

  -- Clear any stale result notifications for this wager first
  delete from public.notifications
  where reference_id = new.id
    and type = 'wager_result';

  insert into public.notifications (recipient_id, type, reference_id, message)
  values (recipient_id, 'wager_result', new.id, msg);

  return new;
end;
$$;

drop trigger if exists wagers_notify_result_submitted on public.wagers;

create trigger wagers_notify_result_submitted
  after update on public.wagers
  for each row
  execute function public.notify_wager_result_submitted ();

-- ── 2v2 ──────────────────────────────────────────────────────────────────────

create or replace function public.notify_team_wager_result_submitted ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  a1n          text;
  a2n          text;
  b1n          text;
  b2n          text;
  submitter_label text;
  msg          text;
begin
  -- Only fire when transitioning into pending_confirmation
  if new.status is distinct from 'pending_confirmation' then
    return new;
  end if;
  if old.status = 'pending_confirmation' then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), display_name) into a1n from public.profiles where id = new.team_a_p1;
  select coalesce(nullif(trim(full_name), ''), display_name) into a2n from public.profiles where id = new.team_a_p2;
  select coalesce(nullif(trim(full_name), ''), display_name) into b1n from public.profiles where id = new.team_b_p1;
  select coalesce(nullif(trim(full_name), ''), display_name) into b2n from public.profiles where id = new.team_b_p2;

  a1n := coalesce(a1n, '?');
  a2n := coalesce(a2n, '?');
  b1n := coalesce(b1n, '?');
  b2n := coalesce(b2n, '?');

  -- Clear stale result notifications for this team wager
  delete from public.notifications
  where reference_id = new.id
    and type = 'wager_result';

  if new.team_a_confirmed then
    -- Team A submitted → notify both Team B players
    submitter_label := a1n || ' & ' || a2n;
    msg :=
      submitter_label
      || ' submitted a result for your R '
      || trim(to_char(new.amount, 'FM999999990.00'))
      || ' 2v2 wager. Open Wagers to confirm or dispute.';

    insert into public.notifications (recipient_id, type, reference_id, message)
    values
      (new.team_b_p1, 'wager_result', new.id, msg),
      (new.team_b_p2, 'wager_result', new.id, msg);
  else
    -- Team B submitted → notify both Team A players
    submitter_label := b1n || ' & ' || b2n;
    msg :=
      submitter_label
      || ' submitted a result for your R '
      || trim(to_char(new.amount, 'FM999999990.00'))
      || ' 2v2 wager. Open Wagers to confirm or dispute.';

    insert into public.notifications (recipient_id, type, reference_id, message)
    values
      (new.team_a_p1, 'wager_result', new.id, msg),
      (new.team_a_p2, 'wager_result', new.id, msg);
  end if;

  return new;
end;
$$;

drop trigger if exists team_wagers_notify_result_submitted on public.team_wagers;

create trigger team_wagers_notify_result_submitted
  after update on public.team_wagers
  for each row
  execute function public.notify_team_wager_result_submitted ();
