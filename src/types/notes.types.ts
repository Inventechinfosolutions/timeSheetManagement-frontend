export type NoteType = "PERSONAL" | "PROJECT" | "ARCHIVED";

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
  isAutoSave?: boolean;
  isVertical?: boolean;
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
  isAutoSave?: boolean;
  isVertical?: boolean;
  subNotes?: Array<{
    title: string;
    description?: string;
  }>;
  files?: File[];
  attachmentKeys?: string[];
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
  isAutoSave?: boolean;
  autoSave?: boolean;
  isVertical?: boolean;
  orderIndex?: number;
  parentId?: number | null;
}

export interface CreateSubNotePayload {
  parentId: number;
  title: string;
  description?: string;
  color?: string;
  orderIndex?: number;
  files?: File[];
  attachmentKeys?: string[];
}

export interface ReorderNotesPayload {
  items: Array<{
    id: number;
    orderIndex: number;
    parentId?: number | null;
  }>;
}

export interface MoveNotePayload {
  id: number;
  targetParentId?: number | null;
  orderIndex?: number;
}

export interface BulkMoveNotesPayload {
  noteIds: number[];
  targetParentId?: number | null;
}

export interface QueryNotesParams {
  type?: NoteType;
  projectName?: string;
  search?: string;
  isPinned?: boolean;
  isArchived?: boolean;
  isAutoSave?: boolean;
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
