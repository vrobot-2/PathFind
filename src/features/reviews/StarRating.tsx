import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";
import { cn } from "../../lib/utils";

const STARS = [1, 2, 3, 4, 5] as const;

interface StarRatingProps {
  value: number;
  size?: number;
  interactive?: boolean;
  onChange?: (v: number) => void;
}

function starClass(filled: boolean): string {
  return filled ? "fill-amber-500 text-amber-500" : "fill-slate-200 text-slate-200";
}

export function StarRating({ value, size = 14, interactive = false, onChange }: StarRatingProps) {
  const starRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const rounded = Math.round(value);

  if (!interactive) {
    return (
      <span
        role="img"
        aria-label={`${value.toFixed(1)} out of 5 stars`}
        className="inline-flex items-center gap-0.5"
      >
        {STARS.map((star) => (
          <Star
            key={star}
            size={size}
            strokeWidth={2}
            aria-hidden="true"
            className={starClass(star <= rounded)}
          />
        ))}
      </span>
    );
  }

  const tabStop = value >= 1 && value <= 5 ? Math.round(value) : 1;

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, star: number) => {
    let next: number | null = null;

    if (event.key === "ArrowRight" || event.key === "ArrowUp") {
      next = star === 5 ? 1 : star + 1;
    } else if (event.key === "ArrowLeft" || event.key === "ArrowDown") {
      next = star === 1 ? 5 : star - 1;
    } else if (event.key === "Home") {
      next = 1;
    } else if (event.key === "End") {
      next = 5;
    }

    if (next === null) return;
    event.preventDefault();
    onChange?.(next);
    starRefs.current[next - 1]?.focus();
  };

  return (
    <span role="radiogroup" aria-label="Rate this trail" className="inline-flex items-center gap-0.5">
      {STARS.map((star) => {
        const selected = rounded === star;
        return (
          <motion.button
            key={star}
            ref={(element) => {
              starRefs.current[star - 1] = element;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={`${star} star${star === 1 ? "" : "s"}`}
            tabIndex={star === tabStop ? 0 : -1}
            whileHover={{ scale: 1.18 }}
            whileTap={{ scale: 0.85 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            onClick={() => onChange?.(star)}
            onKeyDown={(event) => handleKeyDown(event, star)}
            className={cn(
              "grid place-items-center rounded-full p-0.5",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40",
            )}
          >
            <Star
              size={size}
              strokeWidth={2}
              aria-hidden="true"
              className={starClass(star <= rounded)}
            />
          </motion.button>
        );
      })}
    </span>
  );
}

interface RatingSummaryProps {
  rating: number;
  count: number;
  className?: string;
}

export function RatingSummary({ rating, count, className }: RatingSummaryProps) {
  return (
    <span className={cn("inline-flex items-baseline gap-1.5", className)}>
      <span className="text-sm font-extrabold tabular-nums leading-none tracking-tight text-slate-900">
        {rating.toFixed(1)}
      </span>
      <StarRating value={rating} size={12} />
      <span className="text-[11px] font-medium text-slate-400">
        ({count} review{count === 1 ? "" : "s"})
      </span>
    </span>
  );
}
