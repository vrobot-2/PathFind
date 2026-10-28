import { motion } from "framer-motion";
import {
  Accessibility,
  Camera,
  CircleCheck,
  Flag,
  PawPrint,
  TriangleAlert,
} from "lucide-react";
import { Badge, type BadgeTone } from "../../components/ui/Badge";
import { cn, timeAgo } from "../../lib/utils";
import { pressable } from "../../motion/presets";
import type { Report, ReportCategory, ReportStatus, Severity } from "../../types";

const CATEGORY_META: Record<
  ReportCategory,
  { icon: typeof TriangleAlert; label: string; chip: string }
> = {
  hazard: {
    icon: TriangleAlert,
    label: "Hazard",
    chip: "border-rose-200/60 bg-rose-50 text-rose-600",
  },
  scenic: {
    icon: Camera,
    label: "Scenic",
    chip: "border-emerald-200/60 bg-emerald-50 text-emerald-600",
  },
  wildlife: {
    icon: PawPrint,
    label: "Wildlife",
    chip: "border-indigo-200/60 bg-indigo-50 text-indigo-600",
  },
  accessibility: {
    icon: Accessibility,
    label: "Accessibility",
    chip: "border-amber-200/60 bg-amber-50 text-amber-600",
  },
};

const SEVERITY_META: Record<Severity, { label: string; tone: BadgeTone }> = {
  low: { label: "Low", tone: "slate" },
  medium: { label: "Medium", tone: "amber" },
  high: { label: "High", tone: "rose" },
};

const STATUS_STEPS: { label: string; status: ReportStatus }[] = [
  { label: "Reported", status: "open" },
  { label: "Ranger assigned", status: "in-progress" },
  { label: "Resolved", status: "resolved" },
];

const STATUS_INDEX: Record<ReportStatus, number> = {
  open: 0,
  "in-progress": 1,
  resolved: 2,
};

/** Compact 3-dot trail: reported → ranger assigned → resolved. */
function ReportStatusTrail({ report }: { report: Report }) {
  const active = STATUS_INDEX[report.status];
  const lastIndex = STATUS_STEPS.length - 1;

  return (
    <div className="mt-1.5 flex items-start">
      {STATUS_STEPS.map((step, index) => {
        const reached = index <= active;
        const current = index === active;
        const timestamp =
          index === 0
            ? timeAgo(report.createdAt)
            : index === lastIndex && report.status === "resolved" && report.resolvedAt
              ? timeAgo(report.resolvedAt)
              : null;

        return (
          <div key={step.status} className="flex min-w-0 flex-1 flex-col items-center">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "h-px flex-1",
                  index === 0 ? "bg-transparent" : reached ? "bg-emerald-500" : "bg-slate-200",
                )}
              />
              <span
                className={cn(
                  "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                  !reached && "bg-slate-200",
                  reached && !current && "bg-emerald-500",
                  current && "bg-emerald-600 ring-2 ring-emerald-100",
                )}
              />
              <span
                className={cn(
                  "h-px flex-1",
                  index === lastIndex
                    ? "bg-transparent"
                    : index < active
                      ? "bg-emerald-500"
                      : "bg-slate-200",
                )}
              />
            </div>
            <span
              className={cn(
                "mt-1 text-center text-[10px] leading-tight",
                current
                  ? "font-semibold text-emerald-800"
                  : reached
                    ? "font-medium text-emerald-700"
                    : "font-medium text-slate-400",
              )}
            >
              {step.label}
            </span>
            <span className="min-h-[11px] text-center text-[9px] leading-[11px] tabular-nums text-slate-400">
              {timestamp}
            </span>
          </div>
        );
      })}
    </div>
  );
}

interface Props {
  reports: Report[];
  onReport: () => void;
}

export function LiveConditions({ reports, onReport }: Props) {
  return (
    <section>
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Live conditions</h3>
        <span className="text-[10px] font-semibold text-slate-400">
          {reports.length === 0 ? "All clear" : `${reports.length} active`}
        </span>
      </div>

      {reports.length === 0 ? (
        <div className="mt-2.5 flex items-center gap-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-emerald-100 text-emerald-700">
            <CircleCheck size={15} />
          </span>
          <div>
            <p className="text-xs font-semibold text-emerald-800">No active conditions reported</p>
            <p className="mt-0.5 text-[10px] text-emerald-700/70">Trail is clear as of today.</p>
          </div>
        </div>
      ) : (
        <ul className="mt-2.5 space-y-1.5">
          {reports.map((report) => {
            const category = CATEGORY_META[report.category];
            const severity = SEVERITY_META[report.severity];
            const Icon = category.icon;
            return (
              <li
                key={report.id}
                className="flex items-center gap-2.5 rounded-xl border border-slate-200/60 bg-white px-2.5 py-2"
              >
                <span
                  className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg border ${category.chip}`}
                  title={category.label}
                >
                  <Icon size={13} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-slate-700">{report.note}</p>
                  <p className="mt-0.5 truncate text-[10px] font-medium text-slate-400">
                    {category.label}
                  </p>
                  <ReportStatusTrail report={report} />
                </div>
                <Badge tone={severity.tone} className="shrink-0 px-2 py-0.5 text-[10px]">
                  {severity.label}
                </Badge>
              </li>
            );
          })}
        </ul>
      )}

      <motion.button
        type="button"
        {...pressable}
        onClick={onReport}
        className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 underline decoration-emerald-300 decoration-2 underline-offset-2 transition-colors hover:text-emerald-900"
      >
        <Flag size={13} />
        Report an issue on this trail
      </motion.button>
    </section>
  );
}
