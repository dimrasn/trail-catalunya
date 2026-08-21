# Enrichment — 2026 batch, chunk 8

Taste profiles for 10 races. Basics (distance/D+/price/date) live in the DB; this is the layer beyond the calendar. Source tags: [scraped] = stated on the page; [derived] = computed/inferred; [unknown] = not found. Technicality kept LOW-confidence by default.

---

## KV Roquetes
- url: https://www.trailroquetes.cat/
- town: Roquetes · date: 2026-10-25

**Structured attributes**
- Format: Vertical Kilometer (KM Vertical) [scraped — "KM Vertical 2026"]. Distance/D+ not on landing page; a KV is by definition ~1000 m D+ over a short (~3–5 km) climb [derived].
- Night race: unknown. Start time: unknown.
- Course topology: point-to-point uphill-only, the defining shape of a KV [derived].
- Setting/character: mountain, Terres de l'Ebre / Ports massif area near Tortosa [scraped location] — alpine-ish limestone terrain [inference].
- Championship/circuit: unknown. Organizer is a FEEC-affiliated excursionist club ("Federació Catalana d'Entitats Excursionistes") [scraped], so a FEEC or day-license gate is likely [inference], not confirmed.
- Cutoffs / cups / parking / tradition / post-race food / kids race: unknown (registration handled off-site via 9hsports).
- Technicality: unknown (KVs are typically steep and technical, but not stated).

**Derived**
- km-esforç: not computable (no distance + D+ published).
- Season/heat: late October, low-mid altitude coastal-hinterland — cool, low heat risk. A KV is short so exposure is minimal regardless.

**Editorial**
- UNIQUE: a pure vertical-kilometer — the only "how fast can you climb 1000 m" format in this chunk. [inference from name]
- COOL: short, brutal, spectator-friendly; the Ports backdrop above the Ebre delta.
- CATCH: all-out sustained climb, no recovery, no flat — a different sport from the loop races here. Landing page hides all logistics behind an external registration link. [derived]
- WHO: uphill specialists and people who want a hard 40–60 min effort; NOT anyone after distance or a scenic day out.
- REFERENCE POINT: like any FEEC KV vertical — think a compressed, steeper version of a race's first climb, done as the whole race.

**Honesty flags**
- No distance/D+ on the page — KV metrics above are format-derived, not scraped. Confirm before publishing numbers.

---

## Rural Trail
- url: https://ruraltrail.com/
- town: Bigues i Riells del Fai · date: 2026-10-25

**Structured attributes**
- Distances/D+: La Llarga 25.12 km +1,147 m; La del Mig 14.6 km +675 m; La Curta 9.61 km +322 m [scraped].
- Night race: no [inference — no night mention]. Start time: unknown.
- Course topology: unknown (single town base, likely loops) [inference].
- Setting/character: forest, Vallès rural landscape — "La cursa més verra del Vallès" (greenest race in the Vallès) [scraped].
- Championship/circuit: none — explicitly non-competitive. "No ens interessa el temps que trigues" (we don't care how long you take), no timing, no ranking, no prizes, everyone gets a gift [scraped].
- FEEC license gate: unknown / likely none given the non-competitive framing [inference].
- Cutoffs: unknown (untimed event, likely generous/none). Cups/self-sufficiency: unknown. Parking: unknown.
- Tradition: 10th edition ("10a edició!") [scraped].
- Post-race food: "festa" at aid stations mentioned [scraped]; specific botifarrada unknown. Kids race: unknown.
- Technicality: La Llarga called "tècnic, exigent"; La Curta "però exigent. No és una passejada" (but demanding, not a stroll) [scraped].

**Derived**
- km-esforç: Llarga 25.1 + 11.5 = 36.6; Mig 14.6 + 6.8 = 21.4; Curta 9.6 + 3.2 = 12.8.
- Season/heat: late October, low Vallès hills — mild, low heat risk.

**Editorial**
- UNIQUE: a deliberately un-competitive trail — no clock, no ranking, sustainability-first. The anti-race. [scraped]
- COOL: 10 years of a festival-format community run; you go for the day and the party, not a PB.
- CATCH: don't be fooled by the "popular" framing — organizer insists even the 9.6 km "is not a stroll," and the Llarga's 1,147 m over 25 km is a real day out. No timing means self-pacing discipline is on you. [derived]
- WHO: runners who want a scenic, low-pressure trail day and green ethos; NOT racers chasing results or a ranking.
- REFERENCE POINT: like a Vallès forest marxa but with a proper 25 km option — closer to a group long-run than a competition.

**Honesty flags**
- Start times and cutoffs not published. Topology inferred.

---

## Cursa Neandertal
- url: https://cursaneandertal.com/ (+ /horaris/)
- town: Capellades · date: 2026-10-25

**Structured attributes**
- Distances: La Llarga 23K, La Curta 13K, La Caminada 10K, La Mini-Neandertal (kids) [scraped]. D+ not published [unknown].
- Start times: 23K at 08:00, 13K at 09:00, Caminada at 09:00 [scraped].
- Night race: no.
- Cutoffs (talls horaris): 23K until 13:30, max 5h30; 13K until 12:00, max 3h; Caminada until 13:00, max 4h [scraped]. The 23K's 5h30 is moderately generous.
- Course topology: loop(s) from Capellades [inference].
- Setting/character: cliffs, forest, trails — "cingleres, boscos i camins"; on one of Europe's most important Neanderthal archaeological sites ("jaciments neandertals més importants d'Europa") — historic/prehistoric character [scraped].
- Championship/circuit: unknown. FEEC gate: unknown.
- Cups/self-sufficiency / parking: unknown.
- Tradition: 15 editions, 6,000+ cumulative participants [scraped].
- Post-race food: unknown. Kids race: yes (Mini-Neandertal) [scraped].
- Solidarity: "Premi Solidari Neandertal" — part of fees to charity, 2026 partner Kms XL Lupus [scraped].
- Technicality: self-billed "Dura, salvatge, inesperada" (hard, wild, unexpected) [scraped] — organizer signalling real difficulty, unusual honesty.

**Derived**
- km-esforç: not computable without D+ (23K, 13K, 10K distances only).
- Season/heat: late October, Anoia inland hills — mild, low heat risk.

**Editorial**
- UNIQUE: run across a genuine Neanderthal archaeological landscape (Abric Romaní area) — prehistory as the theme. [scraped]
- COOL: 15-year tradition with a charity core; the "wild and unexpected" branding suggests a characterful, non-sanitized course.
- CATCH: no D+ published, but "dura, salvatge" plus cliff-and-forest terrain implies more climbing and technicality than the flat-sounding distances suggest. 23K cutoff of 5h30 is a warning that back-markers find it slow going. [derived]
- WHO: runners who like a rugged, story-rich mid-distance with a cause; NOT those wanting fast, runnable, well-documented courses.
- REFERENCE POINT: like a typical Catalan comarcal trail but harder than its 23 km headline implies.

**Honesty flags**
- D+ absent for all distances — km-esforç and true difficulty can't be confirmed. Flag for a follow-up scrape of the plànols/normativa pages.

---

## Marxa Els Roures
- url: https://alliberadrenalina.com/marxa-dels-roures/
- town: Montblanc · date: 2026-10-25

**Structured attributes**
- Distances/D+/start/cutoff [scraped]:
  - Roures Clàssica: 31 km, +1,400 m, start 08:30, cutoff 6:00 h, cap 200.
  - Roures Petita: 16 km, +790 m, start 09:30, cutoff 4:30 h, cap 300 (reduced from prior 22 km).
  - Caminada: 11 km, +530 m, start 09:40, cutoff 4:30 h, cap 100.
- Night race: no.
- Course topology: loop through the Prades massif / Poblet area [inference].
- Setting/character: national-park-grade protected nature + monastery/historic — "Paratge de Poblet," medieval landscape, forest, "Escales del Gegant" [scraped]. Alpine-forest character.
- Championship/circuit: unknown. FEEC gate: YES — "FEEC o FEDME" license required (Type C+ for races, Type A+ for the walk); day-license implied for non-holders [scraped].
- Cups/self-sufficiency: self-sufficient — "Mandatory personal water bottle (no single-use cups provided)" [scraped].
- Parking/logistics: routes stay open to vehicle traffic except the Montblanc start zone [scraped].
- Tradition: 13th edition [scraped].
- Post-race food: unknown. Kids race: no dedicated kids race; under-14s only in the walk, age gates on the longer races [scraped].
- Technicality: not explicitly rated; "Escales del Gegant" and Prades terrain imply rocky steps [inference].

**Derived**
- km-esforç: Clàssica 31 + 14 = 45; Petita 16 + 7.9 = 23.9; Caminada 11 + 5.3 = 16.3.
- Season/heat: late October, Prades mid-altitude — cool, low heat risk; the 6 h Clàssica cutoff means most of the day out.

**Editorial**
- UNIQUE: runs the Poblet monastery / Prades protected landscape with the "Escales del Gegant" as a signature feature. [scraped]
- COOL: a proper mountain 31 km through a UNESCO-adjacent medieval setting, capped small (200) for an intimate feel.
- CATCH: 45 km-esforç on the Clàssica behind a 6 h cutoff is genuinely demanding; bring-your-own-bottle self-sufficiency plus a hard FEEC/FEDME license gate raise the bar to entry; roads stay open so you share some route with traffic. [derived]
- WHO: licensed federation runners who want a real mountain marathon-effort in a historic park; NOT beginners, dog owners (dogs banned), or anyone without a FEEC/FEDME license.
- REFERENCE POINT: like a Prades-massif classic — harder than "31 km" reads because of 1,400 m and rocky step sections.

**Honesty flags**
- Post-race food and exact technicality not stated. Otherwise the best-documented card in this chunk.

---

## Marató de Muntanya de Catalunya
- url: https://www.maratocatalunya.cat/
- town: Sant Llorenç Savall · date: 2026-10-25

**Structured attributes**
- Distances/D+: not published on landing page [unknown] — three distances confirmed [scraped].
- Night race: no. Start time: unknown.
- Course topology: unknown (loops within the park) [inference].
- Setting/character: forest + ridgeline inside Parc Natural de Sant Llorenç del Munt i Serra de l'Obac — "recorregut transcorre principalment dins el Parc Natural" [scraped]. The park's La Mola monastery and Obac ridge define its terrain.
- Championship/circuit: registered on the UTMB Index ("una prova registrada a" UTMB Index) [scraped] — carries UTMB Running Stones. FEEC gate: unknown.
- Cutoffs / cups / parking: unknown.
- Tradition: 31st edition ("31a edició") [scraped] — one of the oldest in this chunk.
- Post-race food: unknown. Kids race: unknown.
- Participation: ~1,000 runners across the three races [scraped].
- Technicality: unknown; Sant Llorenç granite/conglomerate terrain is rocky [inference].

**Derived**
- km-esforç: not computable (no distance/D+).
- Season/heat: late October, Sant Llorenç mid-altitude near Barcelona — mild, low heat risk.

**Editorial**
- UNIQUE: a 31-edition institution inside the Sant Llorenç del Munt natural park, now UTMB-Index registered — heritage plus a global points hook. [scraped]
- COOL: iconic conglomerate scenery (La Mola / Serra de l'Obac) close to Barcelona; a 1,000-strong field with real history.
- CATCH: the marathon distance + UTMB registration signal a serious effort, but zero km/D+/cutoff data is published — plan blind or wait for the roadbook. Park regulations tend to mean strict environmental rules. [derived]
- WHO: runners chasing UTMB Running Stones and a storied Catalan mountain marathon; NOT anyone needing published logistics up front.
- REFERENCE POINT: like a Barcelona-doorstep mountain marathon on Montserrat-style conglomerate — pedigree comparable to the region's oldest FEEC classics.

**Honesty flags**
- No distances or D+ on the landing page despite being a "marató"; the marathon figure is a name-based inference. Confirm before publishing numbers.

---

## Cursa per muntanya Turó de les Guineus
- url: https://www.instagram.com/senglarspunksvc/
- town: Sant Vicenç de Castellet · date: 2026-10-25

⚠ **Site not machine-readable — fix-list.** Organizer presence is an Instagram profile only (@senglarspunksvc, "Senglars Punks VC"); no distances, D+, times, or regulations are extractable via fetch.

**What the basics imply**
- Setting: Sant Vicenç de Castellet sits at the foot of Montserrat between the Llobregat and the Montserrat massif — expect forest/ridge terrain with Montserrat conglomerate views [inference].
- "Turó de les Guineus" (Foxes' Hill) names the summit objective — a hill-loop with a climb to a local turó [inference].
- Late-October, low-altitude Catalan Central Depression — mild, low heat risk [derived].
- Club-run ("Senglars Punks") suggests a small, grassroots, non-championship local race [inference].

**Fix-list to complete this card**
- Find a registration URL (likely on a timing platform: 9hsports / rockthesport / championchip) for distance, D+, start time, price.
- Check the FEEC calendar for Sant Vicenç de Castellet, 2026-10-25, for license gate and cutoffs.
- Confirm topology and kids-race/botifarrada from the club's IG event post.

**Honesty flags**
- No data scraped. Everything above is inference from town + name; do not publish as fact.

---

## Cursa Serralats-Lavern
- url: https://serralats.wordpress.com/
- town: Lavern (Subirats) · date: 2026-11-01

⚠ **Site not machine-readable — fix-list.** WordPress site returned HTTP 403 Forbidden on both root and /about (blocks the fetcher, not a 404 — content likely exists in a browser).

**What the basics imply**
- Setting: Lavern is in Subirats, the heart of the Penedès — vineyard + low-hill (Serralada / Ordal foothills) character is near-certain [inference]. Likely a vineyard-and-forest cursa.
- Name "Serralats" points at a ridge/serra objective near Lavern [inference].
- Early November, low Penedès altitude — cool, no heat risk [derived].
- All Saints' long-weekend date (Nov 1) is a traditional Catalan local-race slot [derived].

**Fix-list to complete this card**
- Retry via browser/Chrome MCP (403 blocks WebFetch specifically) or find the registration mirror for distances, D+, start, price, cutoffs.
- Check FEEC / Copa Catalana calendar for a Penedès circuit tie-in and license gate.
- Confirm vineyard character, botifarrada, and kids race from the event page.

**Honesty flags**
- No data scraped (403). All content above is geography-based inference.

---

## Vallalta Trail
- url: https://vallaltatrail.com/
- town: Sant Iscle de Vallalta · date: 2026-11-01

**Structured attributes**
- Distances/D+: Long 18K +800 m; Short 10K +394 m [scraped].
- Night race: no. Start time: unknown.
- Course topology: loop from Sant Iscle — "continuous climbs and descents via trails and paths," high point Turó Gros 758 m [scraped] → out-and-up loop [inference].
- Setting/character: forest + coastal-range (Montnegre massif, near the Maresme coast); features Salt de Sallent waterfall and rope-assisted climbs [scraped].
- Championship/circuit: XTrailCup circuit [scraped]. FEEC gate: unknown.
- Cutoffs / cups / self-sufficiency / parking: unknown.
- Tradition: 10th edition [scraped].
- Post-race food: unknown. Kids race: yes (Vallalta Trail Kids); plus a women's race (Sant Iscle Dona Trail) and an 8 km non-competitive family walk "Marxa Màgica" [scraped].
- Technicality: rope-assisted climbs + "technical sections" stated [scraped] — genuinely technical for its distance.

**Derived**
- km-esforç: Long 18 + 8 = 26; Short 10 + 3.9 = 13.9.
- Season/heat: early November, Montnegre near the coast — mild, low heat risk; possible humidity/mud in forest.

**Editorial**
- UNIQUE: a Montnegre coastal-range trail with fixed-rope climbing sections and the Salt de Sallent waterfall as a mid-course landmark. [scraped]
- COOL: a full festival — main race, women's race, kids' race and a family walk — in its 10th year; part of the XTrailCup.
- CATCH: 800 m over 18 km with rope-assisted, technical sections makes the Long harder than its modest distance suggests; expect slow, hands-on climbing rather than runnable trail. [derived]
- WHO: runners who enjoy technical, hands-on terrain and a family-friendly event day; NOT those wanting fast, smooth, runnable courses.
- REFERENCE POINT: like a Maresme/Montnegre technical short-trail — harder than its 18 km reads because of the ropes and 758 m high point.

**Honesty flags**
- Start times, cutoffs and FEEC gate not published.

---

## Trenca 3 Pics
- url: https://trenca3pics.weebly.com/ (+ /trenca-3-pics.html)
- town: Navàs · date: 2026-11-01

**Structured attributes**
- Distances/D+ [scraped]: Trenca 3 Pics 21 km, +800 m / −800 m. Two shorter options exist: Trenca 1 Pic and Trenca 5K (distances/D+ not published for those).
- Start time: 08:00 from Passeig Ramon Vall, Navàs [scraped].
- Cutoffs (talls horaris): max race time 4:30 h; intermediate cut 3:00 h at aid station 4 ("Av 4. Gas") [scraped].
- Night race: no.
- Course topology: loop over three summits ("3 Pics") from Navàs [scraped name + inference].
- Setting/character: forest + hill/ridge, Bages comarca around Navàs [inference]. GPX/Wikiloc track published [scraped].
- Championship/circuit: unknown. FEEC gate: unknown.
- Cups/self-sufficiency / parking: unknown.
- Organizers: CEN and Desmunta Marges [scraped]. Tradition/edition count: unknown.
- Post-race food: unknown. Kids race: unknown (Trenca 5K is the short option, not stated as kids).
- Technicality: unknown.

**Derived**
- km-esforç: Trenca 3 Pics 21 + 8 = 29. Others not computable.
- Season/heat: early November, Bages mid-hills — cool, no heat risk.

**Editorial**
- UNIQUE: a three-summit ("3 Pics") loop from Navàs — the objective is bagging three local peaks in one lap. [scraped name]
- COOL: compact, well-marked (GPX + Wikiloc provided), local grassroots race with a 5K entry option for newcomers.
- CATCH: 800 m over 21 km behind a 4:30 cutoff and a 3:00 intermediate tall means steady climbing with no dawdling; three summits imply repeated up-down rather than one big climb. [derived]
- WHO: runners after a punchy local peak-bagging 21 km, plus 5K first-timers; NOT those wanting big-event polish.
- REFERENCE POINT: like a Bages comarcal three-peak loop — a "middle" trail whose D+ is the real story, not the distance.

**Honesty flags**
- D+ for Trenca 1 Pic and 5K, FEEC gate, price and edition count not published.

---

## Cursa de la Ratafia
- url: https://cursadelaratafia.cat/
- town: Santa Coloma de Farners · date: 2026-11-01 (⚠ see conflict)

**Structured attributes**
- Distances/D+: not published on landing page [unknown]. Three events: Cursa Petita (run), Marxa Popular (walk), Cursa Kids [scraped].
- Start times: Cursa Petita 08:30, Marxa Popular 09:00, Cursa Kids 12:00 [scraped].
- Night race: no.
- Course topology: loop from Santa Coloma de Farners, start at "Resclosa del Parc de Sant Salvador" [scraped].
- Setting/character: forest, Selva comarca at the foot of the Guilleries massif; visits "espais més emblemàtics i de major valor natural i paisatgístic" [scraped]. Ratafia (the local herbal liqueur) is the cultural theme.
- Championship/circuit: unknown. FEEC gate: unknown.
- Cutoffs / cups / self-sufficiency / parking: unknown.
- Logistics: bib pickup at Pavelló dels Saioners (Sat 09:00–13:00, Sun 07:00–08:45); registration via rockthesport [scraped].
- Tradition: XIV (14th edition) [scraped].
- Post-race food: unknown, but the Ratafia theme implies a local-produce/tasting angle [inference]. Kids race: yes (Cursa Kids, 12:00) [scraped].
- Technicality: unknown.

**Derived**
- km-esforç: not computable (no distance/D+).
- Season/heat: early November, Selva/Guilleries foothills — cool, no heat risk.

**Editorial**
- UNIQUE: themed around Santa Coloma's Ratafia herbal liqueur — a gastronomic-cultural trail, not a summit chase. [scraped]
- COOL: 14-year tradition, family-complete (run + walk + noon kids' race) at the gateway to the Guilleries.
- CATCH: no distances or D+ published, so effort is unknown; the short "Cursa Petita" name plus walk/kids framing suggests a modest, accessible event rather than a hard mountain race. [derived]
- WHO: families and casual trail runners who want a scenic, festive local day; NOT competitors after a serious mountain challenge.
- REFERENCE POINT: like a comarcal festa-cursa — closer to a themed popular run than a Copa Catalana race.

**Honesty flags**
- DATE CONFLICT: DB lists 2026-11-01, but the site's landing page states "Diumenge 08 de Novembre 2026" (Sunday, Nov 8, 2026). Verify the true race date before publishing — likely Nov 8.
- No distances/D+ published; effort characterization is inference.

---

## Chunk summary
- Fully/partially scraped (usable data): Rural Trail, Cursa Neandertal, Marxa Els Roures, Marató de Muntanya de Catalunya, Vallalta Trail, Trenca 3 Pics, Cursa de la Ratafia, KV Roquetes (name/format only) = 8.
- Un-fetchable stubs: Turó de les Guineus (Instagram-only), Cursa Serralats-Lavern (WordPress 403).
- Data conflict flagged: Cursa de la Ratafia date (DB 2026-11-01 vs site 2026-11-08).
- Cleanest cards: Marxa Els Roures (full distances/D+/cutoffs/license/cups) and Vallalta Trail.
