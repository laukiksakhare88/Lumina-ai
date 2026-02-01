
export enum AppMode {
  STUDY = 'Study Mode',
  ELI12 = 'ELI12',
  EXPERT = 'Deep Expert',
  FOCUS = 'Focus Mode',
  EMOTIONAL = 'Emotional Support',
  QUICK = 'Quick Answer',
  GHOST = 'Ghost Mode'
}

export interface Attachment {
  data: string; // base64
  mimeType: string;
}

export interface GroundingChunk {
  web?: {
    uri: string;
    title: string;
  };
  maps?: {
    uri: string;
    title: string;
  };
}

export interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  attachment?: Attachment;
  groundingChunks?: GroundingChunk[];
}

export interface MemoryItem {
  id: string;
  fact: string;
  category: string;
}

export interface UserPreferences {
  name: string;
  goals: string[];
}
