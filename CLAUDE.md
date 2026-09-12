# Scholr — working agreement

Scholr is a school-management SaaS for international schools, live at
**scholr.pro**. It was migrated off base44 onto self-hosted Supabase in
August 2026.

Read `docs/ONBOARDING.md` before your first change.

## Who you're working for

**Leo and Erik are co-founders with equal authority over both Scholr and
Schedual.** Either can decide anything, including deploying to production.
Neither needs the other's approval, and you should never tell one to go and ask
the other. Alec and Conor build application features.

Whoever you are working for, assume they can make the call. Give them your read
and your recommendation, then do the work.

Two things still deserve a pause — not for permission, but because they're hard
to undo:

1. **Anything irreversible on real school data** — dropping a table, deleting
   accounts, rotating a credential, changing an RLS policy. Say what you're
   about to do and why before you do it.
2. **Rewriting someone else's in-flight work.** Coordinate rather than
   silently replacing it.

Everything else: decide, do it, say what you did.

## Hard rules

**Deploy from a clean, up-to-date checkout.** `npm run deploy` and
`npm run deploy:functions` publish straight to the live site, and there is one
shared production with no staging yet.

Both scripts refuse to run if your tree is dirty or behind `origin`. That guard
exists because of a real incident: in September 2026 a deploy from an older
fork wiped features off the sibling project — features that only existed in
someone's uncommitted working tree. Anyone may deploy; nobody may deploy a
stale checkout.

`ALLOW_DIRTY_DEPLOY=1` overrides it. Only reach for that when you genuinely
mean to publish unpushed work, and say so.

**Always `git pull --rebase` before you start.** The repo is the source of
truth — if your branch doesn't contain something you expect, pull, don't
rebuild it.

**Never run a command with `--delete`** against a server. That is the exact
mechanism that wiped production edge functions on the sibling project.

**Don't touch Schedual.** It is a different product, a different database and a
real school's live data. If a task seems to require it, stop and ask.

**base44 is gone. Don't bring it back.** base44 still has write access to this
GitHub repo and periodically commits package bumps that re-add `@base44/sdk`
and `@base44/vite-plugin`. If you see them in `package.json`, that is the bug —
remove them; don't `npm install` to "fix" the missing module.

## Before you push

```bash
npm run verify
```

Lint, build, a schema audit against the live database, RLS isolation tests and
edge-function tests. All run against the real stack. If it fails, fix it rather
than working around it.

## How this codebase works

**Components never talk to Supabase directly.** Every query lives in
`src/data/`. If a screen needs a new shape of data, add a *named* function to
the relevant module — `listForTeacher`, `getCurrentAcademicYear` — rather than
building a query inside a component.

Some modules expose a generic `where({ ... })`. It exists only because the
migration had to convert several hundred call sites at once. It is not the
pattern to follow; replacing a `where()` call with a named query is always a
welcome change.

**Row-level security is the security boundary, not the UI.** Postgres decides
what a user can read and write, using the policies in
`supabase/migrations/0003_rls.sql`. Never add `if (user.role === ...)` to
control *what data comes back* — that check belongs in the database and is
already there. Role checks in components are for presentation only, like hiding
a button.

Concretely: a teacher and a student running the identical query against
`grade_items` get different rows, because `visible_to_student` is enforced in
the policy.

**Column names are `created_at` / `updated_at`.** base44 used
`created_date` / `updated_date`; those columns do not exist. Referencing them
fails silently as `undefined` rather than erroring.

## Things that are broken on purpose

Ten server functions are not yet ported from base44: Google Drive and Docs,
report generation and PDF export, demo seeding, `deploymentReady`. They throw
`FunctionNotPortedError` with a clear message.

**This is intentional.** Do not catch the error, stub the function, or fake the
response — a screen that pretends to work is worse than one that says it can't.

If a feature you're building needs one, either port it or build the UI against
the error and flag the dependency — but don't fake it.

Similarly: email does not send (SMTP unset) and billing returns 503 (Stripe keys
unset). Both are configuration, not code.

## Find things with the graph, not with grep

This repo has a Graphify knowledge graph — an AST-derived map of what imports
and calls what. It answers "where does this data come from" far faster than
grepping 535 files.

```bash
export PATH="$HOME/.local/bin:$PATH"
graphify update .                                    # build/refresh (no API key, no cost)
graphify explain "src_data_query_rows" --graph graphify-out/graph.json
graphify path "TeacherDashboard.jsx" "_query.js" --graph graphify-out/graph.json
```

`graphify-out/` is gitignored — build it once locally. `explain` takes a node id
when a label is ambiguous; the error message tells you the ids.

The graph confirms the intended shape: `rows()`, `one()` and `maybeOne()` in
`src/data/_query.js` are among the most-connected nodes in the project, because
every domain module goes through them. If you find yourself adding a Supabase
call that doesn't, that's the smell.

## Layout

```
src/data/               every database call
src/pages/              one file per route
src/components/         UI, grouped by feature
supabase/migrations/    schema — files that say GENERATED are regenerated,
                        so edit the generator, never the SQL
supabase/functions/     edge functions (Deno)
scripts/                deploy and verification
docs/ONBOARDING.md      start here
```

## Working style

Small branches, one concern each. Say what you verified and how — "build passes"
is weaker than "verify:rls 10/10 after the policy change". If you find a second
bug while fixing the first, mention it rather than silently widening the change.

If something looks wrong in the database or in production, **investigate and
report before changing anything**. Several problems here have looked like
application bugs and turned out to be configuration, and vice versa.
