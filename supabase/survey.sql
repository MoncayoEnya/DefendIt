-- DefendIt evaluation survey tables.
-- Run this in Supabase → SQL Editor → Run (after schema.sql). Safe to run more than once.

create table if not exists public.surveys (
  code       text primary key check (code ~ '^[A-Z0-9-]{4,24}$'),
  owner      uuid not null references auth.users (id) on delete cascade,
  title      text not null default 'DefendIt evaluation' check (char_length(title) <= 120),
  created_at timestamptz not null default now()
);

create table if not exists public.survey_responses (
  id         uuid primary key default gen_random_uuid(),
  code       text not null references public.surveys (code) on delete cascade,
  answers    jsonb not null check (pg_column_size(answers) < 20000),
  created_at timestamptz not null default now()
);
create index if not exists survey_responses_code on public.survey_responses (code);

alter table public.surveys enable row level security;
alter table public.survey_responses enable row level security;

drop policy if exists "anyone can look up a survey" on public.surveys;
drop policy if exists "create own survey" on public.surveys;
drop policy if exists "delete own survey" on public.surveys;
drop policy if exists "anyone can answer an existing survey" on public.survey_responses;
drop policy if exists "owner reads responses" on public.survey_responses;
drop policy if exists "owner deletes responses" on public.survey_responses;

-- Respondents only need the survey code; they do not need an account.
create policy "anyone can look up a survey" on public.surveys for select to anon, authenticated using (true);
create policy "create own survey" on public.surveys for insert to authenticated with check (auth.uid() = owner);
create policy "delete own survey" on public.surveys for delete to authenticated using (auth.uid() = owner);

create policy "anyone can answer an existing survey" on public.survey_responses for insert to anon, authenticated
  with check (exists (select 1 from public.surveys s where s.code = survey_responses.code));
-- Only the researcher who created the survey can read or delete its answers.
create policy "owner reads responses" on public.survey_responses for select to authenticated
  using (exists (select 1 from public.surveys s where s.code = survey_responses.code and s.owner = auth.uid()));
create policy "owner deletes responses" on public.survey_responses for delete to authenticated
  using (exists (select 1 from public.surveys s where s.code = survey_responses.code and s.owner = auth.uid()));
