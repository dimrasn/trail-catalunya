# Handoff: finish the trailraces.cat domain cutover

Self-contained brief. Read `AGENTS.md` (cold-start order + deployment state)
before doing anything. This task = finish wiring the new custom domain and the
search-engine setup. The larger context and what comes after live in
`docs/seo/2026-08-20-seo-roadmap.md`.

## Context in one paragraph

trail-catalunya (this repo) serves https://trail-catalunya.vercel.app from
Vercel (project `trail-catalunya`, team `team_pN0P95wmwoYttZ31w3tnMCio`,
auto-deploys from GitHub `main`). The owner bought **trailraces.cat** at
**DonDominio** (registered, active). SEO groundwork is live (server-rendered
race list, robots/sitemap/canonical, SportsEvent JSON-LD, og-image); the whole
canonical/sitemap/og base URL follows one env var. The site must move to
https://trailraces.cat BEFORE Google first indexes it (it is currently
unindexed — that is deliberate timing, not a problem).

## Already done (do not redo)

1. Vercel → project → Domains: `trailraces.cat` added, connected to Production
   (shows "Invalid Configuration" until DNS points at Vercel).
2. Vercel → Domains: `www.trailraces.cat` added as **308 permanent redirect →
   trailraces.cat**.
3. Vercel → Environment Variables: `NEXT_PUBLIC_SITE_URL=https://trailraces.cat`
   (Production + Preview). Needs a redeploy to take effect — the push of this
   very commit triggers it; verify rather than re-trigger.

## Remaining steps, in order

> **Update 2026-08-20 (later same day):** steps 1–2 are DONE and verified —
> DNS set at DonDominio (apex ANAME + www CNAME → cname.vercel-dns.com),
> https://trailraces.cat serves 200 with SSL, www 308s to apex, canonical on
> both hosts → trailraces.cat, sitemap/robots on the new domain. **Only steps
> 3–5 (GSC, Bing, doc ticks) remain.** Also: the owner must click the .cat
> registrant-validation email from no-reply@online-validation.com within 15
> days or the registry blocks the domain.

### 1. DNS records at DonDominio (owner does the clicking; guide him)

The owner logs into dondominio.com → Domains → trailraces.cat → DNS zone:

- `A` record: host `@` (or blank) → `216.198.79.1` (value Vercel's domain
  panel currently shows; legacy `76.76.21.21` also works).
- `CNAME`: host `www` → `cname.vercel-dns.com` (open the `www.trailraces.cat`
  row → "View DNS configuration" in Vercel Domains to confirm the exact value
  it asks for).
- Delete/ignore any default parking A/CNAME records DonDominio pre-created for
  `@`/`www` that conflict.

### 2. Verify the cutover (agent-runnable from a shell)

```bash
dig +short trailraces.cat A          # expect 216.198.79.1 (propagation: min–hours)
curl -sI https://trailraces.cat/ | head -3          # expect HTTP/2 200 (SSL auto-issued by Vercel)
curl -sI https://www.trailraces.cat/ | head -3      # expect 308 → https://trailraces.cat/
curl -sI https://trail-catalunya.vercel.app/ | head -3  # expect 308 → https://trailraces.cat/
curl -s https://trailraces.cat/ | grep -o 'rel="canonical" href="[^"]*"'   # expect https://trailraces.cat
curl -s https://trailraces.cat/sitemap.xml | head -5    # URLs must be trailraces.cat
curl -s https://trailraces.cat/robots.txt               # Sitemap: line must be trailraces.cat
```

Vercel Domains page must show "Valid Configuration" on both rows. If canonical
still shows vercel.app, the env-var redeploy hasn't happened: trigger a
redeploy of `main` (Vercel → Deployments → Redeploy) and re-check.

### 3. Google Search Console (owner's Google account; guide him)

1. https://search.google.com/search-console → Add property → **Domain** type →
   `trailraces.cat`.
2. GSC gives a `google-site-verification=...` TXT record → owner adds it in the
   DonDominio DNS zone (host `@`, type TXT) → back in GSC press Verify (may
   need minutes for propagation).
3. In GSC: Sitemaps → submit `https://trailraces.cat/sitemap.xml`.
4. URL inspection → `https://trailraces.cat/` → Request indexing.

### 4. Bing Webmaster + done-check

1. https://www.bing.com/webmasters → sign in with the same Google account →
   "Import from Google Search Console" (one click, imports the site + sitemap).
2. Done when: both curl 308s verified, GSC verified + sitemap submitted, Bing
   imported.

### 5. Update the docs (this repo, commit to main)

- `AGENTS.md` → "Provisioned infra": mark trailraces.cat as live/primary and
  note GSC + Bing are set up (add the date).
- `docs/seo/2026-08-20-seo-roadmap.md`: tick R0 as done with date.

## After this task (separate work, do NOT start without the owner's go)

Next build slice per the roadmap: R1–R3 (per-race pages + sitemap extension +
internal links). Read `docs/seo/2026-08-20-seo-roadmap.md` for the full spec —
the anti-thin page contract and lifecycle rules matter; don't improvise them.

## Guardrails

- Never type credentials or handle passwords — the owner logs in himself.
- Nothing here touches the enrichment pipeline; it stays NOT deployed
  (see `AGENTS.md` deployment state).
- Don't buy anything; don't change other Vercel/DonDominio settings beyond the
  records listed above.
- Tests before any code change: see `README.md` → Tests.
