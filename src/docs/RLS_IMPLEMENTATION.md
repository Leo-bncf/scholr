# Row-level security

Tenant isolation in Scholr is enforced by **Postgres**, not by the frontend.

Every table in `public` has RLS enabled and at least one policy. The policies
live in [`supabase/migrations/0003_rls.sql`](../../supabase/migrations/0003_rls.sql)
(generated) and [`0004_profiles_rls.sql`](../../supabase/migrations/0004_profiles_rls.sql)
(hand-written). A signed-in user's JWT decides what they can read and write; the
browser cannot widen it, because the anon key only ever grants the `anon`
Postgres role and the caller's JWT supplies the rest.

## How a policy resolves

Four helper functions do the work, all defined in `0001_core.sql`:

| Function | Answers |
| --- | --- |
| `auth.uid()` | Who is calling |
| `public.current_app_role()` | Their platform role from `profiles` |
| `public.is_super_admin()` | Whether they bypass tenancy entirely |
| `public.is_member_of(school)` | Whether they belong to that school |
| `public.has_school_role(school, roles[])` | Whether they hold one of those roles *at that school* |

Membership is the tenancy boundary — `school_memberships` is what
`is_member_of` and `has_school_role` read. Treat that table as
security-relevant.

## Publication is a security boundary

`grade_items`, `predicted_grades` and `behavior_records` carry
`visible_to_student` / `visible_to_parent`. These are enforced in the policy,
not just in the UI: a student querying the API directly still cannot see a
grade whose `visible_to_student` is false.

This means data-layer queries in `src/data/` generally do **not** filter on
those flags — Postgres already has. Writes, however, must set them
deliberately, which is why `gradebook.setVisibility()` exists as its own
function rather than being folded into a generic update.

## What replaced the old client-side helpers

This project previously carried `src/lib/rls.js`, `src/hooks/useRLS.js` and
`RLSProvider`, which filtered records in the browser after fetching them. That
was inherited from base44 and has been removed: it offered no protection (the
API returned the rows regardless) and nothing consumed the context.

## Testing it

`scripts/rls-smoke-test.sh` seeds two schools with an admin, a teacher and a
student, mints real JWTs, and asserts that cross-tenant reads and writes are
refused and that unpublished grades stay hidden. Run it after any policy
change:

```bash
ssh leo@scholr-prod 'sudo bash -s' < scripts/rls-smoke-test.sh
```

It cleans up after itself and exits non-zero on any failure.

## Known gap

`visible_to_parent = true` currently lets **any** member of the school read the
row, not only the linked parent. That is base44's original semantics, carried
over deliberately rather than changed silently. Tightening it means an `EXISTS`
against `parent_student_links`, and should happen before real parents use the
system.
