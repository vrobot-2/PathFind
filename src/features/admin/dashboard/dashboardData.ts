import type { LatLng, Report, TrafficPoint, Trail } from "../../../types";

/** Aggregated heat sample: [lat, lng, weight 0..1] fed to leaflet.heat. */
export interface HeatPoint {
  lat: number;
  lng: number;
  weight: number;
}

/** ~50 m bucket size in degrees (used to de-duplicate nearby traffic samples). */
const BUCKET = 0.00045;

function bucketKey(lat: number, lng: number) {
  return `${Math.round(lat / BUCKET)}:${Math.round(lng / BUCKET)}`;
}

/** Total visits per trail id across every hour bucket present in the feed. */
export function visitsByTrail(traffic: TrafficPoint[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const point of traffic) {
    totals.set(point.trailId, (totals.get(point.trailId) ?? 0) + point.visitCount);
  }
  return totals;
}

/** Interpolate evenly spaced samples along a polyline (including endpoints). */
function sampleGeometry(geometry: LatLng[], perSegment = 3): LatLng[] {
  if (geometry.length === 0) return [];
  if (geometry.length === 1) return [geometry[0]];
  const out: LatLng[] = [];
  for (let i = 0; i < geometry.length - 1; i += 1) {
    const [aLat, aLng] = geometry[i];
    const [bLat, bLng] = geometry[i + 1];
    for (let s = 0; s < perSegment; s += 1) {
      const t = s / perSegment;
      out.push([aLat + (bLat - aLat) * t, aLng + (bLng - aLng) * t]);
    }
  }
  const last = geometry[geometry.length - 1];
  out.push(last);
  return out;
}

/**
 * Build a meaningful heat surface from trail-level traffic.
 *
 * Traffic rows only carry one representative coordinate per trail, so we:
 *  1. sum visits per trail,
 *  2. dedupe raw points into ~50 m buckets (summing visitCount),
 *  3. spread each trail's total along its geometry so the heat follows the
 *     path instead of collapsing to a single dot per trail.
 *
 * Weights are normalised to 0.1–1 for the heat gradient.
 */
export function buildHeatPoints(
  traffic: TrafficPoint[],
  trails: Trail[],
  accessibleOnly: boolean,
): HeatPoint[] {
  const visible = new Set(
    trails.filter((t) => !accessibleOnly || t.wheelchairOk).map((t) => t.id),
  );
  const totals = visitsByTrail(traffic);
  const points: HeatPoint[] = [];

  // 1. raw bucketed samples (the literal traffic coordinates)
  const buckets = new Map<string, { lat: number; lng: number; sum: number }>();
  for (const point of traffic) {
    if (!visible.has(point.trailId)) continue;
    const key = bucketKey(point.lat, point.lng);
    const current = buckets.get(key);
    if (current) current.sum += point.visitCount;
    else buckets.set(key, { lat: point.lat, lng: point.lng, sum: point.visitCount });
  }

  const maxTrail = Math.max(1, ...Array.from(totals.values()));

  // 2. path samples weighted by the trail's aggregate usage
  for (const trail of trails) {
    if (!visible.has(trail.id)) continue;
    const total = totals.get(trail.id) ?? 0;
    if (total <= 0) continue;
    const weight = Math.max(0.18, Math.sqrt(total / maxTrail));
    for (const [lat, lng] of sampleGeometry(trail.geometry, 2)) {
      // avoid double-stacking directly on top of a raw bucket
      if (buckets.has(bucketKey(lat, lng))) continue;
      points.push({ lat, lng, weight: 0.28 + weight * 0.4 });
    }
  }

  const bucketMax = Math.max(1, ...Array.from(buckets.values()).map((b) => b.sum));
  for (const bucket of buckets.values()) {
    points.push({
      lat: bucket.lat,
      lng: bucket.lng,
      weight: Math.max(0.2, Math.sqrt(bucket.sum / bucketMax) * 0.75),
    });
  }

  return points;
}

/** Top trails by summed visits, with ranks and derived bar percentages. */
export interface RankedTrail {
  trail: Trail;
  visits: number;
  rank: number;
  /** 0..1 relative to the most-visited trail */
  share: number;
}

export function rankTrails(traffic: TrafficPoint[], trails: Trail[]): RankedTrail[] {
  const totals = visitsByTrail(traffic);
  const rows = trails
    .map((trail) => ({ trail, visits: totals.get(trail.id) ?? 0 }))
    .sort((a, b) => b.visits - a.visits);
  const max = Math.max(1, ...rows.map((r) => r.visits));
  return rows.map((row, index) => ({
    ...row,
    rank: index + 1,
    share: row.visits / max,
  }));
}

export interface DailyVisits {
  /** e.g. "Thu 22" */
  label: string;
  visits: number;
}

/** Sum visits for the last 7 activity days present in the traffic feed. */
export function dailyVisits(traffic: TrafficPoint[]): DailyVisits[] {
  const byDay = new Map<string, number>();
  for (const point of traffic) {
    const day = point.hourBucket.slice(0, 10);
    byDay.set(day, (byDay.get(day) ?? 0) + point.visitCount);
  }
  return Array.from(byDay.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .slice(-7)
    .map(([day, visits]) => {
      const date = new Date(`${day}T12:00:00`);
      const label = Number.isNaN(date.getTime())
        ? day
        : date.toLocaleDateString("en-US", { weekday: "short" });
      return { label, visits };
    });
}

export interface CategorySlice {
  key: Report["category"];
  name: string;
  value: number;
  color: string;
}

const CATEGORY_META: Record<Report["category"], { name: string; color: string }> = {
  hazard: { name: "Hazard", color: "#e11d48" },
  accessibility: { name: "Accessibility", color: "#d97706" },
  scenic: { name: "Scenic", color: "#059669" },
  wildlife: { name: "Wildlife", color: "#4f46e5" },
};

/** Report counts by category, in a stable semantic order. */
export function categorySlices(reports: Report[]): CategorySlice[] {
  return (Object.keys(CATEGORY_META) as Report["category"][]).map((key) => ({
    key,
    ...CATEGORY_META[key],
    value: reports.filter((r) => r.category === key).length,
  }));
}
