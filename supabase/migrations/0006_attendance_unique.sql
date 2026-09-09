-- ---------------------------------------------------------------------------
-- 0006 — one attendance record per student, per class, per day
--
-- Registers get re-taken: a teacher corrects a mark, or the page is submitted
-- twice. Without a unique key that produces duplicate rows for the same day,
-- which quietly skews every attendance rate computed from them.
--
-- This also gives `attendance.saveRegister` the conflict target it upserts on.
-- ---------------------------------------------------------------------------

-- Collapse any duplicates already present, keeping the most recently written.
delete from public.attendance_records a
using public.attendance_records b
where a.class_id = b.class_id
  and a.student_id = b.student_id
  and a.date = b.date
  and a.created_at < b.created_at;

create unique index if not exists attendance_records_class_student_date_key
  on public.attendance_records (class_id, student_id, date);
