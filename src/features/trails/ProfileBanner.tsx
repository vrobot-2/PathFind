import { CircleCheck, TriangleAlert } from "lucide-react";
import type { MobilityProfile } from "../../types";
import { PROFILE_LABEL } from "../../types";
import type { ProfileFit } from "./trailDetail";

interface Props {
  profile: MobilityProfile;
  fit: ProfileFit;
}

export function ProfileBanner({ profile, fit }: Props) {
  if (fit.compatible) {
    return (
      <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200/70 bg-emerald-50 px-3 py-2.5">
        <CircleCheck size={16} className="mt-0.5 shrink-0 text-emerald-600" />
        <p className="text-xs font-semibold leading-relaxed text-emerald-800">
          Matches your {profile} profile
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-rose-200/70 bg-rose-50 px-3 py-2.5">
      <TriangleAlert size={16} className="mt-0.5 shrink-0 text-rose-600" />
      <p className="text-xs font-semibold leading-relaxed text-rose-800">
        Not recommended for {PROFILE_LABEL[profile]} — {fit.reason}
      </p>
    </div>
  );
}
