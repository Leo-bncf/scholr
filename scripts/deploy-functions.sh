#!/usr/bin/env bash
#
# Publish edge functions to scholr-prod.
#
#   ./scripts/deploy-functions.sh              # all of them
#   ./scripts/deploy-functions.sh sendEmail    # just one
#
# The self-hosted edge runtime serves whatever is in
# /opt/supabase/docker/volumes/functions, so deploying is an rsync plus a
# restart. The container only re-reads on restart, so skipping it means your
# change silently doesn't take effect.

set -euo pipefail

HOST="${SCHOLR_HOST:-leo@scholr-prod}"
JUMP="${SCHOLR_JUMP:-}"
REMOTE=/opt/supabase/docker/volumes/functions

SSH_OPTS=(-o BatchMode=yes -o ConnectTimeout=15)
[ -n "$JUMP" ] && SSH_OPTS+=(-J "$JUMP")
SSH=(ssh "${SSH_OPTS[@]}" "$HOST")

cd "$(dirname "$0")/.."
[ -d supabase/functions ] || { echo "no supabase/functions directory" >&2; exit 1; }

# Same stale-checkout guard as scripts/deploy.sh — and it matters more here,
# because the September incident wiped edge functions specifically.
if [ -d .git ] && [ "${ALLOW_DIRTY_DEPLOY:-}" != "1" ]; then
  branch=$(git rev-parse --abbrev-ref HEAD)
  git fetch -q origin "$branch" 2>/dev/null || true
  behind=$(git rev-list --count "HEAD..origin/$branch" 2>/dev/null || echo 0)
  if [ "$behind" -gt 0 ]; then
    echo "Refusing to deploy: branch is $behind commit(s) behind origin/$branch." >&2
    echo "Run 'git pull --rebase' first." >&2
    exit 1
  fi
fi

only="${1:-}"

echo "==> sync"
if [ -n "$only" ]; then
  [ -d "supabase/functions/$only" ] || { echo "no such function: $only" >&2; exit 1; }
  # _shared travels with every deploy; a function referencing a helper that
  # isn't there fails at request time, not at deploy time.
  "${SSH[@]}" "sudo mkdir -p $REMOTE/$only $REMOTE/_shared && sudo chown -R leo:leo $REMOTE"
  rsync -az -e "ssh ${SSH_OPTS[*]}" "supabase/functions/$only/" "$HOST:$REMOTE/$only/"
  rsync -az -e "ssh ${SSH_OPTS[*]}" supabase/functions/_shared/ "$HOST:$REMOTE/_shared/"
else
  "${SSH[@]}" "sudo chown -R leo:leo $REMOTE"
  # No --delete: the runtime's own `main` and `hello` live in this directory.
  rsync -az -e "ssh ${SSH_OPTS[*]}" supabase/functions/ "$HOST:$REMOTE/"
fi

echo "==> restart edge runtime"
"${SSH[@]}" "sudo docker restart supabase-edge-functions >/dev/null && sleep 4"

echo "==> health"
"${SSH[@]}" "sudo docker ps --filter name=supabase-edge-functions --format '    {{.Status}}'"

echo "==> deployed:"
"${SSH[@]}" "ls $REMOTE | grep -v '^_' | sed 's/^/    /'"
