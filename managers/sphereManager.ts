import { motionValue, MotionValue } from 'framer-motion';
import { useSphereStore } from '../stores/sphereStore';
import { useCommonStore } from '../stores/commonStore';
import { Memory, OrbLayout } from '../types';

export class SphereManager {
  public rotationX: MotionValue<number>;
  public rotationY: MotionValue<number>;
  private unsubMemories?: () => void;

  constructor() {
    this.rotationX = motionValue(0);
    this.rotationY = motionValue(0);
  }

  init = () => {
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
    // Subscribe to memory changes to adaptively resize the sphere
    this.unsubMemories = useCommonStore.subscribe(
      (state) => state.memories,
      () => this.handleResize()
    );
  };

  dispose = () => {
    window.removeEventListener('resize', this.handleResize);
    if (this.unsubMemories) this.unsubMemories();
  };

  handleResize = () => {
    // Basic screen fitting radius
    const width = window.innerWidth;
    const height = window.innerHeight;
    const baseRadius = Math.min(width, height) * 0.45;

    // Adaptive Scaling Factor
    // As items increase, we expand the radius to keep density relatively stable,
    // but we clamp it to prevent items from clipping through the camera (perspective 1200px)
    const memories = useCommonStore.getState().memories;
    const count = Math.max(20, memories.length); // Baseline ~20 items
    
    // Density logic: Surface area 4*pi*r^2. To keep items/area constant: r ~ sqrt(N)
    const densityFactor = Math.sqrt(count / 20);
    
    // Apply factor to base radius, but clamp between a minimum and a safe maximum
    // Perspective is 1200px, so we shouldn't go too close to that (e.g. 850px)
    let targetRadius = baseRadius * densityFactor;
    targetRadius = Math.max(350, Math.min(850, targetRadius));

    useSphereStore.getState().setSphereRadius(targetRadius);
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