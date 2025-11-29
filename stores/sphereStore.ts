import { create } from 'zustand';

interface SphereState {
  isGravityMode: boolean;
  sphereRadius: number;
  setIsGravityMode: (isGravity: boolean | ((prev: boolean) => boolean)) => void;
  setSphereRadius: (radius: number) => void;
}

export const useSphereStore = create<SphereState>((set) => ({
  isGravityMode: false,
  sphereRadius: 350,
  setIsGravityMode: (val) => set((state) => ({ 
    isGravityMode: typeof val === 'function' ? val(state.isGravityMode) : val 
  })),
  setSphereRadius: (radius) => set({ sphereRadius: radius }),
}));
