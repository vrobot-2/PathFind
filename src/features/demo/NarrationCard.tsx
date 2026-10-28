import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Pause, Play, Volume2, VolumeX, X, Accessibility } from "lucide-react";
import { cn } from "../../lib/utils";

interface Props {
  stepIndex: number;
  total: number;
  headline: string;
  support: string;
  progress: number;
  kiosk: boolean;
  muted: boolean;
  blocked: boolean;
  paused: boolean;
  onToggleMuted: () => void;
  onEnableSound: () => void;
  onTogglePause: () => void;
  onCancel: () => void;
}

const CHAR_MS = 26;
const MAX_CHARS_PER_FRAME = 10;

/** Types the headline out from zero on every step change. */
function useTypewriter(text: string, enabled: boolean) {
  // `state.text` lets a new step reset to zero during render (before paint),
  // so the previous step's characters can never flash on the new headline.
  const [state, setState] = useState(() => ({ text, count: enabled ? 0 : text.length }));
  let count = state.count;
  if (state.text !== text) {
    count = enabled ? 0 : text.length;
    setState({ text, count });
  }

  useEffect(() => {
    if (!enabled) {
      setState({ text, count: text.length });
      return;
    }

    setState({ text, count: 0 });
    let frame = 0;
    let startedAt = 0;
    let revealed = 0;

    const tick = (now: number) => {
      if (!startedAt) startedAt = now;
      const due = Math.min(text.length, Math.floor((now - startedAt) / CHAR_MS) + 1);
      const next = Math.min(due, revealed + MAX_CHARS_PER_FRAME);
      if (next !== revealed) {
        revealed = next;
        setState({ text, count: next });
      }
      if (next < text.length) frame = window.requestAnimationFrame(tick);
    };

    frame = window.requestAnimationFrame(tick);
    return () => window.cancelAnimationFrame(frame);
  }, [text, enabled]);

  return enabled ? text.slice(0, count) : text;
}

function Caret({ animate }: { animate: boolean }) {
  if (!animate) {
    return (
      <span aria-hidden className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] rounded-full bg-emerald-500" />
    );
  }
  return (
    <motion.span
      aria-hidden
      initial={{ opacity: 1 }}
      animate={{ opacity: [1, 1, 0, 0] }}
      transition={{ duration: 1.05, ease: "linear", repeat: Infinity, times: [0, 0.5, 0.5, 1] }}
      className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.12em] rounded-full bg-emerald-500"
    />
  );
}

export default function NarrationCard({
  stepIndex,
  total,
  headline,
  support,
  progress,
  kiosk,
  muted,
  blocked,
  paused,
  onToggleMuted,
  onEnableSound,
  onTogglePause,
  onCancel,
}: Props) {
  const reduce = useReducedMotion() ?? false;
  const typed = useTypewriter(headline, !reduce);

  return (
    <div
      data-demo-card
      data-demo-step={stepIndex + 1}
      className="rounded-2xl border border-slate-200/80 bg-white/95 shadow-2xl shadow-slate-900/15 backdrop-blur-md"
    >
      <div className="px-3.5 pb-3 pt-2.5 sm:px-4 sm:pb-4 sm:pt-3">
        {/* compact status row: label + step counter + progress + audio controls */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "flex shrink-0 items-center gap-1 text-[10px] font-bold uppercase tracking-[0.14em]",
              paused ? "text-amber-600" : "text-emerald-700",
            )}
          >
            <Accessibility size={12} strokeWidth={2.4} aria-hidden />
            {paused ? "Paused" : kiosk ? "Live demo" : "Judge demo"}
          </span>
          <span className="shrink-0 text-[10px] font-semibold tabular-nums text-slate-400">
            Step {(stepIndex + 1).toString().padStart(2, "0")} /{" "}
            {total.toString().padStart(2, "0")}
          </span>
          <div className="mx-1 h-1 min-w-0 flex-1 overflow-hidden rounded-full bg-slate-100">
            <motion.div
              className="h-full rounded-full bg-emerald-600"
              animate={{ width: `${Math.round(progress * 100)}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
          </div>
          <button
            type="button"
            onClick={onToggleMuted}
            aria-label={muted ? "Unmute narration" : "Mute narration"}
            aria-pressed={muted}
            title={muted ? "Unmute narration" : "Mute narration"}
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
              muted
                ? "bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
            )}
          >
            {muted ? <VolumeX size={14} /> : <Volume2 size={14} />}
          </button>
          <button
            type="button"
            onClick={onTogglePause}
            aria-label={paused ? "Resume demo" : "Pause demo"}
            aria-pressed={paused}
            title={paused ? "Resume demo" : "Pause demo"}
            className={cn(
              "grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors",
              paused
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900",
            )}
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancel the demo"
            title="Cancel the demo"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-600"
          >
            <X size={14} />
          </button>
        </div>

        {/* documentary caption */}
        <p
          key={`headline-${stepIndex}`}
          className="mt-2 min-h-[1.5em] text-balance break-words text-lg font-extrabold leading-snug tracking-tight text-slate-900 sm:text-2xl"
        >
          <span aria-hidden data-demo-typed>{typed}</span>
          <Caret animate={!reduce} />
          <span className="sr-only">{headline}</span>
        </p>
        <p
          key={`support-${stepIndex}`}
          className="mt-1 max-w-[34rem] text-pretty break-words text-xs leading-relaxed text-slate-500 sm:text-sm"
        >
          {support}
        </p>

        {blocked && (
          <button
            type="button"
            onClick={onEnableSound}
            className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 ring-1 ring-emerald-200 transition-colors hover:bg-emerald-100"
          >
            <Volume2 size={12} />
            Tap for sound
          </button>
        )}
      </div>
    </div>
  );
}
