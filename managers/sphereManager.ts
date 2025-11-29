import { motionValue, MotionValue } from 'framer-motion';
import { useSphereStore } from '../stores/sphereStore';
import { Memory, OrbLayout } from '../types';

export class SphereManager {
  public rotationX: MotionValue<number>;
  public rotationY: MotionValue<number>;

  constructor() {
    this.rotationX = motionValue(0);
    this.rotationY = motionValue(0);
  }

  init = () => {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  };

  dispose = () => {
    window.removeEventListener('resize', this.handleResize);
  };

  handleResize = () => {
    const r = Math.min(window.innerWidth, window.innerHeight) * 0.48;
    useSphereStore.getState().setSphereRadius(Math.max(350, r));
  };

  toggleGravityMode = () => {
    useSphereStore.getState().setIsGravityMode(prev => !prev);
  };

  handleDrag = (deltaX: number, deltaY: number) => {
    const sensitivity = 0.3;
    this.rotationY.set(this.rotationY.get() + deltaX * sensitivity);
    this.rotationX.set(this.rotationX.get() - deltaY * sensitivity);
  };
  
  getRotation = () => {
    return {
      x: this.rotationX.get(),
      y: this.rotationY.get()
    };
  }

  // --- Layout Logic Specific to Sphere ---
  getLayout(
    memory: Memory, 
    radius: number, 
    isHovered: boolean, 
    isDragging: boolean
  ): OrbLayout {
    // Spherical to Cartesian conversion
    const x = radius * Math.sin(memory.phi) * Math.cos(memory.theta);
    const y = radius * Math.cos(memory.phi);
    const z = radius * Math.sin(memory.phi) * Math.sin(memory.theta);

    const BASE_SCALE = memory.scale;
    const HOVER_SCALE_MULTIPLIER = 1.2;
    const activeScale = (isHovered || isDragging) ? BASE_SCALE * HOVER_SCALE_MULTIPLIER : BASE_SCALE;

    return {
      x,
      y,
      z,
      rotateX: 0,
      rotateY: 0,
      scale: activeScale,
      opacity: 1,
      zIndex: Math.floor(z) + 2000,
      blur: 0,
      isActive: false
    };
  }
}
