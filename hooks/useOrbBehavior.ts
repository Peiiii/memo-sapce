import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTransform, useSpring, animate, useMotionValue } from 'framer-motion';
import { Memory, OrbLayout } from '../types';
import { usePresenter } from './usePresenter';
import { useCommonStore } from '../stores/commonStore';
import { useGalleryStore } from '../stores/galleryStore';
import { useSphereStore } from '../stores/sphereStore';

export const useOrbBehavior = (memory: Memory, worldRotationX: any, worldRotationY: any) => {
  const presenter = usePresenter();
  
  // Consuming Global State
  const { viewMode, memories } = useCommonStore();
  const { isGravityMode, sphereRadius } = useSphereStore();
  const { focusedIndex } = useGalleryStore();

  // Local State
  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Physics for Sphere Mode
  const orbRotationX = useMotionValue(0);
  const orbRotationY = useMotionValue(0);

  // Determine Layout Strategy
  const layout: OrbLayout = useMemo(() => {
    if (viewMode === 'gallery') {
      // Find index in sorted list for consistent gallery positioning
      const sorted = presenter.memoryManager.getSortedMemories(memories);
      const index = sorted.findIndex(m => m.id === memory.id);
      return presenter.layoutManager.getGalleryLayout(index, focusedIndex);
    } else {
      return presenter.layoutManager.getSphereLayout(memory, sphereRadius, isHovered, isDragging);
    }
  }, [viewMode, memories, focusedIndex, sphereRadius, memory, isHovered, isDragging, presenter]);

  // --- Animation Springs (The Adapter Layer) ---
  const springConfig = { stiffness: 100, damping: 20 };
  const animatedX = useSpring(0, springConfig);
  const animatedY = useSpring(0, springConfig);
  const animatedZ = useSpring(0, springConfig);
  const animatedScale = useSpring(1, springConfig);
  const animatedOpacity = useSpring(1, springConfig);
  const animatedRotateY = useSpring(0, springConfig);

  // Update springs when calculated layout changes
  useEffect(() => {
    animatedX.set(layout.x);
    animatedY.set(layout.y);
    animatedZ.set(layout.z);
    animatedScale.set(layout.scale);
    animatedOpacity.set(layout.opacity);
    animatedRotateY.set(layout.rotateY);
  }, [layout, animatedX, animatedY, animatedZ, animatedScale, animatedOpacity, animatedRotateY]);

  // --- Rotations & Physics Logic ---
  const inverseRotateX = useTransform(worldRotationX, (v: number) => -v);
  const inverseRotateY = useTransform(worldRotationY, (v: number) => -v);

  // In gallery mode, we ignore world rotation. In sphere mode, we counter-rotate to face camera.
  const finalRotateX = viewMode === 'gallery' ? 0 : inverseRotateX;
  const finalRotateY = viewMode === 'gallery' ? animatedRotateY : inverseRotateY;

  // Local Drift Animation Values (Only for sphere mode)
  const driftX = useMemo(() => Math.random() * 20 - 10, []);
  const driftY = useMemo(() => Math.random() * 20 - 10, []);
  const duration = useMemo(() => 10 + Math.random() * 10, []);

  // --- Interaction Handlers ---
  const snapToBalance = (val: number) => Math.round(val / 360) * 360;

  useEffect(() => {
    if (isGravityMode) {
      animate(orbRotationX, snapToBalance(orbRotationX.get()), { type: 'spring', stiffness: 200, damping: 25 });
      animate(orbRotationY, snapToBalance(orbRotationY.get()), { type: 'spring', stiffness: 200, damping: 25 });
    }
  }, [isGravityMode, orbRotationX, orbRotationY]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (viewMode === 'gallery') return;
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = true;
    setIsDragging(true);
    orbRotationX.stop();
    orbRotationY.stop();
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
    const sensitivity = 1.2; 
    orbRotationY.set(orbRotationY.get() - deltaX * sensitivity);
    orbRotationX.set(orbRotationX.get() - deltaY * sensitivity);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (viewMode === 'gallery') {
       // Interaction: Gallery Click -> Focus
       const sorted = presenter.memoryManager.getSortedMemories(memories);
       const index = sorted.findIndex(m => m.id === memory.id);
       if (index !== -1) presenter.galleryManager.setFocusedIndex(index);
       return;
    }

    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    setIsDragging(false);
    e.preventDefault();
    e.stopPropagation();
    (e.target as Element).releasePointerCapture(e.pointerId);
    
    if (isGravityMode) {
      animate(orbRotationX, snapToBalance(orbRotationX.get()), { type: 'spring', stiffness: 200, damping: 25 });
      animate(orbRotationY, snapToBalance(orbRotationY.get()), { type: 'spring', stiffness: 200, damping: 25 });
    }
  };

  const handleMouseEnter = () => { if (viewMode === 'sphere') setIsHovered(true); };
  const handleMouseLeave = () => { if (!isDraggingRef.current && viewMode === 'sphere') setIsHovered(false); };

  return {
    // Computed Visual State
    layout,
    transform: {
      x: animatedX,
      y: animatedY,
      z: animatedZ,
      scale: animatedScale,
      rotateX: finalRotateX,
      rotateY: finalRotateY,
      opacity: animatedOpacity,
      orbRotateX: orbRotationX,
      orbRotateY: orbRotationY
    },
    // Animations
    drift: { x: driftX, y: driftY, duration },
    // Interaction State
    state: {
      isHovered,
      isDragging,
      blurFilter: layout.blur ? `blur(${layout.blur}px)` : 'none'
    },
    // Handlers
    handlers: {
      onPointerDown: handlePointerDown,
      onPointerMove: handlePointerMove,
      onPointerUp: handlePointerUp,
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
    }
  };
};