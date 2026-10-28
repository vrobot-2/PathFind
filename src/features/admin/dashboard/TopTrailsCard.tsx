import { useMemo } from "react";
import { motion } from "framer-motion";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Card } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";
import { SURFACE_LABEL, type Report, type TrafficPoint, type Trail } from "../../../types";
import { categorySlices, rankTrails, type CategorySlice } from "./dashboardData";

interface Props {
  trails: Trail[];
  traffic: TrafficPoint[];
  reports: Report[];
}

function CategoryTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload?: CategorySlice }>;
}) {
  const slice = payload?.[0]?.payload;
  if (!active || !slice) return null;
  return (
    <div className="rounded-xl border border-slate-200/80 bg-white px-3 py-2 text-xs shadow-xl shadow-slate-900/10">
      <p className="flex items-center gap-1.5 font-semibold text-slate-700">
        <span
          className="inline-block h-2 w-2 rounded-full"
          style={{ backgroundColor: slice.color }}
        />
        {slice.name}
      </p>
      <p className="mt-1 tabular-nums text-slate-500">
        <span className="font-semibold text-slate-900">{slice.value}</span> reports
      </p>
    </div>
  );
}

export function TopTrailsCard({ trails, traffic, reports }: Props) {
  const ranked = useMemo(
    () => rankTrails(traffic, trails).slice(0, 5),
    [traffic, trails],
  );
  const slices = useMemo(
    () => categorySlices(reports).filter((slice) => slice.value > 0),
    [reports],
  );
  const total = slices.reduce((sum, slice) => sum + slice.value, 0);

  return (
    <Card padded={false} className="flex h-full min-w-0 flex-col">
      <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-5">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Top trails this week
          </h2>
          <p className="mt-1 text-sm text-slate-600">Ranked by recorded visits</p>
        </div>
        <Badge tone="emerald" className="shrink-0">
          {traffic.reduce((sum, p) => sum + p.visitCount, 0).toLocaleString()} visits
        </Badge>
      </div>

      <div className="space-y-3.5 px-5">
        {ranked.map((row, index) => (
          <motion.div
            key={row.trail.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * index, duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="flex items-center gap-3">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-slate-100 text-[11px] font-bold tabular-nums text-slate-600">
                {row.rank}
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="truncate text-sm font-semibold text-slate-900">{row.trail.name}</p>
                  <p className="shrink-0 text-sm font-bold tabular-nums text-slate-900">
                    {row.visits.toLocaleString()}
                  </p>
                </div>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <Badge tone="slate" className="px-2 py-0.5 text-[10px] font-medium">
                    {SURFACE_LABEL[row.trail.surface]}
                  </Badge>
                  <span className="text-[10px] uppercase tracking-wide text-slate-400">
                    {row.trail.distanceMi.toFixed(1)} mi
                    {row.trail.wheelchairOk && " · accessible"}
                  </span>
                </div>
              </div>
            </div>
            <div className="mt-2 ml-9 h-1.5 overflow-hidden rounded-full bg-slate-100">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(6, row.share * 100)}%` }}
                transition={{ delay: 0.12 + 0.06 * index, duration: 0.7, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-emerald-300 to-emerald-600"
              />
            </div>
          </motion.div>
        ))}
        {ranked.length === 0 && (
          <p className="py-6 text-center text-sm text-slate-400">No traffic recorded yet.</p>
        )}
      </div>

      <div className="mt-5 border-t border-slate-200/70 px-5 pb-5 pt-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-widest text-slate-500">
            Reports by category
          </h3>
          <span className="text-[11px] text-slate-400 tabular-nums">{total} total</span>
        </div>

        <div className="mt-2 flex items-center gap-4">
          <div className="relative h-[132px] w-[132px] shrink-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={slices}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={3}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                  isAnimationActive={false}
                >
                  {slices.map((slice) => (
                    <Cell key={slice.key} fill={slice.color} />
                  ))}
                </Pie>
                <Tooltip content={<CategoryTooltip />} cursor={false} />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <div className="text-center">
                <p className="text-lg font-extrabold leading-none tabular-nums text-slate-900">
                  {total}
                </p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-slate-400">
                  reports
                </p>
              </div>
            </div>
          </div>

          <ul className="min-w-0 flex-1 space-y-2">
            {slices.map((slice) => (
              <li key={slice.key} className="flex items-center justify-between gap-2 text-xs">
                <span className="flex min-w-0 items-center gap-1.5 text-slate-600">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: slice.color }}
                  />
                  <span className="truncate">{slice.name}</span>
                </span>
                <span className="font-semibold tabular-nums text-slate-900">{slice.value}</span>
              </li>
            ))}
            {slices.length === 0 && <li className="text-xs text-slate-400">No reports yet.</li>}
          </ul>
        </div>
      </div>
    </Card>
  );
}
