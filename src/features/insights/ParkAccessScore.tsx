import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Accessibility, AlertTriangle, Route } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import type { Trail } from "../../types";
import { useParkMetrics } from "../home/parkStats";

/** Seeded fallback, used until the live trail feed resolves (or if it fails). */
const FALLBACK = {
  total: 8,
  stepFreeCount: 2,
  stepFreeMi: 2.2,
  totalMi: 20.1,
};

/** Step-free eligibility has to match the map + trail-card "Accessible" rules. */
function isStepFree(trail: Trail): boolean {
  return (
    trail.wheelchairOk &&
    trail.maxSlope <= 5 &&
    trail.widthIn >= 36 &&
    trail.status !== "closed"
  );
}

interface Score {
  total: number;
  stepFreeCount: number;
  stepFreeMi: number;
  totalMi: number;
}

function computeScore(trails: Trail[]): Score {
  if (trails.length === 0) return FALLBACK;
  const stepFree = trails.filter(isStepFree);
  return {
    total: trails.length,
    stepFreeCount: stepFree.length,
    stepFreeMi: stepFree.reduce((sum, trail) => sum + trail.distanceMi, 0),
    totalMi: trails.reduce((sum, trail) => sum + trail.distanceMi, 0),
  };
}

const RADIUS = 52;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

function ProgressRing({ percent, reduce }: { percent: number; reduce: boolean }) {
  const clamped = Math.max(0, Math.min(100, percent));
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="relative h-[132px] w-[132px] shrink-0">
      <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden>
        <circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="9"
          className="stroke-slate-100"
        />
        <motion.circle
          cx="60"
          cy="60"
          r={RADIUS}
          fill="none"
          strokeWidth="9"
          strokeLinecap="round"
          className="stroke-emerald-500"
          style={{ strokeDasharray: CIRCUMFERENCE }}
          initial={reduce ? false : { strokeDashoffset: CIRCUMFERENCE }}
          animate={{ strokeDashoffset: offset }}
          transition={
            reduce
              ? { duration: 0 }
              : { duration: 1.1, ease: [0.16, 1, 0.3, 1], delay: 0.15 }
          }
        />
      </svg>
      <div className="absolute inset-0 grid place-content-center text-center">
        <span className="font-display text-[2.15rem] font-extrabold leading-none tracking-tight text-slate-900">
          {Math.round(clamped)}%
        </span>
        <span className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-slate-500">
          step-free
        </span>
      </div>
    </div>
  );
}

interface MiniStatProps {
  icon: typeof Accessibility;
  value: string;
  label: string;
}

function MiniStat({ icon: Icon, value, label }: MiniStatProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white/75 px-3 py-2.5 backdrop-blur-sm">
      <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-500">
        <Icon size={12} className="text-emerald-600" aria-hidden />
        {label}
      </span>
      <p className="mt-1 font-display text-lg font-extrabold leading-none tracking-tight text-slate-900">
        {value}
      </p>
    </div>
  );
}

export function ParkAccessScore() {
  const reduce = useReducedMotion() ?? false;
  const trails = useAppStore((s) => s.trails);
  const loadTrails = useAppStore((s) => s.loadTrails);
  const requested = useRef(false);
  const [attempted, setAttempted] = useState(false);
  const metrics = useParkMetrics();

  useEffect(() => {
    if (trails.length > 0 || requested.current) return;
    requested.current = true;
    setAttempted(true);
    void loadTrails();
  }, [trails.length, loadTrails]);

  const score = computeScore(trails);
  const percent =
    score.total > 0 ? (score.stepFreeCount / score.total) * 100 : 0;
  const isLive = trails.length > 0;
  const failed = attempted && !isLive;

  const stepFreeMi = score.stepFreeMi.toFixed(1);
  const totalMi = score.totalMi.toFixed(1);
  const takeaway = `${score.stepFreeCount} of ${score.total} trails are step-free — ${stepFreeMi} of ${totalMi} miles`;

  return (
    <section
      aria-labelledby="park-access-heading"
      className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-br from-emerald-50/90 via-white to-white shadow-xl shadow-slate-200/50"
    >
      <div
        className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-200/30 blur-3xl"
        aria-hidden
      />

      <div className="relative flex flex-col gap-6 p-5 sm:p-6 lg:flex-row lg:items-center lg:gap-8 lg:p-7">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:gap-6">
          <ProgressRing percent={percent} reduce={reduce} />

          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-700">
              Park accessibility
            </p>
            <h2
              id="park-access-heading"
              className="mt-1.5 text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl"
            >
              Step-free routes, at a glance
            </h2>
            <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
              {takeaway}
            </p>
            <p className="mt-1 text-xs font-medium text-slate-500">
              {failed
                ? "Live trail feed is offline — showing the last verified park figures."
                : "A route counts as step-free when it is wheelchair-rated, 36 in or wider, and no steeper than 5%."}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:ml-auto lg:w-[340px] lg:shrink-0">
          <MiniStat
            icon={Accessibility}
            value={`${stepFreeMi} mi`}
            label="Step-free"
          />
          <MiniStat icon={Route} value={`${score.total}`} label="Routes" />
          <MiniStat
            icon={AlertTriangle}
            value={`${metrics.openHazards}`}
            label="Hazards"
          />
        </div>
      </div>
    </section>
  );
}
