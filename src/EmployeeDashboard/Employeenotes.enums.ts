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
