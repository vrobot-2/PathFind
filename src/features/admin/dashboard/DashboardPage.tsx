import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { api } from "../../../lib/api";
import { pageTransition } from "../../../motion/presets";
import type { ParkMetrics, Report, TrafficPoint, Trail, TrailStatus } from "../../../types";
import { DashboardHeader } from "./DashboardHeader";
import { KpiRow } from "./KpiRow";
import { UsageMapCard } from "./UsageMapCard";
import { TopTrailsCard } from "./TopTrailsCard";
import { LiveFeedCard } from "./LiveFeedCard";
import { TrailStatusCard } from "./TrailStatusCard";
import { DashboardError, DashboardSkeleton } from "./DashboardSkeleton";

const NEXT_STATUS: Record<TrailStatus, TrailStatus> = {
  open: "caution",
  caution: "closed",
  closed: "open",
};

const LIVE_INTERVAL_MS = 10_000;

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<ParkMetrics | null>(null);
  const [traffic, setTraffic] = useState<TrafficPoint[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [reports, setReports] = useState<Report[]>([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const [pendingTrails, setPendingTrails] = useState<string[]>([]);

  const alive = useRef(true);
  const hasLoaded = useRef(false);
  const actionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(
    () => () => {
      if (actionTimer.current) clearTimeout(actionTimer.current);
    },
    [],
  );

  const loadAll = useCallback(async (mode: "initial" | "refresh") => {
    if (mode === "initial") {
      setLoading(true);
      setError(null);
    } else {
      setRefreshing(true);
    }

    try {
      const [nextMetrics, nextTraffic, nextTrails, nextReports] = await Promise.all([
        api.getMetrics(),
        api.getTraffic(),
        api.getTrails(),
        api.getReports(),
      ]);
      if (!alive.current) return;
      hasLoaded.current = true;
      setMetrics(nextMetrics);
      setTraffic(nextTraffic);
      setTrails(nextTrails);
      setReports(nextReports);
      setLastUpdated(new Date());
      setError(null);
    } catch (err) {
      if (!alive.current) return;
      if (mode === "initial") {
        setError(err instanceof Error ? err.message : "Unable to reach the park API.");
      }
    } finally {
      if (alive.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadAll("initial");
  }, [loadAll]);

  /* Lightweight live tick: refresh the feed + headline metrics only. */
  useEffect(() => {
    const interval = window.setInterval(async () => {
      if (!hasLoaded.current) {
        // First load never succeeded — try the full payload again.
        void loadAll("refresh");
        return;
      }
      try {
        const [nextMetrics, nextReports] = await Promise.all([
          api.getMetrics(),
          api.getReports(),
        ]);
        if (!alive.current) return;
        setMetrics(nextMetrics);
        setReports(nextReports);
        setLastUpdated(new Date());
      } catch {
        /* Keep the last good snapshot; the next tick will try again. */
      }
    }, LIVE_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, []);

  const notifyActionError = useCallback((message: string) => {
    setActionError(message);
    if (actionTimer.current) clearTimeout(actionTimer.current);
    actionTimer.current = setTimeout(() => setActionError(null), 4200);
  }, []);

  const cycleTrailStatus = useCallback(
    async (trail: Trail) => {
      const next = NEXT_STATUS[trail.status];
      const previous = trail;

      setPendingTrails((ids) => [...ids, trail.id]);
      setTrails((rows) =>
        rows.map((row) => (row.id === trail.id ? { ...row, status: next } : row)),
      );

      try {
        const updated = await api.updateTrail(trail.id, { status: next });
        if (!alive.current) return;
        setTrails((rows) => rows.map((row) => (row.id === updated.id ? updated : row)));
        setLastUpdated(new Date());
      } catch {
        if (!alive.current) return;
        setTrails((rows) => rows.map((row) => (row.id === previous.id ? previous : row)));
        notifyActionError(`Couldn't update ${trail.name}. Reverted to ${previous.status}.`);
      } finally {
        if (alive.current) {
          setPendingTrails((ids) => ids.filter((id) => id !== trail.id));
        }
      }
    },
    [notifyActionError],
  );

  const hasData = Boolean(metrics);

  return (
    <motion.main
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className="mx-auto w-full max-w-7xl space-y-6 px-5 py-8 sm:px-8"
    >
      <DashboardHeader lastUpdated={lastUpdated} refreshing={refreshing} />

      {actionError && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2 rounded-xl border border-rose-200/80 bg-rose-50 px-3.5 py-2.5 text-xs font-medium text-rose-700"
          role="alert"
        >
          <AlertTriangle className="h-4 w-4 shrink-0" strokeWidth={2.3} />
          {actionError}
        </motion.div>
      )}

      {loading && !hasData ? (
        <DashboardSkeleton />
      ) : error && !hasData ? (
        <DashboardError message={error} onRetry={() => void loadAll("initial")} />
      ) : (
        <>
          {metrics && (
            <KpiRow metrics={metrics} trails={trails} reports={reports} />
          )}

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <UsageMapCard trails={trails} traffic={traffic} />
            </div>
            <TopTrailsCard trails={trails} traffic={traffic} reports={reports} />
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <LiveFeedCard reports={reports} trails={trails} />
            </div>
            <TrailStatusCard
              trails={trails}
              pending={pendingTrails}
              onCycle={cycleTrailStatus}
            />
          </div>
        </>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 pb-1 pt-5 text-[11px] text-slate-400">
        <span>Data seeded for demo · PAthFind · DCNR pilot</span>
        <span className="tabular-nums">Marsh Creek State Park · Chester County, PA</span>
      </footer>
    </motion.main>
  );
}
