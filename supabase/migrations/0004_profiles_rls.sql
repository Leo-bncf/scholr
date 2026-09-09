-- ---------------------------------------------------------------------------
-- 0004 — profiles RLS
--
-- Hand-written, and separate from 0001 only because these policies reference
-- school_memberships, which 0002 creates. Policy expressions are resolved at
-- CREATE POLICY time, so they cannot live alongside the table definition.
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;

create policy profiles_super_admin on public.profiles
  for all to authenticated using (public.is_super_admin()) with check (public.is_super_admin());

create policy profiles_self_read on public.profiles
  for select to authenticated using (id = auth.uid());

-- Deliberately narrower than "update your row": role and active_school_id are
-- privilege-bearing. A user changing their own role to super_admin would be a
-- straight privilege escalation, so those two columns are server-side only
-- (edge functions using the service role). Enforced by the trigger below
-- rather than the policy, because RLS can't express per-column rules.
create policy profiles_self_update on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

create or replace function public.guard_profile_privileges()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    return new; -- service role / server-side: no restriction
  end if;
  if public.is_super_admin() then
    return new;
  end if;
  if new.role is distinct from old.role then
    raise exception 'role cannot be changed by the account holder';
  end if;
  -- Switching active school is fine, but only to a school you belong to.
  if new.active_school_id is distinct from old.active_school_id
     and new.active_school_id is not null
     and not public.is_member_of(new.active_school_id) then
    raise exception 'cannot switch to a school you are not a member of';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_privileges before update on public.profiles
  for each row execute function public.guard_profile_privileges();

-- You can see someone's profile if you share an active school with them. This
-- is what makes class rosters and teacher/student pickers work without
-- exposing the whole user table across tenants.
create policy profiles_shared_school_read on public.profiles
  for select to authenticated using (
    exists (
      select 1
      from public.school_memberships them
      join public.school_memberships me on me.school_id = them.school_id
      where them.user_id = profiles.id
        and me.user_id = auth.uid()
        and them.status = 'active'
        and me.status = 'active'
    )
  );
