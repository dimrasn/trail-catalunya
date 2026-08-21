# 2026 Batch — Enrichment Chunk 1

Taste profiles for 10 races (2026-08-29 → 2026-09-06). Basics (distance/D+/price/date) live in the DB; this layer is the character no calendar carries.
Source tags: **[SCRAPE]** page states it · **[DERIVED]** computed · **[EDITORIAL]** grounded inference. "unknown" = page silent.
Enriched by: enrichment agent, 2026-08-21.

---

## Cursa de Muntanya Capafonts
url: http://www.cursacapafonts.com/ · town: Capafonts · date: 2026-08-29

⚠ **Site not machine-readable — fix-list.** Domain fails TLS handshake (`TLSV1_ALERT_INTERNAL_ERROR`) on both `http://` and `https://cursacapafonts.com/`. No data extractable.

- **What the basics imply [DERIVED]:** Capafonts sits in the **Muntanyes de Prades** (Baix Camp, Tarragona) — mid-altitude sandstone/pine massif, not high alpine. Late-August date = **high heat exposure**, one of the hottest slots on the calendar; expect an early start and real dehydration risk regardless of modest D+.
- **Setting tags [EDITORIAL/inference]:** forest · historic (Prades range). Likely a small local FEEC-style mountain race with botifarrada finish — typical for this town/date, but **unconfirmed**.
- **Fix-list:** retry via browser/Instagram; check FEEC Copa Catalana calendar and inscripcions.cat mirror for distances, D+, start time, circuit.

---

## Cursa Campi qui Pugui (del Papiolet)
url: https://www.athleticevents.net/cursa/20a-cursa-popular-campi-qui-pugui-del-papiolet-497 · town: El Papiolet (St. Jaume dels Domenys) · date: 2026-09-02

⚠ **Site not machine-readable for this race — fix-list.** The athleticevents.net page is JS-rendered; the fetch resolves to a **different event's** content (a "3a Marxa Altafulla – Costa Tàrraco"), not Campi qui Pugui. No reliable race-specific data could be extracted. Do not trust any Altafulla figures for this race.

- **What the name/basics imply [DERIVED/EDITORIAL]:** "20a" = **20th edition** — a long-running, established *cursa popular*, so well-organised and low-drama. "Campi qui Pugui" (roughly "every man for himself") is a traditional popular-race name; Papiolet/St. Jaume dels Domenys is **Baix Penedès vineyard/low-hills country**, not mountain. Likely short (≈km-scale road-and-track popular race), **low technicality**, family-friendly.
- **Season/heat [DERIVED]:** early Sept, coastal-inland Penedès → warm; a midday or evening start would matter — unconfirmed.
- **Fix-list:** re-scrape via headless browser (athleticevents needs JS), or find the club/ajuntament page for distances, start time, kids race.

---

## Vallhonesta X-Trail
url: https://ceaccastellet.wordpress.com/ · town: Sant Vicenç de Castellet · date: 2026-09-04

⚠ **Site not machine-readable — fix-list.** WordPress host returns **HTTP 403 Forbidden** to the fetcher (bot-blocked), both at root and `/vallhonesta-x-trail/`. No data extractable.

- **What the basics imply [DERIVED]:** Sant Vicenç de Castellet is at the foot of **Montserrat** (Bages) on the Llobregat — expect Montserrat-massif conglomerate terrain, forest and river. A Friday (2026-09-04) date is unusual → **likely an evening/night edition** (the "X-Trail" branding + weekday slot both point that way, but **unconfirmed**).
- **Setting tags [EDITORIAL/inference]:** forest · historic (Montserrat backdrop) · possible night race.
- **Fix-list:** the club is CEAC Castellet — retry the WordPress page from a real browser/UA, or check their Instagram/FEEC listing for distances, D+, start time, night status.

---

## Burriac Atac
url: http://burriacatac.cat/ · town: Vilassar de Mar · date: 2026-09-05

- **Night race:** **Yes [SCRAPE]** — "cursa trail nocturna de muntanya"; start **21:00** from Vilassar de Mar town square, finish-line cutoff **01:00**.
- **Start time of day [SCRAPE]:** 21:00 (night).
- **Course topology:** **Point-to-point [SCRAPE]** — starts Vilassar de Mar plaça, finishes at **Cabrera beach** (platja de Cabrera). Note the plan-your-return logistics this implies.
- **Distances / D+ [SCRAPE]:** Long "21 km i +900 m"; Short "14,9 km i +650 m".
- **Setting tags [SCRAPE/EDITORIAL]:** coastal · forest · historic — Baix Maresme ridge crowned by **Burriac castle**; sea-start to beach-finish.
- **Championship / circuit:** unknown (no circuit named) [SCRAPE].
- **License gate [SCRAPE]:** ID required at bib pickup; "carnet federatiu si escau" (federation card *if applicable*) — no hard FEEC gate stated.
- **Cutoffs [SCRAPE]:** finish cutoff 01:00 (≈4 h for the long course); intermediate talls not listed on page.
- **Aid / cups [SCRAPE]:** "avituallaments líquids i sòlids"; cup policy not stated → assume **bring-your-own soft flask** for a night mountain race.
- **Tradition [SCRAPE]:** **21st edition** (2026) — a Maresme institution.
- **Post-race food [SCRAPE]:** finish ticket for entrepà (sandwich) + drink; no botifarrada named. Kids race: none mentioned.
- **Technicality:** unknown/"exigent (no extrema)" per organiser [SCRAPE] — undersold; night + Maresme singletrack raises effective difficulty.
- **km-esforç [DERIVED]:** long ≈ 21 + 900/100 = **30.0**; short ≈ 14.9 + 650/100 = **21.4**.
- **Season/heat [DERIVED]:** early-Sept night start → warm-mild, humidity off the sea; heat far less an issue than the day races here.
- **UNIQUE [EDITORIAL]:** a night point-to-point that literally ends on the sand at Cabrera beach, under Burriac castle.
- **COOL:** 21:00 headtorch mass start from a town square, sea breeze, 30 min of climbing into the dark.
- **CATCH [DERIVED]:** night navigation + point-to-point means you must sort transport back to the start; 01:00 cutoff is generous but the "no extrema" framing hides technical descents run in the dark.
- **WHO [EDITORIAL]:** for runners who like night races and coastal singletrack; not for first-timers uneasy on technical ground in a headtorch, or anyone without a return-transport plan.
- **REFERENCE POINT:** a Maresme night-trail classic — think a coastal "por la noche" race; harder than its 21 km looks once you add darkness.

---

## Vertical Prat
url: https://www.circuitfer.cat/vertical-prat · town: Fígols · date: 2026-09-05

- **Format:** **Vertical / uphill-only race** [SCRAPE] — "Vertical Prat".
- **Distance / D+ [SCRAPE]:** "Distància: 5,5 Km" · "Desnivell: +751m". (A near-VK: 751 m up in 5.5 km ≈ 13.6% average gradient.)
- **Start time [SCRAPE]:** 09:30 runners' start (08:00 dorsals; a "Paramuntanya" paragliding variant at 09:00; trophies 12:30). **Not a night race.**
- **Course topology [EDITORIAL/inference]:** point-to-point uphill (valley → summit) — standard for a vertical; page doesn't state it explicitly.
- **Edition [SCRAPE]:** **4th edition** (2026).
- **Setting tags [SCRAPE]:** alpine/pre-Pyrenean — "al cor del Prepirineu", "panorama espectacular 360º". Fígols is in the Berguedà, ex-mining high country.
- **Championship / circuit [SCRAPE]:** part of **Circuit FER** (the site itself).
- **License / cutoffs / aid / parking / food / kids:** unknown [SCRAPE] — page silent.
- **km-esforç [DERIVED]:** 5.5 + 751/100 = **13.0** — but this metric flatters verticals; the honest read is "5.5 km of nearly relentless climbing."
- **Season/heat [DERIVED]:** early Sept at altitude in the Prepirineu → mild; short duration limits heat exposure.
- **UNIQUE [EDITORIAL]:** a pure lung-buster — ~751 m of gain packed into 5.5 km, 360° pre-Pyrenean summit payoff, shared start area with paragliders.
- **COOL:** sub-13 km-esforç but one of the steepest efforts in the batch; over in ~1 h for fast runners.
- **CATCH [DERIVED]:** it's all climb — 13–14% average gradient means no recovery; wrong race for anyone who hates sustained steep ascents.
- **WHO:** for uphill specialists and VK fans; not for those who want runnable flat or a descent to enjoy.
- **REFERENCE POINT:** a vertical-kilometre in all but name — like a VK but 250 m short of the full 1000 m.

---

## Senglar Trail
url: https://senglartrail.blogspot.com/ · town: Cubells · date: 2026-09-05

- **Distances / D+ [SCRAPE]:** Long "Cursa Senglar Trail (18 km | 828m+)"; Short "Caminata i Cursa Curta (11 km | 425m+)".
- **Edition [SCRAPE]:** **6th edition**, Saturday 2026-09-05.
- **Setting / technicality [SCRAPE]:** forest · rocky — "corriols tècnics entre boscos d'alzina i pi", "terreny pedregós", "fortes pujades i descensos vertiginosos", summit 360° panorama at the **Boada** transmitter. Note: organiser here **does** state technical/rocky ground — unusually honest.
- **Championship / circuit [SCRAPE]:** "puntuable per a la **Lliga de la Noguera**".
- **Course topology [EDITORIAL/inference]:** loop from Cubells (out to Boada and back) — not explicitly stated.
- **Start time / license / cutoffs / aid-cups / parking / food / kids:** unknown [SCRAPE] — blogspot page thin.
- **km-esforç [DERIVED]:** long 18 + 828/100 = **26.3**; short 11 + 425/100 = **15.3**.
- **Season/heat [DERIVED]:** Cubells (Noguera, interior Lleida) early Sept → **hot, exposed interior** — heat is a real factor on the climbs.
- **UNIQUE [EDITORIAL]:** a small interior-Lleida trail that openly bills itself as technical and rocky (rare candour), with a transmitter-summit panorama.
- **COOL:** Lliga de la Noguera points, oak-and-pine singletrack, steep vertiginous descents.
- **CATCH [DERIVED]:** rocky technical descents + interior heat; the 18 km races harder than the number suggests.
- **WHO:** for runners who like technical, stony trails and don't mind heat; not for road-trail runners wanting smooth track.
- **REFERENCE POINT:** harder than its 18 km looks — a technical interior race, like a rockier Montsec-fringe course.

---

## Marató Valls de Cardós
url: https://xtsportevents.com/reglament-ca-marato-valls-de-cardos/ · town: Ribera de Cardós · date: 2026-09-05

- **Distances / D+ [SCRAPE]:** Marató **46 km / +3.100 m**; Mitja **23 km / ~+1.400 m**. (Serious mountain marathon.)
- **Start times [SCRAPE]:** Marató **06:30** (in darkness — "frontals... els primers 30′" required); Mitja **09:30**. Not a "night race" per se but a **pre-dawn start**.
- **Setting tags [SCRAPE]:** alpine · national-park — **Parc Natural de l'Alt Pirineu**, ridges, high lakes, peaks **>2.800 m**, forest pistes, Pyrenean villages.
- **Course topology [EDITORIAL/inference]:** high-mountain loop/lollipop from Ribera de Cardós — not explicitly stated.
- **Championship / license [SCRAPE]:** no circuit named; **FEEC license recommended, not mandatory** (federats pay less; non-federats allowed at higher fee, insurance implied).
- **Cutoffs [SCRAPE]:** **Refugi de la Pleta (km 19) 12:00**, and organiser warns "Serem MOLT RIGUROSOS" — they will pull under-prepared runners. Tight for mid-pack on a +3.100 m course.
- **Aid / cups [SCRAPE]:** 8 stations (marató) / 4 (mitja), liquid + solid; **mandatory personal cup/bottle** ("got o ampolla personal") → **cupless race, bring-your-own**.
- **Mandatory gear [SCRAPE]:** thermal blanket, whistle, pack, headlamp, 1 L+ water, 300 kcal food, windproof jacket w/ hood (marató). Full mountain kit.
- **Parking / base [SCRAPE]:** HQ at **Camping La Borda del Pubill**, Ribera de Cardós; partner lodgings with discounts; camper-friendly.
- **Post-race [SCRAPE]:** popular **pasta lunch** included + live concerts from 14:00. Kids race: none mentioned.
- **km-esforç [DERIVED]:** marató 46 + 3100/100 = **77.0** (the hardest number in this batch); mitja 23 + 1400/100 = **37.0**.
- **Season/heat [DERIVED]:** high Pyrenees early Sept — mild-to-cold up high (that's why the kit list), but the long low-valley sections midday can still cook; the pre-dawn start beats the heat and the cutoff.
- **UNIQUE [EDITORIAL]:** a genuine high-Pyrenean sky-marathon — +3.100 m, peaks over 2.800 m, Alt Pirineu park — with full mandatory-kit seriousness.
- **COOL:** headtorch 06:30 start into an alpine sunrise, high lakes and ridgelines, pasta-and-concerts finish.
- **CATCH [DERIVED]:** km-19 noon cutoff on a +3.100 m course is unforgiving and the organiser says so; big descent load, real weather exposure, full kit to carry.
- **WHO:** for experienced mountain-marathoners comfortable above 2.500 m with kit discipline; **not** for first ultras or anyone slow on climbs.
- **REFERENCE POINT:** like a mini-Pyrenees skyrace-marathon — think a smaller Olla/Pica-style day; much harder than "marathon" implies.
- **HONESTY FLAG:** Mitja D+ given as "~+1.400 m (approximate)" on page — treat as approximate.

---

## Pedraforca Xtrail
url: https://misports.cat/carreras/pedraforca-xtrail/ · town: Saldes · date: 2026-09-05

- **Distances / D+ [SCRAPE]:** Marató **42 km / +2.600 m**; Trail **26 km / +1.400 m**; Curta/caminada **10 km / +550 m**.
- **Start times [SCRAPE]:** 42 km **07:00**; 26 km **09:00**; 10 km **09:30**. Not a night race (early start only).
- **Setting tags [SCRAPE]:** alpine · national-park — **Parc Natural del Cadí-Moixeró**, over/around **el Pedraforca**, Comabona, Prats d'Aguiló, Pas dels Gosolans; base village **Saldes**.
- **Course topology [EDITORIAL/inference]:** big mountain loop from Saldes — not explicitly stated.
- **Championship / circuit [SCRAPE]:** **ITRA points** (42 km = 2, 26 km = 1); no Copa Catalana named.
- **License gate [SCRAPE]:** not explicitly FEEC-gated, but **insurance mandatory**.
- **Cutoffs [SCRAPE]:** 42 km has **7 checkpoint talls** (e.g. "Gresolet Km 6: 8:15h"), overall limit **8 h**; 26 km limit **5 h 30 min**. Genuinely tight early cutoff.
- **Aid [SCRAPE]:** multiple complete avituallaments (7 on the 42 km); cup policy not stated → assume BYO flask.
- **Parking / services [SCRAPE]:** "zona per pernoctar amb la furgoneta" (camper overnight), cloakroom.
- **Post-race food [SCRAPE]:** not mentioned. **Kids/family:** 10 km walk/run option; minors need a signed authorisation.
- **Edition [SCRAPE]:** not stated.
- **km-esforç [DERIVED]:** marató 42 + 2600/100 = **68.0**; trail 26 + 1400/100 = **40.0**; curta 10 + 550/100 = **15.5**.
- **Season/heat [DERIVED]:** Cadí high country early Sept — mild up high; long exposed sections under the Pedraforca can heat up midday, but 07:00 start helps.
- **UNIQUE [EDITORIAL]:** runs right under the **Pedraforca**, Catalonia's most iconic silhouette, deep inside Cadí-Moixeró — and hands out ITRA points.
- **COOL:** postcard massif scenery (Comabona, Pas dels Gosolans), camper-van basecamp culture at Saldes.
- **CATCH [DERIVED]:** the km-6 08:15 cutoff (≈70 min for the first 6 km on a +2.600 m course) is aggressive; 8-hour overall limit is firm; big descent load.
- **WHO:** for fit mountain runners chasing ITRA points and marquee scenery; not for slower starters (early cutoff will catch them) or road-trail beginners.
- **REFERENCE POINT:** a Cadí-Pedraforca sister to the Valls de Cardós marató — same day, slightly less D+, same "respect the cutoffs" character.

---

## Cursa de la Vinya i el Pàmpol
url: https://www.ajhortons.cat/temes/esport/la-29-ena-cursa-de-la-vinya-i-la-8ena-pampol-trail- · town: Sant Llorenç d'Hortons · date: 2026-09-06

- **Distances [SCRAPE]:** Cursa de la Vinya "**10 quilòmetres, aproximadament**"; Pàmpol Trail "**21 quilòmetres aproximadament**". **D+ not published** for either.
- **Editions [SCRAPE]:** **29th** Cursa de la Vinya + **8th** Pàmpol Trail — a very established vineyard-race pairing.
- **Start times [SCRAPE]:** Pàmpol 21 km **08:00**; Vinya 10 km **09:00**. Not a night race.
- **Setting tags [SCRAPE]:** **vineyard** — Alt Penedès wine country; 10 km "80% per camins"; 21 km "11% asfalt i 89% per vinya, pista i corriols", "Montserrat de fons".
- **Course topology [EDITORIAL/inference]:** loop through the vines from Sant Llorenç d'Hortons — not stated.
- **Championship / circuit [SCRAPE]:** both "puntua per a la **Lliga Trail Championchip**" (chip-timed league).
- **License / cutoffs / aid-cups / parking / food [SCRAPE]:** unknown. Walking option on the 10 km with **2 h 15 min** max. Online-only registration, cap 450, no day-of entry.
- **km-esforç [DERIVED]:** cannot compute — D+ not published. **Flag:** enrich D+ from GPX/Strava before publishing a difficulty index. Vineyard terrain implies modest, rolling gain.
- **Season/heat [DERIVED]:** Penedès plain, early Sept, low open vineyard = **high sun exposure and heat**, little shade; the 08:00 start on the 21 km is a heat-avoidance move.
- **UNIQUE [EDITORIAL]:** run the harvest-season vineyards of the Penedès with Montserrat on the horizon — a wine-country classic pushing 30 years.
- **COOL:** gentle, scenic, low-technicality; strong local/festa atmosphere; good "first trail" or social race.
- **CATCH [DERIVED]:** exposed vineyard with almost no shade + midday sun; the challenge is heat, not terrain.
- **WHO:** for beginners, road runners crossing to trail, and anyone wanting a runnable scenic 10/21; not for those chasing technical mountain terrain or big vert.
- **REFERENCE POINT:** like a vineyard *cursa popular* — closer to a runnable rolling road-trail than a mountain race; the 21 km is a soft trail-half.
- **HONESTY FLAG:** both distances are organiser "aproximadament"; D+ missing entirely.

---

## La Marrana Skyrace
url: https://cursalamarrana.com/ · town: Vallter · date: 2026-09-06

- **Distances / D+ [SCRAPE]:** 23 km (+1.800 m) · 11,3 km (+1.000 m) · 9,3 km (+800 m) · 7,5 km (+600 m) — four circuits.
- **Setting tags [SCRAPE]:** alpine · ridgeline · national-park — **Pic de Bastiments, Pic de la Dona, Gra de Fajol**; Vallter high cirque, Ripollès Pyrenees. A true **skyrace**.
- **Course topology [EDITORIAL/inference]:** high loop from Vallter ski area — not stated.
- **Championship / circuit [SCRAPE]:** **24a Copa Catalana** (Sènior + Júnior/Juvenil/Cadet categories) — FEEC skyrunning circuit.
- **License gate [SCRAPE]:** separate **federat (FEEC) / no-federat** pricing → day-license or FEEC license effectively required; standard Copa Catalana gate.
- **Cutoffs / start time / parking [SCRAPE]:** unknown — page silent.
- **Aid / cups [SCRAPE]:** "entrepà i beguda al final" + intermediate solid/liquid avituallaments; cup policy not stated → BYO flask (skyrace norm).
- **Route note / HONESTY [SCRAPE]:** distances/D+ were **modified** — "Degut a restriccions de la Reserva Natural de Mentet, està totalment prohibit disputar curses entre la Portella de Mentet i el Pic de la Dona." Confirm final course figures against the current edition; treat these numbers as the amended set.
- **Edition [SCRAPE]:** page shows 24a **Copa Catalana** (circuit edition), not the race's own edition count.
- **km-esforç [DERIVED]:** 23 km 23 + 1800/100 = **41.0**; 11,3 + 1000/100 = **21.3**; 9,3 + 800/100 = **17.3**; 7,5 + 600/100 = **13.5**.
- **Season/heat [DERIVED]:** high Ripollès Pyrenees (Bastiments ~2.880 m), early Sept — **cold/wind exposure up high** more than heat; alpine weather can turn.
- **UNIQUE [EDITORIAL]:** a Copa Catalana skyrace on the Bastiments–Gra de Fajol ridgeline above the Vallter cirque — big-mountain scenery at altitude.
- **COOL:** ridgeline running near 2.800 m, four distances so it scales from 7,5 km to a proper 23 km sky effort, strong FEEC race field.
- **CATCH [DERIVED]:** altitude + exposed ridgelines = weather and technical risk; +1.800 m in 23 km is steep; the natural-reserve restriction reshaped the course, so expect diversions.
- **WHO:** for skyrunners and Copa Catalana competitors comfortable on high exposed ground; not for beginners or anyone wary of altitude/technical ridges.
- **REFERENCE POINT:** a Ripollès sister to Vallter-based skyraces — like a compact Bastiments sky day; the 23 km bites harder than its distance via +1.800 m at altitude.

---

## Batch honesty summary
- **Un-fetchable (3):** Capafonts (TLS handshake failure), Vallhonesta X-Trail (HTTP 403 bot-block), Campi qui Pugui (JS-rendered athleticevents page — resolves to a different event's content). Stubs written; fix-lists included.
- **Missing D+:** Cursa de la Vinya i el Pàmpol (no elevation published — km-esforç not computable).
- **Amended course:** La Marrana Skyrace figures changed due to Mentet natural-reserve restriction — verify against current edition.
- **Approximate figures:** Vinya/Pàmpol distances are organiser "aproximadament"; Valls de Cardós mitja D+ "approximate".
- **Technicality** left "unknown" except where the organiser volunteered it (Senglar Trail: explicitly technical/rocky).
