import { NoteTypeEnum, PageModeEnum } from "../enums/notes.enums";

export type NoteType = "PERSONAL" | "PROJECT" | "ARCHIVED" | NoteTypeEnum;
export type PageMode = "list" | "create" | "edit" | "view" | PageModeEnum;
export type AutoSaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error";

export interface NoteStats {
  totalNotes: number;
  personalNotes: number;
  projectNotes: number;
  pinnedNotes: number;
  archivedNotes?: number;
  totalAttachments: number;
}

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
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface NoteDocumentItem {
  id?: number;
  key?: string;
  name: string;
  url?: string;
  file?: File;
  fileKey?: string;
  fileName?: string;
  size?: number;
}

export interface NotesFormData {
  title: string;
  description: string;
  type: NoteType;
  projectName: string;
  attachmentKeys: string[];
  attachments: NoteDocumentItem[];
  files: File[];
  isPinned?: boolean;
  isAutoSave?: boolean;
}

export interface ColorOption {
  label: string;
  color: string;
}

export interface PreviewImageModalState {
  open: boolean;
  url: string;
  title: string;
}

export interface ExcelViewerModalState {
  open: boolean;
  fileName: string;
  blob?: Blob | null;
  file?: File | null;
  onDownload?: () => void;
}

export interface SendNoteModalState {
  open: boolean;
  note: Note | null;
  selectedChildNoteIds: number[];
  includeDescription: boolean;
  includeFiles: boolean;
  selectedAttachmentKeys: string[];
  recipientEmail: string;
  subject: string;
  customMessage: string;
  sendOnlyChildNotes: boolean;
}

