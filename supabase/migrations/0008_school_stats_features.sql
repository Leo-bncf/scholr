-- ---------------------------------------------------------------------------
-- 0008 — feature-adoption counts on school_stats
--
-- The platform analytics screen asks "how many schools are actually using
-- messaging / attendance / behaviour / CAS?". It answered that by fetching
-- every row of each of those tables across the whole platform and building a
-- Set of school_ids — capped at 2000 rows each, so adoption was under-reported
-- the moment any one of them grew past that.
--
-- Counting in the view instead makes it one query and exact. Still
-- security_invoker, so a non-super-admin only ever sees their own school's row.
-- ---------------------------------------------------------------------------

-- CREATE OR REPLACE VIEW cannot insert columns into the middle of the list
-- ("cannot change name of view column"), so the view is dropped and rebuilt.
drop view if exists public.school_stats;

create view public.school_stats
with (security_invoker = true) as
select
  s.id                                                                   as school_id,
  s.name,
  s.status,
  s.billing_status,
  s.plan,
  s.created_at,
  (select count(*) from public.academic_years     a where a.school_id = s.id) as academic_years,
  (select count(*) from public.terms              t where t.school_id = s.id) as terms,
  (select count(*) from public.subjects           j where j.school_id = s.id) as subjects,
  (select count(*) from public.classes            c where c.school_id = s.id) as classes,
  (select count(*) from public.school_memberships m where m.school_id = s.id) as members,
  (select count(*) from public.school_memberships m
     where m.school_id = s.id and m.role = 'student' and m.status = 'active') as students,
  (select count(*) from public.school_memberships m
     where m.school_id = s.id and m.role = 'teacher' and m.status = 'active') as teachers,
  (select count(*) from public.messages            m where m.school_id = s.id) as messages,
  (select count(*) from public.attendance_records  r where r.school_id = s.id) as attendance_records,
  (select count(*) from public.behavior_records    b where b.school_id = s.id) as behavior_records,
  (select count(*) from public.cas_experiences     e where e.school_id = s.id) as cas_experiences
from public.schools s;

comment on view public.school_stats is
  'Per-school counts for admin dashboards, including feature adoption. security_invoker, so RLS on the underlying tables decides which rows a caller sees.';

grant select on public.school_stats to authenticated;
