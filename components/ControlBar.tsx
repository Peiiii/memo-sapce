import React, { useRef } from 'react';
import { PlusIcon, ArrowsUpDownIcon, Square3Stack3DIcon, GlobeAsiaAustraliaIcon } from '@heroicons/react/24/outline';
import { usePresenter } from '../hooks/usePresenter';
import { useCommonStore, ViewMode } from '../stores/commonStore';
import { useSphereStore } from '../stores/sphereStore';

export const ControlBar: React.FC = () => {
  const presenter = usePresenter();
  const { viewMode, memories } = useCommonStore();
  const { isGravityMode } = useSphereStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const modes: { id: ViewMode; label: string; Icon: any }[] = [
    { id: 'sphere', label: '宇宙', Icon: GlobeAsiaAustraliaIcon },
    { id: 'gallery', label: '时空', Icon: Square3Stack3DIcon },
  ];

  return (
    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
      <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
        
        <button 
          className="flex flex-col items-center group"
          onClick={() => fileInputRef.current?.click()}
        >
          <div className="bg-white/10 p-3 rounded-full group-hover:bg-white/20 transition-colors border border-white/5">
            <PlusIcon className="w-6 h-6 text-white" />
          </div>
          <span className="text-[10px] text-white/40 mt-1">上传</span>
        </button>
        
        <div className="w-px h-8 bg-white/10"></div>

        <div className="flex items-center gap-2">
          {modes.map((mode) => (
            <button 
              key={mode.id}
              onClick={() => presenter.switchViewMode(mode.id)}
              className="flex flex-col items-center group"
            >
              <div className={`p-3 rounded-full transition-all duration-300 border ${viewMode === mode.id ? 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/10 border-white/5 text-white/70 group-hover:bg-white/20'}`}>
                  <mode.Icon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] mt-1 transition-colors ${viewMode === mode.id ? 'text-indigo-300' : 'text-white/40'}`}>
                {mode.label}
              </span>
            </button>
          ))}
        </div>

        {viewMode === 'sphere' && (
          <>
            <div className="w-px h-8 bg-white/10"></div>
            <button 
              onClick={() => presenter.sphereManager.toggleGravityMode()}
              className="flex flex-col items-center group"
            >
              <div className={`p-3 rounded-full transition-all duration-300 border ${isGravityMode ? 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/10 border-white/5 text-white/70 group-hover:bg-white/20'}`}>
                  <ArrowsUpDownIcon className="w-6 h-6" />
              </div>
              <span className={`text-[10px] mt-1 transition-colors ${isGravityMode ? 'text-indigo-300' : 'text-white/40'}`}>
                {isGravityMode ? '重力' : '悬浮'}
              </span>
            </button>
          </>
        )}

        <div className="w-px h-8 bg-white/10"></div>

        <div className="flex flex-col items-start min-w-[80px]">
           <span className="text-xs text-white/80 font-medium flex items-center gap-1">
              Memory Space
           </span>
           <span className="text-[10px] text-white/40">{memories.length} 个记忆片段</span>
        </div>
        
        <input 
          type="file" 
          ref={fileInputRef}
          className="hidden" 
          multiple 
          accept="image/*"
          onChange={(e) => presenter.memoryManager.handleFileUpload(e.target.files, presenter.sphereManager.getRotation())}
        />

      </div>
    </div>
  );
};