import React, { useState, useMemo } from 'react';
import { Memory } from '../types';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';

interface MemoryOrbProps {
  memory: Memory;
  radius: number;
  worldRotationX: any;
  worldRotationY: any;
  onFocus: (memory: Memory) => void;
}

export const MemoryOrb: React.FC<MemoryOrbProps> = ({ 
  memory, 
  radius, 
  worldRotationX, 
  worldRotationY,
  onFocus 
}) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Calculate 3D Cartesian position from Spherical coordinates
  const x = radius * Math.sin(memory.phi) * Math.cos(memory.theta);
  const y = radius * Math.cos(memory.phi);
  const z = radius * Math.sin(memory.phi) * Math.sin(memory.theta);

  const inverseRotateX = useTransform(worldRotationX, (v: any) => -v);
  const inverseRotateY = useTransform(worldRotationY, (v: any) => -v);

  const driftX = useMemo(() => Math.random() * 20 - 10, []);
  const driftY = useMemo(() => Math.random() * 20 - 10, []);
  const duration = useMemo(() => 10 + Math.random() * 10, []);

  // --- Lens / Magnifying Glass Logic ---
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Smooth out the mouse movement for the lens panning
  const smoothMouseX = useSpring(mouseX, { stiffness: 400, damping: 30 });
  const smoothMouseY = useSpring(mouseY, { stiffness: 400, damping: 30 });

  // Calculate image panning: move opposite to mouse to "explore" the image
  // Range: If scale is 2.5x, we have plenty of overflow to pan around.
  // 140px width. Move range roughly 90px gives a good coverage without showing edges.
  const MOVE_RANGE = 90;
  const imgX = useTransform(smoothMouseX, [-0.5, 0.5], [MOVE_RANGE, -MOVE_RANGE]);
  const imgY = useTransform(smoothMouseY, [-0.5, 0.5], [MOVE_RANGE, -MOVE_RANGE]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const xPct = (e.clientX - rect.left) / rect.width - 0.5;
    const yPct = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(xPct);
    mouseY.set(yPct);
  };
  // -------------------------------------

  // Adjusted Scaling Logic
  // Reduce the overall container expansion so it's less intrusive (Lens effect)
  const BASE_SCALE = memory.scale;
  const HOVER_SCALE_MULTIPLIER = 1.3; 
  
  const targetScale = isHovered ? BASE_SCALE * HOVER_SCALE_MULTIPLIER : BASE_SCALE;

  return (
    <div
      className="absolute top-1/2 left-1/2 flex items-center justify-center"
      style={{
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
        zIndex: isHovered ? 10000 : Math.floor(z),
        transformStyle: 'preserve-3d',
        pointerEvents: 'auto'
      }}
    >
      <motion.div
        style={{
          rotateX: inverseRotateX,
          rotateY: inverseRotateY,
          transformStyle: 'preserve-3d'
        }}
        className="relative"
      >
        <motion.div
          className="relative flex items-center justify-center cursor-pointer group"
          initial={{ opacity: 0, scale: 0 }}
          animate={{ 
            opacity: 1, 
            scale: targetScale,
            // Lock position on hover
            x: isHovered ? 0 : [0, driftX, -driftX, 0],
            y: isHovered ? 0 : [0, driftY, -driftY, 0],
            rotate: isHovered ? 0 : [memory.rotation - 2, memory.rotation + 2, memory.rotation - 2],
          }}
          transition={{
            opacity: { duration: 1 },
            scale: { type: 'spring', stiffness: 300, damping: 25 },
            x: { duration: duration, repeat: Infinity, ease: "easeInOut" },
            y: { duration: duration * 1.3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: duration * 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          onMouseEnter={() => {
            setIsHovered(true);
            onFocus(memory);
          }}
          onMouseLeave={() => {
            setIsHovered(false);
            mouseX.set(0);
            mouseY.set(0);
          }}
          onMouseMove={handleMouseMove}
        >
           <div 
             className={`relative overflow-hidden rounded-full border-2 border-white/20 shadow-xl transition-all duration-500 bg-slate-900 ${isHovered ? 'filter-none border-white/50' : 'opacity-90'}`}
             style={{
               width: '140px',
               height: '140px',
               boxShadow: isHovered ? '0 0 30px rgba(100, 200, 255, 0.3)' : '0 0 15px rgba(0,0,0,0.6)'
             }}
           >
             {/* Glow Effect */}
             <div className={`absolute inset-0 bg-blue-500 rounded-full mix-blend-screen blur-xl transition-opacity duration-700 ${isHovered ? 'opacity-0' : 'opacity-10'}`}></div>

              <motion.img 
                src={memory.url} 
                alt="memory" 
                className="relative w-full h-full object-cover z-10"
                draggable={false}
                animate={{
                  scale: isHovered ? 2.5 : 1
                }}
                style={{
                  x: imgX,
                  y: imgY
                }}
                transition={{
                  scale: { type: 'spring', stiffness: 200, damping: 20 },
                  x: { type: 'spring', stiffness: 400, damping: 30 }, 
                  y: { type: 'spring', stiffness: 400, damping: 30 }
                }}
              />
              
              {/* Loading / Analyzing Overlay */}
              {memory.isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                  <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Text Reveal */}
            {isHovered && !memory.isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1.0 / HOVER_SCALE_MULTIPLIER }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 text-center pointer-events-none z-[20000]"
              >
                <div className="bg-slate-900/90 backdrop-blur-xl p-3 rounded-xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                  <p className="text-white text-sm font-serif italic leading-relaxed tracking-wider text-shadow-sm">
                    "{memory.description}"
                  </p>
                </div>
              </motion.div>
            )}
        </motion.div>
      </motion.div>
    </div>
  );
};