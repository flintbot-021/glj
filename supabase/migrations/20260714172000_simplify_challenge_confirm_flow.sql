-- Simplify challenge flow for 1v1 wagers + grudge matches:
-- Challenge opens immediately (active) → either player submits result → other confirms once.

-- ═══════════════════════════════════════════════════════════════════════════════
-- WAGERS (1v1)
-- ═══════════════════════════════════════════════════════════════════════════════

-- Proposer may cancel an active wager that has no result yet.
drop policy if exists "wagers_delete_pending" on public.wagers;
drop policy if exists wagers_delete_own_pending on public.wagers;

do $$
declare
  pol record;
begin
  for pol in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'wagers' and cmd = 'DELETE'
  loop
    execute format('drop policy if exists %I on public.wagers', pol.policyname);
  end loop;
end $$;

create policy "wagers_delete_cancellable"
  on public.wagers for delete to authenticated
  using (
    auth.uid() = proposer_id
    and (
      status = 'pending_acceptance'
      or (
        status = 'active'
        and result_winner_id is null
        and result_played_at is null
        and coalesce(proposer_confirmed, false) = false
        and coalesce(opponent_confirmed, false) = false
      )
    )
  );

-- Notify opponent when challenge opens as active (and still for legacy pending).
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
  if new.status is distinct from 'pending_acceptance' and new.status is distinct from 'active' then
    return new;
  end if;
  -- Only on insert (new challenge), not status flips from pending→active.
  if tg_op <> 'INSERT' then
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
    || ' wager. Open Wagers to record or confirm the result.';

  insert into public.notifications (recipient_id, type, reference_id, message)
  values (new.opponent_id, 'wager_request', new.id, msg);

  return new;
end;
$$;

-- ═══════════════════════════════════════════════════════════════════════════════
-- GRUDGE MATCHES
-- ═══════════════════════════════════════════════════════════════════════════════

alter table public.grudge_matches drop constraint if exists grudge_matches_status_check;
alter table public.grudge_matches
  add constraint grudge_matches_status_check
  check (status in ('pending_acceptance', 'active', 'pending_confirmation', 'settled', 'cancelled'));

alter table public.grudge_matches
  add column if not exists challenger_confirmed boolean not null default false,
  add column if not exists challenged_confirmed boolean not null default false,
  add column if not exists result_submitted_by uuid references public.profiles (id);

-- Counts: open challenges include pending_confirmation
create or replace function public.grudge_open_issued_count(p_player_id uuid, p_season_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.grudge_matches
  where season_id = p_season_id
    and challenger_id = p_player_id
    and status in ('pending_acceptance', 'active', 'pending_confirmation', 'settled');
$$;

create or replace function public.grudge_open_received_count(p_player_id uuid, p_season_id uuid)
returns integer
language sql
stable
security definer
set search_path = public
as $$
  select count(*)::integer
  from public.grudge_matches
  where season_id = p_season_id
    and challenged_id = p_player_id
    and status in ('pending_acceptance', 'active', 'pending_confirmation', 'settled');
$$;

-- Create → active immediately
create or replace function public.create_grudge_match(p_challenged_id uuid)
returns public.grudge_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_season_id uuid;
  v_my_group uuid;
  v_their_group uuid;
  v_row public.grudge_matches;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;
  if p_challenged_id is null or p_challenged_id = v_uid then
    raise exception 'Invalid opponent';
  end if;

  select id into v_season_id from public.seasons where is_active = true limit 1;
  if v_season_id is null then
    raise exception 'No active season';
  end if;

  if public.grudge_open_issued_count(v_uid, v_season_id) >= 1 then
    raise exception 'You have already used your grudge match challenge this season';
  end if;

  if public.grudge_open_received_count(p_challenged_id, v_season_id) >= 3 then
    raise exception 'That player has already been challenged 3 times this season';
  end if;

  v_my_group := public.player_group_id_for_season(v_uid, v_season_id);
  v_their_group := public.player_group_id_for_season(p_challenged_id, v_season_id);

  if v_my_group is null or v_their_group is null then
    raise exception 'Both players must be in a group';
  end if;
  if v_my_group = v_their_group then
    raise exception 'Grudge matches must be against someone outside your group';
  end if;

  if exists (
    select 1 from public.grudge_matches
    where season_id = v_season_id
      and status in ('pending_acceptance', 'active', 'pending_confirmation')
      and (
        (challenger_id = v_uid and challenged_id = p_challenged_id)
        or (challenger_id = p_challenged_id and challenged_id = v_uid)
      )
  ) then
    raise exception 'You already have an open grudge match with this player';
  end if;

  insert into public.grudge_matches (season_id, challenger_id, challenged_id, status)
  values (v_season_id, v_uid, p_challenged_id, 'active')
  returning * into v_row;

  return v_row;
end;
$$;

-- Cancel open challenge (no result yet) — challenger only, or either if still pending_acceptance legacy
create or replace function public.cancel_grudge_match(p_grudge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.grudge_matches;
begin
  select * into v_row from public.grudge_matches where id = p_grudge_id for update;
  if not found then
    raise exception 'Grudge match not found';
  end if;

  if v_row.status = 'pending_acceptance' then
    if v_uid is distinct from v_row.challenger_id
       and v_uid is distinct from v_row.challenged_id
       and not public.is_admin() then
      raise exception 'Not allowed';
    end if;
  elsif v_row.status = 'active' and v_row.result is null then
    if v_uid is distinct from v_row.challenger_id and not public.is_admin() then
      raise exception 'Only the challenger can cancel';
    end if;
  else
    raise exception 'This grudge match can no longer be cancelled';
  end if;

  delete from public.grudge_matches where id = p_grudge_id;
end;
$$;

revoke all on function public.cancel_grudge_match(uuid) from public;
grant execute on function public.cancel_grudge_match(uuid) to authenticated;

-- Keep decline as alias for cancel (legacy UI / pending rows)
create or replace function public.decline_grudge_match(p_grudge_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.cancel_grudge_match(p_grudge_id);
end;
$$;

-- Submit result → pending_confirmation (submitter auto-confirmed)
create or replace function public.submit_grudge_match_result(
  p_grudge_id uuid,
  p_result text,
  p_margin text,
  p_course text,
  p_played_at date
)
returns public.grudge_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.grudge_matches;
  v_other uuid;
  v_msg text;
begin
  if p_result not in ('win_challenger', 'win_challenged', 'draw') then
    raise exception 'Invalid result';
  end if;

  select * into v_row from public.grudge_matches where id = p_grudge_id for update;
  if not found then
    raise exception 'Grudge match not found';
  end if;
  if v_row.status <> 'active' then
    raise exception 'Grudge match is not open for a result';
  end if;
  if v_uid is distinct from v_row.challenger_id
     and v_uid is distinct from v_row.challenged_id
     and not public.is_admin() then
    raise exception 'Only participants can submit a result';
  end if;

  update public.grudge_matches
  set
    status = 'pending_confirmation',
    result = p_result,
    margin = nullif(trim(p_margin), ''),
    course_name = nullif(trim(p_course), ''),
    played_at = p_played_at,
    result_submitted_by = v_uid,
    challenger_confirmed = (v_uid = challenger_id),
    challenged_confirmed = (v_uid = challenged_id),
    points_challenger = null,
    points_challenged = null,
    settled_at = null
  where id = p_grudge_id
  returning * into v_row;

  v_other := case when v_uid = v_row.challenger_id then v_row.challenged_id else v_row.challenger_id end;
  v_msg := 'A grudge match result was submitted. Open Score → Grudge to confirm.';

  insert into public.notifications (recipient_id, type, reference_id, message)
  values (v_other, 'grudge_result', v_row.id, v_msg);

  return v_row;
end;
$$;

-- Confirm → settle + award points
create or replace function public.confirm_grudge_match_result(p_grudge_id uuid)
returns public.grudge_matches
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_row public.grudge_matches;
  v_pts_challenger numeric(3, 1);
  v_pts_challenged numeric(3, 1);
  v_desc text;
  v_challenger_label text;
  v_challenged_label text;
begin
  select * into v_row from public.grudge_matches where id = p_grudge_id for update;
  if not found then
    raise exception 'Grudge match not found';
  end if;
  if v_row.status <> 'pending_confirmation' then
    raise exception 'Nothing to confirm';
  end if;
  if v_uid is distinct from v_row.challenger_id
     and v_uid is distinct from v_row.challenged_id
     and not public.is_admin() then
    raise exception 'Only participants can confirm';
  end if;

  -- Other player confirms (submitter already confirmed on submit).
  if v_uid = v_row.challenger_id then
    if v_row.challenger_confirmed then
      raise exception 'Waiting for the other player to confirm';
    end if;
    update public.grudge_matches
    set challenger_confirmed = true
    where id = p_grudge_id
    returning * into v_row;
  else
    if v_row.challenged_confirmed then
      raise exception 'Waiting for the other player to confirm';
    end if;
    update public.grudge_matches
    set challenged_confirmed = true
    where id = p_grudge_id
    returning * into v_row;
  end if;

  if not (v_row.challenger_confirmed and v_row.challenged_confirmed) then
    return v_row;
  end if;

  if v_row.result = 'win_challenger' then
    v_pts_challenger := 3;
    v_pts_challenged := 0;
  elsif v_row.result = 'win_challenged' then
    v_pts_challenger := 0;
    v_pts_challenged := 1;
  else
    v_pts_challenger := 1;
    v_pts_challenged := 1;
  end if;

  update public.grudge_matches
  set
    status = 'settled',
    challenger_confirmed = true,
    challenged_confirmed = true,
    points_challenger = v_pts_challenger,
    points_challenged = v_pts_challenged,
    settled_at = now()
  where id = p_grudge_id
  returning * into v_row;

  select coalesce(nullif(trim(full_name), ''), display_name)
    into v_challenger_label from public.profiles where id = v_row.challenger_id;
  select coalesce(nullif(trim(full_name), ''), display_name)
    into v_challenged_label from public.profiles where id = v_row.challenged_id;

  if v_row.result = 'draw' then
    v_desc := v_challenger_label || ' vs ' || v_challenged_label || ' — grudge match halved (+1 each)';
  elsif v_row.result = 'win_challenger' then
    v_desc := v_challenger_label || ' beat ' || v_challenged_label || ' in a grudge match (+3)';
  else
    v_desc := v_challenged_label || ' defended vs ' || v_challenger_label || ' in a grudge match (+1)';
  end if;

  insert into public.activity_feed (
    season_id, type, actor_id, secondary_actor_id, description, metadata
  ) values (
    v_row.season_id,
    'grudge_match',
    v_row.challenger_id,
    v_row.challenged_id,
    v_desc,
    jsonb_build_object(
      'grudge_match_id', v_row.id,
      'result', v_row.result,
      'margin', v_row.margin,
      'course', v_row.course_name,
      'points_challenger', v_pts_challenger,
      'points_challenged', v_pts_challenged
    )
  );

  return v_row;
end;
$$;

revoke all on function public.confirm_grudge_match_result(uuid) from public;
grant execute on function public.confirm_grudge_match_result(uuid) to authenticated;

-- Notify on create (active)
create or replace function public.notify_grudge_challenged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  challenger_label text;
begin
  if tg_op <> 'INSERT' then
    return new;
  end if;

  select coalesce(nullif(trim(full_name), ''), display_name)
    into challenger_label
  from public.profiles
  where id = new.challenger_id;

  insert into public.notifications (recipient_id, type, reference_id, message)
  values (
    new.challenged_id,
    'grudge_request',
    new.id,
    coalesce(challenger_label, 'Someone')
      || ' challenged you to a grudge match. Open Score → Grudge to record or confirm the result.'
  );

  return new;
end;
$$;

-- Delete policy: allow cancel of active with no result (via RPC mostly; keep RLS aligned)
drop policy if exists "grudge_matches_delete_pending" on public.grudge_matches;
create policy "grudge_matches_delete_cancellable"
  on public.grudge_matches for delete to authenticated
  using (
    (status = 'pending_acceptance' and auth.uid() in (challenger_id, challenged_id))
    or (status = 'active' and result is null and auth.uid() = challenger_id)
    or public.is_admin()
  );
