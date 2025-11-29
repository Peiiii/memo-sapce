import React, { useRef } from 'react';
import { motion, useSpring } from 'framer-motion';
import { usePresenter } from '../../hooks/usePresenter';
import { useCommonStore } from '../../stores/commonStore';
import { SphereOrb } from './SphereOrb';

const MotionDiv = motion.div as any;

export const SphereView: React.FC = () => {
  const presenter = usePresenter();
  const { memories } = useCommonStore();
  const containerRef = useRef<HTMLDivElement>(null);

  const springConfig = { damping: 20, stiffness: 100, mass: 1 };
  const smoothRotateX = useSpring(presenter.sphereManager.rotationX, springConfig);
  const smoothRotateY = useSpring(presenter.sphereManager.rotationY, springConfig);

  // Drag Handlers for World Rotation
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) return;
    // Don't capture if clicking an orb (let orb handle it), but here we handle background drag
    // Ideally Orb handles its own, and propagation stops. If it bubbles, we rotate world.
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
          rotateX: smoothRotateX, 
          rotateY: smoothRotateY,
          transformStyle: 'preserve-3d', 
          width: 0, 
          height: 0 
        }}
        transformTemplate={({ rotateX, rotateY }: any) => `rotateY(${rotateY}) rotateX(${rotateX})`}
      >
        {memories.map((memory) => (
           <SphereOrb 
             key={memory.id} 
             memory={memory} 
             worldRotationX={smoothRotateX}
             worldRotationY={smoothRotateY}
           />
        ))}
      </MotionDiv>
    </div>
  );
};
