import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { useEffect } from "react";
import { createPortal } from "react-dom";

export interface LightboxPhoto {
  url: string;
  alt: string;
}

interface Props {
  photo: LightboxPhoto | null;
  onClose: () => void;
}

/** Full-screen review photo viewer. Portalled to <body> so sheet transforms can't clip it. */
export function PhotoLightbox({ photo, onClose }: Props) {
  useEffect(() => {
    if (!photo) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [photo, onClose]);

  return createPortal(
    <AnimatePresence>
      {photo ? (
        <motion.div
          key="review-photo-lightbox"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.18 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-label="Review photo"
          className="fixed inset-0 z-[1200] grid place-items-center bg-slate-950/85 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-[max(4.5rem,calc(env(safe-area-inset-top)+3.5rem))] backdrop-blur-sm"
        >
          <motion.button
            type="button"
            aria-label="Close photo"
            onClick={onClose}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] z-20 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white backdrop-blur-md transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            <X size={20} />
          </motion.button>

          <motion.img
            src={photo.url}
            alt={photo.alt}
            onClick={(event) => event.stopPropagation()}
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            onError={onClose}
            className="max-h-[calc(100dvh-7rem)] w-auto max-w-[calc(100vw-2rem)] rounded-2xl object-contain shadow-2xl shadow-slate-950/50"
          />
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
