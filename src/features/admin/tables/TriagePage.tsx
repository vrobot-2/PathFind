import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowUpDown,
  CheckCircle2,
  ClipboardList,
  Clock,
  Inbox,
  RefreshCw,
  Search,
  Timer,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { api } from "../../../lib/api";
import { cn } from "../../../lib/utils";
import { pageTransition, pressable } from "../../../motion/presets";
import type { Report, ReportCategory, ReportStatus, Trail } from "../../../types";
import { ReportDetailPanel } from "./ReportDetailPanel";
import { ReportList } from "./ReportList";
import { TrailManagement } from "./TrailManagement";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  REPORT_STATUS_ORDER,
  SEVERITY_META,
  STATUS_META,
} from "./meta";
import { ToastViewport, useToasts } from "./useToasts";

type StatusFilter = "all" | ReportStatus;
type SortMode = "newest" | "severity";

const STATUS_FILTERS: StatusFilter[] = ["all", ...REPORT_STATUS_ORDER];

const segmentLabel: Record<StatusFilter, string> = {
  all: "All",
  ...Object.fromEntries(
    REPORT_STATUS_ORDER.map((status) => [status, STATUS_META[status].label]),
  ),
} as Record<StatusFilter, string>;

export default function TriagePage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [trails, setTrails] = useState<Trail[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categories, setCategories] = useState<Set<ReportCategory>>(new Set());
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  const trailById = useMemo(
    () => new Map(trails.map((trail) => [trail.id, trail])),
    [trails],
  );

  const nameForTrail = useCallback(
    (trailId: string) => trailById.get(trailId)?.name ?? "Unknown trail",
    [trailById],
  );

  const load = useCallback(
    async (initial: boolean) => {
      if (initial) setLoading(true);
      else setRefreshing(true);
      try {
        const [nextReports, nextTrails] = await Promise.all([
          api.getReports(),
          api.getTrails(),
        ]);
        setReports(nextReports);
        setTrails(nextTrails);
        setLoadError(null);
        setSelectedId((current) => {
          if (current && nextReports.some((report) => report.id === current)) {
            return current;
          }
          const firstOpen = nextReports.find((report) => report.status === "open");
          return firstOpen?.id ?? nextReports[0]?.id ?? null;
        });
      } catch {
        setLoadError("Could not reach the park API. Check the server and try again.");
        push("Couldn't load report queue", "error");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [push],
  );

  useEffect(() => {
    void load(true);
  }, [load]);

  /* ---------- derived stats ---------- */
  const stats = useMemo(() => {
    const open = reports.filter((report) => report.status === "open").length;
    const inProgress = reports.filter(
      (report) => report.status === "in-progress",
    ).length;
    const weekAgo = Date.now() - 7 * 86_400_000;
    const resolvedWeek = reports.filter(
      (report) =>
        report.status === "resolved" &&
        report.resolvedAt !== null &&
        new Date(report.resolvedAt).getTime() >= weekAgo,
    ).length;
    const resolved = reports.filter(
      (report) => report.status === "resolved" && report.resolvedAt !== null,
    );
    const avgHours = resolved.length
      ? resolved.reduce((total, report) => {
          const ms =
            new Date(report.resolvedAt as string).getTime() -
            new Date(report.createdAt).getTime();
          return total + (Number.isFinite(ms) && ms > 0 ? ms / 3_600_000 : 0);
        }, 0) / resolved.length
      : 0;
    return {
      open,
      inProgress,
      resolvedWeek,
      avgResponse: avgHours > 0 ? `${avgHours.toFixed(1)}h` : "—",
    };
  }, [reports]);

  /* ---------- filtering / sorting ---------- */
  const statusCounts = useMemo(() => {
    const counts: Record<StatusFilter, number> = {
      all: reports.length,
      open: 0,
      "in-progress": 0,
      resolved: 0,
    };
    reports.forEach((report) => {
      counts[report.status] += 1;
    });
    return counts;
  }, [reports]);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const list = reports.filter((report) => {
      if (statusFilter !== "all" && report.status !== statusFilter) return false;
      if (categories.size > 0 && !categories.has(report.category)) return false;
      if (!needle) return true;
      return (
        report.note.toLowerCase().includes(needle) ||
        nameForTrail(report.trailId).toLowerCase().includes(needle)
      );
    });

    return [...list].sort((a, b) => {
      if (sortMode === "severity") {
        const bySeverity =
          SEVERITY_META[b.severity].rank - SEVERITY_META[a.severity].rank;
        if (bySeverity !== 0) return bySeverity;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }, [reports, statusFilter, categories, query, sortMode, nameForTrail]);

  const selectedReport = useMemo(
    () => reports.find((report) => report.id === selectedId) ?? null,
    [reports, selectedId],
  );

  const toggleCategory = (category: ReportCategory) => {
    setCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const clearFilters = () => {
    setStatusFilter("all");
    setCategories(new Set());
    setQuery("");
  };

  /* ---------- mutations ---------- */
  const updateReport = useCallback(
    async (
      id: string,
      patch: Partial<Pick<Report, "status" | "rangerNote">>,
      successMessage?: string,
    ) => {
      const previous = reports.find((report) => report.id === id);
      if (!previous) return false;

      setReports((list) =>
        list.map((report) => {
          if (report.id !== id) return report;
          const next = { ...report, ...patch };
          if (patch.status === "resolved") {
            next.resolvedAt = report.resolvedAt ?? new Date().toISOString();
          }
          return next;
        }),
      );

      try {
        const updated = await api.updateReport(id, patch);
        setReports((list) =>
          list.map((report) => (report.id === id ? updated : report)),
        );
        if (successMessage) push(successMessage, "success");
        return true;
      } catch {
        setReports((list) =>
          list.map((report) => (report.id === id ? previous : report)),
        );
        push("Couldn't save report changes", "error");
        return false;
      }
    },
    [reports, push],
  );

  const updateTrail = useCallback(
    async (id: string, patch: Partial<Trail>) => {
      const previous = trails.find((trail) => trail.id === id);
      if (!previous) return false;

      setTrails((list) =>
        list.map((trail) => (trail.id === id ? { ...trail, ...patch } : trail)),
      );

      try {
        const updated = await api.updateTrail(id, patch);
        setTrails((list) => list.map((trail) => (trail.id === id ? updated : trail)));
        return true;
      } catch {
        setTrails((list) =>
          list.map((trail) => (trail.id === id ? previous : trail)),
        );
        push("Couldn't update trail", "error");
        return false;
      }
    },
    [trails, push],
  );

  const closeTrail = useCallback(
    async (trailId: string) => {
      const trail = trailById.get(trailId);
      const ok = await updateTrail(trailId, { status: "closed" });
      if (ok) {
        push(
          `${trail?.name ?? "Trail segment"} closed — trailhead sign updated`,
          "success",
        );
      }
      return ok;
    },
    [trailById, updateTrail, push],
  );

  const statCards = [
    {
      label: "Open",
      value: loading ? "—" : String(stats.open),
      hint: "Needs triage",
      icon: ClipboardList,
      tile: "bg-rose-50 text-rose-600 border-rose-100",
    },
    {
      label: "In progress",
      value: loading ? "—" : String(stats.inProgress),
      hint: "Being handled",
      icon: Clock,
      tile: "bg-amber-50 text-amber-600 border-amber-100",
    },
    {
      label: "Resolved this week",
      value: loading ? "—" : String(stats.resolvedWeek),
      hint: "Last 7 days",
      icon: CheckCircle2,
      tile: "bg-emerald-50 text-emerald-600 border-emerald-100",
    },
    {
      label: "Avg response",
      value: loading ? "—" : stats.avgResponse,
      hint: "Resolution time",
      icon: Timer,
      tile: "bg-indigo-50 text-indigo-600 border-indigo-100",
    },
  ];

  return (
    <>
      <motion.main
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8"
      >
        {/* header */}
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-emerald-700">
              Manager · Triage
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Report queue
            </h1>
            <p className="mt-1 text-sm text-slate-600">
              Review, assign and resolve visitor-submitted conditions.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => void load(false)}
              disabled={refreshing || loading}
              aria-label="Refresh reports"
              title="Refresh reports"
            >
              <RefreshCw size={16} className={cn((refreshing || loading) && "animate-spin")} />
            </Button>
            <Link to="/admin">
              <Button variant="secondary" size="sm">
                <ArrowLeft size={15} />
                Dashboard
              </Button>
            </Link>
          </div>
        </header>

        {/* summary strip */}
        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card
                key={stat.label}
                padded={false}
                className="flex items-center gap-3 px-4 py-3.5"
              >
                <span
                  className={cn(
                    "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border",
                    stat.tile,
                  )}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    {stat.label}
                  </p>
                  <p className="text-xl font-bold leading-tight tracking-tight text-slate-900 tabular-nums">
                    {stat.value}
                  </p>
                  <p className="text-[10px] text-slate-400">{stat.hint}</p>
                </div>
              </Card>
            );
          })}
        </section>

        {/* toolbar */}
        <Card className="space-y-3 p-3 sm:p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {STATUS_FILTERS.map((filter) => {
                const active = statusFilter === filter;
                return (
                  <motion.button
                    key={filter}
                    type="button"
                    {...pressable}
                    onClick={() => setStatusFilter(filter)}
                    className={cn(
                      "inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold transition-colors sm:px-3",
                      active
                        ? "bg-emerald-900 text-white shadow-sm shadow-emerald-900/20"
                        : "text-slate-600 hover:bg-white/70 hover:text-slate-900",
                    )}
                  >
                    {segmentLabel[filter]}
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums",
                        active ? "bg-white/15 text-white" : "bg-white text-slate-500",
                      )}
                    >
                      {statusCounts[filter]}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            <motion.button
              type="button"
              {...pressable}
              onClick={() =>
                setSortMode((mode) => (mode === "newest" ? "severity" : "newest"))
              }
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900"
            >
              <ArrowUpDown size={13} />
              Sort: {sortMode === "newest" ? "Newest" : "Severity"}
            </motion.button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCategories(new Set())}
                className={cn(
                  "rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                  categories.size === 0
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-slate-200 bg-white text-slate-500 hover:border-slate-300",
                )}
              >
                All
              </button>
              {CATEGORY_ORDER.map((category) => {
                const meta = CATEGORY_META[category];
                const Icon = meta.icon;
                const active = categories.has(category);
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => toggleCategory(category)}
                    aria-pressed={active}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition-colors",
                      active
                        ? meta.tile
                        : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700",
                    )}
                  >
                    <Icon size={12} />
                    {meta.label}
                  </button>
                );
              })}
            </div>

            <div className="relative ml-auto w-full sm:w-64">
              <Search
                size={14}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search notes or trails…"
                aria-label="Search reports"
                className="h-9 w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>
          </div>
        </Card>

        {loadError ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            <span>{loadError}</span>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => void load(true)}
              className="!border-rose-200 !text-rose-700 hover:!bg-rose-100"
            >
              Retry
            </Button>
          </div>
        ) : null}

        {/* main split */}
        <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
          <section className="min-w-0">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                {loading
                  ? "Loading queue…"
                  : `${filtered.length} report${filtered.length === 1 ? "" : "s"}`}
              </p>
              {statusFilter !== "all" || categories.size > 0 || query ? (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
                >
                  Clear filters
                </button>
              ) : null}
            </div>

            {loading ? (
              <div className="space-y-2.5">
                {[0, 1, 2, 3].map((index) => (
                  <div
                    key={index}
                    className="h-24 animate-pulse rounded-2xl border border-slate-200/80 bg-white"
                  />
                ))}
              </div>
            ) : filtered.length > 0 ? (
              <ReportList
                reports={filtered}
                trailName={nameForTrail}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : (
              <Card className="flex min-h-[16rem] flex-col items-center justify-center gap-3 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <Inbox size={20} />
                </span>
                <p className="text-sm font-semibold text-slate-700">
                  No reports match these filters
                </p>
                <p className="max-w-xs text-xs leading-relaxed text-slate-500">
                  Try a broader status, clear category chips, or reset the search.
                </p>
                <Button variant="secondary" size="sm" onClick={clearFilters}>
                  Reset filters
                </Button>
              </Card>
            )}
          </section>

          <aside className="min-w-0">
            <ReportDetailPanel
              report={selectedReport}
              trail={
                selectedReport ? trailById.get(selectedReport.trailId) : undefined
              }
              onUpdateReport={updateReport}
              onCloseTrail={closeTrail}
              notify={push}
            />
          </aside>
        </div>

        {/* trail management */}
        <section className="pt-2">
          {loading ? (
            <div className="h-96 animate-pulse rounded-2xl border border-slate-200/80 bg-white" />
          ) : (
            <TrailManagement trails={trails} onUpdateTrail={updateTrail} />
          )}
        </section>

        <p className="pb-2 text-center text-[11px] text-slate-400">
          PAthFind ranger console · {reports.length} reports · {trails.length} trails
        </p>
      </motion.main>

      <ToastViewport toasts={toasts} dismiss={dismiss} />
    </>
  );
}
