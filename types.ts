export interface Memory {
  id: string;
  url: string;
  description: string;
  timestamp: number;
  // Position and animation characteristics
  x: number;
  y: number;
  scale: number;
  rotation: number;
  driftDuration: number;
  isAnalyzing: boolean;
}

export interface Coordinates {
  x: number;
  y: number;
}
