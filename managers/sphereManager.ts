import { motionValue, MotionValue } from 'framer-motion';
import { useSphereStore } from '../stores/sphereStore';
import { useCommonStore } from '../stores/commonStore';
import { Memory, OrbLayout } from '../types';

export class SphereManager {
  public rotationX: MotionValue<number>;
  public rotationY: MotionValue<number>;
  public sphereScale: MotionValue<number>;
  private unsubMemories?: () => void;

  constructor() {
    this.rotationX = motionValue(0);
    this.rotationY = motionValue(0);
    this.sphereScale = motionValue(1.8);
  }

  init = () => {
    this.handleResize();
    // Subscribe to memory changes to update radius based on count
    this.unsubMemories = useCommonStore.subscribe(
      (state) => state.memories,
      () => this.handleResize()
    );
  };

  dispose = () => {
    if (this.unsubMemories) this.unsubMemories();
  };

  handleResize = () => {
    // Constant Density Logic: 
    // To keep average surface area per image constant, Radius ~ sqrt(Count).
    const memories = useCommonStore.getState().memories;
    const count = Math.max(1, memories.length);
    
    // Adjusted multiplier to 45 to balance with the increased default zoom.
    const calculatedRadius = 45 * Math.sqrt(count);

    // Apply a minimum radius to prevent the universe from looking too small/curved for very few items
    useSphereStore.getState().setSphereRadius(Math.max(200, calculatedRadius));
  };

  toggleGravityMode = () => {
    useSphereStore.getState().setIsGravityMode(prev => !prev);
  };

  handleDrag = (deltaX: number, deltaY: number) => {
    const sensitivity = 0.3;
    this.rotationY.set(this.rotationY.get() + deltaX * sensitivity);
    // Standard CSS rotateX behavior: Decreasing angle moves the front face down.
    // So dragging down (deltaY > 0) should decrease rotationX to move surface down.
    this.rotationX.set(this.rotationX.get() - deltaY * sensitivity);
  };

  handleZoom = (delta: number) => {
    const current = this.sphereScale.get();
    // Zoom limits: 0.2x to 5x
    const newScale = Math.max(0.2, Math.min(5, current - delta * 0.001));
    this.sphereScale.set(newScale);
  };
  
  getRotation = () => {
    return {
      x: this.rotationX.get(),
      y: this.rotationY.get()
    };
  }

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
    const HOVER_SCALE_MULTIPLIER = 1.4; // Stronger pop for smaller orbs
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