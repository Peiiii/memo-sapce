import React, { useMemo, useEffect } from 'react';
import { useSpring, useMotionValue } from 'framer-motion';
import { Memory } from '../../types';
import { usePresenter } from '../../hooks/usePresenter';
import { useGalleryStore } from '../../stores/galleryStore';
import { Orb } from '../Orb';

interface GalleryOrbProps {
  memory: Memory;
  index: number; // Index in the sorted list
}

export const GalleryOrb: React.FC<GalleryOrbProps> = ({ memory, index }) => {
  const presenter = usePresenter();
  const { focusedIndex } = useGalleryStore();

  const layout = useMemo(() => {
    return presenter.galleryManager.getLayout(index, focusedIndex);
  }, [index, focusedIndex, presenter]);

  const springConfig = { stiffness: 100, damping: 20 };
  const animatedX = useSpring(layout.x, springConfig);
  const animatedY = useSpring(layout.y, springConfig);
  const animatedZ = useSpring(layout.z, springConfig);
  const animatedScale = useSpring(layout.scale, springConfig);
  const animatedOpacity = useSpring(layout.opacity, springConfig);
  
  // Gallery doesn't really rotate individual orbs much, but let's reset them
  const zero = useMotionValue(0);

  useEffect(() => {
    animatedX.set(layout.x);
    animatedY.set(layout.y);
    animatedZ.set(layout.z);
    animatedScale.set(layout.scale);
    animatedOpacity.set(layout.opacity);
  }, [layout, animatedX, animatedY, animatedZ, animatedScale, animatedOpacity]);

  const handleClick = () => {
    presenter.galleryManager.setFocusedIndex(index);
  };

  return (
    <Orb
      id={memory.id}
      url={memory.url}
      description={memory.description}
      timestamp={memory.timestamp}
      x={animatedX}
      y={animatedY}
      z={animatedZ}
      rotateX={zero}
      rotateY={zero}
      scale={animatedScale}
      opacity={animatedOpacity}
      zIndex={layout.zIndex}
      isActive={layout.isActive}
      side={layout.side}
      filter={layout.blur ? `blur(${layout.blur}px)` : 'none'}
      cursor="cursor-pointer"
      onPointerUp={handleClick}
    />
  );
};