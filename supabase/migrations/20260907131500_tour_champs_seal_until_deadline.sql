-- Seal Tour Champs picks until champs_deadline; expose who submitted without revealing teams.
-- Default deadline: Thu 10 Sep 2026 10:00 SAST.

update public.tour_events
set champs_deadline = '2026-09-10 08:00:00+00'
where champs_deadline is null;

create or replace function public.tour_champs_is_revealed(p_tour_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (
      select now() >= coalesce(e.champs_deadline, '2026-09-10 08:00:00+00'::timestamptz)
      from public.tour_events e
      where e.id = p_tour_id
    ),
    false
  );
$$;

revoke all on function public.tour_champs_is_revealed(uuid) from public;
grant execute on function public.tour_champs_is_revealed(uuid) to authenticated;

-- Who has locked in (no pick details). Readable before reveal.
create or replace function public.tour_champs_submitted_pickers(p_tour_id uuid)
returns table (picker_id uuid, submitted_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select c.picker_id, c.created_at
  from public.tour_chumps_picks c
  where c.tour_id = p_tour_id
  order by c.created_at;
$$;

revoke all on function public.tour_champs_submitted_pickers(uuid) from public;
grant execute on function public.tour_champs_submitted_pickers(uuid) to authenticated;

drop policy if exists "Tour chumps read" on public.tour_chumps_picks;

create policy "Tour chumps read own or after reveal"
  on public.tour_chumps_picks for select to authenticated
  using (
    picker_id = auth.uid()
    or public.tour_champs_is_revealed(tour_id)
  );

-- Harden writes: no insert/update after deadline (admin still can).
create or replace function public.tour_champs_assert_editable()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.is_admin() then
    return new;
  end if;
  if public.tour_champs_is_revealed(new.tour_id) then
    raise exception 'Tour Champs picks are locked';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_tour_champs_assert_editable on public.tour_chumps_picks;
create trigger trg_tour_champs_assert_editable
  before insert or update on public.tour_chumps_picks
  for each row execute function public.tour_champs_assert_editable();
