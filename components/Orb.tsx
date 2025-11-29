import React from 'react';
import { motion, MotionValue } from 'framer-motion';

// Cast motion.div to any to avoid type errors in some environments
const MotionDiv = motion.div as any;

export interface OrbVisualProps {
  // Data
  id: string;
  url: string;
  description: string;
  timestamp: number;
  
  // Layout Props
  x: number | MotionValue<number>;
  y: number | MotionValue<number>;
  z: number | MotionValue<number>;
  rotateX: number | MotionValue<number>;
  rotateY: number | MotionValue<number>;
  scale: number | MotionValue<number>;
  opacity: number | MotionValue<number>;
  zIndex: number;
  
  // Visual Props
  isActive?: boolean;
  side?: 'left' | 'right';
  blurFilter?: string;
  
  // Events
  onPointerDown?: (e: React.PointerEvent) => void;
  onPointerMove?: (e: React.PointerEvent) => void;
  onPointerUp?: (e: React.PointerEvent) => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  onClick?: () => void;
  
  // Styling
  cursor?: string;
}

export const Orb: React.FC<OrbVisualProps> = ({
  id, url, description, timestamp,
  x, y, z, rotateX, rotateY, scale, opacity, zIndex,
  isActive, side, blurFilter,
  onPointerDown, onPointerMove, onPointerUp, onMouseEnter, onMouseLeave, onClick,
  cursor
}) => {
  return (
    <MotionDiv
      layoutId={`orb-${id}`}
      className="absolute top-1/2 left-1/2 w-0 h-0 flex items-center justify-center touch-none"
      style={{
        x, y, z, 
        zIndex,
        transformStyle: 'preserve-3d',
        pointerEvents: 'auto',
      }}
      onClick={onClick}
    >
      <MotionDiv
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d'
        }}
        className="relative"
      >
        <MotionDiv
          className="relative flex items-center justify-center group"
          style={{ opacity, scale }}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
           <MotionDiv 
             className={`relative overflow-hidden rounded-full border transition-all duration-500 touch-none ${cursor || ''} ${isActive ? 'border-white/70 filter-none' : 'border-white/40 opacity-90'}`}
             style={{
               width: '140px',
               height: '140px',
               boxShadow: isActive
                 ? '0 0 60px rgba(165, 243, 252, 0.5), inset 0 0 20px rgba(255,255,255,0.6)' 
                 : '0 15px 35px rgba(0,0,0,0.2), inset 0 0 15px rgba(255,255,255,0.2)',
               background: 'rgba(255, 255, 255, 0.05)',
               backdropFilter: 'blur(2px)',
               filter: blurFilter, 
             }}
             onPointerDown={onPointerDown}
             onPointerMove={onPointerMove}
             onPointerUp={onPointerUp}
           >
             <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/10 z-30 pointer-events-none mix-blend-overlay transition-opacity duration-500 ${isActive ? 'opacity-0' : 'opacity-100'}`}></div>

              <img 
                src={url} 
                alt="memory" 
                className="relative w-full h-full object-cover z-10 pointer-events-none transition-transform duration-700 ease-out"
                style={{ transform: isActive ? 'scale(1.1)' : 'scale(1.05)' }} 
                draggable={false}
              />
            </MotionDiv>

            {isActive && (
               <MotionDiv 
               initial={{ opacity: 0, scale: 0.5 }}
               animate={{ opacity: 1, scale: 1 }}
               className={`absolute top-1/2 -translate-y-1/2 w-80 pointer-events-none z-[20000] flex flex-col justify-center ${side === 'left' ? 'items-start text-left' : 'items-end text-right'}`}
               style={{
                 left: side === 'left' ? '50%' : 'auto',
                 right: side === 'right' ? '50%' : 'auto',
                 marginLeft: side === 'left' ? '80px' : 0,
                 marginRight: side === 'right' ? '80px' : 0,
                 y: side ? 0 : 80, // Default to bottom if no side
                 transform: side ? 'translateY(-50%)' : 'translateX(-50%)',
                 textAlign: side ? undefined : 'center',
                 alignItems: side ? undefined : 'center'
               }}
             >
               <div className="bg-transparent p-2">
                 <p className={`text-xl text-white font-serif tracking-widest text-shadow-sm border-indigo-400 py-2 ${side === 'left' ? 'border-l-2 pl-4' : (side === 'right' ? 'border-r-2 pr-4' : '')}`}>
                   {description}
                 </p>
                 <span className={`text-indigo-300/50 text-xs mt-1 block font-mono ${side === 'left' ? 'pl-4' : (side === 'right' ? 'pr-4' : '')}`}>
                   {new Date(timestamp).toLocaleDateString()}
                 </span>
               </div>
             </MotionDiv>
            )}

        </MotionDiv>
      </MotionDiv>
    </MotionDiv>
  );
};