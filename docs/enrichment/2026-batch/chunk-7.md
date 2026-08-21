# Enrichment — 2026 batch — chunk 7

Taste profiles for 10 races (dates 2026-10-18 → 2026-10-24). Basics (distance/D+/price/date) live in the DB; this layer is character, gates, logistics, and editorial read. Source tags: [SCRAPE] = stated on page, [DERIVED] = computed, [INFER] = grounded guess, [UNKNOWN] = not stated.

---

## Marxa Bonesvalls
url: https://www.marxabonesvalls.cat/ · Olesa de Bonesvalls · 2026-10-18

**Structured attributes**
- Distances/D+: MB14 = 14 km / +300 m; MB30 = 30 km / +900 m. [SCRAPE] "14 KM… +300m", "30 KM… +900m"
- Night race: No. [INFER] (day marxa, no night mention)
- Start time: [UNKNOWN]
- Course topology: [UNKNOWN] — likely loop from Olesa. [INFER]
- Setting/character: forest · Mediterranean hills (Alt Penedès). "La millor cursa de l'Alt Penedès". [SCRAPE]
- Championship/circuit: [UNKNOWN] — no Copa Catalana / Campionat claim. FEEC gate not stated. [SCRAPE-absent]
- Cutoffs: [UNKNOWN]
- Aid/self-sufficiency: "Avituallaments de qualitat". Cup policy [UNKNOWN]. [SCRAPE]
- Start logistics/parking: [UNKNOWN]. Showers, changing rooms, cloakroom, medical, timing provided. [SCRAPE]
- Tradition: XIII Edició (13th). [SCRAPE]
- Post-race food: Botifarrada; registration "Inclou dinar, bossa i samarreta" (lunch + bag + shirt). [SCRAPE]
- Kids race: [UNKNOWN]
- Technicality: [UNKNOWN] — MB14 tagged "Iniciació", MB30 "Expert". [SCRAPE]

**Derived**
- km-esforç: MB14 = 14 + 3 = 17; MB30 = 30 + 9 = 39. [DERIVED]
- Season/heat: mid-Oct, low inland hills — mild, low heat risk. [DERIVED]

**Editorial**
- UNIQUE: the flagship autumn race of the Alt Penedès, lunch-and-shirt inclusive package. [INFER]
- COOL: full finish-line comfort (showers, cloakroom, botifarrada) for a small local price. [SCRAPE]
- CATCH: MB30 at km-esforç 39 is a genuine "Expert" step up from the 17 of the MB14 — no middle option. [DERIVED]
- WHO: MB14 for first-timers; MB30 for club runners wanting a low-D+ but long day. Not for anyone chasing technical mountain terrain. [INFER]
- REFERENCE: a runnable Penedès half-plus — easier per km than a Pyrenean race, honest on the 30.

**Honesty**: no elevation conflict. Start time, cutoffs, cup policy, kids race all unstated.

---

## Corriols de Guardiola
url: https://www.corriolsdeguardiola.cat/ · Sant Salvador de Guardiola · 2026-10-18

**Structured attributes**
- Distances: 22 km, 10 km, 5 km + kids "Corriolets" (Grans/Mitjans/Petits). [SCRAPE]
- D+: [UNKNOWN] on fetched content.
- Night race: No. [INFER]
- Start time: [UNKNOWN]
- Course topology: mountain courses; 22 km "passa per Montgròs". [SCRAPE] Loop [INFER].
- Setting/character: forest · low mountain (Bages). [SCRAPE]
- Championship/circuit: [UNKNOWN] — local community race. FEEC gate not stated.
- Cutoffs: [UNKNOWN]
- Aid/self-sufficiency: 22 km = 4 líquid + 3 sòlid stations; 10 km = 3+2; 5 km = 1. Cup policy [UNKNOWN]. [SCRAPE]
- Start logistics/parking: [UNKNOWN]
- Tradition: 15ª edició (15th). [SCRAPE]
- Post-race food: [UNKNOWN]
- Kids race: Yes — Corriolets, three tiers. [SCRAPE]
- Technicality: demanding mountain terrain [SCRAPE], LOW confidence.

**Derived**
- km-esforç: [UNKNOWN] — D+ not on page. [DERIVED-blocked]
- Season/heat: mid-Oct, inland Bages — mild. [DERIVED]

**Editorial**
- UNIQUE: a well-supported village race (up to 7 aid points on 22 km) with a full kids' ladder. [SCRAPE]
- COOL: family-day format — 5/10/22 + three kids categories, everyone runs. [SCRAPE]
- CATCH: D+ unpublished on the page, so the 22 km's real difficulty is opaque until you pull the Wikiloc track. [DERIVED]
- WHO: local families and club runners; the 22 for those wanting mountain feel near Manresa. [INFER]
- REFERENCE: a classic Bages corriols race — social, well-fed, aid-dense.

**Honesty**: D+ missing → km-esforç uncomputable. Cup policy, start time, cutoffs unstated.

---

## Cursa Parc dels Talls
url: https://www.instagram.com/cursaparcdelstalls/ · Vilobí del Penedès · 2026-10-18

⚠ site not machine-readable — Instagram profile only, no post/bio text returned. Fix-list: find an official reg page (likely 9hsports / championchip / feec.cat) or scrape the IG bio link manually.

**What the basics imply** [INFER]
- Vilobí del Penedès = Alt Penedès vineyard country → expect vineyard · forest character, low D+, runnable.
- Mid-Oct, low altitude → mild, low heat.
- Name "Parc dels Talls" points at the local Parc dels Talls green space as the course setting.
- Everything else (distances, D+, start time, circuit, cutoffs, food) [UNKNOWN] until a real page is found.

---

## La Megalítica (Trail La Megalítica Acerko)
url: https://www.lasansi.com/es/tossamarato · Tossa de Mar · 2026-10-18

**Structured attributes**
- Distances: 21 km, 10 km, 5 km. [SCRAPE] (page shows 2025 = 7th ed.)
- D+: [UNKNOWN] on page.
- Night race: No. [SCRAPE] — "09:00h Salida de las 3 distancias".
- Start time: 09:00, mass start all three distances. [SCRAPE]
- Course topology: [UNKNOWN] — loop from Tossa pavilion [INFER].
- Setting/character: coastal · Mediterranean forest · megalithic/historic (dolmens near Tossa de Mar). [SCRAPE/INFER]
- Championship/circuit: organized by La Sansi. FEEC gate [UNKNOWN].
- Cutoffs: [UNKNOWN]
- Aid/self-sufficiency: [UNKNOWN]
- Start logistics/parking: "Delante del pabellón de Tossa"; bib pickup at the polideportivo. Bib draw 08:45 Sun. [SCRAPE]
- Tradition: 7th edition (2025 page). [SCRAPE]
- Post-race food: [UNKNOWN]
- Kids race: [UNKNOWN]
- Technicality: [UNKNOWN]

**Derived**
- km-esforç: [UNKNOWN] — D+ not on page. [DERIVED-blocked]
- Season/heat: mid-Oct on the Costa Brava coast — warm sun exposure possible, coastal humidity; more heat risk than the inland races in this batch. [DERIVED]

**Editorial**
- UNIQUE: a coastal trail themed on the area's megalithic monuments — sea + prehistory. [INFER]
- COOL: Tossa de Mar setting, 09:00 mass start, La Sansi's polished timing/logistics. [SCRAPE]
- CATCH: coastal October sun with no shade on exposed sections; D+ unpublished so grade is unknown. [DERIVED]
- WHO: runners wanting a scenic seaside race + a short 5/10 option for families. [INFER]
- REFERENCE: a Costa Brava coastal trail — flatter and warmer than the batch's mountain races.

**Honesty**: fetched page is the 2025 edition — confirm 2026 date/start hold. D+ missing.

---

## Vertikalm
url: http://www.geca.cat/vertikalm/ · Sant Privat d'en Bas · 2026-10-18

**Structured attributes**
- Distance/D+: <5 km, +989 m (525 m Sant Privat → 1,514 m Puigsacalm summit). Vertical kilometer. [SCRAPE]
- Night race: No. [INFER]
- Start time: [UNKNOWN]
- Course topology: point-to-point ascent (village → summit) via Camí dels Matxos / Grau de les Eugues. [SCRAPE]
- Setting/character: alpine · forest (oak/beech/box) · ridgeline finish (Puigsacalm, Vall d'en Bas). [SCRAPE]
- Championship/circuit: 16a Copa Catalana de Curses Verticals (FEEC vertical cup). [SCRAPE] → FEEC-license/day-license gate almost certain [INFER].
- Cutoffs: [UNKNOWN]
- Aid/self-sufficiency: [UNKNOWN]
- Start logistics/parking: start "Plaça" of Sant Privat, 525 m. Parking [UNKNOWN]. [SCRAPE]
- Tradition: 11th VertiKalm; held annually 3rd Sunday of October. [SCRAPE]
- Post-race food: [UNKNOWN]
- Kids race: No. [SCRAPE]
- Technicality: steep scrambling on upper Grau de les Eugues channel [SCRAPE], LOW confidence but genuinely steep.
- Charity: proceeds to Fundació A. Bosch (pediatric research). [SCRAPE]

**Derived**
- km-esforç: ~5 + 9.89 ≈ 15 on <5 km → brutal gradient (~20%+ average). [DERIVED]
- Season/heat: mid-Oct, summit 1,514 m — cool to cold up top, exposure at the ridge. [DERIVED]

**Editorial**
- UNIQUE: a true KV — ~989 m up in under 5 km, straight to Puigsacalm. [SCRAPE]
- COOL: Copa Catalana Vertical points + a summit-ridge payoff, for charity. [SCRAPE]
- CATCH: relentless climb, steep channel scramble near the top, no runnable relief; a Copa Catalana licence gate likely. [DERIVED]
- WHO: uphill specialists and VK racers. Not for anyone wanting a rolling trail or a long day. [INFER]
- REFERENCE: harder than its "under 5 km" reads — one of the steeper VKs on the Catalan calendar.

**Honesty**: no conflict. Confirm FEEC licence requirement and start time before publishing.

---

## Trail No Limits
url: https://sites.google.com/view/trailnolimitsponts · Ponts · 2026-10-18

⚠ site partly machine-readable — Google Sites JS nav; only shell text returned. Fix-list: open the "Recorreguts" / "Presentació" sub-pages manually for distances, D+, start time.

**Structured attributes (thin)**
- Circuit: scoring race for the "Lliga de La Noguera" mountain-running league. [SCRAPE] → FEEC/day-licence gate likely via the Lliga [INFER].
- Organizer: Runners No Limits. Registration opens Aug 1. [SCRAPE]
- Distances / D+ / start time / cutoffs / aid / parking / food / kids: [UNKNOWN] (behind JS sub-pages).

**Derived**
- Setting: Ponts (La Noguera, pre-Pyrenean) → forest · low mountain, dry terrain. [INFER]
- Season/heat: mid-Oct inland Lleida — mild days, cool mornings. [DERIVED]

**Editorial**
- UNIQUE: a Lliga de La Noguera counter — series runners will target it for points. [SCRAPE]
- COOL: [INFER] local pre-Pyrenean terrain around Ponts.
- CATCH: [DERIVED] course data locked behind a JS Google Site — plan blind until sub-pages are pulled.
- WHO: La Noguera league regulars. [INFER]
- REFERENCE: [UNKNOWN] — insufficient course data.

**Honesty**: distances and D+ not recovered; treat as a stub pending manual sub-page scrape.

---

## Marató del Boumort
url: http://atleticsantafe.cat/maratoboumort/ · Organyà · 2026-10-24

⚠ site not machine-readable — TLS error ("unable to verify the first certificate") on both http and https; server cert chain is broken. Fix-list: fetch via a browser once, or ask organizer to fix the cert; try atleticsantafe.cat root or a cached copy.

**What the basics imply** [INFER]
- Name = marathon (~42 km) through the Reserva Nacional de Caça del Boumort, Alt Urgell, near Organyà.
- Setting: alpine · national-park/reserve · ridgeline — Boumort is a high wildlife reserve (red deer, vultures), remote and rugged.
- Expect big D+ for a 42 km mountain marathon (plausibly 2,000–2,800 m+), tight cutoffs, and point-to-point or big-loop logistics. [DERIVED from name+geography]
- CATCH [DERIVED]: remote high reserve, likely long cutoffs and self-sufficiency; late-Oct at altitude → cold, possible early snow, real exposure.
- Everything specific (D+, start, cutoffs, aid, cup policy, FEEC gate, food, kids) [UNKNOWN] until the site is reachable.

---

## Trepitja Garrotxa
url: https://trepitjagarrotxa.cat/ · Oix · 2026-10-24 (event 24–25 Oct)

**Structured attributes**
- Distances: Ultra 59 km, Marató 42 km, Mitja 24 km, Cursa 9 km. [SCRAPE]
- D+: [UNKNOWN] on page.
- Night race: [UNKNOWN] — 2-day event (24–25 Oct), ultra may start early/pre-dawn. [INFER]
- Start time: [UNKNOWN]
- Course topology: [UNKNOWN] — mountain loops from Oix [INFER].
- Setting/character: volcanic · forest · Garrotxa natural park (Alta Garrotxa around Oix). [INFER/SCRAPE]
- Championship/circuit: ITRA member event; regs also on feec.cat → FEEC/day-licence gate likely. [SCRAPE/INFER]
- Cutoffs: [UNKNOWN]
- Aid/self-sufficiency: [UNKNOWN]
- Start logistics/parking: Oix (small village) — parking likely tight. [INFER]
- Tradition: XII edició (12th). Organized by Centre Excursionista d'Olot. [SCRAPE]
- Post-race food: [UNKNOWN]
- Kids race: [UNKNOWN] — 9 km is the entry distance. [SCRAPE]
- Technicality: [UNKNOWN]; "més que una trail", charity to Fundació Albert Bosch. [SCRAPE]

**Derived**
- km-esforç: [UNKNOWN] — D+ not published on page. [DERIVED-blocked]
- Season/heat: late-Oct, Alta Garrotxa mid-mountain — cool, damp, possible fog; forest cover. [DERIVED]

**Editorial**
- UNIQUE: a four-distance Alta Garrotxa festival topped by a 59 km ultra, ITRA-listed, from tiny Oix. [SCRAPE]
- COOL: deep-forest volcanic Garrotxa terrain, well-run by CE Olot, charity ethos. [SCRAPE]
- CATCH: 59 km ultra in remote terrain with unpublished D+/cutoffs; Oix parking and late-Oct damp add friction. [DERIVED]
- WHO: ultra and marathon trail runners wanting a scenic NE-Catalonia mountain day; 9/24 for others. [INFER]
- REFERENCE: an Alta Garrotxa ultra — greener and damper than the Pyrenean high routes, long on the 59.

**Honesty**: D+ missing → km-esforç uncomputable. Confirm which distances run which day and any night start.

---

## La Dragonera Trail
url: https://linktr.ee/cursadeldrac · Sant Fost de Campsentelles · 2026-10-24

**Structured attributes**
- Distances: 22 km and 13 km (GPX for both). [SCRAPE]
- D+: [UNKNOWN].
- Night race: [UNKNOWN].
- Start time: [UNKNOWN].
- Course topology: [UNKNOWN] — loop in the Serralada de Marina [INFER].
- Setting/character: forest · low coastal range (Serralada Litoral, near Barcelona). [INFER]
- Championship/circuit: [UNKNOWN]. Registration via 9hsports.cat; regs doc on Google Drive. [SCRAPE]
- Cutoffs: [UNKNOWN]
- Aid/self-sufficiency: [UNKNOWN]
- Start logistics/parking: "Salida carrera (no parking)" — no parking at the start. [SCRAPE]
- Tradition: [UNKNOWN] edition count. IG @la_dragonera_trail. [SCRAPE]
- Post-race food: [UNKNOWN]
- Kids race: [UNKNOWN]
- Technicality: [UNKNOWN]

**Derived**
- km-esforç: [UNKNOWN] — D+ not published. [DERIVED-blocked]
- Season/heat: late-Oct, low range near BCN — mild, some sun exposure on ridge sections. [DERIVED]

**Editorial**
- UNIQUE: a close-to-Barcelona forest trail (Sant Fost / Serralada de Marina) with a 22 + 13 pairing. [INFER]
- COOL: metro-accessible mountain running — easy for BCN-based runners. [INFER]
- CATCH: explicit "no parking" at the start → arrive by transit or park off-site and walk; D+ unpublished. [SCRAPE/DERIVED]
- WHO: Barcelona-area runners wanting a local half-distance trail without travel. [INFER]
- REFERENCE: a Serralada Litoral trail — accessible, moderate, city-adjacent.

**Honesty**: only distances + no-parking recovered from linktr.ee; D+, date confirmation, start time all pending the reg doc.

---

## Congost Trail Challenge — Vertical (Vertical del Tagamanent, nocturna)
url: https://congosttrailchallenge.cat/ · Aiguafreda · 2026-10-24

**Structured attributes**
- Distance/D+: Vertical del Tagamanent = 5.2 km / +630 m. [SCRAPE]
- Night race: YES — nocturna. [SCRAPE]
- Start time: Saturday 19:00h. [SCRAPE]
- Course topology: vertical (climb format), toward Tagamanent. [SCRAPE]
- Setting/character: forest · ridgeline (Tagamanent, Cingles de Bertí / Congost del Congost, Osona). [INFER/SCRAPE]
- Championship/circuit: [UNKNOWN] — own 2-day "3 curses · 2 dies · 1 repte" challenge, not a stated FEEC cup. [SCRAPE]
- Cutoffs: [UNKNOWN]
- Aid/self-sufficiency: "un o més avituallaments sòlids i líquids"; "no hi haurà vasos d'un sol ús" → bring-your-own reusable cup. [SCRAPE]
- Start logistics/parking: Aiguafreda; La Llobeta lodging €34 w/ breakfast, camper parking available. "places molt limitades perquè l'accés al parc natural té restriccions". [SCRAPE]
- Tradition: [UNKNOWN] edition count. [SCRAPE-absent]
- Post-race food: [UNKNOWN]
- Kids race: [UNKNOWN]
- Technicality: [UNKNOWN] — steep vertical at night [DERIVED].
- Context: part of C3C Challenge (Llarg ~45 km/+2,740 m €66; Curt ~27 km/+1,440 m €56; Duo). VdT is the required leg for the Challenge. [SCRAPE]

**Derived**
- km-esforç (vertical): 5.2 + 6.3 ≈ 11.5 → steep. [DERIVED]
- Season/heat: late-Oct night start, ~600 m gain to ridge — cold at the top, headtorch + layers essential. [DERIVED]

**Editorial**
- UNIQUE: a Saturday-night vertical up Tagamanent that doubles as the linchpin leg of a 2-day stage challenge. [SCRAPE]
- COOL: 19:00 headtorch climb, park-restricted small field, reusable-cup zero-waste ethos. [SCRAPE]
- CATCH: night + steep + cold summit; mandatory reusable cup; entries capped by natural-park access limits, so it sells out. [DERIVED/SCRAPE]
- WHO: vertical/night-race fans and stage-challenge hunters. Not for first-timers wary of a dark steep climb. [INFER]
- REFERENCE: a nocturnal Tagamanent VK — like a Copa Catalana vertical but run in the dark, as leg 1 of a weekend.

**Honesty**: no conflict. Cutoffs, edition count, food, kids' race unstated; VdT figures are the standalone-race numbers.

---

_Batch note: 8 of 10 yielded usable extracted data. Cursa Parc dels Talls (Instagram-only) and Marató del Boumort (broken TLS cert) are stubs. Several fetched pages omit D+ (Corriols, Megalítica, Trepitja, Dragonera) so km-esforç is blocked there — pull GPX/Wikiloc to complete. Megalítica page was the 2025 edition; confirm 2026._
