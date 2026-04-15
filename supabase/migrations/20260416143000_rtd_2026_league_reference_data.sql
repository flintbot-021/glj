-- Race to Dias 2026 — season, bonus stroke legs, empty match-play groups (no app mock data).
-- Profile rows come from auth; memberships: `rtd_group_memberships_auth_display_names`.

do $$
declare
  v_season_id uuid;
begin
  select s.id
  into v_season_id
  from public.seasons s
  where s.year = 2026
  order by s.is_active desc nulls last, s.created_at desc
  limit 1;

  if v_season_id is null then
    update public.seasons set is_active = false where is_active = true;
    insert into public.seasons (name, year, win_points, draw_points, loss_points, is_active, start_date, end_date)
    values ('Race to Dias 2026', 2026, 3, 1, 0, true, '2026-03-04', '2026-09-13')
    returning id into v_season_id;
  else
    update public.seasons set is_active = false where is_active = true and id <> v_season_id;
    update public.seasons
    set
      name = 'Race to Dias 2026',
      start_date = '2026-03-04',
      end_date = '2026-09-13',
      is_active = true
    where id = v_season_id;
  end if;

  -- Bonus stroke-play legs (Season Schedule slide)
  insert into public.sub_seasons (season_id, name, start_date, end_date, status, bonus_1st, bonus_2nd, bonus_3rd)
  select v_season_id, v.name, v.start_date, v.end_date, v.status, 1.5, 1.0, 0.5
  from (
    values
      ('Season Opener', date '2026-03-04', date '2026-05-07', 'open'),
      ('Winter Grind', date '2026-05-08', date '2026-07-10', 'closed'),
      ('Home Stretch', date '2026-07-11', date '2026-09-13', 'closed')
  ) as v(name, start_date, end_date, status)
  where not exists (
    select 1 from public.sub_seasons ss
    where ss.season_id = v_season_id and ss.name = v.name
  );

  update public.sub_seasons ss
  set
    start_date = v.start_date,
    end_date = v.end_date,
    status = v.status
  from (
    values
      ('Season Opener', date '2026-03-04', date '2026-05-07', 'open'::text),
      ('Winter Grind', date '2026-05-08', date '2026-07-10', 'closed'::text),
      ('Home Stretch', date '2026-07-11', date '2026-09-13', 'closed'::text)
  ) as v(name, start_date, end_date, status)
  where ss.season_id = v_season_id and ss.name = v.name;

  -- Match-play groups (“The Groups” slide)
  insert into public.groups (season_id, name)
  select v_season_id, x
  from unnest(array['Group A', 'Group B', 'Group C', 'Group D']) as t(x)
  where not exists (select 1 from public.groups g where g.season_id = v_season_id and g.name = t.x);

  -- Player rows come from auth; group_memberships use real `profiles.display_name` in the next migration.
end $$;

comment on table public.seasons is 'RTD season; app reads is_active / dates from DB.';
comment on table public.sub_seasons is 'Stroke-play bonus legs; dates from season schedule (2026).';
