import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Memory } from '../types';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

// Cast motion.div to any to avoid type errors with 'initial' prop in some environments
const MotionDiv = motion.div as any;

export interface GalleryAttributes {
  x: number;
  y: number;
  z: number;
  rotateY: number;
  scale: number;
  opacity: number;
  blur: number;
  isActive: boolean;
  side: 'left' | 'right'; // New property for text placement
}

interface MemoryOrbProps {
  memory: Memory;
  radius: number;
  worldRotationX: any;
  worldRotationY: any;
  isGravityMode: boolean;
  onFocus: (memory: Memory) => void;
  // New props for Gallery Mode
  viewMode: 'sphere' | 'gallery';
  galleryAttrs?: GalleryAttributes;
  onClick?: () => void;
}

export const MemoryOrb: React.FC<MemoryOrbProps> = ({ 
  memory, 
  radius, 
  worldRotationX, 
  worldRotationY,
  isGravityMode,
  onFocus,
  viewMode,
  galleryAttrs,
  onClick
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Local rotation state for "Planet Spin" (Sphere mode only)
  const orbRotationX = useMotionValue(0);
  const orbRotationY = useMotionValue(0);
  const springConfig = { damping: 20, stiffness: 120, mass: 0.5 };
  const smoothOrbX = useSpring(orbRotationX, springConfig);
  const smoothOrbY = useSpring(orbRotationY, springConfig);

  // Gallery Mode Springs for smooth transition
  const galleryX = useSpring(0, { stiffness: 100, damping: 20 });
  const galleryY = useSpring(0, { stiffness: 100, damping: 20 });
  const galleryZ = useSpring(0, { stiffness: 100, damping: 20 });
  const galleryRotateY = useSpring(0, { stiffness: 100, damping: 20 });
  const galleryScale = useSpring(1, { stiffness: 100, damping: 20 });
  const galleryOpacity = useSpring(1, { stiffness: 100, damping: 20 });

  useEffect(() => {
    if (viewMode === 'gallery' && galleryAttrs) {
      galleryX.set(galleryAttrs.x);
      galleryY.set(galleryAttrs.y);
      galleryZ.set(galleryAttrs.z);
      galleryRotateY.set(galleryAttrs.rotateY);
      galleryScale.set(galleryAttrs.scale);
      galleryOpacity.set(galleryAttrs.opacity);
    }
  }, [viewMode, galleryAttrs, galleryX, galleryY, galleryZ, galleryRotateY, galleryScale, galleryOpacity]);

  const isDraggingRef = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Snap to nearest 360 degrees (vertical/upright equilibrium)
  const snapToBalance = (val: number) => {
    return Math.round(val / 360) * 360;
  };

  // Reset/Snap rotation when Gravity Mode is enabled
  useEffect(() => {
    if (isGravityMode) {
      orbRotationX.set(snapToBalance(orbRotationX.get()));
      orbRotationY.set(snapToBalance(orbRotationY.get()));
    }
  }, [isGravityMode, orbRotationX, orbRotationY]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (viewMode === 'gallery') return; // Disable drag rotation in gallery mode
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as Element).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || viewMode === 'gallery') return;
    e.preventDefault();
    e.stopPropagation();
    
    const deltaX = e.clientX - lastPos.current.x;
    const deltaY = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };

    orbRotationY.set(orbRotationY.get() + deltaX * 0.6);
    orbRotationX.set(orbRotationX.get() - deltaY * 0.6);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (viewMode === 'gallery') {
      if (onClick) onClick();
      return;
    }
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).releasePointerCapture(e.pointerId);

    if (isGravityMode) {
      orbRotationX.set(snapToBalance(orbRotationX.get()));
      orbRotationY.set(snapToBalance(orbRotationY.get()));
    }
  };

  // --- COORDINATE CALCULATION ---

  // Sphere Mode Calculation
  const sphereX = radius * Math.sin(memory.phi) * Math.cos(memory.theta);
  const sphereY = radius * Math.cos(memory.phi);
  const sphereZ = radius * Math.sin(memory.phi) * Math.sin(memory.theta);

  const inverseRotateX = useTransform(worldRotationX, (v: number) => -v);
  const inverseRotateY = useTransform(worldRotationY, (v: number) => -v);

  const driftX = useMemo(() => Math.random() * 20 - 10, []);
  const driftY = useMemo(() => Math.random() * 20 - 10, []);
  const duration = useMemo(() => 10 + Math.random() * 10, []);

  // Visual Size Logic
  const BASE_SCALE = memory.scale;
  const HOVER_SCALE_MULTIPLIER = 2.2;
  
  // In gallery mode, we use the passed scale, in sphere we calculate based on hover
  const activeScale = viewMode === 'gallery' 
    ? galleryScale 
    : (isHovered ? BASE_SCALE * HOVER_SCALE_MULTIPLIER : BASE_SCALE);

  // Position Logic
  const x = viewMode === 'gallery' ? galleryX : sphereX;
  const y = viewMode === 'gallery' ? galleryY : sphereY;
  const z = viewMode === 'gallery' ? galleryZ : sphereZ;

  // Rotation Logic
  // In Sphere mode: we apply inverse world rotation to billboard the image.
  // In Gallery mode: we apply the specific gallery angle (rotateY) directly.
  const finalRotateX = viewMode === 'gallery' ? 0 : inverseRotateX; 
  const finalRotateY = viewMode === 'gallery' ? 0 : inverseRotateY; // We will handle gallery rotation in a wrapper

  // Blur Logic for Gallery
  const blurFilter = viewMode === 'gallery' && galleryAttrs?.blur ? `blur(${galleryAttrs.blur}px)` : 'none';

  return (
    <MotionDiv
      className="absolute top-1/2 left-1/2 flex items-center justify-center"
      style={{
        x, y, z, // Direct motion value mapping
        zIndex: viewMode === 'gallery' && galleryAttrs?.isActive ? 10000 : (viewMode === 'gallery' ? 1000 - (galleryAttrs?.blur || 0) * 10 : Math.floor(sphereZ)), // Simple Z-sorting
        transformStyle: 'preserve-3d',
        pointerEvents: 'auto',
      }}
      onClick={viewMode === 'gallery' ? onClick : undefined}
    >
      {/* 
         Rotation Wrapper
         Sphere Mode: Cancels world rotation (Inverse X * Inverse Y)
         Gallery Mode: Applies layout rotation (Gallery Rotate Y)
      */}
      <MotionDiv
        style={{
          rotateX: finalRotateX,
          rotateY: viewMode === 'gallery' ? galleryRotateY : finalRotateY,
          transformStyle: 'preserve-3d'
        }}
        transformTemplate={({ rotateX, rotateY }: any) => {
          if (viewMode === 'gallery') {
            // In gallery, we just want simple local rotation
            return `rotateY(${rotateY})`;
          }
          // In sphere, we need the specific inverse order
          return `rotateX(${rotateX}) rotateY(${rotateY})`;
        }}
        className="relative"
      >
        <MotionDiv
          className="relative flex items-center justify-center group"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: viewMode === 'gallery' ? galleryAttrs?.opacity || 1 : 1,
            scale: activeScale,
            // Disable drift in Gallery Mode
            x: (viewMode === 'gallery' || isHovered) ? 0 : [0, driftX, -driftX, 0],
            y: (viewMode === 'gallery' || isHovered) ? 0 : [0, driftY, -driftY, 0],
            rotate: (viewMode === 'gallery' || isHovered) ? 0 : [memory.rotation - 2, memory.rotation + 2, memory.rotation - 2],
          }}
          transition={{
            opacity: { duration: 1 },
            scale: { type: 'spring', stiffness: 300, damping: 25 },
            x: { duration: duration, repeat: Infinity, ease: "easeInOut" },
            y: { duration: duration * 1.3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: duration * 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          onMouseEnter={() => {
            if (viewMode === 'sphere') {
              setIsHovered(true);
              onFocus(memory);
            }
          }}
          onMouseLeave={() => {
            if (!isDraggingRef.current && viewMode === 'sphere') setIsHovered(false);
          }}
        >
           {/* Image Container */}
           <MotionDiv 
             className={`relative overflow-hidden rounded-full border transition-all duration-500 cursor-grab ${isDraggingRef.current ? 'cursor-grabbing' : ''} ${viewMode === 'gallery' ? 'cursor-pointer' : ''} ${(isHovered || (viewMode === 'gallery' && galleryAttrs?.isActive)) ? 'border-white/70 filter-none' : 'border-white/40 opacity-90'}`}
             style={{
               width: '140px',
               height: '140px',
               boxShadow: (isHovered || (viewMode === 'gallery' && galleryAttrs?.isActive))
                 ? '0 0 60px rgba(165, 243, 252, 0.5), inset 0 0 20px rgba(255,255,255,0.6)' 
                 : '0 15px 35px rgba(0,0,0,0.2), inset 0 0 15px rgba(255,255,255,0.2)',
               rotateX: viewMode === 'sphere' ? smoothOrbX : 0,
               rotateY: viewMode === 'sphere' ? smoothOrbY : 0,
               background: 'rgba(255, 255, 255, 0.05)',
               backdropFilter: 'blur(2px)',
               filter: blurFilter, // Apply Distance Blur
             }}
             onPointerDown={handlePointerDown}
             onPointerMove={handlePointerMove}
             onPointerUp={handlePointerUp}
           >
             <div className={`absolute inset-0 rounded-full bg-gradient-to-br from-white/40 via-transparent to-black/10 z-30 pointer-events-none mix-blend-overlay transition-opacity duration-500 ${(isHovered || (viewMode === 'gallery' && galleryAttrs?.isActive)) ? 'opacity-0' : 'opacity-100'}`}></div>

              <img 
                src={memory.url} 
                alt="memory" 
                className="relative w-full h-full object-cover z-10 pointer-events-none transition-transform duration-700 ease-out"
                style={{ transform: (isHovered || (viewMode === 'gallery' && galleryAttrs?.isActive)) ? 'scale(1.1)' : 'scale(1.05)' }} 
                draggable={false}
              />
            </MotionDiv>

            {/* Sphere Mode: Text Reveal on Hover */}
            {viewMode === 'sphere' && isHovered && !memory.isAnalyzing && (
              <MotionDiv 
                initial={{ opacity: 0, y: 10, scale: 0.5 }}
                animate={{ opacity: 1, y: 0, scale: 1.0 / HOVER_SCALE_MULTIPLIER }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-72 text-center pointer-events-none z-[20000]"
              >
                <div className="bg-slate-900/60 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.3)]">
                  <p className="text-white text-base font-serif italic leading-relaxed tracking-wider text-shadow-sm">
                    "{memory.description}"
                  </p>
                </div>
              </MotionDiv>
            )}

            {/* Gallery Mode: Text Side Display */}
            {viewMode === 'gallery' && !memory.isAnalyzing && (
               <MotionDiv 
               animate={{ 
                 opacity: (galleryAttrs?.isActive) ? 1 : 0.6, 
                 scale: 1 
               }}
               className={`absolute top-1/2 -translate-y-1/2 w-80 pointer-events-none z-[20000] flex flex-col justify-center ${galleryAttrs?.side === 'left' ? 'items-start text-left' : 'items-end text-right'}`}
               style={{
                 // If orb is on Left (-X), text goes to its Right (positive offset)
                 // If orb is on Right (+X), text goes to its Left (negative offset)
                 left: galleryAttrs?.side === 'left' ? '50%' : 'auto',
                 right: galleryAttrs?.side === 'right' ? '50%' : 'auto',
                 marginLeft: galleryAttrs?.side === 'left' ? '80px' : 0,
                 marginRight: galleryAttrs?.side === 'right' ? '80px' : 0,
               }}
             >
               <div className="bg-transparent p-2">
                 <p className={`text-xl text-white font-serif tracking-widest text-shadow-sm border-indigo-400 py-2 ${galleryAttrs?.side === 'left' ? 'border-l-2 pl-4' : 'border-r-2 pr-4'}`}>
                   {memory.description}
                 </p>
                 <span className={`text-indigo-300/50 text-xs mt-1 block font-mono ${galleryAttrs?.side === 'left' ? 'pl-4' : 'pr-4'}`}>
                   {new Date(memory.timestamp).toLocaleDateString()}
                 </span>
               </div>
             </MotionDiv>
            )}

        </MotionDiv>
      </MotionDiv>
    </div>
  );
};