import { motion, MotionConfig, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Leaf,
  LayoutDashboard,
  Map,
  Play,
  Radio,
  Route,
  Trees,
} from "lucide-react";
import { Button } from "../../components/ui/Button";
import { pageTransition, staggerItem, staggerList } from "../../motion/presets";
import FeatureStrip from "./FeatureStrip";
import HomeFooter from "./HomeFooter";
import MiniMapPreview from "./MiniMapPreview";
import ProfileSelector from "./ProfileSelector";
import TrailRail from "./TrailRail";
import { ParkAccessScore } from "../insights/ParkAccessScore";
import { useTrafficCrowd } from "../insights/useTraffic";
import { PARK_ACRES, STATE_PARKS, useTrailCount } from "./parkStats";

export default function HomePage() {
  const navigate = useNavigate();
  const reduce = useReducedMotion();
  const trailCount = useTrailCount();
  const crowd = useTrafficCrowd();

  const listVariants = reduce ? undefined : staggerList;
  const itemVariants = reduce ? undefined : staggerItem;

  const trustItems = [
    { icon: Trees, label: `${PARK_ACRES.toLocaleString("en-US")} acres` },
    { icon: Route, label: `${trailCount} mapped trails` },
    { icon: Radio, label: "Live ranger updates" },
  ];

  return (
    <MotionConfig reducedMotion="user">
      <motion.main
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
        className="bg-slate-50"
      >
        {/* ---------- hero ---------- */}
        <section className="hero-wash relative overflow-hidden">
          <div
            className="pointer-events-none absolute inset-0 grid-lines opacity-40"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -right-32 top-10 h-80 w-80 rounded-full bg-emerald-200/25 blur-3xl"
            aria-hidden
          />
          <div
            className="pointer-events-none absolute -left-24 bottom-0 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl"
            aria-hidden
          />

          <div className="relative mx-auto w-full max-w-7xl px-5 pb-16 pt-10 sm:px-8 sm:pt-14 lg:pb-24 lg:pt-20">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-14">
              {/* left: copy + profile + CTAs */}
              <motion.div variants={listVariants} initial="initial" animate="animate">
                <motion.div variants={itemVariants}>
                  <span className="inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/80 px-3 py-1.5 text-xs font-semibold text-emerald-800 shadow-sm shadow-emerald-900/5 backdrop-blur">
                    <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                      <Leaf size={12} strokeWidth={2.4} aria-hidden />
                    </span>
                    Pennsylvania State Parks
                    <span className="text-emerald-300" aria-hidden>
                      ·
                    </span>
                    Marsh Creek
                  </span>
                </motion.div>

                <motion.h1
                  variants={itemVariants}
                  className="mt-5 text-5xl font-extrabold leading-[1.03] tracking-tight text-slate-900 sm:text-6xl lg:text-7xl"
                >
                  Find your way,
                  <span className="block text-emerald-600">at your own pace.</span>
                </motion.h1>

                <motion.p
                  variants={itemVariants}
                  className="mt-5 max-w-xl text-lg leading-relaxed text-slate-600"
                >
                  Accessible routing, live geo-alerts and crowdsourced reporting across
                  Pennsylvania&rsquo;s {STATE_PARKS} state parks — so every visitor knows the
                  path ahead.
                </motion.p>

                <motion.div variants={itemVariants} className="mt-8">
                  <ProfileSelector />
                </motion.div>

                <motion.div
                  variants={itemVariants}
                  className="mt-7 flex flex-wrap items-center gap-3"
                >
                  <Button
                    size="lg"
                    className="group"
                    onClick={() => navigate("/map")}
                  >
                    <Map size={17} aria-hidden />
                    Open the live map
                    <ArrowRight
                      size={17}
                      className="transition-transform duration-200 group-hover:translate-x-1"
                      aria-hidden
                    />
                  </Button>
                  <Button
                    size="lg"
                    variant="secondary"
                    className="group"
                    onClick={() => navigate("/admin")}
                  >
                    <LayoutDashboard size={16} aria-hidden />
                    See the manager view
                    <ArrowRight
                      size={15}
                      className="text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-slate-700"
                      aria-hidden
                    />
                  </Button>
                  <motion.button
                    type="button"
                    onClick={() => window.open("/?demo=1", "_blank", "noopener")}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl border border-slate-200/80 bg-white px-5 text-sm font-semibold text-slate-700 shadow-sm transition-colors duration-200 hover:bg-slate-50 sm:w-auto"
                  >
                    <Play size={15} aria-hidden />
                    Watch the 3-min tour
                  </motion.button>
                </motion.div>

                <p className="mt-2.5 hidden text-xs text-slate-500 sm:block">
                  Opens a self-playing demo in a new tab
                </p>

                <motion.ul
                  variants={itemVariants}
                  className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs font-medium text-slate-500"
                >
                  {trustItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li key={item.label} className="flex items-center gap-1.5">
                        <Icon size={13} className="text-emerald-500" aria-hidden />
                        {item.label}
                      </li>
                    );
                  })}
                </motion.ul>
              </motion.div>

              {/* right: product preview */}
              <motion.div
                initial={reduce ? false : { opacity: 0, y: 28, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={
                  reduce
                    ? { duration: 0 }
                    : { duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }
                }
                className="relative"
              >
                <div
                  className="pointer-events-none absolute -inset-5 rounded-[2rem] bg-gradient-to-tr from-emerald-100/70 via-transparent to-sky-100/70 blur-2xl"
                  aria-hidden
                />
                <div className="relative">
                  <MiniMapPreview />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ---------- park accessibility score ---------- */}
        <section
          aria-label="Park accessibility score"
          className="mx-auto w-full max-w-7xl px-5 pb-16 pt-6 sm:px-8 lg:pb-20"
        >
          <ParkAccessScore />
        </section>

        {/* ---------- feature strip ---------- */}
        <section
          aria-label="Why PAthFind"
          className="relative z-10 mx-auto -mt-6 w-full max-w-7xl px-5 sm:px-8 lg:-mt-10"
        >
          <FeatureStrip />
        </section>

        {/* ---------- quick-start trails ---------- */}
        <TrailRail crowd={crowd} />

        {/* ---------- footer band ---------- */}
        <HomeFooter />
      </motion.main>
    </MotionConfig>
  );
}
