-- Who has signed in lately, for the console's Sessions page.
--
-- auth.users is not readable by any application role, and it should not be:
-- it holds password hashes and recovery tokens. But "who has been in this
-- week, and is anyone privileged signing in from nowhere" is a question an
-- operator has to be able to answer, so this returns the two timestamps that
-- answer it and nothing else.
--
-- SECURITY DEFINER, so the first thing it does is check the caller. A definer
-- function over auth.users without that check is a credential leak, not a
-- convenience.
create or replace function public.recent_sign_ins(limit_n int default 100)
returns table (
  user_id        uuid,
  email          text,
  full_name      text,
  role           text,
  last_sign_in_at timestamptz,
  created_at     timestamptz,
  confirmed      boolean
)
language plpgsql
security definer
set search_path = public, auth, pg_catalog
as $$
begin
  if not public.is_super_admin() then
    raise exception 'recent_sign_ins is restricted to super admins'
      using errcode = '42501';
  end if;

  return query
  select
    u.id,
    u.email::text,
    p.full_name,
    coalesce(p.role, 'user')::text,
    u.last_sign_in_at,
    u.created_at,
    (u.email_confirmed_at is not null) as confirmed
  from auth.users u
  left join public.profiles p on p.id = u.id
  order by u.last_sign_in_at desc nulls last
  limit greatest(1, least(coalesce(limit_n, 100), 500));
end;
$$;

revoke all on function public.recent_sign_ins(int) from public, anon;
grant execute on function public.recent_sign_ins(int) to authenticated;

comment on function public.recent_sign_ins(int) is
  'Sign-in recency per account for the super-admin console. No password or token material. Refuses any caller that is not a super admin.';
