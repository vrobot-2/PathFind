import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, CloudOff } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { staggerList } from "../../motion/presets";
import { useAppStore } from "../../store/useAppStore";
import { PROFILE_LABEL } from "../../types";
import type { CrowdMap } from "../insights/useTraffic";
import { TrailCard, TrailCardSkeleton } from "./TrailCard";

export default function TrailRail({ crowd }: { crowd?: CrowdMap }) {
  const trails = useAppStore((s) => s.trails);
  const trailsLoading = useAppStore((s) => s.trailsLoading);
  const loadTrails = useAppStore((s) => s.loadTrails);
  const profile = useAppStore((s) => s.profile);

  const [attempted, setAttempted] = useState(false);
  const requested = useRef(false);

  useEffect(() => {
    if (trails.length > 0 || requested.current) return;
    requested.current = true;
    setAttempted(true);
    void loadTrails();
  }, [trails.length, loadTrails]);

  const loading = trailsLoading || (!attempted && trails.length === 0);
  const failed = attempted && !trailsLoading && trails.length === 0;
  const featured = trails.slice(0, 3);

  return (
    <section
      aria-labelledby="start-here-heading"
      className="mx-auto w-full max-w-7xl px-5 pb-16 pt-14 sm:px-8 lg:pb-24 lg:pt-20"
    >
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-emerald-600">
            Quick start
          </p>
          <h2
            id="start-here-heading"
            className="mt-2 text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl"
          >
            Start here
          </h2>
          <p className="mt-2 max-w-lg text-base leading-relaxed text-slate-600">
            Three routes our rangers recommend first — selected for your{" "}
            {PROFILE_LABEL[profile]} profile.
          </p>
        </div>

        <Link
          to="/map"
          className="group inline-flex items-center gap-1.5 rounded-lg px-1 py-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2"
        >
          View all on map
          <ArrowRight
            size={15}
            className="transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>

      {loading && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-6">
          {[0, 1, 2].map((i) => (
            <TrailCardSkeleton key={i} />
          ))}
        </div>
      )}

      {failed && (
        <div className="mt-8 flex flex-col items-start gap-4 rounded-2xl border border-dashed border-slate-300 bg-white/70 p-6 sm:flex-row sm:items-center">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
            <CloudOff size={20} aria-hidden />
          </span>
          <div className="flex-1">
            <p className="text-sm font-bold text-slate-900">Park data offline</p>
            <p className="mt-0.5 text-sm leading-relaxed text-slate-600">
              The live trail feed didn&rsquo;t respond. Your profile still applies once it
              reconnects.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={() => void loadTrails()}>
            Retry
          </Button>
        </div>
      )}

      {!loading && !failed && (
        <motion.div
          variants={staggerList}
          initial="initial"
          animate="animate"
          className="no-scrollbar mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 md:grid md:grid-cols-2 md:gap-5 md:overflow-visible md:pb-0 lg:grid-cols-3 lg:gap-6"
        >
          {featured.map((trail) => (
            <div
              key={trail.id}
              className="w-[292px] shrink-0 snap-start sm:w-[336px] md:w-auto md:shrink"
            >
              <TrailCard trail={trail} crowd={crowd?.[trail.id]} />
            </div>
          ))}
        </motion.div>
      )}
    </section>
  );
}
