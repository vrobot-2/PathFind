import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import type { TrafficPoint } from "../../types";

/** Relative busyness derived from summed visit counts across all trails. */
export type CrowdLevel = "quiet" | "steady" | "busy";
export type CrowdMap = Record<string, CrowdLevel>;

/**
 * Sums visits per trail, then splits trails into thirds by rank:
 * quietest third = quiet, middle third = steady, busiest third = busy.
 */
export function buildCrowdMap(points: TrafficPoint[]): CrowdMap {
  const totals = new Map<string, number>();

  for (const point of points) {
    if (!point.trailId || !Number.isFinite(point.visitCount)) continue;
    totals.set(point.trailId, (totals.get(point.trailId) ?? 0) + point.visitCount);
  }

  const ranked = [...totals.entries()].sort((a, b) => a[1] - b[1]);
  const count = ranked.length;
  if (count === 0) return {};

  const map: CrowdMap = {};
  ranked.forEach(([trailId], index) => {
    map[trailId] =
      index < count / 3 ? "quiet" : index < (count * 2) / 3 ? "steady" : "busy";
  });
  return map;
}

/* Module-level cache + in-flight guard: every mounted consumer shares one request. */
let cached: CrowdMap | null = null;
let pending: Promise<CrowdMap> | null = null;

function loadOnce(): Promise<CrowdMap> {
  if (!pending) {
    pending = api
      .getTraffic()
      .then((points) => buildCrowdMap(points))
      .catch(() => {
        // Leave the cache empty so a later mount can retry; consumers just hide chips.
        pending = null;
        return {} as CrowdMap;
      });
  }
  return pending;
}

/**
 * Fetch traffic once for the whole home page and expose a trailId → crowd map.
 * On failure the map stays empty and callers hide the chips.
 */
export function useTrafficCrowd(): CrowdMap {
  const [crowd, setCrowd] = useState<CrowdMap>(() => cached ?? {});

  useEffect(() => {
    if (cached) {
      setCrowd(cached);
      return;
    }

    let cancelled = false;
    void loadOnce().then((map) => {
      if (Object.keys(map).length > 0) cached = map;
      if (!cancelled) setCrowd(map);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return crowd;
}
