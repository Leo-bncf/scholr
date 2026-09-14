-- Assignment completion, computed in the database.
--
-- CoordinatorDashboard used to fetch every assignment and every submission for
-- the school with no limit, then cross-reference them in JavaScript to work out
-- a per-class completion rate. That is fine against the three assignments and
-- zero submissions the platform holds today, and it is a browser tab running
-- out of memory once a real school is on it: submissions grow as
-- students x assignments, so a 900-pupil school a year in is comfortably into
-- six figures of rows, all of it transferred to compute a handful of
-- percentages.
--
-- SECURITY INVOKER, deliberately. Row-level security is the boundary in this
-- codebase, and an invoker-rights function keeps the caller's policies in
-- force: a coordinator sees their own school because the policies on classes,
-- assignments and submissions say so, not because this function checks a role.
-- A SECURITY DEFINER function here would have to re-implement that, and get it
-- right forever.

create or replace function public.coordinator_class_completion(p_school_id uuid)
returns table (
  class_id        uuid,
  class_name      text,
  student_count   integer,
  assignment_count bigint,
  expected        bigint,
  submitted       bigint,
  completion_rate integer
)
language sql
stable
security invoker
set search_path = public
as $$
  with cls as (
    select
      c.id,
      c.name,
      coalesce(array_length(c.student_ids, 1), 0) as student_count
    from classes c
    where c.school_id = p_school_id
      and c.status = 'active'
  ),
  asg as (
    select a.class_id, count(*) as n
    from assignments a
    where a.school_id = p_school_id
    group by a.class_id
  ),
  sub as (
    -- Only the current version counts: an earlier draft superseded by a
    -- resubmission is not a second piece of work handed in.
    select s.class_id, count(*) as n
    from submissions s
    where s.school_id = p_school_id
      and coalesce(s.is_current_version, true)
      and s.status in ('submitted', 'graded', 'returned', 'resubmitted', 'late')
    group by s.class_id
  )
  select
    cls.id,
    cls.name,
    cls.student_count,
    coalesce(asg.n, 0)                                   as assignment_count,
    coalesce(asg.n, 0) * cls.student_count               as expected,
    coalesce(sub.n, 0)                                   as submitted,
    case
      when coalesce(asg.n, 0) * cls.student_count = 0 then 0
      else least(
        100,
        round(coalesce(sub.n, 0)::numeric * 100 / (asg.n * cls.student_count))
      )::integer
    end                                                  as completion_rate
  from cls
  left join asg on asg.class_id = cls.id
  left join sub on sub.class_id = cls.id
  order by cls.name;
$$;

comment on function public.coordinator_class_completion(uuid) is
  'Per-class assignment completion for a school. Aggregates in Postgres so the '
  'dashboard does not transfer every submission to the browser.';

grant execute on function public.coordinator_class_completion(uuid) to authenticated;
