import { useCallback, useEffect, useRef, useState } from "react";

/** Session-scoped mute preference (survives demo restarts, not reloads). */
let sessionMuted = false;

export function demoAudioSrc(stepIndex: number): string {
  return `/demo-audio/step-${String(stepIndex + 1).padStart(2, "0")}.wav`;
}

interface Options {
  /** True while the tour is actually running on a step. */
  active: boolean;
  /** 0-based step index. Playback is keyed to this value only. */
  index: number;
}

interface Narration {
  audioRef: React.RefObject<HTMLAudioElement>;
  muted: boolean;
  /** A `play()` was rejected (usually autoplay policy) — offer the tap chip. */
  blocked: boolean;
  toggleMuted: () => void;
  /** Called from the "Tap for sound" chip: a real user gesture. */
  enableSound: () => void;
  src: string | undefined;
}

/**
 * One `<audio>` element, one file per step. The play effect depends only on
 * (active, step index, muted), so re-renders elsewhere never restart the clip.
 */
export function useDemoNarration({ active, index }: Options): Narration {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [muted, setMuted] = useState(sessionMuted);
  const [blocked, setBlocked] = useState(false);

  const play = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    setBlocked(false);
    try {
      const attempt = el.play();
      if (attempt) {
        attempt.catch((error: unknown) => {
          const name =
            error && typeof error === "object" && "name" in error
              ? String((error as { name?: unknown }).name)
              : "";
          // Changing src mid-load aborts the previous play() — not a failure.
          if (name === "AbortError") return;
          setBlocked(true);
        });
      }
    } catch {
      setBlocked(true);
    }
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    if (!active || index < 0 || muted) {
      el.pause();
      setBlocked(false);
      return;
    }

    if (el.readyState < 1) {
      // Fresh src each step: wait for metadata so play() lines up with the file.
      const onReady = () => play();
      el.addEventListener("loadedmetadata", onReady, { once: true });
      return () => el.removeEventListener("loadedmetadata", onReady);
    }

    play();
  }, [active, index, muted, play]);

  /* Pause whenever the tab is hidden or the component goes away. */
  useEffect(() => {
    const pause = () => audioRef.current?.pause();
    const onVisibility = () => {
      if (document.hidden) pause();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      pause();
    };
  }, []);

  const toggleMuted = useCallback(() => {
    setMuted((current) => {
      const next = !current;
      sessionMuted = next;
      if (next) audioRef.current?.pause();
      return next;
    });
  }, []);

  const enableSound = useCallback(() => {
    setBlocked(false);
    if (sessionMuted) {
      sessionMuted = false;
      setMuted(false);
      return; // the muted -> false effect starts playback
    }
    play();
  }, [play]);

  return {
    audioRef,
    muted,
    blocked: active && blocked,
    toggleMuted,
    enableSound,
    src: index >= 0 ? demoAudioSrc(index) : undefined,
  };
}
