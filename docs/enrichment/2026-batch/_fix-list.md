# Enrichment 2026 batch — fix-list (un-fetchable sites)

Batch run 2026-08-20: **91 of 120 races enriched, 29 not machine-readable** (~24%, in line with the ~⅓ social/JS prediction). Enriched cards live in `chunk-*.md`. The 29 below need a different fetch path — grouped by how fixable they are.

## Fixable with a real browser (agent-browser / headless) — bot-blocked or JS-only
These have real race pages that a headless browser or agent-browser would render; WebFetch was blocked or got a JS shell.
- Vallhonesta X-Trail — ceaccastellet.wordpress.com — HTTP 403 (WordPress bot-block)
- Trail Senders del Penedès — trailsendersdelpenedes.wordpress.com — 403
- Montpedró Trail — lamontpedro.home.blog — 403
- Cursa Serralats-Lavern — serralats.wordpress.com — 403
- Cursa Montanyans — cursamontanyans.wordpress.com — 403
- Querroig Trail — querroigtrail.com — 403
- Pujada a Sant Pau — corremperlaterra.wordpress.com — 403
- Cursa de Na'dalt a Bellmunt — cursadenadalt.com — 403
- Transenyera — lesguineus.cat — JS-only Wix shell
- Cursa Puig de Tiula — cursapuigdetiula.cat — JS-only shell
- Cursa de muntanya Tivissa — cursativissa.cat — JS-rendered
- Cursa de l'Alta Segarra — altasegarra.ces.cat — empty/JS-only
- Burriac Xtrem — xtrem.gmargentona.com — JS landing shell
- Cursa 15 pobles — emaransportsfoundation.org — JS/PDF-gated

## Wrong URL — points at a platform index, needs the specific race page
- Cursa Campi qui Pugui — athleticevents.net — resolves to a different event; find the correct athleticevents slug
- La Selvatjada — curses.cat/laselvatjada2026 — returns platform index, not the race
- Cursa Parc dels Talls — Instagram only — needs the 9hsports/FEEC reg page

## TLS / certificate errors — needs browser fetch or organizer cert fix
- Cursa de Muntanya Capafonts — cursacapafonts.com — TLSV1_ALERT_INTERNAL_ERROR
- Cross L'Ametlla de Merola — cross.ametllademerola.cat — cert host mismatch
- La Foranca — laforanca.cat — cert chain error
- Marató del Boumort — atleticsantafe.cat — cert chain error

## No usable source — Instagram/blog-only (needs manual or an alternate reg page)
- Cursa del Gos — instagram.com/joventut_massoteres
- Cursa Blat de Moro — instagram.com/cursablatdemoro
- Vertical La Bandera — instagram.com/verticalbandera
- Lo Trail de Secà — instagram.com/lotraildeseca
- Lo Trail Rocallaura — instagram.com/lo_trail_rocallaura
- Cursa per muntanya Turó de les Guineus — instagram.com/senglarspunksvc
- Rajadell Trail Race — instagram.com/carenesdelcogullo
- Pujada a la Mola per Nadal — clubmuntanyencterrassa.blogspot.com — label index, data in dated posts

## Recommended next pass
Most of the "fixable with a browser" + TLS group (~18 races) would resolve with **agent-browser** (headless Chrome) instead of WebFetch — a good v2 of the pipeline. The Instagram-only group (~8) genuinely have no scrapeable source and need either an alternate registration page (9hsports, FEEC calendar) or manual entry via the admin-override layer.
