-- Demo reset: remove kdbar17's matchplay entries so they can re-enter for demo.
-- Also seeds rich demo data (matchplay, strokeplay, wagers) for all other players.
-- Safe to run once; every insert is guarded by a `where not exists` check.

do $$
declare
  v_season_id       uuid;
  v_sub_opener      uuid;
  -- Group IDs
  v_group_a         uuid;
  v_group_b         uuid;
  v_group_c         uuid;
  v_group_d         uuid;
  -- Group A players
  v_duane           uuid;
  v_stevend         uuid;
  v_michael         uuid;
  v_chef            uuid;
  v_chad            uuid;
  -- Group B players
  v_sean            uuid;
  v_peter           uuid;
  v_bunting         uuid;
  v_bester          uuid;
  -- Group C players
  v_kyran           uuid;
  v_nickstr         uuid;
  v_ryanhawky       uuid;
  v_dylan           uuid;
  -- Group D players (no kdbar17)
  v_kdbar           uuid;
  v_brehep          uuid;
  v_rmbm            uuid;
  v_darryn          uuid;
  -- Wager tracking
  v_wager_id        uuid;
begin

  -- ── Resolve season & sub-season ────────────────────────────────────────
  select id into v_season_id from public.seasons where is_active = true;
  if v_season_id is null then
    raise exception 'No active season found';
  end if;

  select id into v_sub_opener
    from public.sub_seasons
    where season_id = v_season_id and name = 'Season Opener';

  -- ── Resolve groups ──────────────────────────────────────────────────────
  select id into v_group_a from public.groups where season_id = v_season_id and name = 'Group A';
  select id into v_group_b from public.groups where season_id = v_season_id and name = 'Group B';
  select id into v_group_c from public.groups where season_id = v_season_id and name = 'Group C';
  select id into v_group_d from public.groups where season_id = v_season_id and name = 'Group D';

  -- ── Resolve player UUIDs by display_name ───────────────────────────────
  select id into v_kdbar    from public.profiles where display_name = 'kdbar17';
  select id into v_duane    from public.profiles where display_name = 'duane.muller';
  select id into v_stevend  from public.profiles where display_name = 'steventdunbar';
  select id into v_michael  from public.profiles where display_name = 'michaelglanville1709';
  select id into v_chef     from public.profiles where display_name = 'chefjonevanscooks';
  select id into v_chad     from public.profiles where display_name = 'chad';
  select id into v_sean     from public.profiles where display_name = 'sean';
  select id into v_peter    from public.profiles where display_name = 'peter.vs';
  select id into v_bunting  from public.profiles where display_name = 'buntingbuilds';
  select id into v_bester   from public.profiles where display_name = 'bester.zade';
  select id into v_kyran    from public.profiles where display_name = 'kyran';
  select id into v_nickstr  from public.profiles where display_name = 'nickstroucken';
  select id into v_ryanhawky from public.profiles where display_name = 'ryanhawky';
  select id into v_dylan    from public.profiles where display_name = 'dylan';
  select id into v_brehep   from public.profiles where display_name = 'brehep';
  select id into v_rmbm     from public.profiles where display_name = 'rmbminnaar';
  select id into v_darryn   from public.profiles where display_name = 'darrynaitken';

  -- ══════════════════════════════════════════════════════════════════════
  -- 1. CLEAR kdbar17's matchplay results (and related activity feed)
  -- ══════════════════════════════════════════════════════════════════════
  if v_kdbar is not null then
    delete from public.activity_feed
    where season_id = v_season_id
      and type = 'matchplay'
      and (actor_id = v_kdbar or secondary_actor_id = v_kdbar);

    delete from public.matchplay_results
    where season_id = v_season_id
      and (player_a_id = v_kdbar or player_b_id = v_kdbar);
  end if;

  -- ══════════════════════════════════════════════════════════════════════
  -- 2. MATCHPLAY RESULTS — demo fixtures for all groups
  -- ══════════════════════════════════════════════════════════════════════

  -- ── Group A ────────────────────────────────────────────────────────────
  if v_duane is not null and v_stevend is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_a, v_duane, v_stevend, 'win_a', '3&2', 'Steenberg Golf Club', '2026-03-21'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_a
        and (player_a_id, player_b_id) in ((v_duane, v_stevend), (v_stevend, v_duane))
    );
  end if;

  if v_chad is not null and v_duane is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_a, v_chad, v_duane, 'win_a', '1 up', 'Westlake Golf Club', '2026-04-05'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_a
        and (player_a_id, player_b_id) in ((v_chad, v_duane), (v_duane, v_chad))
    );
  end if;

  if v_michael is not null and v_chef is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_a, v_michael, v_chef, 'win_a', '4&3', 'Clovelly Country Club', '2026-03-28'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_a
        and (player_a_id, player_b_id) in ((v_michael, v_chef), (v_chef, v_michael))
    );
  end if;

  if v_stevend is not null and v_chad is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_a, v_stevend, v_chad, 'draw', 'all square', 'Royal Cape Golf Club', '2026-04-12'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_a
        and (player_a_id, player_b_id) in ((v_stevend, v_chad), (v_chad, v_stevend))
    );
  end if;

  if v_chef is not null and v_duane is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_a, v_chef, v_duane, 'win_b', '2&1', 'Milnerton Golf Club', '2026-04-19'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_a
        and (player_a_id, player_b_id) in ((v_chef, v_duane), (v_duane, v_chef))
    );
  end if;

  -- ── Group B ────────────────────────────────────────────────────────────
  if v_sean is not null and v_peter is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_b, v_sean, v_peter, 'win_a', '2 up', 'Parow Golf Club', '2026-03-20'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_b
        and (player_a_id, player_b_id) in ((v_sean, v_peter), (v_peter, v_sean))
    );
  end if;

  if v_bunting is not null and v_bester is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_b, v_bunting, v_bester, 'win_a', '5&4', 'King David Mowbray Golf Club', '2026-04-02'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_b
        and (player_a_id, player_b_id) in ((v_bunting, v_bester), (v_bester, v_bunting))
    );
  end if;

  if v_peter is not null and v_bunting is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_b, v_peter, v_bunting, 'win_b', '1 up', 'Westlake Golf Club', '2026-04-10'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_b
        and (player_a_id, player_b_id) in ((v_peter, v_bunting), (v_bunting, v_peter))
    );
  end if;

  if v_sean is not null and v_bester is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_b, v_sean, v_bester, 'draw', 'all square', 'Steenberg Golf Club', '2026-04-17'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_b
        and (player_a_id, player_b_id) in ((v_sean, v_bester), (v_bester, v_sean))
    );
  end if;

  if v_peter is not null and v_bester is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_b, v_peter, v_bester, 'win_a', '3&1', 'Royal Cape Golf Club', '2026-04-19'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_b
        and (player_a_id, player_b_id) in ((v_peter, v_bester), (v_bester, v_peter))
    );
  end if;

  -- ── Group C ────────────────────────────────────────────────────────────
  if v_kyran is not null and v_nickstr is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_c, v_kyran, v_nickstr, 'win_a', '2&1', 'Clovelly Country Club', '2026-03-22'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_c
        and (player_a_id, player_b_id) in ((v_kyran, v_nickstr), (v_nickstr, v_kyran))
    );
  end if;

  if v_ryanhawky is not null and v_dylan is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_c, v_ryanhawky, v_dylan, 'win_b', '3&1', 'Royal Cape Golf Club', '2026-03-29'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_c
        and (player_a_id, player_b_id) in ((v_ryanhawky, v_dylan), (v_dylan, v_ryanhawky))
    );
  end if;

  if v_kyran is not null and v_ryanhawky is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_c, v_kyran, v_ryanhawky, 'draw', 'all square', 'Westlake Golf Club', '2026-04-06'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_c
        and (player_a_id, player_b_id) in ((v_kyran, v_ryanhawky), (v_ryanhawky, v_kyran))
    );
  end if;

  if v_nickstr is not null and v_dylan is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_c, v_nickstr, v_dylan, 'win_a', '4&2', 'Steenberg Golf Club', '2026-04-13'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_c
        and (player_a_id, player_b_id) in ((v_nickstr, v_dylan), (v_dylan, v_nickstr))
    );
  end if;

  if v_kyran is not null and v_dylan is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_c, v_kyran, v_dylan, 'win_a', '2 up', 'Parow Golf Club', '2026-04-19'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_c
        and (player_a_id, player_b_id) in ((v_kyran, v_dylan), (v_dylan, v_kyran))
    );
  end if;

  -- ── Group D (kdbar17 excluded — cleared above so they can enter fresh) ─
  if v_brehep is not null and v_rmbm is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_d, v_brehep, v_rmbm, 'win_a', '2 up', 'Milnerton Golf Club', '2026-03-25'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_d
        and (player_a_id, player_b_id) in ((v_brehep, v_rmbm), (v_rmbm, v_brehep))
    );
  end if;

  if v_darryn is not null and v_brehep is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_d, v_darryn, v_brehep, 'win_b', '1 up', 'Parow Golf Club', '2026-04-08'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_d
        and (player_a_id, player_b_id) in ((v_darryn, v_brehep), (v_brehep, v_darryn))
    );
  end if;

  if v_rmbm is not null and v_darryn is not null then
    insert into public.matchplay_results
      (season_id, group_id, player_a_id, player_b_id, result, margin, course_name, played_at)
    select v_season_id, v_group_d, v_rmbm, v_darryn, 'draw', 'all square', 'King David Mowbray Golf Club', '2026-04-15'
    where not exists (
      select 1 from public.matchplay_results
      where season_id = v_season_id and group_id = v_group_d
        and (player_a_id, player_b_id) in ((v_rmbm, v_darryn), (v_darryn, v_rmbm))
    );
  end if;

  -- ══════════════════════════════════════════════════════════════════════
  -- 3. STROKEPLAY ROUNDS — Season Opener sub-season
  -- ══════════════════════════════════════════════════════════════════════

  if v_sub_opener is null then
    raise notice 'Season Opener sub-season not found; skipping strokeplay inserts';
  else

    -- duane.muller (course HCP ~14)
    if v_duane is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_duane, v_sub_opener, 'Steenberg Golf Club',      '2026-03-14', 14, 87, 73.0, true,  array[v_duane]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_duane and sub_season_id = v_sub_opener and played_at = '2026-03-14');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_duane, v_sub_opener, 'Royal Cape Golf Club',     '2026-04-02', 14, 91, 77.0, true,  array[v_duane]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_duane and sub_season_id = v_sub_opener and played_at = '2026-04-02');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_duane, v_sub_opener, 'Clovelly Country Club',    '2026-04-16', 16, 89, 73.0, false, array[v_duane]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_duane and sub_season_id = v_sub_opener and played_at = '2026-04-16');
    end if;

    -- steventdunbar (course HCP ~10)
    if v_stevend is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_stevend, v_sub_opener, 'Westlake Golf Club',     '2026-03-18', 10, 83, 73.0, true,  array[v_stevend]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_stevend and sub_season_id = v_sub_opener and played_at = '2026-03-18');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_stevend, v_sub_opener, 'Steenberg Golf Club',    '2026-04-07', 10, 80, 70.0, true,  array[v_stevend]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_stevend and sub_season_id = v_sub_opener and played_at = '2026-04-07');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_stevend, v_sub_opener, 'Milnerton Golf Club',    '2026-04-17', 11, 85, 74.0, false, array[v_stevend]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_stevend and sub_season_id = v_sub_opener and played_at = '2026-04-17');
    end if;

    -- sean (course HCP ~16)
    if v_sean is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_sean, v_sub_opener, 'Parow Golf Club',           '2026-03-16', 16, 92, 76.0, true,  array[v_sean]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_sean and sub_season_id = v_sub_opener and played_at = '2026-03-16');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_sean, v_sub_opener, 'Milnerton Golf Club',       '2026-04-04', 16, 88, 72.0, true,  array[v_sean]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_sean and sub_season_id = v_sub_opener and played_at = '2026-04-04');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_sean, v_sub_opener, 'King David Mowbray Golf Club', '2026-04-18', 16, 90, 74.0, false, array[v_sean]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_sean and sub_season_id = v_sub_opener and played_at = '2026-04-18');
    end if;

    -- kyran (course HCP ~8)
    if v_kyran is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_kyran, v_sub_opener, 'Clovelly Country Club',    '2026-03-19', 8,  82, 74.0, true,  array[v_kyran]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_kyran and sub_season_id = v_sub_opener and played_at = '2026-03-19');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_kyran, v_sub_opener, 'Royal Cape Golf Club',     '2026-04-01', 8,  79, 71.0, true,  array[v_kyran]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_kyran and sub_season_id = v_sub_opener and played_at = '2026-04-01');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_kyran, v_sub_opener, 'Steenberg Golf Club',      '2026-04-14', 8,  84, 76.0, false, array[v_kyran]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_kyran and sub_season_id = v_sub_opener and played_at = '2026-04-14');
    end if;

    -- nickstroucken (course HCP ~9)
    if v_nickstr is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_nickstr, v_sub_opener, 'Steenberg Golf Club',    '2026-03-21', 9,  83, 74.0, true,  array[v_nickstr]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_nickstr and sub_season_id = v_sub_opener and played_at = '2026-03-21');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_nickstr, v_sub_opener, 'Clovelly Country Club',  '2026-04-10', 9,  81, 72.0, true,  array[v_nickstr]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_nickstr and sub_season_id = v_sub_opener and played_at = '2026-04-10');
    end if;

    -- ryanhawky (course HCP ~12)
    if v_ryanhawky is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_ryanhawky, v_sub_opener, 'Parow Golf Club',      '2026-03-23', 12, 86, 74.0, true,  array[v_ryanhawky]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_ryanhawky and sub_season_id = v_sub_opener and played_at = '2026-03-23');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_ryanhawky, v_sub_opener, 'Royal Cape Golf Club', '2026-04-11', 12, 85, 73.0, true,  array[v_ryanhawky]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_ryanhawky and sub_season_id = v_sub_opener and played_at = '2026-04-11');
    end if;

    -- brehep (course HCP ~18)
    if v_brehep is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_brehep, v_sub_opener, 'Milnerton Golf Club',     '2026-03-17', 18, 95, 77.0, true,  array[v_brehep]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_brehep and sub_season_id = v_sub_opener and played_at = '2026-03-17');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_brehep, v_sub_opener, 'Westlake Golf Club',      '2026-04-09', 18, 91, 73.0, true,  array[v_brehep]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_brehep and sub_season_id = v_sub_opener and played_at = '2026-04-09');
    end if;

    -- rmbminnaar (course HCP ~11)
    if v_rmbm is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_rmbm, v_sub_opener, 'King David Mowbray Golf Club', '2026-03-26', 11, 84, 73.0, true,  array[v_rmbm]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_rmbm and sub_season_id = v_sub_opener and played_at = '2026-03-26');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_rmbm, v_sub_opener, 'Steenberg Golf Club',       '2026-04-15', 11, 82, 71.0, true,  array[v_rmbm]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_rmbm and sub_season_id = v_sub_opener and played_at = '2026-04-15');
    end if;

    -- darrynaitken (course HCP ~15)
    if v_darryn is not null then
      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_darryn, v_sub_opener, 'Westlake Golf Club',      '2026-03-24', 15, 90, 75.0, true,  array[v_darryn]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_darryn and sub_season_id = v_sub_opener and played_at = '2026-03-24');

      insert into public.strokeplay_rounds
        (player_id, sub_season_id, course_name, played_at, course_handicap, gross_score, net_score, counts_for_ranking, present_player_ids)
      select v_darryn, v_sub_opener, 'Clovelly Country Club',   '2026-04-12', 15, 88, 73.0, true,  array[v_darryn]
      where not exists (select 1 from public.strokeplay_rounds where player_id = v_darryn and sub_season_id = v_sub_opener and played_at = '2026-04-12');
    end if;

  end if; -- v_sub_opener guard

  -- ══════════════════════════════════════════════════════════════════════
  -- 4. WAGERS — mix of settled, active, and pending
  -- ══════════════════════════════════════════════════════════════════════

  -- Settled wager: duane beats sean — R150
  if v_duane is not null and v_sean is not null then
    if not exists (
      select 1 from public.wagers
      where proposer_id = v_duane and opponent_id = v_sean and status = 'settled'
    ) then
      insert into public.wagers (
        proposer_id, opponent_id, amount, status,
        result_winner_id, result_margin, result_course, result_played_at,
        proposer_confirmed, opponent_confirmed, settled_at
      )
      values (
        v_duane, v_sean, 150.00, 'settled',
        v_duane, '2&1', 'Steenberg Golf Club', '2026-03-21',
        true, true, now() - interval '30 days'
      )
      returning id into v_wager_id;

      insert into public.wallet_transactions (player_id, amount, type, reference_id)
      values
        (v_duane,  150.00, 'wager_win',  v_wager_id),
        (v_sean,  -150.00, 'wager_loss', v_wager_id);

      update public.profiles set wallet_balance = wallet_balance + 150.00 where id = v_duane;
      update public.profiles set wallet_balance = wallet_balance - 150.00 where id = v_sean;
    end if;
  end if;

  -- Settled wager: kyran beats brehep — R200
  if v_kyran is not null and v_brehep is not null then
    if not exists (
      select 1 from public.wagers
      where proposer_id = v_kyran and opponent_id = v_brehep and status = 'settled'
    ) then
      insert into public.wagers (
        proposer_id, opponent_id, amount, status,
        result_winner_id, result_margin, result_course, result_played_at,
        proposer_confirmed, opponent_confirmed, settled_at
      )
      values (
        v_kyran, v_brehep, 200.00, 'settled',
        v_kyran, '3&2', 'Clovelly Country Club', '2026-03-22',
        true, true, now() - interval '28 days'
      )
      returning id into v_wager_id;

      insert into public.wallet_transactions (player_id, amount, type, reference_id)
      values
        (v_kyran,   200.00, 'wager_win',  v_wager_id),
        (v_brehep, -200.00, 'wager_loss', v_wager_id);

      update public.profiles set wallet_balance = wallet_balance + 200.00 where id = v_kyran;
      update public.profiles set wallet_balance = wallet_balance - 200.00 where id = v_brehep;
    end if;
  end if;

  -- Settled wager: nickstr vs rmbm — halved (draw, no wallet movement)
  if v_nickstr is not null and v_rmbm is not null then
    if not exists (
      select 1 from public.wagers
      where proposer_id = v_nickstr and opponent_id = v_rmbm and status = 'settled'
    ) then
      insert into public.wagers (
        proposer_id, opponent_id, amount, status,
        result_winner_id, result_margin, result_course, result_played_at,
        proposer_confirmed, opponent_confirmed, settled_at
      )
      values (
        v_nickstr, v_rmbm, 100.00, 'settled',
        null, 'all square', 'King David Mowbray Golf Club', '2026-04-02',
        true, true, now() - interval '18 days'
      );
      -- No wallet transactions: halved wager means no money changes hands
    end if;
  end if;

  -- Settled wager: sean beats bunting — R100
  if v_sean is not null and v_bunting is not null then
    if not exists (
      select 1 from public.wagers
      where proposer_id = v_sean and opponent_id = v_bunting and status = 'settled'
    ) then
      insert into public.wagers (
        proposer_id, opponent_id, amount, status,
        result_winner_id, result_margin, result_course, result_played_at,
        proposer_confirmed, opponent_confirmed, settled_at
      )
      values (
        v_sean, v_bunting, 100.00, 'settled',
        v_sean, '1 up', 'Westlake Golf Club', '2026-04-10',
        true, true, now() - interval '10 days'
      )
      returning id into v_wager_id;

      insert into public.wallet_transactions (player_id, amount, type, reference_id)
      values
        (v_sean,    100.00, 'wager_win',  v_wager_id),
        (v_bunting,-100.00, 'wager_loss', v_wager_id);

      update public.profiles set wallet_balance = wallet_balance + 100.00 where id = v_sean;
      update public.profiles set wallet_balance = wallet_balance - 100.00 where id = v_bunting;
    end if;
  end if;

  -- Active wager: steventd vs ryanhawky — R100 (accepted, being played)
  if v_stevend is not null and v_ryanhawky is not null then
    if not exists (
      select 1 from public.wagers
      where proposer_id = v_stevend and opponent_id = v_ryanhawky and status = 'active'
    ) then
      insert into public.wagers (
        proposer_id, opponent_id, amount, status,
        proposer_confirmed, opponent_confirmed
      )
      values (v_stevend, v_ryanhawky, 100.00, 'active', false, false);
    end if;
  end if;

  -- Active wager: darryn vs rmbm — R125
  if v_darryn is not null and v_rmbm is not null then
    if not exists (
      select 1 from public.wagers
      where proposer_id = v_darryn and opponent_id = v_rmbm and status = 'active'
    ) then
      insert into public.wagers (
        proposer_id, opponent_id, amount, status,
        proposer_confirmed, opponent_confirmed
      )
      values (v_darryn, v_rmbm, 125.00, 'active', false, false);
    end if;
  end if;

  -- Pending acceptance: chad challenges darryn — R75
  if v_chad is not null and v_darryn is not null then
    if not exists (
      select 1 from public.wagers
      where proposer_id = v_chad and opponent_id = v_darryn and status = 'pending_acceptance'
    ) then
      insert into public.wagers (
        proposer_id, opponent_id, amount, status,
        proposer_confirmed, opponent_confirmed
      )
      values (v_chad, v_darryn, 75.00, 'pending_acceptance', false, false);
    end if;
  end if;

  -- Pending acceptance: peter challenges michael — R200
  if v_peter is not null and v_michael is not null then
    if not exists (
      select 1 from public.wagers
      where proposer_id = v_peter and opponent_id = v_michael and status = 'pending_acceptance'
    ) then
      insert into public.wagers (
        proposer_id, opponent_id, amount, status,
        proposer_confirmed, opponent_confirmed
      )
      values (v_peter, v_michael, 200.00, 'pending_acceptance', false, false);
    end if;
  end if;

end $$;
