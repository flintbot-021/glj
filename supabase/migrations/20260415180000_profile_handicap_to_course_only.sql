-- RTD: no handicap on profiles (it changes; not used for regular league UX).
-- Strokeplay bonus rounds store per-round course handicap only.
-- Tour keeps locked_handicap on tour_players (unchanged).

alter table public.profiles drop column if exists handicap;

alter table public.strokeplay_rounds rename column handicap_used to course_handicap;

comment on table public.profiles is 'Player profile; extends auth user.';
comment on column public.strokeplay_rounds.course_handicap is 'Course handicap for this round (entered when submitting the score).';
