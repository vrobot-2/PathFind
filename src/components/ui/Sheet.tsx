import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { sheetUp } from "../../motion/presets";

interface SheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  className?: string;
  /** bottom sheet (mobile style) or centered modal */
  variant?: "sheet" | "modal";
}

export function Sheet({ open, onClose, children, title, className, variant = "sheet" }: SheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-end justify-center sm:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />
          <motion.div
            variants={sheetUp}
            initial="initial"
            animate="animate"
            exit="exit"
            className={cn(
              "relative z-10 max-h-[88vh] w-full overflow-y-auto border border-slate-200/80 bg-white p-6 shadow-2xl shadow-slate-900/20",
              variant === "sheet" ? "rounded-t-3xl sm:rounded-3xl sm:max-w-lg" : "rounded-3xl sm:max-w-xl",
              className,
            )}
          >
            <div className="mb-4 flex items-start justify-between gap-3">
              {title ? (
                <h2 className="min-w-0 max-w-[calc(100%-2.5rem)] break-words text-lg font-bold tracking-tight text-slate-900">
                  {title}
                </h2>
              ) : (
                <span />
              )}
              <motion.button
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                onClick={onClose}
                aria-label="Close"
                className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={18} />
              </motion.button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
