import type { ReactNode } from "react";
import { cn } from "../../lib/utils";

export type BadgeTone = "emerald" | "amber" | "rose" | "slate" | "indigo";

const tones: Record<BadgeTone, string> = {
  emerald: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
  amber: "bg-amber-50 text-amber-700 border-amber-200/70",
  rose: "bg-rose-50 text-rose-700 border-rose-200/70",
  slate: "bg-slate-100 text-slate-700 border-slate-200/70",
  indigo: "bg-indigo-50 text-indigo-700 border-indigo-200/70",
};

interface Props {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
}

/** Compact micro-badge: rounded-full px-2.5 py-1 text-xs font-semibold */
export function Badge({ tone = "slate", children, className, icon }: Props) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold leading-none",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}
