import { motion } from "framer-motion";
import { Accessibility, CheckCircle2, Loader2, TriangleAlert, Ban } from "lucide-react";
import { Card } from "../../../components/ui/Card";
import { cn } from "../../../lib/utils";
import type { Trail, TrailStatus } from "../../../types";

interface Props {
  trails: Trail[];
  /** trail ids whose PATCH request is still in flight */
  pending: string[];
  onCycle: (trail: Trail) => void;
}

const STATUS_STYLE: Record<
  TrailStatus,
  { label: string; pill: string; icon: typeof CheckCircle2 }
> = {
  open: {
    label: "Open",
    pill: "border-emerald-200/80 bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
    icon: CheckCircle2,
  },
  caution: {
    label: "Caution",
    pill: "border-amber-200/80 bg-amber-50 text-amber-700 hover:bg-amber-100",
    icon: TriangleAlert,
  },
  closed: {
    label: "Closed",
    pill: "border-rose-200/80 bg-rose-50 text-rose-700 hover:bg-rose-100",
    icon: Ban,
  },
};

const NEXT_LABEL: Record<TrailStatus, string> = {
  open: "caution",
  caution: "closed",
  closed: "open",
};

export function TrailStatusCard({ trails, pending, onCycle }: Props) {
  const openCount = trails.filter((t) => t.status === "open").length;
  const cautionCount = trails.filter((t) => t.status === "caution").length;
  const closedCount = trails.filter((t) => t.status === "closed").length;

  return (
    <Card padded={false} className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
      <div className="border-b border-slate-200/70 px-5 py-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Trail status
          </h2>
          <div className="flex items-center gap-2 text-[10px] font-semibold tabular-nums">
            <span className="text-emerald-700">{openCount} open</span>
            <span className="text-amber-700">{cautionCount} caution</span>
            <span className="text-rose-700">{closedCount} closed</span>
          </div>
        </div>
        <p className="mt-1 text-sm text-slate-600">
          Click a status to cycle open → caution → closed
        </p>
      </div>

      <ul className="min-h-0 flex-1 divide-y divide-slate-100 overflow-y-auto no-scrollbar">
        {trails.map((trail) => {
          const style = STATUS_STYLE[trail.status];
          const StatusIcon = style.icon;
          const isPending = pending.includes(trail.id);
          return (
            <li
              key={trail.id}
              className="flex items-center gap-3 px-5 py-2.5 transition-colors hover:bg-slate-50/80"
            >
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 truncate text-sm font-medium text-slate-900">
                  <span className="truncate">{trail.name}</span>
                  {trail.wheelchairOk && (
                    <Accessibility
                      className="h-3.5 w-3.5 shrink-0 text-emerald-600"
                      strokeWidth={2.2}
                      aria-label="Wheelchair accessible"
                    />
                  )}
                </p>
                <p className="mt-0.5 text-[11px] capitalize text-slate-400 tabular-nums">
                  {trail.surface.replace("-", " ")} · {trail.distanceMi.toFixed(1)} mi
                </p>
              </div>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onCycle(trail)}
                disabled={isPending}
                aria-label={`${trail.name}: ${trail.status}. Click to set ${NEXT_LABEL[trail.status]}.`}
                className={cn(
                  "inline-flex h-8 w-[104px] shrink-0 items-center justify-center gap-1.5 rounded-full border px-2.5 text-xs font-semibold transition-colors",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-1",
                  style.pill,
                  isPending && "opacity-70",
                )}
              >
                {isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2.4} />
                ) : (
                  <motion.span
                    key={trail.status}
                    initial={{ scale: 0.6, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: "spring", stiffness: 420, damping: 24 }}
                    className="inline-flex"
                  >
                    <StatusIcon className="h-3.5 w-3.5" strokeWidth={2.4} />
                  </motion.span>
                )}
                {style.label}
              </motion.button>
            </li>
          );
        })}
        {trails.length === 0 && (
          <li className="px-5 py-10 text-center text-sm text-slate-400">No trails found.</li>
        )}
      </ul>

      <div className="border-t border-slate-200/70 px-5 py-3 text-[11px] text-slate-400">
        Changes publish to the visitor map immediately.
      </div>
    </Card>
  );
}
