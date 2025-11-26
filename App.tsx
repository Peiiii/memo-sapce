import React, { useState, useCallback, useRef } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { AmbientBackground } from './components/AmbientBackground';
import { MemoryOrb } from './components/MemoryOrb';
import { Memory } from './types';
import { interpretMemory } from './services/geminiService';
import { PlusIcon, PhotoIcon, MusicalNoteIcon } from '@heroicons/react/24/outline';

const App: React.FC = () => {
  const [memories, setMemories] = useState<Memory[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper to convert file to base64
  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        if (typeof reader.result === 'string') {
          // Remove the Data URL prefix to get raw base64 for Gemini
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

      // Random position generation (keep within 10% - 90% of screen to avoid edge clipping)
      const randomX = Math.random() * 80 + 10; 
      const randomY = Math.random() * 80 + 10;
      const randomScale = 0.8 + Math.random() * 0.4;
      const randomRotation = Math.random() * 30 - 15;

      const memory: Memory = {
        id,
        url: objectUrl,
        description: "正在唤醒记忆...",
        timestamp: Date.now(),
        x: randomX,
        y: randomY,
        scale: randomScale,
        rotation: randomRotation,
        driftDuration: 15 + Math.random() * 10,
        isAnalyzing: true,
      };

      newMemories.push(memory);

      // Process asynchronously
      fileToBase64(file).then(async (base64) => {
        const description = await interpretMemory(base64, file.type);
        setMemories(current => 
          current.map(m => m.id === id ? { ...m, description, isAnalyzing: false } : m)
        );
      });
    }

    setMemories(prev => [...prev, ...newMemories]);
    
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFocus = useCallback((memory: Memory) => {
    // We could do something global here when a memory is focused
    // For now, the orb handles its own focus state
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden text-slate-200">
      <AmbientBackground />

      {/* Main Content Layer */}
      <div className="relative z-10 w-full h-full">
        
        {/* Floating Memories */}
        {memories.map((memory, index) => (
          <MemoryOrb 
            key={memory.id} 
            memory={memory} 
            onFocus={handleFocus}
            zIndex={index + 10}
          />
        ))}

        {/* Empty State / Instructional Text */}
        {memories.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <h1 className="text-4xl md:text-6xl font-serif text-white/80 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-4 animate-pulse">
              记忆空间
            </h1>
            <p className="text-white/40 font-light tracking-wide text-lg max-w-md text-center">
              上传你的照片，让它们在此刻凝结成诗。
            </p>
          </div>
        )}

        {/* Control Bar - Sticky Bottom */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50">
          <div 
            className="flex items-center gap-4 bg-white/10 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-[0_0_30px_rgba(0,0,0,0.5)] transition-transform hover:scale-105"
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
            
            <button className="flex flex-col items-center group cursor-pointer">
              <div className="bg-white/20 p-3 rounded-full group-hover:bg-white/30 transition-colors">
                <PlusIcon className="w-6 h-6 text-white" />
              </div>
              <span className="text-[10px] uppercase tracking-widest text-white/60 mt-1">添加记忆</span>
            </button>

            <div className="w-px h-8 bg-white/10 mx-2"></div>

            <div className="flex flex-col items-start">
               <span className="text-xs text-white/80 font-medium">Memory Space</span>
               <span className="text-[10px] text-white/40">Total: {memories.length} fragments</span>
            </div>
          </div>
        </div>

      </div>

      {/* Decorative Overlay Vignette */}
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-40"></div>
    </div>
  );
};

export default App;
