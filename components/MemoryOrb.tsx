import React, { useState, useRef, useEffect } from 'react';
import { Memory } from '../types';
import { motion } from 'framer-motion';

interface MemoryOrbProps {
  memory: Memory;
  onFocus: (memory: Memory) => void;
  zIndex: number;
}

export const MemoryOrb: React.FC<MemoryOrbProps> = ({ memory, onFocus, zIndex }) => {
  const [isHovered, setIsHovered] = useState(false);
  
  // Randomize the drift animation slightly per orb to feel organic
  const driftRef = useRef({
    x: Math.random() * 20 - 10,
    y: Math.random() * 20 - 10,
    duration: 10 + Math.random() * 15, // 10s to 25s
  });

  return (
    <motion.div
      className="absolute flex items-center justify-center pointer-events-auto cursor-pointer group"
      style={{
        left: `${memory.x}%`,
        top: `${memory.y}%`,
        zIndex: isHovered ? 1000 : zIndex,
        transformOrigin: 'center center',
      }}
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: isHovered ? 1.5 : memory.scale,
        // Continuous organic drift
        x: [0, driftRef.current.x, -driftRef.current.x, 0],
        y: [0, driftRef.current.y, -driftRef.current.y, 0],
        rotate: isHovered ? 0 : [memory.rotation - 5, memory.rotation + 5, memory.rotation - 5],
      }}
      transition={{
        opacity: { duration: 1 },
        scale: { type: 'spring', stiffness: 100, damping: 20 },
        x: { duration: driftRef.current.duration, repeat: Infinity, ease: "easeInOut" },
        y: { duration: driftRef.current.duration * 1.2, repeat: Infinity, ease: "easeInOut" },
        rotate: { duration: driftRef.current.duration * 1.5, repeat: Infinity, ease: "easeInOut" }
      }}
      onMouseEnter={() => {
        setIsHovered(true);
        onFocus(memory);
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative transition-all duration-700 ease-out ${isHovered ? 'filter-none' : 'blur-[2px] opacity-70 grayscale-[30%]'}`}>
        
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-blue-500 rounded-full mix-blend-screen blur-xl transition-opacity duration-700 ${isHovered ? 'opacity-40' : 'opacity-0'}`}></div>

        {/* The Image */}
        <div className="relative overflow-hidden rounded-full border-2 border-white/10 shadow-2xl transition-all duration-500"
             style={{
               width: isHovered ? '240px' : '120px',
               height: isHovered ? '240px' : '120px',
               boxShadow: isHovered ? '0 0 30px rgba(100, 200, 255, 0.3)' : 'none'
             }}
        >
          <img 
            src={memory.url} 
            alt="memory" 
            className="w-full h-full object-cover"
          />
          
          {/* Loading / Analyzing Overlay */}
          {memory.isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Text Reveal */}
        {isHovered && !memory.isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-4 w-64 text-center pointer-events-none"
          >
            <p className="text-white/90 text-sm font-serif italic drop-shadow-lg leading-relaxed tracking-wider bg-black/30 backdrop-blur-sm p-2 rounded-lg border border-white/10">
              "{memory.description}"
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};
