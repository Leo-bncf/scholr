-- ---------------------------------------------------------------------------
-- 0001 — core
--
-- Hand-written. base44's User entity has no direct equivalent here: it splits
-- into auth.users (identity, owned by GoTrue) and public.profiles (app data).
-- Everything downstream depends on profiles and the four helper functions at
-- the bottom, so this migration must run before the generated ones.
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles — 1:1 with auth.users
--
-- `role` here is the *platform* role. A user's role can differ per school, and
-- that lives on school_memberships.role; this column is the global default and
-- the only place super_admin is granted.
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text,
  display_name text,
  role text not null default 'user',
  -- FK to schools is added at the end of 0002, once that table exists.
  active_school_id uuid,
  phone text,
  avatar_url text,
  email_preferences jsonb not null default '{"assignments": true, "messages": true}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint profiles_role_check check (
    role in ('super_admin', 'school_admin', 'ib_coordinator', 'teacher', 'student', 'parent', 'user')
  )
);

create index profiles_active_school_idx on public.profiles (active_school_id);
create index profiles_email_idx on public.profiles (lower(email));

create trigger profiles_set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Mint a profile whenever GoTrue creates a user. Role and school assignment are
-- applied afterwards by the invitation flow — a self-signed-up user lands with
-- role 'user' and no school, which the app renders as the NoSchool page.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- helper functions used by every RLS policy
--
-- All are `stable security definer` so they can read profiles and
-- school_memberships without recursing through those tables' own RLS.
-- They reference tables created in 0002; plpgsql resolves names at run time,
-- so the forward reference is fine.
-- ---------------------------------------------------------------------------

create or replace function public.current_app_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select role = 'super_admin' from public.profiles where id = auth.uid()),
    false
  );
$$;

-- Membership is the tenancy boundary. base44 compared the row's school_id
-- against a single school_id on the user; using memberships instead means a
-- user who legitimately belongs to two schools keeps working, and a stale
-- active_school_id can never widen access.
create or replace function public.is_member_of(target_school uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if target_school is null then
    return false;
  end if;
  return exists (
    select 1 from public.school_memberships m
    where m.user_id = auth.uid()
      and m.school_id = target_school
      and m.status = 'active'
  );
end;
$$;

create or replace function public.has_school_role(target_school uuid, roles text[])
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if target_school is null then
    return false;
  end if;
  return exists (
    select 1 from public.school_memberships m
    where m.user_id = auth.uid()
      and m.school_id = target_school
      and m.status = 'active'
      and m.role = any(roles)
  );
end;
$$;

-- profiles RLS lives in 0004: its policies reference school_memberships, and
-- unlike plpgsql bodies, policy expressions are resolved when created.
