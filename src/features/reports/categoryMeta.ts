import {
  Accessibility,
  Bird,
  Camera,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { ReportCategory, Severity } from "../../types";
import type { BadgeTone } from "../../components/ui/Badge";

export interface CategoryMeta {
  id: ReportCategory;
  label: string;
  /** three-word cue shown under the label */
  descriptor: string;
  icon: LucideIcon;
  tile: string;
  iconColor: string;
  selected: string;
  text: string;
  tone: BadgeTone;
}

export const CATEGORY_META: Record<ReportCategory, CategoryMeta> = {
  hazard: {
    id: "hazard",
    label: "Hazard",
    descriptor: "Blocked, damaged, unsafe",
    icon: TriangleAlert,
    tile: "bg-rose-50 text-rose-600",
    iconColor: "text-rose-600",
    selected: "border-rose-400 bg-rose-50/80 shadow-sm shadow-rose-200/60",
    text: "text-rose-700",
    tone: "rose",
  },
  scenic: {
    id: "scenic",
    label: "Scenic spot",
    descriptor: "Views, overlooks, photos",
    icon: Camera,
    tile: "bg-emerald-50 text-emerald-600",
    iconColor: "text-emerald-600",
    selected: "border-emerald-400 bg-emerald-50/80 shadow-sm shadow-emerald-200/60",
    text: "text-emerald-700",
    tone: "emerald",
  },
  wildlife: {
    id: "wildlife",
    label: "Wildlife",
    descriptor: "Animals, birds, tracks",
    icon: Bird,
    tile: "bg-indigo-50 text-indigo-600",
    iconColor: "text-indigo-600",
    selected: "border-indigo-400 bg-indigo-50/80 shadow-sm shadow-indigo-200/60",
    text: "text-indigo-700",
    tone: "indigo",
  },
  accessibility: {
    id: "accessibility",
    label: "Accessibility issue",
    descriptor: "Barriers, width, surface",
    icon: Accessibility,
    tile: "bg-amber-50 text-amber-600",
    iconColor: "text-amber-600",
    selected: "border-amber-400 bg-amber-50/80 shadow-sm shadow-amber-200/60",
    text: "text-amber-700",
    tone: "amber",
  },
};

export const CATEGORY_ORDER: ReportCategory[] = [
  "hazard",
  "scenic",
  "wildlife",
  "accessibility",
];

export const SEVERITY_META: Record<
  Severity,
  { label: string; selected: string; dot: string; tone: BadgeTone }
> = {
  low: {
    label: "Low",
    selected: "bg-emerald-600 text-white shadow-sm shadow-emerald-600/25",
    dot: "bg-emerald-500",
    tone: "emerald",
  },
  medium: {
    label: "Medium",
    selected: "bg-amber-500 text-white shadow-sm shadow-amber-500/25",
    dot: "bg-amber-500",
    tone: "amber",
  },
  high: {
    label: "High",
    selected: "bg-rose-600 text-white shadow-sm shadow-rose-600/25",
    dot: "bg-rose-600",
    tone: "rose",
  },
};

export const SEVERITY_ORDER: Severity[] = ["low", "medium", "high"];

export function needsSeverity(category: ReportCategory): boolean {
  return category === "hazard" || category === "accessibility";
}
