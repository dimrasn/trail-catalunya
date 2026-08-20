# SEO/GEO measurement loop — tracker

The loop only *learns* if every weekly reading ends in a written decision and a
later reading checks it. Data with no decisions is a dashboard, not a loop. This
file is where decisions accumulate and close — if it fills with closed decisions,
the loop is learning; if it's empty, it isn't, no matter how much data flows.

Run the ritual weekly, same weekday, 28-day windows (7-day is noise).

## Is the loop actually working? — two levels

**Level 1 — plumbing alive (checkable within days):** the signals are flowing.
- Crawler signal: the query below returns real Googlebot/Bingbot rows on `/race/%` paths (not zero). If still empty after ~a week → stage 1 is dead → sitemap/robots/indexing problem (that's itself the first learning).
- Index signal: GSC → Indexing → Pages shows submitted ≈ 226 and indexed count rising.
- Click/referrer signal: Vercel Web Analytics shows page views once any traffic arrives (navigate the live site yourself to seed the first data points; disable content blockers).

**Level 2 — learning alive (checkable over weeks):** the Decisions ledger below
accumulates rows that *close* — a reading led to an action, and a later reading
confirmed or refuted it. No closing rows = not learning yet.

## Weekly ritual (15 min)
1. GSC → Indexing → Pages: indexed vs submitted.
2. GSC → Performance, regex `/race/` vs homepage: impressions + position per type.
3. Crawler table (query below): Googlebot trend + GPTBot/ClaudeBot/Perplexity presence.
4. Vercel Analytics referrers: chatgpt.com/perplexity.ai (AI channel) + strava/whatsapp (share loop).
5. Tracer hand-check: the 8 tracers from incognito google.es with `gl=ES&pws=0`; log below.

## Crawler query (real schema: bot, path, ua, hit_at)
```sql
-- Are bots crawling the new race pages, and which bots (last 7 days)?
select bot,
       count(*) as hits,
       count(distinct path) filter (where path like '/race/%') as race_pages_crawled
from crawler_hits
where hit_at > now() - interval '7 days'
group by bot
order by hits desc;
```
`race_pages_crawled` climbing toward 226 = Google/Bing working through the new
surface. Presence of `gptbot`/`claudebot`/`perplexitybot` rows = the AI channel
is forming (they're reading you).

## Decisions ledger
One row per decision. It's not closed until the recheck outcome is filled.

| Date | Reading (signal → value) | Decision / action | Recheck date | Outcome |
|---|---|---|---|---|
| 2026-08-20 | Baseline. 226 race pages + sitemap live; crawler log + Vercel Analytics just wired; GSC indexed count not yet read. | None — instrumentation in place; start weekly ritual next week. | 2026-08-27 | _open_ |

## Tracer log
The 8 canaries (same weekday weekly). Note position or "not found".

| Date | trail races near barcelona | carreras de montaña cerca de barcelona | curses de muntanya prop de barcelona | trail moixeró 2026 | montlude skyrace | marató del montseny 2026 | prades epic trail inscripcions | trail races catalonia 2026 |
|---|---|---|---|---|---|---|---|---|
| 2026-08-20 | — | — | — | — | — | — | — | — |

## Timeline calibration (don't panic)
- Weeks 0–4: only indexed-count matters; impressions ≈ 0 is normal.
- Weeks 4–12: first impressions at position 20–60 = system proving out.
- Months 4–6: judge category terms. Planning demand peaks Dec–Feb; real harvest is the spring-2027 season.
- Decision rule: nothing moving at week 8 → indexing problem, not content — fix coverage, not copy.
