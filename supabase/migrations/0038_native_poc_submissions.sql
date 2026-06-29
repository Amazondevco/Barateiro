create table if not exists public.native_poc_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  local_id text not null,
  title text not null,
  location text not null,
  notes text not null,
  created_at_device timestamptz not null,
  created_at timestamptz not null default now()
);

alter table public.native_poc_submissions enable row level security;

create index if not exists native_poc_submissions_user_created_idx
  on public.native_poc_submissions (user_id, created_at desc);

create unique index if not exists native_poc_submissions_user_local_id_idx
  on public.native_poc_submissions (user_id, local_id);

drop policy if exists "native_poc_submissions_select_own" on public.native_poc_submissions;
create policy "native_poc_submissions_select_own"
  on public.native_poc_submissions
  for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "native_poc_submissions_insert_own" on public.native_poc_submissions;
create policy "native_poc_submissions_insert_own"
  on public.native_poc_submissions
  for insert
  to authenticated
  with check (auth.uid() = user_id);
