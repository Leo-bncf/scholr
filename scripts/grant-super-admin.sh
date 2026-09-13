#!/usr/bin/env bash
#
# Create or promote a platform super admin.
#
#   ssh leo@scholr-prod 'sudo bash -s' < scripts/grant-super-admin.sh -- someone@example.com
#   SUPER_PASSWORD='...' ssh leo@scholr-prod 'sudo -E bash -s' < scripts/grant-super-admin.sh -- someone@example.com
#
# If the address already has an account it is promoted in place and the
# password is untouched. If it does not, the account is created through
# GoTrue's admin API — never by inserting into auth.users, because rows
# inserted directly lack fields GoTrue requires and the account then cannot be
# managed or deleted through the admin API afterwards.
#
# super_admin bypasses tenancy entirely: the holder can read and write every
# school's data. Grant it deliberately, to a named person, and check the list
# it prints at the end.

set -uo pipefail
EMAIL="${1:-}"
if [ -z "$EMAIL" ]; then echo "usage: grant-super-admin.sh <email>" >&2; exit 1; fi

cd /opt/supabase/docker
. ./.env
PSQL="docker exec -i supabase-db psql -U postgres -d postgres"
PSQLQ="docker exec supabase-db psql -U postgres -d postgres"
API="http://127.0.0.1:8000"

id=$($PSQLQ -tAc "select id from auth.users where lower(email) = lower('$EMAIL');" | tr -d ' ')

if [ -z "$id" ]; then
  PASSWORD="${SUPER_PASSWORD:-}"
  if [ -z "$PASSWORD" ]; then
    echo "No account for $EMAIL, and SUPER_PASSWORD is not set." >&2
    echo "Re-run with SUPER_PASSWORD='...' and sudo -E so the account can be created." >&2
    exit 1
  fi
  echo "== creating $EMAIL =="
  id=$(curl -s -X POST "$API/auth/v1/admin/users" \
    -H "apikey: $SERVICE_ROLE_KEY" -H "Authorization: Bearer $SERVICE_ROLE_KEY" \
    -H 'Content-Type: application/json' \
    -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"email_confirm\":true}" \
    | python3 -c "import sys,json; print(json.load(sys.stdin).get('id',''))" 2>/dev/null)
  if [ -z "$id" ]; then echo "  failed to create the account" >&2; exit 1; fi
  echo "  created"
else
  echo "== $EMAIL already exists — promoting in place, password untouched =="
fi

# on_auth_user_created already inserts the profile, with the email copied
# across. Wait for it, then UPDATE.
#
# Do not reach for `insert ... on conflict (id) do update` here: profiles.email
# is NOT NULL, and Postgres evaluates that constraint on the proposed row
# before it ever gets to the conflict clause, so the statement aborts instead
# of falling through to the update.
for _ in $(seq 1 20); do
  [ "$($PSQLQ -tAc "select count(*) from public.profiles where id = '$id';" | tr -d ' ')" = "1" ] && break
  sleep 0.5
done

if [ "$($PSQLQ -tAc "select count(*) from public.profiles where id = '$id';" | tr -d ' ')" != "1" ]; then
  echo "  no profile row appeared for $id — the on_auth_user_created trigger did not fire" >&2
  exit 1
fi

$PSQL -q -v ON_ERROR_STOP=1 <<SQL
update public.profiles set role = 'super_admin' where id = '$id';
SQL

echo
echo "== super admins now =="
$PSQLQ -c "select u.email, p.full_name, u.last_sign_in_at::date as last_seen
           from public.profiles p join auth.users u on u.id = p.id
           where p.role = 'super_admin' order by u.email;"
