-- Grudge matches: season-wide cross-group challenges.
-- Rules: issue 1, receive up to 3. Challenger win +3 / challenged win +1 / halve +1 each.

-- ─── Table ────────────────────────────────────────────────────────────────────
create table public.grudge_matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  challenger_id uuid not null references public.profiles (id),
  challenged_id uuid not null references public.profiles (id),
  status text not null default 'pending_acceptance'
    check (status in ('pending_acceptance', 'active', 'settled', 'cancelled')),
  result text check (result is null or result in ('win_challenger', 'win_challenged', 'draw')),
  margin text,
  course_name text,
  played_at date,
  points_challenger numeric(3, 1),
  points_challenged numeric(3, 1),
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint grudge_players_distinct check (challenger_id <> challenged_id)
);

create index idx_grudge_season on public.grudge_matches (season_id, created_at desc);
create index idx_grudge_challenger on public.grudge_matches (challenger_id, status);
create index idx_grudge_challenged on public.grudge_matches (challenged_id, status);

alter table public.grudge_matches enable row level security;

create policy "grudge_matches_select_authenticated"
  on public.grudge_matches for select to authenticated using (true);

create policy "grudge_matches_insert_challenger"
  on public.grudge_matches for insert to authenticated
  with check (auth.uid() = challenger_id);

create policy "grudge_matches_update_participants"
  on public.grudge_matches for update to authenticated
  using (auth.uid() in (challenger_id, challenged_id) or public.is_admin())
  with check (auth.uid() in (challenger_id, challenged_id) or public.is_admin());

create policy "grudge_matches_delete_pending"
  on public.grudge_matches for delete to authenticated
  using (
    status = 'pending_acceptance'
    and (auth.uid() in (challenger_id, challenged_id) or public.is_admin())
  );

-- Allow activity_feed type grudge_match
alter table public.activity_feed drop constraint if exists activity_feed_type_check;
alter table public.activity_feed
  add constraint activity_feed_type_check check (
    type in (
      'matchplay',
      'strokeplay',
      'wager',
      'bonus_points',
      'knockout',
      'tour_score',
      'grudge_match'
    )
  );

-- ─── Helpers ──────────────────────────────────────────────────────────────────
create or replace function public.player_group_id_for_season(p_player_id uuid, p_season_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select gm.group_id
  from public.group_memberships gm
  join public.groups g on g.id = gm.group_id
  where gm.player_id = p_player_id
    and g.season_id = p_season_id
  limit 1;
$$;

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
    and status in ('pending_acceptance', 'active', 'settled');
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
    and status in ('pending_acceptance', 'active', 'settled');
$$;

-- ─── Create challenge ─────────────────────────────────────────────────────────
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
      and status in ('pending_acceptance', 'active')
      and (
        (challenger_id = v_uid and challenged_id = p_challenged_id)
        or (challenger_id = p_challenged_id and challenged_id = v_uid)
      )
  ) then
    raise exception 'You already have an open grudge match with this player';
  end if;

  insert into public.grudge_matches (season_id, challenger_id, challenged_id, status)
  values (v_season_id, v_uid, p_challenged_id, 'pending_acceptance')
  returning * into v_row;

  return v_row;
end;
$$;

revoke all on function public.create_grudge_match(uuid) from public;
grant execute on function public.create_grudge_match(uuid) to authenticated;

-- ─── Accept ───────────────────────────────────────────────────────────────────
create or replace function public.accept_grudge_match(p_grudge_id uuid)
returns public.grudge_matches
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
  if v_row.status <> 'pending_acceptance' then
    raise exception 'This challenge is no longer pending';
  end if;
  if v_uid is distinct from v_row.challenged_id and not public.is_admin() then
    raise exception 'Only the challenged player can accept';
  end if;
  if public.grudge_open_received_count(v_row.challenged_id, v_row.season_id) > 3 then
    raise exception 'Challenge limit reached';
  end if;

  update public.grudge_matches
  set status = 'active'
  where id = p_grudge_id
  returning * into v_row;

  insert into public.notifications (recipient_id, type, reference_id, message)
  select
    v_row.challenger_id,
    'grudge_accepted',
    v_row.id,
    coalesce(nullif(trim(p.full_name), ''), p.display_name) || ' accepted your grudge match challenge.'
  from public.profiles p
  where p.id = v_row.challenged_id;

  return v_row;
end;
$$;

revoke all on function public.accept_grudge_match(uuid) from public;
grant execute on function public.accept_grudge_match(uuid) to authenticated;

-- ─── Decline / cancel ─────────────────────────────────────────────────────────
create or replace function public.decline_grudge_match(p_grudge_id uuid)
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
  if v_row.status <> 'pending_acceptance' then
    raise exception 'This challenge is no longer pending';
  end if;
  if v_uid is distinct from v_row.challenger_id
     and v_uid is distinct from v_row.challenged_id
     and not public.is_admin() then
    raise exception 'Not allowed';
  end if;

  -- Free the slot: delete pending challenge (counts only open/settled rows).
  delete from public.grudge_matches where id = p_grudge_id;

  if v_uid = v_row.challenged_id then
    insert into public.notifications (recipient_id, type, reference_id, message)
    select
      v_row.challenger_id,
      'grudge_declined',
      v_row.id,
      coalesce(nullif(trim(p.full_name), ''), p.display_name) || ' declined your grudge match challenge.'
    from public.profiles p
    where p.id = v_row.challenged_id;
  end if;
end;
$$;

revoke all on function public.decline_grudge_match(uuid) from public;
grant execute on function public.decline_grudge_match(uuid) to authenticated;

-- ─── Submit result (settles immediately) ──────────────────────────────────────
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
  v_pts_challenger numeric(3, 1);
  v_pts_challenged numeric(3, 1);
  v_desc text;
  v_challenger_label text;
  v_challenged_label text;
begin
  if p_result not in ('win_challenger', 'win_challenged', 'draw') then
    raise exception 'Invalid result';
  end if;

  select * into v_row from public.grudge_matches where id = p_grudge_id for update;
  if not found then
    raise exception 'Grudge match not found';
  end if;
  if v_row.status <> 'active' then
    raise exception 'Grudge match is not active';
  end if;
  if v_uid is distinct from v_row.challenger_id
     and v_uid is distinct from v_row.challenged_id
     and not public.is_admin() then
    raise exception 'Only participants can submit a result';
  end if;

  if p_result = 'win_challenger' then
    v_pts_challenger := 3;
    v_pts_challenged := 0;
  elsif p_result = 'win_challenged' then
    v_pts_challenger := 0;
    v_pts_challenged := 1;
  else
    v_pts_challenger := 1;
    v_pts_challenged := 1;
  end if;

  update public.grudge_matches
  set
    status = 'settled',
    result = p_result,
    margin = nullif(trim(p_margin), ''),
    course_name = nullif(trim(p_course), ''),
    played_at = p_played_at,
    points_challenger = v_pts_challenger,
    points_challenged = v_pts_challenged,
    settled_at = now()
  where id = p_grudge_id
  returning * into v_row;

  select coalesce(nullif(trim(full_name), ''), display_name)
    into v_challenger_label from public.profiles where id = v_row.challenger_id;
  select coalesce(nullif(trim(full_name), ''), display_name)
    into v_challenged_label from public.profiles where id = v_row.challenged_id;

  if p_result = 'draw' then
    v_desc := v_challenger_label || ' vs ' || v_challenged_label || ' — grudge match halved (+1 each)';
  elsif p_result = 'win_challenger' then
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
      'result', p_result,
      'margin', v_row.margin,
      'course', v_row.course_name,
      'points_challenger', v_pts_challenger,
      'points_challenged', v_pts_challenged
    )
  );

  insert into public.notifications (recipient_id, type, reference_id, message)
  values
    (
      case when v_uid = v_row.challenger_id then v_row.challenged_id else v_row.challenger_id end,
      'grudge_result',
      v_row.id,
      'Grudge match result recorded: ' || v_desc
    );

  return v_row;
end;
$$;

revoke all on function public.submit_grudge_match_result(uuid, text, text, text, date) from public;
grant execute on function public.submit_grudge_match_result(uuid, text, text, text, date) to authenticated;

-- ─── Notify on challenge create ───────────────────────────────────────────────
create or replace function public.notify_grudge_challenged()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  challenger_label text;
begin
  if new.status is distinct from 'pending_acceptance' then
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
    coalesce(challenger_label, 'Someone') || ' challenged you to a grudge match. Open Score → Grudge to accept or decline.'
  );

  return new;
end;
$$;

create trigger grudge_matches_notify_challenged
  after insert on public.grudge_matches
  for each row
  execute function public.notify_grudge_challenged();
