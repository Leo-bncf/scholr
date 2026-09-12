# Working on Scholr

Read this first; it takes about ten minutes to be productive.

## You probably don't need Tailscale

The API is public through Cloudflare, so the app runs locally against the real
backend with no VPN. Tailscale only gives you SSH into the server, which
frontend work doesn't require. If you were sent a Tailscale key, keep it — it's
for the day you need the server itself.

## Get running

```bash
git clone https://github.com/Leo-bncf/scholr.git
cd scholr
npm install
cp .env.example .env.local     # then paste the anon key you were sent
npm run dev
```

`VITE_SUPABASE_ANON_KEY` is safe to hold: it only grants the anonymous Postgres
role. Every table has row-level security, so what you can actually read or write
is decided by your own login, not by that key.

## What the loop actually looks like

Everything runs on your own laptop. You need **Node 20+**, **git** and an editor
— nothing else. No Docker, no database locally, no server access.

1. `npm run dev` starts Vite and prints a URL:

   ```
   VITE v6.4.1  ready in 84 ms
   ➜  Local:   http://localhost:5173/
   ```

2. Open that in a browser. You get the real app, signed in as whichever demo
   account you choose.
3. Edit a file in VS Code and save. The browser updates in under a second — no
   rebuild, no refresh.
4. The data comes over HTTPS from `api.scholr.pro`, the same backend the live
   site uses. That's why you see real classes and grades rather than fixtures.

So: **your code is local, your data is remote.** The only thing running on your
machine is the frontend.

VS Code will offer to install the recommended extensions (ESLint, Tailwind
IntelliSense) from `.vscode/extensions.json`. Say yes — lint-on-save is
configured, and unused imports are the most common reason `npm run verify`
fails.

## Sign in

Signups are disabled — Scholr is invite-only. Use one of the demo accounts.
**Leo will send you the password separately** — it isn't in this repo, because
these are real logins on the live system and the repo is public.

| Account | Role | Good for |
| --- | --- | --- |
| `admin@scholr.dev` | school_admin | Setup, users, classes, billing |
| `coordinator@scholr.dev` | ib_coordinator | Cohorts, predicted grades, IB core |
| `teacher@scholr.dev` | teacher | Gradebook, assignments, attendance |
| `student@scholr.dev` | student | Student dashboard, submissions |
| `parent@scholr.dev` | parent | Parent portal |

They belong to **Demo International School**, which has an academic year, three
terms, four IB subjects, three classes, assignments, grades and attendance.

To rebuild it from scratch (it's safe and repeatable):

```bash
SEED_PASSWORD='choose-one' ssh leo@scholr-prod 'sudo -E bash -s' < scripts/seed-dev-school.sh
```

## Where things are

```
src/data/          every database call lives here — start here
src/pages/         one file per route
src/components/    UI, grouped by feature
supabase/migrations/   the schema; generated files say so at the top
supabase/functions/    edge functions (Deno)
scripts/           deploy and verification
```

### The one rule about data access

**Components never talk to Supabase directly.** They call a function in
`src/data/`, which owns the query. If a screen needs data in a shape that
doesn't exist yet, add a named function to the relevant module rather than
building a query in the component.

Some modules expose a generic `where({ ... })`. It exists because the migration
off base44 had to convert several hundred call sites at once. Prefer a named
function; if you touch a `where()` call, that's a good moment to replace it.

### Row-level security is the real boundary

Don't add `if (user.role === ...)` checks to decide what data comes back.
Postgres already decided — see [`RLS_IMPLEMENTATION.md`](../src/docs/RLS_IMPLEMENTATION.md).
Role checks in the UI are for *presentation* (hide a button), never for
protection.

A concrete example you can see in the demo data: the teacher and the student
run the same query against `grade_items` and get different rows, because
`visible_to_student` is enforced in the policy.

## Before you push

```bash
npm run verify
```

That runs lint, build, a schema audit against the live database, the RLS
isolation tests, and the edge-function tests. All of them run against the real
stack, not mocks.

Two more, run as needed:

```bash
npm run verify:data     # every column the app selects actually exists
npm run deploy          # build, publish, confirm the live bundle changed
```

`verify:data` is worth knowing about: the data modules hand-write their column
lists, and a typo there is neither a build error nor a test failure — it's a 400
the first time someone opens that screen.

## Things that will bite you

- **Some features are deliberately broken.** Ten server functions aren't ported
  from base44 yet: Google Drive, demo seeding, report PDFs, `deploymentReady`.
  They throw `FunctionNotPortedError` with a clear message. That's intentional —
  don't "fix" it by catching the error.
- **Email doesn't send.** SMTP isn't configured, so invitations create the
  record and return an accept link, but no email goes out.
- **Billing returns 503.** Stripe keys aren't set.
- **The database is shared and it is production.** There's no separate dev
  instance yet. The demo school is yours to break; don't delete other schools.
- **base44 is gone.** If you find a reference to it outside a comment, it's a
  bug. Its old column names were `created_date` / `updated_date`; ours are
  `created_at` / `updated_at`.

## Who does what

**Leo and Erik are co-founders with equal authority** over Scholr and Schedual
alike — either can decide anything, including deploying. The split below is
about focus, not permission.

| | Focus |
| --- | --- |
| Leo | Infrastructure, database, server functions, integrations |
| Erik | Public site, marketing, i18n |
| Alec | Application features — the product surface |
| Conor | Application features — the product surface |

Alec and Conor are both in application code, so **split by feature area, not by
layer**, or you'll spend your time in merge conflicts.

Agree who owns gradebook, attendance, reporting, timetable and so on before
starting, and keep branches short.

## Deploying

`main` is not auto-deployed. `npm run deploy` publishes the frontend;
`npm run deploy:functions` publishes edge functions and restarts the runtime.

There's one shared production and no staging yet, so both scripts **refuse to
run from a dirty or out-of-date checkout**. That's not about who's allowed —
it's because a deploy from a stale fork once wiped features off the sibling
project. Pull, commit, push, then deploy. `ALLOW_DIRTY_DEPLOY=1` overrides it
if you really mean to publish unpushed work.
