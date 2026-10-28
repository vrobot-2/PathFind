import { create } from "zustand";
import type {
  MobilityProfile,
  NewReportInput,
  NewReviewInput,
  Report,
  RouteResult,
  Trail,
  TrailFeature,
  TrailReview,
} from "../types";
import { api } from "../lib/api";

type PinMode = "none" | "report";

interface AppState {
  /* ---------- profile ---------- */
  profile: MobilityProfile;
  setProfile: (p: MobilityProfile) => void;

  /* ---------- trails ---------- */
  trails: Trail[];
  trailsLoading: boolean;
  loadTrails: () => Promise<void>;

  /* ---------- selection ---------- */
  selectedTrailId: string | null;
  selectTrail: (id: string | null) => void;
  hoveredTrailId: string | null;
  hoverTrail: (id: string | null) => void;

  /* ---------- route ---------- */
  routeResults: RouteResult[];
  activeRoute: Trail | null;
  setRouteResults: (r: RouteResult[]) => void;
  startRoute: (t: Trail) => void;
  clearRoute: () => void;

  /* ---------- reports ---------- */
  reports: Report[];
  reportsLoading: boolean;
  loadReports: () => Promise<void>;
  submitReport: (input: NewReportInput) => Promise<void>;
  upvoteReport: (id: string) => Promise<void>;

  /* ---------- features (curiosity points) ---------- */
  features: TrailFeature[];
  loadFeatures: () => Promise<void>;

  /* ---------- reviews ---------- */
  reviews: TrailReview[];
  reviewsLoading: boolean;
  loadReviews: () => Promise<void>;
  addReview: (input: NewReviewInput) => Promise<void>;

  /* ---------- start-route flow ---------- */
  /** trail awaiting a travel-mode choice in the start dialog */
  pendingStart: Trail | null;
  requestStart: (t: Trail) => void;
  cancelStart: () => void;
  confirmStart: (mode: MobilityProfile) => void;

  /* ---------- map ui ---------- */
  pinMode: PinMode;
  setPinMode: (m: PinMode) => void;
  pendingPin: { lat: number; lng: number } | null;
  setPendingPin: (p: { lat: number; lng: number } | null) => void;
  showHeatmap: boolean;
  toggleHeatmap: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  profile: "walker",
  setProfile: (profile) => {
    set({ profile });
    // re-rank any existing route results for the new profile
    const { routeResults } = get();
    if (routeResults.length) {
      set({ routeResults: routeResults.slice().sort((a, b) => b.score - a.score) });
    }
  },

  trails: [],
  trailsLoading: false,
  loadTrails: async () => {
    set({ trailsLoading: true });
    try {
      const trails = await api.getTrails();
      set({ trails, trailsLoading: false });
    } catch {
      set({ trailsLoading: false });
    }
  },

  selectedTrailId: null,
  selectTrail: (selectedTrailId) => set({ selectedTrailId }),
  hoveredTrailId: null,
  hoverTrail: (hoveredTrailId) => set({ hoveredTrailId }),

  routeResults: [],
  activeRoute: null,
  setRouteResults: (routeResults) => set({ routeResults }),
  startRoute: (activeRoute) => set({ activeRoute, selectedTrailId: activeRoute.id }),
  clearRoute: () => set({ activeRoute: null, routeResults: [] }),

  reports: [],
  reportsLoading: false,
  loadReports: async () => {
    set({ reportsLoading: true });
    try {
      const reports = await api.getReports();
      set({ reports, reportsLoading: false });
    } catch {
      set({ reportsLoading: false });
    }
  },
  submitReport: async (input) => {
    const report = await api.createReport(input);
    set({ reports: [report, ...get().reports], pinMode: "none", pendingPin: null });
  },
  upvoteReport: async (id) => {
    const updated = await api.upvoteReport(id);
    set({ reports: get().reports.map((r) => (r.id === id ? updated : r)) });
  },

  features: [],
  loadFeatures: async () => {
    try {
      set({ features: await api.getFeatures() });
    } catch {
      /* api offline — features stay empty */
    }
  },

  reviews: [],
  reviewsLoading: false,
  loadReviews: async () => {
    set({ reviewsLoading: true });
    try {
      set({ reviews: await api.getReviews(), reviewsLoading: false });
    } catch {
      set({ reviewsLoading: false });
    }
  },
  addReview: async (input) => {
    const review = await api.createReview(input);
    set({ reviews: [review, ...get().reviews] });
  },

  pinMode: "none",
  setPinMode: (pinMode) => set({ pinMode, pendingPin: null }),

  pendingStart: null,
  requestStart: (trail) => set({ pendingStart: trail, selectedTrailId: trail.id }),
  cancelStart: () => set({ pendingStart: null }),
  confirmStart: (mode) => {
    const trail = get().pendingStart;
    set({ pendingStart: null, profile: mode });
    if (trail) get().startRoute(trail);
  },

  pendingPin: null,
  setPendingPin: (pendingPin) => set({ pendingPin }),
  showHeatmap: false,
  toggleHeatmap: () => set({ showHeatmap: !get().showHeatmap }),
}));
