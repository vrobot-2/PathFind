import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowBigUp, ChevronDown, MapPin, RefreshCw } from "lucide-react";
import type { ReportCategory } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { Badge } from "../../components/ui/Badge";
import { cn, timeAgo } from "../../lib/utils";
import { panelSlideIn, softSpring, staggerItem, staggerList } from "../../motion/presets";
import { CATEGORY_META, SEVERITY_META } from "./categoryMeta";

type FeedFilter = "all" | ReportCategory;

const FILTERS: { id: FeedFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hazard", label: "Hazards" },
  { id: "scenic", label: "Scenic" },
  { id: "wildlife", label: "Wildlife" },
  { id: "accessibility", label: "Access" },
];

export function ReportsFeedPanel() {
  const reports = useAppStore((s) => s.reports);
  const reportsLoading = useAppStore((s) => s.reportsLoading);
  const loadReports = useAppStore((s) => s.loadReports);
  const upvoteReport = useAppStore((s) => s.upvoteReport);
  const trails = useAppStore((s) => s.trails);

  const [filter, setFilter] = useState<FeedFilter>("all");
  const [collapsed, setCollapsed] = useState(false);
  const [upvotingIds, setUpvotingIds] = useState<Record<string, boolean>>({});

  const visible = filter === "all" ? reports : reports.filter((r) => r.category === filter);

  async function handleUpvote(id: string) {
    if (upvotingIds[id]) return;
    setUpvotingIds((prev) => ({ ...prev, [id]: true }));
    try {
      await upvoteReport(id);
    } catch {
      /* keep the feed quiet if a vote fails */
    } finally {
      setUpvotingIds((prev) => ({ ...prev, [id]: false }));
    }
  }

  return (
    <motion.div
      variants={panelSlideIn}
      initial="initial"
      animate="animate"
      className="pointer-events-auto w-[340px] overflow-hidden rounded-2xl border border-slate-200/80 bg-white/95 shadow-xl shadow-slate-200/50 backdrop-blur-md"
    >
      {/* header */}
      <div className="flex items-center gap-2 px-3.5 py-3">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
          aria-expanded={!collapsed}
          className="flex min-w-0 flex-1 items-center gap-2 rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
        >
          <h3 className="truncate text-sm font-bold tracking-tight text-slate-900">
            Community reports
          </h3>
          <Badge tone="slate" className="!px-2 !py-0.5 !text-[11px]">
            {reports.length}
          </Badge>
          <motion.span
            animate={{ rotate: collapsed ? -90 : 0 }}
            transition={{ duration: 0.2 }}
            className="ml-auto grid h-6 w-6 shrink-0 place-items-center rounded-full text-slate-400"
          >
            <ChevronDown size={15} />
          </motion.span>
        </button>
        {!collapsed && (
          <motion.button
            type="button"
            onClick={() => void loadReports()}
            disabled={reportsLoading}
            aria-label="Refresh reports"
            whileHover={{ scale: 1.06 }}
            whileTap={{ scale: 0.94 }}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900 disabled:opacity-60"
          >
            <RefreshCw size={14} className={cn(reportsLoading && "animate-spin")} />
          </motion.button>
        )}
      </div>

      {/* body */}
      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="flex flex-wrap items-center gap-1.5 px-3.5 pb-2.5">
              {FILTERS.map((item) => {
                const active = filter === item.id;
                return (
                  <motion.button
                    key={item.id}
                    type="button"
                    onClick={() => setFilter(item.id)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30",
                      active
                        ? "border-emerald-900 bg-emerald-900 text-white shadow-sm shadow-emerald-900/15"
                        : "border-slate-200/80 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-800",
                    )}
                  >
                    {item.label}
                  </motion.button>
                );
              })}
            </div>

            <div className="max-h-[46vh] overflow-y-auto px-2 pb-2">
              {visible.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-2 px-4 py-10 text-center">
                  <span className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                    <MapPin size={18} />
                  </span>
                  <p className="text-sm font-semibold text-slate-600">
                    {reports.length === 0
                      ? "No reports yet — be the first"
                      : "Nothing here yet — try another filter"}
                  </p>
                  <p className="text-xs font-medium text-slate-400">
                    {reports.length === 0
                      ? "Drop a pin on the map to share what you find."
                      : "Other categories may have fresh updates."}
                  </p>
                </div>
              ) : (
                <motion.div
                  key={filter}
                  variants={staggerList}
                  initial="initial"
                  animate="animate"
                  className="space-y-0.5"
                >
                  {visible.map((report) => {
                    const meta = CATEGORY_META[report.category];
                    const severity = SEVERITY_META[report.severity];
                    const Icon = meta.icon;
                    const trail = trails.find((t) => t.id === report.trailId);
                    const upvoting = Boolean(upvotingIds[report.id]);
                    const count = report.upvotes + (upvoting ? 1 : 0);

                    return (
                      <motion.div
                        key={report.id}
                        variants={staggerItem}
                        layout
                        className="flex items-start gap-2.5 rounded-xl p-2 transition-colors duration-200 hover:bg-slate-50"
                      >
                        <span
                          className={cn(
                            "mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg",
                            meta.tile,
                          )}
                        >
                          <Icon size={15} strokeWidth={2.2} />
                        </span>

                        <div className="min-w-0 flex-1">
                          <p className="line-clamp-2 text-sm font-medium leading-snug text-slate-800">
                            {report.note}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-[11px] font-medium text-slate-400">
                            <span className="max-w-[128px] truncate">
                              {trail?.name ?? "Unknown trail"}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="whitespace-nowrap">{timeAgo(report.createdAt)}</span>
                            <Badge tone={severity.tone} className="!px-1.5 !py-0.5 !text-[10px]">
                              {severity.label}
                            </Badge>
                          </div>
                        </div>

                        <motion.button
                          type="button"
                          onClick={() => void handleUpvote(report.id)}
                          disabled={upvoting}
                          aria-label={`Upvote report (${report.upvotes} votes)`}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.94 }}
                          className={cn(
                            "mt-0.5 flex h-8 shrink-0 items-center gap-0.5 rounded-full border px-2 text-xs font-semibold tabular-nums transition-colors duration-200",
                            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30 disabled:opacity-70",
                            upvoting
                              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                              : "border-slate-200/80 bg-white text-slate-500 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700",
                          )}
                        >
                          <motion.span
                            animate={
                              upvoting
                                ? { y: [-1, -3, 0], scale: [1, 1.2, 1] }
                                : { y: 0, scale: 1 }
                            }
                            transition={softSpring}
                            className="grid place-items-center"
                          >
                            <ArrowBigUp size={14} />
                          </motion.span>
                          <motion.span
                            key={count}
                            initial={{ scale: 1.35, y: -1 }}
                            animate={{ scale: 1, y: 0 }}
                            transition={softSpring}
                            className="inline-block min-w-[1ch] text-left"
                          >
                            {count}
                          </motion.span>
                        </motion.button>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
