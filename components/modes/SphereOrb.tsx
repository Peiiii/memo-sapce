import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useTransform, useSpring, animate, useMotionValue, MotionValue } from 'framer-motion';
import { Memory } from '../../types';
import { usePresenter } from '../../hooks/usePresenter';
import { useSphereStore } from '../../stores/sphereStore';
import { Orb } from '../Orb';

interface SphereOrbProps {
  memory: Memory;
  worldRotationX: MotionValue<number>;
  worldRotationY: MotionValue<number>;
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
  // Must match the CSS transform order of the container: rotateY then rotateX.
  // In matrix math (column vectors), this means applying Rx first, then Ry.
  const visualState = useTransform(
    [worldRotationX, worldRotationY, animatedX, animatedY, animatedZ],
    ([rx, ry, x, y, z]) => {
      // Convert degrees to radians
      const rXRad = (rx as number) * (Math.PI / 180);
      const rYRad = (ry as number) * (Math.PI / 180);

      const sinX = Math.sin(rXRad);
      const cosX = Math.cos(rXRad);
      const sinY = Math.sin(rYRad);
      const cosY = Math.cos(rYRad);

      // 1. Apply Rx (Rotate around X axis / Pitch)
      // x stays same
      // y' = y*cosX - z*sinX (not needed for Z calc)
      // z' = y*sinX + z*cosX
      const z1 = (y as number) * sinX + (z as number) * cosX;

      // 2. Apply Ry (Rotate around Y axis / Yaw) on the result
      // z'' = -x*sinY + z'*cosY
      const zFinal = -(x as number) * sinY + z1 * cosY;

      return zFinal;
    }
  );

  // Dynamic Styles based on Projected Depth (zFinal)
  const dynamicBlur = useTransform(visualState, (z) => {
    // Focus distance threshold. 
    // z > 0 is front hemisphere. We relax it a bit to z > -100 to keep side items relatively clear.
    if (z > -50) return 'blur(0px)';
    
    // Fade into blur as it goes back
    // Max blur 8px
    const depth = Math.abs(z - (-50));
    const blurAmount = Math.min(8, depth / 50); 
    return `blur(${blurAmount}px)`;
  });

  const dynamicOpacity = useTransform(visualState, (z) => {
    if (z > -50) return 1;
    // Dim back items
    return Math.max(0.3, 1 - Math.abs(z) / (sphereRadius * 1.5));
  });

  const dynamicPointerEvents = useTransform(visualState, (z) => {
    // Disable interaction for items in the back
    return z > -50 ? 'auto' : 'none';
  });
  
  const dynamicScale = useTransform([animatedScale, visualState], ([scale, z]) => {
     // Slight perspective boost
     const depthScale = Math.max(0.5, 1 + (z as number) / 2000); 
     return (scale as number) * depthScale;
  });

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
  const inverseRotateX = useTransform(worldRotationX, (v: number) => -v);
  const inverseRotateY = useTransform(worldRotationY, (v: number) => -v);
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
      scale={dynamicScale}
      opacity={dynamicOpacity}
      zIndex={layout.zIndex}
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
    />
  );
};