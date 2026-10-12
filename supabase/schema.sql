-- DefendIt cloud tables. Paste this whole file into Supabase → SQL Editor → Run.

-- 1) Each user's saved progress (one row per account)
create table if not exists public.user_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.user_data enable row level security;

drop policy if exists "read own data" on public.user_data;
drop policy if exists "insert own data" on public.user_data;
drop policy if exists "update own data" on public.user_data;
drop policy if exists "delete own data" on public.user_data;

create policy "read own data"   on public.user_data for select to authenticated using (auth.uid() = user_id);
create policy "insert own data" on public.user_data for insert to authenticated with check (auth.uid() = user_id);
create policy "update own data" on public.user_data for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own data" on public.user_data for delete to authenticated using (auth.uid() = user_id);

-- 2) Class leaderboard (students join with a class code)
create table if not exists public.leaderboard (
  class_code   text not null check (char_length(class_code) between 3 and 20),
  user_id      uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) <= 30),
  xp           integer not null default 0,
  streak       integer not null default 0,
  best_panel   numeric not null default 0,
  best_typing  integer not null default 0,
  badges       integer not null default 0,
  updated_at   timestamptz not null default now(),
  primary key (class_code, user_id)
);

create index if not exists leaderboard_class_xp on public.leaderboard (class_code, xp desc);

alter table public.leaderboard enable row level security;

drop policy if exists "signed-in users can read" on public.leaderboard;
drop policy if exists "insert own row" on public.leaderboard;
drop policy if exists "update own row" on public.leaderboard;
drop policy if exists "delete own row" on public.leaderboard;

-- Any signed-in student can see scores (only names and numbers are stored here, no thesis content).
create policy "signed-in users can read" on public.leaderboard for select to authenticated using (true);
create policy "insert own row" on public.leaderboard for insert to authenticated with check (auth.uid() = user_id);
create policy "update own row" on public.leaderboard for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "delete own row" on public.leaderboard for delete to authenticated using (auth.uid() = user_id);
