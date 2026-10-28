import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { resolveSpotlightTarget } from "./spotlightTargets";

interface Cutout {
  x: number;
  y: number;
  width: number;
  height: number;
  vw: number;
  vh: number;
}

const PAD = 8;
const EDGE = 4;
const MIN_SIZE = 12;

function measure(target: HTMLElement): Cutout | null {
  const rect = target.getBoundingClientRect();
  if (rect.width <= 0 || rect.height <= 0) return null;

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  if (rect.bottom <= 0 || rect.top >= vh || rect.right <= 0 || rect.left >= vw) {
    return null; // entirely off-screen — never dim an empty screen
  }

  const x = Math.max(EDGE, Math.min(vw - EDGE - MIN_SIZE, rect.left - PAD));
  const y = Math.max(EDGE, Math.min(vh - EDGE - MIN_SIZE, rect.top - PAD));
  const right = Math.min(vw - EDGE, Math.max(x + MIN_SIZE, rect.right + PAD));
  const bottom = Math.min(vh - EDGE, Math.max(y + MIN_SIZE, rect.bottom + PAD));

  return { x, y, width: right - x, height: bottom - y, vw, vh };
}

function sameRect(a: Cutout | null, b: Cutout | null) {
  if (a === b) return true;
  if (!a || !b) return false;
  return (
    Math.abs(a.x - b.x) < 0.5 &&
    Math.abs(a.y - b.y) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5 &&
    a.vw === b.vw &&
    a.vh === b.vh
  );
}

/**
 * Dims everything except a rounded cutout around the current step's subject.
 * Four fixed wash panels + an emerald ring; nothing here accepts pointer events.
 */
export default function Spotlight({
  active,
  stepIndex,
}: {
  active: boolean;
  stepIndex: number;
}) {
  const reduce = useReducedMotion();
  const [target, setTarget] = useState<HTMLElement | null>(null);
  const [cutout, setCutout] = useState<Cutout | null>(null);
  const targetRef = useRef<HTMLElement | null>(null);

  /* Resolve the target for this step, retrying while async pages settle. */
  useEffect(() => {
    setTarget(null);
    setCutout(null);
    targetRef.current = null;
    if (!active) return;

    let cancelled = false;
    let tries = 0;
    let retry: number | null = null;

    const find = () => {
      if (cancelled) return;
      const found = resolveSpotlightTarget(stepIndex);
      if (found) {
        targetRef.current = found;
        setTarget(found);
        return;
      }
      tries += 1;
      if (tries < 14) retry = window.setTimeout(find, 250);
    };

    // Let the route transition render before looking.
    retry = window.setTimeout(find, 180);
    return () => {
      cancelled = true;
      if (retry) window.clearTimeout(retry);
    };
  }, [active, stepIndex]);

  /* Track the target while the page scrolls under it. */
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    let running = true;
    let last: Cutout | null = null;

    const tick = () => {
      if (!running) return;
      const next = measure(target);
      if (!sameRect(last, next)) {
        last = next;
        setCutout(next);
      }
      frame = window.requestAnimationFrame(tick);
    };

    tick();
    return () => {
      running = false;
      window.cancelAnimationFrame(frame);
    };
  }, [target]);

  const transition = reduce
    ? { duration: 0 }
    : { duration: 0.26, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };
  const visible = active && cutout !== null;

  return (
    <AnimatePresence>
      {visible && cutout && (
        <motion.div
          key="spotlight"
          aria-hidden
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: reduce ? 0 : 0.18 }}
          data-demo-spotlight
          className="pointer-events-none fixed inset-0 z-[1135]"
        >
          {/* top */}
          <motion.div
            initial={false}
            animate={{ x: 0, y: 0, width: cutout.vw, height: cutout.y }}
            transition={transition}
            className="pointer-events-none fixed left-0 top-0 bg-slate-900/45"
          />
          {/* bottom */}
          <motion.div
            initial={false}
            animate={{
              x: 0,
              y: cutout.y + cutout.height,
              width: cutout.vw,
              height: Math.max(0, cutout.vh - cutout.y - cutout.height),
            }}
            transition={transition}
            className="pointer-events-none fixed left-0 top-0 bg-slate-900/45"
          />
          {/* left */}
          <motion.div
            initial={false}
            animate={{
              x: 0,
              y: cutout.y,
              width: cutout.x,
              height: cutout.height,
            }}
            transition={transition}
            className="pointer-events-none fixed left-0 top-0 bg-slate-900/45"
          />
          {/* right */}
          <motion.div
            initial={false}
            animate={{
              x: cutout.x + cutout.width,
              y: cutout.y,
              width: Math.max(0, cutout.vw - cutout.x - cutout.width),
              height: cutout.height,
            }}
            transition={transition}
            className="pointer-events-none fixed left-0 top-0 bg-slate-900/45"
          />
          {/* cutout edge */}
          <motion.div
            initial={false}
            animate={{
              x: cutout.x,
              y: cutout.y,
              width: cutout.width,
              height: cutout.height,
            }}
            transition={transition}
            className="pointer-events-none fixed left-0 top-0 rounded-2xl ring-2 ring-emerald-400 shadow-[0_0_0_4px_rgba(16,185,129,0.25)]"
            data-demo-cutout
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
