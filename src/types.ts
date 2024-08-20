export interface User {
  id: string;
  email: string;
  displayName: string;
  createdAt: Date;
  lastLoginAt: Date;
}

export interface Topic {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  isDefault: boolean;
  order: number;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  topicId: string;
  userId: string;
  completed?: boolean;
  tags: string[];
  isVoiceNote?: boolean;
  createdAt: Date;
  updatedAt: Date;
  media?: string[];
  pinned?: boolean;
  archived?: boolean;
  eventDate?: Date | string; // Changed to allow both Date and string
}

export interface VoiceNoteMetadata {
  duration: number;
  transcriptionStatus: 'pending' | 'completed' | 'failed';
}

export interface AIResponse {
  response: string;
}

export interface NoteEditorProps {
  notes: Note[];
  topics: Topic[];
  editingNote: Note | null;
  setEditingNote: React.Dispatch<React.SetStateAction<Note | null>>;
  selectedTopic: string;
  user: User;
}

export interface SidebarProps {
  topics: Topic[];
  notes: Note[];
  selectedTopic: string;
  setSelectedTopic: React.Dispatch<React.SetStateAction<string>>;
  selectedTag: string | null;
  setSelectedTag: React.Dispatch<React.SetStateAction<string | null>>;
  onVoiceRecordClick: () => void;
  onCalendarViewClick: () => void;
  user: User;
  onSignOut: () => void;
}

export interface AuthComponentProps {
  onLogin: (user: User) => void;
  onGoogleSignIn: () => Promise<void>;
}

export interface VoiceRecorderProps {
  topics: Topic[];
  onNoteCreated: (note: Note) => void;
  onClose: () => void;
  userId: string;
  autoStart: boolean;
}

export interface AIChatProps {
  content: string;
  onChange: (content: string) => void;
}

export interface LibraryLayoutProps {
  user: User;
  onSignOut: () => void;
}

export interface NoteViewProps {
  note: Note;
  onClose: () => void;
  onEdit: () => void;
  topic: Topic | undefined;
  user: User;
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  noteId?: string;
}

export interface CalendarViewProps {
  user: User;
  notes: Note[];
}