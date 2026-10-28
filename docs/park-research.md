# Marsh Creek State Park — research notes

Real-park data gathered from the two official PA DCNR PDFs supplied by the user, cross-checked against DCNR's current park, hiking and accessibility pages. This replaces the invented "Lakeside Accessible Loop / Marsh Boardwalk" demo geography.

## 1. What the PDFs actually contain

Both PDFs are **vector documents with a real text layer** — not scanned images. `pypdf` extracted the complete text from every page, and each page reports zero embedded raster images because the map art is drawn as vector paths.

| File | Pages | Text layer | Notes |
|---|---|---|---|
| `MACR_ParkGuide.pdf` | 2 | Yes, complete | Page 1 = park guide (contact, directions, history, recreation); page 2 = park map + official trail descriptions. |
| `MACR_ParkMap.pdf` | 1 | Yes, complete | Standalone park map, rev. 1/14/21, with labels, legend, trail text and a GPS panel. |

Useful structural finding: the lake on `MACR_ParkMap.pdf` is a single filled vector path (fill RGB ≈ 0.556/0.846/0.972). Its outline was extracted and simplified to the 30-point polygon in `docs/poi.json`; the shape is therefore traced from the official map, not invented.

## 2. Documented park facts

- **Park**: Marsh Creek State Park, Chester County, north-central Chester County, ~2 miles west of Eagle off PA 100.
- **Address / phone**: 675 Park Road, Downingtown, PA 19335-1898 · 610-458-5119 (current DCNR page lists 580 Park Road).
- **Acreage**: guide and DCNR list **1,784 acres**; the app schema copy uses **1,730** as specified by the product brief. Flagged as a demo discrepancy.
- **Lake**: 535 acres, normal pool elevation 359.5 ft, maximum depth 80 ft at the dam.
- **Dam**: 90 ft high, 990 ft long, earth-and-rock fill; built May 1970–June 1973; gates closed 16 Nov 1973; normal pool 21 June 1974.
- **Drainage**: 20.4 sq mi; Marsh Creek, Black Horse Creek, Indian Run, Jerry Run; Brandywine / Delaware basin.
- **Boating**: electric motors only; two launches; ~240 seasonal mooring slips; boat rental at the East Launch; swimming prohibited in the lake.
- **Swimming**: ADA-accessible guarded pool + sprayground on the east side (not a lake beach — the old demo's "beach" was invented).
- **Camping**: none in the park; private campground on PA 282 within one mile.
- **Hiking total**: guide 18.4 mi; current DCNR page 19.5 mi (the difference is later trail additions such as Mansion Trails).
- **Hunting**: ~950 acres open in season; trails cross hunting areas — seasonal caution applies.
- **Wildlife**: 200+ bird species; osprey, bald eagle, migrating waterfowl; warm-season grass fields for grassland birds; artificial fish habitat including turtle basking platforms.

## 3. Official trails used (all names/blazes/distances from the PDFs and DCNR)

| Trail | Official distance | Rating | Route type | Blazes | Seeded surface / accessibility |
|---|---|---|---|---|---|
| White Trail | 4.0 mi | Easiest | Out-and-back | White | packed-dirt · not step-free |
| Blue Trail | 3.5 mi | More difficult | Loop | Blue | packed-dirt · not step-free |
| Green Trail | 1.0 mi | More difficult | Connector | Green | packed-dirt · not step-free |
| Lime Loop | 1.8 mi (guide 1.83) | More difficult | Loop | Lime | packed-dirt · not step-free |
| Mansion Trails | 0.9 mi | Easiest | Connector | White/blue | packed-dirt · not step-free |
| Park Road Trail | 0.6 mi | Easiest | Out-and-back | White/blue | **paved** · **wheelchairOk = true** (DCNR says paved and becoming ADA, ending at the ADA fishing pier) |
| Red Trail | 1.5 mi | More difficult | Loop | Red | packed-dirt · hiking only · not step-free |
| Yellow Trail | 6.2 mi (guide 6.07) | Most difficult | Out-and-back | Yellow | rocky · MTB recommended · not step-free |

Nearby but not seeded as a park trail: **Struble Trail**, a 2.6-mile local hiking/biking trail accessed from Dorlan Mill Road near the dam, leading toward Downingtown. It is mentioned in the guide but is not a Marsh Creek State Park trail.

Accessibility is deliberately **not** forced. Only Park Road Trail is marked wheelchair-accessible, matching DCNR's accessibility page. The real park has no fully paved lakeside loop; the old demo's "Lakeside Accessible Loop" and "Marsh Boardwalk Trail" do not exist.

## 4. Facilities mapped

20 facilities in `docs/poi.json`: park office; East and West launches; boat rental; swimming pool; sprayground; east and west picnic areas; playground; modern restrooms; shower house; snack bar; boat mooring; stable/equestrian concession; dam; ADA fishing pier; Dorlan Mill, Little Conestoga and horse-trailer parking; butterfly meadow.

The guide gives two official GPS anchors:

- East Launch: `40.06805, -75.71925`
- West Launch: `40.06485, -75.72956`
- DCNR park page: `40.07036, -75.71542`

The map's printed GPS panel also lists Park Office `40.06793, -75.71925` and West Launch `40.06732, -75.72004`; these are internally inconsistent with the map drawing and with the guide, so they were treated as a typographic error in the PDF.

## 5. Coordinates: documented vs estimated (important)

- **Documented**: trail names, distances, difficulty ratings, blazes, route types, surface character, history, dam dimensions, lake acreage, facility existence and relative placement. The lake **shape** is vector-traced from the official map.
- **Estimated for demo**: absolute lat/lng of every trail vertex, POI and facility. The product brief fixes the app frame at center `40.0745, -75.7779` with geometry confined to lat `40.045..40.105`, lng `-75.815..-75.735`. That frame sits roughly **4–5 km west** of the DCNR-published park office/lake coordinates (`-75.715` to `-75.730`). To honor the app's required frame, map-relative positions from the PDF were affine-mapped into the prescribed box. The result preserves the real lake topology, trail relationships and NNE–SSW branching, but the absolute coordinates are **not survey coordinates** and should not be used for navigation.
- All coordinates are rounded to 4 decimal places. Every trail vertex was checked to fall inside the required bbox and outside the lake polygon (except where a route legitimately touches the shore).

## 6. POIs and copy

19 POIs across `scenic`, `historic`, `wildlife`, `water`, `photo` — each with short interpretive copy and one-line `alertText` for guided-walk playback. Examples:

- "Look left — the 1971 dam spillway"
- "Heron rookery on the north arm — quiet please"
- "Historic stone foundations on your left — Milford Mills"
- "Accessible fishing pier ahead — level paved approach"

## 7. Seed design

`server/seed.ts` now seeds one park (`marsh-creek`), 8 real trails, 19 features, 30 reports and **448 traffic rows** (8 trails × 7 days × 8 three-hour buckets). Reports keep the 15 open (10 hazard + 5 scenic/wildlife/accessibility) / 6 in-progress / 9 resolved split. Traffic keeps the 9am/3pm peaks, with the highest bases on Park Road (ADA), White and Blue, and the lowest on Lime and Yellow.

## 8. Sources

1. `MACR_ParkGuide.pdf`, PA DCNR recreational guide, 2021 — pages 1–2.
2. `MACR_ParkMap.pdf`, PA DCNR park map, rev. 1/14/21 — page 1.
3. DCNR Hiking at Marsh Creek State Park: https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/marsh-creek-state-park/hiking
4. DCNR Accessibility at Marsh Creek State Park: https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/marsh-creek-state-park/accessibility
5. DCNR park overview: https://www.pa.gov/agencies/dcnr/recreation/where-to-go/state-parks/find-a-park/marsh-creek-state-park
6. Official map PDF: https://elibrary.dcnr.pa.gov/GetDocument?docId=1737493&DocName=MACR_ParkMap.pdf
