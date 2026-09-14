#!/usr/bin/env bash
#
# Remove the leftovers from the RLS permission-matrix test.
#
#   ssh leo@scholr-prod 'sudo bash -s' < scripts/remove-rls-matrix-debris.sh
#
# During the migration audit a matrix script created six accounts at
# @rlsmatrix.invalid and a school called "RLS Matrix School", then was deleted
# without cleaning up after itself. One of those accounts holds super_admin,
# which bypasses tenancy on every school — a standing privilege nobody is
# tracking.
#
# The addresses are all under .invalid, a reserved TLD that can never resolve,
# so none of them can receive mail or be recovered by anyone. Deleting them
# costs nothing and closes the hole.
#
# These rows have to be removed with SQL rather than through GoTrue's admin
# API. The matrix script inserted them straight into auth.users with hand-made
# UUIDs, so GoTrue has no record of them and answers 404 to a delete — the
# exact failure seed-dev-school.sh warns about in its header. Deleting rows
# GoTrue never owned is safe; do NOT copy this approach for real accounts.
#
# Safe to re-run; it removes only what matches those two exact patterns.

set -uo pipefail
cd /opt/supabase/docker
. ./.env
PSQL="docker exec -i supabase-db psql -U postgres -d postgres"
PSQLQ="docker exec supabase-db psql -U postgres -d postgres"
SCHOOL='aa110000-0000-4000-8000-00000000aa11'

echo "== to be removed =="
$PSQLQ -c "select u.email, p.role from auth.users u
           left join public.profiles p on p.id = u.id
           where u.email like '%@rlsmatrix.invalid';"
$PSQLQ -c "select id, name from public.schools where id = '$SCHOOL';"

$PSQL -q <<SQL
delete from public.school_memberships where school_id = '$SCHOOL';
delete from public.schools where id = '$SCHOOL';
SQL

$PSQL -q <<SQL
delete from public.profiles
 where id in (select id from auth.users where email like '%@rlsmatrix.invalid');
delete from auth.identities
 where user_id in (select id from auth.users where email like '%@rlsmatrix.invalid');
delete from auth.sessions
 where user_id in (select id from auth.users where email like '%@rlsmatrix.invalid');
delete from auth.users where email like '%@rlsmatrix.invalid';
SQL

echo
echo "== remaining =="
echo "  rlsmatrix accounts: $($PSQLQ -tAc "select count(*) from auth.users where email like '%@rlsmatrix.invalid';" | tr -d ' ')"
echo "  super admins:"
$PSQLQ -tAc "select '    ' || u.email from public.profiles p join auth.users u on u.id = p.id where p.role = 'super_admin';"
