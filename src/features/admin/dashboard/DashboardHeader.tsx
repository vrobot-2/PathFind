import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, Download, Siren } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../../components/ui/Button";
import { cn } from "../../../lib/utils";

interface Props {
  /** when the last successful fetch completed */
  lastUpdated: Date;
  /** true while a background refresh is in flight */
  refreshing: boolean;
}

function updatedLabel(lastUpdated: Date, now: number): string {
  const secs = Math.max(0, Math.floor((now - lastUpdated.getTime()) / 1000));
  if (secs < 4) return "just now";
  if (secs < 60) return `${secs}s ago`;
  const mins = Math.floor(secs / 60);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  return hrs === 1 ? "1 hr ago" : `${hrs} hr ago`;
}

/** Live pulse dot shared by the header and the live feed. */
export function LiveDot({ className }: { className?: string }) {
  return (
    <span className={cn("relative flex h-2 w-2", className)} aria-hidden="true">
      <motion.span
        className="absolute inline-flex h-full w-full rounded-full bg-emerald-500"
        animate={{ scale: [1, 2.2, 1], opacity: [0.5, 0, 0.5] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      />
      <span className="relative inline-flex h-full w-full rounded-full bg-emerald-500" />
    </span>
  );
}

export function DashboardHeader({ lastUpdated, refreshing }: Props) {
  const navigate = useNavigate();
  const [exported, setExported] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* Tick the "updated Xs ago" label once a second. */
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(interval);
  }, []);

  /* A successful poll hands us a fresh date — restart the counter at zero. */
  useEffect(() => {
    setNow(Date.now());
  }, [lastUpdated]);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  function handleExport() {
    setExported(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setExported(false), 2600);
  }

  const today = new Date();
  const dateChip = today.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <header className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">
          Marsh Creek State Park · Chester County
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900">
          Park operations
        </h1>
        <p className="mt-1.5 text-sm text-slate-600">
          Live trail usage, hazards and response performance.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2.5">
        <span className="inline-flex h-9 items-center rounded-xl border border-slate-200/80 bg-white px-3 text-xs font-semibold tabular-nums text-slate-600 shadow-sm shadow-slate-200/60">
          {dateChip}
        </span>

        <span className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl border border-emerald-200/70 bg-emerald-50/70 px-3 text-xs font-semibold text-emerald-700">
          <LiveDot />
          Last updated{" "}
          <span className="tabular-nums">{updatedLabel(lastUpdated, now)}</span>
          {refreshing && <span className="h-1 w-1 animate-pulse rounded-full bg-emerald-500" />}
        </span>

        <div className="flex items-center gap-2.5">
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              {exported ? (
                <Check className="h-4 w-4 text-emerald-600" strokeWidth={2.4} />
              ) : (
                <Download className="h-4 w-4" strokeWidth={2.2} />
              )}
              {exported ? "CSV queued" : "Export CSV"}
            </Button>
            {exported && (
              <motion.span
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.18 }}
                className="absolute right-0 top-full z-20 mt-2 whitespace-nowrap rounded-lg border border-emerald-200/80 bg-white px-2.5 py-1.5 text-[11px] font-medium text-emerald-700 shadow-lg shadow-slate-900/10"
                role="status"
              >
                Snapshot queued for download
              </motion.span>
            )}
          </div>
          <Button variant="primary" size="sm" onClick={() => navigate("/admin/reports")}>
            <Siren className="h-4 w-4" strokeWidth={2.2} />
            Triage queue
            <span aria-hidden="true">→</span>
          </Button>
        </div>

      </div>
    </header>
  );
}
