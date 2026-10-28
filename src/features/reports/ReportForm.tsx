import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, Loader2, MapPin, Send, X } from "lucide-react";
import type { ReportCategory, Severity } from "../../types";
import { useAppStore } from "../../store/useAppStore";
import { Button } from "../../components/ui/Button";
import { cn, distanceMeters } from "../../lib/utils";
import { softSpring } from "../../motion/presets";
import {
  CATEGORY_META,
  CATEGORY_ORDER,
  SEVERITY_META,
  SEVERITY_ORDER,
  needsSeverity,
} from "./categoryMeta";

interface ReportFormProps {
  lat: number;
  lng: number;
  onSuccess: () => void;
  onCancel: () => void;
}

function FieldLabel({ children, hint }: { children: ReactNode; hint?: ReactNode }) {
  return (
    <div className="mb-2 flex items-baseline justify-between gap-3">
      <span className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">
        {children}
      </span>
      {hint}
    </div>
  );
}

export function ReportForm({ lat, lng, onSuccess, onCancel }: ReportFormProps) {
  const trails = useAppStore((s) => s.trails);
  const submitReport = useAppStore((s) => s.submitReport);

  const nearestTrailId = useMemo(() => {
    let bestId = "";
    let bestDist = Number.POSITIVE_INFINITY;
    for (const trail of trails) {
      for (const point of trail.geometry) {
        const d = distanceMeters({ lat, lng }, { lat: point[0], lng: point[1] });
        if (d < bestDist) {
          bestDist = d;
          bestId = trail.id;
        }
      }
    }
    return bestId;
  }, [trails, lat, lng]);

  const [category, setCategory] = useState<ReportCategory | null>(null);
  const [severity, setSeverity] = useState<Severity>("medium");
  const [note, setNote] = useState("");
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [trailId, setTrailId] = useState(nearestTrailId);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // trails may finish loading after the pin is dropped
  useEffect(() => {
    if (!trailId && nearestTrailId) setTrailId(nearestTrailId);
  }, [nearestTrailId, trailId]);

  function handlePhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setPhotoDataUrl(reader.result);
        setError(null);
      }
    };
    reader.onerror = () => setError("That photo could not be read — try another image.");
    reader.readAsDataURL(file);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!category) {
      setError("Choose a category so rangers know what to look for.");
      return;
    }
    if (!trailId) {
      setError("Select the trail this report belongs to.");
      return;
    }
    if (!note.trim()) {
      setError("Add a short note so visitors know what to expect.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await submitReport({
        trailId,
        lat,
        lng,
        category,
        severity: needsSeverity(category) ? severity : "low",
        note: note.trim(),
        photoDataUrl,
      });
      onSuccess();
    } catch {
      setError("Something went wrong sending your report. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="flex flex-col items-start gap-2 pr-14 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between sm:gap-3">
        <div className="w-full min-w-0 sm:w-auto sm:flex-1">
          <h2 className="text-lg font-bold tracking-tight text-slate-900">Report a find</h2>
          <p className="mt-0.5 text-xs font-medium text-slate-500">
            Help the next visitor know what to expect.
          </p>
        </div>
        <span className="mt-0.5 inline-flex max-w-full shrink-0 items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-semibold tabular-nums text-slate-500">
          <MapPin size={11} className="shrink-0" />
          <span className="truncate">
            {lat.toFixed(5)}, {lng.toFixed(5)}
          </span>
        </span>
      </div>

      {/* category */}
      <div>
        <FieldLabel>Category</FieldLabel>
        <div className="grid grid-cols-2 gap-2.5">
          {CATEGORY_ORDER.map((id) => {
            const meta = CATEGORY_META[id];
            const Icon = meta.icon;
            const selected = category === id;
            return (
              <motion.button
                key={id}
                type="button"
                aria-pressed={selected}
                onClick={() => {
                  setCategory(id);
                  setError(null);
                }}
                animate={{ scale: selected ? 1.02 : 1 }}
                whileHover={{ scale: selected ? 1.02 : 1.015 }}
                whileTap={{ scale: 0.98 }}
                transition={softSpring}
                className={cn(
                  "relative flex min-h-[92px] flex-col items-start gap-2 rounded-2xl border-2 p-3 text-left transition-colors duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30",
                  selected
                    ? meta.selected
                    : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/70",
                )}
              >
                <span className={cn("grid h-9 w-9 place-items-center rounded-xl", meta.tile)}>
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span className="block">
                  <span
                    className={cn(
                      "block text-sm font-semibold leading-tight",
                      selected ? meta.text : "text-slate-800",
                    )}
                  >
                    {meta.label}
                  </span>
                  <span className="mt-0.5 block text-[11px] font-medium leading-tight text-slate-400">
                    {meta.descriptor}
                  </span>
                </span>
                <AnimatePresence>
                  {selected && (
                    <motion.span
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={softSpring}
                      className="absolute right-2.5 top-2.5 grid h-5 w-5 place-items-center rounded-full bg-white/90 shadow-sm"
                    >
                      <Check size={12} strokeWidth={3} className={meta.iconColor} />
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* severity — hazards + accessibility only */}
      <AnimatePresence initial={false}>
        {category && needsSeverity(category) && (
          <motion.div
            key="severity"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <FieldLabel hint={<span className="text-[11px] font-medium text-slate-400">How serious?</span>}>
              Severity
            </FieldLabel>
            <div className="grid grid-cols-3 gap-1 rounded-xl bg-slate-100 p-1">
              {SEVERITY_ORDER.map((level) => {
                const meta = SEVERITY_META[level];
                const selected = severity === level;
                return (
                  <motion.button
                    key={level}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setSeverity(level)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={cn(
                      "flex h-9 items-center justify-center gap-1.5 rounded-lg text-xs font-semibold transition-colors duration-200",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30",
                      selected ? meta.selected : "text-slate-500 hover:text-slate-800",
                    )}
                  >
                    <span
                      className={cn(
                        "h-1.5 w-1.5 rounded-full",
                        selected ? "bg-white/85" : meta.dot,
                      )}
                    />
                    {meta.label}
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* note */}
      <div>
        <FieldLabel
          hint={
            <span
              className={cn(
                "text-[11px] font-semibold tabular-nums",
                note.length >= 130 ? "text-amber-600" : "text-slate-400",
              )}
            >
              {note.length}/140
            </span>
          }
        >
          Note
        </FieldLabel>
        <textarea
          value={note}
          maxLength={140}
          onChange={(event) => {
            setNote(event.target.value);
            if (error) setError(null);
          }}
          rows={3}
          placeholder="What did you find? e.g. Washed-out section, 3 ft wide"
          className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-sm font-medium text-slate-800 placeholder:font-normal placeholder:text-slate-400 outline-none transition-colors duration-200 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
        />
      </div>

      {/* photo */}
      <div>
        <FieldLabel hint={<span className="text-[11px] font-medium text-slate-400">Optional</span>}>
          Photo
        </FieldLabel>
        {photoDataUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-slate-100">
            <img
              src={photoDataUrl}
              alt="Report photo preview"
              className="h-36 w-full object-cover"
            />
            <motion.button
              type="button"
              aria-label="Remove photo"
              onClick={() => setPhotoDataUrl(null)}
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              className="absolute right-2 top-2 z-10 grid h-10 w-10 place-items-center rounded-full bg-slate-900/65 text-white backdrop-blur-sm transition-colors hover:bg-slate-900/80"
            >
              <X size={16} />
            </motion.button>
            <span className="absolute bottom-2 left-2 rounded-full bg-slate-900/65 px-2.5 py-1 text-[10px] font-semibold text-white backdrop-blur-sm">
              Photo attached
            </span>
          </div>
        ) : (
          <motion.button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            whileHover={{ scale: 1.015 }}
            whileTap={{ scale: 0.98 }}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/70 py-5 text-slate-500 transition-colors duration-200 hover:border-emerald-300 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/30"
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-white text-emerald-600 shadow-sm shadow-slate-200">
              <Camera size={18} />
            </span>
            <span className="text-xs font-semibold text-slate-600">
              Add a photo <span className="font-normal text-slate-400">(optional)</span>
            </span>
          </motion.button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handlePhoto}
        />
      </div>

      {/* trail */}
      <div>
        <FieldLabel>Trail</FieldLabel>
        <select
          value={trailId}
          onChange={(event) => {
            setTrailId(event.target.value);
            if (error) setError(null);
          }}
          className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-800 outline-none transition-colors duration-200 focus:border-emerald-300 focus:bg-white focus:ring-2 focus:ring-emerald-500/20"
        >
          <option value="">Select trail</option>
          {trails.map((trail) => (
            <option key={trail.id} value={trail.id}>
              {trail.name}
            </option>
          ))}
        </select>
        {nearestTrailId && trailId === nearestTrailId && (
          <p className="mt-1.5 text-[11px] font-medium text-slate-400">
            Nearest trail selected from your dropped pin.
          </p>
        )}
      </div>

      <AnimatePresence initial={false}>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-medium leading-relaxed text-rose-700"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 gap-2 pt-0.5 sm:grid-cols-[1fr_auto]">
        <Button type="submit" disabled={submitting} className="w-full">
          {submitting ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Submitting…
            </>
          ) : (
            <>
              <Send size={15} />
              Submit report
            </>
          )}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
