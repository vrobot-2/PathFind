import {
  Bird,
  Camera,
  Landmark,
  Layers,
  MapPin,
  Maximize2,
  Minus,
  Plus,
  Sparkles,
  TreePine,
  Waves,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { GlassPanel } from "../../components/ui/Card";
import { Badge } from "../../components/ui/Badge";
import { cn } from "../../lib/utils";
import { panelSpring } from "../../motion/presets";
import { useAppStore } from "../../store/useAppStore";
import type { MobilityProfile } from "../../types";

type TrailId = "lakeside" | "ridge" | "link" | "spur";

interface TrailStroke {
  id: TrailId;
  d: string;
  delay: number;
}

const TRAILS: TrailStroke[] = [
  {
    id: "lakeside",
    d: "M 26 246 C 74 226, 92 172, 138 156 C 182 141, 202 176, 248 180 C 294 184, 322 146, 388 118",
    delay: 0.3,
  },
  {
    id: "ridge",
    d: "M 58 74 C 102 92, 128 66, 168 76 C 208 86, 218 126, 248 180 C 276 230, 330 238, 392 226",
    delay: 0.55,
  },
  {
    id: "link",
    d: "M 248 180 C 270 206, 296 216, 318 250",
    delay: 0.8,
  },
  {
    id: "spur",
    d: "M 138 156 C 152 120, 196 108, 226 112",
    delay: 0.95,
  },
];

interface PreviewPin {
  left: string;
  top: string;
  icon: LucideIcon;
  solid: string;
  ring: string;
  label: string;
}

interface PreviewProfile {
  route: string;
  compatible: TrailId[];
  hero: TrailId;
  captionName: string;
  captionMeta: string;
  alert: string;
  alertIcon: LucideIcon;
  pins: PreviewPin[];
}

const LAKESIDE_PIN: PreviewPin = {
  left: "26%",
  top: "42%",
  icon: Waves,
  solid: "bg-sky-500",
  ring: "bg-sky-400",
  label: "Lake overlook",
};

const PREVIEWS: Record<MobilityProfile, PreviewProfile> = {
  walker: {
    route: "marsh-creek / white-trail",
    compatible: ["lakeside", "ridge", "link", "spur"],
    hero: "ridge",
    captionName: "White Trail",
    captionMeta: "4.0 mi · packed dirt · easy · 72 in wide",
    alert: "Herons in the west cove — look right",
    alertIcon: Bird,
    pins: [
      LAKESIDE_PIN,
      {
        left: "64%",
        top: "31%",
        icon: Bird,
        solid: "bg-indigo-600",
        ring: "bg-indigo-400",
        label: "Heron rookery",
      },
      {
        left: "47%",
        top: "71%",
        icon: Landmark,
        solid: "bg-amber-500",
        ring: "bg-amber-400",
        label: "Dam overlook",
      },
    ],
  },
  biker: {
    route: "marsh-creek / blue-trail",
    compatible: ["ridge", "link", "lakeside"],
    hero: "ridge",
    captionName: "Blue Trail",
    captionMeta: "3.5 mi · packed dirt · 10% max grade · 96 in wide",
    alert: "Washout at the low crossing — keep uphill",
    alertIcon: TreePine,
    pins: [
      LAKESIDE_PIN,
      {
        left: "72%",
        top: "62%",
        icon: Camera,
        solid: "bg-emerald-600",
        ring: "bg-emerald-400",
        label: "Photo spot",
      },
      {
        left: "47%",
        top: "71%",
        icon: Landmark,
        solid: "bg-amber-500",
        ring: "bg-amber-400",
        label: "Historic ruins",
      },
    ],
  },
  wheelchair: {
    route: "marsh-creek / park-road-trail",
    compatible: ["lakeside", "spur", "link"],
    hero: "lakeside",
    captionName: "Park Road Trail",
    captionMeta: "0.6 mi · paved · step-free · 72 in wide",
    alert: "Accessible fishing pier ahead — stay on pavement",
    alertIcon: Sparkles,
    pins: [
      {
        left: "47%",
        top: "71%",
        icon: Landmark,
        solid: "bg-amber-500",
        ring: "bg-amber-400",
        label: "Accessible fishing pier",
      },
      LAKESIDE_PIN,
      {
        left: "70%",
        top: "38%",
        icon: Camera,
        solid: "bg-emerald-600",
        ring: "bg-emerald-400",
        label: "Accessible photo deck",
      },
    ],
  },
};

const TONE: Record<MobilityProfile, "emerald" | "amber" | "indigo"> = {
  walker: "amber",
  biker: "indigo",
  wheelchair: "emerald",
};

export default function MiniMapPreview() {
  const reduce = useReducedMotion();
  const profile = useAppStore((s) => s.profile);
  const preview = PREVIEWS[profile];
  const AlertIcon = preview.alertIcon;

  return (
    <GlassPanel className="relative rounded-3xl border-white/70 bg-white/85 p-3 shadow-2xl shadow-slate-300/40 ring-1 ring-slate-900/5">
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white">
        {/* fake product chrome */}
        <div className="flex items-center justify-between gap-2 border-b border-slate-200/70 px-3 py-2">
          <div className="flex min-w-0 items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-rose-300" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-amber-300" aria-hidden />
            <span className="h-2 w-2 rounded-full bg-emerald-300" aria-hidden />
            <span className="ml-2 truncate text-[11px] font-medium text-slate-400">
              {preview.route}
            </span>
          </div>
          <div className="flex items-center gap-2.5 text-slate-400">
            <Layers size={13} aria-hidden />
            <Maximize2 size={13} aria-hidden />
            <span className="hidden h-3 w-px bg-slate-200 sm:block" aria-hidden />
            <Plus size={13} className="hidden sm:block" aria-hidden />
            <Minus size={13} className="hidden sm:block" aria-hidden />
          </div>
        </div>

        {/* stylised map */}
        <div className="relative h-[286px] overflow-hidden bg-slate-50 sm:h-[320px]">
          <svg
            viewBox="0 0 420 300"
            preserveAspectRatio="xMidYMid slice"
            className="absolute inset-0 h-full w-full"
            role="img"
            aria-label={`Stylised preview map for a ${profile} route through Marsh Creek`}
          >
            <defs>
              <linearGradient id="pf-land" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#f1f5f9" />
                <stop offset="100%" stopColor="#e6edf5" />
              </linearGradient>
              <linearGradient id="pf-lake" x1="0" y1="0" x2="0.6" y2="1">
                <stop offset="0%" stopColor="#e0f2fe" />
                <stop offset="100%" stopColor="#bfdbfe" />
              </linearGradient>
              <linearGradient id="pf-forest" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ecfdf5" />
                <stop offset="100%" stopColor="#d1fae5" />
              </linearGradient>
            </defs>

            <rect width="420" height="300" fill="#f8fafc" />

            {/* landmass */}
            <path
              d="M -10 96 C 44 66 96 78 134 58 C 182 34 224 44 262 30 C 312 12 356 34 430 18 L 430 310 L -10 310 Z"
              fill="url(#pf-land)"
            />

            {/* wooded patch */}
            <path
              d="M 292 36 C 330 22 380 30 408 54 C 424 74 412 98 378 102 C 344 106 312 94 300 72 C 292 56 286 44 292 36 Z"
              fill="url(#pf-forest)"
              opacity="0.9"
            />

            {/* contour lines */}
            <g fill="none" stroke="#e2e8f0" strokeWidth="1">
              <path d="M -10 200 C 60 186 108 204 160 190 C 214 176 258 192 316 178 C 356 168 392 174 430 164" />
              <path d="M -10 232 C 60 218 108 236 160 222 C 214 208 258 224 316 210 C 356 200 392 206 430 196" />
              <path d="M 286 128 C 320 116 356 122 392 108 C 408 102 420 100 430 98" />
            </g>

            {/* lake */}
            <motion.path
              d="M 140 136 C 162 106 210 96 240 114 C 268 130 282 160 264 188 C 244 218 198 228 168 212 C 138 196 118 164 140 136 Z"
              fill="url(#pf-lake)"
              stroke="#bae6fd"
              strokeWidth="1.5"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduce ? 0 : 0.7, delay: reduce ? 0 : 0.15 }}
            />
            <text
              x="170"
              y="170"
              fill="#7ba3bf"
              fontSize="8.5"
              fontWeight="600"
              letterSpacing="1.4"
            >
              MARSH CREEK
            </text>

            {/* trails: compatible routes stay lit, off-profile routes fade back */}
            {TRAILS.map((trail) => {
              const compatible = preview.compatible.includes(trail.id);
              const hero = preview.hero === trail.id;
              return (
                <g key={trail.id}>
                  {hero && (
                    <motion.path
                      d={trail.d}
                      fill="none"
                      stroke="#ffffff"
                      strokeWidth={9}
                      strokeLinecap="round"
                      initial={reduce ? false : { pathLength: 0 }}
                      animate={{ pathLength: 1, opacity: compatible ? 0.95 : 0 }}
                      transition={{ duration: reduce ? 0 : 1.1, delay: reduce ? 0 : trail.delay }}
                    />
                  )}
                  <motion.path
                    d={trail.d}
                    fill="none"
                    stroke={hero ? "#065f46" : "#059669"}
                    strokeWidth={hero ? 4.4 : 2.8}
                    strokeLinecap="round"
                    strokeDasharray={compatible ? undefined : "5 6"}
                    initial={reduce ? false : { pathLength: 0 }}
                    animate={{
                      pathLength: 1,
                      opacity: compatible ? (hero ? 1 : 0.55) : 0.2,
                    }}
                    transition={{
                      pathLength: {
                        duration: reduce ? 0 : 1.5,
                        delay: reduce ? 0 : trail.delay,
                        ease: [0.16, 1, 0.3, 1],
                      },
                      opacity: { duration: 0.35 },
                    }}
                  />
                </g>
              );
            })}

            {/* small scale bar */}
            <g transform="translate(332 246)" opacity="0.6">
              <line x1="0" y1="0" x2="34" y2="0" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="0" y1="-3" x2="0" y2="3" stroke="#94a3b8" strokeWidth="1.5" />
              <line x1="34" y1="-3" x2="34" y2="3" stroke="#94a3b8" strokeWidth="1.5" />
            </g>
          </svg>

          {/* live chip */}
          <div className="absolute right-3 top-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-700 shadow-sm ring-1 ring-emerald-100 backdrop-blur">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
            </span>
            Live
          </div>

          {/* pins — swap with the active profile */}
          {preview.pins.map((pin, index) => {
            const Icon = pin.icon;
            return (
              <motion.div
                key={`${profile}-${pin.label}`}
                initial={reduce ? false : { opacity: 0, scale: 0.7 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ ...panelSpring, delay: reduce ? 0 : 0.25 + index * 0.1 }}
                className="absolute"
                style={{ left: pin.left, top: pin.top }}
                title={pin.label}
              >
                <div className="relative -translate-x-1/2 -translate-y-1/2">
                  <motion.span
                    aria-hidden
                    className={cn("absolute inset-0 rounded-full opacity-40", pin.ring)}
                    animate={reduce ? undefined : { scale: [1, 1.9], opacity: [0.45, 0] }}
                    transition={{
                      duration: 2.4,
                      repeat: Infinity,
                      ease: "easeInOut",
                      delay: 0.4 + index * 0.55,
                    }}
                  />
                  <span
                    className={cn(
                      "relative grid h-7 w-7 place-items-center rounded-full border-2 border-white text-white shadow-md",
                      pin.solid,
                    )}
                  >
                    <Icon size={13} strokeWidth={2.5} aria-hidden />
                    <span className="sr-only">{pin.label}</span>
                  </span>
                </div>
              </motion.div>
            );
          })}

          {/* geo-alert toast — copy changes with the profile */}
          <motion.div
            key={`alert-${profile}`}
            initial={reduce ? false : { opacity: 0, y: 14, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={reduce ? { duration: 0 } : { ...panelSpring, delay: 0.5 }}
            className="absolute bottom-3 left-3 flex max-w-[248px] items-start gap-2.5 rounded-xl border border-emerald-100 bg-white/95 p-2.5 pr-3 shadow-lg shadow-slate-900/10 backdrop-blur"
          >
            <span className="mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-100">
              <AlertIcon size={14} aria-hidden />
            </span>
            <span className="min-w-0">
              <span className="block text-[10px] font-bold uppercase tracking-[0.12em] text-emerald-600">
                Geo-alert
              </span>
              <span className="mt-0.5 block text-[12px] font-semibold leading-snug text-slate-800">
                {preview.alert}
              </span>
            </span>
          </motion.div>
        </div>
      </div>

      {/* caption */}
      <div className="flex items-center justify-between gap-3 px-2 pb-0.5 pt-3">
        <motion.div
          key={`caption-${profile}`}
          initial={reduce ? false : { opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="min-w-0"
        >
          <p className="flex items-center gap-1.5 truncate text-sm font-bold tracking-tight text-slate-900">
            <MapPin size={14} className="shrink-0 text-emerald-600" aria-hidden />
            {preview.captionName}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">{preview.captionMeta}</p>
        </motion.div>
        <Badge tone={TONE[profile]} className="shrink-0">
          {profile === "wheelchair" ? "Step-free" : profile === "biker" ? "Bike ready" : "Open"}
        </Badge>
      </div>
    </GlassPanel>
  );
}
