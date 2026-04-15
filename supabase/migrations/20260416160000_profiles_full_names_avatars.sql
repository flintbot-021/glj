-- Real names + Storage object paths for bucket `profile pictures` (see getSupabaseStoragePublicUrl).

alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles drop column if exists handicap;

update public.profiles p
set
  full_name = v.full_name,
  avatar_url = v.avatar_url,
  initials = v.initials
from (
  values
    ('duane.muller', 'Duane Muller', 'duane.jpg', 'DM'),
    ('steventdunbar', 'Steven Dunbar', 'steven.jpg', 'SD'),
    ('michaelglanville1709', 'Michael Glanville-Smith', 'mike.jpg', 'MG'),
    ('chefjonevanscooks', 'Jon Evans', 'jon.jpg', 'JE'),
    ('chad', 'Chad Lawson', 'laws.jpg', 'CL'),
    ('sean', 'Sean Todt', 'sean.png', 'ST'),
    ('peter.vs', 'Peter Van Schaik', 'peter.jpg', 'PV'),
    ('buntingbuilds', 'Michael Bunting', 'bunts.jpg', 'MB'),
    ('bester.zade', 'Zade Bester', 'zade.jpg', 'ZB'),
    ('kyran', 'Kyran Hawkins', 'kyran.jpg', 'KH'),
    ('nickstroucken', 'Nick Stroucken', 'nick.jpg', 'NS'),
    ('ryanhawky', 'Ryan Hawkins', 'ryan.jpg', 'RH'),
    ('dylan', 'Dylan Druce', 'drucey.jpg', 'DD'),
    ('kdbar17', 'Kevin Dunbar', 'kev.jpg', 'KD'),
    ('brehep', 'Brendan Hepburn', 'heps.jpg', 'BH'),
    ('rmbminnaar', 'Rob Minnaar', 'rob.jpg', 'RM'),
    ('darrynaitken', 'Darryn Aitken', 'darryn.jpg', 'DA')
) as v(display_name, full_name, avatar_url, initials)
where p.display_name = v.display_name;
