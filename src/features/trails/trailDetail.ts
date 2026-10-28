import type { Difficulty, MobilityProfile, Trail, TrailStatus } from "../../types";
import { PROFILE_LABEL } from "../../types";

/* ---------- pill styling ---------- */

export const STATUS_META: Record<TrailStatus, { label: string; pill: string; dot: string }> = {
  open: {
    label: "Open",
    pill: "border-emerald-200/70 bg-emerald-50/95 text-emerald-700",
    dot: "bg-emerald-500",
  },
  caution: {
    label: "Use caution",
    pill: "border-amber-200/70 bg-amber-50/95 text-amber-700",
    dot: "bg-amber-500",
  },
  closed: {
    label: "Closed",
    pill: "border-rose-200/70 bg-rose-50/95 text-rose-700",
    dot: "bg-rose-500",
  },
};

export const DIFFICULTY_META: Record<Difficulty, { label: string; pill: string }> = {
  easy: { label: "Easy", pill: "border-emerald-200/70 bg-emerald-50/95 text-emerald-700" },
  moderate: { label: "Moderate", pill: "border-amber-200/70 bg-amber-50/95 text-amber-700" },
  hard: { label: "Hard", pill: "border-rose-200/70 bg-rose-50/95 text-rose-700" },
};

/* ---------- profile fit ---------- */

/** max sustained grade each profile tolerates, percent */
export const PROFILE_MAX_SLOPE: Record<MobilityProfile, number> = {
  wheelchair: 5,
  walker: 12,
  biker: 15,
};

/** narrowest usable width each profile needs, inches */
export const PROFILE_MIN_WIDTH: Record<MobilityProfile, number> = {
  wheelchair: 36,
  walker: 24,
  biker: 24,
};

export interface ProfileFit {
  compatible: boolean;
  /** explains a mismatch; null when compatible */
  reason: string | null;
}

export function getProfileFit(trail: Trail, profile: MobilityProfile): ProfileFit {
  const slopeLimit = PROFILE_MAX_SLOPE[profile];
  const widthLimit = PROFILE_MIN_WIDTH[profile];
  const flagOk =
    profile === "wheelchair" ? trail.wheelchairOk : profile === "biker" ? trail.bikeOk : trail.walkerOk;

  if (trail.status === "closed") {
    return { compatible: false, reason: "the trail is currently closed" };
  }
  if (trail.maxSlope > slopeLimit) {
    return {
      compatible: false,
      reason: `max grade ${formatSlope(trail.maxSlope)} exceeds your limit`,
    };
  }
  if (trail.widthIn < widthLimit) {
    return {
      compatible: false,
      reason: `usable width ${trail.widthIn} in is below your ${widthLimit} in minimum`,
    };
  }
  if (!flagOk) {
    return {
      compatible: false,
      reason: `this trail isn't rated for ${PROFILE_LABEL[profile].toLowerCase()} use`,
    };
  }
  return { compatible: true, reason: null };
}

/* ---------- formatters & semantics ---------- */

export function formatSlope(slope: number): string {
  return `${Number.isInteger(slope) ? slope : slope.toFixed(1)}%`;
}

export function formatWidth(widthIn: number): string {
  return `${widthIn} in`;
}

export function slopeColor(slope: number): string {
  return slope <= 5 ? "text-emerald-600" : slope <= 10 ? "text-amber-600" : "text-rose-600";
}

export function widthColor(widthIn: number): string {
  return widthIn >= 36 ? "text-emerald-600" : widthIn >= 30 ? "text-amber-600" : "text-rose-600";
}
