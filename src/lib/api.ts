import type {
  NewReportInput,
  NewReviewInput,
  Park,
  ParkMetrics,
  Report,
  TrafficPoint,
  Trail,
  TrailFeature,
  TrailReview,
} from "../types";

const BASE = "/api";

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} — ${path}`);
  return res.json() as Promise<T>;
}

export const api = {
  getPark: () => req<Park[]>("/parks").then((p) => p[0]),
  getTrails: () => req<Trail[]>("/trails"),
  getTrail: (id: string) => req<Trail>(`/trails/${id}`),
  getFeatures: (trailId?: string) =>
    req<TrailFeature[]>(`/features${trailId ? `?trailId=${trailId}` : ""}`),
  getReports: (status?: string) =>
    req<Report[]>(`/reports${status ? `?status=${status}` : ""}`),
  createReport: (input: NewReportInput) =>
    req<Report>("/reports", { method: "POST", body: JSON.stringify(input) }),
  updateReport: (id: string, patch: Partial<Pick<Report, "status" | "rangerNote">>) =>
    req<Report>(`/reports/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  upvoteReport: (id: string) => req<Report>(`/reports/${id}/upvote`, { method: "POST" }),
  getTraffic: () => req<TrafficPoint[]>("/traffic"),
  getReviews: (trailId?: string) =>
    req<TrailReview[]>(`/reviews${trailId ? `?trailId=${trailId}` : ""}`),
  createReview: (input: NewReviewInput) =>
    req<TrailReview>("/reviews", { method: "POST", body: JSON.stringify(input) }),
  updateTrail: (id: string, patch: Partial<Trail>) =>
    req<Trail>(`/trails/${id}`, { method: "PATCH", body: JSON.stringify(patch) }),
  getMetrics: () => req<ParkMetrics>("/metrics"),
};
