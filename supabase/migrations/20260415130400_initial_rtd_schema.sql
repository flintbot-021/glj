-- Road To Dias — initial schema (PRD §6, aligned with src/lib/types.ts)
-- Run via Supabase CLI (`supabase db push`) or SQL editor.
-- Profiles use display_name + handicap (PRD PDF used full_name / current_handicap — map in app if needed).

-- gen_random_uuid() is built-in on Postgres 13+ (Supabase)

-- ─── Core: profiles (extends auth.users) ─────────────────────────────────────
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text not null,
  initials text not null,
  email text not null,
  is_admin boolean not null default false,
  handicap numeric(4, 1) not null default 18.0,
  wallet_balance numeric(10, 2) not null default 0,
  created_at timestamptz not null default now(),
  constraint profiles_initials_len check (char_length(initials) <= 4)
);

create index idx_profiles_email on public.profiles (email);

-- ─── Seasons & groups ─────────────────────────────────────────────────────────
create table public.seasons (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  year integer not null,
  win_points numeric(3, 1) not null default 3,
  draw_points numeric(3, 1) not null default 1,
  loss_points numeric(3, 1) not null default 0,
  is_active boolean not null default false,
  start_date date,
  end_date date,
  created_at timestamptz not null default now()
);

-- At most one season marked active (PRD: only one active season)
create unique index seasons_single_active
  on public.seasons (is_active)
  where (is_active);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_groups_season on public.groups (season_id);

create table public.group_memberships (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (group_id, player_id)
);

create index idx_group_memberships_player on public.group_memberships (player_id);

-- ─── Matchplay ────────────────────────────────────────────────────────────────
create table public.matchplay_results (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  group_id uuid not null references public.groups (id) on delete cascade,
  player_a_id uuid not null references public.profiles (id),
  player_b_id uuid not null references public.profiles (id),
  result text not null check (result in ('win_a', 'win_b', 'draw')),
  margin text not null,
  course_name text not null,
  played_at date not null,
  created_at timestamptz not null default now(),
  constraint matchplay_distinct_players check (player_a_id <> player_b_id)
);

create index idx_matchplay_season on public.matchplay_results (season_id);
create index idx_matchplay_group on public.matchplay_results (group_id);
create index idx_matchplay_players on public.matchplay_results (player_a_id, player_b_id);

-- ─── Bonus strokeplay / sub-seasons ───────────────────────────────────────────
create table public.sub_seasons (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  name text not null,
  start_date date not null,
  end_date date not null,
  status text not null check (status in ('open', 'closed')),
  bonus_1st numeric(3, 1) not null default 1.5,
  bonus_2nd numeric(3, 1) not null default 1.0,
  bonus_3rd numeric(3, 1) not null default 0.5,
  closed_at timestamptz,
  created_at timestamptz not null default now()
);

create index idx_sub_seasons_season on public.sub_seasons (season_id);

create table public.strokeplay_rounds (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  sub_season_id uuid not null references public.sub_seasons (id) on delete cascade,
  course_name text not null,
  played_at date not null,
  handicap_used numeric(4, 1) not null,
  gross_score integer not null,
  net_score numeric(5, 1) not null,
  counts_for_ranking boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_strokeplay_player_sub on public.strokeplay_rounds (player_id, sub_season_id);

create table public.bonus_point_awards (
  id uuid primary key default gen_random_uuid(),
  sub_season_id uuid not null references public.sub_seasons (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  position integer not null check (position in (1, 2, 3)),
  points_awarded numeric(3, 1) not null,
  created_at timestamptz not null default now(),
  unique (sub_season_id, player_id),
  unique (sub_season_id, position)
);

-- ─── Knockout ─────────────────────────────────────────────────────────────────
create table public.knockout_fixtures (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  round text not null check (round in ('qf', 'sf', 'final')),
  player_a_id uuid references public.profiles (id),
  player_b_id uuid references public.profiles (id),
  result text check (result is null or result in ('win_a', 'win_b')),
  margin text,
  course_name text,
  played_at date,
  created_at timestamptz not null default now(),
  constraint knockout_players_distinct check (
    player_a_id is null
    or player_b_id is null
    or player_a_id <> player_b_id
  )
);

create index idx_knockout_season_round on public.knockout_fixtures (season_id, round);

-- ─── Wagers & wallet ──────────────────────────────────────────────────────────
create table public.wagers (
  id uuid primary key default gen_random_uuid(),
  proposer_id uuid not null references public.profiles (id),
  opponent_id uuid not null references public.profiles (id),
  amount numeric(10, 2) not null check (amount > 0),
  status text not null check (
    status in (
      'pending_acceptance',
      'active',
      'pending_confirmation',
      'settled',
      'disputed'
    )
  ),
  result_winner_id uuid references public.profiles (id),
  result_margin text,
  result_course text,
  result_played_at date,
  proposer_confirmed boolean not null default false,
  opponent_confirmed boolean not null default false,
  settled_at timestamptz,
  created_at timestamptz not null default now(),
  constraint wagers_distinct_players check (proposer_id <> opponent_id)
);

create index idx_wagers_proposer on public.wagers (proposer_id);
create index idx_wagers_opponent on public.wagers (opponent_id);

create table public.wallet_transactions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.profiles (id) on delete cascade,
  amount numeric(10, 2) not null,
  type text not null check (
    type in ('wager_win', 'wager_loss', 'admin_credit', 'admin_debit')
  ),
  reference_id uuid references public.wagers (id),
  note text,
  created_at timestamptz not null default now()
);

create index idx_wallet_player on public.wallet_transactions (player_id, created_at desc);

-- ─── Feed & notifications ─────────────────────────────────────────────────────
create table public.activity_feed (
  id uuid primary key default gen_random_uuid(),
  season_id uuid not null references public.seasons (id) on delete cascade,
  type text not null check (
    type in (
      'matchplay',
      'strokeplay',
      'wager',
      'bonus_points',
      'knockout',
      'tour_score'
    )
  ),
  actor_id uuid not null references public.profiles (id),
  secondary_actor_id uuid references public.profiles (id),
  description text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index idx_activity_season_created on public.activity_feed (season_id, created_at desc);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type text not null,
  reference_id uuid,
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index idx_notifications_recipient on public.notifications (recipient_id, is_read, created_at desc);

-- ─── Tour ─────────────────────────────────────────────────────────────────────
create table public.tour_events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text not null check (status in ('setup', 'active', 'complete')),
  target_points numeric(4, 1) not null default 8.5,
  created_at timestamptz not null default now()
);

create table public.tour_players (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_events (id) on delete cascade,
  player_id uuid not null references public.profiles (id) on delete cascade,
  team text not null check (team in ('93s', '91s')),
  locked_handicap numeric(4, 1) not null,
  seed integer not null check (seed between 1 and 16),
  created_at timestamptz not null default now(),
  unique (tour_id, player_id),
  unique (tour_id, seed)
);

create index idx_tour_players_tour on public.tour_players (tour_id);

create table public.tour_courses (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_events (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

create index idx_tour_courses_tour on public.tour_courses (tour_id);

create table public.tour_holes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.tour_courses (id) on delete cascade,
  hole_number integer not null check (hole_number between 1 and 18),
  par integer not null check (par between 3 and 6),
  stroke_index integer not null check (stroke_index between 1 and 18),
  yardage integer,
  created_at timestamptz not null default now(),
  unique (course_id, hole_number)
);

create index idx_tour_holes_course on public.tour_holes (course_id);

create table public.tour_formats (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  scoring_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.tour_days (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_events (id) on delete cascade,
  day_number integer not null check (day_number between 1 and 3),
  course_id uuid not null references public.tour_courses (id),
  format_id uuid not null references public.tour_formats (id),
  status text not null check (status in ('setup', 'locked', 'in_progress', 'complete')),
  played_at date,
  created_at timestamptz not null default now(),
  unique (tour_id, day_number)
);

create index idx_tour_days_tour on public.tour_days (tour_id);

create table public.tour_matches (
  id uuid primary key default gen_random_uuid(),
  tour_day_id uuid not null references public.tour_days (id) on delete cascade,
  team_a text not null check (team_a in ('93s', '91s')),
  team_b text not null check (team_b in ('93s', '91s')),
  status text not null check (status in ('scheduled', 'in_progress', 'complete')),
  team_a_points numeric(4, 1) not null default 0,
  team_b_points numeric(4, 1) not null default 0,
  created_at timestamptz not null default now(),
  constraint tour_match_teams_opposed check (team_a <> team_b)
);

create index idx_tour_matches_day on public.tour_matches (tour_day_id);

create table public.tour_match_players (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.tour_matches (id) on delete cascade,
  tour_player_id uuid not null references public.tour_players (id) on delete cascade,
  team text not null check (team in ('93s', '91s')),
  pair_index integer not null check (pair_index in (0, 1)),
  unique (match_id, tour_player_id),
  unique (match_id, team, pair_index)
);

create index idx_tour_match_players_match on public.tour_match_players (match_id);

create table public.tour_hole_scores (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.tour_matches (id) on delete cascade,
  tour_player_id uuid not null references public.tour_players (id) on delete cascade,
  hole_number integer not null check (hole_number between 1 and 18),
  gross_score integer not null check (gross_score between 1 and 15),
  net_score numeric(4, 1) not null,
  stableford_points integer not null default 0,
  created_at timestamptz not null default now(),
  unique (match_id, tour_player_id, hole_number)
);

create index idx_tour_hole_scores_match on public.tour_hole_scores (match_id);

create table public.tour_chumps_picks (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_events (id) on delete cascade,
  picker_id uuid not null references public.profiles (id) on delete cascade,
  pick_1_id uuid not null references public.tour_players (id),
  pick_2_id uuid not null references public.tour_players (id),
  pick_3_id uuid not null references public.tour_players (id),
  pick_4_id uuid not null references public.tour_players (id),
  captain_id uuid not null references public.tour_players (id),
  captain_day integer not null check (captain_day between 1 and 3),
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (tour_id, picker_id)
);

create index idx_tour_chumps_tour on public.tour_chumps_picks (tour_id);

-- ─── Sign-up: mirror auth.users → profiles ───────────────────────────────────
create or replace function public.handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  dn text;
begin
  dn := coalesce(new.raw_user_meta_data ->> 'display_name', new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1));
  insert into public.profiles (id, display_name, initials, email)
  values (
    new.id,
    dn,
    upper(left(dn, 2)),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user ();

-- ─── RLS ──────────────────────────────────────────────────────────────────────
alter table public.profiles enable row level security;
alter table public.seasons enable row level security;
alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.matchplay_results enable row level security;
alter table public.sub_seasons enable row level security;
alter table public.strokeplay_rounds enable row level security;
alter table public.bonus_point_awards enable row level security;
alter table public.knockout_fixtures enable row level security;
alter table public.wagers enable row level security;
alter table public.wallet_transactions enable row level security;
alter table public.activity_feed enable row level security;
alter table public.notifications enable row level security;
alter table public.tour_events enable row level security;
alter table public.tour_players enable row level security;
alter table public.tour_courses enable row level security;
alter table public.tour_holes enable row level security;
alter table public.tour_formats enable row level security;
alter table public.tour_days enable row level security;
alter table public.tour_matches enable row level security;
alter table public.tour_match_players enable row level security;
alter table public.tour_hole_scores enable row level security;
alter table public.tour_chumps_picks enable row level security;

-- Helper: caller is admin (read from profiles; avoid recursion on same-table policies via security definer)
create or replace function public.is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select p.is_admin from public.profiles p where p.id = auth.uid()),
    false
  );
$$;

grant execute on function public.is_admin () to authenticated;

-- Profiles
create policy "Profiles are viewable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

create policy "Users insert own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy "Admins update any profile"
  on public.profiles for update
  to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

-- Seasons & groups: read all; write admin
create policy "Seasons read"
  on public.seasons for select to authenticated using (true);
create policy "Seasons write admin"
  on public.seasons for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Groups read"
  on public.groups for select to authenticated using (true);
create policy "Groups write admin"
  on public.groups for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Group memberships read"
  on public.group_memberships for select to authenticated using (true);
create policy "Group memberships write admin"
  on public.group_memberships for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

-- Matchplay: read all; insert if submitter is player_a
create policy "Matchplay read"
  on public.matchplay_results for select to authenticated using (true);
create policy "Matchplay insert own submission"
  on public.matchplay_results for insert to authenticated
  with check (auth.uid() = player_a_id);
create policy "Matchplay update admin"
  on public.matchplay_results for update to authenticated
  using (public.is_admin ())
  with check (public.is_admin ());

-- Sub-seasons & strokeplay
create policy "Sub-seasons read"
  on public.sub_seasons for select to authenticated using (true);
create policy "Sub-seasons write admin"
  on public.sub_seasons for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Strokeplay read"
  on public.strokeplay_rounds for select to authenticated using (true);
create policy "Strokeplay insert own"
  on public.strokeplay_rounds for insert to authenticated
  with check (auth.uid() = player_id);
create policy "Strokeplay update own or admin"
  on public.strokeplay_rounds for update to authenticated
  using (auth.uid() = player_id or public.is_admin ())
  with check (auth.uid() = player_id or public.is_admin ());

create policy "Bonus awards read"
  on public.bonus_point_awards for select to authenticated using (true);
create policy "Bonus awards write admin"
  on public.bonus_point_awards for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

-- Knockout
create policy "Knockout read"
  on public.knockout_fixtures for select to authenticated using (true);
create policy "Knockout write admin"
  on public.knockout_fixtures for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

-- Wagers
create policy "Wagers read participants"
  on public.wagers for select to authenticated
  using (
    auth.uid() in (proposer_id, opponent_id)
    or public.is_admin ()
  );
create policy "Wagers insert proposer"
  on public.wagers for insert to authenticated
  with check (auth.uid() = proposer_id);
create policy "Wagers update participants admin"
  on public.wagers for update to authenticated
  using (
    auth.uid() in (proposer_id, opponent_id)
    or public.is_admin ()
  )
  with check (
    auth.uid() in (proposer_id, opponent_id)
    or public.is_admin ()
  );

-- Wallet ledger: read own; writes via service role / admin paths (no client insert)
create policy "Wallet read own or admin"
  on public.wallet_transactions for select to authenticated
  using (auth.uid() = player_id or public.is_admin ());

-- Activity feed: read all; insert as actor (app) or admin
create policy "Activity read"
  on public.activity_feed for select to authenticated using (true);
create policy "Activity insert self as actor"
  on public.activity_feed for insert to authenticated
  with check (auth.uid() = actor_id or public.is_admin ());

-- Notifications: own rows only
create policy "Notifications read own"
  on public.notifications for select to authenticated
  using (auth.uid() = recipient_id or public.is_admin ());
create policy "Notifications update own"
  on public.notifications for update to authenticated
  using (auth.uid() = recipient_id)
  with check (auth.uid() = recipient_id);

-- Tour tables: read all authenticated; write admin (live scoring later via edge functions or expanded policies)
create policy "Tour events read"
  on public.tour_events for select to authenticated using (true);
create policy "Tour events write admin"
  on public.tour_events for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour players read"
  on public.tour_players for select to authenticated using (true);
create policy "Tour players write admin"
  on public.tour_players for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour courses read"
  on public.tour_courses for select to authenticated using (true);
create policy "Tour courses write admin"
  on public.tour_courses for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour holes read"
  on public.tour_holes for select to authenticated using (true);
create policy "Tour holes write admin"
  on public.tour_holes for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour formats read"
  on public.tour_formats for select to authenticated using (true);
create policy "Tour formats write admin"
  on public.tour_formats for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour days read"
  on public.tour_days for select to authenticated using (true);
create policy "Tour days write admin"
  on public.tour_days for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour matches read"
  on public.tour_matches for select to authenticated using (true);
create policy "Tour matches write admin"
  on public.tour_matches for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour match players read"
  on public.tour_match_players for select to authenticated using (true);
create policy "Tour match players write admin"
  on public.tour_match_players for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour hole scores read"
  on public.tour_hole_scores for select to authenticated using (true);
create policy "Tour hole scores write admin"
  on public.tour_hole_scores for all to authenticated using (public.is_admin ()) with check (public.is_admin ());

create policy "Tour chumps read"
  on public.tour_chumps_picks for select to authenticated using (true);
create policy "Tour chumps insert own"
  on public.tour_chumps_picks for insert to authenticated
  with check (auth.uid() = picker_id);
create policy "Tour chumps update own before lock"
  on public.tour_chumps_picks for update to authenticated
  using (auth.uid() = picker_id or public.is_admin ())
  with check (auth.uid() = picker_id or public.is_admin ());

comment on table public.profiles is 'Player profile; mirrors PRD profiles with display_name/handicap per app types.';
comment on table public.activity_feed is 'PRD: enable Realtime in dashboard for live feed.';
comment on table public.tour_hole_scores is 'PRD: enable Realtime for live scoring.';
