export type MobilityProfile = "walker" | "biker" | "wheelchair";
export type SurfaceType = "paved" | "crushed-stone" | "packed-dirt" | "boardwalk" | "rocky";
export type Difficulty = "easy" | "moderate" | "hard";
export type TrailStatus = "open" | "caution" | "closed";
export type ReportCategory = "hazard" | "scenic" | "wildlife" | "accessibility";
export type ReportStatus = "open" | "in-progress" | "resolved";
export type Severity = "low" | "medium" | "high";
export type FeatureType = "scenic" | "historic" | "wildlife" | "water" | "photo";

/** [lat, lng] */
export type LatLng = [number, number];

export interface Trail {
  id: string;
  parkId: string;
  name: string;
  description: string;
  distanceMi: number;
  elevationFt: number;
  surface: SurfaceType;
  /** max sustained grade, percent */
  maxSlope: number;
  /** narrowest usable width, inches */
  widthIn: number;
  difficulty: Difficulty;
  walkerOk: boolean;
  bikeOk: boolean;
  wheelchairOk: boolean;
  status: TrailStatus;
  geometry: LatLng[];
  photoUrl: string;
  loop: boolean;
}

export interface TrailFeature {
  id: string;
  trailId: string;
  lat: number;
  lng: number;
  type: FeatureType;
  title: string;
  description: string;
  /** copy shown in the in-walk geo-alert toast */
  alertText: string;
}

export interface Report {
  id: string;
  trailId: string;
  lat: number;
  lng: number;
  category: ReportCategory;
  severity: Severity;
  note: string;
  photoUrl: string | null;
  status: ReportStatus;
  upvotes: number;
  rangerNote: string | null;
  createdAt: string;
  resolvedAt: string | null;
}

export interface TrafficPoint {
  trailId: string;
  lat: number;
  lng: number;
  hourBucket: string;
  visitCount: number;
}

export interface TrailReview {
  id: string;
  trailId: string;
  author: string;
  /** 1..5 whole stars */
  rating: number;
  text: string;
  photoUrl: string | null;
  /** attribution label, e.g. "Visitor photo" */
  source: string;
  createdAt: string;
}

export interface NewReviewInput {
  trailId: string;
  author: string;
  rating: number;
  text: string;
}

export interface Park {
  id: string;
  name: string;
  region: string;
  centerLat: number;
  centerLng: number;
  zoom: number;
  acreage: number;
}

export interface ParkMetrics {
  activeVisitors: number;
  openHazards: number;
  avgResponseHrs: number;
  resolvedThisWeek: number;
  visitsToday: number;
  accessibleTrailMi: number;
}

export interface RouteResult {
  trail: Trail;
  score: number;
  reasons: string[];
  warnings: string[];
}

export interface NewReportInput {
  trailId: string;
  lat: number;
  lng: number;
  category: ReportCategory;
  severity: Severity;
  note: string;
  photoDataUrl?: string | null;
}

export const PROFILE_LABEL: Record<MobilityProfile, string> = {
  walker: "Walker",
  biker: "Biker",
  wheelchair: "Wheelchair",
};

export const SURFACE_LABEL: Record<SurfaceType, string> = {
  paved: "Paved",
  "crushed-stone": "Crushed Stone",
  "packed-dirt": "Packed Dirt",
  boardwalk: "Boardwalk",
  rocky: "Rocky",
};
