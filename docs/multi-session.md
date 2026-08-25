# Working on trailraces with more than one agent session

This repo got worked by two Claude sessions at once during 2026-08 and it cost
real time: commits landed on the wrong branch, and a disk-based deploy shipped
stale source to production. One shared working directory has one `git` branch and
one set of files — two sessions editing it simultaneously is like two people
typing in the same document with no track-changes.

## The rule
- **Prefer ONE session changing trailraces code at a time.** Finish (or pause) one
  before starting another that edits this repo.
- If two must run, **each session works in its own `git worktree`** (an isolated
  checkout that shares history but has its own files/branch):
  `git worktree add ../trailraces-<task> -b feat/<task> origin/main`.
  Never edit the same working directory from two sessions.

## For an agent working here
- Before committing/pushing: `git branch --show-current` — confirm you're where
  you think. A repeated `git push` reporting "Everything up-to-date" despite local
  commits means you're on the wrong branch (or a stale ref — `git fetch` first).
- To land commits on `main` without checking out `main` in a shared dir (which
  would yank the other session): `git worktree add <tmp> origin/main`, commit/
  cherry-pick there, `git push origin HEAD:main`, then `git worktree remove`.
- **Deploy the MCP only via `scripts/deploy-mcp.sh`** — it fetches `origin/main`,
  deploys from a pinned clean worktree, serializes concurrent deploys with a lock,
  re-checks that `origin/main` hasn't moved just before deploying, and probes the
  live `initialize` until `serverInfo.build` equals the exact SHA it shipped.
  Never `supabase functions deploy` from the working dir (it may be on a feature
  branch and would ship that branch's WIP). Versions bump every deploy and drift
  across sessions — always `list_edge_functions` to read the live version; never
  trust a number written in a doc.
- **The test gate is fail-closed.** With `deno` on PATH the script runs
  `deno test --allow-read supabase/functions/ eval/` and aborts on failure. If
  `deno` is ABSENT the deploy is REFUSED, not silently skipped — you must either
  install deno or pass `--skip-tests` to consciously attest you ran that exact
  suite elsewhere for this SHA. (Dima's shell has no deno on PATH; a maintainer
  deploy from there needs `--skip-tests` after the suite has been verified by an
  agent/CI on the same `origin/main` SHA.)
