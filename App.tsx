import React, { useState, useCallback, useRef, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AmbientBackground } from './components/AmbientBackground';
import { MemoryOrb } from './components/MemoryOrb';
import { Memory } from './types';
import { interpretMemory } from './services/geminiService';
import { PlusIcon, HandRaisedIcon } from '@heroicons/react/24/outline';
import { motion, useSpring, useMotionValue } from 'framer-motion';

// Helper: Random spherical coordinates
// Theta: 0 to 2*PI (around the equator)
// Phi: 0 to PI (pole to pole), but kept away from extreme poles to avoid bunching
const getRandomPos = () => ({
  theta: Math.random() * Math.PI * 2,
  phi: Math.acos((Math.random() * 1.6) - 0.8), // Slightly more equatorial distribution
});

const DEFAULT_MEMORIES: Memory[] = [
  {
    id: 'mem-forest',
    url: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=600&auto=format&fit=crop',
    description: "阳光穿透深林，斑驳了岁月。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 1,
    rotation: -5,
    driftSpeed: 1,
    isAnalyzing: false,
  },
  {
    id: 'mem-rain',
    url: 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?q=80&w=600&auto=format&fit=crop',
    description: "雨夜的霓虹，是城市流下的彩色眼泪。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 1.1,
    rotation: 8,
    driftSpeed: 0.8,
    isAnalyzing: false,
  },
  {
    id: 'mem-coffee',
    url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?q=80&w=600&auto=format&fit=crop',
    description: "一杯咖啡的温度，足以温暖整个冬天。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 0.9,
    rotation: -8,
    driftSpeed: 1.2,
    isAnalyzing: false,
  },
  {
    id: 'mem-sea',
    url: 'https://images.unsplash.com/photo-1505118380757-91f5f5632de0?q=80&w=600&auto=format&fit=crop',
    description: "听，海浪在诉说着远方的故事。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 1.2,
    rotation: 5,
    driftSpeed: 0.9,
    isAnalyzing: false,
  },
  {
    id: 'mem-stars',
    url: 'https://images.unsplash.com/photo-1519681393784-d8e5b5a45742?q=80&w=600&auto=format&fit=crop',
    description: "仰望星空，我们在浩瀚宇宙中并不孤单。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 1.05,
    rotation: 0,
    driftSpeed: 0.7,
    isAnalyzing: false,
  },
  {
    id: 'mem-book',
    url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=600&auto=format&fit=crop',
    description: "书页翻动的声音，是时光最轻的脚步。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 0.95,
    rotation: -12,
    driftSpeed: 1.1,
    isAnalyzing: false,
  },
  {
    id: 'mem-cat',
    url: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?q=80&w=600&auto=format&fit=crop',
    description: "午后阳光下的慵懒，是生活最温柔的馈赠。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 1.0,
    rotation: 15,
    driftSpeed: 1.3,
    isAnalyzing: false,
  },
  {
    id: 'mem-fireworks',
    url: 'https://images.unsplash.com/photo-1498931299472-f7a63a029047?q=80&w=600&auto=format&fit=crop',
    description: "烟花易冷，但那一瞬的绚烂已成永恒。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 1.15,
    rotation: -6,
    driftSpeed: 1.0,
    isAnalyzing: false,
  },
  {
    id: 'mem-snow',
    url: 'https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?q=80&w=600&auto=format&fit=crop',
    description: "雪落无声，世界在此刻变得纯白而安静。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 1.02,
    rotation: 4,
    driftSpeed: 0.85,
    isAnalyzing: false,
  },
  {
    id: 'mem-street',
    url: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=600&auto=format&fit=crop',
    description: "街角的光影，记录着匆匆过客的背影。",
    timestamp: Date.now(),
    ...getRandomPos(),
    scale: 0.98,
    rotation: -9,
    driftSpeed: 1.15,
    isAnalyzing: false,
  },
];

const App: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>(DEFAULT_MEMORIES);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 3D Sphere Interaction State
  const containerRef = useRef<HTMLDivElement>(null);
  const [sphereRadius, setSphereRadius] = useState(300);
  
  // Physics-based rotation
  const rotationX = useMotionValue(0);
  const rotationY = useMotionValue(0);
  
  // Smooth springs for inertia
  const springConfig = { damping: 20, stiffness: 100, mass: 1 };
  const smoothRotateX = useSpring(rotationX, springConfig);
  const smoothRotateY = useSpring(rotationY, springConfig);

  // Responsive Radius
  useEffect(() => {
    const handleResize = () => {
      // Radius is roughly 40% of the smaller screen dimension for better visibility
      const r = Math.min(window.innerWidth, window.innerHeight) * 0.4;
      setSphereRadius(Math.max(300, r)); // Minimum 300px
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

    const newMemories: Memory[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const id = uuidv4();
      const objectUrl = URL.createObjectURL(file);
      const pos = getRandomPos();

      const memory: Memory = {
        id,
        url: objectUrl,
        description: "正在唤醒记忆...",
        timestamp: Date.now(),
        theta: pos.theta,
        phi: pos.phi,
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
  };

  // Drag Interaction Logic
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only allow drag on background, not if clicking a specific interactive element
    // But since orbs are interactive, we might want to allow drag even if starting on an orb
    // unless it's a click. For now, simple logic:
    isDragging.current = true;
    lastMousePos.current = { x: e.clientX, y: e.clientY };
    if (containerRef.current) containerRef.current.style.cursor = 'grabbing';
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    
    // Calculate delta
    const deltaX = e.clientX - lastMousePos.current.x;
    const deltaY = e.clientY - lastMousePos.current.y;
    
    lastMousePos.current = { x: e.clientX, y: e.clientY };

    // Update rotation values (inverted X delta controls Y rotation, etc)
    // Sensitivity factor
    const sensitivity = 0.3;
    rotationY.set(rotationY.get() + deltaX * sensitivity);
    rotationX.set(rotationX.get() - deltaY * sensitivity);
  };

  const handlePointerUp = () => {
    isDragging.current = false;
    if (containerRef.current) containerRef.current.style.cursor = 'grab';
  };

  return (
    <div 
      className="relative w-full h-screen overflow-hidden text-slate-200 bg-[#0f172a] touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
      ref={containerRef}
      style={{ cursor: 'grab' }}
    >
      <AmbientBackground />

      {/* 3D Scene Container */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ perspective: '1200px' }} // Increased perspective for better depth
      >
        {/* The Rotatable World */}
        <motion.div 
          className="relative preserve-3d pointer-events-auto"
          style={{ 
            rotateX: smoothRotateX, 
            rotateY: smoothRotateY,
            transformStyle: 'preserve-3d', // Ensure this is explicitly set
            width: 0, 
            height: 0 
          }}
        >
          {memories.map((memory) => (
            <MemoryOrb 
              key={memory.id} 
              memory={memory} 
              radius={sphereRadius}
              worldRotationX={smoothRotateX}
              worldRotationY={smoothRotateY}
              onFocus={() => {}}
            />
          ))}
        </motion.div>
      </div>

      {/* Empty State Instructions */}
      {memories.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <h1 className="text-4xl md:text-6xl font-serif text-white/80 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-4 animate-pulse">
            记忆空间
          </h1>
          <p className="text-white/40 font-light tracking-wide text-lg max-w-md text-center">
            拖拽以旋转记忆球体<br/>
            上传你的照片，让它们在此刻凝结成诗
          </p>
        </div>
      )}

      {/* Control Bar */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 pointer-events-auto">
        <div 
          className="flex items-center gap-4 bg-slate-900/60 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            ref={fileInputRef}
            className="hidden" 
            multiple 
            accept="image/*"
            onChange={handleFileUpload}
          />
          
          <button className="flex flex-col items-center group">
            <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
              <PlusIcon className="w-6 h-6 text-white" />
            </div>
          </button>

          <div className="w-px h-8 bg-white/10 mx-2"></div>

          <div className="flex flex-col items-start min-w-[100px]">
             <span className="text-xs text-white/80 font-medium flex items-center gap-1">
                唤醒记忆
                <HandRaisedIcon className="w-3 h-3 text-white/50 animate-pulse" />
             </span>
             <span className="text-[10px] text-white/40">拖拽旋转 • {memories.length} 个片段</span>
          </div>
        </div>
      </div>

      {/* Decorative Overlay Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)] z-40"></div>
    </div>
  );
};

export default App;