# Enrichment batch 2026 — chunk 6

Taste profiles for 10 races (2026-10-10 → 2026-10-18). Basics (distance/D+/price/date) live in the DB; this file is the layer no calendar has. Source tags: `[scraped]` = stated on the official page (quote given), `[derived]` = computed/inferred by us, `[unknown]` = page silent.

---

## La Xafonada
- url: https://www.oden.cat/home/xafonada/
- town: Odèn (start at Cambrils del Pirineu) · date: 2026-10-10

**Structured attributes**
- Distance/D+: `[scraped]` 12 km / 700 m D+ — "12 km amb 700 m de desnivell positiu"
- Night race: `[unknown]` — 2026-10-10 is a Saturday; start time not stated, no night language
- Start time of day: `[unknown]`
- Course topology: `[scraped]` loop — "una cursa circular"
- Setting/character: `[scraped]` alpine / pre-Pyrenean forest — "camins i corriols de muntanya" between Alt Urgell and Solsonès; start in the Pyrenean foothills at Cambrils del Pirineu
- Championship/circuit: `[scraped]` Circuit FER, and new to it this year — "aquest any som cursa amiga del circuit"
- FEEC / day-license gate: `[unknown]`
- Cutoffs (talls horaris): `[unknown]`
- Aid / self-sufficiency: `[unknown]` (cup/bottle policy not stated)
- Start logistics/parking: `[scraped]` parking via Google Maps link on the page
- Tradition/edition: `[derived]` established local race, but first year as a Circuit FER "cursa amiga"
- Post-race food: `[scraped]` yes — "Al final de la cursa hi haurà menjar per als participants" (menu unspecified)
- Kids race: `[unknown]`
- Technicality: `[unknown]`

**Derived**
- km-esforç: `[derived]` 12 + 700/100 = **19** — an easy-to-moderate index; a genuine short race
- Season/heat: `[derived]` mid-October at ~1,000 m+ in the Pyrenean foothills — cool to cold, low heat risk; morning start could be near-freezing

**Editorial**
- UNIQUE: a true short, circular mountain race in high Alt Urgell/Solsonès terrain — rare to find 700 m packed into only 12 km at this altitude.
- COOL: Pyrenean-foothill scenery and a low-commitment distance; new Circuit FER membership signals a race on the up.
- CATCH: `[derived]` 700 m in 12 km means a steep climb-per-km ratio — steeper than the flat "12 km" label suggests; altitude adds early-morning cold.
- WHO: newer trail runners wanting real mountain feel without a long day; families near the Pyrenees. NOT for those chasing distance/championship points.
- REFERENCE POINT: like a short Copa-Catalana-style ascent race, but circular and low-key — "harder than its 12 km suggests."

**Honesty flags**: none — figures internally consistent.

---

## La Selvatjada
- url: https://www.curses.cat/laselvatjada2026/
- town: La Selva de Mar · date: 2026-10-11

⚠ **site not machine-readable** — the curses.cat race URL returns the platform's generic event index, not the race page (JS-rendered / registration-platform shell). No race-specific data extractable.

**Fix-list**: find the organizer's own page or Instagram; confirm distances, D+, start time, circuit for La Selva de Mar (Cap de Creus / Alt Empordà). Contact on platform: angel@curses.cat / 650 320 310.

**Basics imply** `[derived]`: La Selva de Mar sits inside the Cap de Creus massif (Alt Empordà) — expect coastal/Mediterranean-scrub, rocky-technical, low-altitude terrain with real heat and wind exposure even in mid-October. Name "Selvatjada" (wild) hints at a rugged, self-styled-tough course. Verify before publishing.

---

## Cursa Serra de les Fites
- url: https://serradelesfites.org/
- town: La Pobla de Massaluca (Terra Alta) · date: 2026-10-11

**Structured attributes**
- Distances/D+: `[scraped]` four options — Llarga 25K / +1,100 m (21+) · Exprés 18K / +700 m (18+) · Curta i Marxa 13K / +350 m (10+) · Infantil 5K / +250 m
- Night race: `[unknown]`
- Start time of day: `[unknown]`
- Course topology: `[unknown]`
- Setting/character: `[scraped]/[derived]` rural Terra Alta mountain terrain — "al terme de la Pobla de Massaluca (Terra Alta)"; this is dry vineyard/Mediterranean-scrub back-country near the Ebre
- Championship/circuit: `[unknown]`
- FEEC / day-license gate: `[unknown]`
- Cutoffs: `[unknown]`
- Aid / self-sufficiency: `[unknown]`
- Start logistics/parking: `[unknown]`
- Tradition/edition: `[unknown]`
- Post-race food: `[scraped]` village-organized meals — "meals organized by villagers"
- Kids race: `[scraped]` yes — the 5K "Cursa Infantil" (note the page's "ages 14+" tag conflicts with a kids label; see flag)
- Technicality: `[unknown]`

**Derived**
- km-esforç: `[derived]` Llarga 25 + 1,100/100 = **36** · Exprés 18 + 700/100 = **25** · Curta 13 + 350/100 = **16.5**
- Season/heat: `[derived]` Terra Alta is one of Catalonia's hottest, driest corners; mid-October usually mild but afternoon exposure on open vineyard/scrub ridges can still bite — little shade.

**Editorial**
- UNIQUE: a full four-distance rural festival (5→25K) in the little-raced Terra Alta wine country, run by the village itself.
- COOL: deep small-village character and food; a distance for every level including a real kids/short option.
- CATCH: `[derived]` the 25K's 1,100 m and open, shadeless Terra Alta terrain make heat and exposure the real difficulty; logistics to La Pobla de Massaluca are remote.
- WHO: runners who want a grassroots village race and Terra Alta scenery; families (multiple short options). NOT for those needing championship points or precise published logistics.
- REFERENCE POINT: like a classic FEEC rural festa-cursa — modest D+, big community, heat-and-remoteness the hidden tax.

**Honesty flags**: the source's age tags look garbled ("Infantil 5K — ages 14+", "Curta 13K — ages 10+") — treat all age brackets as unverified. Circuit/FEEC status unknown.

---

## Campionat Maqui Castelltallat (14 km)
- url: https://www.campionatmaqui.cat/cursa-castelltallat-14km/
- town: Castelltallat (Bages) · date: 2026-10-11

**Structured attributes**
- Distances/D+: `[scraped]` 14.5 km / +300 m ("La feréstega") · 5 km / +150 m
- Night race: `[scraped]` no — daytime
- Start time of day: `[scraped]` registration 08:30, start 09:30 (Sun 2026-10-11)
- Course topology: `[unknown]` — mixed "trails, forest paths, unpaved tracks, farmhouses", loop/OAB not stated
- Setting/character: `[scraped]` forest / rural Bages — "boscos, corriols, pistes, masies"; branded "l'autèntica clàssica rural i salvatge", "#lamésrural"
- Championship/circuit: `[scraped]` Campionat Maqui 2026 (its own championship series)
- FEEC / day-license gate: `[scraped]` non-homologated; insurance required for non-licensed runners (+€4/day pass)
- Cutoffs: `[unknown]`
- Aid / self-sufficiency: `[scraped]` three refreshment points (fruit + drinks); cup/bottle policy not stated
- Start logistics/parking: `[scraped]` C-25 → BV-3008 toward Fonollosa; rural access road
- Tradition/edition: `[scraped]` 15th edition of the race / 14th championship year — a genuine classic
- Post-race food: `[scraped]` yes — "Esmorzar de germanor" (communal breakfast)
- Kids race: `[scraped]` none mentioned (the 5 km is the short option)
- Technicality: `[unknown]` (organizer frames it "salvatge"/wild but no explicit rating)

**Derived**
- km-esforç: `[derived]` 14.5 + 300/100 = **17.5** — low index; a runnable, rolling course, not a climber's race
- Season/heat: `[derived]` inland Bages, mid-October, 09:30 start — cool morning, low heat risk

**Editorial**
- UNIQUE: a 15-year "maqui" (anti-Franco guerrilla) themed rural classic — identity and history, not just a course.
- COOL: forest-and-masia Bages terrain, communal breakfast, strong grassroots ethos; low D+ makes it fast and approachable.
- CATCH: `[derived]` non-homologated + the +€4 day insurance is an easy trip-up for unlicensed runners; low D+ means it's decided on speed, not survival — less "epic" than the wild branding implies.
- WHO: runners who want character, community and a runnable 14K; unlicensed runners fine (day pass exists). NOT for altitude-seekers or those needing FEEC-homologated results.
- REFERENCE POINT: like a fast rural forest 14K — think tempo effort with a story, not a mountain sufferfest.

**Honesty flags**: page says D+ "varies annually" — treat 300 m as approximate.

---

## Cursa de muntanya Tivissa
- url: https://cursativissa.cat/
- town: Tivissa (Ribera d'Ebre) · date: 2026-10-11

⚠ **site not machine-readable** — page returns only the title banner ("XX Cursa de Tivissa | 20è aniversari | 11 d'octubre 2026"); body is JS-rendered. Distances, D+, times, circuit not extractable.

**Fix-list**: pull the reglament PDF or the registration platform (likely curses.cat/9hsports) for modalities, D+, start time, aid, cutoffs.

**Confirmed** `[scraped]`: **20th edition / 20è aniversari**, 2026-10-11 — a long-standing, well-established race.
**Basics imply** `[derived]`: Tivissa (Ribera d'Ebre, near Serra de Llaberia / Serra de Tivissa) is dry, rocky, low-mid-altitude Mediterranean mountain terrain — expect technical rock, scrub, and notable heat/sun exposure; a 20-year run signals solid organization and local tradition. Verify all numbers before publishing.

---

## Brama Stage Run
- url: https://brama.run/es/
- town: Ribes de Freser (Ripollès) · date: 2026-10-16 → 10-18 (3 days)

**Structured attributes**
- Format/distances: `[scraped]` 3-stage race — BRAMA100K (98 km / 6,100 m D+) · BRAMA80K (76 km / 4,400 m) · BRAMA60K (58 km / 3,200 m); "3 días de trail-running y aventura"
- Stage breakdown: `[scraped]` S1 Ribes 17–33 km / 900–2,100 m · S2 Núria 25–33 km / 1,100–1,800 m · S3 Ribes–Taga 16–32 km / 1,200–2,200 m
- Night race: `[unknown]` (no night language; stages are day events)
- Start time of day: `[unknown]`
- Course topology: `[scraped]/[derived]` point-to-point stages hubbed on Ribes de Freser (Ribes → Núria → Ribes/Taga)
- Setting/character: `[scraped]` alpine / national-park / ridgeline — Eastern Pyrenees, "3 zonas bien diferenciadas": Serra Cavallera + Taga, Núria Sanctuary, Parc Natural de les Capçaleres del Ter i del Freser
- Championship/circuit: `[unknown]` (standalone multi-stage event)
- FEEC / day-license gate: `[unknown]`
- Cutoffs: `[unknown]`
- Aid / self-sufficiency: `[unknown]`
- Start logistics/parking: `[scraped]` Ribes de Freser is the hub ("centro neurálgico"); two tiers — Basic (own lodging) vs Full Experience (lodging + dinners, sold out)
- Tradition/edition: `[scraped]` 4th edition; prior editions sold out in ~10 days, 250 runners / 31 nationalities
- Post-race: `[scraped]` nightly awards + audiovisual recap — "Cada noche celebraremos la entrega de premios y veremos un audiovisual del día"
- Kids race: `[unknown]`
- Technicality: `[derived]` high-mountain Pyrenean terrain with big daily D+ — technically and physically serious

**Derived**
- km-esforç (whole event): `[derived]` 100K = 98 + 6,100/100 = **159** · 80K = 76 + 4,400/100 = **120** · 60K = 58 + 3,200/100 = **90** — elite-level totals across three days
- Season/heat: `[derived]` mid-October at 1,500–2,800 m (Núria) — cold, real risk of first snow, short daylight; heat not the concern, cold/altitude is

**Editorial**
- UNIQUE: the only true multi-day Pyrenean stage race in this window — three days across Núria, Taga and a natural park, base-camped in one village.
- COOL: sold-out cult event, international field, nightly awards-and-film ritual; a running holiday, not just a race.
- CATCH: `[derived]` 4,400–6,100 m of cumulative climb over three days, high altitude, mid-October cold and short days; Full Experience already sold out so lodging logistics fall on you; the biggest barrier is committing three days + travel.
- WHO: experienced mountain ultrarunners who want a stage-race adventure and can self-organize (Basic tier). NOT for beginners, single-day racers, or anyone without solid vertical endurance.
- REFERENCE POINT: like a mini Pyrenees version of a Costa Brava/Andorra stage race — "harder than any single 100K because it's three back-to-back mountain days."

**Honesty flags**: per-stage ranges (17–33 km etc.) span all three distance options; exact per-modality stage figures need the official reglament. Cutoffs/licensing unverified.

---

## La Nocturna Trinxavambes
- url: https://misports.cat/curses/nocturna-trinxavambes/
- town: Vallromanes (Vallès Oriental) · date: 2026-10-17

**Structured attributes**
- Distances/D+: `[scraped]` Trail 21K / D+ 1,000 m · Trail 11K / D+ 425 m · Caminada 8K / D+ 280 m
- Night race: `[scraped]` yes — "una cursa nocturna pels corriols de Vallromanes", Saturday evening
- Start time of day: `[scraped]` 21K 18:30h · 11K 19:15h · Caminada 19:30h
- Course topology: `[unknown]`
- Setting/character: `[scraped]` forest / coastal-view — mountain trails "with Mediterranean views" above Vallromanes
- Championship/circuit: `[unknown]`
- FEEC / day-license gate: `[unknown]`
- Cutoffs: `[scraped]` 21K "Límit: 2h i 45 minuts", cut at the first aid station
- Aid / self-sufficiency: `[scraped]` 21K has "2 en recorregut + final" (Zona de Cal Senyor, Mirador de la Cornisa); cup/bottle policy not stated
- Start logistics/parking: `[scraped]` start/finish Pista Poliesportiva Coberta de Vallromanes; parking at Parking de les Escoles
- Tradition/edition: `[unknown]`
- Post-race food: `[unknown]`
- Kids race: `[unknown]`
- Technicality: `[unknown]`
- Headlamp: `[derived]` night race → frontal/headlamp effectively required though not stated on page

**Derived**
- km-esforç: `[derived]` 21 + 1,000/100 = **31** · 11 + 425/100 = **15.3**
- Season/heat: `[derived]` evening October near the coast — mild-to-cool, no heat issue; darkness and footing are the variables

**Editorial**
- UNIQUE: a proper night trail 20 min from Barcelona with Mediterranean-view ridgelines under headlamp.
- COOL: 18:30 start, city-close logistics, three tiers (race/short/walk) — an easy midweek-feel Saturday-night adventure.
- CATCH: `[derived]` the 21K's 2h45 cutoff to the first aid is genuinely tight for 21 km / 1,000 m in the dark — not a stroll; night navigation on corriols punishes anyone off-pace.
- WHO: Barcelona-area runners wanting a novelty night race; the 11K/walk suit newcomers. NOT for those who dislike headlamp running or need a generous cutoff.
- REFERENCE POINT: like a coastal Collserola-style night trail — short but the dark plus a hard cutoff make the 21K sharper than its numbers.

**Honesty flags**: page mixes "10K"/"11K" labels for the middle distance — treat as ~11K. Headlamp requirement inferred, not stated.

---

## Trail del Bisaura
- url: https://www.traildelbisaura.com/
- town: Sant Quirze de Besora (Osona) · date: 2026-10-17

**Structured attributes**
- Distances/D+: `[scraped]` "El Putu Trail" 45 km / 2,600 m · "La Mitja (i pico)" 25 km / 1,500 m · "La (no tant) Curta" 14 km / 700 m · "La Caminada" 6 km / 150 m
- Night race: `[unknown]` (2026-10-17 Saturday; 45K may start pre-dawn — unverified)
- Start time of day: `[unknown]`
- Course topology: `[unknown]`
- Setting/character: `[scraped]/[derived]` mid-mountain forest — Bisaura subregion between Osona and Ripollès; "indrets màgics", a "Cursa de muntanya ben parida"
- Championship/circuit: `[scraped]` Copa Osoning Trail Run
- FEEC / day-license gate: `[unknown]`
- Cutoffs: `[unknown]`
- Aid / self-sufficiency: `[unknown]`
- Start logistics/parking: `[unknown]`
- Tradition/edition: `[scraped]` 14th edition — well established
- Post-race food: `[unknown]`
- Kids race: `[unknown]` (6 km Caminada is the family option)
- Technicality: `[unknown]`

**Derived**
- km-esforç: `[derived]` 45K = 45 + 2,600/100 = **71** · 25K = 25 + 1,500/100 = **40** · 14K = 14 + 700/100 = **21**
- Season/heat: `[derived]` inland Osona pre-Pyrenees, mid-October — cool; a 45K would face short daylight and a possible cold dawn start

**Editorial**
- UNIQUE: a four-tier local classic with a genuinely tough 45K ("El Putu Trail") in the under-raced Bisaura hills — plus a self-deprecating naming voice (El Putu / no-tant-Curta) that signals real character.
- COOL: 14 years of tradition, Copa Osoning membership, a distance for everyone from 6K walk to 45K.
- CATCH: `[derived]` the 45K's 2,600 m over 45 km is a serious mountain day; with no published start times/cutoffs, the early-morning logistics and daylight window are the unknown to check.
- WHO: Osona/Ripollès trail runners wanting a stout local ultra or a scenic mid-distance; families take the 6K. NOT for anyone needing published cutoffs/logistics before committing.
- REFERENCE POINT: like a classic Osoning mid-mountain race — the 45K "harder than its 45 km suggests" once the 2,600 m stacks up.

**Honesty flags**: start times, cutoffs, aid all unknown — page is thin on logistics. Verify before publishing the 45K profile.

---

## La Salvatge Trail
- url: https://cerellinars.cat/salvatgetrail/
- town: Rellinars (Vallès Occidental) · date: 2026-10-18

**Structured attributes**
- Distances/D+: `[unknown for 2026]` — page states multiple options; exact 2026 distances not published in fetched text; "historical editions ranged from ~10.5 km to 21.5 km"
- Night race: `[unknown]`
- Start time of day: `[unknown]`
- Course topology: `[scraped]` trail/path course avoiding tarmac — "camins i corriols", "evitant al màxim el traçat urbà"
- Setting/character: `[scraped]` forest / rocky massif — Serra de l'Obac, emblematic "Roca Salvatge" peak (Sant Llorenç del Munt i l'Obac area)
- Championship/circuit: `[scraped]` FEEC-affiliated (organized by Centre Excursionista Rellinars with FEEC support); specific 2026 circuit not detailed
- FEEC / day-license gate: `[derived]` FEEC-affiliated → expect a licence-or-day-pass gate; not explicitly stated
- Cutoffs: `[scraped]` maximum times exist — "Temps màxim per a realitzar cadascun dels itineraris" (values not published in fetched text)
- Aid / self-sufficiency: `[unknown]`
- Start logistics/parking: `[scraped]` "Com arribar i aparcament" section on site (details not fetched)
- Tradition/edition: `[scraped]` 13th edition; since 2013 (Tennis Club → Centre Excursionista Rellinars from 2024); 3,300+ finishers over 12 editions
- Post-race food: `[unknown]` (volunteers get "samarreta, entrepà i beguda"; runner food not confirmed)
- Kids race: `[unknown]`
- Technicality: `[unknown]` ("Salvatge"/wild branding + Serra de l'Obac rock suggests some technical rock, unconfirmed)

**Derived**
- km-esforç: `[derived]` cannot compute — 2026 D+ not published; historical ~10.5–21.5 km range only
- Season/heat: `[derived]` low-mid altitude Vallès massif, mid-October — mild; south-facing rocky sections can be warm midday but low overall heat risk

**Editorial**
- UNIQUE: a green/solidarity-branded community race on the striking Roca Salvatge in Serra de l'Obac — strong values ethos ("verda, solidària, sostenible, inclusiva").
- COOL: 13 years and 3,300+ finishers, near-Barcelona, deliberately off-tarmac scenic routing.
- CATCH: `[derived]` 2026 distances and D+ aren't published in the fetched page, so the difficulty is unconfirmed; the Roca Salvatge rock likely adds technical footing the "inclusive/festive" framing understates.
- WHO: Vallès/Barcelona runners who value a community, low-key, scenic race. NOT for those needing exact 2026 course data up front or a big-D+ challenge.
- REFERENCE POINT: like a classic Sant Llorenç del Munt-obac short trail — festive and green, with more rock underfoot than the marketing admits.

**Honesty flags**: 2026 distances/D+ not published in fetched content (only historical range) — km-esforç uncomputable; confirm before publishing.

---

## Fem Sui
- url: https://www.femsui.cat/
- town: Sant Antoni de Vilamajor (Baix Montseny) · date: 2026-10-18

**Structured attributes**
- Distances/D+: `[scraped]` Trail 25K / 1,400 m · Exprés 15K / 450 m · Caminada 11K / 260 m
- Night race: `[unknown]`
- Start time of day: `[unknown]`
- Course topology: `[unknown]`
- Setting/character: `[scraped]` forest / Montseny foothills — Baix Montseny, "corriols tècnics, boscos d'alçada"
- Championship/circuit: `[unknown]`
- FEEC / day-license gate: `[unknown]`
- Cutoffs: `[unknown]`
- Aid / self-sufficiency: `[scraped]` 25K "cinc avituallaments més el de meta" (5 + finish) · 15K "dos avituallaments + meta" · 11K two + finish; cup/bottle policy not stated
- Start logistics/parking: `[unknown]`
- Tradition/edition: `[scraped]` 13th edition
- Post-race food: `[unknown]`
- Kids race: `[unknown]` (11K Caminada is the family/all-ages option — "una ruta familiar, tranquil·la")
- Technicality: `[scraped]` explicitly stated — 25K has "corriols tècnics" (technical trails), unusual for an organizer to admit

**Derived**
- km-esforç: `[derived]` 25K = 25 + 1,400/100 = **39** · 15K = 15 + 450/100 = **19.5** · 11K = 11 + 260/100 = **13.6**
- Season/heat: `[derived]` Baix Montseny forest, mid-October — cool and shaded, low heat risk; good conditions

**Editorial**
- UNIQUE: a 13-year Baix Montseny race that openly sells technical trails and high forest — an honest "molt més que una cursa" identity in Montseny's shadow.
- COOL: dense shaded Montseny singletrack, well-stocked 25K (five aid stations), a runnable 15K and family 11K.
- CATCH: `[derived]` the 25K's 1,400 m plus admitted "corriols tècnics" make it more demanding than a Montseny-foothill 25K sounds — footing, not distance, is the tax; start times/circuit unpublished.
- WHO: runners who like technical wooded singletrack and a mid-distance challenge; the 15K/11K suit newcomers and families. NOT for road-pace runners or anyone wanting fast non-technical terrain.
- REFERENCE POINT: like a small-scale Montseny classic — "harder than its 25 km / 1,400 m suggests once the technical corriols slow you down."

**Honesty flags**: none major; circuit affiliation and start times unconfirmed.
