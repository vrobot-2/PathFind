import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cn } from "../../../lib/utils";
import { toastSlide } from "../../../motion/presets";

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

const toneIcon: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: XCircle,
  info: Info,
};

const toneAccent: Record<ToastTone, string> = {
  success: "text-emerald-400",
  error: "text-rose-400",
  info: "text-sky-400",
};

/** Tiny local toast queue with 3s auto-dismiss. */
export function useToasts() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const nextId = useRef(0);
  const timers = useRef<number[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback(
    (message: string, tone: ToastTone = "success") => {
      const id = ++nextId.current;
      setToasts((prev) => [...prev.slice(-2), { id, message, tone }]);
      const timer = window.setTimeout(() => dismiss(id), 3000);
      timers.current.push(timer);
    },
    [dismiss],
  );

  useEffect(
    () => () => {
      timers.current.forEach((timer) => window.clearTimeout(timer));
    },
    [],
  );

  return { toasts, push, dismiss };
}

export function ToastViewport({
  toasts,
  dismiss,
}: {
  toasts: ToastItem[];
  dismiss: (id: number) => void;
}) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-4 z-[100] flex w-[min(22rem,calc(100vw-2rem))] flex-col gap-2 sm:right-6">
      <AnimatePresence initial={false}>
        {toasts.map((toast) => {
          const Icon = toneIcon[toast.tone];
          return (
            <motion.div
              key={toast.id}
              layout
              variants={toastSlide}
              initial="initial"
              animate="animate"
              exit="exit"
              role="status"
              className="pointer-events-auto flex items-start gap-3 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-xl"
            >
              <Icon size={17} className={cn("mt-0.5 shrink-0", toneAccent[toast.tone])} />
              <span className="flex-1 leading-snug">{toast.message}</span>
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="mt-0.5 rounded-md p-0.5 text-slate-400 transition-colors hover:text-white"
                aria-label="Dismiss notification"
              >
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
