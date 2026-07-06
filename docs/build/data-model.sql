-- ============================================================
-- Boilerplate Trainer — Supabase schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query).
-- Safe to run once on a fresh project. It creates tables, roles,
-- the signup trigger, and row-level security policies.
-- ============================================================

-- ---------- Enums ----------
create type user_role as enum ('learner', 'author');
create type modality as enum ('V', 'A', 'R', 'K');
create type asset_type as enum (
  'diagram', 'annotated_screenshot', 'script', 'discussion_prompts',
  'written_guide', 'quiz', 'exercise'
);
create type asset_status as enum ('draft', 'published');
create type exercise_status as enum ('not_started', 'in_progress', 'submitted', 'verified');
create type review_status as enum ('pending', 'verified', 'returned');
create type concept_track as enum ('using', 'setup');

-- ---------- boilerplate_versions ----------
create table boilerplate_versions (
  id            uuid primary key default gen_random_uuid(),
  figma_file_key text not null,
  version_label  text not null,
  is_current     boolean not null default false,
  published_at   timestamptz not null default now()
);

-- ---------- concepts ----------
-- order_index replaces the plan's "order" (a reserved word).
-- why, track, plugin_checks, and source carry the extra fields from concept-map.json.
create table concepts (
  id            uuid primary key default gen_random_uuid(),
  version_id    uuid not null references boilerplate_versions(id) on delete cascade,
  slug          text not null,
  title         text not null,
  summary       text not null,
  why           text,
  track         concept_track not null default 'using',
  order_index   integer not null,
  prerequisites text[] not null default '{}',   -- array of concept slugs
  plugin_checks text[] not null default '{}',
  source        text[] not null default '{}',
  unique (version_id, slug)
);

-- ---------- profiles ----------
-- One row per authenticated user. Created automatically on signup (trigger below).
create table profiles (
  user_id          uuid primary key references auth.users(id) on delete cascade,
  role             user_role not null default 'learner',
  modality_weights jsonb not null default '{"V":0.25,"A":0.25,"R":0.25,"K":0.25}',
  created_at       timestamptz not null default now()
);

-- ---------- lesson_assets ----------
create table lesson_assets (
  id         uuid primary key default gen_random_uuid(),
  concept_id uuid not null references concepts(id) on delete cascade,
  modality   modality not null,
  type       asset_type not null,
  content    jsonb not null default '{}',
  media_url  text,
  status     asset_status not null default 'draft',
  updated_at timestamptz not null default now()
);

-- ---------- progress ----------
create table progress (
  user_id         uuid not null references auth.users(id) on delete cascade,
  concept_id      uuid not null references concepts(id) on delete cascade,
  exercise_status exercise_status not null default 'not_started',
  quiz_score      integer,
  completed_at    timestamptz,
  primary key (user_id, concept_id)
);

-- ---------- exercise_submissions ----------
create table exercise_submissions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  concept_id    uuid not null references concepts(id) on delete cascade,
  figma_link    text not null,
  notes         text,
  reviewed_by   uuid references auth.users(id),
  review_status review_status not null default 'pending',
  review_note   text,
  created_at    timestamptz not null default now()
);

-- ---------- Helper: is the current user an author? ----------
create or replace function is_author()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from profiles
    where user_id = auth.uid() and role = 'author'
  );
$$;

-- ---------- Signup trigger: create a profile for every new user ----------
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ============================================================
-- Row-level security
-- Learners read published content and manage only their own rows.
-- Authors can do everything.
-- ============================================================
alter table boilerplate_versions  enable row level security;
alter table concepts              enable row level security;
alter table profiles              enable row level security;
alter table lesson_assets         enable row level security;
alter table progress              enable row level security;
alter table exercise_submissions  enable row level security;

-- boilerplate_versions: everyone signed in can read; authors write.
create policy bv_read  on boilerplate_versions for select to authenticated using (true);
create policy bv_write on boilerplate_versions for all    to authenticated using (is_author()) with check (is_author());

-- concepts: everyone signed in can read; authors write.
create policy concepts_read  on concepts for select to authenticated using (true);
create policy concepts_write on concepts for all    to authenticated using (is_author()) with check (is_author());

-- profiles: a user reads and updates their own; authors read all.
create policy profiles_self_read   on profiles for select to authenticated using (user_id = auth.uid() or is_author());
create policy profiles_self_update on profiles for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- lesson_assets: authors do everything; learners read published only.
create policy assets_author_all on lesson_assets for all    to authenticated using (is_author()) with check (is_author());
create policy assets_read       on lesson_assets for select to authenticated using (status = 'published' or is_author());

-- progress: a user manages their own; authors read all.
create policy progress_self on progress for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy progress_author_read on progress for select to authenticated using (is_author());

-- exercise_submissions: a user manages their own; authors read all and update reviews.
create policy subs_self         on exercise_submissions for all    to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy subs_author_read  on exercise_submissions for select to authenticated using (is_author());
create policy subs_author_update on exercise_submissions for update to authenticated using (is_author()) with check (is_author());

-- ============================================================
-- After running this:
-- 1) In Auth settings, restrict sign-ups to the steadfast.design domain.
-- 2) To make someone an author, set their profiles.role to 'author'
--    (Table editor, or: update profiles set role = 'author' where user_id = '...').
-- ============================================================
