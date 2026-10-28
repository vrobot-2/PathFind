import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Accessibility, ArrowRight, Bike, Footprints, TriangleAlert, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { PROFILE_LABEL, SURFACE_LABEL, type MobilityProfile, type Trail } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { Button } from "../../components/ui/Button";
import { cn, miles } from "../../lib/utils";
import { panelSpring } from "../../motion/presets";

const MODES: {
  id: MobilityProfile;
  icon: typeof Footprints;
  label: string;
  hint: string;
}[] = [
  { id: "walker", icon: Footprints, label: "Walking", hint: "Hiking pace, any tread" },
  { id: "biker", icon: Bike, label: "Biking", hint: "Bike-permitted, wider tread" },
  {
    id: "wheelchair",
    icon: Accessibility,
    label: "Wheelchair",
    hint: "Step-free, paved, ≤5% grade",
  },
];

export interface TrailFit {
  ok: boolean;
  problems: string[];
}

/** Explain WHY a trail may not suit the chosen travel mode. */
export function checkFit(trail: Trail, mode: MobilityProfile): TrailFit {
  const problems: string[] = [];

  if (trail.status === "closed") problems.push("This trail is currently closed.");

  if (mode === "wheelchair") {
    if (!trail.wheelchairOk) problems.push("Not rated wheelchair accessible.");
    if (trail.maxSlope > 5)
      problems.push(`${trail.maxSlope}% max grade — above the 5% step-free limit.`);
    if (trail.widthIn < 36)
      problems.push(`Only ${trail.widthIn} in wide — 36 in is the accessible minimum.`);
    if (trail.surface === "rocky" || trail.surface === "packed-dirt")
      problems.push(`${SURFACE_LABEL[trail.surface]} surface — uneven and hard to roll.`);
  }

  if (mode === "biker") {
    if (!trail.bikeOk) problems.push("Bikes are not permitted on this trail.");
    if (trail.maxSlope > 15)
      problems.push(`${trail.maxSlope}% max grade — very steep for riding.`);
    if (trail.widthIn < 24)
      problems.push(`Only ${trail.widthIn} in wide — tight for handlebars.`);
  }

  if (mode === "walker") {
    if (!trail.walkerOk) problems.push("Hiking is not permitted on this trail.");
    if (trail.maxSlope > 18)
      problems.push(`${trail.maxSlope}% max grade — sustained steep climb.`);
  }

  if (trail.status === "caution") problems.push("Trail is marked “use caution” right now.");

  return { ok: problems.length === 0, problems };
}

export default function StartRouteDialog() {
  const pendingStart = useAppStore((s) => s.pendingStart);
  const profile = useAppStore((s) => s.profile);
  const cancelStart = useAppStore((s) => s.cancelStart);
  const confirmStart = useAppStore((s) => s.confirmStart);

  const [mode, setMode] = useState<MobilityProfile | null>(null);
  const activeMode = mode ?? profile;
  const trail = pendingStart;
  const fit = trail ? checkFit(trail, activeMode) : null;

  return (
    <AnimatePresence onExitComplete={() => setMode(null)}>
      {trail && (
        <motion.div
          className="fixed inset-0 z-[1100] flex items-end justify-center p-3 sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/30 backdrop-blur-[3px]"
            onClick={cancelStart}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="start-route-title"
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: panelSpring }}
            exit={{ opacity: 0, y: 16, scale: 0.98, transition: { duration: 0.18 } }}
            className="relative z-10 flex max-h-[92dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20"
          >
            <motion.button
              type="button"
              onClick={cancelStart}
              aria-label="Close"
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.94 }}
              className="absolute right-2.5 top-2.5 z-20 grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 sm:right-3 sm:top-3"
            >
              <X size={18} />
            </motion.button>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-3 pt-5 sm:px-6 sm:pt-6">
              <p className="pr-14 text-[11px] font-bold uppercase tracking-[0.14em] text-emerald-700">
                Start route
              </p>
              <h2
                id="start-route-title"
                className="mt-1 min-w-0 pr-14 text-xl font-extrabold tracking-tight text-slate-900"
              >
                How are you travelling?
              </h2>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge tone="slate">{trail.name}</Badge>
                <Badge tone="slate">
                  {miles(trail.distanceMi)} · {SURFACE_LABEL[trail.surface]}
                </Badge>
              </div>

              <div className="mt-4 grid gap-2">
                {MODES.map((item) => {
                  const Icon = item.icon;
                  const active = activeMode === item.id;
                  return (
                    <motion.button
                      key={item.id}
                      type="button"
                      onClick={() => setMode(item.id)}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      aria-pressed={active}
                      className={cn(
                        "flex min-h-[56px] items-center gap-3 rounded-2xl border-2 px-3.5 py-3 text-left transition-colors",
                        active
                          ? "border-emerald-700 bg-emerald-50"
                          : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50",
                      )}
                    >
                      <span
                        className={cn(
                          "grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                          active ? "bg-emerald-900 text-white" : "bg-slate-100 text-slate-600",
                        )}
                      >
                        <Icon size={17} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-sm font-bold text-slate-900">{item.label}</span>
                        <span className="block text-xs text-slate-500">{item.hint}</span>
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              {fit && !fit.ok && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-3"
                >
                  <p className="flex items-center gap-1.5 text-xs font-bold text-amber-800">
                    <TriangleAlert size={14} /> Not recommended for {PROFILE_LABEL[activeMode].toLowerCase()}
                  </p>
                  <ul className="mt-1.5 space-y-1 pl-5 text-[11px] font-medium leading-relaxed text-amber-800/90">
                    {fit.problems.slice(0, 3).map((problem) => (
                      <li key={problem} className="list-disc">
                        {problem}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}

              {fit && fit.ok && (
                <p className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-[11px] font-semibold text-emerald-800">
                  Good match — {trail.maxSlope}% max grade, {trail.widthIn} in wide,{" "}
                  {SURFACE_LABEL[trail.surface].toLowerCase()}.
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-col-reverse gap-2 border-t border-slate-200/80 bg-white px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 sm:flex-row sm:items-center sm:px-6 sm:py-4">
              <Button
                variant="secondary"
                onClick={cancelStart}
                className="h-11 w-full shrink-0 sm:flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => confirmStart(activeMode)}
                className="h-11 w-full whitespace-nowrap sm:flex-1"
                variant={fit && !fit.ok ? "amber" : "primary"}
              >
                {fit && !fit.ok ? "Start anyway" : "Start route"}
                <ArrowRight size={15} />
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
