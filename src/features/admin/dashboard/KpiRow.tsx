import { useEffect, useRef, useState, type ReactNode } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import {
  Accessibility,
  Clock,
  TriangleAlert,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { cn } from "../../../lib/utils";
import { staggerItem, staggerList } from "../../../motion/presets";
import type { ParkMetrics, Report, Trail } from "../../../types";

interface Props {
  metrics: ParkMetrics;
  trails: Trail[];
  reports: Report[];
}

interface Kpi {
  icon: LucideIcon;
  label: string;
  value: number;
  format: (n: number) => string;
  tile: string;
  iconClass: string;
  footer: ReactNode;
  valueClass?: string;
}

/** matches the ease-out curve used by the rest of the dashboard */
const COUNT_EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];
const COUNT_DURATION = 0.8;

const integerFmt = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
const decimalFmt = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

/**
 * Counts a number up from its previous displayed value (0 on mount) to
 * `value`, formatting every frame through `Intl.NumberFormat`. The final
 * string is rendered invisibly underneath so the glyph box — and therefore
 * the layout — never reflows while digits are ticking.
 */
function AnimatedNumber({ value, format }: { value: number; format: (n: number) => string }) {
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(() => (reduceMotion ? value : 0));
  const displayRef = useRef(display);

  useEffect(() => {
    if (reduceMotion) {
      displayRef.current = value;
      setDisplay(value);
      return;
    }

    const from = displayRef.current;
    if (from === value) return;

    const controls = animate(from, value, {
      duration: COUNT_DURATION,
      ease: COUNT_EASE,
      onUpdate: (latest) => {
        displayRef.current = latest;
        setDisplay(latest);
      },
      onComplete: () => {
        displayRef.current = value;
        setDisplay(value);
      },
    });

    return () => controls.stop();
  }, [value, reduceMotion]);

  return (
    <span className="relative inline-block whitespace-nowrap align-baseline">
      {/* invisible final value reserves the widest glyph box up front and is
          what assistive tech reads (the ticking copy is decorative) */}
      <span className="invisible">{format(value)}</span>
      <span className="absolute left-0 top-0 tabular-nums" aria-hidden="true">
        {format(display)}
      </span>
    </span>
  );
}

export function KpiRow({ metrics, trails, reports }: Props) {
  const totalMi = trails.reduce((sum, trail) => sum + trail.distanceMi, 0);
  const highHazards = reports.filter(
    (r) => r.category === "hazard" && r.severity === "high" && r.status !== "resolved",
  ).length;
  const closedTrails = trails.filter((t) => t.status === "closed").length;

  const kpis: Kpi[] = [
    {
      icon: Users,
      label: "Active visitors today",
      value: metrics.activeVisitors,
      format: (n) => integerFmt.format(Math.round(n)),
      tile: "bg-emerald-50 text-emerald-600",
      iconClass: "text-emerald-600",
      valueClass: "text-slate-900",
      footer: (
        <span className="inline-flex items-center gap-1 text-emerald-700">
          <TrendingUp className="h-3.5 w-3.5" strokeWidth={2.4} />
          <span className="font-semibold tabular-nums">+12%</span>
          <span className="text-slate-500">vs last week</span>
        </span>
      ),
    },
    {
      icon: TriangleAlert,
      label: "Open hazards",
      value: metrics.openHazards,
      format: (n) => integerFmt.format(Math.round(n)),
      tile:
        metrics.openHazards > 0
          ? "bg-rose-50 text-rose-600"
          : "bg-emerald-50 text-emerald-600",
      iconClass: metrics.openHazards > 0 ? "text-rose-600" : "text-emerald-600",
      valueClass: metrics.openHazards > 0 ? "text-rose-600" : "text-slate-900",
      footer:
        metrics.openHazards > 0 ? (
          <span className="flex items-center gap-1.5">
            <span className="font-semibold text-rose-600 tabular-nums">{highHazards} high</span>
            <span className="text-slate-500">severity awaiting triage</span>
          </span>
        ) : (
          <span className="text-emerald-700">No open hazards — all clear</span>
        ),
    },
    {
      icon: Clock,
      label: "Avg response time",
      value: metrics.avgResponseHrs,
      format: (n) => `${decimalFmt.format(n)}h`,
      tile: "bg-indigo-50 text-indigo-600",
      iconClass: "text-indigo-600",
      footer: (
        <span className="flex items-center gap-1.5">
          <Badge tone="emerald" className="px-2 py-0.5 text-[10px]">
            Target &lt; 4h
          </Badge>
          <span className="text-slate-500">median this week</span>
        </span>
      ),
    },
    {
      icon: Accessibility,
      label: "Accessible trail miles",
      value: metrics.accessibleTrailMi,
      format: (n) => `${decimalFmt.format(n)} mi`,
      tile: "bg-emerald-50 text-emerald-600",
      iconClass: "text-emerald-600",
      footer: (
        <span className="text-slate-500">
          of{" "}
          <span className="font-semibold tabular-nums text-slate-700">
            {decimalFmt.format(totalMi)} mi
          </span>{" "}
          mapped
          {closedTrails > 0 && (
            <span className="text-amber-600"> · {closedTrails} closed</span>
          )}
        </span>
      ),
    },
  ];

  return (
    <motion.div
      variants={staggerList}
      initial="initial"
      animate="animate"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
    >
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <Card
            key={kpi.label}
            hoverLift
            padded={false}
            variants={staggerItem}
            className="flex flex-col justify-between p-5"
          >
            <div className="flex items-start justify-between gap-3">
              <div className={cn("grid h-10 w-10 place-items-center rounded-xl", kpi.tile)}>
                <Icon className={cn("h-5 w-5", kpi.iconClass)} strokeWidth={2.1} />
              </div>
            </div>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-slate-500">
              {kpi.label}
            </p>
            <p
              className={cn(
                "mt-1 text-3xl font-extrabold tracking-tight tabular-nums",
                kpi.valueClass ?? "text-slate-900",
              )}
            >
              <AnimatedNumber value={kpi.value} format={kpi.format} />
            </p>
            <div className="mt-3 text-xs leading-relaxed">{kpi.footer}</div>
          </Card>
        );
      })}
    </motion.div>
  );
}
