import { create } from 'zustand';

export type ViewMode = 'sphere' | 'gallery';

interface SceneState {
  viewMode: ViewMode;
  isGravityMode: boolean;
  sphereRadius: number;
  setViewMode: (mode: ViewMode) => void;
  setIsGravityMode: (isGravity: boolean | ((prev: boolean) => boolean)) => void;
  setSphereRadius: (radius: number) => void;
}

export const useSceneStore = create<SceneState>((set) => ({
  viewMode: 'sphere',
  isGravityMode: false,
  sphereRadius: 350,
  setViewMode: (mode) => set({ viewMode: mode }),
  setIsGravityMode: (val) => set((state) => ({ 
    isGravityMode: typeof val === 'function' ? val(state.isGravityMode) : val 
  })),
  setSphereRadius: (radius) => set({ sphereRadius: radius }),
}));