import { useRef, type KeyboardEvent } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Accessibility, Bike, Footprints, type LucideIcon } from "lucide-react";
import { cn } from "../../lib/utils";
import { panelSpring } from "../../motion/presets";
import { useAppStore } from "../../store/useAppStore";
import type { MobilityProfile } from "../../types";

interface ProfileOption {
  id: MobilityProfile;
  label: string;
  descriptor: string;
  icon: LucideIcon;
}

const PROFILES: ProfileOption[] = [
  { id: "walker", label: "Walker", descriptor: "Paved & gentle", icon: Footprints },
  { id: "biker", label: "Biker", descriptor: "Wide gravel & loops", icon: Bike },
  { id: "wheelchair", label: "Wheelchair", descriptor: "Step-free, ≤5% grade", icon: Accessibility },
];

/**
 * The homepage's centrepiece control: a real radiogroup with roving focus,
 * arrow-key support and a spring-driven selected state.
 */
export default function ProfileSelector() {
  const profile = useAppStore((s) => s.profile);
  const setProfile = useAppStore((s) => s.setProfile);
  const reduce = useReducedMotion();
  const buttonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  function handleKeyDown(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp"];
    if (!keys.includes(event.key)) return;
    event.preventDefault();
    const delta = event.key === "ArrowRight" || event.key === "ArrowDown" ? 1 : -1;
    const nextIndex = (index + delta + PROFILES.length) % PROFILES.length;
    setProfile(PROFILES[nextIndex].id);
    buttonRefs.current[nextIndex]?.focus();
  }

  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between gap-3">
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-400">
          I&rsquo;m exploring as
        </p>
        <p className="hidden text-xs font-medium text-slate-400 sm:block">
          Shapes every route &amp; alert
        </p>
      </div>

      <div role="radiogroup" aria-label="Mobility profile" className="grid gap-2.5 sm:grid-cols-3">
        {PROFILES.map((option, index) => {
          const active = profile === option.id;
          const Icon = option.icon;

          return (
            <motion.button
              key={option.id}
              ref={(el) => {
                buttonRefs.current[index] = el;
              }}
              type="button"
              role="radio"
              aria-checked={active}
              tabIndex={active ? 0 : -1}
              onClick={() => setProfile(option.id)}
              onKeyDown={(event) => handleKeyDown(event, index)}
              animate={active ? { scale: reduce ? 1 : 1.02, y: reduce ? 0 : -2 } : { scale: 1, y: 0 }}
              transition={panelSpring}
              whileHover={{ scale: reduce ? 1 : 1.03 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "group relative flex w-full items-center gap-3 rounded-2xl border-2 p-3 text-left outline-none transition-colors duration-200 sm:flex-col sm:items-start sm:gap-0 sm:p-3.5",
                "focus-visible:ring-2 focus-visible:ring-emerald-600/50 focus-visible:ring-offset-2",
                active
                  ? "border-emerald-900 bg-emerald-50 shadow-[0_0_0_4px_rgba(5,150,105,0.10),0_16px_30px_-18px_rgba(5,150,105,0.55)]"
                  : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/60",
              )}
            >
              <span
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors duration-200 sm:mb-3",
                  active
                    ? "bg-emerald-900 text-white shadow-sm shadow-emerald-900/30"
                    : "bg-slate-100 text-slate-500 group-hover:bg-slate-200/70 group-hover:text-slate-600",
                )}
              >
                <Icon size={19} strokeWidth={2.2} />
              </span>

              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-bold tracking-tight",
                    active ? "text-emerald-950" : "text-slate-900",
                  )}
                >
                  {option.label}
                </span>
                <span
                  className={cn(
                    "mt-0.5 block text-[11px] leading-snug",
                    active ? "text-emerald-700" : "text-slate-500",
                  )}
                >
                  {option.descriptor}
                </span>
              </span>

              {active && (
                <motion.span
                  layoutId="profile-check"
                  transition={panelSpring}
                  className="absolute right-3 top-3 hidden h-4 w-4 place-items-center rounded-full bg-emerald-900 text-white sm:grid"
                  aria-hidden
                >
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5" fill="none">
                    <path
                      d="M2.5 6.2 5 8.6 9.6 3.6"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.span>
              )}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
