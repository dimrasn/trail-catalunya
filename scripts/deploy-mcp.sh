#!/usr/bin/env bash
# Gated MCP deploy. Always deploys the MCP Edge Function from a CLEAN, freshly
# fetched origin/main — never the current working tree — with a test gate, a
# serialize lock, a stale-source guard, and a build-marker live probe. This
# exists because several failure modes bit us:
#   1. A disk-based deploy from a stale local branch shipped OLD source (the
#      honesty defect went live on v15 that way). → we deploy from origin/main.
#   2. Parallel sessions leave the working dir on a feature branch. → worktree.
#   3. A skipped test gate shipped a false-flag bug. → fail-closed (review #2).
#   4. A generic initialize probe "passed" on an OLD healthy response during edge
#      propagation, so we could not prove the new artifact was live, and two
#      deploys of different SHAs could finish out of order and restore old code.
#      → we stamp origin/main's SHA into serverInfo.build and poll for THAT exact
#        SHA; a lock serializes deploys; the source is re-checked just before
#        deploy (review #3/#4).
#
# Usage:  scripts/deploy-mcp.sh [--skip-tests]
#   --skip-tests / SKIP_TESTS=1  bypass the gate ONLY when deno is absent AND you
#   have verified `deno test --allow-read supabase/functions/ eval/` elsewhere for
#   this exact SHA. It is a loud, deliberate attestation — not a convenience.
# Requires: you are logged in (`supabase login`) once. Safe to re-run.
set -euo pipefail

SKIP_TESTS="${SKIP_TESTS:-}"
[ "${1:-}" = "--skip-tests" ] && SKIP_TESTS=1

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="qaebfhbdfjvzhmvcjroz"
MCP_URL="https://${PROJECT_REF}.supabase.co/functions/v1/mcp"
WT="$(mktemp -d)/mcp-deploy-main"
LOCK="${TMPDIR:-/tmp}/trailraces-mcp-deploy.lock"

# --- serialize production deploys (review #4) -------------------------------
# mkdir is atomic; a second concurrent deploy on this machine aborts rather than
# racing. (A deploy from a DIFFERENT machine is caught by the build-marker probe
# below: it will see a build SHA that isn't ours and fail loudly.)
if ! mkdir "$LOCK" 2>/dev/null; then
  echo "✗ another MCP deploy holds the lock ($LOCK). Wait for it, or remove the"
  echo "  dir if it is stale, then re-run. Refusing to race a concurrent deploy."
  exit 1
fi
cleanup() {
  cd "$REPO"
  git worktree remove "$WT" --force >/dev/null 2>&1 || true
  git worktree prune >/dev/null 2>&1 || true
  rmdir "$LOCK" >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "→ fetching origin/main …"
cd "$REPO"; git fetch origin
git worktree add "$WT" origin/main
cd "$WT"
SHA="$(git rev-parse --short HEAD)"
echo "→ target: origin/main @ ${SHA}"

# --- test gate: fail-closed (review #2) ------------------------------------
if command -v deno >/dev/null 2>&1; then
  echo "→ gate: required Deno suite (type-checked) must pass"
  deno test --allow-read supabase/functions/ eval/
elif [ "$SKIP_TESTS" = "1" ]; then
  echo "⚠⚠ deno ABSENT and --skip-tests given: deploying WITHOUT the local gate."
  echo "     You are attesting the Deno suite passed elsewhere for ${SHA}."
else
  echo "✗ deno not found — the test gate cannot run, so this deploy is REFUSED."
  echo "  Fail-closed by design. Either:"
  echo "    • install deno (https://deno.land) and re-run, or"
  echo "    • run 'deno test --allow-read supabase/functions/ eval/' on this exact"
  echo "      SHA elsewhere, then re-run with --skip-tests to attest it passed."
  exit 1
fi

# --- stale-source guard (review #4) ----------------------------------------
# Between the fetch above and here the tests may have taken minutes; re-check
# that origin/main has not moved under us before we deploy a now-stale worktree.
cd "$REPO"; git fetch origin main >/dev/null 2>&1
LATEST="$(git rev-parse --short origin/main)"
if [ "$LATEST" != "$SHA" ]; then
  echo "✗ origin/main advanced to ${LATEST} while we prepared ${SHA}. Re-run to"
  echo "  deploy the latest — refusing to ship a stale source."
  exit 1
fi
cd "$WT"

# --- stamp the immutable build marker (review #3) --------------------------
sed -i.bak "s/export const BUILD_SHA = 'dev'/export const BUILD_SHA = '${SHA}'/" \
  supabase/functions/mcp/build_info.ts && rm -f supabase/functions/mcp/build_info.ts.bak
grep -q "BUILD_SHA = '${SHA}'" supabase/functions/mcp/build_info.ts || {
  echo "✗ could not stamp BUILD_SHA into build_info.ts — aborting."; exit 1; }

echo "→ supabase functions deploy mcp (from origin/main @ ${SHA})"
supabase functions deploy mcp --project-ref "$PROJECT_REF" --no-verify-jwt

# --- live probe: poll for OUR exact build SHA (review #3) -------------------
echo "→ live probe: waiting for serverInfo.build == ${SHA}"
ok=""
for i in 1 2 3 4 5 6 7 8; do
  sleep 5
  body="$(curl -s -X POST "$MCP_URL" -H 'Content-Type: application/json' \
    -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' || true)"
  if printf '%s' "$body" | grep -q "\"build\":\"${SHA}\""; then ok=1; break; fi
  echo "   probe $i: live build is not ${SHA} yet…"
done
[ -n "$ok" ] || {
  echo "✗ after deploy, the live build never became ${SHA}. Either propagation is"
  echo "  slow (re-probe by hand) or another deploy shipped a different SHA."
  exit 1; }

echo "✓ deployed from origin/main @ ${SHA} and live-verified (serverInfo.build)."
echo "  Confirm the new version with list_edge_functions (it bumps every deploy)."
