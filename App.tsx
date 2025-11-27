import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AmbientBackground } from './components/AmbientBackground';
import { MemoryOrb, GalleryAttributes } from './components/MemoryOrb';
import { Memory } from './types';
import { interpretMemory } from './services/geminiService';
import { PlusIcon, ArrowsUpDownIcon, Square3Stack3DIcon, GlobeAsiaAustraliaIcon, ChevronUpIcon, ChevronDownIcon } from '@heroicons/react/24/outline';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// Cast motion.div to any to avoid type errors with transformTemplate
const MotionDiv = motion.div as any;

// Helper: Fibonacci Sphere Distribution
const getFibonacciPos = (index: number, total: number) => {
  const phi = Math.acos(1 - 2 * (index + 0.5) / total);
  const theta = Math.PI * (1 + Math.sqrt(5)) * index;
  
  return {
    theta: theta, 
    phi: phi 
  };
};

// Calculate the spherical coordinates that correspond to the "Front" of the view
const getFrontAndCenterPos = (rotXDeg: number, rotYDeg: number) => {
  const rotX = rotXDeg * Math.PI / 180;
  const rotY = rotYDeg * Math.PI / 180;

  const x = -Math.cos(rotX) * Math.sin(rotY);
  const y = Math.sin(rotX);
  const z = Math.cos(rotX) * Math.cos(rotY);

  const clampedY = Math.max(-1, Math.min(1, y));
  const phi = Math.acos(clampedY);
  const theta = Math.atan2(z, x);

  return { theta, phi };
};

const RAW_MEMORY_DATA = [
  {
    id: 'mem-sunset',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=600&auto=format&fit=crop',
    description: "夕阳沉入地平线，带走了最后的喧嚣。",
    scale: 1.1,
    rotation: -5,
  },
  {
    id: 'mem-forest',
    url: 'https://images.unsplash.com/photo-1511497584788-876760111969?q=80&w=600&auto=format&fit=crop',
    description: "深林的呼吸，是地球最古老的语言。",
    scale: 1,
    rotation: 5,
  },
  {
    id: 'mem-urban',
    url: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?q=80&w=600&auto=format&fit=crop',
    description: "城市灯火阑珊，藏着万千心事。",
    scale: 1.15,
    rotation: -8,
  },
  {
    id: 'mem-coffee',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop',
    description: "时光在咖啡香气中变得缓慢而醇厚。",
    scale: 0.9,
    rotation: 12,
  },
  {
    id: 'mem-sea',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=600&auto=format&fit=crop',
    description: "海浪轻抚沙滩，抹去昨日的足迹。",
    scale: 1.2,
    rotation: 0,
  },
  {
    id: 'mem-stars',
    url: 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=600&auto=format&fit=crop',
    description: "在星尘的注视下，我们都是孩子。",
    scale: 1.05,
    rotation: -15,
  },
  {
    id: 'mem-book',
    url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=600&auto=format&fit=crop',
    description: "文字搭建的城堡，比现实更永恒。",
    scale: 0.95,
    rotation: 8,
  },
  {
    id: 'mem-cat',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop',
    description: "柔软的注视，治愈了坚硬的世界。",
    scale: 1.0,
    rotation: -4,
  },
  {
    id: 'mem-rain',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=600&auto=format&fit=crop',
    description: "雨滴敲打窗棂，像一首未完的诗。",
    scale: 1.08,
    rotation: 6,
  },
  {
    id: 'mem-flower',
    url: 'https://images.unsplash.com/photo-1460039230329-eb070fc6c77c?q=80&w=600&auto=format&fit=crop',
    description: "花开一瞬，却留下了整个春天的记忆。",
    scale: 0.92,
    rotation: -10,
  },
  {
    id: 'mem-snow',
    url: 'https://images.unsplash.com/photo-1548266652-99cf27701ced?q=80&w=600&auto=format&fit=crop',
    description: "世界纯白如初，掩盖了所有的来路。",
    scale: 1.02,
    rotation: 3,
  },
  {
    id: 'mem-night',
    url: 'https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=600&auto=format&fit=crop',
    description: "夜色温柔，收容了所有流浪的梦。",
    scale: 0.98,
    rotation: -6,
  },
];

// Generate Initial Memories with Fibonacci Distribution
const DEFAULT_MEMORIES: Memory[] = RAW_MEMORY_DATA.map((data, index) => {
  const pos = getFibonacciPos(index, RAW_MEMORY_DATA.length);
  return {
    ...data,
    // Distribute timestamps to create a timeline
    timestamp: Date.now() - index * 86400000 * 10, 
    theta: pos.theta,
    phi: pos.phi,
    driftSpeed: 0.8 + Math.random() * 0.4,
    isAnalyzing: false,
  };
});

type ViewMode = 'sphere' | 'gallery';

const App: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>(DEFAULT_MEMORIES);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isGravityMode, setIsGravityMode] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('sphere');
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  // 3D Sphere Interaction State
  const containerRef = useRef<HTMLDivElement>(null);
  const [sphereRadius, setSphereRadius] = useState(350);
  
  // Physics-based rotation
  const rotationX = useMotionValue(0);
  const rotationY = useMotionValue(0);
  
  // Smooth springs for inertia
  const springConfig = { damping: 20, stiffness: 100, mass: 1 };
  const smoothRotateX = useSpring(rotationX, springConfig);
  const smoothRotateY = useSpring(rotationY, springConfig);

  // Gallery view automatic rotation reset
  useEffect(() => {
    if (viewMode === 'gallery') {
      smoothRotateX.set(0);
      smoothRotateY.set(0);
      rotationX.set(0);
      rotationY.set(0);
    }
  }, [viewMode, smoothRotateX, smoothRotateY, rotationX, rotationY]);

  // Sort memories for Gallery Mode (Reverse Chronological: Newest First)
  const sortedMemories = useMemo(() => {
    return [...memories].sort((a, b) => b.timestamp - a.timestamp);
  }, [memories]);

  // Reset focus when entering gallery
  useEffect(() => {
    if (viewMode === 'gallery') {
      setFocusedIndex(0);
    }
  }, [viewMode]);

  // Responsive Radius
  useEffect(() => {
    const handleResize = () => {
      const r = Math.min(window.innerWidth, window.innerHeight) * 0.48;
      setSphereRadius(Math.max(350, r)); 
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          resolve(base64);
        }
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    // Capture current rotation state once for this batch
    const currentRotX = rotationX.get();
    const currentRotY = rotationY.get();
    
    const centerPos = getFrontAndCenterPos(currentRotX, currentRotY);

    const newMemories: Memory[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const id = uuidv4();
      const objectUrl = URL.createObjectURL(file);
      
      const spread = 0.3;
      const theta = centerPos.theta + (Math.random() - 0.5) * spread;
      let phi = centerPos.phi + (Math.random() - 0.5) * spread;
      phi = Math.max(0.1, Math.min(Math.PI - 0.1, phi));

      const memory: Memory = {
        id,
        url: objectUrl,
        description: "正在唤醒记忆...",
        timestamp: Date.now(), // Newest timestamp
        theta: theta,
        phi: phi,
        scale: 0.9 + Math.random() * 0.3,
        rotation: Math.random() * 30 - 15,
        driftSpeed: 10 + Math.random() * 10,
        isAnalyzing: true,
      };

      newMemories.push(memory);

      fileToBase64(file).then(async (base64) => {
        const description = await interpretMemory(base64, file.type);
        setMemories(current => 
          current.map(m => m.id === id ? { ...m, description, isAnalyzing: false } : m)
        );
      });
    }

    setMemories(prev => [...prev, ...newMemories]);
    if (fileInputRef.current) fileInputRef.current.value = '';
    
    // In Gallery mode (Newest First), new items appear at index 0.
    if (viewMode === 'gallery') {
      setFocusedIndex(0);
    }
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    // Disable world drag in Gallery Mode
    if (viewMode === 'gallery') return;

    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('input')) {
        return;
    }

    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  // Drag Interaction Logic
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || viewMode === 'gallery') return;
    
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.3;
    rotationY.set(rotationY.get() + deltaX * sensitivity);
    rotationX.set(rotationX.get() - deltaY * sensitivity);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  const toggleGravityMode = () => {
    setIsGravityMode(prev => !prev);
  };
  
  const toggleViewMode = () => {
    setViewMode(prev => prev === 'sphere' ? 'gallery' : 'sphere');
  };

  // Gallery Navigation
  const navigateGallery = (direction: 'next' | 'prev') => {
    setFocusedIndex(current => {
      if (direction === 'next') {
        return Math.min(current + 1, sortedMemories.length - 1);
      } else {
        return Math.max(current - 1, 0);
      }
    });
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (viewMode !== 'gallery') return;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') navigateGallery('prev');
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') navigateGallery('next');
  }, [viewMode, sortedMemories.length]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div 
      className="relative w-full h-screen overflow-hidden text-slate-200 bg-[#0f172a] touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      ref={containerRef}
      style={{ cursor: viewMode === 'gallery' ? 'default' : 'grab' }}
    >
      <AmbientBackground />

      {/* 3D Scene Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ perspective: '1200px' }} 
      >
        <MotionDiv 
          className="relative preserve-3d pointer-events-auto"
          style={{ 
            rotateX: smoothRotateX, 
            rotateY: smoothRotateY,
            transformStyle: 'preserve-3d', 
            width: 0, 
            height: 0 
          }}
          // Conditional template: Only apply world rotation in Sphere Mode
          transformTemplate={({ rotateX, rotateY }: { rotateX: any, rotateY: any }) => {
            return viewMode === 'sphere' ? `rotateY(${rotateY}) rotateX(${rotateX})` : `rotateY(0deg) rotateX(0deg)`;
          }}
        >
          {sortedMemories.map((memory, index) => {
            // Calculate Gallery Attributes
            let galleryAttrs: GalleryAttributes | undefined;
            
            if (viewMode === 'gallery') {
              const offset = index - focusedIndex;
              // offset 0 = focused (Present)
              // offset > 0 = older (Background/Distance)
              // offset < 0 = newer (Foreground/Behind Camera)
              
              // New Spiral / Helix Layout
              const Z_SPACING = 700; 
              const SPIRAL_RADIUS = 350; 
              const ANGLE_STEP = 0.6; // ~35 degrees per step, avoids visual overlap

              // Depth: Negative Z goes into the screen
              const z = -offset * Z_SPACING;

              // Spiral Logic:
              // We calculate the spiral position for the current index, 
              // AND the spiral position for the focused index.
              // We then subtract the focused position, so the focused item is always at (0,0) in XY space.
              // This creates a "Corkscrew" camera effect where we travel through the tunnel.

              const theta = index * ANGLE_STEP;
              const absX = Math.cos(theta) * SPIRAL_RADIUS;
              const absY = Math.sin(theta) * SPIRAL_RADIUS;

              const activeTheta = focusedIndex * ANGLE_STEP;
              const activeAbsX = Math.cos(activeTheta) * SPIRAL_RADIUS;
              const activeAbsY = Math.sin(activeTheta) * SPIRAL_RADIUS;

              const x = absX - activeAbsX;
              const y = absY - activeAbsY;

              const rotateY = 0; // Keep flat for better readability

              // Visual Attributes based on distance from focus
              const dist = Math.abs(offset);
              
              // Scale down items in the distance, but keep the active one prominent
              const scale = offset === 0 ? 1.4 : Math.max(0.6, 1 - dist * 0.05);
              
              // Fade out items that are very far OR behind the camera (negative offset)
              let opacity = 1;
              if (offset < 0) {
                 opacity = Math.max(0, 1 + offset * 0.4); // Fade out as they go "behind" us
              } else {
                 opacity = Math.max(0, 1 - offset * 0.12); // Fade out into the deep distance
              }

              const blur = dist * 2; // Depth of field blur

              galleryAttrs = {
                x, y, z, rotateY, scale, opacity, blur, 
                isActive: offset === 0,
                side: x > 0 ? 'right' : 'left' // Put text on the outer side
              };
            }

            return (
              <MemoryOrb 
                key={memory.id} 
                memory={memory} 
                radius={sphereRadius}
                worldRotationX={smoothRotateX}
                worldRotationY={smoothRotateY}
                isGravityMode={isGravityMode}
                viewMode={viewMode}
                galleryAttrs={galleryAttrs}
                onFocus={() => {}}
                onClick={() => {
                   if (viewMode === 'gallery') setFocusedIndex(index);
                }}
              />
            );
          })}
        </MotionDiv>
      </div>

      {/* Empty State Instructions */}
      {memories.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h1 className="text-4xl md:text-6xl font-serif text-white/80 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-4 animate-pulse">
            记忆空间
          </h1>
          <p className="text-white/40 font-light tracking-wide text-lg max-w-md text-center">
            拖拽以旋转空间，或拨动单个记忆星球<br/>
            上传你的照片，让它们在此刻凝结成诗
          </p>
        </div>
      )}

      {/* Gallery Navigation Buttons (Right Side) */}
      {viewMode === 'gallery' && sortedMemories.length > 0 && (
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50 pointer-events-auto">
          <button 
            onClick={() => navigateGallery('prev')}
            disabled={focusedIndex === 0}
            className={`p-4 rounded-full backdrop-blur-md border border-white/10 transition-all ${focusedIndex === 0 ? 'bg-slate-800/30 text-white/20 cursor-not-allowed' : 'bg-slate-800/60 text-white hover:bg-slate-700/80 hover:scale-110'}`}
          >
            <ChevronUpIcon className="w-8 h-8" />
          </button>
          <div className="text-center font-mono text-xs text-white/30 tracking-widest flex flex-col items-center gap-1">
             <span className="text-indigo-400 font-bold">{focusedIndex + 1}</span>
             <span className="w-4 h-px bg-white/20"></span>
             <span>{sortedMemories.length}</span>
          </div>
          <button 
            onClick={() => navigateGallery('next')}
            disabled={focusedIndex === sortedMemories.length - 1}
            className={`p-4 rounded-full backdrop-blur-md border border-white/10 transition-all ${focusedIndex === sortedMemories.length - 1 ? 'bg-slate-800/30 text-white/20 cursor-not-allowed' : 'bg-slate-800/60 text-white hover:bg-slate-700/80 hover:scale-110'}`}
          >
            <ChevronDownIcon className="w-8 h-8" />
          </button>
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div className="flex items-center gap-4 bg-slate-900/80 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          
          {/* Upload Button */}
          <button 
            className="flex flex-col items-center group"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="bg-white/10 p-3 rounded-full group-hover:bg-white/20 transition-colors border border-white/5">
              <PlusIcon className="w-6 h-6 text-white" />
            </div>
            <span className="text-[10px] text-white/40 mt-1">上传</span>
          </button>
          
          <div className="w-px h-8 bg-white/10"></div>

          {/* View Mode Toggle */}
          <button 
            onClick={toggleViewMode}
            className="flex flex-col items-center group"
          >
             <div className={`p-3 rounded-full transition-all duration-300 border ${viewMode === 'gallery' ? 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/10 border-white/5 text-white/70 group-hover:bg-white/20'}`}>
                {viewMode === 'sphere' ? (
                  <GlobeAsiaAustraliaIcon className="w-6 h-6" />
                ) : (
                  <Square3Stack3DIcon className="w-6 h-6" />
                )}
             </div>
             <span className={`text-[10px] mt-1 transition-colors ${viewMode === 'gallery' ? 'text-indigo-300' : 'text-white/40'}`}>
               {viewMode === 'sphere' ? '宇宙' : '时空'}
             </span>
          </button>

          {/* Gravity Toggle (Only visible in Sphere Mode) */}
          {viewMode === 'sphere' && (
            <>
              <div className="w-px h-8 bg-white/10"></div>
              <button 
                onClick={toggleGravityMode}
                className="flex flex-col items-center group"
              >
                <div className={`p-3 rounded-full transition-all duration-300 border ${isGravityMode ? 'bg-indigo-500/30 border-indigo-400/50 text-indigo-200 shadow-[0_0_15px_rgba(99,102,241,0.3)]' : 'bg-white/10 border-white/5 text-white/70 group-hover:bg-white/20'}`}>
                    <ArrowsUpDownIcon className="w-6 h-6" />
                </div>
                <span className={`text-[10px] mt-1 transition-colors ${isGravityMode ? 'text-indigo-300' : 'text-white/40'}`}>
                  {isGravityMode ? '重力' : '悬浮'}
                </span>
              </button>
            </>
          )}

          <div className="w-px h-8 bg-white/10"></div>

          {/* Status Text */}
          <div className="flex flex-col items-start min-w-[80px]">
             <span className="text-xs text-white/80 font-medium flex items-center gap-1">
                Memory Space
             </span>
             <span className="text-[10px] text-white/40">{memories.length} 个记忆片段</span>
          </div>
          
          {/* Hidden Input */}
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple 
            accept="image/*"
            onChange={handleFileUpload}
          />

        </div>
      </div>

      {/* Decorative Overlay Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-40"></div>
    </div>
  );
};

export default App;