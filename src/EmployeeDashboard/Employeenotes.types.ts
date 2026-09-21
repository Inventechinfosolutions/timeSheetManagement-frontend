import React from "react";

export type NoteCategory = "Project Note" | "Personal Note";

export interface NoteFile {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
}

export interface ProjectRow {
  id: string;
  title: string;
  notes: string;
}

export interface EmployeeNote {
  id: string;
  employeeId?: string;
  projectName?: string;
  title: string;
  category: NoteCategory;
  folder?: string;
  content: string;
  rows?: ProjectRow[];
  files?: NoteFile[];
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt: string;
  parentNoteId?: string | null;
}

export interface RichTextEditorProps {
  initialValue: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
  onDownload?: () => void;
}

export type NoteModalMode = "create" | "edit" | "view";
export type NoteActionType = "view" | "edit" | "delete";

export interface NoteToastMessage {
  text: string;
  type: "success" | "error" | "info" | "delete" | "loading";
}

export interface NoteFormErrors {
  title?: string;
  projectName?: string;
  description?: string;
}

export interface RowModalErrors {
  projectName?: string;
  title?: string;
  description?: string;
}

export interface PresetColor {
  label: string;
  value: string;
}

export interface EmployeeNotesMobileProps {
  paginatedNotes: EmployeeNote[];
  allNotes: EmployeeNote[];
  currentPage: number;
  itemsPerPage: number;
  canManageNotes: boolean;
  expandedRowProjectNotes: string[];
  toggleRowProjectNotesExpand: (noteId: string) => void;
  openViewNote: (note: EmployeeNote) => void;
  openEditModal: (note: EmployeeNote) => void;
  setNoteToDelete: (note: EmployeeNote | null) => void;
  handleDeleteNote?: (note: EmployeeNote) => void;
  openSubTableCreateNote: (
    projectName: string,
    parentNoteId: string,
    category?: NoteCategory
  ) => void;
  uploadingNoteId: string | null;
  actionLoadingNoteId?: string | null;
  actionLoadingType?: NoteActionType | null;
  handleTableDirectUpload: (
    note: EmployeeNote,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  handleTableRemoveFile: (note: EmployeeNote, fileId: string) => void;
  openFilePreview: (file: NoteFile) => void;
  downloadFile: (file: NoteFile) => void;
  getAuthorDisplay: (author?: string | null) => string;
}
