import type {
  NewReportInput,
  NewReviewInput,
  Park,
  ParkMetrics,
  Report,
  ReportCategory,
  ReportStatus,
  Severity,
  SurfaceType,
  Trail,
  TrailFeature,
  TrailReview,
  TrailStatus,
  TrafficPoint,
} from "../types";

import featuresJson from "../data/features.json";
import metaJson from "../data/meta.json";
import parksJson from "../data/parks.json";
import reportsJson from "../data/reports.json";
import reviewsJson from "../data/reviews.json";
import trafficJson from "../data/traffic.json";
import trailsJson from "../data/trails.json";

/**
 * Versioned browser-side store. Bumping DB_VERSION reseeds from the JSON
 * snapshot on the next load (and re-anchors relative timestamps).
 */
const DB_VERSION = 2;
const STORAGE_KEY = `pathfind:data:v${DB_VERSION}`;

/** Time the live snapshot was captured/seeded (see src/data/meta.json). */
const SNAPSHOT_AT = metaJson.snapshotAt;

const SURFACES: SurfaceType[] = [
  "paved",
  "crushed-stone",
  "packed-dirt",
  "boardwalk",
  "rocky",
];
const TRAIL_STATUSES: TrailStatus[] = ["open", "caution", "closed"];
const CATEGORIES: ReportCategory[] = [
  "hazard",
  "scenic",
  "wildlife",
  "accessibility",
];
const SEVERITIES: Severity[] = ["low", "medium", "high"];
const REPORT_STATUSES: ReportStatus[] = ["open", "in-progress", "resolved"];

const pad = (n: number) => String(n).padStart(2, "0");

function localDateKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function bucketLabel(d: Date, hour: number): string {
  return `${localDateKey(d)}T${pad(hour)}:00`;
}

function isOneOf<T extends string>(value: unknown, allowed: T[]): value is T {
  return typeof value === "string" && (allowed as string[]).includes(value);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

/** Calendar-day difference in the visitor's local timezone (DST-safe). */
function calendarDayDelta(from: Date, to: Date): number {
  const a = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const b = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((b - a) / 86_400_000);
}

function shiftIso(iso: string | null, deltaMs: number): string | null {
  if (iso === null) return null;
  const ms = new Date(iso).getTime();
  if (!Number.isFinite(ms)) return iso;
  return new Date(ms + deltaMs).toISOString();
}

function shiftBucket(bucket: string, dayDelta: number): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(bucket);
  if (!match) return bucket;
  const [, y, m, d, h] = match;
  const shifted = new Date(
    Number(y),
    Number(m) - 1,
    Number(d) + dayDelta,
    Number(h),
    0,
    0,
    0
  );
  return bucketLabel(shifted, Number(h));
}

type DbState = {
  version: number;
  seededAt: string;
  parks: Park[];
  trails: Trail[];
  features: TrailFeature[];
  reports: Report[];
  reviews: TrailReview[];
  traffic: TrafficPoint[];
};

function seedState(): DbState {
  const now = new Date();
  const snapshot = new Date(SNAPSHOT_AT);
  // Shift the snapshot forward so relative ages stay what the demo intends.
  const ageDeltaMs = now.getTime() - snapshot.getTime();

  const parks = parksJson as unknown as Park[];
  const trails = trailsJson as unknown as Trail[];
  const features = featuresJson as unknown as TrailFeature[];
  const trafficSnapshot = trafficJson as unknown as TrafficPoint[];

  // Traffic buckets are local calendar labels. Anchor on the newest bucket
  // date so "today" always has traffic regardless of the visitor's timezone.
  const lastBucketDate = trafficSnapshot.reduce<Date | null>((latest, point) => {
    const [datePart] = point.hourBucket.split("T");
    const [y, m, d] = datePart.split("-").map(Number);
    if (!y || !m || !d) return latest;
    const day = new Date(y, m - 1, d);
    return !latest || day > latest ? day : latest;
  }, null);
  const dayDelta = lastBucketDate ? calendarDayDelta(lastBucketDate, now) : 0;

  const traffic = trafficSnapshot.map((point) => ({
    ...point,
    hourBucket: shiftBucket(point.hourBucket, dayDelta),
  }));
  const reports = (reportsJson as unknown as Report[]).map((report) => ({
    ...report,
    createdAt: shiftIso(report.createdAt, ageDeltaMs) as string,
    resolvedAt: shiftIso(report.resolvedAt, ageDeltaMs),
  }));
  const reviews = (reviewsJson as unknown as TrailReview[]).map((review) => ({
    ...review,
    createdAt: shiftIso(review.createdAt, ageDeltaMs) as string,
  }));

  return {
    version: DB_VERSION,
    seededAt: now.toISOString(),
    parks,
    trails,
    features,
    reports,
    reviews,
    traffic,
  };
}

function readStorage(): DbState | null {
  try {
    if (typeof localStorage === "undefined") return null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<DbState> | null;
    if (
      !parsed ||
      parsed.version !== DB_VERSION ||
      !Array.isArray(parsed.parks) ||
      !Array.isArray(parsed.trails) ||
      !Array.isArray(parsed.features) ||
      !Array.isArray(parsed.reports) ||
      !Array.isArray(parsed.reviews) ||
      !Array.isArray(parsed.traffic)
    ) {
      return null;
    }
    return parsed as DbState;
  } catch {
    return null;
  }
}

function writeStorage(state: DbState): void {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage full or blocked — the in-memory state still works */
  }
}

let state: DbState | null = null;

function db(): DbState {
  if (state) return state;
  const stored = readStorage();
  if (stored) {
    state = stored;
    return state;
  }
  state = seedState();
  writeStorage(state);
  return state;
}

function persist(): void {
  if (state) writeStorage(state);
}

/* ------------------------------------------------------------------ */
/* Reads                                                              */
/* ------------------------------------------------------------------ */

export function getParks(): Park[] {
  return db().parks.map((park) => ({ ...park }));
}

export function getTrails(): Trail[] {
  return db()
    .trails.slice()
    .sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0))
    .map((trail) => ({ ...trail, geometry: trail.geometry.map((p) => [p[0], p[1]] as [number, number]) }));
}

export function getTrail(id: string): Trail {
  const trail = db().trails.find((row) => row.id === id);
  if (!trail) throw new Error(`404 — /trails/${id}`);
  return {
    ...trail,
    geometry: trail.geometry.map((p) => [p[0], p[1]] as [number, number]),
  };
}

export function getFeatures(trailId?: string): TrailFeature[] {
  const rows = trailId
    ? db().features.filter((feature) => feature.trailId === trailId)
    : db().features;
  return rows.map((feature) => ({ ...feature }));
}

function byCreatedAtDesc<T extends { createdAt: string }>(rows: T[]): T[] {
  return rows
    .slice()
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : 0));
}

export function getReports(status?: string): Report[] {
  if (status !== undefined && !isOneOf(status, REPORT_STATUSES)) {
    throw new Error("invalid status filter");
  }
  const rows = status
    ? db().reports.filter((report) => report.status === status)
    : db().reports;
  return byCreatedAtDesc(rows).map((report) => ({ ...report }));
}

export function getReviews(trailId?: string): TrailReview[] {
  const rows = trailId
    ? db().reviews.filter((review) => review.trailId === trailId)
    : db().reviews;
  return byCreatedAtDesc(rows).map((review) => ({ ...review }));
}

export function getTraffic(): TrafficPoint[] {
  return db()
    .traffic.slice()
    .sort((a, b) =>
      a.hourBucket < b.hourBucket
        ? -1
        : a.hourBucket > b.hourBucket
          ? 1
          : a.trailId < b.trailId
            ? -1
            : a.trailId > b.trailId
              ? 1
              : 0
    )
    .map((point) => ({ ...point }));
}

export function getMetrics(): ParkMetrics {
  const current = db();
  const now = new Date();
  const todayKey = localDateKey(now);

  const openHazards = current.reports.filter(
    (report) => report.category === "hazard" && report.status === "open"
  ).length;

  const weekAgoIso = new Date(now.getTime() - 7 * 86_400_000).toISOString();
  const resolvedThisWeek = current.reports.filter(
    (report) =>
      report.status === "resolved" &&
      report.resolvedAt !== null &&
      report.resolvedAt >= weekAgoIso
  ).length;

  const resolvedRows = current.reports.filter(
    (report) => report.status === "resolved" && report.resolvedAt !== null
  );
  let avgResponseHrs = 1.8;
  if (resolvedRows.length > 0) {
    const total = resolvedRows.reduce((sum, report) => {
      const ms =
        new Date(report.resolvedAt as string).getTime() -
        new Date(report.createdAt).getTime();
      return sum + (Number.isFinite(ms) && ms > 0 ? ms / 3_600_000 : 0);
    }, 0);
    avgResponseHrs = Math.round((total / resolvedRows.length) * 10) / 10;
  }

  const visitsToday = current.traffic
    .filter((point) => point.hourBucket.startsWith(todayKey))
    .reduce((sum, point) => sum + point.visitCount, 0);

  const accessibleTrailMi =
    Math.round(
      current.trails
        .filter((trail) => trail.wheelchairOk && trail.status !== "closed")
        .reduce((sum, trail) => sum + trail.distanceMi, 0) * 10
    ) / 10;

  const bucketHour = Math.floor(now.getHours() / 3) * 3;
  const bucketKey = `${todayKey}T${pad(bucketHour)}:00`;
  const currentVisits = current.traffic
    .filter((point) => point.hourBucket === bucketKey)
    .reduce((sum, point) => sum + point.visitCount, 0);

  let activeVisitors = Math.round(120 + currentVisits * 1.3);
  activeVisitors = Math.max(128, Math.min(420, activeVisitors));

  return {
    activeVisitors,
    openHazards,
    avgResponseHrs,
    resolvedThisWeek,
    visitsToday,
    accessibleTrailMi,
  };
}

/* ------------------------------------------------------------------ */
/* Mutations                                                          */
/* ------------------------------------------------------------------ */

function randomId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function createReport(input: NewReportInput): Report {
  const current = db();
  const { trailId, lat, lng, category, severity, note } = input;

  if (typeof trailId !== "string" || trailId.length === 0) {
    throw new Error("trailId is required");
  }
  if (!current.trails.some((trail) => trail.id === trailId)) {
    throw new Error("unknown trailId");
  }
  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) {
    throw new Error("lat must be a number between -90 and 90");
  }
  if (!isFiniteNumber(lng) || lng < -180 || lng > 180) {
    throw new Error("lng must be a number between -180 and 180");
  }
  if (!isOneOf(category, CATEGORIES)) {
    throw new Error("invalid category");
  }
  if (!isOneOf(severity, SEVERITIES)) {
    throw new Error("invalid severity");
  }
  if (typeof note !== "string" || note.trim().length === 0) {
    throw new Error("note is required");
  }

  const report: Report = {
    id: randomId("rep"),
    trailId,
    lat,
    lng,
    category,
    severity,
    note: note.trim(),
    photoUrl: null,
    status: "open",
    upvotes: 0,
    rangerNote: null,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
  };
  current.reports.push(report);
  persist();
  return { ...report };
}

export function updateReport(
  id: string,
  patch: Partial<Pick<Report, "status" | "rangerNote">>
): Report {
  const current = db();
  const report = current.reports.find((row) => row.id === id);
  if (!report) throw new Error(`404 — /reports/${id}`);

  if ("status" in patch) {
    if (!isOneOf(patch.status, REPORT_STATUSES)) {
      throw new Error("invalid status");
    }
    report.status = patch.status;
    if (patch.status === "resolved") {
      report.resolvedAt = new Date().toISOString();
    }
  }
  if ("rangerNote" in patch) {
    if (patch.rangerNote !== null && typeof patch.rangerNote !== "string") {
      throw new Error("invalid rangerNote");
    }
    report.rangerNote = patch.rangerNote;
  }
  persist();
  return { ...report };
}

export function upvoteReport(id: string): Report {
  const report = db().reports.find((row) => row.id === id);
  if (!report) throw new Error(`404 — /reports/${id}`);
  report.upvotes += 1;
  persist();
  return { ...report };
}

export function createReview(input: NewReviewInput): TrailReview {
  const current = db();
  const { trailId, author, rating, text } = input;

  if (typeof trailId !== "string" || trailId.trim().length === 0) {
    throw new Error("trailId is required");
  }
  if (!current.trails.some((trail) => trail.id === trailId)) {
    throw new Error("unknown trailId");
  }
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw new Error("rating must be an integer between 1 and 5");
  }
  if (typeof text !== "string" || text.trim().length === 0) {
    throw new Error("text is required");
  }

  const review: TrailReview = {
    id: randomId("rev"),
    trailId,
    author:
      typeof author === "string" && author.trim().length > 0
        ? author.trim()
        : "Anonymous",
    rating,
    text: text.trim(),
    photoUrl: null,
    source: "Visitor review",
    createdAt: new Date().toISOString(),
  };
  current.reviews.push(review);
  persist();
  return { ...review };
}

export function updateTrail(id: string, patch: Partial<Trail>): Trail {
  const current = db();
  const trail = current.trails.find((row) => row.id === id);
  if (!trail) throw new Error(`404 — /trails/${id}`);

  if ("status" in patch) {
    if (!isOneOf(patch.status, TRAIL_STATUSES)) throw new Error("invalid status");
    trail.status = patch.status;
  }
  if ("surface" in patch) {
    if (!isOneOf(patch.surface, SURFACES)) throw new Error("invalid surface");
    trail.surface = patch.surface;
  }
  if ("maxSlope" in patch) {
    if (!isFiniteNumber(patch.maxSlope) || patch.maxSlope < 0 || patch.maxSlope > 100) {
      throw new Error("invalid maxSlope");
    }
    trail.maxSlope = patch.maxSlope;
  }
  if ("widthIn" in patch) {
    if (!isFiniteNumber(patch.widthIn) || patch.widthIn <= 0 || patch.widthIn > 200) {
      throw new Error("invalid widthIn");
    }
    trail.widthIn = patch.widthIn;
  }
  for (const key of ["wheelchairOk", "bikeOk", "walkerOk"] as const) {
    if (key in patch) {
      if (typeof patch[key] !== "boolean") throw new Error(`invalid ${key}`);
      trail[key] = patch[key];
    }
  }
  persist();
  return {
    ...trail,
    geometry: trail.geometry.map((p) => [p[0], p[1]] as [number, number]),
  };
}

/** Exposed for diagnostics/tests; not used by the UI. */
export const localDb = {
  key: STORAGE_KEY,
  version: DB_VERSION,
  snapshotAt: SNAPSHOT_AT,
  reset() {
    state = null;
    try {
      if (typeof localStorage !== "undefined") localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
    return db();
  },
};
