import { motion, type HTMLMotionProps } from "framer-motion";
import type { ReactNode } from "react";
import { cn } from "../../lib/utils";
import { elevation } from "../../styles/tokens";

interface Props extends HTMLMotionProps<"div"> {
  children: ReactNode;
  className?: string;
  hoverLift?: boolean;
  padded?: boolean;
}

export function Card({ children, className, hoverLift = false, padded = true, ...rest }: Props) {
  return (
    <motion.div
      whileHover={
        hoverLift ? { y: -4, transition: { duration: 0.2, ease: "easeOut" } } : undefined
      }
      className={cn(elevation.card, padded && "p-5", className)}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Glassmorphic card used for panels floating over the map */
export function GlassPanel({ children, className, ...rest }: Props) {
  return (
    <motion.div className={cn(elevation.panel, className)} {...rest}>
      {children}
    </motion.div>
  );
}
