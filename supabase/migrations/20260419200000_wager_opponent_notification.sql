-- When a wager is created, notify the opponent (no client INSERT policy on notifications today).

drop trigger if exists wagers_notify_opponent on public.wagers;

create or replace function public.notify_wager_opponent ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  proposer_label text;
  msg text;
begin
  if new.status is distinct from 'pending_acceptance' then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), display_name)
  into proposer_label
  from public.profiles
  where id = new.proposer_id;

  proposer_label := coalesce(proposer_label, 'Someone');

  msg :=
    proposer_label
    || ' challenged you to a R '
    || trim(to_char(new.amount, 'FM999999990.00'))
    || ' wager. Open Wagers to accept or decline.';

  insert into public.notifications (recipient_id, type, reference_id, message)
  values (new.opponent_id, 'wager_request', new.id, msg);

  return new;
end;
$$;

create trigger wagers_notify_opponent
  after insert on public.wagers
  for each row
  execute function public.notify_wager_opponent ();
