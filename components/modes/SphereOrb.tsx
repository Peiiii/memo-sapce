import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTransform, useSpring, animate, useMotionValue } from 'framer-motion';
import { Memory } from '../../types';
import { usePresenter } from '../../hooks/usePresenter';
import { useSphereStore } from '../../stores/sphereStore';
import { Orb } from '../Orb';

interface SphereOrbProps {
  memory: Memory;
  worldRotationX: any;
  worldRotationY: any;
}

export const SphereOrb: React.FC<SphereOrbProps> = ({ memory, worldRotationX, worldRotationY }) => {
  const presenter = usePresenter();
  const { sphereRadius, isGravityMode } = useSphereStore();

  const [isHovered, setIsHovered] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const isDraggingRef = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });

  // Physics
  const orbRotationX = useMotionValue(0);
  const orbRotationY = useMotionValue(0);

  // Layout Calc
  const layout = useMemo(() => {
    return presenter.sphereManager.getLayout(memory, sphereRadius, isHovered, isDragging);
  }, [memory, sphereRadius, isHovered, isDragging, presenter]);

  // Springs
  const springConfig = { stiffness: 100, damping: 20 };
  const animatedX = useSpring(layout.x, springConfig);
  const animatedY = useSpring(layout.y, springConfig);
  const animatedZ = useSpring(layout.z, springConfig);
  const animatedScale = useSpring(layout.scale, springConfig);
  const animatedOpacity = useSpring(layout.opacity, springConfig);

  useEffect(() => {
    animatedX.set(layout.x);
    animatedY.set(layout.y);
    animatedZ.set(layout.z);
    animatedScale.set(layout.scale);
    animatedOpacity.set(layout.opacity);
  }, [layout, animatedX, animatedY, animatedZ, animatedScale, animatedOpacity]);

  // Rotation Logic
  const inverseRotateX = useTransform(worldRotationX, (v: number) => -v);
  const inverseRotateY = useTransform(worldRotationY, (v: number) => -v);

  // Drift
  const driftX = useMemo(() => Math.random() * 20 - 10, []);
  const driftY = useMemo(() => Math.random() * 20 - 10, []);
  const duration = useMemo(() => 10 + Math.random() * 10, []);
  
  // We apply drift via simple transform inside Orb? No, let's use spring target modification or separate value.
  // For simplicity, we skip complex drift in this decoupled MVP or add it back simply.
  // Let's add simple drift to the spring target.
  const driftOffsetX = useMotionValue(0);
  const driftOffsetY = useMotionValue(0);

  useEffect(() => {
    if (isHovered || isDragging) {
      driftOffsetX.set(0);
      driftOffsetY.set(0);
      return;
    }
    animate(driftOffsetX, [0, driftX, -driftX, 0], { duration: duration, repeat: Infinity, ease: "easeInOut" });
    animate(driftOffsetY, [0, driftY, -driftY, 0], { duration: duration * 1.3, repeat: Infinity, ease: "easeInOut" });
  }, [driftX, driftY, duration, isHovered, isDragging, driftOffsetX, driftOffsetY]);

  const finalX = useTransform([animatedX, driftOffsetX], ([x, dx]) => (x as number) + (dx as number));
  const finalY = useTransform([animatedY, driftOffsetY], ([y, dy]) => (y as number) + (dy as number));

  // Interaction
  const snapToBalance = (val: number) => Math.round(val / 360) * 360;

  useEffect(() => {
    if (isGravityMode) {
      animate(orbRotationX, snapToBalance(orbRotationX.get()), { type: 'spring', stiffness: 200, damping: 25 });
      animate(orbRotationY, snapToBalance(orbRotationY.get()), { type: 'spring', stiffness: 200, damping: 25 });
    }
  }, [isGravityMode, orbRotationX, orbRotationY]);

  const handlePointerDown = (e: React.PointerEvent) => {
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
    if (!isDraggingRef.current) return;
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

  const isActive = (isHovered || isDragging) && !memory.isAnalyzing;

  return (
    <Orb
      id={memory.id}
      url={memory.url}
      description={memory.description}
      timestamp={memory.timestamp}
      x={finalX}
      y={finalY}
      z={animatedZ}
      rotateX={useTransform([inverseRotateX, orbRotationX], ([ir, or]) => (ir as number) + (or as number))}
      rotateY={useTransform([inverseRotateY, orbRotationY], ([ir, or]) => (ir as number) + (or as number))}
      scale={animatedScale}
      opacity={animatedOpacity}
      zIndex={layout.zIndex}
      isActive={isActive}
      blurFilter={layout.blur ? `blur(${layout.blur}px)` : 'none'}
      cursor={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isDraggingRef.current && setIsHovered(false)}
      side="left" // Default for tooltip
    />
  );
};