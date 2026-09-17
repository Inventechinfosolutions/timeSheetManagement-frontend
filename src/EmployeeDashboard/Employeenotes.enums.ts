import { PresetColor } from "./Employeenotes.types";

export enum NoteCategoryEnum {
  PROJECT_NOTE = "Project Note",
  PERSONAL_NOTE = "Personal Note",
}

export enum NoteFilter {
  ALL = "All",
  PROJECT = "Project",
  PERSONAL = "Personal",
}

export const STORAGE_KEY_PREFIX = "worksphere-employee-notes";

export const EMPLOYEE_NOTES_API = "/api/employee-notes";

export const DEFAULT_ITEMS_PER_PAGE = 5;

export const FILE_SIZE_LIMIT = 20 * 1024 * 1024; // 20 MB

export const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".doc",
  ".docx",
  ".xls",
  ".xlsx",
  ".csv",
  ".txt",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
] as const;

export const PRESET_COLORS: PresetColor[] = [
  { label: "Black", value: "#000000" },
  { label: "Dark Slate", value: "#1E293B" },
  { label: "Gray", value: "#64748B" },
  { label: "Blue", value: "#4318FF" },
  { label: "Sky Blue", value: "#0284C7" },
  { label: "Indigo", value: "#4F46E5" },
  { label: "Purple", value: "#9333EA" },
  { label: "Pink", value: "#DB2777" },
  { label: "Red", value: "#DC2626" },
  { label: "Orange", value: "#EA580C" },
  { label: "Amber", value: "#D97706" },
  { label: "Emerald Green", value: "#059669" },
];
