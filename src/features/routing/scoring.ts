import { SURFACE_LABEL, type MobilityProfile, type Trail } from "../../types";

/**
 * Pure accessibility scoring for the adaptive routing panel.
 *
 * Rules (deterministic, explainable):
 *  - start at 100; closed trails and trails the profile cannot use score 0
 *  - wheelchair: −12 per % above 5 maxSlope, −25 if widthIn < 36,
 *    −15 on rocky / packed-dirt surfaces
 *  - biker: +6 on crushed-stone / paved, −8 per % above 12, −15 if widthIn < 24
 *  - walker: −6 per % above 15, −10 when status is "caution"
 *  - everyone: −20 when difficulty is "hard", +5 for a loop, clamped to 0–100
 *
 * The panel drops score-0 results, so this helper can be used on its own.
 */
export interface TrailScore {
  score: number;
  reasons: string[];
  warnings: string[];
}

const GRADE_LIMIT: Record<MobilityProfile, number> = {
  walker: 15,
  biker: 12,
  wheelchair: 5,
};

/** The max sustained grade a profile is scored against. */
export function gradeLimitFor(profile: MobilityProfile): number {
  return GRADE_LIMIT[profile];
}

export function scoreTrail(trail: Trail, profile: MobilityProfile): TrailScore {
  const reasons: string[] = [];
  const warnings: string[] = [];

  if (trail.status === "closed") {
    return {
      score: 0,
      reasons: ["Closed for maintenance"],
      warnings: ["Trail is temporarily closed"],
    };
  }

  if (profile === "wheelchair" && !trail.wheelchairOk) {
    return {
      score: 0,
      reasons: ["Not rated step-free"],
      warnings: ["Not recommended for wheelchair users"],
    };
  }

  if (profile === "biker" && !trail.bikeOk) {
    return {
      score: 0,
      reasons: ["Bikes are not permitted"],
      warnings: ["No bike access on this trail"],
    };
  }

  let score = 100;
  const limit = GRADE_LIMIT[profile];
  const overGrade = trail.maxSlope - limit;

  if (profile === "wheelchair") {
    reasons.push(`Step-free, ${trail.widthIn} in wide, max ${trail.maxSlope}% grade`);

    if (overGrade > 0) {
      score -= overGrade * 12;
      warnings.push(`${trail.maxSlope}% grade exceeds wheelchair max`);
    }
    if (trail.widthIn < 36) {
      score -= 25;
      warnings.push(`Narrow ${trail.widthIn} in corridor`);
    }
    if (trail.surface === "rocky" || trail.surface === "packed-dirt") {
      score -= 15;
      warnings.push(`${SURFACE_LABEL[trail.surface]} surface is rough for wheels`);
    } else if (trail.surface === "paved" || trail.surface === "boardwalk") {
      reasons.push(trail.surface === "paved" ? "Paved surface" : "Boardwalk surface");
    }
  } else if (profile === "biker") {
    reasons.push("Bike access permitted");

    if (trail.surface === "paved" || trail.surface === "crushed-stone") {
      score += 6;
      reasons.push(trail.surface === "paved" ? "Paved surface" : "Crushed-stone surface");
    }
    if (overGrade > 0) {
      score -= overGrade * 8;
      warnings.push(`${trail.maxSlope}% grade exceeds bike max`);
    }
    if (trail.widthIn < 24) {
      score -= 15;
      warnings.push(`Narrow ${trail.widthIn} in corridor`);
    }
  } else {
    if (trail.maxSlope <= limit) {
      reasons.push(`Gentle grades, max ${trail.maxSlope}%`);
    } else {
      score -= overGrade * 6;
      warnings.push(`${trail.maxSlope}% grade exceeds walker max`);
    }

    if (trail.status === "caution") {
      score -= 10;
      warnings.push("Currently flagged caution — check conditions");
    }

    if (trail.surface === "paved") reasons.push("Paved surface");
    else if (trail.surface === "boardwalk") reasons.push("Boardwalk surface");
  }

  if (trail.difficulty === "hard") {
    score -= 20;
    warnings.push("Rated hard — expect steep or uneven sections");
  } else if (trail.difficulty === "easy" && profile !== "walker") {
    reasons.push("Rated easy");
  }

  if (trail.loop) {
    score += 5;
    reasons.push("Loop returns to trailhead");
  }

  if (trail.status === "caution" && profile === "wheelchair") {
    warnings.push("Status is caution — surface may be soft");
  }

  if (reasons.length === 0) {
    reasons.push(profile === "walker" ? "Open to walkers" : "Open for travel");
  }

  return {
    score: Math.max(0, Math.min(100, Math.round(score))),
    reasons,
    warnings,
  };
}
