-- Map match-play groups to live `profiles.display_name` values from auth (not slide nicknames).
-- Replaces memberships for the 2026 RTD season only.

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
    raise exception 'No season for year 2026; apply rtd_2026_league_reference_data first';
  end if;

  delete from public.group_memberships gm
  using public.groups g
  where gm.group_id = g.id and g.season_id = v_season_id;

  insert into public.group_memberships (group_id, player_id)
  select g.id, p.id
  from (
    values
      ('Group A', 'duane.muller'),
      ('Group A', 'steventdunbar'),
      ('Group A', 'michaelglanville1709'),
      ('Group A', 'chefjonevanscooks'),
      ('Group A', 'chad'),
      ('Group B', 'sean'),
      ('Group B', 'peter.vs'),
      ('Group B', 'buntingbuilds'),
      ('Group B', 'bester.zade'),
      ('Group C', 'kyran'),
      ('Group C', 'nickstroucken'),
      ('Group C', 'ryanhawky'),
      ('Group C', 'dylan'),
      ('Group D', 'kdbar17'),
      ('Group D', 'brehep'),
      ('Group D', 'rmbminnaar'),
      ('Group D', 'darrynaitken')
  ) as m(group_name, display_name)
  inner join public.groups g on g.season_id = v_season_id and g.name = m.group_name
  inner join public.profiles p on p.display_name = m.display_name;
end $$;
