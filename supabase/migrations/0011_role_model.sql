-- ---------------------------------------------------------------------------
-- 0011 — a deliberate role model for the five roles
--
-- The policies until now were translated from base44's declarations, and they
-- carried three real defects:
--
--   1. `visible_to_parent = true` was a bare condition, so ANY member of the
--      school could read that row — one student could read another student's
--      grades. Parents were never actually modelled.
--   2. Parents had no access to attendance or submissions at all, so the
--      parent portal could not show a child's own record.
--   3. Teachers could only see grades they had personally created. A teacher
--      taking over a class lost sight of every grade entered before them.
--
-- The model this establishes, applied consistently:
--
--   super_admin      everything, every school
--   school_admin     everything within their school
--   ib_coordinator   everything within their school
--   teacher          everything for the classes they teach
--   student          their own records, and only once published
--   parent           their linked children's records, once published to parents
--
-- "Published" is `visible_to_student` / `visible_to_parent`, and it stays a
-- database-enforced boundary rather than a UI filter.
-- ---------------------------------------------------------------------------

-- ── helpers ────────────────────────────────────────────────────────────────

-- Is the caller a linked parent/guardian of this student?
create or replace function public.is_parent_of(target_student uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if target_student is null or auth.uid() is null then return false; end if;
  return exists (
    select 1 from public.parent_student_links l
    where l.parent_id = auth.uid() and l.student_id = target_student
  );
end;
$$;

-- Does the caller teach this class? teacher_ids is a uuid[] carried over from
-- base44's shape, so this is array containment rather than a join table.
create or replace function public.teaches_class(target_class uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if target_class is null or auth.uid() is null then return false; end if;
  return exists (
    select 1 from public.classes c
    where c.id = target_class
      and (auth.uid() = any(c.teacher_ids) or c.primary_teacher_id = auth.uid())
  );
end;
$$;

-- Does the caller teach this student in any class?
create or replace function public.teaches_student(target_student uuid)
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if target_student is null or auth.uid() is null then return false; end if;
  return exists (
    select 1 from public.classes c
    where target_student = any(c.student_ids)
      and (auth.uid() = any(c.teacher_ids) or c.primary_teacher_id = auth.uid())
  );
end;
$$;

-- Shorthand: an admin or coordinator of this school.
create or replace function public.runs_school(target_school uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.has_school_role(target_school, array['school_admin','ib_coordinator']);
$$;

-- ── grade_items ────────────────────────────────────────────────────────────

drop policy if exists grade_items_select on public.grade_items;
create policy grade_items_select on public.grade_items
  for select to authenticated
  using (
    public.is_member_of(school_id)
    and (
      public.runs_school(school_id)
      or public.teaches_class(class_id)
      or created_by = auth.uid()
      or (student_id = auth.uid() and visible_to_student = true)
      -- The parent clause is now scoped to the actual parent. Previously
      -- `visible_to_parent = true` stood alone, so classmates could read it.
      or (visible_to_parent = true and public.is_parent_of(student_id))
    )
  );

drop policy if exists grade_items_insert on public.grade_items;
create policy grade_items_insert on public.grade_items
  for insert to authenticated
  with check (
    public.is_member_of(school_id)
    and (public.runs_school(school_id) or public.teaches_class(class_id))
  );

drop policy if exists grade_items_update on public.grade_items;
create policy grade_items_update on public.grade_items
  for update to authenticated
  using (public.runs_school(school_id) or public.teaches_class(class_id))
  with check (public.runs_school(school_id) or public.teaches_class(class_id));

drop policy if exists grade_items_delete on public.grade_items;
create policy grade_items_delete on public.grade_items
  for delete to authenticated
  using (public.runs_school(school_id) or created_by = auth.uid());

-- ── attendance_records ─────────────────────────────────────────────────────

drop policy if exists attendance_records_select on public.attendance_records;
create policy attendance_records_select on public.attendance_records
  for select to authenticated
  using (
    public.is_member_of(school_id)
    and (
      public.runs_school(school_id)
      or public.teaches_class(class_id)
      or student_id = auth.uid()
      -- Attendance is not "published" — a parent may always see their own
      -- child's. Withholding it has no pedagogical purpose and the parent
      -- portal is built to show it.
      or public.is_parent_of(student_id)
    )
  );

drop policy if exists attendance_records_insert on public.attendance_records;
create policy attendance_records_insert on public.attendance_records
  for insert to authenticated
  with check (public.runs_school(school_id) or public.teaches_class(class_id));

drop policy if exists attendance_records_update on public.attendance_records;
create policy attendance_records_update on public.attendance_records
  for update to authenticated
  using (public.runs_school(school_id) or public.teaches_class(class_id))
  with check (public.runs_school(school_id) or public.teaches_class(class_id));

drop policy if exists attendance_records_delete on public.attendance_records;
create policy attendance_records_delete on public.attendance_records
  for delete to authenticated
  using (public.has_school_role(school_id, array['school_admin']));

-- ── submissions ────────────────────────────────────────────────────────────

drop policy if exists submissions_select on public.submissions;
create policy submissions_select on public.submissions
  for select to authenticated
  using (
    public.is_member_of(school_id)
    and (
      public.runs_school(school_id)
      or public.teaches_class(class_id)
      or student_id = auth.uid()
      or public.is_parent_of(student_id)
    )
  );

drop policy if exists submissions_update on public.submissions;
create policy submissions_update on public.submissions
  for update to authenticated
  using (
    public.runs_school(school_id)
    or public.teaches_class(class_id)
    -- A student may revise their own work, but not after it has been marked.
    or (student_id = auth.uid() and status <> 'graded')
  )
  with check (
    public.runs_school(school_id) or public.teaches_class(class_id) or student_id = auth.uid()
  );

-- ── behavior_records ───────────────────────────────────────────────────────

drop policy if exists behavior_records_select on public.behavior_records;
create policy behavior_records_select on public.behavior_records
  for select to authenticated
  using (
    public.is_member_of(school_id)
    and (
      public.runs_school(school_id)
      or created_by = auth.uid()
      or public.teaches_student(student_id)
      or (student_id = auth.uid() and visible_to_student = true)
      or (visible_to_parent = true and public.is_parent_of(student_id))
    )
    -- staff_only overrides everything below admin: pastoral notes are not for
    -- the student or the family, whatever the visibility flags say.
    and (coalesce(staff_only, false) = false or public.runs_school(school_id) or created_by = auth.uid())
  );

-- ── predicted_grades ───────────────────────────────────────────────────────

drop policy if exists predicted_grades_select on public.predicted_grades;
create policy predicted_grades_select on public.predicted_grades
  for select to authenticated
  using (
    public.is_member_of(school_id)
    and (
      public.runs_school(school_id)
      or teacher_id = auth.uid()
      or public.teaches_class(class_id)
      or (student_id = auth.uid() and visible_to_student = true)
      or (visible_to_parent = true and public.is_parent_of(student_id))
    )
  );

-- ── parent_student_links ───────────────────────────────────────────────────
-- A parent must be able to read their own links, or the app cannot work out
-- which children to show.

drop policy if exists parent_student_links_select on public.parent_student_links;
create policy parent_student_links_select on public.parent_student_links
  for select to authenticated
  using (
    public.is_member_of(school_id)
    and (
      public.runs_school(school_id)
      or parent_id = auth.uid()
      or student_id = auth.uid()
    )
  );
