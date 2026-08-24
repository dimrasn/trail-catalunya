#!/usr/bin/env bash
# Gated MCP deploy. Always deploys the MCP Edge Function from a CLEAN, freshly
# fetched origin/main — never the current working tree — with a test gate and a
# live post-deploy probe. This exists because two failure modes bit us:
#   1. A disk-based deploy from a stale local branch shipped OLD source (the
#      honesty defect went live on v15 that way).
#   2. Parallel sessions leave the working dir on a feature branch, so a naive
#      `supabase functions deploy` from the repo root ships that branch's WIP.
# Requires: you are logged in (`supabase login`) once. Safe to re-run.
set -euo pipefail

REPO="$(cd "$(dirname "$0")/.." && pwd)"
PROJECT_REF="qaebfhbdfjvzhmvcjroz"
MCP_URL="https://${PROJECT_REF}.supabase.co/functions/v1/mcp"
WT="$(mktemp -d)/mcp-deploy-main"

cleanup() { cd "$REPO"; git worktree remove "$WT" --force >/dev/null 2>&1 || true; git worktree prune >/dev/null 2>&1 || true; }
trap cleanup EXIT

echo "→ fetching origin/main …"
cd "$REPO"; git fetch origin
git worktree add "$WT" origin/main
cd "$WT"
SHA="$(git rev-parse --short HEAD)"
echo "→ deploying MCP from origin/main @ ${SHA}"

if command -v deno >/dev/null 2>&1; then
  echo "→ gate: required Deno suite (type-checked) must pass"
  deno test --allow-read supabase/functions/ eval/
else
  echo "→ ⚠ deno not installed here — SKIPPING the local test gate."
  echo "     Deploy proceeds; ensure the Deno suite was verified elsewhere (CI/agent) first."
fi

echo "→ supabase functions deploy mcp"
supabase functions deploy mcp --project-ref "$PROJECT_REF" --no-verify-jwt

echo "→ live probe (allowing a few seconds for edge propagation)"
ok=""
for i in 1 2 3 4 5 6; do
  sleep 5
  if curl -s -X POST "$MCP_URL" -H 'Content-Type: application/json' \
       -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' | grep -q '"instructions"'; then
    ok=1; break
  fi
  echo "   probe $i: not ready yet…"
done
[ -n "$ok" ] || { echo "✗ live initialize probe failed after deploy"; exit 1; }

echo "✓ deployed from origin/main @ ${SHA} and live-verified."
echo "  Confirm the new version with list_edge_functions (it bumps every deploy)."
