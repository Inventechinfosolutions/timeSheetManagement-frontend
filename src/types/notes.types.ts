export type NoteType = 'PERSONAL' | 'PROJECT';

export interface NoteAttachment {
  name: string;
  key: string;
  id?: number;
  fileName?: string;
  fileKey?: string;
  fileSize?: number;
  mimeType?: string;
  entityType?: string;
  entityId?: number;
  refType?: string;
  refId?: number;
  createdAt?: string | Date;
}

export interface Note {
  id: number;
  title: string;
  description: string;
  type: NoteType;
  projectName?: string | null;
  parentId?: number | null;
  parent?: Note | null;
  subNotes?: Note[];
  attachments?: NoteAttachment[];
  userId?: string | null;
  employeeId?: string | null;
  color?: string;
  isPinned: boolean;
  isArchived: boolean;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CreateNotePayload {
  title: string;
  description?: string;
  type?: NoteType;
  projectName?: string;
  parentId?: number;
  color?: string;
  isPinned?: boolean;
  subNotes?: Array<{
    title: string;
    description?: string;
  }>;
  files?: File[];
}

export interface UpdateNotePayload {
  id: number;
  title?: string;
  description?: string;
  type?: NoteType;
  projectName?: string;
  color?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  orderIndex?: number;
}

export interface CreateSubNotePayload {
  parentId: number;
  title: string;
  description?: string;
  color?: string;
  orderIndex?: number;
  files?: File[];
}

export interface QueryNotesParams {
  type?: NoteType;
  projectName?: string;
  search?: string;
  isPinned?: boolean;
  isArchived?: boolean;
}

export interface NoteStats {
  totalNotes: number;
  personalNotes: number;
  projectNotes: number;
  pinnedNotes: number;
  totalAttachments: number;
}

export interface NotesState {
  notes: Note[];
  totalNotesCount: number;
  selectedNote: Note | null;
  activeTab: NoteType;
  selectedProject: string;
  searchQuery: string;
  projects: string[];
  stats: NoteStats;
  loading: boolean;
  actionLoading: boolean;
  error: string | null;
}
