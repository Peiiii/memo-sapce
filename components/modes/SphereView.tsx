import React, { useRef, useEffect } from 'react';
import { motion, useSpring } from 'framer-motion';
import { usePresenter } from '../../hooks/usePresenter';
import { useCommonStore } from '../../stores/commonStore';
import { SphereOrb } from './SphereOrb';
import { VisualSphere } from './VisualSphere';

const MotionDiv = motion.div as any;

export const SphereView: React.FC = () => {
  const presenter = usePresenter();
  const { memories } = useCommonStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // We use the raw matrix string now
  const transformMatrix = presenter.sphereManager.transformMatrix;
  const transformMatrixRaw = presenter.sphereManager.transformMatrixRaw;
  const inverseMatrix = presenter.sphereManager.inverseMatrix;
  
  const smoothScale = useSpring(presenter.sphereManager.sphereScale, { damping: 20, stiffness: 120 });

  // Drag Handlers for World Rotation
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    presenter.sphereManager.handleDrag(deltaX, deltaY);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  // Wheel Handler for Zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      presenter.sphereManager.handleZoom(e.deltaY);
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('wheel', handleWheel, { passive: false });
    }
    return () => {
      if (el) el.removeEventListener('wheel', handleWheel);
    };
  }, [presenter]);

  return (
    <div 
      ref={containerRef}
      className="absolute inset-0 flex items-center justify-center pointer-events-auto"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      style={{ perspective: '1200px', cursor: 'grab' }} 
    >
      <MotionDiv 
        className="relative preserve-3d"
        style={{ 
          transform: transformMatrix, // Now driving rotation via CSS Matrix
          scale: smoothScale,
          transformStyle: 'preserve-3d', 
          width: 0, 
          height: 0 
        }}
      >
        <VisualSphere />
        
        {memories.map((memory) => (
           <SphereOrb 
             key={memory.id} 
             memory={memory} 
             inverseMatrix={inverseMatrix}
             transformMatrixRaw={transformMatrixRaw}
           />
        ))}
      </MotionDiv>
    </div>
  );
};