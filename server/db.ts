import { Database } from "bun:sqlite";
import { DB_PATH, SCHEMA_SQL } from "./schema";
import { seedIfEmpty } from "./seed";

export const db = new Database(DB_PATH, { create: true });

db.exec("PRAGMA journal_mode = WAL;");
db.exec("PRAGMA foreign_keys = ON;");
db.exec(SCHEMA_SQL);
seedIfEmpty(db);

type Row = Record<string, any>;

export type Park = {
  id: string;
  name: string;
  region: string;
  centerLat: number;
  centerLng: number;
  zoom: number;
  acreage: number;
};

export type Trail = {
  id: string;
  parkId: string;
  name: string;
  description: string;
  distanceMi: number;
  elevationFt: number;
  surface: string;
  maxSlope: number;
  widthIn: number;
  difficulty: string;
  walkerOk: boolean;
  bikeOk: boolean;
  wheelchairOk: boolean;
  status: string;
  geometry: [number, number][];
  photoUrl: string;
  loop: boolean;
};

export type TrailFeature = {
  id: string;
  trailId: string;
  lat: number;
  lng: number;
  type: string;
  title: string;
  description: string;
  alertText: string;
};

export type Report = {
  id: string;
  trailId: string;
  lat: number;
  lng: number;
  category: string;
  severity: string;
  note: string;
  photoUrl: string | null;
  status: string;
  upvotes: number;
  rangerNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

export type Review = {
  id: string;
  trailId: string;
  author: string;
  rating: number;
  text: string;
  photoUrl: string | null;
  source: string;
  createdAt: string;
};

export type TrafficPoint = {
  trailId: string;
  lat: number;
  lng: number;
  hourBucket: string;
  visitCount: number;
};

export type ParkMetrics = {
  activeVisitors: number;
  openHazards: number;
  avgResponseHrs: number;
  resolvedThisWeek: number;
  visitsToday: number;
  accessibleTrailMi: number;
};

const toBool = (value: unknown): boolean => value === 1 || value === true;

function parseGeometry(value: unknown): [number, number][] {
  if (typeof value !== "string") return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter(
        (p): p is [number, number] =>
          Array.isArray(p) &&
          p.length === 2 &&
          typeof p[0] === "number" &&
          typeof p[1] === "number"
      )
      .map((p) => [p[0], p[1]]);
  } catch {
    return [];
  }
}

export function mapPark(row: Row): Park {
  return {
    id: row.id,
    name: row.name,
    region: row.region,
    centerLat: row.center_lat,
    centerLng: row.center_lng,
    zoom: row.zoom,
    acreage: row.acreage,
  };
}

export function mapTrail(row: Row): Trail {
  return {
    id: row.id,
    parkId: row.park_id,
    name: row.name,
    description: row.description,
    distanceMi: row.distance_mi,
    elevationFt: row.elevation_ft,
    surface: row.surface,
    maxSlope: row.max_slope,
    widthIn: row.width_in,
    difficulty: row.difficulty,
    walkerOk: toBool(row.walker_ok),
    bikeOk: toBool(row.bike_ok),
    wheelchairOk: toBool(row.wheelchair_ok),
    status: row.status,
    geometry: parseGeometry(row.geometry),
    photoUrl: row.photo_url,
    loop: toBool(row.loop),
  };
}

export function mapFeature(row: Row): TrailFeature {
  return {
    id: row.id,
    trailId: row.trail_id,
    lat: row.lat,
    lng: row.lng,
    type: row.type,
    title: row.title,
    description: row.description,
    alertText: row.alert_text,
  };
}

export function mapReport(row: Row): Report {
  return {
    id: row.id,
    trailId: row.trail_id,
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    severity: row.severity,
    note: row.note,
    photoUrl: row.photo_url ?? null,
    status: row.status,
    upvotes: row.upvotes,
    rangerNote: row.ranger_note ?? null,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at ?? null,
  };
}

export function mapReview(row: Row): Review {
  return {
    id: row.id,
    trailId: row.trail_id,
    author: row.author,
    rating: row.rating,
    text: row.text,
    photoUrl: row.photo_url ?? null,
    source: row.source,
    createdAt: row.created_at,
  };
}

export function mapTraffic(row: Row): TrafficPoint {
  return {
    trailId: row.trail_id,
    lat: row.lat,
    lng: row.lng,
    hourBucket: row.hour_bucket,
    visitCount: row.visit_count,
  };
}
