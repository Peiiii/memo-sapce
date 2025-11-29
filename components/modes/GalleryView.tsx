import React, { useEffect, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { usePresenter } from '../../hooks/usePresenter';
import { useCommonStore } from '../../stores/commonStore';
import { GalleryOrb } from './GalleryOrb';

const MotionDiv = motion.div as any;

export const GalleryView: React.FC = () => {
  const presenter = usePresenter();
  const { memories } = useCommonStore();

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') presenter.galleryManager.navigate('prev');
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') presenter.galleryManager.navigate('next');
  }, [presenter]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const sortedMemories = useMemo(() => {
    return presenter.memoryManager.getSortedMemories(memories);
  }, [memories, presenter]);

  return (
    <div 
      className="absolute inset-0 flex items-center justify-center pointer-events-auto"
      style={{ perspective: '1200px', cursor: 'default' }} 
    >
      <MotionDiv 
        className="relative preserve-3d"
        style={{ 
          transformStyle: 'preserve-3d', 
          width: 0, 
          height: 0,
          rotateX: 0,
          rotateY: 0
        }}
      >
        {sortedMemories.map((memory, index) => (
           <GalleryOrb 
             key={memory.id} 
             memory={memory} 
             index={index}
           />
        ))}
      </MotionDiv>
    </div>
  );
};
