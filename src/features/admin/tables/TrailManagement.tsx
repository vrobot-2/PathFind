import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Accessibility,
  Bike,
  Check,
  ChevronDown,
  Footprints,
  Map as MapIcon,
} from "lucide-react";
import { Badge } from "../../../components/ui/Badge";
import { Card } from "../../../components/ui/Card";
import { cn, miles } from "../../../lib/utils";
import { softSpring } from "../../../motion/presets";
import { SURFACE_LABEL, type SurfaceType, type Trail, type TrailStatus } from "../../../types";
import { TRAIL_STATUS_META } from "./meta";
import { Link } from "react-router-dom";

const ROW_GRID =
  "sm:grid sm:grid-cols-[minmax(0,1fr)_112px_76px_76px_104px_92px_88px] sm:items-center sm:gap-3";

const SURFACES = Object.keys(SURFACE_LABEL) as SurfaceType[];
const TRAIL_STATUSES: TrailStatus[] = ["open", "caution", "closed"];

const labelClass =
  "mb-1.5 block text-[11px] font-semibold uppercase tracking-wide text-slate-400";

const selectClass =
  "h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-sm font-medium text-slate-800 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20";

function AccessIcon({
  on,
  label,
  icon: Icon,
}: {
  on: boolean;
  label: string;
  icon: typeof Footprints;
}) {
  return (
    <span
      title={`${label}${on ? " welcome" : " not recommended"}`}
      aria-label={`${label}${on ? " welcome" : " not recommended"}`}
      className={cn(
        "flex h-7 w-7 items-center justify-center rounded-lg border transition-colors",
        on
          ? "border-emerald-200 bg-emerald-50 text-emerald-600"
          : "border-slate-200 bg-slate-50 text-slate-300",
      )}
    >
      <Icon size={14} strokeWidth={2.2} />
    </span>
  );
}

function AccessIcons({ trail }: { trail: Trail }) {
  return (
    <div className="flex items-center gap-1">
      <AccessIcon on={trail.walkerOk} label="Walkers" icon={Footprints} />
      <AccessIcon on={trail.bikeOk} label="Bikes" icon={Bike} />
      <AccessIcon on={trail.wheelchairOk} label="Wheelchairs" icon={Accessibility} />
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="group flex items-center gap-2.5 text-left"
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors duration-200",
          checked ? "bg-emerald-600" : "bg-slate-300",
        )}
      >
        <motion.span
          layout
          transition={softSpring}
          className={cn(
            "h-5 w-5 rounded-full bg-white shadow-sm",
            checked ? "ml-auto" : "mr-auto",
          )}
        />
      </span>
      <span className="text-xs font-semibold text-slate-600 group-hover:text-slate-900">
        {label}
      </span>
    </button>
  );
}

interface EditProps {
  trail: Trail;
  onSave: (id: string, patch: Partial<Trail>) => Promise<boolean>;
}

function TrailEditPanel({ trail, onSave }: EditProps) {
  const [slope, setSlope] = useState(String(trail.maxSlope));
  const [width, setWidth] = useState(String(trail.widthIn));
  const [saved, setSaved] = useState(false);
  const savedTimer = useRef<number | null>(null);

  useEffect(() => setSlope(String(trail.maxSlope)), [trail.maxSlope]);
  useEffect(() => setWidth(String(trail.widthIn)), [trail.widthIn]);
  useEffect(
    () => () => {
      if (savedTimer.current) window.clearTimeout(savedTimer.current);
    },
    [],
  );

  const flashSaved = () => {
    setSaved(true);
    if (savedTimer.current) window.clearTimeout(savedTimer.current);
    savedTimer.current = window.setTimeout(() => setSaved(false), 1800);
  };

  const commit = async (patch: Partial<Trail>) => {
    const ok = await onSave(trail.id, patch);
    if (ok) flashSaved();
  };

  const commitSlope = () => {
    const value = Number(slope);
    if (!Number.isFinite(value)) {
      setSlope(String(trail.maxSlope));
      return;
    }
    const next = Math.max(0, Math.round(value * 10) / 10);
    if (next === trail.maxSlope) {
      setSlope(String(trail.maxSlope));
      return;
    }
    setSlope(String(next));
    void commit({ maxSlope: next });
  };

  const commitWidth = () => {
    const value = Number(width);
    if (!Number.isFinite(value)) {
      setWidth(String(trail.widthIn));
      return;
    }
    const next = Math.max(0, Math.round(value));
    if (next === trail.widthIn) {
      setWidth(String(trail.widthIn));
      return;
    }
    setWidth(String(next));
    void commit({ widthIn: next });
  };

  return (
    <div className="border-t border-slate-200/70 bg-slate-50/70 px-4 py-4 sm:px-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
          Edit trail · {trail.name}
        </p>
        <AnimatePresence>
          {saved ? (
            <motion.span
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700"
            >
              <Check size={11} /> Saved
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label className={labelClass} htmlFor={`status-${trail.id}`}>
            Status
          </label>
          <select
            id={`status-${trail.id}`}
            className={selectClass}
            value={trail.status}
            onChange={(event) =>
              void commit({ status: event.target.value as TrailStatus })
            }
          >
            {TRAIL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {TRAIL_STATUS_META[status].label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor={`surface-${trail.id}`}>
            Surface
          </label>
          <select
            id={`surface-${trail.id}`}
            className={selectClass}
            value={trail.surface}
            onChange={(event) =>
              void commit({ surface: event.target.value as SurfaceType })
            }
          >
            {SURFACES.map((surface) => (
              <option key={surface} value={surface}>
                {SURFACE_LABEL[surface]}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass} htmlFor={`slope-${trail.id}`}>
            Max slope (%)
          </label>
          <input
            id={`slope-${trail.id}`}
            type="number"
            min={0}
            step={0.5}
            value={slope}
            onChange={(event) => setSlope(event.target.value)}
            onBlur={commitSlope}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className={cn(selectClass, "tabular-nums")}
          />
        </div>

        <div>
          <label className={labelClass} htmlFor={`width-${trail.id}`}>
            Width (in)
          </label>
          <input
            id={`width-${trail.id}`}
            type="number"
            min={0}
            step={1}
            value={width}
            onChange={(event) => setWidth(event.target.value)}
            onBlur={commitWidth}
            onKeyDown={(event) => {
              if (event.key === "Enter") event.currentTarget.blur();
            }}
            className={cn(selectClass, "tabular-nums")}
          />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-slate-200/70 pt-3.5">
        <ToggleSwitch
          checked={trail.walkerOk}
          onChange={(next) => void commit({ walkerOk: next })}
          label="Walkers"
        />
        <ToggleSwitch
          checked={trail.bikeOk}
          onChange={(next) => void commit({ bikeOk: next })}
          label="Bikes"
        />
        <ToggleSwitch
          checked={trail.wheelchairOk}
          onChange={(next) => void commit({ wheelchairOk: next })}
          label="Wheelchairs"
        />
      </div>
    </div>
  );
}

interface Props {
  trails: Trail[];
  onUpdateTrail: (id: string, patch: Partial<Trail>) => Promise<boolean>;
}

export function TrailManagement({ trails, onUpdateTrail }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  return (
    <Card padded={false} className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            Trail inventory
          </p>
          <h2 className="text-lg font-bold tracking-tight text-slate-900">
            Trail management
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="slate">{trails.length} trails</Badge>
          <span className="hidden text-xs text-slate-400 sm:inline">
            Click a row to edit access & conditions
          </span>
        </div>
      </div>

      {/* column header */}
      <div
        className={cn(
          "hidden border-b border-slate-100 bg-slate-50/60 px-5 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400",
          ROW_GRID,
        )}
      >
        <span>Trail</span>
        <span>Surface</span>
        <span className="text-right">Slope</span>
        <span className="text-right">Width</span>
        <span>Access</span>
        <span>Status</span>
        <span className="text-right">Map</span>
      </div>

      <div className="divide-y divide-slate-100">
        {trails.map((trail) => {
          const expanded = expandedId === trail.id;
          const trailStatus = TRAIL_STATUS_META[trail.status];

          return (
            <div key={trail.id} className={cn(expanded && "bg-slate-50/40")}>
              <div
                role="button"
                tabIndex={0}
                aria-expanded={expanded}
                onClick={() => setExpandedId(expanded ? null : trail.id)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    setExpandedId(expanded ? null : trail.id);
                  }
                }}
                className={cn(
                  "cursor-pointer px-4 py-3 transition-colors hover:bg-slate-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-emerald-500/40 sm:px-5",
                  ROW_GRID,
                )}
              >
                {/* mobile: name + meta + status */}
                <div className="flex min-w-0 items-start justify-between gap-3 sm:hidden">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-slate-900">
                      {trail.name}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 tabular-nums">
                      {SURFACE_LABEL[trail.surface]} · {miles(trail.distanceMi)} ·{" "}
                      {trail.maxSlope}% / {trail.widthIn} in
                    </p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone={trailStatus.tone}>{trailStatus.label}</Badge>
                      <AccessIcons trail={trail} />
                    </div>
                  </div>
                </div>

                <div className="hidden min-w-0 sm:block">
                  <p className="truncate text-sm font-semibold text-slate-900">
                    {trail.name}
                  </p>
                  <p className="text-xs text-slate-400 tabular-nums">
                    {miles(trail.distanceMi)} · {trail.difficulty}
                  </p>
                </div>

                <span className="hidden text-xs font-medium text-slate-600 sm:block">
                  {SURFACE_LABEL[trail.surface]}
                </span>
                <span className="hidden text-right text-xs font-semibold tabular-nums text-slate-700 sm:block">
                  {trail.maxSlope}%
                </span>
                <span className="hidden text-right text-xs font-semibold tabular-nums text-slate-700 sm:block">
                  {trail.widthIn} in
                </span>
                <span className="hidden sm:block">
                  <AccessIcons trail={trail} />
                </span>
                <span className="hidden sm:block">
                  <Badge tone={trailStatus.tone}>{trailStatus.label}</Badge>
                </span>

                <span className="mt-2 flex items-center justify-between gap-2 sm:mt-0 sm:justify-end">
                  <Link
                    to="/map"
                    onClick={(event) => event.stopPropagation()}
                    onKeyDown={(event) => event.stopPropagation()}
                    aria-label={`View ${trail.name} on map`}
                    title="View on map"
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-emerald-700 transition-colors hover:bg-emerald-50"
                  >
                    <MapIcon size={13} />
                    <span className="sm:hidden">View on map</span>
                  </Link>
                  <ChevronDown
                    size={16}
                    className={cn(
                      "shrink-0 text-slate-400 transition-transform duration-200",
                      expanded && "rotate-180",
                    )}
                  />
                </span>
              </div>

              <AnimatePresence initial={false}>
                {expanded ? (
                  <motion.div
                    key={`${trail.id}-editor`}
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
                    className="overflow-hidden"
                    onClick={(event) => event.stopPropagation()}
                  >
                    <TrailEditPanel trail={trail} onSave={onUpdateTrail} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
