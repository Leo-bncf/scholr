-- Emit the whole public-schema shape as one JSON document, for
-- scripts/audit-schema.mjs to compare against base44's entity definitions.
--
--   ssh leo@scholr-prod 'sudo docker exec -i supabase-db psql -U postgres \
--     -d postgres -tAf -' < scripts/dump-schema.sql | node scripts/audit-schema.mjs
--
-- Read-only. Nothing is created in the database to support the audit.

select json_build_object(
  'columns', (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select table_name, column_name, data_type, is_nullable, column_default
      from information_schema.columns
      where table_schema = 'public'
      order by table_name, ordinal_position
    ) t
  ),
  'checks', (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select rel.relname as table_name, con.conname, pg_get_constraintdef(con.oid) as def
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      where n.nspname = 'public' and con.contype = 'c'
    ) t
  ),
  'policies', (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select tablename, policyname, cmd from pg_policies where schemaname = 'public'
    ) t
  ),
  'indexes', (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select tablename, indexdef from pg_indexes where schemaname = 'public'
    ) t
  ),
  'fks', (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select rel.relname as table_name, att.attname as column_name,
             pg_get_constraintdef(con.oid) as def
      from pg_constraint con
      join pg_class rel on rel.oid = con.conrelid
      join pg_namespace n on n.oid = rel.relnamespace
      join unnest(con.conkey) as k(attnum) on true
      join pg_attribute att on att.attrelid = rel.oid and att.attnum = k.attnum
      where n.nspname = 'public' and con.contype = 'f'
    ) t
  ),
  'rls', (
    select coalesce(json_agg(row_to_json(t)), '[]'::json) from (
      select c.relname as table_name, c.relrowsecurity as enabled
      from pg_class c join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relkind = 'r'
    ) t
  )
);
