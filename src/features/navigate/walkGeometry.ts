import { distanceMeters } from "../../lib/utils";
import type { LatLng } from "../../types";
import type { WalkPosition } from "./useWalkStore";

export interface WalkPath {
  points: WalkPosition[];
  /** Cumulative distance in meters at each vertex (same length as `points`). */
  cumulative: number[];
  /** Total polyline length in meters. */
  total: number;
}

export interface PathProjection {
  /** Distance along the path from the start, in meters. */
  along: number;
  /** Shortest distance from the target to the polyline, in meters. */
  distance: number;
}

const METERS_PER_DEG_LAT = (Math.PI / 180) * 6371000;

/** Pre-compute the cumulative-distance lookup for a [lat, lng] polyline. */
export function buildWalkPath(geometry: LatLng[]): WalkPath {
  const points = geometry.map(([lat, lng]) => ({ lat, lng }));
  const cumulative: number[] = points.length ? [0] : [];
  let total = 0;
  for (let i = 1; i < points.length; i++) {
    total += distanceMeters(points[i - 1], points[i]);
    cumulative.push(total);
  }
  return { points, cumulative, total };
}

/**
 * Interpolate a position at progress `t` (0..1) along the polyline.
 * Linear interpolation between the two vertices that bracket `t * total`.
 *
 * @example const pos = interpolatePosition(path, 0.42)
 */
export function interpolatePosition(path: WalkPath, t: number): WalkPosition {
  const { points, cumulative, total } = path;
  if (points.length === 0) return { lat: 0, lng: 0 };
  if (points.length === 1 || total === 0) return { ...points[0] };

  const target = Math.min(1, Math.max(0, t)) * total;

  // binary search for the first vertex at/after the target distance
  let lo = 0;
  let hi = points.length - 1;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (cumulative[mid] < target) lo = mid + 1;
    else hi = mid;
  }

  const i = Math.max(1, lo);
  const segStart = cumulative[i - 1];
  const segEnd = cumulative[i];
  const segLen = segEnd - segStart;
  const f = segLen > 0 ? (target - segStart) / segLen : 0;
  const a = points[i - 1];
  const b = points[i];
  return { lat: a.lat + (b.lat - a.lat) * f, lng: a.lng + (b.lng - a.lng) * f };
}

/**
 * Project a point onto the polyline. Returns how far along the path the
 * closest point lies plus the perpendicular distance to the path.
 * Used for "upcoming highlights" and feature filtering.
 */
export function projectOntoPath(path: WalkPath, target: WalkPosition): PathProjection {
  const { points, cumulative } = path;
  if (points.length === 0) return { along: 0, distance: Number.POSITIVE_INFINITY };

  const origin = points[0];
  const mPerDegLng = METERS_PER_DEG_LAT * Math.cos((origin.lat * Math.PI) / 180);
  const tx = (target.lng - origin.lng) * mPerDegLng;
  const ty = (target.lat - origin.lat) * METERS_PER_DEG_LAT;

  let bestDistance = Number.POSITIVE_INFINITY;
  let bestAlong = 0;

  if (points.length === 1) return { along: 0, distance: Math.hypot(tx, ty) };

  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const ax = (a.lng - origin.lng) * mPerDegLng;
    const ay = (a.lat - origin.lat) * METERS_PER_DEG_LAT;
    const bx = (b.lng - origin.lng) * mPerDegLng;
    const by = (b.lat - origin.lat) * METERS_PER_DEG_LAT;

    const dx = bx - ax;
    const dy = by - ay;
    const lenSq = dx * dx + dy * dy;
    const raw = lenSq > 0 ? ((tx - ax) * dx + (ty - ay) * dy) / lenSq : 0;
    const f = Math.min(1, Math.max(0, raw));
    const px = ax + dx * f;
    const py = ay + dy * f;
    const d = Math.hypot(tx - px, ty - py);

    if (d < bestDistance) {
      bestDistance = d;
      const segLen = cumulative[i] - cumulative[i - 1];
      bestAlong = cumulative[i - 1] + segLen * f;
    }
  }

  return { along: bestAlong, distance: bestDistance };
}
