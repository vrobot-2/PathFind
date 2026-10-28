import type { Transition, Variants } from "framer-motion";

/** spring used for all floating panels / sheets */
export const panelSpring: Transition = {
  type: "spring",
  stiffness: 380,
  damping: 34,
  mass: 0.9,
};

export const softSpring: Transition = {
  type: "spring",
  stiffness: 240,
  damping: 28,
};

export const easeOut: Transition = { duration: 0.45, ease: [0.16, 1, 0.3, 1] };

/* ---------- page transitions ---------- */
export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.22, ease: "easeIn" } },
};

/* ---------- floating panels ---------- */
export const panelSlideIn: Variants = {
  initial: { opacity: 0, x: 32, scale: 0.98 },
  animate: { opacity: 1, x: 0, scale: 1, transition: panelSpring },
  exit: { opacity: 0, x: 24, scale: 0.98, transition: { duration: 0.18 } },
};

export const sheetUp: Variants = {
  initial: { y: "100%" },
  animate: { y: 0, transition: panelSpring },
  exit: { y: "100%", transition: { duration: 0.25, ease: [0.4, 0, 1, 1] } },
};

export const staggerList: Variants = {
  animate: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } },
};

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

/* ---------- toasts ---------- */
export const toastSlide: Variants = {
  initial: { opacity: 0, y: -24, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1, transition: panelSpring },
  exit: { opacity: 0, y: -16, scale: 0.97, transition: { duration: 0.2 } },
};

/* ---------- micro-interactions ---------- */
export const pressable = {
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
} as const;

export const hoverLift = {
  whileHover: { y: -4, transition: { duration: 0.2, ease: "easeOut" } },
} as const;

export const pinPulse = {
  animate: {
    scale: [1, 1.6, 1],
    opacity: [0.55, 0, 0.55],
    transition: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
  },
} as const;

/* ---------- route drawing ---------- */
export const routeTraceStyle = {
  strokeDasharray: 1,
  strokeDashoffset: 0,
  transition: { duration: 1.4, ease: "easeInOut" as const },
};
