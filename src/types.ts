// types.ts

export interface Category {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  completed?: boolean;
  tags: string[];
  isVoiceNote?: boolean;
  createdAt: Date;
  updatedAt: Date;
  [key: string]: any;
}

export interface VoiceNoteMetadata {
  duration: number;
  transcriptionStatus: 'pending' | 'completed' | 'failed';
}