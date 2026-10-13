-- Adds profile details to the class leaderboard (photo, course, school, badges).
-- Run once in Supabase > SQL Editor. Safe to run again.
alter table public.leaderboard add column if not exists photo text;
alter table public.leaderboard drop constraint if exists leaderboard_photo_check;
alter table public.leaderboard add constraint leaderboard_photo_check check (photo is null or char_length(photo) <= 20000);
alter table public.leaderboard add column if not exists course text check (course is null or char_length(course) <= 40);
alter table public.leaderboard add column if not exists school text check (school is null or char_length(school) <= 80);
alter table public.leaderboard add column if not exists full_name text check (full_name is null or char_length(full_name) <= 60);
alter table public.leaderboard add column if not exists badge_ids text[] not null default '{}';

-- tell Supabase about the new columns right away
notify pgrst, 'reload schema';
