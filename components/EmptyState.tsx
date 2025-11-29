import React from 'react';

export const EmptyState: React.FC = () => {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
      <h1 className="text-4xl md:text-6xl font-serif text-white/80 tracking-widest drop-shadow-[0_0_15px_rgba(255,255,255,0.3)] mb-4 animate-pulse">
        记忆空间
      </h1>
      <p className="text-white/40 font-light tracking-wide text-lg max-w-md text-center">
        拖拽以旋转空间，或拨动单个记忆星球<br/>
        上传你的照片，让它们在此刻凝结成诗
      </p>
    </div>
  );
};
