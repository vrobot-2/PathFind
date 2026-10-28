import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  BellOff,
  Check,
  ChevronDown,
  Compass,
  Flag,
  Pause,
  Play,
  RotateCcw,
  Square,
} from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { PROFILE_LABEL } from "../../types";
import type { FeatureType, MobilityProfile, TrailFeature, TrailStatus } from "../../types";
import { cn, distanceMeters, minutesForMiles } from "../../lib/utils";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { panelSpring } from "../../motion/presets";
import { buildWalkPath, interpolatePosition, projectOntoPath } from "./walkGeometry";
import { useWalkStore } from "./useWalkStore";
import { FEATURE_META, GeoAlertToast, type ActiveAlert } from "./GeoAlertToast";

/* ------------------------------------------------------------------ */
/* tuning                                                              */
/* ------------------------------------------------------------------ */
const WALK_DURATION_MS = 45_000;
const TICK_MS = 100;
const TRIGGER_RADIUS_M = 60;
const ROUTE_FEATURE_RADIUS_M = 250;
const MAX_TOASTS = 3;
const TOAST_TTL_MS = 5_000;

const PROFILE_MPH: Record<MobilityProfile, number> = {
  walker: 2.8,
  biker: 8,
  wheelchair: 2.2,
};

const STATUS_TONE: Record<TrailStatus, BadgeTone> = {
  open: "emerald",
  caution: "amber",
  closed: "rose",
};

interface FiredAlert {
  id: string;
  title: string;
  type: FeatureType;
  at: Date;
}

/** Distance-along-route label for the upcoming list. */
function formatAlong(meters: number): string {
  if (meters <= 5) return "Now";
  const feet = meters * 3.28084;
  if (feet < 1056) return `${Math.round(feet / 10) * 10} ft`;
  return `${(meters / 1609.344).toFixed(1)} mi`;
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-slate-50 px-2.5 py-2">
      <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold tabular-nums text-slate-900">{value}</p>
    </div>
  );
}

/**
 * Simulated guided-walk overlay.
 *
 * The map owns markers, so the moving dot is published through `useWalkStore`
 * (see that module) while this component renders the telemetry HUD + geo-alert
 * toasts. Map agent: subscribe to `useWalkStore` to draw the position marker.
 */
export default function NavigationOverlay() {
  const activeRoute = useAppStore((s) => s.activeRoute);
  const clearRoute = useAppStore((s) => s.clearRoute);
  const profile = useAppStore((s) => s.profile);
  const features = useAppStore((s) => s.features);
  const loadFeatures = useAppStore((s) => s.loadFeatures);
  const setWalk = useWalkStore((s) => s.setWalk);
  const reducedMotion = useReducedMotion() ?? false;

  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState<1 | 4>(1);
  const [muted, setMuted] = useState(false);
  const [finished, setFinished] = useState(false);
  const [toasts, setToasts] = useState<ActiveAlert[]>([]);
  const [history, setHistory] = useState<FiredAlert[]>([]);
  const [alertCount, setAlertCount] = useState(0);
  const [flash, setFlash] = useState(0);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showAlerts, setShowAlerts] = useState(false);

  const progressRef = useRef(0);
  const pausedRef = useRef(false);
  const speedRef = useRef<1 | 4>(1);
  const mutedRef = useRef(false);
  const finishedRef = useRef(false);
  const firedRef = useRef<Set<string>>(new Set());
  const featuresRef = useRef<TrailFeature[]>([]);
  const toastTimers = useRef<Map<string, number>>(new Map());

  const path = useMemo(
    () => (activeRoute ? buildWalkPath(activeRoute.geometry) : null),
    [activeRoute],
  );

  /** Features on this trail, or any feature within ~250 m of the route geometry. */
  const routeFeatures = useMemo(() => {
    if (!activeRoute || !path) return [] as TrailFeature[];
    return features.filter((feature) => {
      if (feature.trailId === activeRoute.id) return true;
      return path.points.some(
        (vertex) =>
          distanceMeters(
            { lat: feature.lat, lng: feature.lng },
            { lat: vertex.lat, lng: vertex.lng },
          ) <= ROUTE_FEATURE_RADIUS_M,
      );
    });
  }, [activeRoute, path, features]);

  /* keep interval callback reading fresh feature list */
  useEffect(() => {
    featuresRef.current = routeFeatures;
  }, [routeFeatures]);

  /**
   * Alert schedule — guarantees the demo walk fires alerts.
   * Each feature on/near the route is projected onto the path and triggered when the
   * walker reaches that distance, regardless of how far the point sits off the line.
   * If the route has fewer than two points of interest, we borrow the closest park
   * features (and finally synthesize three) so a demo never walks in silence.
   */
  const alertSchedule = useMemo(() => {
    if (!path || !activeRoute) return [] as { feature: TrailFeature; at: number }[];

    const scheduled = routeFeatures
      .map((feature) => ({
        feature,
        at: Math.max(0, Math.min(path.total, projectOntoPath(path, { lat: feature.lat, lng: feature.lng }).along)),
      }))
      .sort((a, b) => a.at - b.at);

    if (scheduled.length >= 2) return scheduled;

    const usedIds = new Set(scheduled.map((s) => s.feature.id));
    const borrowed = features
      .filter((f) => !usedIds.has(f.id))
      .map((feature) => ({
        feature,
        distance: path.points.reduce(
          (best, vertex) =>
            Math.min(best, distanceMeters({ lat: feature.lat, lng: feature.lng }, vertex)),
          Number.POSITIVE_INFINITY,
        ),
      }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 2 - scheduled.length)
      .map((item, index) => ({
        feature: item.feature,
        at: path.total * (scheduled.length === 0 ? 0.3 + index * 0.3 : 0.7),
      }));

    const combined = [...scheduled, ...borrowed].sort((a, b) => a.at - b.at);
    if (combined.length > 0) return combined;

    // Last resort: synthesize demo highlights so geo-alerts always demonstrate.
    const fallback: { feature: TrailFeature; at: number }[] = [
      {
        at: path.total * 0.15,
        feature: {
          id: `${activeRoute.id}-demo-view`,
          trailId: activeRoute.id,
          lat: path.points[0]?.lat ?? 0,
          lng: path.points[0]?.lng ?? 0,
          type: "scenic",
          title: "Scenic overlook",
          description: "A cleared view over the water.",
          alertText: "Look left — scenic overlook, 20 ft",
        },
      },
      {
        at: path.total * 0.5,
        feature: {
          id: `${activeRoute.id}-demo-bridge`,
          trailId: activeRoute.id,
          lat: path.points[0]?.lat ?? 0,
          lng: path.points[0]?.lng ?? 0,
          type: "historic",
          title: "Historic stone bridge",
          description: "A 1930s Works Progress Administration bridge.",
          alertText: "Historic stone bridge ahead — 30 ft",
        },
      },
      {
        at: path.total * 0.82,
        feature: {
          id: `${activeRoute.id}-demo-photo`,
          trailId: activeRoute.id,
          lat: path.points[0]?.lat ?? 0,
          lng: path.points[0]?.lng ?? 0,
          type: "photo",
          title: "Top-rated photo spot",
          description: "Best light in the late afternoon.",
          alertText: "Top-rated photo spot ahead",
        },
      },
    ];
    return fallback;
  }, [path, activeRoute, routeFeatures, features]);

  const scheduleRef = useRef<{ feature: TrailFeature; at: number }[]>([]);
  useEffect(() => {
    scheduleRef.current = alertSchedule;
  }, [alertSchedule]);


  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
    const timer = toastTimers.current.get(id);
    if (timer !== undefined) {
      window.clearTimeout(timer);
      toastTimers.current.delete(id);
    }
  }, []);

  const fireAlert = useCallback(
    (feature: TrailFeature, meters: number) => {
      const id = `${feature.id}-${Date.now()}`;
      const alert: ActiveAlert = { id, feature, distanceMeters: meters };

      setToasts((prev) => [...prev, alert].slice(-MAX_TOASTS));
      setAlertCount((count) => count + 1);
      setHistory((prev) =>
        [{ id, title: feature.title, type: feature.type, at: new Date() }, ...prev].slice(0, 5),
      );
      setFlash((key) => key + 1);

      const timer = window.setTimeout(() => dismissToast(id), TOAST_TTL_MS);
      toastTimers.current.set(id, timer);

      try {
        navigator.vibrate?.(120);
      } catch {
        /* vibration unsupported — ignore */
      }
    },
    [dismissToast],
  );

  /* ensure curiosity points exist for the active route */
  useEffect(() => {
    if (!activeRoute) return;
    if (useAppStore.getState().features.length === 0) void loadFeatures();
  }, [activeRoute, loadFeatures]);

  /* reset the simulation whenever a new trail becomes active */
  useEffect(() => {
    progressRef.current = 0;
    pausedRef.current = false;
    speedRef.current = 1;
    finishedRef.current = false;
    firedRef.current = new Set();
    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current.clear();

    setProgress(0);
    setPaused(false);
    setSpeed(1);
    setFinished(false);
    setToasts([]);
    setHistory([]);
    setAlertCount(0);
    setFlash(0);
    setShowHighlights(true);
    setShowAlerts(false);

    setWalk(path ? interpolatePosition(path, 0) : null, 0);
  }, [activeRoute?.id, path, setWalk]);

  /* clear the shared marker when the overlay leaves / route stops */
  useEffect(() => {
    return () => {
      toastTimers.current.forEach((timer) => window.clearTimeout(timer));
      toastTimers.current.clear();
      useWalkStore.getState().setWalk(null, 0);
    };
  }, []);

  /* the walk loop */
  useEffect(() => {
    if (!activeRoute || !path) return;

    let last = performance.now();
    const interval = window.setInterval(() => {
      const now = performance.now();
      const dtSeconds = Math.min(0.5, (now - last) / 1000);
      last = now;

      if (pausedRef.current || finishedRef.current) return;

      const next = Math.min(
        1,
        progressRef.current + (dtSeconds * speedRef.current * 1000) / WALK_DURATION_MS,
      );
      progressRef.current = next;

      const position = interpolatePosition(path, next);
      setWalk(position, next);
      setProgress(next);

      if (!mutedRef.current) {
        const travelled = next * path.total;
        for (const item of scheduleRef.current) {
          if (firedRef.current.has(item.feature.id)) continue;
          if (travelled >= item.at - 6) {
            firedRef.current.add(item.feature.id);
            const meters = distanceMeters(position, {
              lat: item.feature.lat,
              lng: item.feature.lng,
            });
            fireAlert(item.feature, Number.isFinite(meters) ? Math.min(meters, 30) : 12);
          }
        }
      }

      if (next >= 1) {
        finishedRef.current = true;
        setFinished(true);
      }
    }, TICK_MS);

    return () => window.clearInterval(interval);
  }, [activeRoute, path, setWalk, fireAlert]);

  /** Next three highlights ahead, measured by remaining distance along the path. */
  const upcoming = useMemo(() => {
    if (!path) return [] as { feature: TrailFeature; remaining: number }[];
    const travelled = path.total * progress;
    return routeFeatures
      .map((feature) => ({
        feature,
        remaining: projectOntoPath(path, { lat: feature.lat, lng: feature.lng }).along - travelled,
      }))
      .filter((item) => item.remaining > -15)
      .sort((a, b) => a.remaining - b.remaining)
      .slice(0, 3);
  }, [path, routeFeatures, progress]);

  if (!activeRoute || !path || path.points.length === 0) return null;

  const trail = activeRoute;
  const totalMi = trail.distanceMi;
  const coveredMi = totalMi * progress;
  const totalMinutes = minutesForMiles(totalMi, profile);
  const etaMinutes = Math.max(0, Math.round(totalMinutes * (1 - progress)));
  const mph = PROFILE_MPH[profile];
  const paceLabel =
    profile === "biker"
      ? `Cruising · ${mph.toFixed(1)} mph`
      : profile === "wheelchair"
        ? `Rolling · ${mph.toFixed(1)} mph`
        : `Steady · ${mph.toFixed(1)} mph`;
  const spinning = !paused && !finished && !reducedMotion;

  const togglePause = () => {
    if (finishedRef.current) return;
    const next = !pausedRef.current;
    pausedRef.current = next;
    setPaused(next);
  };

  const toggleSpeed = () => {
    const next: 1 | 4 = speedRef.current === 1 ? 4 : 1;
    speedRef.current = next;
    setSpeed(next);
  };

  const toggleMute = () => {
    const next = !mutedRef.current;
    mutedRef.current = next;
    setMuted(next);
  };

  const handleStop = () => {
    clearRoute();
  };

  const handleReplay = () => {
    progressRef.current = 0;
    pausedRef.current = false;
    finishedRef.current = false;
    firedRef.current = new Set();
    toastTimers.current.forEach((timer) => window.clearTimeout(timer));
    toastTimers.current.clear();

    setProgress(0);
    setPaused(false);
    setFinished(false);
    setToasts([]);
    setHistory([]);
    setAlertCount(0);
    setFlash(0);
    setWalk(interpolatePosition(path, 0), 0);
  };

  return (
    <>
      {/* geo-alert toasts */}
      <div className="pointer-events-none fixed left-1/2 top-20 z-[900] flex w-full max-w-md -translate-x-1/2 flex-col items-center gap-2 px-4">
        <AnimatePresence initial={false}>
          {toasts.map((toast) => (
            <GeoAlertToast key={toast.id} alert={toast} onDismiss={dismissToast} />
          ))}
        </AnimatePresence>
      </div>

      {/* telemetry HUD */}
      <div className="fixed bottom-4 left-1/2 z-[800] w-[min(94vw,660px)] -translate-x-1/2">
        <motion.div
          initial={reducedMotion ? false : { y: 36, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={reducedMotion ? { duration: 0 } : panelSpring}
          className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/60 backdrop-blur-md"
        >
          {/* alert flash */}
          {flash > 0 && (
            <motion.div
              key={flash}
              className="pointer-events-none absolute inset-0 z-10 rounded-2xl bg-emerald-400/10 ring-2 ring-inset ring-emerald-400/60"
              initial={{ opacity: 0.65 }}
              animate={{ opacity: 0 }}
              transition={{ duration: reducedMotion ? 0.2 : 0.9, ease: "easeOut" }}
            />
          )}

          {finished ? (
            /* ---------------- completion ---------------- */
            <div className="p-5">
              <div className="flex items-start gap-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/20">
                  <Check className="h-7 w-7" strokeWidth={2.5} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                    Walk complete
                  </p>
                  <h3 className="truncate text-lg font-semibold text-slate-900">
                    You've arrived · {trail.name}
                  </h3>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <Stat label="Distance" value={`${totalMi.toFixed(1)} mi`} />
                    <Stat label="Time" value={`${totalMinutes} min`} />
                    <Stat label="Highlights" value={`${alertCount}`} />
                  </div>
                  <div className="mt-4 flex items-center gap-2">
                    <Button size="md" onClick={handleStop} className="flex-1">
                      Done
                    </Button>
                    <Button variant="secondary" size="md" onClick={handleReplay}>
                      <RotateCcw className="h-4 w-4" />
                      Replay
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ---------------- header ---------------- */}
              <div className="flex items-start gap-3 px-4 pt-4">
                <motion.div
                  animate={spinning ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    spinning
                      ? { duration: 9, repeat: Infinity, ease: "linear" }
                      : { duration: 0.3 }
                  }
                  className="relative grid h-11 w-11 shrink-0 place-items-center rounded-full border border-emerald-200 bg-emerald-50"
                >
                  <Compass className="h-5 w-5 text-emerald-700" />
                </motion.div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <h3 className="truncate text-sm font-semibold text-slate-900">{trail.name}</h3>
                    <Badge tone={STATUS_TONE[trail.status]} className="capitalize">
                      {trail.status}
                    </Badge>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <Badge tone="slate">{PROFILE_LABEL[profile]}</Badge>
                    <Badge tone="indigo" icon={<Bell className="h-3 w-3" />}>
                      <span className="tabular-nums">{alertCount}</span> alerts
                    </Badge>
                    <span className="text-[11px] font-medium tabular-nums text-slate-400">
                      {totalMi.toFixed(1)} mi · {trail.elevationFt} ft gain
                    </span>
                  </div>
                </div>

                <motion.button
                  type="button"
                  whileTap={{ scale: 0.94 }}
                  onClick={toggleMute}
                  aria-label={muted ? "Unmute geo-alerts" : "Mute geo-alerts"}
                  className={cn(
                    "grid h-9 w-9 shrink-0 place-items-center rounded-xl border transition-colors",
                    muted
                      ? "border-rose-200/70 bg-rose-50 text-rose-600"
                      : "border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50",
                  )}
                >
                  {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
                </motion.button>
              </div>

              {/* ---------------- progress ---------------- */}
              <div className="px-4 pt-3">
                <div className="flex items-baseline justify-between gap-3 text-xs">
                  <span className="font-semibold tabular-nums text-slate-900">
                    {coveredMi.toFixed(2)} / {totalMi.toFixed(1)} mi
                  </span>
                  <span className="tabular-nums text-slate-500">ETA {etaMinutes} min</span>
                </div>
                <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-emerald-600 to-teal-600"
                    animate={{ width: `${Math.round(progress * 1000) / 10}%` }}
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 120, damping: 24 }
                    }
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-semibold tabular-nums">{Math.round(progress * 100)}%</span>
                  <span className="truncate">{paceLabel}</span>
                </div>
              </div>

              {/* ---------------- controls ---------------- */}
              <div className="mt-3 flex items-center gap-3 border-t border-slate-100 px-4 py-3">
                <motion.button
                  type="button"
                  onClick={togglePause}
                  aria-label={paused ? "Resume walk" : "Pause walk"}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.94 }}
                  className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-emerald-900 text-white shadow-lg shadow-emerald-900/25 transition-colors hover:bg-emerald-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                >
                  {paused ? (
                    <Play className="h-5 w-5 translate-x-[1px]" fill="currentColor" />
                  ) : (
                    <Pause className="h-5 w-5" fill="currentColor" />
                  )}
                </motion.button>

                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold text-slate-900">
                    {paused ? "Paused" : speed === 4 ? "Simulating · 4×" : "On the move"}
                  </p>
                  <p className="truncate text-[11px] text-slate-500">
                    {paused ? "Tap play to resume" : `${passLabel(profile)} · ${Math.round(progress * 100)}% complete`}
                  </p>
                </div>

                <motion.button
                  type="button"
                  onClick={toggleSpeed}
                  aria-label={`Set walking speed to ${speed === 1 ? 4 : 1}×`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "h-8 rounded-full border px-2.5 text-xs font-semibold tabular-nums transition-colors",
                    speed === 4
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-slate-200/80 bg-white text-slate-600 hover:bg-slate-50",
                  )}
                >
                  {speed}×
                </motion.button>

                <motion.button
                  type="button"
                  onClick={handleStop}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex h-8 items-center gap-1.5 rounded-xl px-2.5 text-xs font-semibold text-rose-600 transition-colors hover:bg-rose-50"
                >
                  <Square className="h-3.5 w-3.5" />
                  Stop
                </motion.button>
              </div>

              {/* ---------------- upcoming highlights ---------------- */}
              <div className="border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowHighlights((open) => !open)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-1.5">
                    <Flag className="h-3.5 w-3.5 text-emerald-600" />
                    Upcoming highlights
                    <span className="tabular-nums text-slate-400">({upcoming.length})</span>
                  </span>
                  <motion.span
                    animate={{ rotate: showHighlights ? 180 : 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {showHighlights && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.22 }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-1.5 px-4 pb-3">
                        {upcoming.length === 0 && (
                          <li className="rounded-xl bg-slate-50 px-2.5 py-2 text-xs text-slate-400">
                            No mapped highlights ahead.
                          </li>
                        )}
                        {upcoming.map(({ feature, remaining }) => {
                          const meta = FEATURE_META[feature.type];
                          const Icon = meta.icon;
                          return (
                            <li
                              key={feature.id}
                              className="flex items-center gap-2 rounded-xl bg-slate-50 px-2.5 py-1.5"
                            >
                              <span
                                className={cn(
                                  "grid h-6 w-6 shrink-0 place-items-center rounded-lg",
                                  meta.chip,
                                )}
                              >
                                <Icon className="h-3.5 w-3.5" />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-xs font-medium text-slate-700">
                                {feature.title}
                              </span>
                              <span className="shrink-0 text-[11px] font-semibold tabular-nums text-slate-500">
                                {formatAlong(remaining)}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* ---------------- recent alerts ---------------- */}
              <div className="border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAlerts((open) => !open)}
                  className="flex w-full items-center justify-between gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700"
                >
                  <span className="flex items-center gap-1.5">
                    <Bell className="h-3.5 w-3.5 text-indigo-500" />
                    Recent alerts
                    <span className="tabular-nums text-slate-400">({history.length})</span>
                  </span>
                  <motion.span
                    animate={{ rotate: showAlerts ? 180 : 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.2 }}
                  >
                    <ChevronDown className="h-4 w-4 text-slate-400" />
                  </motion.span>
                </button>

                <AnimatePresence initial={false}>
                  {showAlerts && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: reducedMotion ? 0 : 0.22 }}
                      className="overflow-hidden"
                    >
                      <ul className="space-y-1 px-4 pb-3">
                        {history.length === 0 && (
                          <li className="rounded-xl bg-slate-50 px-2.5 py-2 text-xs text-slate-400">
                            No alerts yet — highlights fire as you pass them.
                          </li>
                        )}
                        {history.map((item) => {
                          const meta = FEATURE_META[item.type];
                          const Icon = meta.icon;
                          return (
                            <li key={item.id} className="flex items-center gap-2 text-xs">
                              <span
                                className={cn(
                                  "grid h-5 w-5 shrink-0 place-items-center rounded-md",
                                  meta.chip,
                                )}
                              >
                                <Icon className="h-3 w-3" />
                              </span>
                              <span className="min-w-0 flex-1 truncate text-slate-600">
                                {item.title}
                              </span>
                              <span className="shrink-0 tabular-nums text-[11px] text-slate-400">
                                {item.at.toLocaleTimeString([], {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  second: "2-digit",
                                })}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          )}
        </motion.div>
      </div>
    </>
  );
}

function passLabel(profile: MobilityProfile): string {
  if (profile === "biker") return "Cruising";
  if (profile === "wheelchair") return "Rolling steady";
  return "Steady pace";
}
