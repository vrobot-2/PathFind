import { AnimatePresence, motion } from "framer-motion";
import { Camera, Check, ChevronDown, Loader2, MessageSquare, PenLine } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { Button } from "../../components/ui/Button";
import { cn } from "../../lib/utils";
import { useAppStore } from "../../store/useAppStore";
import type { TrailReview } from "../../types";
import { PhotoLightbox, type LightboxPhoto } from "./PhotoLightbox";
import { ReviewCard } from "./ReviewCard";
import { RatingSummary, StarRating } from "./StarRating";

const INITIAL_VISIBLE = 3;
const heightTransition = { duration: 0.28, ease: [0.16, 1, 0.3, 1] } as const;

function PhotoThumb({
  review,
  onOpen,
}: {
  review: TrailReview;
  onOpen: (photo: LightboxPhoto) => void;
}) {
  const [broken, setBroken] = useState(false);
  if (!review.photoUrl || broken) return null;

  const alt = `Trail photo shared by ${review.author}`;
  return (
    <motion.button
      type="button"
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 26 }}
      onClick={() => onOpen({ url: review.photoUrl as string, alt })}
      aria-label={`Open photo from ${review.author}'s review`}
      className="shrink-0 overflow-hidden rounded-lg border border-slate-200/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600/40 focus-visible:ring-offset-2"
    >
      <img
        src={review.photoUrl}
        alt={alt}
        loading="lazy"
        onError={() => setBroken(true)}
        className="h-20 w-24 object-cover"
      />
    </motion.button>
  );
}

function ReviewsSkeleton() {
  return (
    <div className="mt-3 space-y-2" aria-hidden="true">
      {[0, 1].map((row) => (
        <div
          key={row}
          className="animate-pulse rounded-2xl border border-slate-200/80 bg-white p-3 shadow-sm shadow-slate-200/40"
        >
          <div className="flex items-center gap-2.5">
            <span className="h-9 w-9 rounded-full bg-slate-100" />
            <div className="flex-1 space-y-1.5">
              <div className="h-2.5 w-24 rounded-full bg-slate-100" />
              <div className="h-2 w-16 rounded-full bg-slate-100" />
            </div>
          </div>
          <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100" />
          <div className="mt-1.5 h-2.5 w-2/3 rounded-full bg-slate-100" />
        </div>
      ))}
    </div>
  );
}

interface Props {
  trailId: string;
}

export function ReviewsSection({ trailId }: Props) {
  const reviews = useAppStore((s) => s.reviews);
  const reviewsLoading = useAppStore((s) => s.reviewsLoading);
  const loadReviews = useAppStore((s) => s.loadReviews);
  const addReview = useAppStore((s) => s.addReview);

  const [formOpen, setFormOpen] = useState(false);
  const [author, setAuthor] = useState("You");
  const [rating, setRating] = useState(0);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [lightbox, setLightbox] = useState<LightboxPhoto | null>(null);
  const successTimer = useRef<number | null>(null);

  /* load once when the store has nothing yet */
  useEffect(() => {
    if (useAppStore.getState().reviews.length === 0) void loadReviews();
  }, [loadReviews]);

  useEffect(
    () => () => {
      if (successTimer.current !== null) window.clearTimeout(successTimer.current);
    },
    [],
  );

  const trailReviews = useMemo(
    () =>
      reviews
        .filter((review) => review.trailId === trailId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [reviews, trailId],
  );

  const average = useMemo(() => {
    if (trailReviews.length === 0) return 0;
    return trailReviews.reduce((sum, review) => sum + review.rating, 0) / trailReviews.length;
  }, [trailReviews]);

  const photos = useMemo(() => trailReviews.filter((review) => review.photoUrl), [trailReviews]);
  const hiddenCount = trailReviews.length - INITIAL_VISIBLE;

  function toggleForm() {
    setFormOpen((open) => !open);
    setError(null);
    setSuccess(false);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (submitting) return;

    if (!rating) {
      setError("Pick a star rating first.");
      return;
    }
    if (!text.trim()) {
      setError("Add a few words about the trail.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      await addReview({
        trailId,
        author: author.trim() || "You",
        rating,
        text: text.trim(),
      });
      setSubmitting(false);
      setSuccess(true);
      setText("");
      setRating(0);
      if (successTimer.current !== null) window.clearTimeout(successTimer.current);
      successTimer.current = window.setTimeout(() => {
        setSuccess(false);
        setFormOpen(false);
      }, 1600);
    } catch {
      setSubmitting(false);
      setError("Couldn't post your review — please try again.");
    }
  }

  return (
    <section aria-labelledby="trail-reviews-heading">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <h3
            id="trail-reviews-heading"
            className="text-xs font-bold uppercase tracking-wider text-slate-500"
          >
            Reviews
          </h3>
          {trailReviews.length > 0 ? (
            <RatingSummary rating={average} count={trailReviews.length} />
          ) : null}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={toggleForm}
          aria-expanded={formOpen}
          aria-controls="review-form"
          className="h-7 px-2 text-xs"
        >
          <PenLine size={13} />
          {formOpen ? "Cancel" : "Write a review"}
        </Button>
      </div>

      {/* inline review form */}
      <AnimatePresence initial={false}>
        {formOpen ? (
          <motion.div
            key="review-form"
            id="review-form"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={heightTransition}
            className="overflow-hidden"
          >
            <form
              onSubmit={handleSubmit}
              className="mt-2.5 rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Your rating
                  </p>
                  <StarRating
                    value={rating}
                    size={22}
                    interactive
                    onChange={(next) => {
                      setRating(next);
                      if (error) setError(null);
                    }}
                  />
                </div>

                <label className="flex min-w-[7rem] flex-1 flex-col gap-1">
                  <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                    Name
                  </span>
                  <input
                    value={author}
                    maxLength={40}
                    onChange={(event) => setAuthor(event.target.value)}
                    placeholder="You"
                    className="h-9 w-full rounded-xl border border-slate-200 bg-white px-2.5 text-xs font-medium text-slate-800 outline-none transition-colors duration-200 placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20"
                  />
                </label>
              </div>

              <textarea
                value={text}
                maxLength={400}
                rows={3}
                onChange={(event) => {
                  setText(event.target.value);
                  if (error) setError(null);
                }}
                placeholder="How was the trail? Surface, views, accessibility…"
                className="mt-2.5 w-full resize-none rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-800 outline-none transition-colors duration-200 placeholder:font-normal placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-500/20"
              />

              <AnimatePresence initial={false}>
                {error ? (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -4 }}
                    className="mt-2 rounded-xl bg-rose-50 px-3 py-2 text-[11px] font-medium leading-relaxed text-rose-700"
                  >
                    {error}
                  </motion.p>
                ) : null}
              </AnimatePresence>

              <div className="mt-2.5 flex items-center justify-end gap-2">
                <span className="mr-auto text-[10px] font-medium text-slate-400">
                  {text.length}/400
                </span>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                  className={cn(
                    "min-w-[7.5rem]",
                    success && "bg-emerald-600 hover:bg-emerald-600",
                  )}
                >
                  {submitting ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Posting…
                    </>
                  ) : success ? (
                    <>
                      <Check size={14} />
                      Thanks!
                    </>
                  ) : (
                    "Post review"
                  )}
                </Button>
              </div>
            </form>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* photo strip */}
      {photos.length > 0 ? (
        <div className="mt-3">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
            <Camera size={12} className="text-emerald-600" />
            View all {photos.length} photo{photos.length === 1 ? "" : "s"}
          </p>
          <div className="-mx-1 mt-1.5 flex gap-2 overflow-x-auto px-1 pb-1">
            {photos.map((review) => (
              <PhotoThumb key={review.id} review={review} onOpen={setLightbox} />
            ))}
          </div>
        </div>
      ) : null}

      {/* list */}
      {reviewsLoading && trailReviews.length === 0 ? (
        <ReviewsSkeleton />
      ) : trailReviews.length === 0 ? (
        <div className="mt-3 flex flex-col items-center gap-1.5 rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-5 text-center">
          <span className="grid h-9 w-9 place-items-center rounded-full bg-white text-emerald-600 shadow-sm shadow-slate-200">
            <MessageSquare size={16} />
          </span>
          <p className="text-xs font-bold text-slate-700">No reviews yet</p>
          <p className="max-w-[15rem] text-[11px] leading-relaxed text-slate-400">
            Be the first to share what this trail is like for your mobility profile.
          </p>
        </div>
      ) : (
        <>
          <ul className="mt-3 space-y-2">
            {trailReviews.slice(0, INITIAL_VISIBLE).map((review) => (
              <li key={review.id}>
                <ReviewCard review={review} onOpenPhoto={setLightbox} />
              </li>
            ))}
          </ul>

          <AnimatePresence initial={false}>
            {expanded && hiddenCount > 0 ? (
              <motion.div
                key="more-reviews"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={heightTransition}
                className="overflow-hidden"
              >
                <ul className="space-y-2 pt-2">
                  {trailReviews.slice(INITIAL_VISIBLE).map((review) => (
                    <li key={review.id}>
                      <ReviewCard review={review} onOpenPhoto={setLightbox} />
                    </li>
                  ))}
                </ul>
              </motion.div>
            ) : null}
          </AnimatePresence>

          {hiddenCount > 0 ? (
            <div className="mt-1.5">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExpanded((value) => !value)}
                aria-expanded={expanded}
                className="w-full text-xs"
              >
                {expanded ? "Show fewer reviews" : `Show all ${trailReviews.length} reviews`}
                <ChevronDown
                  size={14}
                  className={cn("transition-transform duration-200", expanded && "rotate-180")}
                />
              </Button>
            </div>
          ) : null}
        </>
      )}

      <PhotoLightbox photo={lightbox} onClose={() => setLightbox(null)} />
    </section>
  );
}
