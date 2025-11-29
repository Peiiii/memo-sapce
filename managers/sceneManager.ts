import { motionValue, MotionValue } from 'framer-motion';
import { useSceneStore } from '../stores/sceneStore';
import { useMemoryStore } from '../stores/memoryStore';

export class SceneManager {
  // We keep motion values in the manager to share them across the app without prop drilling
  // and to manipulate them from business logic.
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
    useSceneStore.getState().setSphereRadius(Math.max(350, r));
  };

  toggleViewMode = () => {
    const currentMode = useSceneStore.getState().viewMode;
    const newMode = currentMode === 'sphere' ? 'gallery' : 'sphere';
    useSceneStore.getState().setViewMode(newMode);

    if (newMode === 'gallery') {
      // Reset rotation when entering gallery, handled by View springs mostly,
      // but we can reset the source values here too if needed.
      // Note: Springs in the view will animate this, but we reset source of truth.
      this.rotationX.set(0);
      this.rotationY.set(0);
      useMemoryStore.getState().setFocusedIndex(0);
    }
  };

  toggleGravityMode = () => {
    useSceneStore.getState().setIsGravityMode(prev => !prev);
  };

  handleDrag = (deltaX: number, deltaY: number) => {
    const sensitivity = 0.3;
    this.rotationY.set(this.rotationY.get() + deltaX * sensitivity);
    this.rotationX.set(this.rotationX.get() - deltaY * sensitivity);
  };
  
  // Helpers to get current rotation values for calculation
  getRotation = () => {
    return {
      x: this.rotationX.get(),
      y: this.rotationY.get()
    };
  }
}