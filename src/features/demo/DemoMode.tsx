import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Accessibility, ArrowRight, Play, RotateCcw, Square, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { Button } from "../../components/ui/Button";
import { useDemoChrome } from "../../lib/demoChrome";
import { panelSpring } from "../../motion/presets";
import { cn } from "../../lib/utils";

interface Step {
  label: string;
  hint: string;
  ms: number;
  run: () => void;
}

const TOTAL_LABEL = "Judge demo";

function scrollToTop() {
  try {
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch {
    /* ignore */
  }
}

function scrollToRatio(ratio: number) {
  try {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    window.scrollTo({ top: Math.max(0, Math.round(max * ratio)), behavior: "smooth" });
  } catch {
    /* ignore */
  }
}

/**
 * Auto-playing walkthrough of the whole product.
 * Kiosk mode (`?demo=1`) locks interaction, scrolls itself, and ends with a
 * "watch again / explore" choice instead of looping forever.
 */
export default function DemoMode() {
  const navigate = useNavigate();
  const activeRoute = useAppStore((s) => s.activeRoute);
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(-1);
  const [steps, setSteps] = useState<Step[]>([]);
  const [done, setDone] = useState(false);
  const [kiosk, setKiosk] = useState(false);

  const kioskRef = useRef(false);
  const startRef = useRef<(() => void) | null>(null);
  const timer = useRef<number | null>(null);
  const token = useRef(0);
  const autoStarted = useRef(false);

  const clearTimer = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = null;
  }, []);

  const buildSteps = useCallback((): Step[] => {
    return [
      {
        label: "Explore the park",
        hint: "Marsh Creek State Park · 1,784 acres · 8 trails mapped",
        ms: 3600,
        run: () => {
          navigate("/");
          window.scrollTo({ top: 0, behavior: "smooth" });
        },
      },
      {
        label: "How accessible is the park?",
        hint: "2 of 8 trails are step-free · 2.2 miles",
        ms: 3400,
        run: () => scrollToRatio(0.34),
      },
      {
        label: "Scan and take it with you",
        hint: "The whole app runs in the browser — no download",
        ms: 3400,
        run: () => {
          const qr = document.querySelector('img[src="/qr-pathfind.svg"]');
          if (qr) {
            qr.scrollIntoView({ behavior: "smooth", block: "center" });
          } else {
            scrollToRatio(1);
          }
        },
      },
      {
        label: "Choose a mobility profile",
        hint: "Wheelchair → step-free trails only",
        ms: 2600,
        run: () => {
          scrollToTop();
          useAppStore.getState().setProfile("wheelchair");
        },
      },
      {
        label: "Open the live map",
        hint: "Compatible trails glow, the rest dim",
        ms: 3200,
        run: () => {
          navigate("/map");
          window.scrollTo({ top: 0 });
          useDemoChrome.getState().setCleanMap(true);
        },
      },
      {
        label: "Start the step-free loop",
        hint: "Lakeside Accessible Loop · 1.6 mi · 2% grade",
        ms: 14000,
        run: () => {
          const s = useAppStore.getState();
          const trail =
            s.trails.find((t) => t.id === "lakeside-accessible-loop") ??
            s.trails.find((t) => t.wheelchairOk) ??
            s.trails[0];
          if (!trail) return;
          s.selectTrail(trail.id);
          s.startRoute(trail);
        },
      },
      {
        label: "Drop a hazard report",
        hint: "Visitors flag issues with a photo",
        ms: 4200,
        run: () => {
          const s = useAppStore.getState();
          s.setPinMode("report");
          // let the sheet settle, then drop the pin so the form renders
          window.setTimeout(() => {
            useAppStore.getState().setPendingPin({ lat: 40.0724, lng: -75.7812 });
          }, 350);
        },
      },
      {
        label: "Rangers see it instantly",
        hint: "Traffic, response times and a live hazard feed",
        ms: 5000,
        run: () => {
          const s = useAppStore.getState();
          s.setPinMode("none");
          s.clearRoute();
          useDemoChrome.getState().setCleanMap(false);
          navigate("/admin");
          window.scrollTo({ top: 0 });
        },
      },
      {
        label: "Triage and resolve",
        hint: "Report queue → ranger note → resolved",
        ms: 5200,
        run: () => {
          navigate("/admin/reports");
          window.scrollTo({ top: 0 });
        },
      },
    ];
  }, [navigate]);

  const finish = useCallback(() => {
    clearTimer();
    setRunning(false);
    setIndex(-1);
    setDone(true);
    useDemoChrome.getState().setCleanMap(false);
    const s = useAppStore.getState();
    s.setPinMode("none");
    useAppStore.setState({ pendingPin: null });
  }, [clearTimer]);

  const runStep = useCallback(
    (list: Step[], i: number, myToken: number) => {
      if (token.current !== myToken) return;
      if (i >= list.length) {
        finish();
        return;
      }
      setIndex(i);
      setSteps(list);
      try {
        list[i].run();
      } catch {
        /* a step failing must never stall the tour */
      }
      timer.current = window.setTimeout(() => runStep(list, i + 1, myToken), list[i].ms);
    },
    [finish],
  );

  const start = useCallback(() => {
    clearTimer();
    const myToken = ++token.current;
    const list = buildSteps();
    setSteps(list);
    setIndex(0);
    setRunning(true);
    setDone(false);
    useDemoChrome.getState().setCleanMap(false);
    window.scrollTo({ top: 0 });

    void (async () => {
      const s = useAppStore.getState();
      if (s.trails.length === 0) await s.loadTrails();
      if (s.reports.length === 0) await s.loadReports();
      if (token.current === myToken) runStep(list, 0, myToken);
    })();
  }, [buildSteps, clearTimer, runStep]);

  startRef.current = start;

  const stop = useCallback(() => {
    clearTimer();
    token.current += 1;
    setRunning(false);
    setIndex(-1);
    setDone(false);
    useDemoChrome.getState().setCleanMap(false);
    const s = useAppStore.getState();
    s.setPinMode("none");
    s.clearRoute();
    navigate("/");
  }, [clearTimer, navigate]);

  /* Leave kiosk mode and hand the app back to the visitor. */
  const explore = useCallback(() => {
    clearTimer();
    token.current += 1;
    kioskRef.current = false;
    setKiosk(false);
    setRunning(false);
    setIndex(-1);
    setDone(false);
    useDemoChrome.getState().setCleanMap(false);
    const s = useAppStore.getState();
    s.setPinMode("none");
    s.clearRoute();
    if (window.location.pathname === "/demo") {
      navigate("/", { replace: true });
    }
    try {
      window.history.replaceState(null, "", "/");
    } catch {
      /* ignore */
    }
    navigate("/", { replace: true });
    window.scrollTo({ top: 0 });
  }, [clearTimer, navigate]);

  /* Kiosk detection: /demo or ?demo=1. */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const isKiosk = params.get("demo") === "1" || window.location.pathname === "/demo";
    if (!isKiosk) return;
    kioskRef.current = true;
    setKiosk(true);
    if (window.location.pathname === "/demo") navigate("/", { replace: true });
  }, [navigate]);

  /* Auto-start once. */
  useEffect(() => {
    if (!kiosk || autoStarted.current) return;
    autoStarted.current = true;
    const t = window.setTimeout(() => startRef.current?.(), 600);
    return () => window.clearTimeout(t);
  }, [kiosk]);

  /* Allow scripted scrolling but block human scrolling while locked down. */
  useEffect(() => {
    if (!kiosk) return;
    const block = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };
    const keys = new Set([
      "ArrowUp",
      "ArrowDown",
      "PageUp",
      "PageDown",
      "Home",
      "End",
      " ",
    ]);
    const onKey = (e: KeyboardEvent) => {
      if (keys.has(e.key)) block(e);
    };
    window.addEventListener("wheel", block, { passive: false, capture: true });
    window.addEventListener("touchmove", block, { passive: false, capture: true });
    window.addEventListener("keydown", onKey, { capture: true });
    return () => {
      window.removeEventListener("wheel", block, { capture: true });
      window.removeEventListener("touchmove", block, { capture: true });
      window.removeEventListener("keydown", onKey, { capture: true });
    };
  }, [kiosk]);

  useEffect(
    () => () => {
      clearTimer();
      token.current += 1;
    },
    [clearTimer],
  );

  const current = running && index >= 0 ? steps[index] : null;
  const progress = running ? (index + 1) / Math.max(steps.length, 1) : 0;

  return (
    <>
      {/* launcher — bottom-right, clears the mobile nav and map rails */}
      <AnimatePresence>
        {!running && !done && !activeRoute && !kiosk && (
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

      {/* kiosk shield — swallows every tap and drag below the progress bar */}
      {kiosk && (
        <div
          aria-hidden
          className="fixed inset-0 z-[1140] touch-none select-none overscroll-none bg-transparent"
          onContextMenu={(e) => e.preventDefault()}
        />
      )}

      {/* end-of-tour choice */}
      <AnimatePresence>
        {done && (
          <motion.div
            className="fixed inset-0 z-[1200] grid place-items-center bg-slate-900/30 px-4 backdrop-blur-[3px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Tour finished"
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1, transition: panelSpring }}
              exit={{ opacity: 0, y: 10, scale: 0.97 }}
              className="w-full max-w-sm rounded-2xl border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/20"
            >
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-emerald-50 text-emerald-700">
                <Accessibility size={22} />
              </span>
              <h2 className="mt-4 text-xl font-extrabold tracking-tight text-slate-900">
                That's the tour
              </h2>
              <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-500">
                You've seen the full loop — accessible routing, live alerts, crowdsourced hazards
                and the ranger view. Want to drive it yourself, or watch it once more?
              </p>

              <div className="mt-5 flex flex-col gap-2">
                <Button size="lg" onClick={kiosk ? explore : () => setDone(false)}>
                  {kiosk ? "Explore the app" : "Done"}
                  <ArrowRight size={15} />
                </Button>
                <Button size="lg" variant="secondary" onClick={start}>
                  <RotateCcw size={14} />
                  Watch it again
                </Button>
              </div>

              <p className="mt-4 text-center text-[11px] font-medium text-slate-400">
                pathfind.viratwiz.com
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
