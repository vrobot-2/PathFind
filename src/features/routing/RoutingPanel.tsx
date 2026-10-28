import { useCallback, useEffect, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import {
  Accessibility,
  ArrowUpDown,
  Bike,
  Check,
  Clock,
  Footprints,
  Mountain,
  RotateCw,
  Route,
  Search,
  TreePine,
  TriangleAlert,
  X,
  type LucideIcon,
} from "lucide-react";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { Card } from "../../components/ui/Card";
import { cn, miles, minutesForMiles } from "../../lib/utils";
import {
  panelSlideIn,
  staggerItem,
  staggerList,
} from "../../motion/presets";
import { useAppStore } from "../../store/useAppStore";
import {
  PROFILE_LABEL,
  SURFACE_LABEL,
  type MobilityProfile,
  type RouteResult,
  type Trail,
} from "../../types";
import { gradeLimitFor, scoreTrail } from "./scoring";

interface Props {
  open: boolean;
  onClose: () => void;
}

const PROFILES: { id: MobilityProfile; icon: LucideIcon }[] = [
  { id: "walker", icon: Footprints },
  { id: "biker", icon: Bike },
  { id: "wheelchair", icon: Accessibility },
];

type OptionKey = "loopOnly" | "avoidSteep" | "shadeRest";

const OPTIONS: { key: OptionKey; label: string; icon: LucideIcon }[] = [
  { key: "loopOnly", label: "Loop only", icon: RotateCw },
  { key: "avoidSteep", label: "Avoid steep grades", icon: Mountain },
  { key: "shadeRest", label: "Shade / rest stops", icon: TreePine },
];

const reducedPanel: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

function FieldLabel({ children }: { children: string }) {
  return (
    <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
      {children}
    </p>
  );
}

export default function RoutingPanel({ open, onClose }: Props) {
  const reduceMotion = useReducedMotion();

  const trails = useAppStore((s) => s.trails);
  const loadTrails = useAppStore((s) => s.loadTrails);
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const routeResults = useAppStore((s) => s.routeResults);
  const setRouteResults = useAppStore((s) => s.setRouteResults);
  const startRoute = useAppStore((s) => s.startRoute);
  const selectTrail = useAppStore((s) => s.selectTrail);

  const [origin, setOrigin] = useState("Marsh Creek Day-Use Area");
  const [destination, setDestination] = useState("any");
  const [options, setOptions] = useState<Record<OptionKey, boolean>>({
    loopOnly: false,
    avoidSteep: false,
    shadeRest: false,
  });
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const rank = useCallback(
    (source: Trail[]): RouteResult[] => {
      const limit = gradeLimitFor(profile);
      return source
        .map((trail) => ({ trail, ...scoreTrail(trail, profile) }))
        .filter((result) => result.score > 0)
        .filter((result) => !options.loopOnly || result.trail.loop)
        .filter((result) => !options.avoidSteep || result.trail.maxSlope <= limit)
        .filter(
          (result) =>
            !options.shadeRest ||
            result.trail.loop ||
            result.trail.surface === "boardwalk",
        )
        .sort((a, b) => b.score - a.score);
    },
    [profile, options],
  );

  /* pull trail data the first time the panel opens */
  useEffect(() => {
    if (open && trails.length === 0) void loadTrails();
  }, [open, trails.length, loadTrails]);

  /* keep the visible scores honest when the profile changes */
  useEffect(() => {
    if (!hasSearched || loading) return;
    setRouteResults(rank(trails));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const toggleOption = (key: OptionKey) =>
    setOptions((current) => ({ ...current, [key]: !current[key] }));

  const findRoutes = () => {
    if (timer.current) clearTimeout(timer.current);
    setLoading(true);
    setHasSearched(true);
    timer.current = setTimeout(() => {
      setRouteResults(rank(trails));
      setLoading(false);
    }, 600);
  };

  const swapEndpoints = () => {
    const label =
      destination === "any"
        ? "Any accessible loop"
        : trails.find((trail) => trail.id === destination)?.name ?? origin;
    const previousOrigin = origin;
    setOrigin(label);
    const match = trails.find((trail) => trail.name === previousOrigin);
    setDestination(match ? match.id : "any");
  };

  const panelVariants = reduceMotion ? reducedPanel : panelSlideIn;

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          key="routing-panel"
          role="dialog"
          aria-label="Adaptive routing"
          variants={panelVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute bottom-4 right-2 top-20 z-40 w-[calc(100%-1rem)] overflow-y-auto overscroll-contain rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-md sm:right-4 sm:w-[400px]"
        >
          {/* header */}
          <div className="sticky top-0 z-10 flex items-center gap-3 rounded-t-2xl border-b border-slate-200/80 bg-white/95 px-5 py-4 backdrop-blur-md">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-700">
              <Route size={17} />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="truncate text-sm font-bold tracking-tight text-slate-900">
                Adaptive routing
              </h2>
              <p className="text-[11px] font-medium text-slate-500">
                {PROFILE_LABEL[profile]} · Marsh Creek
              </p>
            </div>
            <motion.button
              type="button"
              onClick={onClose}
              aria-label="Close routing panel"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
            >
              <X size={16} />
            </motion.button>
          </div>

          <div className="space-y-5 px-5 py-4">
            {/* profile */}
            <div>
              <FieldLabel>Mobility profile</FieldLabel>
              <div
                role="group"
                aria-label="Mobility profile"
                className="mt-2 grid grid-cols-3 gap-1 rounded-xl bg-emerald-50 p-1 ring-1 ring-inset ring-emerald-100"
              >
                {PROFILES.map(({ id, icon: Icon }) => {
                  const active = profile === id;
                  return (
                    <motion.button
                      key={id}
                      type="button"
                      onClick={() => setProfile(id)}
                      aria-pressed={active}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "relative flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                        active
                          ? "text-emerald-900"
                          : "text-emerald-700/60 hover:text-emerald-800",
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="routing-profile-pill"
                          className="absolute inset-0 rounded-lg bg-white shadow-sm shadow-emerald-900/10"
                          transition={{ type: "spring", stiffness: 420, damping: 34 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-1.5">
                        <Icon size={14} />
                        {PROFILE_LABEL[id]}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* origin / destination */}
            <div>
              <FieldLabel>Route</FieldLabel>
              <div className="relative mt-2 rounded-xl border border-slate-200 bg-slate-50">
                <span className="pointer-events-none absolute bottom-8 left-[19px] top-8 w-px bg-slate-300" />

                <div className="flex items-start gap-3 px-3.5 pt-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
                  <label className="min-w-0 flex-1">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Start
                    </span>
                    <input
                      value={origin}
                      onChange={(event) => setOrigin(event.target.value)}
                      placeholder="Trailhead or parking area"
                      className="mt-0.5 w-full bg-transparent text-sm font-medium text-slate-900 outline-none placeholder:text-slate-400"
                    />
                  </label>
                </div>

                <div className="h-4" />

                <div className="flex items-start gap-3 px-3.5 pb-3">
                  <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-rose-500 ring-4 ring-rose-500/10" />
                  <label className="min-w-0 flex-1 pr-8">
                    <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                      Destination
                    </span>
                    <select
                      value={destination}
                      onChange={(event) => setDestination(event.target.value)}
                      className="mt-0.5 w-full cursor-pointer appearance-none bg-transparent text-sm font-medium text-slate-900 outline-none"
                    >
                      <option value="any">Any accessible loop</option>
                      {trails.map((trail) => (
                        <option key={trail.id} value={trail.id}>
                          {trail.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                <motion.button
                  type="button"
                  onClick={swapEndpoints}
                  aria-label="Swap start and destination"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="absolute right-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-lg border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
                >
                  <ArrowUpDown size={14} />
                </motion.button>
              </div>
            </div>

            {/* options */}
            <div>
              <FieldLabel>Options</FieldLabel>
              <div className="mt-2 flex flex-wrap gap-2">
                {OPTIONS.map(({ key, label, icon: Icon }) => {
                  const active = options[key];
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => toggleOption(key)}
                      aria-pressed={active}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
                        active
                          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
                      )}
                    >
                      <Icon size={12} />
                      {label}
                    </motion.button>
                  );
                })}
              </div>
            </div>

            <Button
              size="lg"
              className="w-full"
              onClick={findRoutes}
              disabled={loading}
              aria-busy={loading}
            >
              <Search size={16} />
              {loading ? "Scoring trails…" : "Find routes"}
            </Button>

            {/* results */}
            <div aria-live="polite">
              {loading ? (
                <LoadingShimmer />
              ) : !hasSearched ? (
                <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-7 text-center">
                  <Route size={20} className="mx-auto text-slate-300" />
                  <p className="mt-2 text-xs leading-relaxed text-slate-500">
                    Pick a mobility profile, then find routes scored for grade,
                    surface and width.
                  </p>
                </div>
              ) : routeResults.length === 0 ? (
                <EmptyState profile={profile} />
              ) : (
                <motion.div
                  variants={staggerList}
                  initial="initial"
                  animate="animate"
                  className="space-y-3"
                >
                  {routeResults.map((result) => (
                    <ResultCard
                      key={result.trail.id}
                      result={result}
                      profile={profile}
                      onPreview={() => selectTrail(result.trail.id)}
                      onStart={() => {
                        startRoute(result.trail);
                        onClose();
                      }}
                    />
                  ))}
                </motion.div>
              )}
            </div>

            <p className="pb-1 text-center text-[10px] leading-relaxed text-slate-400">
              Scores use seeded slope, surface and width data · Region: Marsh Creek
            </p>
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/* results                                                             */
/* ------------------------------------------------------------------ */

function toneFor(score: number): "emerald" | "amber" | "rose" {
  if (score >= 85) return "emerald";
  if (score >= 60) return "amber";
  return "rose";
}

const RING_COLOR = {
  emerald: "#059669",
  amber: "#d97706",
  rose: "#e11d48",
} as const;

const BAR_COLOR = {
  emerald: "bg-emerald-500",
  amber: "bg-amber-500",
  rose: "bg-rose-500",
} as const;

function ScoreRing({ score }: { score: number }) {
  const reduceMotion = useReducedMotion();
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - score / 100);
  const tone = toneFor(score);
  const color = RING_COLOR[tone];

  return (
    <div
      className="relative h-11 w-11 shrink-0"
      role="img"
      aria-label={`Accessibility score ${score} of 100`}
    >
      <svg viewBox="0 0 44 44" className="h-11 w-11 -rotate-90">
        <circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke="#e2e8f0"
          strokeWidth="4"
        />
        <motion.circle
          cx="22"
          cy="22"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: reduceMotion ? offset : circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
        />
      </svg>
      <span
        className="absolute inset-0 grid place-items-center text-[12px] font-bold tabular-nums"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

interface ResultCardProps {
  result: RouteResult;
  profile: MobilityProfile;
  onPreview: () => void;
  onStart: () => void;
}

function ResultCard({ result, profile, onPreview, onStart }: ResultCardProps) {
  const { trail, score, reasons, warnings } = result;
  const tone = toneFor(score);
  const steep = trail.maxSlope > gradeLimitFor(profile);

  return (
    <motion.div variants={staggerItem}>
      <Card
        padded={false}
        hoverLift
        className="relative overflow-hidden rounded-2xl"
      >
        <span
          aria-hidden
          className={cn("absolute inset-y-0 left-0 w-1.5", BAR_COLOR[tone])}
        />

        <div className="py-4 pl-5 pr-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-slate-900">
                {trail.name}
              </h3>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-slate-500">
                <span>{miles(trail.distanceMi)}</span>
                <span className="h-1 w-1 rounded-full bg-slate-300" />
                <span className="inline-flex items-center gap-1">
                  <Clock size={11} />
                  {minutesForMiles(trail.distanceMi, profile)} min
                </span>
              </div>
            </div>
            <ScoreRing score={score} />
          </div>

          <div className="mt-3 flex flex-wrap gap-1.5">
            <Badge tone="slate">{SURFACE_LABEL[trail.surface]}</Badge>
            <Badge tone={steep ? "amber" : "slate"}>{trail.maxSlope}% grade</Badge>
            <Badge tone="slate">{trail.widthIn} in</Badge>
            {trail.loop && (
              <Badge tone="slate" icon={<RotateCw size={10} />}>
                Loop
              </Badge>
            )}
          </div>

          {reasons.length > 0 && (
            <ul className="mt-3 space-y-1">
              {reasons.slice(0, 2).map((reason) => (
                <li
                  key={reason}
                  className="flex items-start gap-1.5 text-xs leading-snug text-slate-600"
                >
                  <Check
                    size={12}
                    className="mt-0.5 shrink-0 text-emerald-600"
                  />
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          )}

          {warnings.length > 0 && (
            <div className="mt-2.5 flex items-start gap-1.5 rounded-lg border border-amber-200/70 bg-amber-50 px-2.5 py-2 text-[11px] font-medium leading-snug text-amber-700">
              <TriangleAlert size={12} className="mt-px shrink-0" />
              <div className="space-y-0.5">
                {warnings.slice(0, 2).map((warning) => (
                  <p key={warning}>{warning}</p>
                ))}
              </div>
            </div>
          )}

          <div className="mt-3 flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              className="flex-1"
              onClick={onPreview}
            >
              Preview
            </Button>
            <Button size="sm" className="flex-1" onClick={onStart}>
              Start
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

function LoadingShimmer() {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Scoring trails">
      {[0, 1, 2].map((row) => (
        <div
          key={row}
          className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm shadow-slate-200/50"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="h-3.5 w-32 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
            </div>
            <div className="h-11 w-11 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-3 flex gap-1.5">
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
            <div className="h-5 w-16 animate-pulse rounded-full bg-slate-100" />
            <div className="h-5 w-14 animate-pulse rounded-full bg-slate-100" />
          </div>
          <div className="mt-3 h-3 w-4/5 animate-pulse rounded bg-slate-100" />
          <div className="mt-1.5 h-3 w-3/5 animate-pulse rounded bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ profile }: { profile: MobilityProfile }) {
  if (profile === "wheelchair") {
    return (
      <Card className="border-dashed bg-white p-5 text-center">
        <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-600">
          <Accessibility size={18} />
        </div>
        <p className="mt-3 text-sm font-bold text-slate-900">
          No step-free route matches
        </p>
        <p className="mt-1 text-xs leading-relaxed text-slate-500">
          Try Park Road Trail (paved, 0.6 mi, ADA) — it clears the step-free screen.
        </p>
      </Card>
    );
  }

  return (
    <Card className="border-dashed bg-white p-5 text-center">
      <div className="mx-auto grid h-10 w-10 place-items-center rounded-xl bg-slate-100 text-slate-500">
        <Route size={18} />
      </div>
      <p className="mt-3 text-sm font-bold text-slate-900">No routes match</p>
      <p className="mt-1 text-xs leading-relaxed text-slate-500">
        Try turning off Loop only or Avoid steep grades.
      </p>
    </Card>
  );
}
