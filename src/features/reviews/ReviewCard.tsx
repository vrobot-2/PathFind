import { motion } from "framer-motion";
import { useState } from "react";
import { Badge } from "../../components/ui/Badge";
import { timeAgo } from "../../lib/utils";
import type { TrailReview } from "../../types";
import { StarRating } from "./StarRating";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

interface Props {
  review: TrailReview;
  onOpenPhoto: (photo: { url: string; alt: string }) => void;
}

export function ReviewCard({ review, onOpenPhoto }: Props) {
  const [photoBroken, setPhotoBroken] = useState(false);
  const photoAlt = `Trail photo shared by ${review.author}`;

  return (
    <article className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/40">
      <div className="flex items-start gap-2.5">
        <span
          aria-hidden="true"
          className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-emerald-50 text-[11px] font-bold tracking-tight text-emerald-700"
        >
          {initialsFor(review.author)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1">
            <p className="truncate text-xs font-bold text-slate-900">{review.author}</p>
            <Badge tone="slate" className="px-2 py-0.5 text-[10px] font-semibold">
              {review.source}
            </Badge>
          </div>

          <div className="mt-1 flex items-center gap-1.5">
            <StarRating value={review.rating} size={11} />
            <span aria-hidden="true" className="text-[10px] text-slate-300">
              ·
            </span>
            <span className="text-[10px] font-medium text-slate-400">{timeAgo(review.createdAt)}</span>
          </div>
        </div>
      </div>

      <p className="mt-2 text-sm leading-relaxed text-slate-600">{review.text}</p>

      {review.photoUrl && !photoBroken ? (
        <motion.button
          type="button"
          whileHover={{ scale: 1.012 }}
          whileTap={{ scale: 0.99 }}
          transition={{ type: "spring", stiffness: 400, damping: 28 }}
          onClick={() => onOpenPhoto({ url: review.photoUrl as string, alt: photoAlt })}
          aria-label={`Open photo from ${review.author}'s review`}
          className="mt-2.5 block w-full overflow-hidden rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2"
        >
          <img
            src={review.photoUrl}
            alt={photoAlt}
            loading="lazy"
            onError={() => setPhotoBroken(true)}
            className="h-28 w-full object-cover"
          />
        </motion.button>
      ) : null}
    </article>
  );
}
