-- is_demo tagging for the school demo-data seeding functions.
--
-- The onboarding "Generate / Remove demo data" controls promise that removing
-- demo data touches only what was generated. base44 had a [Demo]-tag
-- convention; the current schema had nothing, so that promise was nothing a
-- function could keep. These columns make it true: every row the seed
-- functions write is flagged is_demo, and the clear functions delete only
-- flagged rows. Additive per-table, default false, so untouched schools are
-- unaffected.

alter table public.academic_years
  add column if not exists is_demo boolean not null default false;
alter table public.terms
  add column if not exists is_demo boolean not null default false;
alter table public.subjects
  add column if not exists is_demo boolean not null default false;
alter table public.classes
  add column if not exists is_demo boolean not null default false;
alter table public.assignments
  add column if not exists is_demo boolean not null default false;
alter table public.grade_items
  add column if not exists is_demo boolean not null default false;
alter table public.attendance_records
  add column if not exists is_demo boolean not null default false;
alter table public.parent_student_links
  add column if not exists is_demo boolean not null default false;
alter table public.school_memberships
  add column if not exists is_demo boolean not null default false;