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
import * as localDb from "./localDb";

/**
 * Frontend-only API adapter. The same surface the UI has always used, backed by
 * the versioned browser store instead of the Bun server. Every method stays
 * async so call sites do not need to change.
 */
export const api = {
  getPark: async (): Promise<Park> => {
    const park = localDb.getParks()[0];
    if (!park) throw new Error("no park data available");
    return park;
  },
  getTrails: async (): Promise<Trail[]> => localDb.getTrails(),
  getTrail: async (id: string): Promise<Trail> => localDb.getTrail(id),
  getFeatures: async (trailId?: string): Promise<TrailFeature[]> =>
    localDb.getFeatures(trailId),
  getReports: async (status?: string): Promise<Report[]> =>
    localDb.getReports(status),
  createReport: async (input: NewReportInput): Promise<Report> =>
    localDb.createReport(input),
  updateReport: async (
    id: string,
    patch: Partial<Pick<Report, "status" | "rangerNote">>
  ): Promise<Report> => localDb.updateReport(id, patch),
  upvoteReport: async (id: string): Promise<Report> => localDb.upvoteReport(id),
  getTraffic: async (): Promise<TrafficPoint[]> => localDb.getTraffic(),
  getReviews: async (trailId?: string): Promise<TrailReview[]> =>
    localDb.getReviews(trailId),
  createReview: async (input: NewReviewInput): Promise<TrailReview> =>
    localDb.createReview(input),
  updateTrail: async (id: string, patch: Partial<Trail>): Promise<Trail> =>
    localDb.updateTrail(id, patch),
  getMetrics: async (): Promise<ParkMetrics> => localDb.getMetrics(),
};
