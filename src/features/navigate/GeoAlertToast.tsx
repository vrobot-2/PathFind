import { motion } from "framer-motion";
import {
  Bird,
  Camera,
  Droplets,
  Landmark,
  Mountain,
  X,
  type LucideIcon,
} from "lucide-react";
import type { FeatureType, TrailFeature } from "../../types";
import { cn } from "../../lib/utils";
import { toastSlide } from "../../motion/presets";

export interface ActiveAlert {
  id: string;
  feature: TrailFeature;
  /** Distance from the simulated walker at the moment the alert fired. */
  distanceMeters: number;
}

interface FeatureMeta {
  icon: LucideIcon;
  /** icon tile classes (bg / text / border) */
  tile: string;
  /** small chip classes for lists */
  chip: string;
}

export const FEATURE_META: Record<FeatureType, FeatureMeta> = {
  scenic: {
    icon: Mountain,
    tile: "border-emerald-200/70 bg-emerald-50 text-emerald-600",
    chip: "bg-emerald-50 text-emerald-700",
  },
  historic: {
    icon: Landmark,
    tile: "border-amber-200/70 bg-amber-50 text-amber-600",
    chip: "bg-amber-50 text-amber-700",
  },
  wildlife: {
    icon: Bird,
    tile: "border-indigo-200/70 bg-indigo-50 text-indigo-600",
    chip: "bg-indigo-50 text-indigo-700",
  },
  water: {
    icon: Droplets,
    tile: "border-blue-200/70 bg-blue-50 text-blue-600",
    chip: "bg-blue-50 text-blue-700",
  },
  photo: {
    icon: Camera,
    tile: "border-rose-200/70 bg-rose-50 text-rose-600",
    chip: "bg-rose-50 text-rose-700",
  },
};

/**
 * Floating glass geo-alert toast.
 * Positioned by the parent (`NavigationOverlay`) via AnimatePresence.
 */
export function GeoAlertToast({
  alert,
  onDismiss,
}: {
  alert: ActiveAlert;
  onDismiss: (id: string) => void;
}) {
  const meta = FEATURE_META[alert.feature.type];
  const Icon = meta.icon;
  const feet = Math.max(5, Math.round((alert.distanceMeters * 3.28084) / 5) * 5);

  return (
    <motion.div
      layout
      variants={toastSlide}
      initial="initial"
      animate="animate"
      exit="exit"
      className={cn(
        "pointer-events-auto flex w-[min(92vw,430px)] items-start gap-3",
        "rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3",
        "shadow-xl shadow-slate-200/60 backdrop-blur-md",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
          meta.tile,
        )}
      >
        <Icon className="h-5 w-5" strokeWidth={2.2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-900">{alert.feature.title}</p>
          <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold tabular-nums text-slate-500">
            {feet} ft
          </span>
        </div>
        <p className="mt-0.5 text-sm leading-snug text-slate-600">{alert.feature.alertText}</p>
      </div>

      <button
        type="button"
        aria-label="Dismiss alert"
        onClick={() => onDismiss(alert.id)}
        className="-mr-1 -mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
