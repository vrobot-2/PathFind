import { AnimatePresence, motion, type Variants } from "framer-motion";
import { Check, Navigation, Share2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "../../components/ui/Button";
import { panelSpring, pressable, staggerItem, staggerList } from "../../motion/presets";
import { ReviewsSection } from "../reviews/ReviewsSection";
import { useAppStore } from "../../store/useAppStore";
import { AccessibilitySpec } from "./AccessibilitySpec";
import { LiveConditions } from "./LiveConditions";
import { ProfileBanner } from "./ProfileBanner";
import { TrailHero } from "./TrailHero";
import { getProfileFit } from "./trailDetail";

const sheetVariants: Variants = {
  initial: { opacity: 0, y: 32, scale: 0.985 },
  animate: { opacity: 1, y: 0, scale: 1, transition: panelSpring },
  exit: { opacity: 0, y: 24, scale: 0.985, transition: { duration: 0.18, ease: "easeIn" } },
};

interface Props {
  trailId: string | null;
  onClose: () => void;
}

export default function TrailDetailSheet({ trailId, onClose }: Props) {
  const trail = useAppStore((s) =>
    trailId ? s.trails.find((candidate) => candidate.id === trailId) ?? null : null,
  );
  const reports = useAppStore((s) => s.reports);
  const profile = useAppStore((s) => s.profile);
  const startRoute = useAppStore((s) => s.startRoute);
  const requestStart = useAppStore((s) => s.requestStart);
  const setPinMode = useAppStore((s) => s.setPinMode);

  const [copied, setCopied] = useState(false);
  const copyTimer = useRef<number | null>(null);

  /* reset transient copy state when the sheet switches trails */
  useEffect(() => {
    setCopied(false);
    if (copyTimer.current !== null) {
      window.clearTimeout(copyTimer.current);
      copyTimer.current = null;
    }
  }, [trailId]);

  useEffect(
    () => () => {
      if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    },
    [],
  );

  const trailReports = useMemo(() => {
    if (!trail) return [];
    return reports
      .filter((report) => report.trailId === trail.id && report.status !== "resolved")
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 3);
  }, [reports, trail]);

  const fit = useMemo(() => (trail ? getProfileFit(trail, profile) : null), [trail, profile]);

  const handleShare = async () => {
    if (!trail) return;
    const link = `https://pathfind.app/trails/${trail.id}`;
    try {
      await navigator.clipboard.writeText(link);
    } catch {
      /* clipboard blocked — still show optimistic feedback */
    }
    setCopied(true);
    if (copyTimer.current !== null) window.clearTimeout(copyTimer.current);
    copyTimer.current = window.setTimeout(() => setCopied(false), 1600);
  };

  const handleReport = () => {
    setPinMode("report");
    onClose();
  };

  return (
    <AnimatePresence mode="wait">
      {trail && fit ? (
        <motion.div
          key={trail.id}
          variants={sheetVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          role="dialog"
          aria-label={`${trail.name} trail details`}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 right-4 z-[900] flex max-h-[80vh] flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/15 sm:left-auto sm:w-[420px]"
        >
          {/* grab handle + close */}
          <div className="relative flex min-h-[3.25rem] shrink-0 items-center justify-center px-4 pb-1 pt-2.5">
            <span aria-hidden="true" className="h-1.5 w-10 rounded-full bg-slate-200" />
            <motion.button
              type="button"
              {...pressable}
              onClick={onClose}
              aria-label="Close trail details"
              className="absolute right-1.5 top-1.5 z-20 grid h-11 w-11 shrink-0 place-items-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40"
            >
              <X size={18} />
            </motion.button>
          </div>

          <motion.div
            variants={staggerList}
            initial="initial"
            animate="animate"
            className="min-h-0 flex-1 overflow-y-auto px-4"
          >
            <motion.div variants={staggerItem}>
              <TrailHero trail={trail} profile={profile} />
            </motion.div>

            <motion.div variants={staggerItem} className="mt-3">
              <ProfileBanner profile={profile} fit={fit} />
            </motion.div>

            <motion.div variants={staggerItem} className="mt-3">
              <AccessibilitySpec trail={trail} />
            </motion.div>

            <motion.div variants={staggerItem} className="mt-4">
              <LiveConditions reports={trailReports} onReport={handleReport} />
            </motion.div>

            <motion.div variants={staggerItem} className="mt-4 pb-4">
              <ReviewsSection trailId={trail.id} />
            </motion.div>
          </motion.div>

          {/* CTA row — fixed to the bottom of the sheet, never scrolls away */}
          <motion.div
            variants={staggerItem}
            initial="initial"
            animate="animate"
            className="z-10 shrink-0 border-t border-slate-200/80 bg-white/95 px-4 pb-3 pt-3 backdrop-blur"
          >
            <div className="flex min-w-0 items-center gap-2">
              <Button
                onClick={() => requestStart(trail)}
                className="min-w-0 flex-1 whitespace-nowrap px-3 text-sm sm:px-5"
                aria-label={`Start route on ${trail.name}`}
              >
                <Navigation size={16} className="shrink-0" />
                Start route
              </Button>

              <div className="relative shrink-0">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => void handleShare()}
                  aria-label="Share trail"
                  aria-live="polite"
                  className="h-11 w-11 shrink-0"
                >
                  {copied ? <Check size={16} className="text-emerald-600" /> : <Share2 size={16} />}
                </Button>
                <AnimatePresence>
                  {copied ? (
                    <motion.span
                      initial={{ opacity: 0, y: 4, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.96 }}
                      transition={{ duration: 0.16 }}
                      className="pointer-events-none absolute -top-8 right-0 whitespace-nowrap rounded-full bg-slate-900 px-2.5 py-1 text-[10px] font-semibold text-white shadow-lg shadow-slate-900/20"
                    >
                      Copied
                    </motion.span>
                  ) : null}
                </AnimatePresence>
              </div>

              <Button
                variant="ghost"
                onClick={onClose}
                className="h-11 shrink-0 px-3 text-sm sm:px-5"
              >
                Close
              </Button>
            </div>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
