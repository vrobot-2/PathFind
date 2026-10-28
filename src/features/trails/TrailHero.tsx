import { motion } from "framer-motion";
import { RotateCw, Route, Star, Timer, TreePine, TrendingUp } from "lucide-react";
import { useMemo, type ReactNode } from "react";
import type { MobilityProfile, Trail } from "../../types";
import { minutesForMiles, miles } from "../../lib/utils";
import { useAppStore } from "../../store/useAppStore";
import { DIFFICULTY_META, STATUS_META } from "./trailDetail";

interface Props {
  trail: Trail;
  profile: MobilityProfile;
}

function QuickFact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {icon}
      {children}
    </span>
  );
}

export function TrailHero({ trail, profile }: Props) {
  const status = STATUS_META[trail.status];
  const difficulty = DIFFICULTY_META[trail.difficulty];
  const estMinutes = minutesForMiles(trail.distanceMi, profile);
  const reviews = useAppStore((s) => s.reviews);

  const rating = useMemo(() => {
    const trailReviews = reviews.filter((review) => review.trailId === trail.id);
    if (trailReviews.length === 0) return null;
    const total = trailReviews.reduce((sum, review) => sum + review.rating, 0);
    return { average: total / trailReviews.length, count: trailReviews.length };
  }, [reviews, trail.id]);

  return (
    <motion.div>
      <div className="relative h-40 w-full overflow-hidden rounded-xl border border-slate-200/60 bg-slate-100">
        <div className="absolute inset-0 grid place-items-center bg-gradient-to-br from-emerald-100 via-slate-100 to-slate-200">
          <TreePine size={38} className="text-emerald-700/20" />
        </div>
        <img
          src={trail.photoUrl}
          alt={trail.name}
          className="relative h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.opacity = "0";
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-900/40 via-slate-900/5 to-transparent" />

        <div className="absolute left-3 top-3">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm shadow-slate-900/10 backdrop-blur-sm ${status.pill}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
            {status.label}
          </span>
        </div>

        <div className="absolute right-3 top-3">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm shadow-slate-900/10 backdrop-blur-sm ${difficulty.pill}`}
          >
            {difficulty.label}
          </span>
        </div>
      </div>

      <div className="mt-3">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h2 className="text-xl font-extrabold tracking-tight text-slate-900">{trail.name}</h2>
          {rating ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-amber-200/70 bg-amber-50 px-2 py-0.5 text-[11px] font-bold leading-none text-amber-700"
              aria-label={`Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} reviews`}
            >
              <Star size={11} aria-hidden="true" className="fill-amber-500 text-amber-500" />
              <span className="tabular-nums">{rating.average.toFixed(1)}</span>
              <span className="font-medium text-amber-600/80">({rating.count})</span>
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-sm leading-relaxed text-slate-600">{trail.description}</p>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-slate-600">
          <QuickFact icon={<Route size={14} className="text-emerald-600" />}>{miles(trail.distanceMi)}</QuickFact>
          <QuickFact icon={<Timer size={14} className="text-emerald-600" />}>~{estMinutes} min</QuickFact>
          <QuickFact icon={<TrendingUp size={14} className="text-emerald-600" />}>+{trail.elevationFt} ft</QuickFact>
          <QuickFact
            icon={
              <RotateCw size={14} className={trail.loop ? "text-emerald-600" : "text-slate-400"} />
            }
          >
            {trail.loop ? "Loop" : "Out & back"}
          </QuickFact>
        </div>
      </div>
    </motion.div>
  );
}
