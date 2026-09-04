-- Days can exist with a format locked in before the course is known (e.g. Day 2 on arrival).
alter table public.tour_days
  alter column course_id drop not null;
