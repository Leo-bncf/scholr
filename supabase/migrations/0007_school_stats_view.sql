-- ---------------------------------------------------------------------------
-- 0007 — per-school counts as a view
--
-- The super-admin screens need "how many years / terms / subjects / classes /
-- members does each school have". The code this replaces fetched all five
-- tables across every school (capped at 5000 rows each, so it silently
-- truncated once the platform grew) and counted them in JavaScript.
--
-- security_invoker = true is the important part: the view runs with the
-- CALLER's permissions, so RLS still applies. A super admin sees every school;
-- a school admin querying the same view sees only their own row. Without it the
-- view would run as its owner and leak every school's numbers to anyone.
-- ---------------------------------------------------------------------------

create or replace view public.school_stats
with (security_invoker = true) as
select
  s.id                                                                   as school_id,
  s.name,
  s.status,
  s.billing_status,
  (select count(*) from public.academic_years     a where a.school_id = s.id) as academic_years,
  (select count(*) from public.terms              t where t.school_id = s.id) as terms,
  (select count(*) from public.subjects           j where j.school_id = s.id) as subjects,
  (select count(*) from public.classes            c where c.school_id = s.id) as classes,
  (select count(*) from public.school_memberships m where m.school_id = s.id) as members,
  (select count(*) from public.school_memberships m
     where m.school_id = s.id and m.role = 'student' and m.status = 'active') as students,
  (select count(*) from public.school_memberships m
     where m.school_id = s.id and m.role = 'teacher' and m.status = 'active') as teachers
from public.schools s;

comment on view public.school_stats is
  'Per-school counts for admin dashboards. security_invoker, so RLS on the underlying tables decides which rows a caller sees.';

grant select on public.school_stats to authenticated;
