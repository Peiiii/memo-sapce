import { useGalleryStore } from '../stores/galleryStore';
import { useCommonStore } from '../stores/commonStore';
import { OrbLayout } from '../types';

export class GalleryManager {
  
  navigate = (direction: 'next' | 'prev') => {
    const length = useCommonStore.getState().memories.length;
    useGalleryStore.getState().setFocusedIndex(current => {
      if (direction === 'next') {
        return Math.min(current + 1, length - 1);
      } else {
        return Math.max(current - 1, 0);
      }
    });
  };

  setFocusedIndex = (index: number) => {
    useGalleryStore.getState().setFocusedIndex(index);
  }

  // --- Layout Logic Specific to Gallery ---
  getLayout(
    index: number, 
    focusedIndex: number
  ): OrbLayout {
    const offset = index - focusedIndex;
    const GOLDEN_ANGLE = 2.39996; 
    const Z_SPACING = 800; 
    const SPIRAL_RADIUS = 380; 

    // Spiral Math
    const z = -offset * Z_SPACING;
    const theta = index * GOLDEN_ANGLE;
    const absX = Math.cos(theta) * SPIRAL_RADIUS;
    const absY = Math.sin(theta) * SPIRAL_RADIUS;

    // Calculate position relative to the focused item (which should be centered)
    const activeTheta = focusedIndex * GOLDEN_ANGLE;
    const activeAbsX = Math.cos(activeTheta) * SPIRAL_RADIUS;
    const activeAbsY = Math.sin(activeTheta) * SPIRAL_RADIUS;

    const x = absX - activeAbsX;
    const y = absY - activeAbsY;

    const dist = Math.abs(offset);
    const scale = offset === 0 ? 1.4 : Math.max(0.6, 1.2 - dist * 0.1);
    
    let opacity = 1;
    if (offset < 0) {
       opacity = Math.max(0, 1 + offset * 0.4); 
    } else {
       opacity = Math.max(0, 1 - offset * 0.15); 
    }

    const blur = dist * 2; 
    const isActive = offset === 0;
    
    const zIndex = isActive ? 10000 : (1000 - blur * 10);

    return {
      x,
      y,
      z,
      rotateX: 0,
      rotateY: 0,
      scale,
      opacity,
      zIndex,
      blur,
      isActive,
      side: x > 0 ? 'right' : 'left'
    };
  }
}
