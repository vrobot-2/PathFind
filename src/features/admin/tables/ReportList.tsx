import { motion } from "framer-motion";
import { MapPin, ThumbsUp } from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { cn, timeAgo } from "../../../lib/utils";
import { staggerItem, staggerList } from "../../../motion/presets";
import type { Report } from "../../../types";
import { CATEGORY_META, SEVERITY_META, STATUS_META } from "./meta";

interface Props {
  reports: Report[];
  trailName: (trailId: string) => string;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function ReportList({ reports, trailName, selectedId, onSelect }: Props) {
  return (
    <motion.div
      variants={staggerList}
      initial="initial"
      animate="animate"
      className="space-y-2.5"
    >
      {reports.map((report) => {
        const category = CATEGORY_META[report.category];
        const severity = SEVERITY_META[report.severity];
        const status = STATUS_META[report.status];
        const Icon = category.icon;
        const selected = report.id === selectedId;

        return (
          <motion.button
            key={report.id}
            type="button"
            layout
            variants={staggerItem}
            onClick={() => onSelect(report.id)}
            aria-pressed={selected}
            className={cn(
              "group relative w-full overflow-hidden rounded-2xl border px-4 py-3.5 text-left transition-colors duration-200 sm:px-5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:ring-offset-2",
              selected
                ? "border-emerald-300 bg-emerald-50/50 ring-2 ring-emerald-500/40"
                : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60",
            )}
          >
            <span
              aria-hidden
              className={cn("absolute inset-y-0 left-0 w-1", category.rail)}
            />

            <div className="flex gap-3 pl-1">
              <span
                className={cn(
                  "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border",
                  category.tile,
                )}
              >
                <Icon size={16} strokeWidth={2.2} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-900">
                    {report.note}
                  </p>
                  <span className="flex shrink-0 items-center gap-1 pt-0.5 text-xs font-semibold tabular-nums text-slate-500">
                    <ThumbsUp size={12} aria-hidden />
                    {report.upvotes}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1.5 text-xs text-slate-500">
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={12} className="text-slate-400" aria-hidden />
                    <span className="max-w-[12rem] truncate font-medium text-slate-600">
                      {trailName(report.trailId)}
                    </span>
                  </span>
                  <span aria-hidden className="text-slate-300">
                    ·
                  </span>
                  <span className="tabular-nums">{timeAgo(report.createdAt)}</span>
                  <Badge tone={severity.tone} className="px-2 py-0.5">
                    {severity.label}
                  </Badge>
                  <Badge
                    tone={status.tone}
                    className="px-2 py-0.5"
                    icon={<span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />}
                  >
                    {status.label}
                  </Badge>
                </div>
              </div>
            </div>
          </motion.button>
        );
      })}
    </motion.div>
  );
}
