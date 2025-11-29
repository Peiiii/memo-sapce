import React from 'react';
import { ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { usePresenter } from '../hooks/usePresenter';
import { useCommonStore } from '../stores/commonStore';
import { useGalleryStore } from '../stores/galleryStore';

export const GalleryNavigation: React.FC = () => {
  const presenter = usePresenter();
  const { memories } = useCommonStore();
  const { focusedIndex } = useGalleryStore();

  return (
    <div className="absolute right-8 top-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 pointer-events-auto">
      <button 
        onClick={() => presenter.galleryManager.navigate('prev')}
        disabled={focusedIndex === 0}
        className={`p-4 rounded-full backdrop-blur-md border border-white/10 transition-all ${focusedIndex === 0 ? 'bg-slate-800/30 text-white/20 cursor-not-allowed' : 'bg-slate-800/60 text-white hover:bg-slate-700/80 hover:scale-110'}`}
      >
        <ChevronUpIcon className="w-8 h-8" />
      </button>
      <div className="text-center font-mono text-xs text-white/30 tracking-widest flex flex-col items-center gap-1">
         <span className="text-indigo-400 font-bold">{focusedIndex + 1}</span>
         <span className="w-4 h-px bg-white/20"></span>
         <span>{memories.length}</span>
      </div>
      <button 
        onClick={() => presenter.galleryManager.navigate('next')}
        disabled={focusedIndex === memories.length - 1}
        className={`p-4 rounded-full backdrop-blur-md border border-white/10 transition-all ${focusedIndex === memories.length - 1 ? 'bg-slate-800/30 text-white/20 cursor-not-allowed' : 'bg-slate-800/60 text-white hover:bg-slate-700/80 hover:scale-110'}`}
      >
        <ChevronDownIcon className="w-8 h-8" />
      </button>
    </div>
  );
};
