#!/usr/bin/env bash
#
# Create a demo school with working logins, so the app is explorable.
#
#   ssh leo@scholr-prod 'sudo bash -s' < scripts/seed-dev-school.sh
#   ssh leo@scholr-prod 'sudo bash -s' < scripts/seed-dev-school.sh -- --reset
#
# Why this exists: signups are disabled (Scholr is invite-only) and invitations
# need SMTP, which isn't configured yet. Without this a new developer installs
# the app and finds nothing to log into.
#
# Accounts are created through GoTrue's admin API, not by inserting into
# auth.users — rows inserted directly lack fields GoTrue requires, and the
# account then can't be deleted or managed through the admin API.
#
# Everything it creates is tagged demo-* / @scholr.dev so --reset can remove it
# cleanly. Safe to re-run.

set -uo pipefail
cd /opt/supabase/docker
. ./.env

PSQL="docker exec -i supabase-db psql -U postgres -d postgres"
PSQLQ="docker exec supabase-db psql -U postgres -d postgres"
API="http://127.0.0.1:8000"
# Never hardcode this: the repo is public and these accounts are real logins
# on the live system. Pass it in, and share it with the team out-of-band.
PASSWORD="${SEED_PASSWORD:-}"
if [ -z "$PASSWORD" ]; then
  echo "Set SEED_PASSWORD, e.g. SEED_PASSWORD='...' sudo -E bash seed-dev-school.sh" >&2
  exit 1
fi
SCHOOL_ID="d3305c00-0000-4000-8000-000000000001"

reset() {
  echo "== removing demo data =="
  $PSQL -q <<SQL
delete from public.school_memberships where school_id = '$SCHOOL_ID';
delete from public.schools where id = '$SCHOOL_ID';
SQL
  for id in $($PSQLQ -tAc "select id from auth.users where email like '%@scholr.dev';" | tr -d ' '); do
    curl -s -X DELETE "$API/auth/v1/admin/users/$id" \
      -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" >/dev/null
  done
  echo "  done"
}

if [ "${1:-}" = "--reset" ] || [ "${2:-}" = "--reset" ]; then reset; exit 0; fi

# Deleting the school cascades to its classes, assignments and grades, so a
# re-run starts from a clean slate rather than duplicating everything.
reset >/dev/null 2>&1

echo "== school =="
$PSQL -q <<SQL
insert into public.schools (id, name, slug, country, city, curriculum, plan, status, max_students, timezone, academic_year_start_month)
values ('$SCHOOL_ID','Demo International School','demo-international','France','Montpellier','ib_dp','growth','active',250,'Europe/Paris',9);
SQL
echo "  Demo International School"

echo
echo "== accounts =="
declare -A USERS=(
  [admin@scholr.dev]="school_admin|Alex Admin"
  [coordinator@scholr.dev]="ib_coordinator|Chris Coordinator"
  [teacher@scholr.dev]="teacher|Tara Teacher"
  [teacher2@scholr.dev]="teacher|Tom Teacher"
  [student@scholr.dev]="student|Sam Student"
  [student2@scholr.dev]="student|Sofia Student"
  [parent@scholr.dev]="parent|Paula Parent"
)

declare -A IDS
for email in "${!USERS[@]}"; do
  IFS='|' read -r role name <<< "${USERS[$email]}"
  id=$(curl -s -X POST "$API/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$email\",\"password\":\"$PASSWORD\",\"email_confirm\":true,\"user_metadata\":{\"full_name\":\"$name\"}}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)

  if [ -z "$id" ]; then echo "  FAILED $email"; continue; fi
  IDS[$email]=$id

  $PSQL -q <<SQL
update public.profiles set full_name = '$name' where id = '$id';
insert into public.school_memberships (user_id, school_id, role, status, user_email, user_name)
values ('$id','$SCHOOL_ID','$role','active','$email','$name')
on conflict (user_id, school_id) do update set role = excluded.role;
update public.profiles set active_school_id = '$SCHOOL_ID' where id = '$id';
SQL
  printf "  %-26s %s\n" "$email" "$role"
done

echo
echo "== academic structure =="
$PSQL -q <<SQL
insert into public.academic_years (id, school_id, name, start_date, end_date, is_current, status)
values ('d3305c00-0000-4000-8000-000000000010','$SCHOOL_ID','2026–2027','2026-09-01','2027-07-15',true,'active');

insert into public.terms (school_id, academic_year_id, name, start_date, end_date, is_current) values
  ('$SCHOOL_ID','d3305c00-0000-4000-8000-000000000010','Term 1','2026-09-01','2026-12-18',true),
  ('$SCHOOL_ID','d3305c00-0000-4000-8000-000000000010','Term 2','2027-01-06','2027-04-02',false),
  ('$SCHOOL_ID','d3305c00-0000-4000-8000-000000000010','Term 3','2027-04-20','2027-07-15',false);

insert into public.subjects (id, school_id, name, code, ib_group, level, status) values
  ('d3305c00-0000-4000-8000-000000000020','$SCHOOL_ID','English A: Literature','ENGA','group1_language_literature','HL','active'),
  ('d3305c00-0000-4000-8000-000000000021','$SCHOOL_ID','Mathematics: Analysis','MAA','group5_mathematics','HL','active'),
  ('d3305c00-0000-4000-8000-000000000022','$SCHOOL_ID','Biology','BIO','group4_sciences','SL','active'),
  ('d3305c00-0000-4000-8000-000000000023','$SCHOOL_ID','History','HIS','group3_individuals_societies','SL','active');
SQL
echo "  1 academic year, 3 terms, 4 IB subjects"

echo
echo "== classes, assignments, grades, attendance =="
TEACHER=${IDS[teacher@scholr.dev]:-}
TEACHER2=${IDS[teacher2@scholr.dev]:-}
STUDENT=${IDS[student@scholr.dev]:-}
STUDENT2=${IDS[student2@scholr.dev]:-}
PARENT=${IDS[parent@scholr.dev]:-}

$PSQL -q <<SQL
insert into public.classes (id, school_id, subject_id, academic_year_id, name, section, capacity,
                            teacher_ids, primary_teacher_id, student_ids, status)
values
 ('d3305c00-0000-4000-8000-000000000030','$SCHOOL_ID','d3305c00-0000-4000-8000-000000000020',
  'd3305c00-0000-4000-8000-000000000010','English A HL','DP1',24,
  array['$TEACHER']::uuid[], '$TEACHER', array['$STUDENT','$STUDENT2']::uuid[], 'active'),
 ('d3305c00-0000-4000-8000-000000000031','$SCHOOL_ID','d3305c00-0000-4000-8000-000000000021',
  'd3305c00-0000-4000-8000-000000000010','Maths AA HL','DP1',20,
  array['$TEACHER2']::uuid[], '$TEACHER2', array['$STUDENT','$STUDENT2']::uuid[], 'active'),
 ('d3305c00-0000-4000-8000-000000000032','$SCHOOL_ID','d3305c00-0000-4000-8000-000000000022',
  'd3305c00-0000-4000-8000-000000000010','Biology SL','DP1',28,
  array['$TEACHER']::uuid[], '$TEACHER', array['$STUDENT']::uuid[], 'active');

insert into public.assignments (id, school_id, class_id, teacher_id, title, description, type,
                                due_date, max_score, status)
values
 ('d3305c00-0000-4000-8000-000000000040','$SCHOOL_ID','d3305c00-0000-4000-8000-000000000030','$TEACHER',
  'Comparative Essay: Two Poems','Compare the treatment of memory in two studied poems.','essay',
  now() + interval '9 days', 20, 'published'),
 ('d3305c00-0000-4000-8000-000000000041','$SCHOOL_ID','d3305c00-0000-4000-8000-000000000031','$TEACHER2',
  'Calculus Problem Set 3','Differentiation and optimisation.','homework',
  now() + interval '4 days', 30, 'published'),
 ('d3305c00-0000-4000-8000-000000000042','$SCHOOL_ID','d3305c00-0000-4000-8000-000000000030','$TEACHER',
  'Draft: Individual Oral','Not yet released to students.','presentation',
  now() + interval '30 days', 40, 'draft');

-- One published grade and one unpublished, so the visibility rules in RLS are
-- visible in the UI: the student sees the first and not the second.
insert into public.grade_items (school_id, class_id, student_id, student_name, assignment_id, title,
                                score, max_score, percentage, comment, status,
                                visible_to_student, visible_to_parent, created_by)
values
 ('$SCHOOL_ID','d3305c00-0000-4000-8000-000000000030','$STUDENT','Sam Student',
  'd3305c00-0000-4000-8000-000000000040','Comparative Essay',16,20,80,'Strong close reading.','published',true,true,'$TEACHER'),
 ('$SCHOOL_ID','d3305c00-0000-4000-8000-000000000031','$STUDENT','Sam Student',
  'd3305c00-0000-4000-8000-000000000041','Problem Set 3',22,30,73,'Check your working in Q4.','draft',false,false,'$TEACHER2');

insert into public.attendance_records (school_id, class_id, student_id, student_name, date, status, recorded_by)
select '$SCHOOL_ID','d3305c00-0000-4000-8000-000000000030','$STUDENT','Sam Student',
       (current_date - offs), case when offs = 3 then 'absent' when offs = 6 then 'late' else 'present' end, '$TEACHER'
from generate_series(0, 9) as offs
on conflict (class_id, student_id, date) do nothing;

insert into public.parent_student_links (school_id, parent_id, student_id)
values ('$SCHOOL_ID','$PARENT','$STUDENT')
on conflict do nothing;
SQL

$PSQLQ -tAc "
select '  '||(select count(*) from public.classes where school_id='$SCHOOL_ID')||' classes, '
        ||(select count(*) from public.assignments where school_id='$SCHOOL_ID')||' assignments, '
        ||(select count(*) from public.grade_items where school_id='$SCHOOL_ID')||' grades, '
        ||(select count(*) from public.attendance_records where school_id='$SCHOOL_ID')||' attendance records';"

echo
echo "== logins (password: the SEED_PASSWORD you supplied) =="
for email in admin@scholr.dev coordinator@scholr.dev teacher@scholr.dev student@scholr.dev parent@scholr.dev; do
  printf "  %s\n" "$email"
done
echo
echo "Sign in at https://scholr.pro (or your local dev server)."
