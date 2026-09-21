import { NoteCategoryEnum, NoteType } from "./Employeenotes.enums";

export type NoteCategory = NoteCategoryEnum;
export { NoteCategoryEnum, NoteType };

/**
 * Represents a file attachment on a note.
 * Persist only the object_store UUID (`id` / `s3Key`). Name and type come from MinIO.
 */
export interface NoteFile {
  /** UUID from the `object_store` table (= s3Key). Used to download/delete via API. */
  id: string;
  /** Original filename shown in the UI (e.g. "report.pdf") */
  name: string;
  /** File size in bytes */
  size: number;
  /** MIME type (e.g. "application/pdf") */
  type: string;
  /** MinIO object key — stored in DB. Fetch file via GET /employee-notes/entityId/:id/refId/:id/download-file?key=... */
  s3Key?: string;
  /** Transient only: in-browser base64 DataURL or blob URL for preview. Not persisted. */
  dataUrl?: string;
  /** Transient only: browser File object for uploading to MinIO on save */
  rawFile?: File;
  /** Transient flag indicating direct upload in progress */
  uploading?: boolean;
  /** Associated note ID */
  noteId?: number | string;
}

export interface EmployeeNote {
  /** Integer primary key from DB (AUTO_INCREMENT) */
  id: number | string;
  employeeId?: string;
  projectName?: string;
  title: string;
  category: NoteCategory;
  /** PARENT = top-level note; CHILD = sub-table note under parentNoteId */
  type?: NoteType;
  content: string;
  /** Hydrated from object_store + MinIO. POST/PUT send UUID ids only. */
  files?: NoteFile[];
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt?: string;
  updatedAt: string;
  /** Parent note ID (integer) for CHILD notes; NULL for PARENT notes */
  parentNoteId?: number | string | null;
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

export const EMPLOYEE_NOTES_API = "/api/employee-notes";

export const DEFAULT_ITEMS_PER_PAGE = 5;

export const FILE_SIZE_LIMIT = 5 * 1024 * 1024; // 5 MB

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
] as const;

export const ALLOWED_FILE_ACCEPT = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  "image/gif",
].join(",");

export const isAllowedNoteFile = (fileName: string): boolean => {
  const name = (fileName || "").toLowerCase();
  return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
};

export const PRESET_COLORS: PresetColor[] = [
  { label: "Yellow", value: "#FEF08A" },
  { label: "Orange", value: "#FED7AA" },
  { label: "Red", value: "#FCA5A5" },
  { label: "Green", value: "#BBF7D0" },
  { label: "Blue", value: "#BAE6FD" },
  { label: "Nylon", value: "#D9F99D" },
  { label: "Sky Blue", value: "#7DD3FC" },
  { label: "Purple", value: "#E9D5FF" },
  { label: "Pink", value: "#FBCFE8" },
  { label: "Teal", value: "#99F6E4" },
  { label: "Amber", value: "#FDE68A" },
  { label: "Gray", value: "#E2E8F0" },
];

export interface EmployeeNotesMobileProps {
  paginatedNotes: EmployeeNote[];
  allNotes: EmployeeNote[];
  currentPage: number;
  itemsPerPage: number;
  canManageNotes: boolean;
  expandedRowProjectNotes: (string | number)[];
  toggleRowProjectNotesExpand: (noteId: string | number) => void;
  openViewNote: (note: EmployeeNote) => void;
  openEditModal: (note: EmployeeNote) => void;
  setNoteToDelete: (note: EmployeeNote | null) => void;
  handleDeleteNote?: (note: EmployeeNote) => void;
  openSubTableCreateNote: (
    projectName: string,
    parentNoteId: string | number,
    category?: NoteCategory
  ) => void;
  uploadingNoteId: string | number | null;
  actionLoadingNoteId?: string | number | null;
  actionLoadingType?: NoteActionType | null;
  handleTableDirectUpload: (
    note: EmployeeNote,
    e: React.ChangeEvent<HTMLInputElement>
  ) => void;
  handleTableRemoveFile: (note: EmployeeNote, fileId: string) => void;
  openFilePreview: (file: NoteFile, noteId?: number | string) => void;
  downloadFile: (file: NoteFile, noteId?: number | string) => void;
  getAuthorDisplay: (author?: string | null) => string;
}
