import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, MapPin, X } from "lucide-react";
import { useAppStore } from "../../store/useAppStore";
import { Button } from "../../components/ui/Button";
import { panelSpring, softSpring } from "../../motion/presets";
import { ReportForm } from "./ReportForm";

export { ReportsFeedPanel } from "./ReportsFeedPanel";

function PinPrompt({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center px-2 py-3 text-center">
      <div className="relative mb-5 grid h-24 w-24 place-items-center">
        <motion.span
          animate={{ scale: [1, 1.6, 1], opacity: [0.55, 0, 0.55] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full bg-emerald-400/30"
        />
        <motion.span
          animate={{ scale: [1, 1.22, 1], opacity: [0.45, 0.12, 0.45] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-4 rounded-full bg-emerald-100"
        />
        <span className="relative grid h-14 w-14 place-items-center rounded-2xl bg-emerald-900 text-white shadow-lg shadow-emerald-900/25">
          <MapPin size={24} />
        </span>
      </div>
      <h2 className="text-lg font-bold tracking-tight text-slate-900">Drop a pin</h2>
      <p className="mt-1.5 max-w-[300px] text-sm font-medium leading-relaxed text-slate-500">
        Tap anywhere on the map to drop a pin
      </p>
      <p className="mt-1 max-w-[300px] text-xs font-medium leading-relaxed text-slate-400">
        Then tell us what you found so rangers and other visitors can plan around it.
      </p>
      <Button variant="secondary" onClick={onCancel} className="mt-6 w-full max-w-[240px]">
        Cancel
      </Button>
    </div>
  );
}

function SuccessState() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={softSpring}
      className="flex flex-col items-center px-2 py-6 text-center"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={softSpring}
        className="mb-4 grid h-16 w-16 place-items-center rounded-full bg-emerald-50 text-emerald-600"
      >
        <CheckCircle2 size={34} strokeWidth={2} />
      </motion.span>
      <h2 className="text-lg font-bold tracking-tight text-slate-900">Report submitted</h2>
      <p className="mt-1.5 max-w-[320px] text-sm font-medium leading-relaxed text-slate-500">
        Thanks — rangers and visitors can see this now
      </p>
      <span className="mt-5 rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-400">
        Closing automatically…
      </span>
    </motion.div>
  );
}

export function ReportModal(): JSX.Element | null {
  const pinMode = useAppStore((s) => s.pinMode);
  const pendingPin = useAppStore((s) => s.pendingPin);
  const setPinMode = useAppStore((s) => s.setPinMode);

  const [open, setOpen] = useState(pinMode === "report");
  const [success, setSuccess] = useState(false);
  const successRef = useRef(false);

  useEffect(() => {
    if (pinMode === "report") {
      successRef.current = false;
      setSuccess(false);
      setOpen(true);
    } else if (!successRef.current) {
      setOpen(false);
    }
  }, [pinMode]);

  useEffect(() => {
    if (!success) return;
    const timer = window.setTimeout(() => {
      successRef.current = false;
      setSuccess(false);
      setOpen(false);
      setPinMode("none");
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [success, setPinMode]);

  function close() {
    successRef.current = false;
    setSuccess(false);
    setOpen(false);
    setPinMode("none");
  }

  function handleSuccess() {
    successRef.current = true;
    setSuccess(true);
  }

  const contentKey = success ? "success" : "form";
  // While waiting for a map click we must NOT cover the map — show a floating banner instead.
  const prompting = open && !pendingPin && !success;

  return (
    <>
      <AnimatePresence>
        {prompting && (
          <motion.div
            className="pointer-events-none fixed inset-x-0 top-20 z-[900] flex justify-center px-4"
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, transition: panelSpring }}
            exit={{ opacity: 0, y: -12, scale: 0.98, transition: { duration: 0.18 } }}
          >
            <div className="pointer-events-auto flex w-full max-w-md items-center gap-3 rounded-2xl border border-slate-200/80 bg-white/95 px-4 py-3 shadow-xl shadow-slate-200/60 backdrop-blur-md">
              <div className="relative grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <motion.span
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                  transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 rounded-xl bg-emerald-400/40"
                />
                <MapPin size={18} className="relative" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-bold tracking-tight text-slate-900">Drop a pin</p>
                <p className="truncate text-xs font-medium text-slate-500">
                  Tap anywhere on the map to mark what you found
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={close} className="ml-auto shrink-0">
                Cancel
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
      {open && !prompting && (
        <motion.div
          className="fixed inset-0 z-[1000] flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="absolute inset-0 bg-slate-900/25 backdrop-blur-[2px]"
            onClick={close}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Community report"
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0, transition: panelSpring }}
            exit={{ opacity: 0, scale: 0.96, y: 8, transition: { duration: 0.18 } }}
            className="relative z-10 max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl border border-slate-200/80 bg-white p-6 shadow-2xl"
          >
            {!success && (
              <motion.button
                type="button"
                onClick={close}
                aria-label="Close report"
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.94 }}
                className="absolute right-4 top-4 z-20 grid h-8 w-8 place-items-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-900"
              >
                <X size={16} />
              </motion.button>
            )}

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={contentKey}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              >
                {success ? (
                  <SuccessState />
                ) : pendingPin ? (
                  <ReportForm
                    key={`${pendingPin.lat}:${pendingPin.lng}`}
                    lat={pendingPin.lat}
                    lng={pendingPin.lng}
                    onSuccess={handleSuccess}
                    onCancel={close}
                  />
                ) : (
                  <PinPrompt onCancel={close} />
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}
