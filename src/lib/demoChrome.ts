import { create } from "zustand";

/**
 * Chrome control for the automated demo.
 * While `cleanMap` is true the map page hides its rails, drawer, search pill,
 * legend and zoom controls, and parks the camera on the simulated walker.
 */
interface DemoChromeState {
  cleanMap: boolean;
  setCleanMap: (value: boolean) => void;
}

export const useDemoChrome = create<DemoChromeState>((set) => ({
  cleanMap: false,
  setCleanMap: (cleanMap) => set({ cleanMap }),
}));
