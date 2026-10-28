import { useEffect, useState } from "react";
import { useAppStore } from "../../store/useAppStore";
import type { ParkMetrics } from "../../types";

/** DCNR figure for Marsh Creek State Park. */
export const PARK_ACRES = 1_784;
/** Pennsylvania state park system total. */
export const STATE_PARKS = 124;

/** Seeded pilot: 8 trails, 20.1 mi total, 2.2 mi step-free. */
export const TRAIL_COUNT = 8;
export const TRAIL_MI_TOTAL = 20.1;
export const STEP_FREE_MI = 2.2;
export const LAKESIDE_LOOP_MI = 1.6;

/** Last verified /api/metrics payload, used if the live fetch is slow or offline. */
export const SEED_METRICS: ParkMetrics = {
  activeVisitors: 420,
  openHazards: 9,
  avgResponseHrs: 1.8,
  resolvedThisWeek: 8,
  visitsToday: 1_016,
  accessibleTrailMi: 2.2,
};

export function useParkMetrics(): ParkMetrics {
  const [metrics, setMetrics] = useState<ParkMetrics>(SEED_METRICS);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/metrics")
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error("metrics unavailable"))))
      .then((data: Partial<ParkMetrics>) => {
        if (cancelled) return;
        setMetrics((prev) => ({
          activeVisitors: data.activeVisitors ?? prev.activeVisitors,
          openHazards: data.openHazards ?? prev.openHazards,
          avgResponseHrs: data.avgResponseHrs ?? prev.avgResponseHrs,
          resolvedThisWeek: data.resolvedThisWeek ?? prev.resolvedThisWeek,
          visitsToday: data.visitsToday ?? prev.visitsToday,
          accessibleTrailMi: data.accessibleTrailMi ?? prev.accessibleTrailMi,
        }));
      })
      .catch(() => {
        /* keep the seeded fallback */
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return metrics;
}

/** Live trail count once the store has loaded, seeded count before that. */
export function useTrailCount(): number {
  const trails = useAppStore((s) => s.trails);
  return trails.length || TRAIL_COUNT;
}
