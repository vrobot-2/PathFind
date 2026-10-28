import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Accessibility,
  ArrowUpRight,
  Clock,
  Mountain,
  Route,
  Ruler,
  Users,
  Waypoints,
} from "lucide-react";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import type { CrowdLevel } from "../insights/useTraffic";
import { cn, miles, minutesForMiles } from "../../lib/utils";
import { staggerItem } from "../../motion/presets";
import { useAppStore } from "../../store/useAppStore";
import { SURFACE_LABEL, type Difficulty, type Trail } from "../../types";

const difficultyTone: Record<Difficulty, BadgeTone> = {
  easy: "emerald",
  moderate: "amber",
  hard: "rose",
};

const difficultyLabel: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
};

const statusTone: Record<Trail["status"], BadgeTone> = {
  open: "emerald",
  caution: "amber",
  closed: "rose",
};

const statusLabel: Record<Trail["status"], string> = {
  open: "Open",
  caution: "Caution",
  closed: "Closed",
};

function slopeTone(slope: number): BadgeTone {
  if (slope <= 5) return "emerald";
  if (slope <= 10) return "amber";
  return "rose";
}

function formatSlope(slope: number): string {
  return Number.isInteger(slope) ? `${slope}%` : `${slope.toFixed(1)}%`;
}

const crowdMeta: Record<
  CrowdLevel,
  { label: string; tone: BadgeTone; dot: string }
> = {
  quiet: { label: "Quiet now", tone: "emerald", dot: "bg-emerald-500" },
  steady: { label: "Steady", tone: "amber", dot: "bg-amber-500" },
  busy: { label: "Busy", tone: "rose", dot: "bg-rose-500" },
};

export function TrailCard({
  trail,
  crowd,
}: {
  trail: Trail;
  crowd?: CrowdLevel;
}) {
  const navigate = useNavigate();
  const profile = useAppStore((s) => s.profile);
  const selectTrail = useAppStore((s) => s.selectTrail);
  const minutes = minutesForMiles(trail.distanceMi, profile);

  function open() {
    selectTrail(trail.id);
    navigate("/map");
  }

  return (
    <motion.button
      type="button"
      onClick={open}
      variants={staggerItem}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      aria-label={`Open ${trail.name} on the live map`}
      className={cn(
        "group flex w-full snap-start flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white text-left",
        "shadow-xl shadow-slate-200/50 outline-none transition-colors duration-300 hover:border-emerald-200",
        "focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2",
      )}
    >
      <div className="relative h-40 overflow-hidden bg-gradient-to-br from-emerald-100 via-slate-100 to-sky-100">
        <Mountain
          size={40}
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-emerald-300/70"
          aria-hidden
        />
        <img
          src={trail.photoUrl}
          alt=""
          loading="lazy"
          className="relative h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(event) => {
            event.currentTarget.style.display = "none";
          }}
        />
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-slate-900/5 to-transparent"
          aria-hidden
        />

        <div className="absolute left-3 top-3">
          <Badge
            tone={statusTone[trail.status]}
            className="border-white/50 bg-white/90 backdrop-blur"
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                trail.status === "open"
                  ? "bg-emerald-500"
                  : trail.status === "caution"
                    ? "bg-amber-500"
                    : "bg-rose-500",
              )}
              aria-hidden
            />
            {statusLabel[trail.status]}
          </Badge>
        </div>

        <span className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-full bg-white/90 text-slate-700 shadow-sm backdrop-blur transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
          <ArrowUpRight size={14} aria-hidden />
        </span>

        <div className="absolute bottom-3 left-3 flex items-center gap-2 text-[11px] font-semibold text-white drop-shadow">
          <span className="flex items-center gap-1">
            <Route size={12} aria-hidden />
            {miles(trail.distanceMi)}
          </span>
          <span className="h-1 w-1 rounded-full bg-white/70" aria-hidden />
          <span className="flex items-center gap-1">
            <Clock size={12} aria-hidden />
            {minutes} min
          </span>
          {trail.loop && (
            <>
              <span className="h-1 w-1 rounded-full bg-white/70" aria-hidden />
              <span>Loop</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <h3 className="text-[15px] font-bold tracking-tight text-slate-900">{trail.name}</h3>
        <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-600">
          {trail.description}
        </p>

        <div className="mt-3.5 flex flex-wrap items-center gap-1.5">
          {crowd && (
            <Badge tone={crowdMeta[crowd].tone}>
              <span
                className={cn("h-1.5 w-1.5 rounded-full", crowdMeta[crowd].dot)}
                aria-hidden
              />
              <Users size={11} aria-hidden />
              {crowdMeta[crowd].label}
            </Badge>
          )}
          <Badge tone="slate">{SURFACE_LABEL[trail.surface]}</Badge>
          <Badge tone={slopeTone(trail.maxSlope)}>
            <Ruler size={11} aria-hidden />
            {formatSlope(trail.maxSlope)}
          </Badge>
          <Badge tone="slate">
            <Waypoints size={11} aria-hidden />
            {trail.widthIn} in
          </Badge>
          {trail.wheelchairOk && (
            <Badge tone="emerald" icon={<Accessibility size={12} strokeWidth={2.4} />}>
              Accessible
            </Badge>
          )}
          <Badge tone={difficultyTone[trail.difficulty]}>
            {difficultyLabel[trail.difficulty]}
          </Badge>
        </div>
      </div>
    </motion.button>
  );
}

export function TrailCardSkeleton() {
  return (
    <div className="flex w-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50">
      <div className="h-40 animate-pulse bg-slate-200/70" />
      <div className="space-y-3 p-4">
        <div className="h-4 w-2/3 animate-pulse rounded-full bg-slate-200/80" />
        <div className="h-3 w-full animate-pulse rounded-full bg-slate-100" />
        <div className="h-3 w-4/5 animate-pulse rounded-full bg-slate-100" />
        <div className="flex gap-1.5 pt-1">
          <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
          <div className="h-6 w-12 animate-pulse rounded-full bg-slate-100" />
          <div className="h-6 w-14 animate-pulse rounded-full bg-slate-100" />
        </div>
      </div>
    </div>
  );
}
