-- School-scoped aggregates: numbers that used to ship whole tables to a
-- browser tab.
--
-- verify-query-bounds.mjs flags `where({ school_id })` reads of tables that
-- grow with the roll (submissions, behaviour, messages, ...). Each function
-- here replaces one of those reads with the handful of numbers the screen
-- actually drew, computed in Postgres: storage totals, a missing-work figure,
-- behaviour counts and the CAS overview.
--
-- All are SECURITY INVOKER, deliberately — row-level security is the boundary
-- in this codebase, and an invoker-rights function keeps the caller's policies
-- in force. A school admin's calls are already scoped to their own school by
-- the policies on the underlying tables; nothing here re-checks a role.

-- ── Behaviour counts by student and type ────────────────────────────────────
--
-- The analytics screen used to fetch every behaviour record in the school,
-- filter it by cohort in the browser and sum types. This returns one row per
-- (student, type); summing after the same cohort filter gives identical
-- numbers without transferring the records themselves.

create or replace function public.behavior_counts_by_student(p_school_id uuid)
returns table (
  student_id uuid,
  type       text,
  count      bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select student_id, type, count(*) as count
  from behavior_records
  where school_id = p_school_id
  group by student_id, type;
$$;

comment on function public.behavior_counts_by_student(uuid) is
  'Per-student behaviour totals by type, so analytics never transfers every record.';

grant execute on function public.behavior_counts_by_student(uuid) to authenticated;

-- ── Distinct behaviour categories ───────────────────────────────────────────
--
-- The behaviour dashboard's category filter used to be built from every
-- record; a distinct query is the same list without the rows.

create or replace function public.behavior_categories(p_school_id uuid)
returns table (
  category text
)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct category
  from behavior_records
  where school_id = p_school_id
    and category is not null;
$$;

comment on function public.behavior_categories(uuid) is
  'Distinct behaviour categories for a school, for filter dropdowns.';

grant execute on function public.behavior_categories(uuid) to authenticated;

-- ── Submission storage usage ────────────────────────────────────────────────
--
-- The files screen summed the size_bytes on every submission document in
-- JavaScript. `documents` is a jsonb array; expanding it here over the
-- caller's RLS-visible rows gives the same three numbers in one round trip.

create or replace function public.school_storage_usage(p_school_id uuid)
returns table (
  submission_count bigint,
  file_count       bigint,
  total_bytes      numeric
)
language sql
stable
security invoker
set search_path = public
as $$
  with docs as (
    select jsonb_array_elements(coalesce(s.documents, '[]'::jsonb)) as doc
    from submissions s
    where s.school_id = p_school_id
  )
  select
    (select count(*) from submissions s where s.school_id = p_school_id)::bigint as submission_count,
    (select count(*) from docs)::bigint                                          as file_count,
    coalesce((select sum(coalesce((doc ->> 'size_bytes')::numeric, 0)) from docs), 0) as total_bytes;
$$;

comment on function public.school_storage_usage(uuid) is
  'Submission count, document count and total tracked bytes for a school.';

grant execute on function public.school_storage_usage(uuid) to authenticated;

-- ── School-wide missing-work figure ─────────────────────────────────────────
--
-- The admin dashboard derived a missing-work percentage by fetching every
-- assignment and every submission. Expected is the sum of roster sizes over
-- published assignments in active classes; missing is the shortfall against
-- submissions in a submitted-or-graded state. Superseded versions are
-- deliberately not excluded here: the dashboard's calculation never was
-- version-aware, and keeping it so keeps the published number identical.

create or replace function public.school_missing_work(p_school_id uuid)
returns table (
  expected bigint,
  missing  bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  with pub as (
    select a.id, a.class_id
    from assignments a
    where a.school_id = p_school_id
      and a.status = 'published'
  ),
  cls as (
    select
      c.id,
      coalesce(array_length(c.student_ids, 1), 0) as n
    from classes c
    where c.school_id = p_school_id
      and c.status = 'active'
  ),
  sub as (
    select s.assignment_id, count(*) as n
    from submissions s
    where s.school_id = p_school_id
      and s.status in ('submitted', 'graded', 'returned', 'late', 'resubmitted')
    group by s.assignment_id
  )
  select
    coalesce(sum(cls.n), 0)::bigint                          as expected,
    coalesce(sum(greatest(0, cls.n - coalesce(sub.n, 0))), 0)::bigint as missing
  from pub
  join cls on cls.id = pub.class_id
  left join sub on sub.assignment_id = pub.id;
$$;

comment on function public.school_missing_work(uuid) is
  'Expected vs missing submissions for a school, aggregated in Postgres.';

grant execute on function public.school_missing_work(uuid) to authenticated;

-- ── CAS overview counts ─────────────────────────────────────────────────────
--
-- The IB Core overview filtered the whole CAS table in JavaScript for six
-- numbers (total, approved, awaiting approval, and one per strand).

create or replace function public.cas_school_summary(p_school_id uuid)
returns table (
  total      bigint,
  approved   bigint,
  pending    bigint,
  creativity bigint,
  activity   bigint,
  service    bigint
)
language sql
stable
security invoker
set search_path = public
as $$
  select
    count(*)                                   as total,
    count(*) filter (where status = 'approved')  as approved,
    count(*) filter (where status = 'completed') as pending,
    count(*) filter (where 'creativity' = any(cas_strands)) as creativity,
    count(*) filter (where 'activity' = any(cas_strands))   as activity,
    count(*) filter (where 'service' = any(cas_strands))    as service
  from cas_experiences
  where school_id = p_school_id;
$$;

comment on function public.cas_school_summary(uuid) is
  'CAS totals, approvals and strand counts for the IB Core overview.';

grant execute on function public.cas_school_summary(uuid) to authenticated;