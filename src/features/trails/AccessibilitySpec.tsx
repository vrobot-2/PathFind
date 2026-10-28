import { Check, Layers, MoveHorizontal, ShieldCheck, TrendingUp, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import type { Trail } from "../../types";
import { SURFACE_LABEL } from "../../types";
import { formatSlope, formatWidth, slopeColor, widthColor } from "./trailDetail";

interface StatProps {
  label: string;
  value: string;
  icon: ReactNode;
  tone?: string;
  sublabel?: string;
}

function Stat({ label, value, icon, tone = "text-slate-900", sublabel }: StatProps) {
  return (
    <div className="flex min-h-[86px] flex-col rounded-xl border border-slate-200/80 bg-white px-3 py-2.5 shadow-sm shadow-slate-200/40">
      <div className="flex items-center gap-1.5 text-slate-400">
        {icon}
        <span className="text-[10px] font-bold uppercase tracking-[0.08em]">{label}</span>
      </div>
      <div className={cn("mt-1.5 text-base font-extrabold leading-none tracking-tight", tone)}>{value}</div>
      {sublabel ? (
        <p className="mt-auto pt-1 text-[10px] leading-tight text-slate-400">{sublabel}</p>
      ) : null}
    </div>
  );
}

interface ChecklistItem {
  label: string;
  ok: boolean;
}

function CheckRow({ item }: { item: ChecklistItem }) {
  return (
    <li className="flex items-center gap-2 text-xs font-medium text-slate-700">
      <span
        className={cn(
          "grid h-5 w-5 shrink-0 place-items-center rounded-full",
          item.ok ? "bg-emerald-100 text-emerald-700" : "bg-slate-200/70 text-slate-400",
        )}
      >
        {item.ok ? <Check size={11} strokeWidth={3} /> : <X size={11} strokeWidth={2.5} />}
      </span>
      <span className={item.ok ? undefined : "text-slate-500"}>{item.label}</span>
    </li>
  );
}

export function AccessibilitySpec({ trail }: { trail: Trail }) {
  const checklist: ChecklistItem[] = [
    { label: "Wheelchair accessible", ok: trail.wheelchairOk },
    { label: "Bike permitted", ok: trail.bikeOk },
    { label: "Walker friendly", ok: trail.walkerOk },
    { label: "Loop returns to start", ok: trail.loop },
  ];

  return (
    <section className="rounded-xl border border-slate-200/60 bg-slate-50 p-3.5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Accessibility spec</h3>

      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <Stat
          label="Surface"
          value={SURFACE_LABEL[trail.surface]}
          icon={<Layers size={12} strokeWidth={2.5} />}
          tone="text-slate-900"
        />
        <Stat
          label="Max slope"
          value={formatSlope(trail.maxSlope)}
          icon={<TrendingUp size={12} strokeWidth={2.5} />}
          tone={slopeColor(trail.maxSlope)}
          sublabel="≤5% is step-free friendly"
        />
        <Stat
          label="Width"
          value={formatWidth(trail.widthIn)}
          icon={<MoveHorizontal size={12} strokeWidth={2.5} />}
          tone={widthColor(trail.widthIn)}
        />
      </div>

      <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
        {checklist.map((item) => (
          <CheckRow key={item.label} item={item} />
        ))}
      </ul>

      <div className="mt-3 flex items-center gap-1.5 border-t border-slate-200/70 pt-2.5 text-[11px] font-medium text-slate-400">
        <ShieldCheck size={13} className="shrink-0 text-emerald-600" />
        Verified by rangers · Oct 2026
      </div>
    </section>
  );
}
