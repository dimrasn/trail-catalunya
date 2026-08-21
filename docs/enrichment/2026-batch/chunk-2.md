# 2026 Batch — Enrichment Chunk 2

Taste profiles for 10 races. Basics (distance/D+/price/date) come from the DB; this layer is the character the calendar doesn't carry. Source tags: [scraped] = stated on the official page (with quote); [derived] = computed, no scrape; [editorial] = grounded inference; "unknown" where the page is silent.

Fetched 2026-08-21.

---

## Transenyera
url: https://www.lesguineus.cat/ · Castellvell i el Vilar · 2026-09-11

⚠ **Site not fully machine-readable** — homepage is a JS/Wix nav shell; only edition links ("TRANSENYERA 2025", "TRANSENYERA 2024") render, no route/logistics detail. Sub-page slugs (`/transenyera`, `/transenyera-2025`, `/transenyera-1`) all 404 to the fetcher.

- **Organizer:** Club Les Guineus (Castellvell/Reus area). [scraped — nav]
- Everything else: **unknown** from the page.

**DERIVED**
- Date + geography: mid-September, Baix Camp (low Tarragona hinterland, ~200–500m). Heat exposure moderate-to-high for a late-summer morning; hydration matters more than altitude here. [derived]

**EDITORIAL**
- Can't ground UNIQUE/COOL/CATCH without route data. [unknown]

**Fix-list:** organizer publishes on Wix — try the current-year event sub-page directly, or the registration platform (likely dsport / 9hSports), or the club's social. DB basics should carry the load until then.

---

## Cursa de muntanya Vila de Falset
url: http://www.cursadefalset.net/ (→ https://www.cursadefalset.com/) · Falset · 2026-09-11

**STRUCTURED**
- **Two courses.** 13 km / **513 m D+** (real 12.7 km, start 08:30) and 26 km / **1109 m D+** (real 26.2 km, start 08:00). [scraped: "13 km (12,7 km reals)… 513 m"; "26 km (26,2 km reals)… 1109 m"]
- **Start:** Pavelló Poliesportiu, Falset. [scraped: "08.00H – PAVELLÓ POLIESPORTIU"]
- **Night race:** no. [derived — morning starts]
- **Topology:** loop from town (start/finish at the pavilion). [editorial — town-based, summits out-and-back within loop]
- **Setting:** Priorat wine country — forest + rocky ridge. Summits Punta de les Soleies (545m, 13k) and Miranda de Llaberia (26k). Tags: vineyard·forest·ridgeline. [scraped: hermitage of Sant Gregori; "Miranda de Llaberia… vistes espectaculars"]
- **Cutoffs (talls horaris):** timing control at Coll del Guix (26k). [scraped — "control"]; explicit clock times unknown.
- **Aid:** 13k = 4 liquid / 3 solid; 26k = 7 liquid / 5 solid. [scraped]; cup-vs-bottle policy unknown.
- **Championship/FEEC:** not stated. [scraped — absent]
- **Tradition:** **19th edition** (2026). [scraped — "19a-cursa…2026"]
- **Post-race food / kids race:** unknown.
- **Technicality:** genuinely technical descents — page itself says so. [scraped: "força tècnica"; "intensa baixada força tècnica"; rampes 24–25%]

**DERIVED**
- km-esforç: 13k ≈ **18.1**; 26k ≈ **37.1**.
- Priorat, mid-Sept morning: hot, exposed on the ridge sections. [derived]

**EDITORIAL**
- UNIQUE: a Priorat wine-town classic where the organizer admits the descents are technical (rare honesty). [editorial]
- COOL: Miranda de Llaberia panorama and the "two km of pure fun" Maçanes track. [scraped]
- CATCH: 1109 m over 26 km with 24–25% ramps and technical trialera descents — harder on the legs than its distance suggests; loose rock in late-summer dryness. [derived]
- WHO: runners who like technical descending and don't need a championship stamp. Not for road-to-trail beginners on the 26k. [editorial]
- REFERENCE: like a compact Priorat version of a Montsant race — modest numbers, technical bite. [editorial]

---

## La 6.6 de Bellaterra
url: https://la6punt6debellaterra.cat/ · Bellaterra · 2026-09-11

**STRUCTURED**
- **Distance:** 6.6 km trail through local forest; D+ **unknown**. [scraped: "boscos locals"]
- **Night race:** no.
- **Topology:** loop (village forest circuit). [editorial]
- **Setting:** peri-urban forest, Bellaterra (Vallès). Tags: forest. [scraped]
- **Format:** trail + Nordic walking + family race; chip-timed trail. [scraped: "Classificació oficial amb dorsal i xip"]
- **Championship/FEEC:** not mentioned. [scraped — absent]
- **Tradition:** **3rd edition**. [scraped]
- **Kids race:** yes, by age bands. [scraped: "Curses infantils adaptades segons les diferents franges d'edat"]
- **Post-race food:** Diada community breakfast — "Llesca de pa amb botifarra" (vegan option). [scraped] Finisher gift.
- **Logistics:** toilets, coat-check, medical, parking. [scraped: "LAVABOS, GUARDA-ROBA, SERVEIS MÈDICS, APARCAMENT"]
- **Technicality:** unknown (short forest course → low). [editorial]

**DERIVED**
- km-esforç: not computable (D+ unknown); as a 6.6 km forest run, effort is low. [derived]

**EDITORIAL**
- UNIQUE: a Diada (Sept-11) neighbourhood run tied to the community breakfast — event more than race. [editorial]
- COOL: family-inclusive, botifarra finish, chip-timed for the competitive. [scraped]
- CATCH: barely a "catch" — short, low, accessible. Parking in Bellaterra is tight. [editorial]
- WHO: families, first-timers, locals. Not for anyone chasing D+ or a circuit result. [editorial]
- REFERENCE: a village fun-run with a timing chip, not a mountain race. [editorial]

---

## Cross L'Ametlla de Merola
url: http://cross.ametllademerola.cat/ · L'Ametlla de Merola · 2026-09-13

⚠ **Site not machine-readable** — TLS certificate mismatch (host not in cert altnames: `*.servidoresdns.net`). Fetch fails on both http and https. No data extractable.

**DERIVED (from basics + geography)**
- L'Ametlla de Merola is a colònia tèxtil on the Llobregat near Puig-reig (Berguedà, ~400m). A "cross" here = short cross-country/trail around the mill village and riverside woods. [derived]
- Mid-September, low altitude → warm, low-alpine; heat over altitude. [derived]

**Fix-list:** cert is misconfigured on the shared host — try fetching by IP with Host header, or the Ajuntament de Puig-reig / colònia's Facebook event, or the timing platform. Likely a small, tradition-heavy village cross with a festa-major feel.

---

## Vilaplana 030 Extrem
url: https://www.vilaplana030.cat/ · Vilaplana · 2026-09-13

**STRUCTURED**
- **Distance / D+:** 30 km, **2000 m D+**. [scraped: "30 KM… DESNIVELL: 2000 M"]
- **Start:** 07:30 from Vilaplana. [scraped: "SORTIDA VILAPLANA: 7:30 H"]
- **Night race:** no (dawn start). [derived]
- **Cutoff:** overall time limit **7 h**. [scraped: "TEMPS LÍMIT: 7 H"]
- **Aid:** 3 stations + finish. [scraped: "AVITUALLAMENTS: 3 + META"]
- **Setting:** Serra de la Mussara / Prades massif above Vilaplana (Baix Camp). Tags: forest·ridgeline. [editorial — geography]
- **Championship/circuit:** carries **UTMB Index + ITRA** rating; not stated as Copa Catalana. FEEC license not required explicitly (Club d'Excursionisme Vilaplana, FEEC support). [scraped]
- **Tradition:** **3rd edition**. [scraped]
- **Post-race food:** finish meal included. [scraped: "FINAL AMB DINAR"]
- **Kids race:** yes — 1 km & 2.5 km, ages 6–14, on Sept 12 (day before). [scraped]
- **Topology:** mountain loop from Vilaplana. [editorial]
- **Technicality:** unknown; name "Extrem" + 2000 m implies rocky Prades terrain. [editorial]

**DERIVED**
- km-esforç: 30 + 2000/100 = **50.0**. [derived]
- 7 h limit on a 50-point course = ~7.1 pts/h — a firm, not brutal, cutoff, but "Extrem" earns its name. [derived]
- Mid-Sept, 07:30 start caps heat exposure on the climb; ridge exposure later. [derived]

**EDITORIAL**
- UNIQUE: a compact "extreme" 30k with a real 2000 m punch and UTMB/ITRA points on the Prades massif. [editorial]
- COOL: dawn start, finish meal, ITRA index for point-chasers. [scraped]
- CATCH: 2000 m in 30 km (66 m/km) plus a 7 h wall — steep and unforgiving for the pace; only 3 aid stations means longer carries. [derived]
- WHO: fit hill runners collecting ITRA points. Not for first-timers or slow walkers. [editorial]
- REFERENCE: harder than "30 km" sounds — climbs like a 45k. [editorial]

---

## Cursa del Castell de Montesquiu
url: https://www.cursadelcastell.com/ · Montesquiu · 2026-09-13

**STRUCTURED**
- **Formats:** "Cursa Coll dels Tres Pals" (long), "Cursa Solana" (short), children's races, adapted race, walking option. [scraped] Distances / D+ **not on the fetched page** (inscripcions/recorreguts 404'd).
- **Setting:** Parc Natural del Castell de Montesquiu — forest + castle/historic. Tags: forest·national-park·monastery/historic. [scraped: "espai protegit del Parc Natural del castell de Montesquiu"]
- **Tradition:** **37th edition**; "second-oldest mountain race in Catalonia, since 1988"; "la clàssica del trail català". [scraped]
- **Night race:** no. [derived]
- **Championship/FEEC, cutoffs, aid, start time, food, technicality:** unknown from page.
- **Registration:** via 9h Sports. [scraped]

**DERIVED**
- km-esforç: not computable (D+/distance not published on fetched page). [derived]
- Osona, ~600m, mid-Sept: mild-to-warm forest running, low heat risk. [derived]

**EDITORIAL**
- UNIQUE: pedigree — one of the oldest mountain races in Catalonia (since 1988), run inside a natural park around a medieval castle. [scraped]
- COOL: heritage + castle setting + full inclusive ladder (adapted race, kids, walk). [scraped]
- CATCH: can't quantify — but a 37-year "clàssica" tends to have honest, old-school terrain. [editorial]
- WHO: runners who value tradition and a scenic park course. [editorial]
- REFERENCE: the Catalan equivalent of a long-running heritage fell race. [editorial]
- **Fix-list:** pull distances/D+ from the 9hSports registration page.

---

## CabróRun
url: https://dsport.cat/ca/fitxa_cursa.php?id_cursa=1186 · Cabrianes · 2026-09-18

**STRUCTURED**
- **Three distances:** 12 km / **300 m D+**, 6 km / **150 m D+**, Mini CabróRun 350 m / 10 m D+. [scraped: "12,200m… 300m"; "5,850m… 150m"; "350m… 10m"]
- **Setting:** Cabrianes (village near Sallent, Bages, ~250m, Llobregat plain). Tags: forest·agricultural-plain. [editorial]
- **Night race:** likely — Sept-18 (Thu/eve) "CabróRun" village runs of this type are usually evening; **not confirmed on page**. Start time unknown. [editorial — flag]
- **FEEC gate:** federat/no-federat pricing (12k: 16€/19€; 6k: 13€/16€) — day-license surcharge for non-federated. [scraped]
- **Min age:** 8 yrs (6k & 12k); 3 yrs (Mini). [scraped]
- **Capacity:** 200 per distance, 100 Mini. [scraped]
- **Kids race:** Mini CabróRun, free. [scraped]
- **Topology / cutoffs / aid / food / technicality:** unknown.

**DERIVED**
- km-esforç: 12k = **15.0**; 6k = **7.5**. Flat, fast, low-effort. [derived]
- Bages plain, mid-Sept: warm; if evening start, cooler and pleasant. [derived]

**EDITORIAL**
- UNIQUE: a small, cheap village trail-fest with a federation-discounted entry and a free kids' race. [editorial]
- COOL: low barrier, three distances, community feel. [editorial]
- CATCH: minimal climb — this is a fast run, not a mountain challenge; grippy only if wet. [derived]
- WHO: locals, families, beginners, federated runners chasing cheap entries. Not for D+ hunters. [editorial]
- REFERENCE: a Bages village fun-trail. [editorial]

---

## Olla de Núria vertical
url: https://olladenuria.cat/ · Vall de Núria · 2026-09-19

**STRUCTURED**
- **Distance / D+:** 3.78 km, **949 m D+** — a true vertical km-plus. [scraped: "Distància: 3,78km… 949m de desnivell positiu"]
- **Route:** Santuari de Núria (1960m) → **Puigmal summit (2909m)**. Point-to-point, uphill-only. [scraped]
- **Start:** 10:30 from the Núria sanctuary esplanade. [scraped: "10:30h des de l'esplanada del Santuari de Núria"]
- **Cutoff:** summit close **12:30**. [scraped: "Hora de tancament: 12:30h"]
- **Setting:** high alpine, above 2000m to a 2900m peak. Tags: alpine·high-mountain·national-park·monastery/historic. [scraped]
- **Night race:** no.
- **Tradition:** vertical born **2016**; parent Olla de Núria since **2007**. [scraped]
- **Logistics:** access to Vall de Núria is by **rack railway (cremallera)** — no road; start/finish at sanctuary. [editorial — known geography]
- **Capacity:** 150; fee €27. [scraped]
- **Aid / cups / FEEC gate / food / kids:** unknown from page.
- **Technicality:** high-alpine summit push to 2909m; upper section rocky/exposed. [editorial]

**DERIVED**
- km-esforç: 3.78 + 949/100 = **13.3** — but as a pure vertical, gradient (~25% avg) is the real metric. [derived]
- Puigmal at 2909m in mid-Sept: cold/wind/altitude exposure at the top even on a warm valley day. [derived]

**EDITORIAL**
- UNIQUE: a vertical that finishes on the Puigmal summit (2909m) and can only be reached by the Núria rack railway — logistics are half the adventure. [scraped + editorial]
- COOL: 949 m straight up to one of the Pyrenees' iconic frontier peaks; short enough to redline the whole way. [scraped]
- CATCH: altitude + summit weather + a hard 12:30 cutoff on a lung-busting 25% grade; getting to the start requires the cremallera timetable. [derived]
- WHO: strong climbers and VK specialists. Not for anyone who dislikes uphill-only or high altitude. [editorial]
- REFERENCE: like a classic ISF vertical km but with 900+ m and a real 2900m alpine summit. [editorial]

---

## Taga 2040 EVO
url: https://taga2040.com/ · Sant Joan de les Abadesses · 2026-09-19

**STRUCTURED**
- **Three courses:** Taga 2040 = 28 km / **2000 m D+** (773→2040 m); Can Camps = 15 km / **900 m D+**; Coll d'Art = 9 km / **500 m D+**. [scraped]
- **Setting:** Serra Cavallera, summit **Taga (2040m)**, Ripollès. Tags: alpine·ridgeline·summit. [scraped: "La cursa de Serra Cavallera"]
- **Championship/circuit:** **Copa Catalana de curses per muntanya (FEEC)**. [scraped: "Copa Catalana de curses per muntanya"] → FEEC license or day-license gate implied. [editorial]
- **Tradition:** **27th edition** (2026) — a long-standing classic. [scraped]
- **Kids race:** "Taga Kids" 20/09, non-competitive. [scraped]
- **Night race:** no.
- **Topology:** point-to-point / big loop over the Taga ridge from Sant Joan/Ogassa. [editorial]
- **Start time / cutoffs / aid / food / technicality:** unknown from page.

**DERIVED**
- km-esforç: 28k = **48.0**; 15k = **24.0**; 9k = **14.0**. [derived]
- Summit 2040m, mid-Sept: alpine exposure up top, warm on the lower forest — classic big-mountain day. [derived]

**EDITORIAL**
- UNIQUE: a 27-edition Copa Catalana classic topping out on the Taga (2040m) — "the original essence of mountain racing" in its own words. [scraped]
- COOL: real summit, Copa Catalana points, three distances so any level can enter. [scraped]
- CATCH: 2000 m over 28 km with a 2040m summit — serious climbing and ridge exposure; Copa Catalana field means a fast front. [derived]
- WHO: Copa Catalana regulars and fit mountain runners (28k); newcomers can drop to 9/15k. Not a beginner's 28k. [editorial]
- REFERENCE: a Ripollès Copa-Catalana staple — harder than 28 km reads. [editorial]

---

## Rialp Matxicots
url: https://www.turisrialp.cat/matxicots/ (→ https://www.matxicots.cat/) · Rialp · 2026-09-19

**STRUCTURED**
- **Three courses:** Trail 60k / **~4700 m D+**; Mitja+ 30k / **2200 m D+**; Popular 15k / **>1000 m D+**. [scraped: "quasi 4.700 m"; "2.200 m positius"; "més de 1.000 m. positius"]
- **Setting:** Pallars Sobirà — Vall d'Àssua, Orri massif; peripheral zones of **Aigüestortes NP and Alt Pirineu NP**; peaks Altars, Montsent de Pallars, Montorroio. Tags: alpine·ridgeline·national-park·forest. [scraped]
- **Tradition:** **16th edition**; event ~9 years old (kids' Matxixics 13th). [scraped]
- **Kids race:** Rialp Matxixics, ages 3–16, 1–6 km. [scraped]
- **Night race:** 60k with 4700 m almost certainly starts pre-dawn / runs into night for back-markers; **not stated**. [editorial — flag]
- **Championship / FEEC / cutoffs / aid / food / start time / technicality:** unknown from page.

**DERIVED**
- km-esforç: 60k = **107.0**; 30k = **52.0**; 15k = **25.0**. [derived]
- High Pyrenees, ~1000→2900m terrain, mid-Sept: real alpine exposure, cold/weather risk up high, long day on the 60k. [derived]

**EDITORIAL**
- UNIQUE: "la mítica i dura" Pyrenean ultra linking the emblematic peaks of southern Pallars Sobirà — one of Catalonia's genuinely hard 60k/4700m days. [scraped]
- COOL: national-park high country, three tiers from family 15k to brutal 60k, deep Pyrenean village atmosphere. [scraped]
- CATCH: 4700 m D+ (78 m/km) at altitude with weather exposure — the 60k is a mountaineering effort, not a run; even the 30k packs 2200 m. [derived]
- WHO: experienced mountain ultra-runners (60k); the 15k is the family-friendly on-ramp. Not for flatland runners on the long courses. [editorial]
- REFERENCE: a southern-Pallars cousin of the big Pyrenean ultras — the 60k punches like a mini-Cavalls del Vent. [editorial]

---

## Data / honesty notes
- **Falset:** DB should carry two courses (13k/513m, 26k/1109m). Page confirms both; no elevation conflict found.
- **Vilaplana 030:** page markets UTMB Index + ITRA, not Copa Catalana — don't tag it Copa Catalana.
- **Olla vertical vs classic:** the 3.78 km / 949 m figures are the *vertical*, not the Clàssica/Mitja Olla — keep them separate in the DB.
- **Transenyera & Ametlla de Merola:** not enriched (JS-only Wix shell; TLS cert mismatch). Stubs + fix-lists above.
- **CabróRun & Rialp 60k night status:** inferred, flagged — confirm start times before publishing "night race".
