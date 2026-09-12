-- ---------------------------------------------------------------------------
-- 0012 — let a school decide whether parents see attendance
--
-- 0011 gave parents unconditional sight of their own child's attendance. That
-- is the right default, but some schools treat attendance as staff-only until
-- a pastoral conversation has happened, so it needs to be a choice.
--
-- Deliberately a school-level policy rather than a per-row flag. Grades carry
-- `visible_to_parent` because each grade is individually published; attendance
-- is not published mark by mark, and a per-row flag would mean a teacher
-- ticking a box on every register. `attendance_policies` already exists as the
-- per-school home for exactly this kind of setting.
--
-- Defaults to true, so behaviour is unchanged until a school opts out.
-- ---------------------------------------------------------------------------

alter table public.attendance_policies
  add column if not exists parent_visibility boolean not null default true;

comment on column public.attendance_policies.parent_visibility is
  'Whether linked parents may see their child''s attendance records. Enforced in RLS, not just the UI.';

-- Reads the school's setting. A school with no policy row has never configured
-- attendance, so it gets the default rather than being locked out.
create or replace function public.attendance_visible_to_parents(target_school uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  visible boolean;
begin
  if target_school is null then return false; end if;
  select p.parent_visibility into visible
  from public.attendance_policies p
  where p.school_id = target_school
  limit 1;
  return coalesce(visible, true);
end;
$$;

drop policy if exists attendance_records_select on public.attendance_records;
create policy attendance_records_select on public.attendance_records
  for select to authenticated
  using (
    public.is_member_of(school_id)
    and (
      public.runs_school(school_id)
      or public.teaches_class(class_id)
      or student_id = auth.uid()
      or (public.is_parent_of(student_id) and public.attendance_visible_to_parents(school_id))
    )
  );
