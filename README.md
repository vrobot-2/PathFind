# PAthFind

Accessible trail routing, live geo-alerts and crowdsourced hazard reporting for Pennsylvania state parks.
Pilot region: **Marsh Creek State Park**, Chester County.

## Run it

```bash
bun install
bun run dev
```

- App: http://localhost:5173
- API: http://localhost:3001/api/health

The SQLite database (`server/pathfind.db`) is created and seeded on first boot.

```bash
bun run server/seed.ts --reset   # wipe + reseed demo data
```

## The 3-minute demo

1. **Homepage** (`/`) — pick **Wheelchair** in the hero selector. Watch the trail cards re-tag themselves (slope, surface, width).
2. **Map** (`/map`) — incompatible trails dim, accessible ones glow emerald. Hit **Start adaptive route** → *Find routes*. Note the score ring and the "why" lines.
3. **Trail detail** — click a trail. Surface / max slope / width verified panel + live conditions from visitor reports.
4. **Report** — camera button in the map toolbar → tap a spot on the map → drop a hazard with a photo. It appears in the feed instantly.
5. **Navigate** — start a route → the walk simulation runs, and geo-alert toasts fire as you pass curiosity points ("Look left — historic stone bridge, 20 ft").
6. **Manager** (`/admin`) — traffic heatmap, KPIs, live report feed. Then `/admin/reports` to triage a hazard to *resolved*.

## Stack

React 18 · Vite · TypeScript · Tailwind · Framer Motion · Leaflet · Recharts · Zustand · Bun + `bun:sqlite`.

## Structure

```
server/                     Bun.serve API + SQLite schema/seed
src/features/home/          Marketing homepage (hero, profiles, trail cards)
src/features/map/           Map workspace + app navbar
src/features/routing/       Adaptive routing panel + scoring
src/features/trails/        Trail detail sheet
src/features/reports/       Report modal + community feed
src/features/navigate/      Guided walk simulation + geo-alert toasts
src/features/admin/         Ranger dashboard + triage/trail management
src/features/info/          The idea / about page
src/components/ui/          Button, Badge, Card, GlassPanel, Sheet
src/store/                  Zustand app store
```
