#!/usr/bin/env bash
#
# Prove the five-role model, with data.
#
#   ssh leo@scholr-prod 'sudo bash -s' < scripts/roles-smoke-test.sh
#
# One school, two students (one with a linked parent), two teachers — one who
# teaches the class and one who doesn't. Then assert what each role can see.
# The interesting cases are the negative ones: a classmate must not see another
# student's grades, and a parent must see only their own child's.

set -uo pipefail
cd /opt/supabase/docker
. ./.env

PSQL="docker exec -i supabase-db psql -U postgres -d postgres"
PSQLQ="docker exec supabase-db psql -U postgres -d postgres"
API="http://127.0.0.1:8000/rest/v1"
S="bb220000-0000-4000-8000-00000000bb22"
pass=0; fail=0
check(){ if [ "$2" = "$3" ]; then echo "  PASS  $1"; pass=$((pass+1)); else echo "  FAIL  $1 (attendu $2, obtenu $3)"; fail=$((fail+1)); fi; }

mint(){ python3 - "$1" "$JWT_SECRET" <<'PY'
import sys,json,time,hmac,hashlib,base64
uid,secret=sys.argv[1],sys.argv[2]
b=lambda o: base64.urlsafe_b64encode(json.dumps(o,separators=(',',':')).encode()).rstrip(b'=').decode()
h=b({"alg":"HS256","typ":"JWT"}); now=int(time.time())
p=b({"sub":uid,"role":"authenticated","aud":"authenticated","iss":"supabase","iat":now,"exp":now+3600})
print(f"{h}.{p}."+base64.urlsafe_b64encode(hmac.new(secret.encode(),f"{h}.{p}".encode(),hashlib.sha256).digest()).rstrip(b'=').decode())
PY
}
titles(){ curl -s -m 15 -H "apikey: $ANON_KEY" -H "Authorization: Bearer $1" "$API/$2" \
  | python3 -c "import sys,json;d=json.load(sys.stdin);print(','.join(sorted(x.get('title') or x.get('status') or '?' for x in d)) if isinstance(d,list) else 'ERR')"; }

echo "== seed =="
$PSQL -q <<SQL
delete from public.school_memberships where school_id='$S';
delete from public.schools where id='$S';
delete from auth.users where email like '%@roles.invalid';
insert into public.schools (id,name,slug) values ('$S','Roles School','roles-school');
insert into auth.users (id,email) values
 ('b1000000-0000-4000-8000-00000000b100','admin@roles.invalid'),
 ('b2000000-0000-4000-8000-00000000b200','teacher@roles.invalid'),
 ('b3000000-0000-4000-8000-00000000b300','other-teacher@roles.invalid'),
 ('b4000000-0000-4000-8000-00000000b400','student-a@roles.invalid'),
 ('b5000000-0000-4000-8000-00000000b500','student-b@roles.invalid'),
 ('b6000000-0000-4000-8000-00000000b600','parent-a@roles.invalid');
insert into public.school_memberships (user_id,school_id,role,status,user_email) values
 ('b1000000-0000-4000-8000-00000000b100','$S','school_admin','active','admin@roles.invalid'),
 ('b2000000-0000-4000-8000-00000000b200','$S','teacher','active','teacher@roles.invalid'),
 ('b3000000-0000-4000-8000-00000000b300','$S','teacher','active','other-teacher@roles.invalid'),
 ('b4000000-0000-4000-8000-00000000b400','$S','student','active','student-a@roles.invalid'),
 ('b5000000-0000-4000-8000-00000000b500','$S','student','active','student-b@roles.invalid'),
 ('b6000000-0000-4000-8000-00000000b600','$S','parent','active','parent-a@roles.invalid');

insert into public.parent_student_links (school_id,parent_id,student_id)
values ('$S','b6000000-0000-4000-8000-00000000b600','b4000000-0000-4000-8000-00000000b400');

insert into public.classes (id,school_id,name,teacher_ids,student_ids,status) values
 ('bc000000-0000-4000-8000-00000000bc00','$S','Maths',
  array['b2000000-0000-4000-8000-00000000b200']::uuid[],
  array['b4000000-0000-4000-8000-00000000b400','b5000000-0000-4000-8000-00000000b500']::uuid[],'active');

-- Student A: one published to both, one parent-only, one draft.
-- Student B exists so we can prove a classmate can't read A's grades.
insert into public.grade_items (school_id,class_id,student_id,title,score,visible_to_student,visible_to_parent,created_by) values
 ('$S','bc000000-0000-4000-8000-00000000bc00','b4000000-0000-4000-8000-00000000b400','A-published',18,true,true,'b2000000-0000-4000-8000-00000000b200'),
 ('$S','bc000000-0000-4000-8000-00000000bc00','b4000000-0000-4000-8000-00000000b400','A-parent-only',15,false,true,'b2000000-0000-4000-8000-00000000b200'),
 ('$S','bc000000-0000-4000-8000-00000000bc00','b4000000-0000-4000-8000-00000000b400','A-draft',9,false,false,'b2000000-0000-4000-8000-00000000b200'),
 ('$S','bc000000-0000-4000-8000-00000000bc00','b5000000-0000-4000-8000-00000000b500','B-published',12,true,true,'b2000000-0000-4000-8000-00000000b200');

insert into public.attendance_records (school_id,class_id,student_id,date,status,recorded_by) values
 ('$S','bc000000-0000-4000-8000-00000000bc00','b4000000-0000-4000-8000-00000000b400',current_date,'absent','b2000000-0000-4000-8000-00000000b200')
on conflict do nothing;
SQL

ADMIN=$(mint b1000000-0000-4000-8000-00000000b100)
TEACH=$(mint b2000000-0000-4000-8000-00000000b200)
OTHER=$(mint b3000000-0000-4000-8000-00000000b300)
STUA=$(mint b4000000-0000-4000-8000-00000000b400)
STUB=$(mint b5000000-0000-4000-8000-00000000b500)
PAR=$(mint b6000000-0000-4000-8000-00000000b600)
G='grade_items?select=title&order=title'

echo
echo "== grades =="
check "admin voit tout"                       "A-draft,A-parent-only,A-published,B-published" "$(titles "$ADMIN" "$G")"
check "prof de la classe voit tout"           "A-draft,A-parent-only,A-published,B-published" "$(titles "$TEACH" "$G")"
check "prof d'une AUTRE classe ne voit rien"  ""                                              "$(titles "$OTHER" "$G")"
check "élève A: seulement ses notes publiées" "A-published"                                   "$(titles "$STUA" "$G")"
check "élève B ne voit pas les notes de A"    "B-published"                                   "$(titles "$STUB" "$G")"
check "parent de A: publiées + parent-only"   "A-parent-only,A-published"                     "$(titles "$PAR" "$G")"

echo
echo "== attendance =="
A='attendance_records?select=title:status'
check "parent voit l'absence de son enfant"   "absent" "$(titles "$PAR" "$A")"
check "élève B ne voit pas celle de A"        ""       "$(titles "$STUB" "$A")"
check "prof de la classe la voit"             "absent" "$(titles "$TEACH" "$A")"

echo
echo "== attendance: réglage école parent_visibility =="
# Default is true, verified above. Now switch the school off and confirm the
# parent loses sight of it while staff keep it.
$PSQL -q <<SQL
insert into public.attendance_policies (school_id, parent_visibility) values ('$S', false)
on conflict do nothing;
SQL
check "parent ne voit plus rien (réglage off)" ""       "$(titles "$PAR" "$A")"
check "le prof la voit toujours"               "absent" "$(titles "$TEACH" "$A")"
check "l'élève voit toujours la sienne"        "absent" "$(titles "$STUA" "$A")"

$PSQL -q <<SQL
update public.attendance_policies set parent_visibility = true where school_id='$S';
SQL
check "réactivé: le parent la revoit"          "absent" "$(titles "$PAR" "$A")"

echo
echo "== écritures =="
w(){ curl -s -o /dev/null -w '%{http_code}' -m 15 -X POST "$API/grade_items" -H "apikey: $ANON_KEY" \
  -H "Authorization: Bearer $1" -H 'Content-Type: application/json' \
  -d "{\"school_id\":\"$S\",\"class_id\":\"bc000000-0000-4000-8000-00000000bc00\",\"student_id\":\"b4000000-0000-4000-8000-00000000b400\",\"title\":\"x\",\"created_by\":\"$2\"}"; }
code=$(w "$TEACH" b2000000-0000-4000-8000-00000000b200); check "prof de la classe peut noter" "201" "$code"
code=$(w "$OTHER" b3000000-0000-4000-8000-00000000b300); case $code in 401|403) code=denied;; esac
check "prof hors classe ne peut pas noter" "denied" "$code"
code=$(w "$STUA" b4000000-0000-4000-8000-00000000b400); case $code in 401|403) code=denied;; esac
check "élève ne peut pas se noter"          "denied" "$code"
code=$(w "$PAR" b6000000-0000-4000-8000-00000000b600); case $code in 401|403) code=denied;; esac
check "parent ne peut pas noter"            "denied" "$code"

echo
echo "== cleanup =="
$PSQL -q <<SQL
delete from public.attendance_policies where school_id='$S';
delete from public.grade_items where school_id='$S';
delete from public.attendance_records where school_id='$S';
delete from public.parent_student_links where school_id='$S';
delete from public.classes where school_id='$S';
delete from public.school_memberships where school_id='$S';
delete from auth.users where email like '%@roles.invalid';
delete from public.schools where id='$S';
SQL
echo
echo "$pass passed, $fail failed"
[ "$fail" -eq 0 ]
