-- Tour scrapbook: polaroid memories from the round.

create table public.tour_scrapbook (
  id uuid primary key default gen_random_uuid(),
  tour_id uuid not null references public.tour_events (id) on delete cascade,
  match_id uuid references public.tour_matches (id) on delete set null,
  course_id uuid references public.tour_courses (id) on delete set null,
  day_number int check (day_number is null or day_number between 1 and 3),
  hole_number int check (hole_number is null or hole_number between 1 and 18),
  caption text not null default '',
  photo_path text not null,
  source text not null default 'extra'
    check (source in ('people', 'scene', 'detail', 'extra')),
  created_by uuid not null references public.profiles (id),
  created_at timestamptz not null default now()
);

create index idx_tour_scrapbook_tour on public.tour_scrapbook (tour_id, created_at desc);
create index idx_tour_scrapbook_match on public.tour_scrapbook (match_id);

alter table public.tour_scrapbook enable row level security;

create policy "Tour scrapbook read"
  on public.tour_scrapbook for select to authenticated
  using (true);

create policy "Tour scrapbook insert own"
  on public.tour_scrapbook for insert to authenticated
  with check (created_by = auth.uid());

create policy "Tour scrapbook update own"
  on public.tour_scrapbook for update to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

create policy "Tour scrapbook delete own"
  on public.tour_scrapbook for delete to authenticated
  using (created_by = auth.uid() or public.is_admin());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'tour-scrapbook',
  'tour-scrapbook',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

drop policy if exists "Tour scrapbook objects read" on storage.objects;
create policy "Tour scrapbook objects read"
  on storage.objects for select
  to public
  using (bucket_id = 'tour-scrapbook');

drop policy if exists "Tour scrapbook objects insert" on storage.objects;
create policy "Tour scrapbook objects insert"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'tour-scrapbook'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Tour scrapbook objects update" on storage.objects;
create policy "Tour scrapbook objects update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'tour-scrapbook'
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id = 'tour-scrapbook'
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Tour scrapbook objects delete" on storage.objects;
create policy "Tour scrapbook objects delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'tour-scrapbook'
    and (split_part(name, '/', 1) = auth.uid()::text or public.is_admin())
  );
