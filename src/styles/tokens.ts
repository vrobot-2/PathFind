/**
 * PAthFind design tokens — single source of truth for the light-mode outdoor-tech look.
 * Tailwind classes are strings so they stay tree-shakeable & visible to the JIT scanner.
 */

export const colors = {
  bg: "bg-slate-50",
  surface: "bg-white",
  surfaceGlass: "bg-white/90 backdrop-blur-md",
  border: "border-slate-200/80",
  text: "text-slate-900",
  muted: "text-slate-600",
  faint: "text-slate-400",
  /* tactical nature-tech accents */
  emerald: "text-emerald-600",
  emeraldBg: "bg-emerald-50",
  emeraldBorder: "border-emerald-200",
  amber: "text-amber-600",
  amberBg: "bg-amber-50",
  amberBorder: "border-amber-200",
  rose: "text-rose-600",
  roseBg: "bg-rose-50",
  roseBorder: "border-rose-200",
  forest: "bg-emerald-900",
  ink: "bg-slate-900",
} as const;

/** Layered elevation recipe used by every card / panel */
export const elevation = {
  card: "rounded-2xl border border-slate-200/80 bg-white shadow-xl shadow-slate-200/50",
  panel: "rounded-2xl border border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xl shadow-slate-200/50",
  flat: "rounded-2xl border border-slate-200/80 bg-white",
  inset: "rounded-xl bg-slate-50 border border-slate-200/60",
} as const;

export const radii = {
  card: "rounded-2xl",
  pill: "rounded-full",
  control: "rounded-xl",
} as const;

export const layout = {
  nav: "sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200",
  container: "mx-auto w-full max-w-7xl px-5 sm:px-8",
} as const;

/** Map trail colors by accessibility state, not by decoration */
export const trailColor = {
  accessible: "#059669", // emerald-600
  caution: "#d97706", // amber-600
  hazard: "#e11d48", // rose-600
  inactive: "#94a3b8", // slate-400
  route: "#065f46", // emerald-800 trace
} as const;
