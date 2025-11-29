import React from 'react';
import { AmbientBackground } from './components/AmbientBackground';
import { ControlBar } from './components/ControlBar';
import { GalleryNavigation } from './components/GalleryNavigation';
import { EmptyState } from './components/EmptyState';
import { useCommonStore } from './stores/commonStore';
import { SphereView } from './components/modes/SphereView';
import { GalleryView } from './components/modes/GalleryView';
import { AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const { memories, viewMode } = useCommonStore();

  return (
    <div className="relative w-full h-screen overflow-hidden text-slate-200 bg-[#0f172a] touch-none select-none">
      <AmbientBackground />

      <AnimatePresence mode="wait">
        {viewMode === 'sphere' && <SphereView key="sphere" />}
        {viewMode === 'gallery' && <GalleryView key="gallery" />}
      </AnimatePresence>

      {memories.length === 0 && <EmptyState />}
      {viewMode === 'gallery' && memories.length > 0 && <GalleryNavigation />}
      <ControlBar />

      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-40"></div>
    </div>
  );
};

export default App;
