import { create } from "zustand";

export interface WalkPosition {
  lat: number;
  lng: number;
}

interface WalkState {
  /** Live simulated "you are here" position along the active route, or null. */
  position: WalkPosition | null;
  /** Walk progress, 0..1. */
  progress: number;
  setWalk: (position: WalkPosition | null, progress: number) => void;
}

/**
 * Module-level singleton for the live guided-walk position.
 *
 * MAP AGENT: import `useWalkStore` from `src/features/navigate/useWalkStore` and
 * subscribe to `position` / `progress` to draw the moving "you are here" dot.
 * The overlay itself cannot render a Leaflet marker, so this store is the
 * hand-off point. NavigationOverlay keeps it updated while a route is active
 * and clears it on stop / unmount.
 */
export const useWalkStore = create<WalkState>((set) => ({
  position: null,
  progress: 0,
  setWalk: (position, progress) => set({ position, progress }),
}));
