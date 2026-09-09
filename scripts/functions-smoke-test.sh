#!/usr/bin/env bash
#
# Exercise the ported edge functions against the real stack.
#
#   ssh leo@scholr-prod 'sudo bash -s' < scripts/functions-smoke-test.sh
#
# Covers the invitation round-trip end to end — invite, redeem, membership
# granted — plus the authorisation rules that make it safe. Cleans up after
# itself.

set -uo pipefail
cd /opt/supabase/docker
. ./.env

# -i is needed for the heredoc-fed statements, but a `-tAc` query with -i
# inherits this script's stdin — and since the script itself arrives on stdin
# via `bash -s`, psql swallows the rest of it and everything below silently
# stops running. Two variables: one interactive, one that never reads stdin.
PSQL="docker exec -i supabase-db psql -U postgres -d postgres"
PSQLQ="docker exec supabase-db psql -U postgres -d postgres"
FN="http://127.0.0.1:8000/functions/v1"
pass=0; fail=0

check() {
  if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1));
  else echo "  FAIL  $1 (expected $2, got $3)"; fail=$((fail+1)); fi
}

mint() {
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

call() { # jwt fn body -> "status|body"
  local out
  out=$(curl -s -m 30 -w '\n%{http_code}' -X POST "$FN/$2" \
    -H "apikey: $ANON_KEY" -H "Authorization: Bearer $1" \
    -H 'Content-Type: application/json' -d "$3")
  echo "$(echo "$out" | tail -1)|$(echo "$out" | sed '$d')"
}

echo "== seeding =="
$PSQL -q <<'SQL'
delete from public.user_invitations where email like '%@fn-test.invalid';
delete from public.school_memberships where user_id in (
  select id from auth.users where email like '%@fn-test.invalid');
delete from auth.users where email like '%@fn-test.invalid';
delete from public.schools where slug = 'fn-test';

insert into public.schools (id, name, slug)
values ('ffffffff-0000-4000-8000-00000000000f','FN Test School','fn-test');

insert into auth.users (id, email, raw_user_meta_data) values
  ('f1000000-0000-4000-8000-000000000001','admin@fn-test.invalid','{"full_name":"FN Admin"}'),
  ('f2000000-0000-4000-8000-000000000002','invitee@fn-test.invalid','{"full_name":"FN Invitee"}'),
  ('f3000000-0000-4000-8000-000000000003','stranger@fn-test.invalid','{"full_name":"FN Stranger"}'),
  ('f4000000-0000-4000-8000-000000000004','super@fn-test.invalid','{"full_name":"FN Super"}');

update public.profiles set role = 'super_admin' where id = 'f4000000-0000-4000-8000-000000000004';

insert into public.school_memberships (user_id, school_id, role, status, user_email) values
  ('f1000000-0000-4000-8000-000000000001','ffffffff-0000-4000-8000-00000000000f','school_admin','active','admin@fn-test.invalid');
SQL

JWT_ADMIN=$(mint f1000000-0000-4000-8000-000000000001)
JWT_INVITEE=$(mint f2000000-0000-4000-8000-000000000002)
JWT_STRANGER=$(mint f3000000-0000-4000-8000-000000000003)
JWT_SUPER=$(mint f4000000-0000-4000-8000-000000000004)

echo
echo "== listAllUsers =="
r=$(call "$JWT_ADMIN" listAllUsers '{}');  check "school admin refused"        "403" "${r%%|*}"
r=$(call "$JWT_SUPER" listAllUsers '{}');  check "super admin allowed"         "200" "${r%%|*}"

echo
echo "== sendInvitation =="
BODY='{"schoolId":"ffffffff-0000-4000-8000-00000000000f","email":"invitee@fn-test.invalid","role":"teacher"}'
r=$(call "$JWT_STRANGER" sendInvitation "$BODY")
check "non-member cannot invite" "403" "${r%%|*}"

r=$(call "$JWT_ADMIN" sendInvitation "$BODY")
check "school admin can invite"  "200" "${r%%|*}"

TOKEN=$($PSQLQ -tAc "select invitation_token from public.user_invitations where email='invitee@fn-test.invalid' limit 1;" | tr -d ' ')
[ -n "$TOKEN" ] && echo "  ..  invitation token issued" || echo "  FAIL  no token stored"

echo
echo "== acceptInvitation =="
r=$(call "$JWT_STRANGER" acceptInvitation "{\"token\":\"$TOKEN\"}")
check "wrong person cannot redeem"  "403" "${r%%|*}"

r=$(call "$JWT_INVITEE" acceptInvitation '{"token":"not-a-real-token"}')
check "bogus token rejected"        "404" "${r%%|*}"

r=$(call "$JWT_INVITEE" acceptInvitation "{\"token\":\"$TOKEN\"}")
check "invitee redeems"             "200" "${r%%|*}"

GOT=$($PSQLQ -tAc "select role from public.school_memberships where user_id='f2000000-0000-4000-8000-000000000002' and school_id='ffffffff-0000-4000-8000-00000000000f';" | tr -d ' ')
check "membership granted as teacher" "teacher" "$GOT"

ACTIVE=$($PSQLQ -tAc "select active_school_id from public.profiles where id='f2000000-0000-4000-8000-000000000002';" | tr -d ' ')
check "active school set" "ffffffff-0000-4000-8000-00000000000f" "$ACTIVE"

r=$(call "$JWT_INVITEE" acceptInvitation "{\"token\":\"$TOKEN\"}")
check "cannot redeem twice"         "400" "${r%%|*}"

echo
echo "== createAccountFromInvitation (non authentifié) =="
# A second invitation, this time redeemed by someone with no account at all.
r=$(call "$JWT_ADMIN" sendInvitation '{"schoolId":"ffffffff-0000-4000-8000-00000000000f","email":"newbie@fn-test.invalid","role":"student"}')
check "invitation for a new person"     "200" "${r%%|*}"
TOKEN2=$($PSQLQ -tAc "select invitation_token from public.user_invitations where email='newbie@fn-test.invalid' limit 1;" | tr -d ' ')

nocall() { # fn body -> status (no Authorization header at all)
  curl -s -m 30 -o /dev/null -w '%{http_code}' -X POST "$FN/$1" \
    -H "apikey: $ANON_KEY" -H 'Content-Type: application/json' -d "$2"
}

code=$(nocall createAccountFromInvitation '{"password":"short","invitation_token":"'"$TOKEN2"'"}')
check "short password rejected"         "400" "$code"

code=$(nocall createAccountFromInvitation '{"password":"Sup3rSecret!23","invitation_token":"bogus"}')
check "bogus token rejected"            "400" "$code"

# The payload tries to claim a different address; the invitation must win.
code=$(nocall createAccountFromInvitation '{"email":"attacker@fn-test.invalid","password":"Sup3rSecret!23","first_name":"New","last_name":"Bie","invitation_token":"'"$TOKEN2"'"}')
check "account created"                 "200" "$code"

MADE=$($PSQLQ -tAc "select count(*) from auth.users where email='newbie@fn-test.invalid';" | tr -d ' ')
check "created with invitation email"   "1" "$MADE"

HIJACK=$($PSQLQ -tAc "select count(*) from auth.users where email='attacker@fn-test.invalid';" | tr -d ' ')
check "payload email ignored"           "0" "$HIJACK"

ROLE=$($PSQLQ -tAc "select m.role from public.school_memberships m join auth.users u on u.id=m.user_id where u.email='newbie@fn-test.invalid';" | tr -d ' ')
check "membership granted as student"   "student" "$ROLE"

echo
echo "== removeSchoolMember =="
MEMBERSHIP=$($PSQLQ -tAc "select id from public.school_memberships where user_id='f2000000-0000-4000-8000-000000000002';" | tr -d ' ')
r=$(call "$JWT_STRANGER" removeSchoolMember "{\"membershipId\":\"$MEMBERSHIP\"}")
check "non-admin cannot remove"        "403" "${r%%|*}"

OWN=$($PSQLQ -tAc "select id from public.school_memberships where user_id='f1000000-0000-4000-8000-000000000001';" | tr -d ' ')
r=$(call "$JWT_ADMIN" removeSchoolMember "{\"membershipId\":\"$OWN\"}")
check "cannot remove yourself"         "400" "${r%%|*}"

r=$(call "$JWT_ADMIN" removeSchoolMember "{\"membershipId\":\"$MEMBERSHIP\"}")
check "school admin removes a teacher" "200" "${r%%|*}"

GONE=$($PSQLQ -tAc "select count(*) from public.school_memberships where id='$MEMBERSHIP';" | tr -d ' ')
check "membership actually deleted"    "0" "$GONE"

echo
echo "== adminUpdateUser =="
r=$(call "$JWT_ADMIN" adminUpdateUser '{"userId":"f3000000-0000-4000-8000-000000000003","platformRole":"super_admin"}')
check "school admin cannot grant super_admin" "403" "${r%%|*}"

r=$(call "$JWT_SUPER" adminUpdateUser '{"userId":"f4000000-0000-4000-8000-000000000004","platformRole":"teacher"}')
check "super admin cannot demote self"        "400" "${r%%|*}"

r=$(call "$JWT_SUPER" adminUpdateUser '{"userId":"f3000000-0000-4000-8000-000000000003","fullName":"Renamed"}')
check "super admin edits a profile"           "200" "${r%%|*}"

echo
echo "== superAdminDeleteUser =="
r=$(call "$JWT_ADMIN" superAdminDeleteUser '{"userId":"f3000000-0000-4000-8000-000000000003"}')
check "school admin cannot delete users" "403" "${r%%|*}"

r=$(call "$JWT_SUPER" superAdminDeleteUser '{"userId":"f4000000-0000-4000-8000-000000000004"}')
check "cannot delete own account"        "400" "${r%%|*}"

# The delete target must be created through GoTrue's admin API. Rows inserted
# straight into auth.users lack fields GoTrue requires, so its admin API
# reports "User not found" and the delete 500s — a harness artifact, not a bug.
VICTIM=$(curl -s -X POST "http://127.0.0.1:8000/auth/v1/admin/users" \
  -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
  -H 'Content-Type: application/json' \
  -d '{"email":"victim@fn-test.invalid","password":"Sup3rSecret!23","email_confirm":true}' \
  | python3 -c "import sys,json;print(json.load(sys.stdin).get('id',''))")

r=$(call "$JWT_SUPER" superAdminDeleteUser "{\"userId\":\"$VICTIM\"}")
check "super admin deletes a user"       "200" "${r%%|*}"

LEFT=$($PSQLQ -tAc "select count(*) from auth.users where id='$VICTIM';" | tr -d ' ')
check "account actually gone"            "0" "$LEFT"

echo
echo "== updateClassStatus =="
$PSQL -q <<'SQL'
insert into public.classes (id, school_id, name, status)
values ('cccccccc-0000-4000-8000-00000000000c','ffffffff-0000-4000-8000-00000000000f','Smoke Class','active')
on conflict (id) do nothing;
SQL
r=$(call "$JWT_ADMIN" updateClassStatus '{"classId":"cccccccc-0000-4000-8000-00000000000c","status":"nonsense"}')
check "invalid status rejected"   "400" "${r%%|*}"

r=$(call "$JWT_ADMIN" updateClassStatus '{"classId":"cccccccc-0000-4000-8000-00000000000c","status":"archived"}')
check "school admin archives"     "200" "${r%%|*}"

ST=$($PSQLQ -tAc "select status from public.classes where id='cccccccc-0000-4000-8000-00000000000c';" | tr -d ' ')
check "class is archived"         "archived" "$ST"

echo
echo "== cleanup =="
$PSQL -q <<'SQL'
delete from public.user_invitations where email like '%@fn-test.invalid';
delete from public.school_memberships where user_id in (
  select id from auth.users where email like '%@fn-test.invalid');
delete from public.classes where school_id = 'ffffffff-0000-4000-8000-00000000000f';
delete from public.school_memberships where school_id = 'ffffffff-0000-4000-8000-00000000000f';
delete from auth.users where email like '%@fn-test.invalid';
delete from public.schools where slug = 'fn-test';
SQL

echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
