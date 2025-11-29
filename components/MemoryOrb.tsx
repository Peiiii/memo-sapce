import React from 'react';
import { Memory } from '../types';
import { motion } from 'framer-motion';
import { useOrbBehavior } from '../hooks/useOrbBehavior';
import { useSceneStore } from '../stores/sceneStore';

// Cast motion.div to any to avoid type errors in some environments
const MotionDiv = motion.div as any;

interface MemoryOrbProps {
  memory: Memory;
  worldRotationX: any;
  worldRotationY: any;
}

export const MemoryOrb: React.FC<MemoryOrbProps> = ({ 
  memory, 
  worldRotationX, 
  worldRotationY,
}) => {
  const { viewMode } = useSceneStore();
  const { transform, layout, drift, state, handlers } = useOrbBehavior(memory, worldRotationX, worldRotationY);
  
  // Decide visuals based on viewMode is allowed in View, but logic is abstracted
  const showTextBelow = viewMode === 'sphere' && (state.isHovered || state.isDragging) && !memory.isAnalyzing;
  const showTextSide = viewMode === 'gallery' && !memory.isAnalyzing;

  return (
    <MotionDiv
      className="absolute top-1/2 left-1/2 flex items-center justify-center touch-none"
      style={{
        x: transform.x, y: transform.y, z: transform.z, 
        zIndex: layout.zIndex,
        transformStyle: 'preserve-3d',
        pointerEvents: 'auto',
      }}
      onClick={viewMode === 'gallery' ? handlers.onPointerUp : undefined}
    >
      <MotionDiv
        style={{
          rotateX: transform.rotateX,
          rotateY: transform.rotateY,
          transformStyle: 'preserve-3d'
        }}
        transformTemplate={({ rotateX, rotateY }: any) => {
          // Gallery primarily uses Y rotation. Sphere uses both to face camera.
          if (viewMode === 'gallery') return `rotateY(${rotateY})`;
          return `rotateX(${rotateX}) rotateY(${rotateY})`;
        }}
        className="relative"
      >
        <MotionDiv
          className="relative flex items-center justify-center group"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: layout.opacity,
            scale: layout.scale, // This is handled by spring in hook, but this ensures initial mount works
            x: (viewMode === 'gallery' || state.isHovered || state.isDragging) ? 0 : [0, drift.x, -drift.x, 0],
            y: (viewMode === 'gallery' || state.isHovered || state.isDragging) ? 0 : [0, drift.y, -drift.y, 0],
            rotate: (viewMode === 'gallery' || state.isHovered || state.isDragging) ? 0 : [memory.rotation - 2, memory.rotation + 2, memory.rotation - 2],
          }}
          transition={{
            opacity: { duration: 1 },
            scale: { type: 'spring', stiffness: 300, damping: 25 },
            x: { duration: drift.duration, repeat: Infinity, ease: "easeInOut" },
            y: { duration: drift.duration * 1.3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: drift.duration * 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          onMouseEnter={handlers.onMouseEnter}
          onMouseLeave={handlers.onMouseLeave}
        >
           <MotionDiv 
             className={`relative overflow-hidden rounded-full border transition-all duration-500 touch-none ${state.isDragging ? 'cursor-grabbing' : 'cursor-grab'} ${viewMode === 'gallery' ? 'cursor-pointer' : ''} ${(state.isHovered || state.isDragging || layout.isActive) ? 'border-white/70 filter-none' : 'border-white/40 opacity-90'}`}
             style={{
               width: '140px',
               height: '140px',
               boxShadow: (state.isHovered || state.isDragging || layout.isActive)
                 ? '0 0 60px rgba(165, 243, 252, 0.5), inset 0 0 20px rgba(255,255,255,0.6)' 
                 : '0 15px 35px rgba(0,0,0,0.2), inset 0 0 15px rgba(255,255,255,0.2)',
               rotateX: viewMode === 'sphere' ? transform.orbRotateX : 0,
               rotateY: viewMode === 'sphere' ? transform.orbRotateY : 0,
               background: 'rgba(255, 255, 255, 0.05)',
               backdropFilter: 'blur(2px)',
               filter: state.blurFilter, 
             }}
             onPointerDown={handlers.onPointerDown}
             onPointerMove={handlers.onPointerMove}
             onPointerUp={handlers.onPointerUp}
           >
             <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/10 z-30 pointer-events-none mix-blend-overlay transition-opacity duration-500 ${(state.isHovered || state.isDragging || layout.isActive) ? 'opacity-0' : 'opacity-100'}`}></div>

              <img 
                src={memory.url} 
                alt="memory" 
                className="relative w-full h-full object-cover z-10 pointer-events-none transition-transform duration-700 ease-out"
                style={{ transform: (state.isHovered || state.isDragging || layout.isActive) ? 'scale(1.1)' : 'scale(1.05)' }} 
                draggable={false}
              />
            </MotionDiv>

            {showTextBelow && (
              <MotionDiv 
                initial={{ opacity: 0, y: 10, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1.0 / 1.2 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 text-center pointer-events-none z-[20000]"
              >
                <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                  <p className="text-white text-base font-serif italic leading-relaxed tracking-wider text-shadow-sm">
                    "{memory.description}"
                  </p>
                </div>
              </MotionDiv>
            )}

            {showTextSide && (
               <MotionDiv 
               animate={{ 
                 opacity: (layout.isActive) ? 1 : 0.6, 
                 scale: 1 
               }}
               className={`absolute top-1/2 -translate-y-1/2 w-80 pointer-events-none z-[20000] flex flex-col justify-center ${layout.side === 'left' ? 'items-start text-left' : 'items-end text-right'}`}
               style={{
                 left: layout.side === 'left' ? '50%' : 'auto',
                 right: layout.side === 'right' ? '50%' : 'auto',
                 marginLeft: layout.side === 'left' ? '80px' : 0,
                 marginRight: layout.side === 'right' ? '80px' : 0,
               }}
             >
               <div className="bg-transparent p-2">
                 <p className={`text-xl text-white font-serif tracking-widest text-shadow-sm border-indigo-400 py-2 ${layout.side === 'left' ? 'border-l-2 pl-4' : 'border-r-2 pr-4'}`}>
                   {memory.description}
                 </p>
                 <span className={`text-indigo-300/50 text-xs mt-1 block font-mono ${layout.side === 'left' ? 'pl-4' : 'pr-4'}`}>
                   {new Date(memory.timestamp).toLocaleDateString()}
                 </span>
               </div>
             </MotionDiv>
            )}

        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  );
};
