#!/usr/bin/env bash
#
# Build Scholr and publish it to scholr-prod.
#
#   ./scripts/deploy.sh
#
# The web root is owned leo:caddy with the setgid bit, so rsync can write it and
# Caddy can read it. Don't chown it to caddy — that locks the deploy out.
#
# Reached over Tailscale. If `scholr-prod` doesn't resolve, fall back to the
# LAN jump host (see JUMP below).

set -euo pipefail

HOST="${SCHOLR_HOST:-leo@scholr-prod}"
JUMP="${SCHOLR_JUMP:-}"          # e.g. SCHOLR_JUMP=root@infra-pve-2
WEBROOT=/var/www/scholr

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15)
[ -n "$JUMP" ] && SSH_OPTS+=(-J "$JUMP")

cd "$(dirname "$0")/.."

echo "==> build"
npm run build

if [ ! -f dist/index.html ]; then
  echo "dist/index.html missing — build produced nothing. Aborting." >&2
  exit 1
fi

echo "==> publish to $HOST:$WEBROOT"
rsync -az --delete -e "ssh ${SSH_OPTS[*]}" dist/ "$HOST:$WEBROOT/"

echo "==> verify"
code=$(curl -s -o /dev/null -m 20 -w '%{http_code}' https://scholr.pro)
echo "    https://scholr.pro -> $code"
[ "$code" = "200" ] || { echo "    unexpected status" >&2; exit 1; }

# The bundle is content-hashed, so a stale asset name means the deploy didn't
# actually land.
local_asset=$(grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' dist/index.html | head -1)
live_asset=$(curl -s -m 20 https://scholr.pro | grep -oE 'assets/index-[A-Za-z0-9_-]+\.js' | head -1)
if [ "$local_asset" = "$live_asset" ]; then
  echo "    bundle matches: $live_asset"
else
  echo "    MISMATCH — built $local_asset but live serves $live_asset" >&2
  exit 1
fi

echo "==> done"
