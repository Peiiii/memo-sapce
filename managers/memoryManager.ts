import { v4 as uuidv4 } from 'uuid';
import { interpretMemory } from '../services/geminiService';
import { useCommonStore } from '../stores/commonStore';
import { Memory } from '../types';

// Raw data for initial state
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

export class MemoryManager {
  
  init = () => {
    const memories = RAW_MEMORY_DATA.map((data, index) => {
      const pos = this.getFibonacciPos(index, RAW_MEMORY_DATA.length);
      return {
        ...data,
        timestamp: Date.now() - index * 86400000 * 10,
        theta: pos.theta,
        phi: pos.phi,
        driftSpeed: 0.8 + Math.random() * 0.4,
        isAnalyzing: false,
      };
    });
    useCommonStore.getState().setMemories(memories);
  };

  handleFileUpload = async (files: FileList | null, currentRotation: { x: number; y: number }) => {
    if (!files || files.length === 0) return;

    const centerPos = this.getFrontAndCenterPos(currentRotation.x, currentRotation.y);
    const newMemories: Memory[] = [];
    const GOLDEN_ANGLE = 2.39996;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;

      const id = uuidv4();
      const objectUrl = URL.createObjectURL(file);
      
      const spreadMultiplier = 0.35;
      const radius = spreadMultiplier * Math.sqrt(i);
      const angle = i * GOLDEN_ANGLE;
      
      const dPhi = radius * Math.cos(angle);
      const dTheta = radius * Math.sin(angle);
      
      let phi = centerPos.phi + dPhi;
      phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi));
      
      const thetaScale = 1 / Math.sin(phi);
      const theta = centerPos.theta + dTheta * thetaScale;

      const memory: Memory = {
        id,
        url: objectUrl,
        description: "正在唤醒记忆...",
        timestamp: Date.now(), 
        theta: theta,
        phi: phi,
        scale: 0.9 + Math.random() * 0.3,
        rotation: Math.random() * 30 - 15,
        driftSpeed: 10 + Math.random() * 10,
        isAnalyzing: true,
      };

      newMemories.push(memory);

      this.fileToBase64(file).then(async (base64) => {
        const description = await interpretMemory(base64, file.type);
        useCommonStore.getState().setMemories(current => 
          current.map(m => m.id === id ? { ...m, description, isAnalyzing: false } : m)
        );
      });
    }

    useCommonStore.getState().setMemories(prev => [...prev, ...newMemories]);
    // Note: Focusing logic is now the responsibility of GalleryManager, handled via event listeners or direct updates if needed.
    // However, if we want to reset gallery focus on upload, we should do it here if MemoryManager knows about Gallery.
    // For strict decoupling, we might emit an event, but for this MVP, we will let Gallery observe changes or the user manually navigate.
  };

  getSortedMemories = (memories: Memory[]) => {
    return [...memories].sort((a, b) => b.timestamp - a.timestamp);
  }

  // --- Helpers ---

  private getFibonacciPos = (index: number, total: number) => {
    const phi = Math.acos(1 - 2 * (index + 0.5) / total);
    const theta = Math.PI * (1 + Math.sqrt(5)) * index;
    return { theta, phi };
  };

  private getFrontAndCenterPos = (rotXDeg: number, rotYDeg: number) => {
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

  private fileToBase64 = (file: File): Promise<string> => {
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
}
