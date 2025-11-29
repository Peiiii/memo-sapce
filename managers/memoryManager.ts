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
  {
    id: 'mem-mountain',
    url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=600&auto=format&fit=crop',
    description: "群山静默，守望着千年的秘密。",
    scale: 1.1,
    rotation: -3,
  },
  {
    id: 'mem-road',
    url: 'https://images.unsplash.com/photo-1470240731273-7821a6eeb6bd?q=80&w=600&auto=format&fit=crop',
    description: "路在脚下延伸，通向未知的远方。",
    scale: 0.95,
    rotation: 7,
  },
  {
    id: 'mem-desert',
    url: 'https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?q=80&w=600&auto=format&fit=crop',
    description: "风在沙丘上刻画时间的形状。",
    scale: 1.05,
    rotation: 2,
  },
  {
    id: 'mem-lake',
    url: 'https://images.unsplash.com/photo-1439853949127-fa647821eba0?q=80&w=600&auto=format&fit=crop',
    description: "湖面如镜，倒映着灵魂的深处。",
    scale: 1.0,
    rotation: -5,
  },
  {
    id: 'mem-autumn',
    url: 'https://images.unsplash.com/photo-1477414348463-c0eb7f1359b6?q=80&w=600&auto=format&fit=crop',
    description: "落叶纷飞，是季节最后的告别。",
    scale: 1.12,
    rotation: 9,
  },
  {
    id: 'mem-crowd',
    url: 'https://images.unsplash.com/photo-1533038590840-1cde6e668a91?q=80&w=600&auto=format&fit=crop',
    description: "人潮汹涌，每个人都是一座孤岛。",
    scale: 0.93,
    rotation: -12,
  },
  {
    id: 'mem-window',
    url: 'https://images.unsplash.com/photo-1508144753681-9986d4df99b3?q=80&w=600&auto=format&fit=crop',
    description: "窗外的世界，总是比梦境更真实。",
    scale: 1.08,
    rotation: 4,
  },
  {
    id: 'mem-camera',
    url: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop',
    description: "快门按下，此刻便成了永恒。",
    scale: 1.0,
    rotation: -7,
  },
  {
    id: 'mem-bridge',
    url: 'https://images.unsplash.com/photo-1506461883276-594a12b11cf3?q=80&w=600&auto=format&fit=crop',
    description: "连接彼岸的，不只是桥梁。",
    scale: 1.06,
    rotation: 6,
  },
  {
    id: 'mem-train',
    url: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?q=80&w=600&auto=format&fit=crop',
    description: "汽笛声响，带着思念去往远方。",
    scale: 0.98,
    rotation: 10,
  },
  {
    id: 'mem-beach-2',
    url: 'https://images.unsplash.com/photo-1496275068113-fff8c90750d1?q=80&w=600&auto=format&fit=crop',
    description: "脚印被海浪抹去，但大海记得一切。",
    scale: 1.03,
    rotation: -2,
  },
  {
    id: 'mem-bicycle',
    url: 'https://images.unsplash.com/photo-1485965120184-e220f721d03e?q=80&w=600&auto=format&fit=crop',
    description: "车轮转动，那是青春呼啸而过的声音。",
    scale: 0.96,
    rotation: 5,
  },
  {
    id: 'mem-piano',
    url: 'https://images.unsplash.com/photo-1520523839897-bd0b52f945a0?q=80&w=600&auto=format&fit=crop',
    description: "黑白键上，跳动着未曾说出口的话。",
    scale: 1.04,
    rotation: -6,
  },
  {
    id: 'mem-clock',
    url: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?q=80&w=600&auto=format&fit=crop',
    description: "指针不停，时间是唯一的旁观者。",
    scale: 1.1,
    rotation: -11,
  },
  {
    id: 'mem-vinyl',
    url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?q=80&w=600&auto=format&fit=crop',
    description: "唱针划过，旧时光缓缓流淌。",
    scale: 1.02,
    rotation: 3,
  },
  {
    id: 'mem-letter',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=600&auto=format&fit=crop',
    description: "纸短情长，字迹里藏着温度。",
    scale: 0.97,
    rotation: -4,
  },
  {
    id: 'mem-clouds',
    url: 'https://images.unsplash.com/photo-1501630834273-4b5604d2ee31?q=80&w=600&auto=format&fit=crop',
    description: "云卷云舒，是天空最温柔的心事。",
    scale: 1.13,
    rotation: -8,
  },
  {
    id: 'mem-guitar',
    url: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?q=80&w=600&auto=format&fit=crop',
    description: "琴弦震动，诉说着无言的心事。",
    scale: 0.95,
    rotation: -5,
  },
  {
    id: 'mem-camp',
    url: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?q=80&w=600&auto=format&fit=crop',
    description: "篝火跳动，温暖了寒冷的夜。",
    scale: 1.05,
    rotation: 6,
  },
  {
    id: 'mem-aurora',
    url: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?q=80&w=600&auto=format&fit=crop',
    description: "极光漫舞，那是天空的梦境。",
    scale: 1.15,
    rotation: -7,
  },
  {
    id: 'mem-sakura',
    url: 'https://images.unsplash.com/photo-1522383225653-ed111181a951?q=80&w=600&auto=format&fit=crop',
    description: "樱花飘落，秒速五厘米的思念。",
    scale: 1.08,
    rotation: -6,
  },
];

export class MemoryManager {
  
  init = () => {
    const memories = RAW_MEMORY_DATA.map((data, index) => {
      const pos = this.getFibonacciPos(index, RAW_MEMORY_DATA.length);
      return {
        ...data,
        timestamp: Date.now() - index * 86400000 * 2, // Spaced out over time
        theta: pos.theta,
        phi: pos.phi,
        driftSpeed: 0.8 + Math.random() * 0.4,
        isAnalyzing: false,
      };
    });
    useCommonStore.getState().setMemories(memories);
  };

  handleFileUpload = async (files: FileList | null, center: { theta: number; phi: number }) => {
    if (!files || files.length === 0) return;

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
      
      let phi = center.phi + dPhi;
      phi = Math.max(0.15, Math.min(Math.PI - 0.15, phi));
      
      const thetaScale = 1 / Math.sin(phi);
      const theta = center.theta + dTheta * thetaScale;

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