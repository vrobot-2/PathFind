import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bell,
  Check,
  CheckCircle2,
  ClipboardList,
  MapPin,
  MessageSquarePlus,
  Wrench,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Button } from "../../../components/ui/Button";
import { Card } from "../../../components/ui/Card";
import { cn, timeAgo } from "../../../lib/utils";
import { softSpring } from "../../../motion/presets";
import {
  SURFACE_LABEL,
  type Report,
  type ReportStatus,
  type Trail,
} from "../../../types";
import type { ToastTone } from "./useToasts";
import {
  CATEGORY_META,
  REPORT_STATUS_ORDER,
  SEVERITY_META,
  STATUS_META,
  coords,
} from "./meta";

type ReportPatch = Partial<Pick<Report, "status" | "rangerNote">>;

interface Props {
  report: Report | null;
  trail: Trail | undefined;
  onUpdateReport: (
    id: string,
    patch: ReportPatch,
    successMessage?: string,
  ) => Promise<boolean>;
  onCloseTrail: (trailId: string) => Promise<boolean>;
  notify: (message: string, tone?: ToastTone) => void;
}

function formatResolved(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReportDetailPanel({
  report,
  trail,
  onUpdateReport,
  onCloseTrail,
  notify,
}: Props) {
  const [note, setNote] = useState("");
  const [savedNote, setSavedNote] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [closingTrail, setClosingTrail] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const savedTimer = useRef<number | null>(null);

  useEffect(() => {
    setNote(report?.rangerNote ?? "");
  }, [report?.id, report?.rangerNote]);

  useEffect(
    () => () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    },
    [],
  );

  const flashSaved = () => {
    setSavedNote(true);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSavedNote(false), 2200);
  };

  const saveNote = async () => {
    if (!report) return;
    setSavingNote(true);
    const ok = await onUpdateReport(report.id, {
      rangerNote: note.trim() ? note.trim() : null,
    });
    setSavingNote(false);
    if (ok) flashSaved();
  };

  const assign = async () => {
    if (!report) return;
    setAssigning(true);
    await onUpdateReport(
      report.id,
      { status: "in-progress" },
      "Assigned to maintenance",
    );
    setAssigning(false);
  };

  const closeSegment = async () => {
    if (!report) return;
    setClosingTrail(true);
    await onCloseTrail(report.trailId);
    setClosingTrail(false);
  };

  if (!report) {
    return (
      <div className="xl:sticky xl:top-24">
        <Card className="flex min-h-[22rem] flex-col items-center justify-center gap-3 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
            <ClipboardList size={22} />
          </span>
          <p className="text-sm font-semibold text-slate-700">No report selected</p>
          <p className="max-w-[15rem] text-xs leading-relaxed text-slate-500">
            Pick a visitor report from the queue to review details and take action.
          </p>
        </Card>
      </div>
    );
  }

  const category = CATEGORY_META[report.category];
  const severity = SEVERITY_META[report.severity];
  const status = STATUS_META[report.status];
  const CategoryIcon = category.icon;

  return (
    <div className="xl:sticky xl:top-24">
      <Card padded={false} className="overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={softSpring}
          >
            {/* photo / location snapshot */}
            <div className="relative h-36 overflow-hidden bg-slate-100">
              {report.photoUrl ? (
                <img
                  src={report.photoUrl}
                  alt={`Visitor photo for ${category.label.toLowerCase()} report`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="grid-lines flex h-full w-full items-center justify-center bg-slate-100">
                  <span className="flex h-11 w-11 items-center justify-center rounded-full border border-slate-200 bg-white/90 text-slate-400 shadow-sm">
                    <MapPin size={20} />
                  </span>
                </div>
              )}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-slate-900/55 to-transparent px-4 pb-3 pt-8 text-white">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide">
                  <CategoryIcon size={13} />
                  {category.label}
                </span>
                <span className="rounded-full bg-white/20 px-2 py-0.5 text-[11px] font-semibold tabular-nums backdrop-blur-sm">
                  {coords(report.lat, report.lng)}
                </span>
              </div>
            </div>

            <div className="space-y-4 p-5">
              <div>
                <div className="mb-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone={severity.tone}>{severity.label} severity</Badge>
                  <Badge
                    tone={status.tone}
                    icon={<span className={cn("h-1.5 w-1.5 rounded-full", status.dot)} />}
                  >
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm leading-relaxed text-slate-700">{report.note}</p>
                <p className="mt-2.5 text-xs text-slate-500">
                  Visitor report · <span className="tabular-nums">{timeAgo(report.createdAt)}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-y border-slate-100 py-3 text-xs">
                <span className="inline-flex items-center gap-1.5 font-medium text-slate-700">
                  <MapPin size={13} className="text-slate-400" />
                  {trail?.name ?? "Unknown trail"}
                </span>
                {trail ? (
                  <Badge tone="slate">{SURFACE_LABEL[trail.surface]}</Badge>
                ) : null}
                <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 font-semibold tabular-nums text-slate-600">
                  {report.lat.toFixed(4)}, {report.lng.toFixed(4)}
                </span>
              </div>

              {/* status pills */}
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Report status
                </p>
                <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
                  {REPORT_STATUS_ORDER.map((value: ReportStatus) => {
                    const active = report.status === value;
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => void onUpdateReport(report.id, { status: value })}
                        className={cn(
                          "relative rounded-lg py-2 text-xs font-semibold transition-colors",
                          active ? "text-slate-900" : "text-slate-500 hover:text-slate-700",
                        )}
                      >
                        {active ? (
                          <motion.span
                            layoutId={`status-pill-${report.id}`}
                            transition={softSpring}
                            className="absolute inset-0 rounded-lg bg-white shadow-sm shadow-slate-200"
                          />
                        ) : null}
                        <span className="relative z-10">{STATUS_META[value].label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {report.status === "resolved" && report.resolvedAt ? (
                <p className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
                  <CheckCircle2 size={14} />
                  Resolved {formatResolved(report.resolvedAt)}
                </p>
              ) : null}

              {/* ranger note */}
              <div>
                <div className="mb-2 flex items-center justify-between gap-2">
                  <label
                    htmlFor={`ranger-note-${report.id}`}
                    className="text-[11px] font-semibold uppercase tracking-wide text-slate-400"
                  >
                    Ranger note
                  </label>
                  <AnimatePresence>
                    {savedNote ? (
                      <motion.span
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600"
                      >
                        <Check size={12} /> Saved
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
                <textarea
                  id={`ranger-note-${report.id}`}
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={3}
                  placeholder="Add field notes, follow-up instructions, or crew details…"
                  className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-emerald-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void saveNote()}
                  disabled={savingNote}
                  className="mt-2 w-full"
                >
                  <MessageSquarePlus size={14} />
                  {savingNote ? "Saving…" : "Save note"}
                </Button>
              </div>

              {/* quick actions */}
              <div className="space-y-2 border-t border-slate-100 pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                  Quick actions
                </p>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void assign()}
                  disabled={assigning}
                  className="w-full justify-start"
                >
                  <Wrench size={14} className="text-amber-600" />
                  Assign to maintenance
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    notify(
                      `Trailhead notified${trail ? ` — ${trail.name}` : ""}`,
                      "info",
                    )
                  }
                  className="w-full justify-start"
                >
                  <Bell size={14} className="text-indigo-600" />
                  Notify trailhead
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => void closeSegment()}
                  disabled={closingTrail || trail?.status === "closed"}
                  className="w-full justify-start !border-rose-200 !text-rose-700 hover:!bg-rose-50"
                >
                  <MapPin size={14} />
                  {trail?.status === "closed"
                    ? "Trail already closed"
                    : closingTrail
                      ? "Closing segment…"
                      : "Close trail segment"}
                </Button>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </Card>
    </div>
  );
}
