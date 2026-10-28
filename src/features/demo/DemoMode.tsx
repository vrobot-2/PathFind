import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Accessibility, Play, Square, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { panelSpring } from "../../motion/presets";
import { cn } from "../../lib/utils";

interface Step {
  label: string;
  hint: string;
  ms: number;
  run: () => void;
}

const TOTAL_LABEL = "Judge demo";

/**
 * Auto-playing walkthrough of the whole product.
 * Mobile-first: a compact control bar that never covers the app's own primary UI.
 */
export default function DemoMode() {
  const navigate = useNavigate();
  const activeRoute = useAppStore((s) => s.activeRoute);
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(-1);
  const [steps, setSteps] = useState<Step[]>([]);
  const [kiosk, setKiosk] = useState(false);
  const kioskRef = useRef(false);
  const startRef = useRef<(() => void) | null>(null);
  const timer = useRef<number | null>(null);
  const restartTimer = useRef<number | null>(null);

  const buildSteps = useCallback((): Step[] => {
    const store = useAppStore.getState();
    return [
      {
        label: "Explore the park",
        hint: "Marsh Creek State Park · 8 trails mapped",
        ms: 3000,
        run: () => navigate("/"),
      },
      {
        label: "Choose a mobility profile",
        hint: "Wheelchair → step-free routes only",
        ms: 2600,
        run: () => store.setProfile("wheelchair"),
      },
      {
        label: "Open the live map",
        hint: "Compatible trails glow, the rest dim",
        ms: 2800,
        run: () => navigate("/map"),
      },
      {
        label: "Start the step-free loop",
        hint: "Lakeside Accessible Loop · 1.6 mi · 2% grade",
        ms: 15000,
        run: () => {
          const trails = useAppStore.getState().trails;
          const trail =
            trails.find((t) => t.id === "lakeside-accessible-loop") ??
            trails.find((t) => t.wheelchairOk) ??
            trails[0];
          if (!trail) return;
          const s = useAppStore.getState();
          s.selectTrail(trail.id);
          s.startRoute(trail);
        },
      },
      {
        label: "Drop a hazard report",
        hint: "Visitors flag issues with a photo",
        ms: 3600,
        run: () => {
          const s = useAppStore.getState();
          s.setPinMode("report");
          s.setPendingPin({ lat: 40.0724, lng: -75.7812 });
        },
      },
      {
        label: "Rangers see it instantly",
        hint: "Traffic heatmap, response times, live feed",
        ms: 5200,
        run: () => {
          const s = useAppStore.getState();
          s.setPinMode("none");
          s.clearRoute();
          navigate("/admin");
        },
      },
      {
        label: "Triage and resolve",
        hint: "Report queue → ranger note → resolved",
        ms: 5200,
        run: () => navigate("/admin/reports"),
      },
    ];
  }, [navigate]);

  const stop = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
    setRunning(false);
    setIndex(-1);
    const s = useAppStore.getState();
    s.setPinMode("none");
    s.clearRoute();
    navigate("/");
  }, [navigate]);

  const advance = useCallback(
    (list: Step[], next: number) => {
      if (next >= list.length) {
        setRunning(false);
        setIndex(-1);
        // kiosk mode loops forever for the QR-code demo
        if (kioskRef.current) {
          restartTimer.current = window.setTimeout(() => startRef.current?.(), 4200);
        }
        return;
      }
      setIndex(next);
      list[next].run();
      timer.current = window.setTimeout(() => advance(list, next + 1), list[next].ms);
    },
    [],
  );

  const start = useCallback(async () => {
    if (restartTimer.current) window.clearTimeout(restartTimer.current);
    restartTimer.current = null;
    const list = buildSteps();
    setSteps(list);
    setRunning(true);
    const s = useAppStore.getState();
    if (s.trails.length === 0) await s.loadTrails();
    if (s.reports.length === 0) await s.loadReports();
    advance(list, 0);
  }, [advance, buildSteps]);

  startRef.current = start;

  // Kiosk detection: /demo or ?demo=1 turns the app into a non-interactive loop.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isKiosk = params.get("demo") === "1" || window.location.pathname === "/demo";
    if (!isKiosk) return;
    kioskRef.current = true;
    setKiosk(true);
    if (window.location.pathname === "/demo") navigate("/", { replace: true });
  }, [navigate]);

  // Auto-start once kiosk is armed.
  useEffect(() => {
    if (!kiosk) return;
    const t = window.setTimeout(() => startRef.current?.(), 700);
    return () => window.clearTimeout(t);
  }, [kiosk]);

  // No scrolling while locked down.
  useEffect(() => {
    if (!kiosk) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [kiosk]);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
      if (restartTimer.current) window.clearTimeout(restartTimer.current);
    },
    [],
  );

  const current = running && index >= 0 ? steps[index] : null;
  const progress = running ? (index + 1) / Math.max(steps.length, 1) : 0;

  return (
    <>
      {/* launcher — bottom-right, clears the mobile nav and map rails */}
      <AnimatePresence>
        {!running && !activeRoute && !kiosk && (
          <motion.button
            type="button"
            onClick={start}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="fixed bottom-4 right-4 z-[800] flex items-center gap-2 rounded-full bg-emerald-900 px-4 py-2.5 text-xs font-semibold text-white shadow-xl shadow-emerald-900/25"
            aria-label="Start the judge demo"
          >
            <Play size={14} />
            {TOTAL_LABEL}
          </motion.button>
        )}
      </AnimatePresence>

      {/* running bar */}
      <AnimatePresence>
        {running && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0, transition: panelSpring }}
            exit={{ opacity: 0, y: 16, transition: { duration: 0.18 } }}
            className={cn(
              "fixed inset-x-3 z-[1150] sm:left-1/2 sm:right-auto sm:w-[420px] sm:-translate-x-1/2",
              // the walk HUD owns the bottom on mobile, so the demo bar moves up
              activeRoute ? "top-[4.6rem] bottom-auto" : "bottom-3",
            )}
          >
            <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-md">
              <div className="h-1 w-full bg-slate-100">
                <motion.div
                  className="h-full rounded-r-full bg-emerald-600"
                  animate={{ width: `${Math.round(progress * 100)}%` }}
                  transition={{ duration: 0.4, ease: "easeOut" }}
                />
              </div>
              <div className="flex items-center gap-3 px-3.5 py-3">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                  <Accessibility size={17} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                    {kiosk ? (
                      <>Live demo · auto-playing</>
                    ) : (
                      <>
                        Step {(index + 1).toString().padStart(2, "0")} /{" "}
                        {steps.length.toString().padStart(2, "0")}
                      </>
                    )}
                  </p>
                  <p className="mt-0.5 truncate text-[13px] font-bold tracking-tight text-slate-900">
                    {current?.label}
                  </p>
                  <p className="truncate text-[11px] font-medium text-slate-500">{current?.hint}</p>
                </div>
                {!kiosk && (
                  <button
                    type="button"
                    onClick={stop}
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500",
                      "hover:bg-rose-50 hover:text-rose-600",
                    )}
                    aria-label="Stop the demo"
                    title="Stop the demo"
                  >
                    <Square size={13} />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* tiny exit affordance while navigating (never blocks taps) */}
      {running && !kiosk && (
        <div className="pointer-events-none fixed right-3 top-[4.5rem] z-[799]">
          <button
            type="button"
            onClick={stop}
            className="pointer-events-auto flex items-center gap-1 rounded-full border border-slate-200/80 bg-white/95 px-2.5 py-1.5 text-[10px] font-semibold text-slate-500 shadow-md shadow-slate-200/60 backdrop-blur"
          >
            <X size={11} /> End demo
          </button>
        </div>
      )}

      {/* kiosk shield — swallows every tap/drag/scroll below the progress bar */}
      {kiosk && (
        <div
          aria-hidden
          className="fixed inset-0 z-[1140] touch-none select-none overscroll-none bg-transparent"
          onContextMenu={(e) => e.preventDefault()}
        />
      )}
    </>
  );
}
