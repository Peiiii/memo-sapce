import { create } from 'zustand';

interface GalleryState {
  focusedIndex: number;
  setFocusedIndex: (index: number | ((prev: number) => number)) => void;
}

export const useGalleryStore = create<GalleryState>((set) => ({
  focusedIndex: 0,
  setFocusedIndex: (val) => set((state) => ({ 
    focusedIndex: typeof val === 'function' ? val(state.focusedIndex) : val 
  })),
}));
