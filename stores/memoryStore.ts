import { create } from 'zustand';
import { Memory } from '../types';

interface MemoryState {
  memories: Memory[];
  focusedIndex: number;
  setMemories: (memories: Memory[] | ((prev: Memory[]) => Memory[])) => void;
  setFocusedIndex: (index: number | ((prev: number) => number)) => void;
}

export const useMemoryStore = create<MemoryState>((set) => ({
  memories: [],
  focusedIndex: 0,
  setMemories: (val) => set((state) => ({ 
    memories: typeof val === 'function' ? val(state.memories) : val 
  })),
  setFocusedIndex: (val) => set((state) => ({ 
    focusedIndex: typeof val === 'function' ? val(state.focusedIndex) : val 
  })),
}));