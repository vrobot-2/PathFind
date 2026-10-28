import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Accessibility,
  ArrowRight,
  Bird,
  Mountain,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Badge, type BadgeTone } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { cn, timeAgo } from "../../../lib/utils";
import { staggerItem, staggerList } from "../../../motion/presets";
import type { Report, ReportCategory, ReportStatus, Severity, Trail } from "../../../types";
import { LiveDot } from "./DashboardHeader";

interface Props {
  reports: Report[];
  trails: Trail[];
}

const CATEGORY: Record<
  ReportCategory,
  { icon: LucideIcon; tile: string; label: string }
> = {
  hazard: { icon: TriangleAlert, tile: "bg-rose-50 text-rose-600", label: "Hazard" },
  accessibility: {
    icon: Accessibility,
    tile: "bg-amber-50 text-amber-600",
    label: "Accessibility",
  },
  scenic: { icon: Mountain, tile: "bg-emerald-50 text-emerald-600", label: "Scenic" },
  wildlife: { icon: Bird, tile: "bg-indigo-50 text-indigo-600", label: "Wildlife" },
};

const SEVERITY: Record<Severity, { tone: BadgeTone; label: string }> = {
  low: { tone: "slate", label: "Low" },
  medium: { tone: "amber", label: "Medium" },
  high: { tone: "rose", label: "High" },
};

const STATUS: Record<ReportStatus, { tone: BadgeTone; label: string }> = {
  open: { tone: "rose", label: "Open" },
  "in-progress": { tone: "indigo", label: "In progress" },
  resolved: { tone: "emerald", label: "Resolved" },
};

export function LiveFeedCard({ reports, trails }: Props) {
  const trailNames = new Map(trails.map((trail) => [trail.id, trail.name]));
  const newest = [...reports]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  return (
    <Card padded={false} className="flex h-full min-w-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-5 py-4">
        <div className="flex items-center gap-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Live report feed
          </h2>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/70 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-emerald-700">
            <LiveDot className="h-1.5 w-1.5" />
            Live
          </span>
        </div>
        <Link
          to="/admin/reports"
          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 transition-colors hover:text-emerald-900"
        >
          View all
          <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.4} />
        </Link>
      </div>

      {newest.length === 0 ? (
        <p className="px-5 py-10 text-center text-sm text-slate-400">No reports yet.</p>
      ) : (
        <motion.ul
          variants={staggerList}
          initial="initial"
          animate="animate"
          className="divide-y divide-slate-100"
        >
          {newest.map((report) => {
            const category = CATEGORY[report.category];
            const severity = SEVERITY[report.severity];
            const status = STATUS[report.status];
            const Icon = category.icon;
            const trailName = trailNames.get(report.trailId) ?? report.trailId;
            return (
              <motion.li key={report.id} variants={staggerItem}>
                <div className="group flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-slate-50/80">
                  <span
                    className={cn(
                      "mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-xl",
                      category.tile,
                    )}
                  >
                    <Icon className="h-[18px] w-[18px]" strokeWidth={2.1} />
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-slate-900" title={report.note}>
                      {report.note}
                    </p>
                    <p className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-slate-500">
                      <span className="truncate font-medium text-slate-600">{trailName}</span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="tabular-nums">{timeAgo(report.createdAt)}</span>
                      <span className="text-slate-300" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-slate-400">{category.label}</span>
                    </p>
                  </div>

                  <div className="hidden shrink-0 items-center gap-1.5 sm:flex">
                    <Badge tone={severity.tone} className="px-2 py-0.5 text-[10px]">
                      {severity.label}
                    </Badge>
                    <Badge tone={status.tone} className="px-2 py-0.5 text-[10px]">
                      {status.label}
                    </Badge>
                  </div>

                  <Link
                    to="/admin/reports"
                    className="inline-flex shrink-0 items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-slate-500 transition-colors hover:bg-white hover:text-emerald-700 hover:shadow-sm"
                    aria-label={`Open report: ${report.note}`}
                  >
                    Open
                    <ArrowRight className="h-3 w-3" strokeWidth={2.6} />
                  </Link>
                </div>
              </motion.li>
            );
          })}
        </motion.ul>
      )}

      <div className="mt-auto flex items-center justify-between gap-2 border-t border-slate-200/70 px-5 py-3 text-[11px] text-slate-400">
        <span>Newest {newest.length} submissions</span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-1 w-1 rounded-full bg-emerald-500" />
          Auto-refreshing every 10s
        </span>
      </div>
    </Card>
  );
}
