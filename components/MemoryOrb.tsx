import React, { useState, useMemo } from 'react';
import { Memory } from '../types';
import { motion, useMotionValue, useTransform, MotionValue } from 'framer-motion';

interface MemoryOrbProps {
  memory: Memory;
  radius: number;
  worldRotationX: MotionValue<number>;
  worldRotationY: MotionValue<number>;
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

  const inverseRotateX = useTransform(worldRotationX, v => -v);
  const inverseRotateY = useTransform(worldRotationY, v => -v);

  const driftX = useMemo(() => Math.random() * 20 - 10, []);
  const driftY = useMemo(() => Math.random() * 20 - 10, []);
  const duration = useMemo(() => 10 + Math.random() * 10, []);

  // Determine target scale: 0 if hidden (initial), memory.scale normally, larger if hovered.
  // We handle initial animation via the 'initial' prop, but 'animate' needs a concrete value.
  const targetScale = isHovered ? 1.5 : memory.scale;

  return (
    <div
      className="absolute top-1/2 left-1/2 flex items-center justify-center"
      style={{
        transform: `translate3d(${x}px, ${y}px, ${z}px)`,
        zIndex: isHovered ? 10000 : Math.floor(z), // Dynamic z-index for better stacking context
        transformStyle: 'preserve-3d', // Crucial for nesting 3D contexts
        pointerEvents: 'auto' // Explicitly allow pointer events
      }}
    >
      {/* 
         The Counter-Rotation Wrapper 
         This div undoes the world rotation so the image stays flat to the screen.
      */}
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
            scale: targetScale, // FIX: Explicitly animating scale to memory.scale or hover scale
            // Local organic drift
            x: [0, driftX, -driftX, 0],
            y: [0, driftY, -driftY, 0],
            rotate: isHovered ? 0 : [memory.rotation - 2, memory.rotation + 2, memory.rotation - 2],
          }}
          transition={{
            opacity: { duration: 1 },
            scale: { type: 'spring', stiffness: 200, damping: 20 },
            x: { duration: duration, repeat: Infinity, ease: "easeInOut" },
            y: { duration: duration * 1.3, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: duration * 1.5, repeat: Infinity, ease: "easeInOut" }
          }}
          onMouseEnter={() => {
            setIsHovered(true);
            onFocus(memory);
          }}
          onMouseLeave={() => setIsHovered(false)}
        >
           <div className={`relative transition-all duration-700 ease-out ${isHovered ? 'filter-none' : 'opacity-90'}`}>
            
            {/* Glow Effect */}
            <div className={`absolute inset-0 bg-blue-500 rounded-full mix-blend-screen blur-xl transition-opacity duration-700 ${isHovered ? 'opacity-60' : 'opacity-10'}`}></div>

            {/* The Image */}
            <div className="relative overflow-hidden rounded-full border-2 border-white/20 shadow-xl transition-all duration-500 bg-slate-900"
                style={{
                  // Increased base size for better visibility
                  width: isHovered ? '260px' : '140px',
                  height: isHovered ? '260px' : '140px',
                  boxShadow: isHovered ? '0 0 50px rgba(100, 200, 255, 0.4)' : '0 0 15px rgba(0,0,0,0.6)'
                }}
            >
              <img 
                src={memory.url} 
                alt="memory" 
                className="w-full h-full object-cover"
                draggable={false}
              />
              
              {/* Loading / Analyzing Overlay */}
              {memory.isAnalyzing && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                </div>
              )}
            </div>

            {/* Text Reveal - Always visible when hovered, billboarding handles orientation */}
            {isHovered && !memory.isAnalyzing && (
              <motion.div 
                initial={{ opacity: 0, y: 20, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="absolute top-full left-1/2 -translate-x-1/2 mt-6 w-72 text-center pointer-events-none z-[20000]"
              >
                <div className="bg-slate-900/90 backdrop-blur-xl p-4 rounded-xl border border-white/20 shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
                  <p className="text-white text-base font-serif italic leading-relaxed tracking-wider text-shadow-sm">
                    "{memory.description}"
                  </p>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};