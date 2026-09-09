#!/usr/bin/env bash
#
# Prove the tenant boundary holds, against the real stack.
#
#   ssh leo@scholr-prod 'sudo bash -s' < scripts/rls-smoke-test.sh
#
# Creates two throwaway schools with a school_admin, a teacher and a student
# each, plus a grade item per school, then queries PostgREST as each user with a
# real JWT and checks who can see what. Everything is rolled back at the end.
#
# This exists because translating base44's rls blocks got it wrong in a way that
# read correctly: an early generator dropped the school_id sibling of an $or,
# turning "admins of this school" into "admins anywhere".

set -uo pipefail
cd /opt/supabase/docker
. ./.env

PSQL="docker exec -i supabase-db psql -U postgres -d postgres"
API="http://127.0.0.1:8000/rest/v1"
pass=0; fail=0

check() { # description expected actual
  if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1));
  else echo "  FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}

echo "== seeding =="
$PSQL -q <<'SQL'
delete from public.school_memberships where user_id in (
  select id from auth.users where email like '%@rls-test.invalid');
delete from auth.users where email like '%@rls-test.invalid';
delete from public.schools where slug in ('rls-test-a','rls-test-b');

insert into public.schools (id, name, slug) values
  ('aaaaaaaa-0000-4000-8000-000000000001','RLS Test A','rls-test-a'),
  ('bbbbbbbb-0000-4000-8000-000000000002','RLS Test B','rls-test-b');

-- The handle_new_user trigger creates the matching profiles rows.
insert into auth.users (id, email, raw_user_meta_data)
values
  ('a0000000-0000-4000-8000-00000000000a','admin-a@rls-test.invalid','{"full_name":"Admin A"}'),
  ('b0000000-0000-4000-8000-00000000000b','admin-b@rls-test.invalid','{"full_name":"Admin B"}'),
  ('c0000000-0000-4000-8000-00000000000c','student-a@rls-test.invalid','{"full_name":"Student A"}'),
  ('d0000000-0000-4000-8000-00000000000d','teacher-a@rls-test.invalid','{"full_name":"Teacher A"}');

insert into public.school_memberships (user_id, school_id, role, status) values
  ('a0000000-0000-4000-8000-00000000000a','aaaaaaaa-0000-4000-8000-000000000001','school_admin','active'),
  ('b0000000-0000-4000-8000-00000000000b','bbbbbbbb-0000-4000-8000-000000000002','school_admin','active'),
  ('c0000000-0000-4000-8000-00000000000c','aaaaaaaa-0000-4000-8000-000000000001','student','active'),
  ('d0000000-0000-4000-8000-00000000000d','aaaaaaaa-0000-4000-8000-000000000001','teacher','active');

insert into public.classes (id, school_id, name, teacher_ids, student_ids) values
  ('11111111-0000-4000-8000-000000000011','aaaaaaaa-0000-4000-8000-000000000001','Class A',
   array['d0000000-0000-4000-8000-00000000000d']::uuid[], array['c0000000-0000-4000-8000-00000000000c']::uuid[]),
  ('22222222-0000-4000-8000-000000000022','bbbbbbbb-0000-4000-8000-000000000002','Class B',
   '{}'::uuid[], '{}'::uuid[]);

-- One published grade and one unpublished, both for Student A.
insert into public.grade_items (school_id, class_id, student_id, title, score, visible_to_student, visible_to_parent, created_by)
values
  ('aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000011','c0000000-0000-4000-8000-00000000000c','Published',90,true,false,'d0000000-0000-4000-8000-00000000000d'),
  ('aaaaaaaa-0000-4000-8000-000000000001','11111111-0000-4000-8000-000000000011','c0000000-0000-4000-8000-00000000000c','Draft',40,false,false,'d0000000-0000-4000-8000-00000000000d');

-- And one belonging to the other school entirely.
insert into public.grade_items (school_id, class_id, title, score, visible_to_student, created_by)
values ('bbbbbbbb-0000-4000-8000-000000000002','22222222-0000-4000-8000-000000000022','School B grade',70,true,null);
SQL

mint() { # user-uuid -> JWT signed with the live JWT_SECRET
  python3 - "$1" "$JWT_SECRET" <<'PY'
import sys, json, time, hmac, hashlib, base64
uid, secret = sys.argv[1], sys.argv[2]
b = lambda o: base64.urlsafe_b64encode(json.dumps(o, separators=(',', ':')).encode()).rstrip(b'=').decode()
h = b({"alg": "HS256", "typ": "JWT"})
now = int(time.time())
p = b({"sub": uid, "role": "authenticated", "aud": "authenticated", "iss": "supabase",
       "iat": now, "exp": now + 3600})
sig = base64.urlsafe_b64encode(
    hmac.new(secret.encode(), f"{h}.{p}".encode(), hashlib.sha256).digest()).rstrip(b'=').decode()
print(f"{h}.{p}.{sig}")
PY
}

titles() { # jwt query -> comma-joined titles the caller can see
  curl -s -H "apikey: $ANON_KEY" -H "Authorization: Bearer $1" "$API/$2" \
    | python3 -c "import sys,json; d=json.load(sys.stdin); print(','.join(sorted(x.get('title') or '?' for x in d)) if isinstance(d,list) else 'ERR')"
}

JWT_ADMIN_A=$(mint a0000000-0000-4000-8000-00000000000a)
JWT_ADMIN_B=$(mint b0000000-0000-4000-8000-00000000000b)
JWT_STUDENT=$(mint c0000000-0000-4000-8000-00000000000c)
JWT_TEACHER=$(mint d0000000-0000-4000-8000-00000000000d)

echo
echo "== grade_items visibility =="
check "admin A sees only school A's grades"      "Draft,Published" "$(titles "$JWT_ADMIN_A" 'grade_items?select=title')"
check "admin B cannot see school A's grades"     "School B grade"  "$(titles "$JWT_ADMIN_B" 'grade_items?select=title')"
check "student sees published, not draft"        "Published"       "$(titles "$JWT_STUDENT" 'grade_items?select=title')"
check "teacher sees grades they created"         "Draft,Published" "$(titles "$JWT_TEACHER" 'grade_items?select=title')"

echo
echo "== schools =="
check "admin A sees only their school"           "RLS Test A"      "$(titles "$JWT_ADMIN_A" 'schools?select=title:name')"
check "student sees only their school"           "RLS Test A"      "$(titles "$JWT_STUDENT" 'schools?select=title:name')"

echo
echo "== school_stats view (security_invoker) =="
# The view aggregates every school. If security_invoker were off it would run
# as its owner and hand each school's numbers to anyone who asked.
check "admin A sees only their school's stats"  "RLS Test A" "$(titles "$JWT_ADMIN_A" 'school_stats?select=title:name')"
check "admin B sees only their school's stats"  "RLS Test B" "$(titles "$JWT_ADMIN_B" 'school_stats?select=title:name')"
check "student sees only their school's stats"  "RLS Test A" "$(titles "$JWT_STUDENT" 'school_stats?select=title:name')"

echo
echo "== cross-tenant write =="
code=$(curl -s -o /dev/null -w '%{http_code}' -X POST "$API/grade_items" \
  -H "apikey: $ANON_KEY" -H "Authorization: Bearer $JWT_ADMIN_B" -H "Content-Type: application/json" \
  -d '{"school_id":"aaaaaaaa-0000-4000-8000-000000000001","title":"injected","score":100}')
case "$code" in 401|403) got="denied";; *) got="$code";; esac
check "admin B cannot insert into school A"      "denied"          "$got"

echo
echo "== cleanup =="
$PSQL -q <<'SQL'
delete from public.grade_items where school_id in
  ('aaaaaaaa-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002');
delete from public.classes where school_id in
  ('aaaaaaaa-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002');
delete from public.school_memberships where school_id in
  ('aaaaaaaa-0000-4000-8000-000000000001','bbbbbbbb-0000-4000-8000-000000000002');
delete from auth.users where email like '%@rls-test.invalid';
delete from public.schools where slug in ('rls-test-a','rls-test-b');
SQL

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
