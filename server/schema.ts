import { join } from "node:path";

export const DB_PATH = join(import.meta.dir, "pathfind.db");

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS parks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  region TEXT NOT NULL,
  center_lat REAL NOT NULL,
  center_lng REAL NOT NULL,
  zoom INTEGER NOT NULL,
  acreage INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS trails (
  id TEXT PRIMARY KEY,
  park_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  distance_mi REAL NOT NULL,
  elevation_ft INTEGER NOT NULL,
  surface TEXT NOT NULL,
  max_slope REAL NOT NULL,
  width_in INTEGER NOT NULL,
  difficulty TEXT NOT NULL,
  walker_ok INTEGER NOT NULL,
  bike_ok INTEGER NOT NULL,
  wheelchair_ok INTEGER NOT NULL,
  status TEXT NOT NULL,
  geometry TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  loop INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS features (
  id TEXT PRIMARY KEY,
  trail_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  alert_text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reports (
  id TEXT PRIMARY KEY,
  trail_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  category TEXT NOT NULL,
  severity TEXT NOT NULL,
  note TEXT NOT NULL,
  photo_url TEXT,
  status TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  ranger_note TEXT,
  created_at TEXT NOT NULL,
  resolved_at TEXT
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  trail_id TEXT NOT NULL,
  author TEXT NOT NULL,
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  photo_url TEXT,
  source TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS traffic (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  trail_id TEXT NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  hour_bucket TEXT NOT NULL,
  visit_count INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_trails_park ON trails(park_id);
CREATE INDEX IF NOT EXISTS idx_features_trail ON features(trail_id);
CREATE INDEX IF NOT EXISTS idx_reports_trail ON reports(trail_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reviews_trail ON reviews(trail_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at);
CREATE INDEX IF NOT EXISTS idx_traffic_trail ON traffic(trail_id);
CREATE INDEX IF NOT EXISTS idx_traffic_bucket ON traffic(hour_bucket);
`;

export const DROP_SQL = `
DROP TABLE IF EXISTS reviews;
DROP TABLE IF EXISTS traffic;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS features;
DROP TABLE IF EXISTS trails;
DROP TABLE IF EXISTS parks;
`;
