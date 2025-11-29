import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTransform, useSpring, animate, useMotionValue, MotionValue } from 'framer-motion';
import { Memory } from '../../types';
import { usePresenter } from '../../hooks/usePresenter';
import { useSphereStore } from '../../stores/sphereStore';
import { Orb } from '../Orb';

interface SphereOrbProps {
  memory: Memory;
  inverseMatrix: MotionValue<string>;
  transformMatrixRaw: MotionValue<number[]>;
}

export const SphereOrb: React.FC<SphereOrbProps> = ({ memory, inverseMatrix, transformMatrixRaw }) => {
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

  // Springs for smooth layout transitions
  const springConfig = { stiffness: 100, damping: 20 };
  const animatedX = useSpring(layout.x, springConfig);
  const animatedY = useSpring(layout.y, springConfig);
  const animatedZ = useSpring(layout.z, springConfig);
  const animatedScale = useSpring(layout.scale, springConfig);
  
  useEffect(() => {
    animatedX.set(layout.x);
    animatedY.set(layout.y);
    animatedZ.set(layout.z);
    animatedScale.set(layout.scale);
  }, [layout, animatedX, animatedY, animatedZ, animatedScale]);

  // --- 3D Projection & Depth Logic ---
  // Calculates the effective Z-depth after world rotation to determine styling.
  const visualState = useTransform(
    [transformMatrixRaw, animatedX, animatedY, animatedZ] as MotionValue<any>[],
    ([mat, x, y, z]: any[]) => {
      // mat is column-major array.
      // Z_world = m[2]*x + m[6]*y + m[10]*z + m[14]
      // We ignore translation (m[14]) as the sphere logic centers at 0,0,0
      const m = mat as number[];
      const worldZ = m[2] * (x as number) + m[6] * (y as number) + m[10] * (z as number);
      return worldZ;
    }
  );

  // Dynamic Styles based on Projected Depth (zFinal)
  const dynamicBlur = useTransform(visualState, (z) => {
    if ((z as number) > -50) return 'blur(0px)';
    const depth = Math.abs((z as number) - (-50));
    const blurAmount = Math.min(8, depth / 50); 
    return `blur(${blurAmount}px)`;
  });

  const dynamicOpacity = useTransform(visualState, (z) => {
    if ((z as number) > -50) return 1;
    return Math.max(0.3, 1 - Math.abs(z as number) / (sphereRadius * 1.5));
  });

  const dynamicPointerEvents = useTransform(visualState, (z) => {
    return (z as number) > -50 ? 'auto' : 'none';
  });
  
  const dynamicScale = useTransform([animatedScale, visualState], ([scale, z]) => {
     const depthScale = Math.max(0.5, 1 + (z as number) / 2000); 
     return (scale as number) * depthScale;
  });

  // FIXED: Dynamic Z-Index based on World Z to ensure proper occlusion during rotation
  const dynamicZIndex = useTransform(visualState, (z) => Math.floor(z as number) + 2000);

  // --- Drift Logic ---
  const driftOffsetX = useMotionValue(0);
  const driftOffsetY = useMotionValue(0);
  const driftX = useMemo(() => Math.random() * 20 - 10, []);
  const driftY = useMemo(() => Math.random() * 20 - 10, []);
  const duration = useMemo(() => 10 + Math.random() * 10, []);

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

  // --- Interaction ---
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
      rotateX={orbRotationX}
      rotateY={orbRotationY}
      scale={dynamicScale}
      opacity={dynamicOpacity}
      zIndex={dynamicZIndex}
      isActive={isActive}
      filter={dynamicBlur}
      pointerEvents={dynamicPointerEvents}
      cursor={isDragging ? 'cursor-grabbing' : 'cursor-grab'}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => !isDraggingRef.current && setIsHovered(false)}
      side="left"
      billboardMatrix={inverseMatrix}
    />
  );
};