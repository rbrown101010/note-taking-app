// types.ts

export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  parentId: string | null;
  userId: string; // Add this line to associate categories with users
}

export interface Note {
  id: string;
  title: string;
  content: string;
  categoryId: string;
  userId: string; // Add this line to associate notes with users
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

// You might want to add interfaces for AI responses if you're using them in your TypeScript code
export interface AIResponse {
  response: string;
}

// If you're using any specific props types for your components, you can define them here as well
export interface NoteEditorProps {
  notes: Note[];
  categories: Category[];
  editingNote: Note | null;
  setEditingNote: React.Dispatch<React.SetStateAction<Note | null>>;
  selectedCategory: string;
  user: User;
}

export interface SidebarProps {
  categories: Category[];
  notes: Note[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  selectedTag: string | null;
  setSelectedTag: React.Dispatch<React.SetStateAction<string | null>>;
  user: User;
}

export interface AuthComponentProps {
  onLogin: (user: User) => void;
}

export interface VoiceRecorderProps {
  categories: Category[];
  onNoteCreated: (note: Note) => void;
  onClose: () => void;
  user: User;
}

export interface AIChatProps {
  content: string;
  onChange: (content: string) => void;
}