# Enrichment — 2026 Batch, Chunk 3

Race-day cluster: 2026-09-20 (nine races) + 2026-09-26 (one). Enriched from official sites; basics (distance/D+/price/date) already in DB and not repeated except where load-bearing for a derived value. Source tags: [SCRAPE] = stated on page with quote; [DERIVED] = computed/inferred, no scrape; [INFER] = editorial judgment; "unknown" = page silent.

---

## Volta Volcans d'Olot
url: https://ceolot.cat/voltavolcans/

**Structured attributes**
- night-race?: No [DERIVED] — "A les 9 h. Inici de la cursa" (09:00 start)
- start_time_of_day: 09:00, bibs 08:00–08:45 [SCRAPE] "De 8:00 a 8:45 h."
- course_topology: loop [INFER] — "Volta pels volcans" (a *lap* around the town's volcanoes); not stated verbatim
- setting/character: volcanic, national-park [SCRAPE] — climbs "4 volcans del municipi" (Puig del Roser, les Bisaroques, Aiguanegra, la Garrinada, Montsacopa), core of the Garrotxa volcanic zone
- championship/circuit: unknown; FEEC-license gate unknown
- cutoffs: unknown
- aid/self-sufficiency: aid provided — "avituallament sòlid, líquid"; cups vs bring-your-own unknown
- start logistics/parking: bib pickup and start at Volcà Puig del Roser [SCRAPE]
- tradition/edition-count: 18th edition [SCRAPE] "18a EDICIÓ DE LA VOLTA PELS VOLCANS D'OLOT"
- post-race food: unknown (botifarrada not stated)
- kids' race: likely — "primer infantil" prize category referenced, details not stated
- technicality: unknown

**Derived**
- km-esforç: 14 + 490/100 = **18.9** (14 km, 490 m D+)
- season/heat: late-Sept, inland Garrotxa valley ~450 m; mild-to-warm, low heat risk at a 09:00 start [DERIVED]

**Editorial**
- UNIQUE: a genuine tour of Olot's *urban* volcanoes — four cones inside a single town, unmatched geology for the distance [INFER]
- COOL: short, scenic, 18 editions deep — a well-oiled local classic in a UNESCO-grade volcanic landscape
- CATCH: modest numbers (490 m over 14 km) mean it runs closer to a fast trail-run than a mountain race; competitive field, few natural rest points [DERIVED]
- WHO: accessible first-trail or tempo runners wanting scenery over suffering; NOT for those chasing big vert
- REFERENCE: like a park run with four volcanoes bolted on — easier than its "volcans" name suggests

**Honesty**: topology and post-race food inferred, not scraped. No data conflict.

---

## Trail de Monells (23a Marxa de Monells)
url: https://www.curses.cat/monells2026/

**Structured attributes**
- night-race?: No [DERIVED] — registration window "8h a 9h", daytime Sunday
- start_time_of_day: morning; exact gun time not stated (08:00–09:00 is the sign-in window) [SCRAPE]
- course_topology: unknown
- setting/character: Baix Empordà agricultural/forest hinterland around Monells [INFER] — not stated on page
- championship/circuit: unknown; license field is optional ("Número de Llicència" optional) → day-license likely accepted [SCRAPE]
- cutoffs: unknown
- aid/self-sufficiency: unknown
- start logistics/parking: venue is "Camp de Futbol de Monells" [SCRAPE]
- tradition/edition-count: 23rd edition [SCRAPE] "23ª Marxa de Monells"
- post-race food: unknown
- kids' race: unknown (minors need parental authorization)
- technicality: unknown

**Derived**
- km-esforç: not computable — D+ not published for any distance
- Distances offered: Trail 25 km / Trail 18 km / Marxa 14 km / Marxa 8 km [SCRAPE]
- season/heat: late-Sept, low Empordà plain; warm midday possible on the 25 km if slow [DERIVED]

**Editorial**
- UNIQUE: deepest tradition in this cluster (23 editions) built around one of Catalonia's prettiest medieval villages [INFER]
- COOL: four-distance menu from an 8 km walk to a real 25 km trail — a whole-family event
- CATCH: no D+, no cutoffs, no aid detail published — you're signing up on reputation, not spec; the 25 km in late-Sept heat is the sharp end [DERIVED]
- WHO: families and locals across all four distances; the 25 km for club runners
- REFERENCE: a Marxa-style community classic, not a technical objective

**Honesty**: terrain inferred from geography (Monells/Baix Empordà); page publishes almost no course spec.

---

## Cursa del Sot
url: https://sites.google.com/view/cursadelsot/

**Structured attributes**
- night-race?: No [SCRAPE] — "a les 9:00 del matí"
- start_time_of_day: 09:00 [SCRAPE]
- course_topology: unknown
- setting/character: Moianès hill country around Monistrol de Calders — forest/rural [INFER], not stated
- championship/circuit: unknown; non-federates pay +€2 accident insurance [SCRAPE] → day-license/insurance gate
- cutoffs: unknown
- aid/self-sufficiency: unknown
- start logistics/parking: unknown
- tradition/edition-count: unknown (2026 edition; count not stated)
- post-race food: unknown; all finishers get a technical tee [SCRAPE]
- kids' race: yes — "Curses infantils" section in nav [SCRAPE]
- technicality: unknown
- Cap: registration closes 13/09/2026 or at 400 participants [SCRAPE]

**Derived**
- km-esforç: not computable — D+ unpublished
- Distances: caminada 12 km / cursa curta 12 km / cursa llarga 17 km [SCRAPE]
- season/heat: late-Sept, Moianès plateau ~500 m; mild [DERIVED]

**Editorial**
- UNIQUE: small-cap (400) village race in the quiet Moianès — intimate, not crowded [INFER]
- COOL: kids' races + a family caminada alongside the 17 km; technical tee for all
- CATCH: Google-Sites page ships zero D+, cutoffs, or aid info — spec-blind sign-up [DERIVED]
- WHO: local/Moianès runners and families; NOT anyone needing published cutoffs or logistics
- REFERENCE: grassroots caminada-plus-cursa, low stakes

**Honesty**: terrain inferred. Fragile Google-Sites host — publishes little.

---

## Cursa de la Vaca
url: https://www.cansallebres.cat/

**Structured attributes**
- night-race?: unknown (start time not stated)
- start_time_of_day: unknown
- course_topology: loop [INFER] — flat plains course, not stated
- setting/character: flat Segrià/Pla d'Urgell farmland around Vallfogona de Balaguer — road/track, agricultural [INFER]
- championship/circuit: unknown
- cutoffs: unknown
- aid/self-sufficiency: unknown
- start logistics/parking: unknown
- tradition/edition-count: 13th edition [INFER] — site theming uses "número 13" / "divendres 13" imagery
- post-race food: unknown
- kids' race: yes — companion "Cursa de la Vedella 5K" [SCRAPE, routes page]
- technicality: LOW [DERIVED] — flat lowland farmland, effectively a road race
- Distances: Cursa de la Vaca 10K + Cursa de la Vedella 5K, routes on Wikiloc [SCRAPE]

**Derived**
- km-esforç: not computable — D+ unpublished, but geography implies near-zero vert
- season/heat: late-Sept, Ponent plain; can still run hot/dry, exposed farmland, little shade [DERIVED]

**Editorial**
- UNIQUE: barely a "trail" — a flat 10K/5K on the Ponent plain with a cow/calf branding gimmick (Vaca 10K / Vedella 5K) [INFER]
- COOL: fun, festive village run; genuine beginner + kid entry point
- CATCH: exposure, not elevation — flat and shadeless in Ponent late-Sept heat; not a mountain product [DERIVED]
- WHO: road/beginner runners, families; NOT trail runners after vert or terrain
- REFERENCE: a road 10K wearing a trail costume

**Honesty**: edition count and topology inferred from site imagery/geography, not stated. Likely miscategorised as "trail" — flag for DB: this is a flat lowland fun-run.

---

## Trail l'Albiol
url: https://www.naturetime.es/ca/trail-albiol-3/

**Structured attributes**
- night-race?: No [SCRAPE] — 09:00/09:30/09:40 waves
- start_time_of_day: Trail 22K 09:00, Trail 12K 09:30, Start 6K 09:40 [SCRAPE]
- course_topology: unknown (waypoint aid stations suggest not a simple out-and-back) [INFER]
- setting/character: forest, ridgeline [SCRAPE] — "corriols, riuets, boscos, desnivell i unes vistes extraordinàries"; Muntanyes de la Costa Daurada above Tarragona
- championship/circuit: Trail Series + Lliga TGN Trail (12K); 22K is a UTMB qualifier with ITRA points [SCRAPE]. FEEC license not stated; accident insurance €5 mandatory [SCRAPE]
- cutoffs: 22K 4h30, 12K 3h00, 6K 3h00 [SCRAPE]
- aid/self-sufficiency: 22K two aid points (km 7.7, km 17.1) water/isotonic/fruit/solids; 12K one; 6K finish-line only [SCRAPE] — cup policy not stated
- start logistics/parking: no camper/camping zone; showers at Masies Catalanes (12 km away) [SCRAPE]
- tradition/edition-count: 2026 edition, keeps 2025 route mods; count not stated [SCRAPE]
- post-race food: finish refreshments; botifarrada not stated
- kids' race: Start 6K is family-oriented, ages 3+, under-12 €2 with adult [SCRAPE]
- technicality: unknown (organizer silent; "corriols/riuets" hints at real trail)

**Derived**
- km-esforç: 22K = 22.2 + 906/100 = **31.3**; 12K = 12.8 + 570/100 = **18.5**; 6K = 6 + 170/100 = **7.7** [DERIVED]
- season/heat: late-Sept, Costa Daurada foothills, low altitude near coast — warm, sun-exposed on ridgelines; 22K's 4h30 cutoff runs into midday heat [DERIVED]

**Editorial**
- UNIQUE: only UTMB-qualifier / ITRA-points race in this cluster — a ranked objective, not a village run [SCRAPE-grounded]
- COOL: streams, forest and ridgeline views 20 min from Tarragona; three tiers from a 3-year-old's 6K to a 31-effort 22K
- CATCH: 22K is stiffer than its distance — 906 m D+ pushes km-esforç to 31, and the 4h30 cutoff on hot exposed ridgeline is a real gate for mid-packers [DERIVED]; no on-site parking/camping
- WHO: 22K for ITRA-chasing club runners; 12K for the TGN league; 6K for families
- REFERENCE: harder than its 22 km suggests — closer to a 31 km effort, and the cutoff bites

**Honesty**: richest data page in the chunk. Cup policy and technicality still unstated. No conflict.

---

## Cursa Puig de Tiula
url: https://cursapuigdetiula.cat/

⚠ site not machine-readable — JS-only shell, returns just the title on both `/` and `/inscripcions/`. Fix-list: find a rendered source (organizer often mirrors on curses.cat / 9hsports / Instagram) or fetch via headless browser.

**What the basics imply** (Cubelles, coastal Garraf/Penedès edge, 2026-09-20):
- setting/character: coastal-to-inland — Puig de Tiula is the hill above Cubelles; likely sea-view climb from the coast [INFER]
- night-race?: unknown; likely daytime morning start [INFER]
- season/heat: late-Sept, sea-level Garraf coast — warm, humid, sun-exposed; heat is the probable CATCH on any exposed climb [DERIVED]
- km-esforç: not computable — no distance/D+ retrieved
- WHO: likely local Cubelles/Garraf field; spec unknown

**Honesty**: all attributes unknown pending a readable source. Do not assert distance/D+.

---

## Ventallonina (VI Edició)
url: https://www.curses.cat/ventallonina2026/

**Structured attributes**
- night-race?: No [SCRAPE] — "9h" Sunday start
- start_time_of_day: 09:00 [SCRAPE]
- course_topology: unknown
- setting/character: Alt Empordà plain around Ventalló — flat rural/agricultural [INFER], not stated
- championship/circuit: unknown; FEEC license not stated
- cutoffs: unknown
- aid/self-sufficiency: unknown
- start logistics/parking: unknown; organized by Ajuntament de Ventalló
- tradition/edition-count: 6th edition [SCRAPE] "VI Edició"
- post-race food: yes — "Botifarra" + "Formatge" (sausage + cheese) [SCRAPE] → botifarrada-style finish
- kids' race: yes — youth categories "UNISEX 6 ANYS / 8 ANYS / 12 ANYS" [SCRAPE]
- technicality: LOW [INFER] — flat Empordà terrain
- Distances: 12 km (€15) / 8 km (€12) [SCRAPE]

**Derived**
- km-esforç: not computable — D+ unpublished; geography implies little vert
- season/heat: late-Sept Empordà plain; warm, can be windy (Tramuntana), low shade [DERIVED]

**Editorial**
- UNIQUE: village botifarra-and-cheese run in the flat Alt Empordà — the food and kids' categories are the point, not the profile [INFER]
- COOL: proper post-race botifarrada, three kids' age groups — a family Sunday
- CATCH: flat and short means it's a fun-run, not a challenge; no published D+/cutoffs [DERIVED]
- WHO: families, beginners, locals; NOT trail runners after terrain
- REFERENCE: like Cursa de la Vaca — a lowland community run with a grill at the finish

**Honesty**: terrain/technicality inferred from geography. D+ absent.

---

## Folguerolenca Trail
url: https://www.9hsports.cat/ca/informacio_cursa/1192

**Structured attributes**
- night-race?: unknown (start time not stated)
- start_time_of_day: unknown
- course_topology: unknown
- setting/character: Guilleries/Plana de Vic edge around Folgueroles (Verdaguer's village) — forest/rural [INFER], not stated
- championship/circuit: unknown; FEEC license not stated
- cutoffs: unknown
- aid/self-sufficiency: unknown
- start logistics/parking: unknown
- tradition/edition-count: unknown
- post-race food: unknown
- kids' race: unknown
- technicality: unknown
- Formats: Folguerolenca Trail 14 km + a Caminada (distance not stated) [SCRAPE]

**Derived**
- km-esforç: not computable — D+ unpublished
- season/heat: late-Sept, Plana de Vic ~550 m; mild, morning fog possible [DERIVED]

**Editorial**
- UNIQUE: trail through Jacint Verdaguer's home village on the Guilleries fringe [INFER]
- COOL: manageable 14 km + a walk option — approachable Osona local
- CATCH: 9hsports listing is a bare registration stub — no D+, time, aid, or cutoffs published [DERIVED]
- WHO: Osona locals, mid-distance runners, walkers; NOT anyone needing spec upfront
- REFERENCE: a standard 14 km comarcal trail, spec TBD

**Honesty**: registration-portal page only; almost everything unknown. Terrain inferred.

---

## La Cambrils-Odèn (I edició)
url: https://www.circuitfer.cat/

**Structured attributes** (from the circuit landing page — no dedicated race page reachable)
- night-race?: unknown
- start_time_of_day: unknown
- course_topology: unknown
- setting/character: alpine / high-mountain [INFER] — Odèn (Solsonès) sits under the Port del Comte massif, Prepirineu; genuinely mountainous terrain
- championship/circuit: **Circuit FER** — "XVII Cadí Circuit Fer", a nine-race mountain-running circuit across the Cadí region; this is round "I Cambrils-Odèn" (inaugural edition) [SCRAPE]. FEEC-license gate: circuits of this type normally require FEEC license or day-license — not confirmed on page
- cutoffs: unknown
- aid/self-sufficiency: unknown
- start logistics/parking: unknown
- tradition/edition-count: 1st edition of this race, within a 17th-edition circuit [SCRAPE]
- post-race food: unknown
- kids' race: unknown
- technicality: unknown (Prepirineu terrain implies moderate-high, but organizer silent)

**Derived**
- km-esforç: not computable — no distance/D+ published on the circuit page
- season/heat: late-Sept, Prepirineu ~1,000–1,800 m — cool, possible early-autumn cold/rain at altitude; heat low but exposure/weather the real risk [DERIVED]
- Note: town field in DB says "La Seu d'Urgell" but Odèn is in Solsonès (~Sant Llorenç de Morunys side), not Alt Urgell — verify locality [FLAG]

**Editorial**
- UNIQUE: only high-mountain / Prepirineu race in this cluster, and an inaugural edition inside a 17-year Cadí circuit [SCRAPE-grounded]
- COOL: real alpine terrain (Port del Comte country) and circuit ranking, versus the lowland village runs sharing this date
- CATCH: circuit page gives no distance, D+, cutoffs or logistics — plus altitude and autumn mountain weather; the hardest-to-scope, likely hardest-to-run race here [DERIVED]
- WHO: mountain/skyrunning circuit regulars; NOT beginners or anyone needing published spec
- REFERENCE: a Prepirineu mountain race, not a comarcal trot — expect more vert than the flat Sept-20 field

**Honesty**: no per-race page reachable; attributes from circuit context only. Locality discrepancy flagged (Odèn = Solsonès, not La Seu d'Urgell/Alt Urgell). Do not assert distance/D+.

---

## Lo Trail de Secà
url: https://www.instagram.com/lotraildeseca

⚠ site not machine-readable — Instagram profile, no scrapable event data. Fix-list: check pinned post / bio for the entry link (often routes to a rsolesport/curses.cat/emmarcaT form); or ask organizer.

**What the basics imply** (Juncosa, Les Garrigues, 2026-09-26):
- setting/character: dry-land ("secà") olive/almond terraces of Les Garrigues — arid, rocky, low-shrub hills; the name *Trail de Secà* literally means "dryland trail" [INFER]
- night-race?: unknown; **date is a Saturday (2026-09-26)** — unusual for the cluster, could indicate an afternoon or evening/night start, but unconfirmed [INFER]
- season/heat: late-Sept, interior Garrigues — hot, dry, very exposed; heat/aridity is the defining hazard of any secà course [DERIVED]
- km-esforç: not computable — no distance/D+ retrieved
- WHO: likely local Garrigues/Lleida field drawn by the arid-terroir character; spec unknown

**Honesty**: Instagram-only, expected un-fetchable. All hard attributes unknown; character inferred from name + Garrigues geography. Note the Saturday date differs from the rest of the chunk.
