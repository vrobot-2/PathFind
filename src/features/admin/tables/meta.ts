import {
  Accessibility,
  Bird,
  Mountain,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { BadgeTone } from "../../../components/ui/Badge";
import type {
  ReportCategory,
  ReportStatus,
  Severity,
  TrailStatus,
} from "../../../types";

interface CategoryMeta {
  label: string;
  icon: LucideIcon;
  /** left colour rail on report rows */
  rail: string;
  /** tinted icon tile */
  tile: string;
  tone: BadgeTone;
}

export const CATEGORY_META: Record<ReportCategory, CategoryMeta> = {
  hazard: {
    label: "Hazard",
    icon: TriangleAlert,
    rail: "bg-rose-500",
    tile: "bg-rose-50 text-rose-600 border-rose-100",
    tone: "rose",
  },
  accessibility: {
    label: "Accessibility",
    icon: Accessibility,
    rail: "bg-amber-500",
    tile: "bg-amber-50 text-amber-600 border-amber-100",
    tone: "amber",
  },
  scenic: {
    label: "Scenic",
    icon: Mountain,
    rail: "bg-emerald-500",
    tile: "bg-emerald-50 text-emerald-600 border-emerald-100",
    tone: "emerald",
  },
  wildlife: {
    label: "Wildlife",
    icon: Bird,
    rail: "bg-indigo-500",
    tile: "bg-indigo-50 text-indigo-600 border-indigo-100",
    tone: "indigo",
  },
};

export const CATEGORY_ORDER: ReportCategory[] = [
  "hazard",
  "accessibility",
  "scenic",
  "wildlife",
];

export const STATUS_META: Record<
  ReportStatus,
  { label: string; tone: BadgeTone; dot: string }
> = {
  open: { label: "Open", tone: "rose", dot: "bg-rose-500" },
  "in-progress": { label: "In progress", tone: "amber", dot: "bg-amber-500" },
  resolved: { label: "Resolved", tone: "emerald", dot: "bg-emerald-500" },
};

export const REPORT_STATUS_ORDER: ReportStatus[] = [
  "open",
  "in-progress",
  "resolved",
];

export const SEVERITY_META: Record<
  Severity,
  { label: string; tone: BadgeTone; rank: number }
> = {
  low: { label: "Low", tone: "slate", rank: 0 },
  medium: { label: "Medium", tone: "amber", rank: 1 },
  high: { label: "High", tone: "rose", rank: 2 },
};

export const TRAIL_STATUS_META: Record<
  TrailStatus,
  { label: string; tone: BadgeTone }
> = {
  open: { label: "Open", tone: "emerald" },
  caution: { label: "Caution", tone: "amber" },
  closed: { label: "Closed", tone: "rose" },
};

export function coords(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}
