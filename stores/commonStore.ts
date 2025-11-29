import { create } from 'zustand';
import { Memory } from '../types';

export type ViewMode = 'sphere' | 'gallery';

interface CommonState {
  memories: Memory[];
  viewMode: ViewMode;
  setMemories: (memories: Memory[] | ((prev: Memory[]) => Memory[])) => void;
  setViewMode: (mode: ViewMode) => void;
}

export const useCommonStore = create<CommonState>((set) => ({
  memories: [],
  viewMode: 'sphere',
  setMemories: (val) => set((state) => ({ 
    memories: typeof val === 'function' ? val(state.memories) : val 
  })),
  setViewMode: (mode) => set({ viewMode: mode }),
}));
