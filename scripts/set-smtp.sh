#!/usr/bin/env bash
#
# Point Scholr's outgoing email at a real mailbox.
#
#   scripts/set-smtp.sh noreply@scholr.pro smtp.ionos.fr 587 < .local/smtp-password
#
# The password comes in on stdin — never as an argument, never echoed — so it
# stays out of shell history, the process list and any chat log. Keep it in
# .local/ (gitignored); this repo is public.
#
# What it changes on scholr-prod, in /opt/supabase/docker:
#   .env                SMTP_HOST / PORT / USER / PASS / ADMIN_EMAIL / SENDER_NAME
#   docker-compose.yml  passes the same values to the edge-functions container,
#                       which sends invitations (sendEmail) and had none
# Both files are backed up next to themselves first (*.bak-<timestamp>).
# Then it recreates `auth` and `functions` so they pick the values up —
# a plain restart does not reload env.
#
# GoTrue (auth) sends password-reset and invitation emails itself; sendEmail
# covers everything else. Nothing here touches school data.
set -euo pipefail

FROM="${1:?usage: set-smtp.sh <from-address> <smtp-host> [port] < password-file}"
SMTP_HOST="${2:?smtp host required}"
SMTP_PORT="${3:-587}"
SENDER_NAME="${SMTP_SENDER_NAME:-Scholr}"
HOST="${SCHOLR_HOST:-leo@scholr-prod}"

IFS= read -r SMTP_PASS || true
[ -n "${SMTP_PASS:-}" ] || { echo "No password on stdin." >&2; exit 1; }

# Everything sensitive travels inside the ssh stdin stream, base64-wrapped so
# no quoting in the password can break the remote script.
PASS_B64=$(printf '%s' "$SMTP_PASS" | base64)

ssh -o BatchMode=yes "$HOST" "sudo bash -s" <<REMOTE
set -euo pipefail
cd /opt/supabase/docker
stamp=\$(date +%Y%m%d-%H%M%S)
cp .env ".env.bak-\$stamp"
cp docker-compose.yml "docker-compose.yml.bak-\$stamp"

pass=\$(printf '%s' '$PASS_B64' | base64 -d)
setkv() {  # replace KEY=... in .env, or append it
  local k="\$1" v="\$2"
  if grep -q "^\$k=" .env; then
    python3 - "\$k" "\$v" <<'PY'
import sys
k, v = sys.argv[1], sys.argv[2]
lines = open('.env').read().split('\n')
lines = [f'{k}={v}' if l.startswith(k + '=') else l for l in lines]
open('.env', 'w').write('\n'.join(lines))
PY
  else
    printf '%s=%s\n' "\$k" "\$v" >> .env
  fi
}
setkv SMTP_HOST '$SMTP_HOST'
setkv SMTP_PORT '$SMTP_PORT'
setkv SMTP_USER '$FROM'
setkv SMTP_PASS "\$pass"
setkv SMTP_ADMIN_EMAIL '$FROM'
setkv SMTP_SENDER_NAME '$SENDER_NAME'

# Give the functions container the same SMTP values, once.
python3 - <<'PY'
import re
p = 'docker-compose.yml'
s = open(p).read()
m = re.search(r'\n  functions:\n(?:    .*\n|\n)*?    environment:\n', s)
if not m:
    raise SystemExit('functions service / environment block not found — compose not changed')
block_start = m.end()
nxt = re.search(r'\n  [a-z]', s[block_start:])
block = s[block_start: block_start + (nxt.start() if nxt else len(s))]
if 'SMTP_HOST' not in block:
    add = ''.join(f'      {k}: \${{{k}}}\n' for k in
                  ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_ADMIN_EMAIL', 'SMTP_SENDER_NAME'])
    s = s[:block_start] + add + s[block_start:]
    open(p, 'w').write(s)
    print('  compose: SMTP passed to functions')
else:
    print('  compose: functions already had SMTP')
PY

docker compose config -q
docker compose up -d auth functions >/dev/null 2>&1
sleep 5
docker ps --filter name=supabase-auth --filter name=supabase-edge-functions --format '  {{.Names}}: {{.Status}}'
echo "  backups: .env.bak-\$stamp docker-compose.yml.bak-\$stamp"
REMOTE

echo "SMTP now: $FROM via $SMTP_HOST:$SMTP_PORT"
