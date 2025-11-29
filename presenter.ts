import { MemoryManager } from './managers/memoryManager';
import { SphereManager } from './managers/sphereManager';
import { GalleryManager } from './managers/galleryManager';
import { LayoutManager } from './managers/layoutManager';
import { useCommonStore, ViewMode } from './stores/commonStore';
import { useGalleryStore } from './stores/galleryStore';

export class Presenter {
  memoryManager: MemoryManager;
  sphereManager: SphereManager;
  galleryManager: GalleryManager;
  layoutManager: LayoutManager;

  constructor() {
    this.memoryManager = new MemoryManager();
    this.sphereManager = new SphereManager();
    this.galleryManager = new GalleryManager();
    this.layoutManager = new LayoutManager();
    
    // Initialize
    this.memoryManager.init();
    this.sphereManager.init();
  }

  // Helper to switch modes
  switchViewMode = (mode: ViewMode) => {
    const currentMode = useCommonStore.getState().viewMode;
    if (currentMode === mode) return;

    useCommonStore.getState().setViewMode(mode);

    if (mode === 'gallery') {
      // Reset gallery focus when entering
      useGalleryStore.getState().setFocusedIndex(0);
      // Reset rotation source if desired
      this.sphereManager.rotationX.set(0);
      this.sphereManager.rotationY.set(0);
    }
  };
}