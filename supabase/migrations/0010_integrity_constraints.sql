-- ---------------------------------------------------------------------------
-- 0010 — uniqueness and the two indexes that are actually earned
--
-- An audit of the generated schema found that the ONLY unique constraints in
-- the database were primary keys. Every "there can be just one of these" rule
-- the application assumes was being enforced nowhere.
--
-- All five were verified duplicate-free before being applied.
-- ---------------------------------------------------------------------------

-- ── school_memberships: one membership per person per school ───────────────
-- The most consequential of these. Authorisation reads the caller's membership
-- with .maybeSingle(); given two rows that call returns an ERROR rather than a
-- row, so hasSchoolRole() sees null and denies. A duplicate membership would
-- therefore lock a legitimate admin out of their own school — failing closed,
-- but failing.
create unique index if not exists school_memberships_user_school_key
  on public.school_memberships (user_id, school_id);

-- ── user_invitations: the token is a credential ────────────────────────────
-- It's looked up with .maybeSingle() to decide who someone is allowed to
-- become. Uniqueness is what makes that lookup meaningful, and the database
-- should guarantee it rather than trusting crypto.randomUUID() at every call
-- site that ever writes an invitation.
create unique index if not exists user_invitations_token_key
  on public.user_invitations (invitation_token)
  where invitation_token is not null;

-- ── schools.slug: it identifies a school in a URL ──────────────────────────
create unique index if not exists schools_slug_key
  on public.schools (lower(slug))
  where slug is not null;

-- ── parent_student_links: a parent is linked to a child once ───────────────
-- Duplicates would double-count children on the parent dashboard and send
-- every notification twice.
create unique index if not exists parent_student_links_unique
  on public.parent_student_links (parent_id, student_id, school_id);

-- ── timetable_settings: one row per school ─────────────────────────────────
-- The app reads it as a singleton (takes the first row); make that true.
create unique index if not exists timetable_settings_school_key
  on public.timetable_settings (school_id);

-- ---------------------------------------------------------------------------
-- created_by indexes — only where they pay for themselves
--
-- The audit flagged 48 unindexed created_by foreign keys. Indexing all of them
-- would be the wrong call: it adds write cost to every insert across the whole
-- application to speed up ON DELETE SET NULL during user deletion, which is
-- rare and already fast at this size.
--
-- Two are different: these tables evaluate created_by inside an RLS policy, so
-- it is read on every query against them, not just on deletion.
-- ---------------------------------------------------------------------------

create index if not exists grade_items_created_by_idx
  on public.grade_items (created_by);

create index if not exists behavior_records_created_by_idx
  on public.behavior_records (created_by);
