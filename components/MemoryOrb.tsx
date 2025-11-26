import React, { useState, useRef } from 'react';
import { Memory } from '../types';
import { motion, useDragControls } from 'framer-motion';

interface MemoryOrbProps {
  memory: Memory;
  onClick: () => void;
  isFocused: boolean;
  isOtherFocused: boolean;
  zIndex: number;
}

export const MemoryOrb: React.FC<MemoryOrbProps> = ({ memory, onClick, isFocused, isOtherFocused, zIndex }) => {
  const [isHovered, setIsHovered] = useState(false);
  const controls = useDragControls();
  
  // Randomize the drift animation slightly per orb to feel organic
  const driftRef = useRef({
    x: Math.random() * 20 - 10,
    y: Math.random() * 20 - 10,
    duration: 15 + Math.random() * 15,
  });

  // Calculate actual animation state based on props
  const getAnimationState = () => {
    if (isFocused) {
      return {
        // Move to absolute center. Since parent is relative w/h screen,
        // we can animate top/left to 50% and translate -50%.
        top: '50%',
        left: '50%',
        x: '-50%',
        y: '-50%',
        scale: 1.8, // Make it big
        opacity: 1,
        rotate: 0,
        zIndex: 1000, // Highest
      };
    }
    
    // Normal drifting state
    return {
      top: `${memory.y}%`,
      left: `${memory.x}%`,
      // Drifting motion
      x: [0, driftRef.current.x, -driftRef.current.x, 0],
      y: [0, driftRef.current.y, -driftRef.current.y, 0],
      rotate: isHovered ? 0 : [memory.rotation - 5, memory.rotation + 5, memory.rotation - 5],
      scale: isHovered ? 1.2 : memory.scale,
      opacity: isOtherFocused ? 0.2 : 1, // Dim if another is focused
      zIndex: isHovered ? 900 : zIndex,
    };
  };

  return (
    <motion.div
      className="absolute flex items-center justify-center cursor-pointer group"
      // Apply drag only when not focused.
      drag={!isFocused} 
      dragMomentum={false} // Prevents it from flying off screen
      dragControls={controls}
      // When dragging, we are changing the transform, so we need to be careful with layout animations.
      // However, for this ethereal feel, simple drag is enough.
      whileDrag={{ scale: 1.1, cursor: 'grabbing' }}
      
      initial={{ opacity: 0, scale: 0 }}
      animate={getAnimationState()}
      transition={{
        // Smooth transition for position changes (focus/unfocus)
        top: { type: "spring", stiffness: 40, damping: 15 },
        left: { type: "spring", stiffness: 40, damping: 15 },
        scale: { type: 'spring', stiffness: 60, damping: 15 },
        opacity: { duration: 0.5 },
        // Drifting loop
        x: isFocused ? { duration: 0.8 } : { duration: driftRef.current.duration, repeat: Infinity, ease: "easeInOut" },
        y: isFocused ? { duration: 0.8 } : { duration: driftRef.current.duration * 1.2, repeat: Infinity, ease: "easeInOut" },
        rotate: isFocused ? { duration: 0.8 } : { duration: driftRef.current.duration * 1.5, repeat: Infinity, ease: "easeInOut" }
      }}
      onClick={(e) => {
        // Prevent click when dragging ends
        if (Math.abs((e.target as HTMLElement).getBoundingClientRect().x - (e.clientX)) > 5) return;
        onClick();
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        // Fix zIndex issue during transitions
        zIndex: isFocused ? 1000 : (isHovered ? 900 : zIndex),
        touchAction: 'none', // Critical for dragging on touch devices
      }}
    >
      <div className={`relative transition-all duration-700 ease-out ${isFocused || isHovered ? 'filter-none' : 'blur-[1px] opacity-80 grayscale-[20%]'}`}>
        
        {/* Glow Effect */}
        <div className={`absolute inset-0 bg-blue-500 rounded-full mix-blend-screen blur-xl transition-opacity duration-700 ${isFocused || isHovered ? 'opacity-40' : 'opacity-0'}`}></div>

        {/* The Image */}
        <div className="relative overflow-hidden rounded-full border-2 border-white/10 shadow-2xl transition-all duration-500"
             style={{
               width: isFocused ? '300px' : (isHovered ? '160px' : '120px'),
               height: isFocused ? '300px' : (isHovered ? '160px' : '120px'),
               boxShadow: isFocused ? '0 0 50px rgba(100, 200, 255, 0.4)' : (isHovered ? '0 0 30px rgba(100, 200, 255, 0.3)' : 'none')
             }}
        >
          <img 
            src={memory.url} 
            alt="memory" 
            className="w-full h-full object-cover pointer-events-none" // prevent img drag default
          />
          
          {/* Loading / Analyzing Overlay */}
          {memory.isAnalyzing && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
            </div>
          )}
        </div>

        {/* Text Reveal - Always show when Focused, or on Hover if not analyzing */}
        {(isFocused || (isHovered && !isFocused)) && !memory.isAnalyzing && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`absolute top-full left-1/2 -translate-x-1/2 mt-6 text-center pointer-events-none ${isFocused ? 'w-96' : 'w-64'}`}
          >
            <p className={`text-white/90 font-serif italic drop-shadow-lg leading-relaxed tracking-wider bg-black/40 backdrop-blur-md p-4 rounded-xl border border-white/10 ${isFocused ? 'text-lg' : 'text-sm'}`}>
              "{memory.description}"
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};