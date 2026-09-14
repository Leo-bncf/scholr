-- Platform health, for the super-admin console.
--
-- Reading server state from the browser needs a function, because the metrics
-- live in catalog views that no application role can select from directly.
-- This is SECURITY DEFINER, so the first thing it does is check the caller —
-- a definer function without that check is a privilege-escalation hole, not a
-- convenience.
--
-- It returns only aggregates: sizes, counts, ratios. No row contents, no
-- school data, nothing that could leak one tenant's information to another.

create or replace function public.platform_health()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_catalog
as $$
declare
  result jsonb;
begin
  if not public.is_super_admin() then
    raise exception 'platform_health is restricted to super admins'
      using errcode = '42501';
  end if;

  select jsonb_build_object(
    'database', jsonb_build_object(
      'size_bytes',   pg_database_size(current_database()),
      'size_pretty',  pg_size_pretty(pg_database_size(current_database())),
      'uptime_seconds', extract(epoch from (now() - pg_postmaster_start_time()))::bigint,
      'started_at',   pg_postmaster_start_time(),
      'version',      substring(version() from 'PostgreSQL [0-9.]+')
    ),
    'connections', jsonb_build_object(
      'active', (select count(*) from pg_stat_activity where datname = current_database()),
      'max',    (select setting::int from pg_settings where name = 'max_connections')
    ),
    -- Below about 99% on a warm database, reads are hitting disk and something
    -- wants an index.
    'cache_hit_ratio', (
      select round(100.0 * sum(blks_hit) / nullif(sum(blks_hit) + sum(blks_read), 0), 2)
      from pg_stat_database where datname = current_database()
    ),
    'transactions', jsonb_build_object(
      'committed',  (select xact_commit from pg_stat_database where datname = current_database()),
      'rolled_back',(select xact_rollback from pg_stat_database where datname = current_database())
    ),
    'largest_tables', (
      select coalesce(jsonb_agg(t), '[]'::jsonb) from (
        select
          relname as name,
          n_live_tup as rows,
          pg_size_pretty(pg_total_relation_size(relid)) as size,
          pg_total_relation_size(relid) as size_bytes
        from pg_stat_user_tables
        order by pg_total_relation_size(relid) desc
        limit 8
      ) t
    ),
    'tenancy', jsonb_build_object(
      'schools',  (select count(*) from public.schools),
      'users',    (select count(*) from auth.users),
      'members',  (select count(*) from public.school_memberships where status = 'active')
    ),
    'measured_at', now()
  ) into result;

  return result;
end;
$$;

revoke all on function public.platform_health() from public, anon;
grant execute on function public.platform_health() to authenticated;

comment on function public.platform_health() is
  'Aggregate database and tenancy metrics for the super-admin console. Refuses any caller that is not a super admin.';
