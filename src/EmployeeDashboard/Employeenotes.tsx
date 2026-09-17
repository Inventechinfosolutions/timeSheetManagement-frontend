import { useEffect, useMemo, useState, useRef, Fragment } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Plus,
  Trash2,
  Search,
  FileText,
  Pencil,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Check,
  Loader2,
  AlertCircle,
  Paperclip,
  UploadCloud,
  File,
  Download,
  Eye,
  Minus,
  Copy,
  Maximize2,
  Minimize2,
  WrapText,
  Calendar,
  User,
  Clock,
  Table as TableIcon,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  List,
  ListOrdered,
  Quote,
  ArrowLeft,
  Palette,
} from "lucide-react";
import { useAppSelector } from "../hooks";
import { Storage } from "../utils/storage-util";
import { EmployeeNotesMobile } from "./Employeenotesmobile";
import type {
  NoteCategory,
  NoteFile,
  ProjectRow,
  EmployeeNote,
  RichTextEditorProps,
  NoteModalMode,
  NoteToastMessage,
  NoteFormErrors,
  RowModalErrors,
} from "./Employeenotes.types";
import {
  NoteCategoryEnum,
  NoteFilter,
  STORAGE_KEY_PREFIX,
  EMPLOYEE_NOTES_API,
  DEFAULT_ITEMS_PER_PAGE,
  PRESET_COLORS,
} from "./Employeenotes.enums";
import "./Employeenotes.css";

// Re-export types and enums for backward compatibility across the codebase
export type {
  NoteCategory,
  NoteFile,
  ProjectRow,
  EmployeeNote,
  RichTextEditorProps,
  NoteModalMode,
  NoteToastMessage,
  NoteFormErrors,
  RowModalErrors,
};
export { NoteCategoryEnum, NoteFilter, STORAGE_KEY_PREFIX, EMPLOYEE_NOTES_API };

/*
 * RICH TEXT / HTML EDITOR COMPONENT
 * Provides rich text formatting (Bold, Italic, Underline, Strikethrough,
 * Headings, Lists, Quotes, Code, Highlight, Clear, Undo/Redo) with full-width
 * spacious typing area.
 */
const RichTextEditor = ({
  initialValue,
  onChange,
  placeholder,
}: RichTextEditorProps) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [currentColor, setCurrentColor] = useState("#4318FF");
  const colorPickerRef = useRef<HTMLDivElement>(null);
  const savedSelectionRef = useRef<Range | null>(null);

  // Sync initial content once or on note switch
  useEffect(() => {
    if (editorRef.current) {
      if (editorRef.current.innerHTML !== (initialValue || "")) {
        editorRef.current.innerHTML = initialValue || "";
      }
    }
  }, [initialValue]);

  // Close color picker on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target as Node)
      ) {
        setIsColorPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      savedSelectionRef.current = sel.getRangeAt(0);
    }
  };

  const restoreSelection = () => {
    if (savedSelectionRef.current) {
      const sel = window.getSelection();
      if (sel) {
        sel.removeAllRanges();
        sel.addRange(savedSelectionRef.current);
      }
    }
  };

  const execute = (command: string, arg?: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(command, false, arg);
    onChange(editorRef.current.innerHTML);
  };

  const applyColor = (colorHex: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand("foreColor", false, colorHex);
    setCurrentColor(colorHex);
    onChange(editorRef.current.innerHTML);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  return (
    <div
      style={{ resize: "vertical", minHeight: "220px" }}
      className={`rounded-2xl border transition-all overflow-hidden bg-white resize-y flex flex-col ${isFocused
          ? "border-[#4318FF] ring-2 ring-[#4318FF]/15 shadow-sm"
          : "border-gray-200"
        }`}
    >
      {/* Rich Text Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 p-1.5 px-2 bg-gray-50/90 border-b border-gray-200 text-slate-700 select-none">
        {/* Bold */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("bold");
          }}
          className="p-1 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors font-bold text-xs w-7 h-7 flex items-center justify-center cursor-pointer"
          title="Bold (Ctrl+B)"
        >
          <Bold size={14} />
        </button>

        {/* Italic */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("italic");
          }}
          className="p-1 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors italic text-xs w-7 h-7 flex items-center justify-center cursor-pointer"
          title="Italic (Ctrl+I)"
        >
          <Italic size={14} />
        </button>

        {/* Underline */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("underline");
          }}
          className="p-1 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors underline text-xs w-7 h-7 flex items-center justify-center cursor-pointer"
          title="Underline (Ctrl+U)"
        >
          <Underline size={14} />
        </button>

        {/* Strikethrough */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("strikeThrough");
          }}
          className="p-1 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors line-through text-xs w-7 h-7 flex items-center justify-center cursor-pointer"
          title="Strikethrough"
        >
          <Strikethrough size={14} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Heading 1 */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("formatBlock", "<h1>");
          }}
          className="px-1.5 py-0.5 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer"
          title="Heading 1"
        >
          <Heading1 size={14} />
        </button>

        {/* Heading 2 */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("formatBlock", "<h2>");
          }}
          className="px-1.5 py-0.5 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors font-bold text-[11px] h-7 flex items-center justify-center cursor-pointer"
          title="Heading 2"
        >
          <Heading2 size={14} />
        </button>

        {/* Paragraph */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("formatBlock", "<p>");
          }}
          className="px-1.5 py-0.5 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors text-[11px] font-semibold h-7 flex items-center justify-center cursor-pointer text-slate-600"
          title="Normal Text"
        >
          Normal
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Bullet List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("insertUnorderedList");
          }}
          className="p-1 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors text-xs w-7 h-7 flex items-center justify-center cursor-pointer"
          title="Bullet List"
        >
          <List size={14} />
        </button>

        {/* Numbered List */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("insertOrderedList");
          }}
          className="p-1 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors text-xs w-7 h-7 flex items-center justify-center cursor-pointer"
          title="Numbered List"
        >
          <ListOrdered size={14} />
        </button>

        {/* Blockquote */}
        <button
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            execute("formatBlock", "<blockquote>");
          }}
          className="p-1 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors text-xs w-7 h-7 flex items-center justify-center cursor-pointer"
          title="Quote"
        >
          <Quote size={14} />
        </button>

        <div className="w-px h-4 bg-gray-200 mx-1" />

        {/* Text Color Picker */}
        <div className="relative" ref={colorPickerRef}>
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              saveSelection();
              setIsColorPickerOpen((prev) => !prev);
            }}
            className="p-1 rounded-lg hover:bg-white hover:text-[#4318FF] hover:shadow-2xs transition-colors text-xs w-7 h-7 flex flex-col items-center justify-center cursor-pointer relative"
            title="Text Color"
          >
            <Palette size={13} />
            <span
              className="w-3.5 h-[2.5px] rounded-full mt-[1px]"
              style={{ backgroundColor: currentColor }}
            />
          </button>

          {isColorPickerOpen && (
            <div
              className="absolute left-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg p-2.5 w-48 space-y-2 animate-fadeIn"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Text Color
                </span>
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyColor("#1B2559");
                    setIsColorPickerOpen(false);
                  }}
                  className="text-[10px] font-semibold text-slate-400 hover:text-slate-700 cursor-pointer"
                >
                  Reset
                </button>
              </div>

              {/* Preset Swatches */}
              <div className="grid grid-cols-6 gap-1.5">
                {PRESET_COLORS.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    title={c.label}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      applyColor(c.value);
                      setIsColorPickerOpen(false);
                    }}
                    style={{ backgroundColor: c.value }}
                    className={`w-6 h-6 rounded-md transition-transform hover:scale-110 cursor-pointer border ${
                      currentColor === c.value
                        ? "ring-2 ring-[#4318FF] ring-offset-1 border-transparent"
                        : "border-gray-200/80"
                    }`}
                  />
                ))}
              </div>

              {/* Custom Color Input */}
              <div className="pt-1.5 border-t border-gray-100 flex items-center gap-2">
                <label className="text-[11px] font-semibold text-slate-600 flex-1 cursor-pointer">
                  Custom:
                </label>
                <input
                  type="color"
                  value={currentColor}
                  onChange={(e) => {
                    applyColor(e.target.value);
                  }}
                  className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-transparent"
                  title="Pick custom color"
                />
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Editable Content Area - Substantially larger and clear for long notes */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => {
          setIsFocused(false);
          handleInput();
        }}
        data-placeholder={
          placeholder ||
          "Write your notes, key updates, documentation, or action items here..."
        }
        className="notes-rich-editor-content custom-scrollbar"
      />
    </div>
  );
};

const ENABLE_REMOTE_API = true;

const formatDateTime = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  const datePart = d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
  const timePart = d.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
};

const formatDateOnly = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const formatFileSize = (bytes: number) => {
  if (!bytes) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

// Capitalizes just the first character of a display name (e.g. "kusuma" -> "Kusuma")
// without affecting the rest of the string's casing.
const capitalizeFirst = (str?: string) => {
  if (!str) return str || "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

// File extensions we know are plain text / source code, so we can decode and
// show their actual contents in the preview modal instead of a generic
// "can't preview this file" placeholder.
const TEXT_PREVIEW_EXTENSIONS = [
  "txt", "md", "markdown", "csv", "tsv", "json", "js", "jsx", "ts", "tsx",
  "css", "scss", "less", "html", "htm", "xml", "yml", "yaml", "py", "java",
  "c", "cpp", "h", "hpp", "cs", "sh", "bash", "sql", "log", "env", "ini",
  "conf", "gitignore", "toml",
];

const MAX_TEXT_PREVIEW_CHARS = 500000;

const isTextPreviewable = (file: NoteFile) => {
  const ext = file.name.split(".").pop()?.toLowerCase() || "";
  if (TEXT_PREVIEW_EXTENSIONS.includes(ext)) return true;
  if (file.type?.startsWith("text/")) return true;
  if (file.type === "application/json") return true;
  return false;
};

const isCsvFile = (fileName?: string) => {
  return (fileName || "").toLowerCase().endsWith(".csv");
};

const parseCsvRows = (text: string): string[][] => {
  const lines = text.split(/\r\n|\r|\n/).filter((l) => l.trim().length > 0);
  return lines.map((line) => {
    const row: string[] = [];
    let curr = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        row.push(curr.trim());
        curr = "";
      } else {
        curr += ch;
      }
    }
    row.push(curr.trim());
    return row;
  });
};

// Decodes a base64 data: URL (e.g. "data:text/plain;base64,...") into a
// readable UTF-8 string. Returns null if it can't be decoded.
const decodeDataUrlText = (dataUrl: string): string | null => {
  try {
    const commaIdx = dataUrl.indexOf(",");
    if (commaIdx === -1) {
      return dataUrl;
    }
    const meta = dataUrl.slice(0, commaIdx);
    const payload = dataUrl.slice(commaIdx + 1);

    if (!/;base64/i.test(meta)) {
      return decodeURIComponent(payload);
    }

    const cleanPayload = payload.replace(/\s+/g, "");
    const binary = atob(cleanPayload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return null;
  }
};

const stripHtmlTags = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};

const htmlToPlainText = (html?: string) => {
  if (!html) return "";
  try {
    const temp = document.createElement("div");
    temp.innerHTML = html;
    return (temp.innerText || temp.textContent || "").trim();
  } catch {
    return stripHtmlTags(html);
  }
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return <FileText className="text-purple-500 shrink-0" size={14} />;
  }
  if (ext === "pdf") {
    return <FileText className="text-red-500 shrink-0" size={14} />;
  }
  if (["doc", "docx"].includes(ext)) {
    return <FileText className="text-blue-500 shrink-0" size={14} />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileText className="text-emerald-500 shrink-0" size={14} />;
  }
  return <File className="text-gray-500 shrink-0" size={14} />;
};

const getAuthHeaders = () => {
  const token =
    Storage.local.get("TimeSheet-authenticationToken") ||
    Storage.session.get("TimeSheet-authenticationToken") ||
    localStorage.getItem("TimeSheet-authenticationToken") ||
    sessionStorage.getItem("TimeSheet-authenticationToken");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// Optional Manager/Admin access: checks common role/authority shapes so
// managers or admins can manage notes for employees other than themselves.
// Adjust the field names below if your auth payload uses different keys.
const MANAGER_ROLE_KEYWORDS = ["ADMIN", "MANAGER", "HR"];
const hasManagerAccess = (user: any): boolean => {
  if (!user) return false;
  const roleCandidates: string[] = [];

  if (typeof user.role === "string") roleCandidates.push(user.role);
  if (Array.isArray(user.roles)) roleCandidates.push(...user.roles);
  if (Array.isArray(user.authorities)) {
    roleCandidates.push(
      ...user.authorities.map((a: any) => (typeof a === "string" ? a : a?.authority || ""))
    );
  }
  if (typeof user.isAdmin === "boolean" && user.isAdmin) return true;
  if (typeof user.isManager === "boolean" && user.isManager) return true;

  return roleCandidates.some((r) =>
    MANAGER_ROLE_KEYWORDS.some((keyword) => (r || "").toUpperCase().includes(keyword))
  );
};

const EmployeeNotes = () => {
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const { currentUser } = useAppSelector((state) => state.user);
  const navigate = useNavigate();
  const location = useLocation();

  const employeeId = entity?.employeeId || currentUser?.loginId || "";
  const authorName =
    currentUser?.aliasLoginName ||
    entity?.fullName ||
    (entity?.firstName
      ? `${entity.firstName} ${entity.lastName || ""}`.trim()
      : "") ||
    "kusuma";

  const currentCreator =
    authorName ||
    currentUser?.loginId ||
    employeeId ||
    "Employee";

  const getAuthorDisplay = (createdBy?: string) => {
    if (!createdBy) return authorName;
    const trimmed = createdBy.trim();
    // If it's a numeric ID (like "345") or matches the login ID / employee ID, resolve to employee's name (e.g. "kusuma")
    if (
      /^\d+$/.test(trimmed) ||
      trimmed === employeeId ||
      trimmed === currentUser?.loginId
    ) {
      return authorName;
    }
    return trimmed;
  };
  const storageKey = `${STORAGE_KEY_PREFIX}:${employeeId || "guest"}`;
  const draftKey = `${storageKey}:draft`;

  // Employee can view/edit their own notes only, unless the signed-in user
  // has manager/admin access, in which case they may manage any employee's notes.
  const isManagerOrAdmin = hasManagerAccess(currentUser);
  const viewerId = currentUser?.loginId || currentUser?.employeeId || "";
  const isOwnRecord = !entity?.employeeId || !viewerId || entity.employeeId === viewerId;
  const canManageNotes = isOwnRecord || isManagerOrAdmin;

  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<string>("Project");

  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const [uploadingNoteId, setUploadingNoteId] = useState<string | null>(null);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = DEFAULT_ITEMS_PER_PAGE;

  // Editor State for Create / Edit / View (Full Page View)
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [modalMode, setModalMode] = useState<NoteModalMode>("create");
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [activeNote, setActiveNote] = useState<EmployeeNote | null>(null);

  // Form Fields
  const [formProjectName, setFormProjectName] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formCategory, setFormCategory] =
    useState<NoteCategory>("Project Note");
  const [formDescription, setFormDescription] = useState("");
  const [formFiles, setFormFiles] = useState<NoteFile[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formRows, setFormRows] = useState<ProjectRow[]>([]);

  // Required field validation
  const [formErrors, setFormErrors] = useState<NoteFormErrors>({});

  // Save / Auto Save: last time the in-progress draft was persisted locally
  const [draftSavedAt, setDraftSavedAt] = useState<string | null>(null);



  // Preview file modal state
  const [previewFile, setPreviewFile] = useState<NoteFile | null>(null);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isWordWrap, setIsWordWrap] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [previewTab, setPreviewTab] = useState<"content" | "table">("content");

  const openFilePreview = (file: NoteFile) => {
    setIsMaximized(false);
    setIsWordWrap(false);
    setIsCopied(false);
    setPreviewTab("content");
    setPreviewFile(file);
  };

  const handleCopyText = (text: string | null) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    window.setTimeout(() => setIsCopied(false), 2000);
  };

  // Decoded text content for the file currently open in the preview modal,
  // only computed for text/code file types (see isTextPreviewable).
  const previewText = useMemo(() => {
    if (!previewFile?.dataUrl) return null;
    if (!isTextPreviewable(previewFile)) return null;
    return decodeDataUrlText(previewFile.dataUrl);
  }, [previewFile]);

  const textLines = useMemo(() => {
    if (previewText === null) return [];
    return previewText.split(/\r\n|\r|\n/);
  }, [previewText]);

  const csvRows = useMemo(() => {
    if (!previewText || !previewFile || !isCsvFile(previewFile.name)) return null;
    return parseCsvRows(previewText);
  }, [previewText, previewFile]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete Confirmation Modal
  const [noteToDelete, setNoteToDelete] = useState<EmployeeNote | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Expandable sub-table state for Project Notes (+ / - button in Project Name column)
  const [expandedRowProjectNotes, setExpandedRowProjectNotes] = useState<string[]>([]);
  const toggleRowProjectNotesExpand = (noteId: string) => {
    setExpandedRowProjectNotes((prev) =>
      prev.includes(noteId) ? prev.filter((id) => id !== noteId) : [...prev, noteId]
    );
  };

  // When the full-page editor is opened from a sub-table row, remember the parent note ID
  const [editorParentNoteId, setEditorParentNoteId] = useState<string | null>(null);

  // Row-level "Create Note" Modal State
  const [isRowCreateNoteModalOpen, setIsRowCreateNoteModalOpen] = useState(false);
  const [rowModalProjectName, setRowModalProjectName] = useState("");
  const [rowModalTitle, setRowModalTitle] = useState("");
  const [rowModalDescription, setRowModalDescription] = useState("");
  const [rowModalFiles, setRowModalFiles] = useState<NoteFile[]>([]);
  const [rowModalErrors, setRowModalErrors] = useState<RowModalErrors>({});
  const [isRowModalSubmitting, setIsRowModalSubmitting] = useState(false);
  const [rowModalParentNoteId, setRowModalParentNoteId] = useState<string | null>(null);
  const rowModalFileInputRef = useRef<HTMLInputElement>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<NoteToastMessage | null>(null);

  const showToast = (text: string, type: "success" | "error" | "info" = "success") => {
    setToastMessage({ text, type });
    window.setTimeout(() => setToastMessage(null), 3000);
  };

  /*
   * LOAD NOTES FROM BACKEND API
   */
  useEffect(() => {
    if (!employeeId) {
      setNotes([]);
      return;
    }

    let cancelled = false;

    const loadNotes = async () => {
      try {
        setIsLoading(true);
        setApiError("");

        if (ENABLE_REMOTE_API) {
          const response = await fetch(
            `${EMPLOYEE_NOTES_API}/${encodeURIComponent(employeeId)}`,
            {
              method: "GET",
              headers: getAuthHeaders(),
            }
          );

          if (response.ok) {
            const result = await response.json();
            const apiNotes: EmployeeNote[] = Array.isArray(result)
              ? result
              : Array.isArray(result?.data)
                ? result.data
                : [];

            if (cancelled) return;

            setNotes(apiNotes);
            localStorage.setItem(storageKey, JSON.stringify(apiNotes));
            return;
          }

          if (!cancelled) {
            setApiError(
              `Couldn't load notes from server (status ${response.status}). Showing local notes.`
            );
          }
        }

        const raw = localStorage.getItem(storageKey);
        const localNotes: EmployeeNote[] = raw ? JSON.parse(raw) : [];
        if (cancelled) return;
        setNotes(localNotes);
      } catch {
        if (cancelled) return;
        setApiError(
          "Couldn't reach the server. Showing your saved notes locally."
        );
        const raw = localStorage.getItem(storageKey);
        const localNotes: EmployeeNote[] = raw ? JSON.parse(raw) : [];
        setNotes(localNotes);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadNotes();

    return () => {
      cancelled = true;
    };
  }, [employeeId, storageKey]);

  // Extract project name parameter from URL (/employee-dashboard/:projectName/employee-notes or /employee-dashboard/employee-notes/:projectName)
  const getProjectNameFromUrl = (): string | null => {
    // Pattern 1: /employee-dashboard/:projectName/employee-notes
    const match1 = location.pathname.match(
      /\/employee-dashboard\/([^/]+)\/employee-notes/i
    );
    if (match1 && match1[1]) {
      try {
        return decodeURIComponent(match1[1].trim());
      } catch {
        return match1[1].trim();
      }
    }

    // Pattern 2 (backward compatibility): /employee-notes/:projectName
    const marker = "/employee-notes/";
    const idx = location.pathname.toLowerCase().indexOf(marker);
    if (idx !== -1) {
      const raw = location.pathname.substring(idx + marker.length);
      if (raw && raw.trim()) {
        try {
          return decodeURIComponent(raw.trim());
        } catch {
          return raw.trim();
        }
      }
    }
    return null;
  };

  // Sync editor view state with URL (for direct links and browser back/forward navigation)
  useEffect(() => {
    const urlProject = getProjectNameFromUrl();

    if (urlProject) {
      if (notes.length > 0) {
        const decoded = urlProject.toLowerCase();
        // Priority 1: Top-level project note matching projectName
        // Priority 2: Any note matching projectName
        // Priority 3: Note matching title
        // Priority 4: Note matching id
        const matched =
          notes.find(
            (n) =>
              (n.projectName || "").trim().toLowerCase() === decoded &&
              !n.parentNoteId
          ) ||
          notes.find(
            (n) => (n.projectName || "").trim().toLowerCase() === decoded
          ) ||
          notes.find(
            (n) => (n.title || "").trim().toLowerCase() === decoded
          ) ||
          notes.find((n) => n.id === urlProject);

        if (matched) {
          if (!isEditorOpen || activeNoteId !== matched.id || modalMode !== "view") {
            setModalMode("view");
            setActiveNoteId(matched.id);
            setActiveNote(matched);
            setFormProjectName(matched.projectName || "");
            setFormTitle(matched.title || "");
            setFormCategory(matched.category || "Project Note");
            setFormDescription(matched.content || "");
            setFormFiles(matched.files ? [...matched.files] : []);
            setFormRows(matched.rows ? [...matched.rows] : []);
            setFormErrors({});
            setDraftSavedAt(null);
            setIsEditorOpen(true);
          }
        }
      }
    } else {
      // Base URL without project name: if in view mode, close editor
      if (isEditorOpen && modalMode === "view") {
        setIsEditorOpen(false);
        setActiveNoteId(null);
        setActiveNote(null);
        setIsSubmitting(false);
        setFormErrors({});
        setEditorParentNoteId(null);
      }
    }
  }, [location.pathname, notes, isEditorOpen, activeNoteId, modalMode]);
 
  // Ensure "Project" notes filter is default whenever user navigates to Employee Notes
  const prevPathRef = useRef(location.pathname);
  useEffect(() => {
    if (
      prevPathRef.current !== location.pathname &&
      location.pathname === "/employee-dashboard/employee-notes"
    ) {
      setSelectedFilter("Project");
    }
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  // Filter and Search — exclude child notes (they live in sub-tables only)
  const filteredNotes = useMemo(() => {
    return notes.filter((n) => {
      // Child notes (added via a row's sub-table) should not appear in the main table
      if (n.parentNoteId) return false;

      const matchesFilter =
        selectedFilter === "All" ||
        (selectedFilter === "Project" && n.category === "Project Note") ||
        (selectedFilter === "Personal" && n.category === "Personal Note") ||
        n.category === selectedFilter;

      if (!search.trim()) return matchesFilter;

      const q = search.toLowerCase();
      const filesText = (n.files || [])
        .map((f) => f.name)
        .join(" ")
        .toLowerCase();
      const rowsText = (n.rows || [])
        .map((r) => `${r.title} ${r.notes}`)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        (n.projectName || "").toLowerCase().includes(q) ||
        (n.title || "").toLowerCase().includes(q) ||
        stripHtmlTags(n.content || "").toLowerCase().includes(q) ||
        (n.folder || "").toLowerCase().includes(q) ||
        filesText.includes(q) ||
        rowsText.includes(q) ||
        (n.category || "").toLowerCase().includes(q);

      return matchesFilter && matchesSearch;
    });
  }, [notes, search, selectedFilter]);

  // Reset pagination when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, selectedFilter]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredNotes.length / itemsPerPage));
  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredNotes.slice(start, start + itemsPerPage);
  }, [filteredNotes, currentPage, itemsPerPage]);

  const startRecord =
    filteredNotes.length === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endRecord = Math.min(currentPage * itemsPerPage, filteredNotes.length);

  // Helper for row preview text
  const getNotePreview = (note: EmployeeNote) => {
    if (note.rows && note.rows.length > 0) {
      const first = note.rows[0];
      const firstLabel = first.notes || first.title || "Project details added";
      if (note.rows.length > 1) {
        return `${firstLabel} (+${note.rows.length - 1} more project${note.rows.length - 1 === 1 ? "" : "s"
          })`;
      }
      return firstLabel;
    }
    if (note.content) {
      const plain = stripHtmlTags(note.content);
      return plain || "No description added yet";
    }
    return "No description added yet";
  };

  /*
   * MODAL FILE UPLOAD HANDLING
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: NoteFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string,
        };

        setFormFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const removeFormFile = (fileId: string) => {
    setFormFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const downloadFile = (file: NoteFile) => {
    if (!file.dataUrl) return;
    const a = document.createElement("a");
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };



  /*
   * DIRECT TABLE ROW FILE UPLOAD (Saved immediately to Backend API)
   */
  const handleTableDirectUpload = async (
    note: EmployeeNote,
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !employeeId) return;

    const fileList = Array.from(files);
    const readFilePromises = fileList.map(
      (file) =>
        new Promise<NoteFile>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve({
              id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              name: file.name,
              size: file.size,
              type: file.type,
              dataUrl: reader.result as string,
            });
          };
          reader.readAsDataURL(file);
        })
    );

    try {
      setUploadingNoteId(note.id);
      const newFiles = await Promise.all(readFilePromises);
      const existingFiles = note.files || [];
      const mergedFiles = [...existingFiles, ...newFiles];

      const updatedNote: EmployeeNote = {
        ...note,
        files: mergedFiles,
        folder: mergedFiles[0]?.name || note.folder || "General",
        updatedAt: new Date().toISOString(),
      };

      if (ENABLE_REMOTE_API) {
        const payload = {
          title: updatedNote.title,
          category: updatedNote.category,
          folder: updatedNote.folder,
          content: updatedNote.content,
          rows: updatedNote.rows || [],
          files: updatedNote.files,
          updatedBy: currentCreator,
        };

        const response = await fetch(
          `${EMPLOYEE_NOTES_API}/${encodeURIComponent(
            employeeId
          )}/${encodeURIComponent(note.id)}`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          }
        );

        if (response.ok) {
          const result = await response.json();
          const saved: EmployeeNote = result?.data || result || updatedNote;
          const updated = notes.map((n) => (n.id === note.id ? saved : n));
          setNotes(updated);
          localStorage.setItem(storageKey, JSON.stringify(updated));
          showToast(
            `${newFiles.length === 1
              ? newFiles[0].name
              : `${newFiles.length} files`
            } uploaded successfully!`
          );
          return;
        }
      }

      // Local fallback
      const updated = notes.map((n) => (n.id === note.id ? updatedNote : n));
      setNotes(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      showToast("File uploaded locally!");
    } catch {
      showToast("Failed to upload file to server.", "error");
    } finally {
      setUploadingNoteId(null);
      e.target.value = "";
    }
  };

  /*
   * REMOVE FILE DIRECTLY FROM TABLE (Saved to Backend API)
   */
  const handleTableRemoveFile = async (note: EmployeeNote, fileId: string) => {
    if (!employeeId) return;
    const remainingFiles = (note.files || []).filter((f) => f.id !== fileId);
    const updatedNote: EmployeeNote = {
      ...note,
      files: remainingFiles,
      folder: remainingFiles[0]?.name || "General",
      updatedAt: new Date().toISOString(),
    };

    try {
      if (ENABLE_REMOTE_API) {
        const payload = {
          title: updatedNote.title,
          category: updatedNote.category,
          folder: updatedNote.folder,
          content: updatedNote.content,
          rows: updatedNote.rows || [],
          files: updatedNote.files,
          updatedBy: currentCreator,
        };

        await fetch(
          `${EMPLOYEE_NOTES_API}/${encodeURIComponent(
            employeeId
          )}/${encodeURIComponent(note.id)}`,
          {
            method: "PUT",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          }
        );
      }
      const updated = notes.map((n) => (n.id === note.id ? updatedNote : n));
      setNotes(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      showToast("File removed successfully!");
    } catch {
      showToast("Failed to remove file from server.", "error");
    }
  };

  /*
   * DETERMINES THE PROJECT SLUG FOR URL (e.g. /employee-dashboard/employee-notes/:projectName)
   */
  const getNoteProjectSlug = (note: EmployeeNote): string => {
    if (note.projectName && note.projectName.trim()) {
      return note.projectName.trim();
    }
    if (note.parentNoteId) {
      const parent = notes.find((p) => p.id === note.parentNoteId);
      if (parent?.projectName && parent.projectName.trim()) {
        return parent.projectName.trim();
      }
    }
    if (note.title && note.title.trim()) {
      return note.title.trim();
    }
    return note.category === "Project Note" ? "Project Note" : "Personal Note";
  };

  /*
   * OPEN CREATE NOTE / EDIT NOTE (Full Page In-Place View)
   */
  const openCreateNote = (category: NoteCategory = "Project Note") => {
    if (location.pathname !== "/employee-dashboard/employee-notes") {
      navigate("/employee-dashboard/employee-notes");
    }
    setModalMode("create");
    setActiveNoteId(null);
    setActiveNote(null);
    setFormProjectName("");
    setFormTitle("");
    setFormCategory(category);
    setFormDescription("");
    setFormFiles([]);
    setFormRows([]);
    setFormErrors({});
    setDraftSavedAt(null);
    setIsEditorOpen(true);

    // Auto Save recovery: offer to restore an unsaved draft
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (
          draft?.mode === "create" &&
          (draft.projectName || draft.title || draft.description || draft.rows?.length)
        ) {
          const wantsRestore = window.confirm(
            "We found an unsaved draft from a previous session. Restore it?"
          );
          if (wantsRestore) {
            setFormProjectName(draft.projectName || "");
            setFormTitle(draft.title || "");
            setFormCategory(draft.category || category);
            setFormDescription(draft.description || "");
            setFormRows(draft.rows || []);
            setDraftSavedAt(draft.savedAt || null);
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      }
    } catch {
      // ignore malformed draft data
    }
  };

  const openEditModal = (note: EmployeeNote) => {
    if (location.pathname !== "/employee-dashboard/employee-notes") {
      navigate("/employee-dashboard/employee-notes");
    }
    setModalMode("edit");
    setActiveNoteId(note.id);
    setActiveNote(note);
    setFormProjectName(note.projectName || "");
    setFormTitle(note.title || "");
    setFormCategory(note.category || "Personal Note");
    setFormDescription(note.content || "");
    setFormFiles(note.files ? [...note.files] : []);
    setFormRows(note.rows ? [...note.rows] : []);
    setFormErrors({});
    setDraftSavedAt(null);
    setIsEditorOpen(true);

    // Auto Save recovery: offer to restore edits left unsaved for this note
    try {
      const raw = localStorage.getItem(draftKey);
      if (raw) {
        const draft = JSON.parse(raw);
        if (draft?.mode === "edit" && draft.noteId === note.id) {
          const wantsRestore = window.confirm(
            "We found unsaved changes for this note from a previous session. Restore them?"
          );
          if (wantsRestore) {
            setFormProjectName(draft.projectName ?? note.projectName ?? "");
            setFormTitle(draft.title ?? note.title ?? "");
            setFormCategory(draft.category || note.category || "Personal Note");
            setFormDescription(draft.description ?? note.content ?? "");
            setFormRows(draft.rows || note.rows || []);
            setDraftSavedAt(draft.savedAt || null);
          } else {
            localStorage.removeItem(draftKey);
          }
        }
      }
    } catch {
      // ignore malformed draft data
    }
  };

  const openViewNote = (note: EmployeeNote) => {
    setModalMode("view");
    setActiveNoteId(note.id);
    setActiveNote(note);
    setFormProjectName(note.projectName || "");
    setFormTitle(note.title || "");
    setFormCategory(note.category || "Project Note");
    setFormDescription(note.content || "");
    setFormFiles(note.files ? [...note.files] : []);
    setFormRows(note.rows ? [...note.rows] : []);
    setFormErrors({});
    setDraftSavedAt(null);
    setIsEditorOpen(true);

    const projectSlug = getNoteProjectSlug(note);
    const targetUrl = `/employee-dashboard/${encodeURIComponent(projectSlug)}/employee-notes`;
    if (location.pathname !== targetUrl) {
      navigate(targetUrl);
    }
  };

  const closeEditor = () => {
    try {
      localStorage.removeItem(draftKey);
    } catch {
      // Storage may be unavailable
    }
    setIsEditorOpen(false);
    setActiveNoteId(null);
    setActiveNote(null);
    setIsSubmitting(false);
    setFormErrors({});
    setEditorParentNoteId(null);
    setDraftSavedAt(null);
    setFormProjectName("");
    setFormTitle("");
    setFormDescription("");
    setFormFiles([]);
    setFormRows([]);

    if (location.pathname !== "/employee-dashboard/employee-notes") {
      navigate("/employee-dashboard/employee-notes");
    }
  };

  // Opens the full-page editor in create mode pre-filled for the parent note's category.
  const openSubTableCreateNote = (projectName: string, parentNoteId: string, category: NoteCategory = "Project Note") => {
    if (location.pathname !== "/employee-dashboard/employee-notes") {
      navigate("/employee-dashboard/employee-notes");
    }
    setModalMode("create");
    setActiveNoteId(null);
    setActiveNote(null);
    setFormProjectName(category === "Project Note" ? projectName : "");
    setFormTitle("");
    setFormCategory(category);
    setFormDescription("");
    setFormFiles([]);
    setFormRows([]);
    setFormErrors({});
    setDraftSavedAt(null);
    setEditorParentNoteId(parentNoteId);
    setIsEditorOpen(true);
  };

  /*
   * ROW-LEVEL "+ CREATE NOTE" MODAL HANDLERS
   */
  const openRowCreateNoteModal = (defaultProjectName?: string, parentNoteId?: string) => {
    setRowModalProjectName(defaultProjectName || "");
    setRowModalTitle("");
    setRowModalDescription("");
    setRowModalFiles([]);
    setRowModalErrors({});
    setIsRowModalSubmitting(false);
    setRowModalParentNoteId(parentNoteId || null);
    setIsRowCreateNoteModalOpen(true);
  };

  const closeRowCreateNoteModal = () => {
    setIsRowCreateNoteModalOpen(false);
    setRowModalProjectName("");
    setRowModalTitle("");
    setRowModalDescription("");
    setRowModalFiles([]);
    setRowModalErrors({});
    setIsRowModalSubmitting(false);
    setRowModalParentNoteId(null);
  };

  const handleRowModalFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const fileList = Array.from(files);
    fileList.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const newFile: NoteFile = {
          id: `file-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result as string,
        };
        setRowModalFiles((prev) => [...prev, newFile]);
      };
      reader.readAsDataURL(file);
    });

    if (rowModalFileInputRef.current) {
      rowModalFileInputRef.current.value = "";
    }
  };

  const removeRowModalFile = (fileId: string) => {
    setRowModalFiles((prev) => prev.filter((f) => f.id !== fileId));
  };

  const handleRowModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employeeId || isRowModalSubmitting) return;

    const errors: { title?: string; projectName?: string } = {};
    const trimmedTitle = rowModalTitle.trim();
    const trimmedProjectName = rowModalProjectName.trim();

    if (!trimmedProjectName) {
      errors.projectName = "Project Name is required";
    }
    if (!trimmedTitle) {
      errors.title = "Project Title is required";
    }

    if (Object.keys(errors).length > 0) {
      setRowModalErrors(errors);
      return;
    }
    setRowModalErrors({});

    const nowIso = new Date().toISOString();
    const folderValue = rowModalFiles.length > 0 ? rowModalFiles[0].name : "General";

    setIsRowModalSubmitting(true);

    const newNote: EmployeeNote = {
      id: `note-${Date.now()}`,
      employeeId,
      projectName: trimmedProjectName,
      title: trimmedTitle,
      category: "Project Note",
      folder: folderValue,
      content: rowModalDescription,
      rows: [],
      files: rowModalFiles,
      createdBy: currentCreator,
      updatedBy: currentCreator,
      createdAt: nowIso,
      updatedAt: nowIso,
      parentNoteId: rowModalParentNoteId || null,
    };

    try {
      if (ENABLE_REMOTE_API) {
        const payload = {
          employeeId,
          projectName: newNote.projectName,
          title: newNote.title,
          category: newNote.category,
          folder: newNote.folder,
          content: newNote.content,
          rows: newNote.rows,
          files: newNote.files,
          createdBy: currentCreator,
          updatedBy: currentCreator,
          parentNoteId: newNote.parentNoteId || null,
        };

        const response = await fetch(EMPLOYEE_NOTES_API, {
          method: "POST",
          headers: getAuthHeaders(),
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const result = await response.json();
          // Always preserve parentNoteId so the sub-table can find this note
          const saved: EmployeeNote = {
            ...(result?.data || result || newNote),
            parentNoteId: newNote.parentNoteId || null,
          };
          const updated = [saved, ...notes];
          setNotes(updated);
          localStorage.setItem(storageKey, JSON.stringify(updated));
          closeRowCreateNoteModal();
          showToast("Note created and saved to server!");
          return;
        }
      }

      // Fallback local storage
      const updated = [newNote, ...notes];
      setNotes(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      closeRowCreateNoteModal();
      showToast("Note created successfully!");
    } catch {
      const updated = [newNote, ...notes];
      setNotes(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      closeRowCreateNoteModal();
      showToast("Note created locally!");
    } finally {
      setIsRowModalSubmitting(false);
    }
  };

  /*
   * SAVE / AUTO SAVE: while the editor is open, periodically persist the
   * in-progress form as a local draft so unsaved work survives an accidental
   * close, refresh, or crash.
   */
  useEffect(() => {
    if (!isEditorOpen || modalMode === "view") return;

    const timer = window.setTimeout(() => {
      if (!isEditorOpen || modalMode === "view") return;
      const hasContent =
        formProjectName.trim() ||
        formTitle.trim() ||
        formDescription.trim() ||
        formRows.length > 0;
      if (!hasContent) return;

      const draft = {
        mode: modalMode,
        noteId: activeNoteId,
        projectName: formProjectName,
        title: formTitle,
        category: formCategory,
        description: formDescription,
        rows: formRows,
        savedAt: new Date().toISOString(),
      };

      try {
        localStorage.setItem(draftKey, JSON.stringify(draft));
        setDraftSavedAt(draft.savedAt);
      } catch {
        // Storage may be unavailable
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [
    isEditorOpen,
    modalMode,
    activeNoteId,
    formProjectName,
    formTitle,
    formCategory,
    formDescription,
    formRows,
    draftKey,
  ]);

  /*
   * HANDLE SAVE NOTE (POST / PUT to Backend API)
   */
  const handleSaveModal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modalMode === "view") return;
    if (!employeeId || isSubmitting) return;

    const errors: { title?: string; projectName?: string } = {};
    const trimmedTitle = formTitle.trim();
    const trimmedProjectName = formProjectName.trim();

    if (formCategory === "Project Note" && !trimmedProjectName) {
      errors.projectName = "Project Name is required";
    }
    if (!trimmedTitle) {
      errors.title =
        formCategory === "Project Note"
          ? "Project Title is required"
          : "Title is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    const nowIso = new Date().toISOString();
    const folderValue = formFiles.length > 0 ? formFiles[0].name : "General";

    setIsSubmitting(true);

    if (modalMode === "create") {
      const newNote: EmployeeNote = {
        id: `note-${Date.now()}`,
        employeeId,
        projectName:
          formCategory === "Project Note" ? trimmedProjectName : undefined,
        title: trimmedTitle,
        category: formCategory,
        folder: folderValue,
        content: formDescription,
        rows: formRows,
        files: formFiles,
        createdBy: currentCreator,
        updatedBy: currentCreator,
        createdAt: nowIso,
        updatedAt: nowIso,
        parentNoteId: editorParentNoteId || null,
      };

      try {
        if (ENABLE_REMOTE_API) {
          const payload = {
            employeeId,
            projectName: newNote.projectName,
            title: newNote.title,
            category: newNote.category,
            folder: newNote.folder,
            content: newNote.content,
            rows: newNote.rows,
            files: newNote.files,
            createdBy: currentCreator,
            updatedBy: currentCreator,
            parentNoteId: newNote.parentNoteId || null,
          };

          const response = await fetch(EMPLOYEE_NOTES_API, {
            method: "POST",
            headers: getAuthHeaders(),
            body: JSON.stringify(payload),
          });

          if (response.ok) {
            const result = await response.json();
            // Always preserve parentNoteId from newNote (API may not return it)
            const saved: EmployeeNote = {
              ...(result?.data || result || newNote),
              parentNoteId: newNote.parentNoteId || null,
            };
            const updated = [saved, ...notes];
            setNotes(updated);
            localStorage.setItem(storageKey, JSON.stringify(updated));
            localStorage.removeItem(draftKey);
            closeEditor();
            showToast("Note created and saved to server!");
            return;
          }
        }

        // Fallback local
        const updated = [newNote, ...notes];
        setNotes(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.removeItem(draftKey);
        closeEditor();
        showToast("Note created successfully!");
      } catch {
        const updated = [newNote, ...notes];
        setNotes(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.removeItem(draftKey);
        closeEditor();
        showToast("Note created locally!");
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // EDIT MODE
      if (!activeNoteId) return;

      const existing = notes.find((n) => n.id === activeNoteId);
      const updatedNote: EmployeeNote = {
        id: activeNoteId,
        employeeId,
        projectName:
          formCategory === "Project Note" ? trimmedProjectName : undefined,
        title: trimmedTitle,
        category: formCategory,
        folder: folderValue,
        content: formDescription,
        rows: formRows,
        files: formFiles,
        createdBy: existing?.createdBy || currentCreator,
        updatedBy: currentCreator,
        createdAt: existing?.createdAt || nowIso,
        updatedAt: nowIso,
      };

      try {
        if (ENABLE_REMOTE_API) {
          const payload = {
            projectName: updatedNote.projectName,
            title: updatedNote.title,
            category: updatedNote.category,
            folder: updatedNote.folder,
            content: updatedNote.content,
            rows: updatedNote.rows,
            files: updatedNote.files,
            updatedBy: currentCreator,
          };

          const response = await fetch(
            `${EMPLOYEE_NOTES_API}/${encodeURIComponent(
              employeeId
            )}/${encodeURIComponent(activeNoteId)}`,
            {
              method: "PUT",
              headers: getAuthHeaders(),
              body: JSON.stringify(payload),
            }
          );

          if (response.ok) {
            const result = await response.json();
            const saved: EmployeeNote = result?.data || result || updatedNote;
            const updated = notes.map((n) =>
              n.id === activeNoteId ? saved : n
            );
            setNotes(updated);
            localStorage.setItem(storageKey, JSON.stringify(updated));
            localStorage.removeItem(draftKey);
            closeEditor();
            showToast("Note updated on server!");
            return;
          }
        }

        // Fallback local
        const updated = notes.map((n) =>
          n.id === activeNoteId ? updatedNote : n
        );
        setNotes(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.removeItem(draftKey);
        closeEditor();
        showToast("Note updated successfully!");
      } catch {
        const updated = notes.map((n) =>
          n.id === activeNoteId ? updatedNote : n
        );
        setNotes(updated);
        localStorage.setItem(storageKey, JSON.stringify(updated));
        localStorage.removeItem(draftKey);
        closeEditor();
        showToast("Note updated locally!");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  /*
   * DELETE NOTE (DELETE to Backend API)
   */
  const confirmDelete = async () => {
    if (!noteToDelete || !employeeId || isDeleting) return;

    const id = noteToDelete.id;
    setIsDeleting(true);

    try {
      if (ENABLE_REMOTE_API) {
        await fetch(
          `${EMPLOYEE_NOTES_API}/${encodeURIComponent(
            employeeId
          )}/${encodeURIComponent(id)}`,
          {
            method: "DELETE",
            headers: getAuthHeaders(),
          }
        );
      }
    } catch {
      // Continue to remove locally
    } finally {
      const updated = notes.filter((n) => n.id !== id);
      setNotes(updated);
      localStorage.setItem(storageKey, JSON.stringify(updated));
      setIsDeleting(false);
      setNoteToDelete(null);
      showToast("Note deleted successfully!");
    }
  };

  return (
    <div className="flex-1 flex flex-col px-3 md:px-5 py-3 min-h-0 bg-[#F4F7FE] font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toastMessage.type === "success"
            ? "bg-emerald-600 text-white"
            : "bg-red-600 text-white"
            }`}
        >
          <Check size={16} />
          {toastMessage.text}
        </div>
      )}

      {isEditorOpen ? (
        /* FULL-PAGE IN-PLACE NOTE EDITOR (Extends right up to the sidebar menu) */
        <div className="flex-1 flex flex-col min-h-0 animate-fadeIn">
          {/* Main Editor Form Card */}
          <div className="bg-white rounded-2xl shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100 p-4 sm:p-5 pt-3 sm:pt-3.5 pb-8 flex-1 min-h-0 overflow-y-auto custom-scrollbar">
            <form
              id="note-fullpage-form"
              onSubmit={handleSaveModal}
              className="w-full space-y-3 pb-8"
            >
              {/* 1. TOP HEADER ROW: Project Name & Title + Back button on top */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2.5 border-b border-gray-200">
                <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 min-w-0">
                  {/* Project Name (only if Project Note) */}
                  {formCategory === "Project Note" && (
                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                      <label className="text-xs sm:text-[13px] font-bold font-sans text-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                        Project Name:
                      </label>
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          readOnly={modalMode === "view"}
                          value={formProjectName}
                          onChange={(e) => {
                            if (modalMode === "view") return;
                            setFormProjectName(e.target.value);
                            if (formErrors.projectName) {
                              setFormErrors((prev) => ({
                                ...prev,
                                projectName: undefined,
                              }));
                            }
                          }}
                          placeholder={modalMode === "view" ? "No project name" : "Enter project name..."}
                          className={`w-full px-3 py-1.5 text-sm font-medium font-sans rounded-xl border text-slate-800 placeholder:text-gray-400 transition-all h-[36px] ${modalMode === "view"
                              ? "bg-gray-50/70 border-gray-200 cursor-default select-text"
                              : formErrors.projectName
                                ? "border-red-400 ring-2 ring-red-100 focus:outline-none"
                                : "border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 focus:outline-none"
                            }`}
                        />
                        {formErrors.projectName && (
                          <p className="mt-1 text-xs font-semibold text-red-500">
                            {formErrors.projectName}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Title */}
                  <div className="flex-1 flex items-center gap-2.5 min-w-0">
                    <label className="text-xs sm:text-[13px] font-bold font-sans text-black uppercase tracking-wider shrink-0 whitespace-nowrap">
                      Title:
                    </label>
                    <div className="flex-1 min-w-0">
                      <input
                        type="text"
                        readOnly={modalMode === "view"}
                        value={formTitle}
                        onChange={(e) => {
                          if (modalMode === "view") return;
                          setFormTitle(e.target.value);
                          if (formErrors.title) {
                            setFormErrors((prev) => ({ ...prev, title: undefined }));
                          }
                        }}
                        placeholder={
                          modalMode === "view"
                            ? "No title"
                            : "Enter title..."
                        }
                        className={`w-full px-3 py-1.5 text-sm font-medium font-sans rounded-xl border text-slate-800 placeholder:text-gray-400 transition-all h-[36px] ${modalMode === "view"
                            ? "bg-gray-50/70 border-gray-200 cursor-default select-text"
                            : formErrors.title
                              ? "border-red-400 ring-2 ring-red-100 focus:outline-none"
                              : "border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 focus:outline-none"
                          }`}
                      />
                      {formErrors.title && (
                        <p className="mt-1 text-xs font-semibold text-red-500">
                          {formErrors.title}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Back Button */}
                <button
                  type="button"
                  onClick={closeEditor}
                  className="inline-flex items-center justify-center gap-1.5 text-xs font-bold font-sans text-[#4318FF] hover:text-[#3311CC] bg-blue-50/70 hover:bg-blue-100/70 px-2.5 h-[32px] rounded-lg transition-all cursor-pointer border border-blue-200/60 shrink-0 self-end md:self-center"
                >
                  <ArrowLeft size={13} />
                  <span>Back</span>
                </button>
              </div>

              {/* Author & Date info (when viewing an existing note) */}
              {modalMode === "view" && activeNote && (
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-slate-500 font-medium flex-wrap min-w-0 pt-0.5">
                  <span className="flex items-center gap-1.5 shrink-0">
                    <User size={13} className="text-[#4318FF]" />
                    <span>
                      Created by <strong className="text-slate-800 font-bold">{capitalizeFirst(getAuthorDisplay(activeNote.createdBy))}</strong>
                    </span>
                  </span>
                  <span className="text-gray-300">&bull;</span>
                  <span className="flex items-center gap-1.5 shrink-0">
                    <Calendar size={13} className="text-[#4318FF]" />
                    <span>{formatDateTime(activeNote.createdAt || activeNote.updatedAt)}</span>
                  </span>
                </div>
              )}

              {/* 3. DESCRIPTION */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black uppercase tracking-wider">
                    Description
                  </label>
                  {modalMode === "view" && formDescription && (
                    <button
                      type="button"
                      onClick={() =>
                        handleCopyText(
                          htmlToPlainText(formDescription) || formDescription
                        )
                      }
                      className={`inline-flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-all ${
                        isCopied
                          ? "text-emerald-600 font-bold"
                          : "text-[#4318FF] hover:underline"
                      }`}
                      title={
                        isCopied
                          ? "Copied to clipboard"
                          : "Copy description text"
                      }
                    >
                      {isCopied ? (
                        <>
                          <Check size={14} className="text-emerald-600 stroke-[2.5]" />
                          <span className="text-emerald-600 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>Copy text</span>
                        </>
                      )}
                    </button>
                  )}
                </div>

                {modalMode === "view" ? (
                  <div
                    style={{ resize: "vertical" }}
                    className="w-full min-h-[140px] max-h-[750px] overflow-auto resize-y p-4 bg-gray-50/50 rounded-xl border border-gray-200 text-sm font-sans text-slate-800 leading-relaxed shadow-2xs prose prose-slate max-w-none [&_b]:font-bold [&_strong]:font-bold [&_i]:italic [&_em]:italic [&_u]:underline [&_h1]:text-lg [&_h1]:font-bold [&_h2]:text-base [&_h2]:font-bold [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
                    dangerouslySetInnerHTML={{
                      __html:
                        formDescription ||
                        "<p class='text-slate-400 italic text-sm'>No description provided.</p>",
                    }}
                  />
                ) : (
                  <RichTextEditor
                    initialValue={formDescription}
                    onChange={(html) => setFormDescription(html)}
                    placeholder="Write your notes, key updates, documentation, or action items here..."
                  />
                )}
              </div>

              {/* 4. FILES & ATTACHMENTS (Multiple File Upload) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black tracking-wider uppercase flex items-center gap-2">
                    <Paperclip size={15} className="text-[#4318FF]" />
                    <span>Files & Attachments</span>
                  </label>
                  {formFiles.length > 0 ? (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {formFiles.length} {formFiles.length === 1 ? "file" : "files"} attached
                    </span>
                  ) : modalMode === "view" ? (
                    <span className="text-xs text-slate-400 font-medium">No files attached</span>
                  ) : null}
                </div>

                {/* Compact Upload Drop Zone (only in create/edit mode) */}
                {modalMode !== "view" && (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2.5 border border-dashed border-gray-200 hover:border-[#4318FF] rounded-xl py-2 px-4 bg-gray-50/60 hover:bg-blue-50/30 transition-all cursor-pointer group"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-[#4318FF] transition-colors shrink-0 shadow-2xs">
                      <UploadCloud size={16} />
                    </div>
                    <p className="text-xs font-bold font-sans text-slate-800 whitespace-nowrap">
                      <span className="text-[#4318FF] underline underline-offset-2 font-extrabold">
                        Click to upload
                      </span>{" "}
                      or drag and drop
                      <span className="hidden md:inline text-[11px] text-slate-400 font-normal ml-1.5">
                        (PDF, Word, Excel, images)
                      </span>
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleFileUpload}
                />

                {/* Attached Files Grid List */}
                {formFiles.length > 0 ? (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {formFiles.map((file, fIdx) => (
                      <div
                        key={file.id || fIdx}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-200 shadow-2xs transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4318FF] flex items-center justify-center shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs font-bold text-slate-900 truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {formatFileSize(file.size)} &bull;{" "}
                              {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => openFilePreview(file)}
                            title="Preview file"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#4318FF] hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          {file.dataUrl && (
                            <button
                              type="button"
                              onClick={() => downloadFile(file)}
                              title="Download file"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Download size={14} />
                            </button>
                          )}
                          {modalMode !== "view" && (
                            <button
                              type="button"
                              onClick={() => removeFormFile(file.id)}
                              title="Remove file"
                              className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : modalMode === "view" ? (
                  <p className="text-xs text-slate-400 italic py-3 px-4 bg-gray-50/60 rounded-xl border border-dashed border-gray-200">
                    No files attached to this note.
                  </p>
                ) : null}
              </div>

              {/* Footer Action Buttons (Below Right - only in create/edit mode) */}
              {modalMode !== "view" && (
                <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-3 pb-3 mb-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={closeEditor}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#4318FF] hover:bg-[#3410d1] disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-5 py-1.5 rounded-xl shadow-sm shadow-[#4318FF]/25 transition-all cursor-pointer"
                  >
                    {isSubmitting && <Loader2 size={15} className="animate-spin" />}
                    {modalMode === "create"
                      ? formCategory === "Project Note"
                        ? "Save Project Note"
                        : "Save Personal Note"
                      : "Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      ) : (
        <>
          {/* Page Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
            <div>
              <h1 className="text-2xl font-bold font-sans text-black tracking-tight">
                {selectedFilter === "Personal" ? "Personal Notes" : "Project Notes"}
              </h1>
            </div>

            {canManageNotes && (
              <div className="flex items-center gap-2.5 sm:gap-3 shrink-0 flex-wrap">
                {/* Button 1: Create Project Note */}
                <button
                  type="button"
                  onClick={() => openCreateNote("Project Note")}
                  className="inline-flex items-center gap-2 bg-[#4318FF] hover:bg-[#3410d1] text-white text-sm font-bold px-4 py-2.5 rounded-xl shadow-sm shadow-[#4318FF]/25 transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={16} className="stroke-[2.5]" />
                  <span>Create Project Note</span>
                </button>

                {/* Button 2: Create Personal Note */}
                <button
                  type="button"
                  onClick={() => openCreateNote("Personal Note")}
                  className="inline-flex items-center gap-2 bg-white hover:bg-blue-50/60 text-[#4318FF] border border-[#4318FF]/30 hover:border-[#4318FF] text-sm font-bold px-4 py-2.5 rounded-xl shadow-2xs transition-all active:scale-[0.98] cursor-pointer"
                >
                  <Plus size={16} className="stroke-[2.5]" />
                  <span>Create Personal Note</span>
                </button>
              </div>
            )}
          </div>

          {/* Employee can view/edit their own notes only, unless a manager/admin is viewing */}
          {!canManageNotes && (
            <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 flex items-center gap-2">
              <AlertCircle size={16} />
              You can only view this employee&apos;s notes. Only the employee or a
              manager/admin can edit them.
            </div>
          )}
          {canManageNotes && !isOwnRecord && (
            <div className="mb-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700 flex items-center gap-2">
              <AlertCircle size={16} />
              You&apos;re viewing and managing this employee&apos;s notes with
              manager/admin access.
            </div>
          )}

          {/* API Error Alert */}
          {apiError && (
            <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 flex items-center gap-2">
              <AlertCircle size={16} />
              {apiError}
            </div>
          )}

          {/* Top Filter and Search Bar Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            {/* Search Box */}
            <div className="relative w-full sm:w-80">
              <Search
                size={16}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A3AED0]"
              />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search notes..."
                className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 bg-white placeholder:text-gray-400 text-slate-800 font-medium focus:outline-none focus:border-[#4318FF] transition-colors"
              />
            </div>

            {/* Filter Dropdown */}
            <div className="relative shrink-0">
              <select
                value={selectedFilter}
                onChange={(e) => {
                  setSelectedFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="appearance-none pl-4 pr-9 py-2.5 rounded-xl text-sm font-bold border border-gray-200 bg-white text-slate-700 focus:outline-none focus:border-[#4318FF] transition-colors cursor-pointer shadow-sm"
              >
                <option value="Project">Project Notes</option>
                <option value="Personal">Personal Notes</option>
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>

          {/* Table Container Card - With Cut Rounded Top Outer Borders */}
          <div className="bg-white rounded-[20px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] overflow-hidden border border-gray-100 flex flex-col flex-1 min-h-0 mb-4">
            {/* Table Content */}
            <div className="flex-1 overflow-x-auto overflow-y-visible min-h-[350px] relative custom-scrollbar">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 text-[#4318FF] animate-spin mb-3" />
                  <p className="text-sm font-bold text-[#2B3674]">
                    Loading notes...
                  </p>
                </div>
              ) : filteredNotes.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-64 text-center p-6">
                  <div className="w-12 h-12 rounded-full bg-blue-50 flex items-center justify-center text-[#4318FF] mb-3">
                    <FileText size={22} />
                  </div>
                  <p className="text-sm font-bold text-[#2B3674]">
                    {notes.length === 0
                      ? "No notes created yet"
                      : "No matching notes found"}
                  </p>
                  <p className="text-xs text-[#707EAE] mt-1 max-w-xs">
                    {notes.length === 0
                      ? "Click '+ Create Note' to add your project or personal details."
                      : "Try clearing your search query or switching filters."}
                  </p>
                  {notes.length === 0 && canManageNotes && (
                    <div className="mt-4 flex items-center gap-2.5 flex-wrap justify-center">
                      <button
                        onClick={() => openCreateNote("Project Note")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#4318FF] hover:bg-[#3410d1] text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus size={14} className="stroke-[2.5]" />
                        Create Project Note
                      </button>
                      <button
                        onClick={() => openCreateNote("Personal Note")}
                        className="inline-flex items-center gap-1.5 px-4 py-2 bg-white hover:bg-gray-50 text-[#4318FF] border border-gray-200 text-xs font-bold rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <Plus size={14} className="stroke-[2.5]" />
                        Create Personal Note
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <div className="hidden md:block">
                    <table className="w-full text-left border-collapse table-auto">
                      <thead>
                        <tr className="bg-[#4318FF] text-white">
                          <th className="py-3.5 pl-6 pr-3 text-[13px] font-bold uppercase tracking-wider text-left text-white w-24 whitespace-nowrap">
                            SL NO
                          </th>
                          {selectedFilter !== "Personal" && (
                            <th className="py-3.5 px-4 text-[13px] font-bold uppercase tracking-wider text-left text-white w-[28%] whitespace-nowrap">
                              Project Name
                            </th>
                          )}
                          <th
                            className={`py-3.5 px-4 text-[13px] font-bold uppercase tracking-wider text-left text-white whitespace-nowrap ${
                              selectedFilter === "Personal" ? "w-[52%]" : "w-[30%]"
                            }`}
                          >
                            Title
                          </th>
                          <th className="py-3.5 px-4 text-[13px] font-bold uppercase tracking-wider text-left text-white w-[22%] whitespace-nowrap">
                            Created by
                          </th>
                          <th className="py-3.5 pl-2 pr-6 text-[13px] font-bold uppercase tracking-wider text-center text-white w-28 whitespace-nowrap">
                            Action
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-sm">
                        {paginatedNotes.map((note, idx) => {
                          const slNo = (currentPage - 1) * itemsPerPage + idx + 1;
                          const isProject = note.category === "Project Note";
                          const createdDate = note.createdAt || note.updatedAt;
                          const isEven = idx % 2 === 0;

                          const isExpanded = expandedRowProjectNotes.includes(note.id);
                          // Child notes: only notes explicitly added to this parent via the sub-table
                          const childNotes = notes.filter(
                            (n) => n.parentNoteId === note.id
                          );

                          return (
                            <Fragment key={note.id}>
                              <tr
                                className={`group transition-all duration-150 ${isEven ? "bg-white" : "bg-[#F8F9FC]"
                                  } hover:bg-[#F1F4FF]`}
                              >
                                {/* 1. SL NO */}
                                <td className="py-4 pl-6 pr-3 text-left whitespace-nowrap">
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-800 text-sm font-bold min-w-[16px]">{slNo}</span>
                                    <button
                                      type="button"
                                      onClick={() => toggleRowProjectNotesExpand(note.id)}
                                      className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${isExpanded
                                          ? "bg-[#4318FF] text-white shadow-xs"
                                          : "bg-blue-50 hover:bg-blue-100 text-[#4318FF] border border-blue-200"
                                        }`}
                                      title={
                                        isExpanded
                                          ? "Collapse notes"
                                          : "Expand to view notes"
                                      }
                                    >
                                      {isExpanded ? (
                                        <Minus size={13} className="stroke-[2.5]" />
                                      ) : (
                                        <Plus size={13} className="stroke-[2.5]" />
                                      )}
                                    </button>
                                  </div>
                                </td>

                                {/* 2. Project Name */}
                                {selectedFilter !== "Personal" && (
                                  <td className="py-4 px-4 text-left">
                                    <span
                                      className="text-slate-900 text-sm font-bold truncate max-w-[240px] block"
                                      title={
                                        note.projectName ||
                                        (isProject ? "Untitled Project" : "Personal Note")
                                      }
                                    >
                                      {note.projectName ||
                                        (isProject ? "-" : "Personal Note")}
                                    </span>
                                  </td>
                                )}

                                {/* 3. Title */}
                                <td className="py-4 px-4 text-left">
                                  <button
                                    type="button"
                                    onClick={() => openViewNote(note)}
                                    className="text-slate-800 hover:text-[#4318FF] text-sm font-semibold hover:underline transition-colors text-left cursor-pointer truncate max-w-[320px] block"
                                    title={note.title || "Untitled note"}
                                  >
                                    {note.title || "Untitled note"}
                                  </button>
                                </td>

                                {/* 4. Created by */}
                                <td className="py-4 px-4 text-left whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-slate-800 text-sm font-semibold">
                                      {formatDateOnly(createdDate)}
                                    </span>
                                    <span className="text-xs text-slate-500 font-medium truncate max-w-[180px]">
                                      Created by {capitalizeFirst(getAuthorDisplay(note.createdBy))}
                                    </span>
                                  </div>
                                </td>

                                {/* 5. Action */}
                                <td className="py-4 pl-2 pr-6 text-center whitespace-nowrap">
                                  <div className="inline-flex items-center justify-center gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => openViewNote(note)}
                                      title="View Note Details"
                                      className="p-2 rounded-lg bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 hover:text-[#3311CC] transition-colors cursor-pointer"
                                    >
                                      <Eye size={15} />
                                    </button>
                                    {canManageNotes ? (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => openEditModal(note)}
                                          title="Edit Note"
                                          className="p-2 rounded-lg bg-blue-50 text-[#4318FF] hover:bg-blue-100 transition-colors cursor-pointer"
                                        >
                                          <Pencil size={15} />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setNoteToDelete(note)}
                                          title="Delete Note"
                                          className="p-2 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                                        >
                                          <Trash2 size={15} />
                                        </button>
                                      </>
                                    ) : (
                                      <span className="text-xs text-slate-500 font-medium ml-1">
                                        View only
                                      </span>
                                    )}
                                  </div>
                                </td>
                              </tr>

                              {/* Sub-table below formatted when plus symbol is clicked */}
                              {isExpanded && (
                                <tr className="bg-gradient-to-r from-blue-50/30 via-indigo-50/20 to-purple-50/20 border-y border-blue-100 animate-fadeIn">
                                  <td colSpan={selectedFilter === "Personal" ? 4 : 5} className="py-3 px-6 sm:px-8">
                                    <div className="bg-white rounded-xl border border-blue-100 shadow-xs overflow-hidden p-3.5 space-y-3">
                                      {/* Sub-table header bar */}
                                      {canManageNotes && (
                                        <div className="flex items-center justify-end pb-2 border-b border-gray-100">
                                          <button
                                            type="button"
                                            onClick={() => openSubTableCreateNote(note.projectName || "", note.id, note.category)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-[#4318FF] hover:bg-[#3410d1] text-white shadow-xs transition-all cursor-pointer shrink-0"
                                            title={`Add ${isProject ? "project" : "personal"} note`}
                                          >
                                            <Plus size={13} className="stroke-[2.5]" />
                                            <span>Add Note</span>
                                          </button>
                                        </div>
                                      )}

                                      {/* Sub-table */}
                                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                                        <table className="w-full text-left border-collapse text-xs">
                                          <thead>
                                            <tr className="bg-[#4318FF] text-white font-bold uppercase tracking-wider">
                                              <th className="py-2.5 pl-4 pr-3 w-16 text-left whitespace-nowrap">SL NO</th>
                                              <th className="py-2.5 px-3 text-left whitespace-nowrap">Title</th>
                                              <th className="py-2.5 px-3 text-left w-48 whitespace-nowrap">Created By</th>
                                              <th className="py-2.5 pr-4 pl-2 text-center w-28 whitespace-nowrap">Actions</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-gray-100 bg-white">
                                            {childNotes.length === 0 ? (
                                              <tr>
                                                <td colSpan={4} className="py-6 text-center text-xs text-slate-400 font-medium">
                                                  No notes yet. Click <span className="font-bold text-[#4318FF]">+ Add Note</span> to add one.
                                                </td>
                                              </tr>
                                            ) : (
                                              childNotes.map((child, cIdx) => {
                                                const childCreatedDate = child.createdAt || child.updatedAt;
                                                return (
                                                  <tr key={child.id} className="hover:bg-blue-50/40 transition-colors">
                                                    <td className="py-2.5 pl-4 pr-2 font-bold text-slate-700">
                                                      {cIdx + 1}
                                                    </td>
                                                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                                                      <button
                                                        type="button"
                                                        onClick={() => openViewNote(child)}
                                                        className="text-slate-900 hover:text-[#4318FF] hover:underline text-left cursor-pointer truncate max-w-[280px] block"
                                                        title={child.title || "Untitled"}
                                                      >
                                                        {child.title || "Untitled"}
                                                      </button>
                                                    </td>
                                                    <td className="py-2.5 px-3 text-slate-600">
                                                      <div className="flex flex-col">
                                                        <span className="font-semibold text-slate-800">
                                                          {formatDateOnly(childCreatedDate)}
                                                        </span>
                                                        <span className="text-[10px] text-slate-500">
                                                          Created by {capitalizeFirst(getAuthorDisplay(child.createdBy))}
                                                        </span>
                                                      </div>
                                                    </td>
                                                    <td className="py-2.5 pr-4 pl-2 text-center">
                                                      <div className="inline-flex items-center justify-center gap-1.5">
                                                        <button
                                                          type="button"
                                                          onClick={() => openViewNote(child)}
                                                          title="View Note"
                                                          className="p-1 rounded-md bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 transition-colors cursor-pointer"
                                                        >
                                                          <Eye size={13} />
                                                        </button>
                                                        {canManageNotes && (
                                                          <>
                                                            <button
                                                              type="button"
                                                              onClick={() => openEditModal(child)}
                                                              title="Edit Note"
                                                              className="p-1 rounded-md bg-blue-50 text-[#4318FF] hover:bg-blue-100 transition-colors cursor-pointer"
                                                            >
                                                              <Pencil size={13} />
                                                            </button>
                                                            <button
                                                              type="button"
                                                              onClick={() => setNoteToDelete(child)}
                                                              title="Delete Note"
                                                              className="p-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer"
                                                            >
                                                              <Trash2 size={13} />
                                                            </button>
                                                          </>
                                                        )}
                                                      </div>
                                                    </td>
                                                  </tr>
                                                );
                                              })
                                            )}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </Fragment>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card List (shown below md breakpoint) */}
                  <div className="md:hidden">
                    <EmployeeNotesMobile
                      paginatedNotes={paginatedNotes}
                      allNotes={notes}
                      currentPage={currentPage}
                      itemsPerPage={itemsPerPage}
                      canManageNotes={canManageNotes}
                      expandedRowProjectNotes={expandedRowProjectNotes}
                      toggleRowProjectNotesExpand={toggleRowProjectNotesExpand}
                      openViewNote={openViewNote}
                      openEditModal={openEditModal}
                      setNoteToDelete={setNoteToDelete}
                      openSubTableCreateNote={openSubTableCreateNote}
                      uploadingNoteId={uploadingNoteId}
                      handleTableDirectUpload={handleTableDirectUpload}
                      handleTableRemoveFile={handleTableRemoveFile}
                      openFilePreview={openFilePreview}
                      downloadFile={downloadFile}
                      getAuthorDisplay={getAuthorDisplay}
                    />
                  </div>
                </>
              )}
            </div>

            {/* Bottom Pagination */}
            {filteredNotes.length > 0 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 border-t border-gray-100">
                <p className="text-sm text-slate-700 font-semibold">
                  Showing {startRecord} - {endRecord} of {filteredNotes.length} notes
                </p>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg border border-gray-200 text-[#2B3674] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="Previous Page"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-7 h-7 rounded-lg text-xs font-bold flex items-center justify-center transition-colors cursor-pointer ${currentPage === pageNum
                          ? "bg-[#4318FF] text-white shadow-sm"
                          : "text-[#2B3674] hover:bg-gray-100"
                          }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg border border-gray-200 text-[#2B3674] hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
                    aria-label="Next Page"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </div>

        </>
      )}

      {/* FILE PREVIEW MODAL */}
      {previewFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
          <div
            className={`bg-white rounded-2xl ${isMaximized ? "w-[96vw] h-[94vh]" : "max-w-4xl w-full h-[88vh]"
              } flex flex-col shadow-2xl border border-gray-100 overflow-hidden transition-all duration-200`}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-gray-100 bg-white shrink-0 z-10">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4318FF] flex items-center justify-center shrink-0">
                  {getFileIcon(previewFile.name)}
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-sm font-bold text-[#1B2559] truncate max-w-xs sm:max-w-md"
                    title={previewFile.name}
                  >
                    {previewFile.name}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-gray-500 font-medium mt-0.5">
                    <span>{formatFileSize(previewFile.size)}</span>
                    <span>&bull;</span>
                    <span className="uppercase font-bold text-[#4318FF]">
                      {previewFile.name.split(".").pop() || "FILE"}
                    </span>
                    {previewText !== null && (
                      <>
                        <span>&bull;</span>
                        <span className="text-slate-600 font-semibold">
                          {textLines.length} {textLines.length === 1 ? "line" : "lines"}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Header Actions */}
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                {/* CSV Table vs Text Toggle */}
                {csvRows && csvRows.length > 0 && (
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5 border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setPreviewTab("content")}
                      className={`px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${previewTab === "content"
                          ? "bg-white text-[#4318FF] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                      title="View Raw CSV Text"
                    >
                      Source
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewTab("table")}
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${previewTab === "table"
                          ? "bg-white text-[#4318FF] shadow-xs"
                          : "text-slate-600 hover:text-slate-900"
                        }`}
                      title="View CSV Table"
                    >
                      <TableIcon size={12} />
                      <span>Table</span>
                    </button>
                  </div>
                )}

                {/* Word Wrap Toggle for text */}
                {previewText !== null && previewTab === "content" && (
                  <button
                    type="button"
                    onClick={() => setIsWordWrap(!isWordWrap)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${isWordWrap
                        ? "bg-blue-50 text-[#4318FF] border-blue-200"
                        : "bg-white text-slate-600 border-gray-200 hover:bg-gray-50"
                      }`}
                    title={isWordWrap ? "Disable line wrap" : "Enable line wrap"}
                  >
                    <WrapText size={13} />
                    <span className="hidden sm:inline">Wrap</span>
                  </button>
                )}

                {/* Copy Text Button */}
                {previewText !== null && (
                  <button
                    type="button"
                    onClick={() => handleCopyText(previewText)}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-gray-200 text-slate-700 hover:bg-gray-50 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                    title="Copy file contents"
                  >
                    {isCopied ? (
                      <>
                        <Check size={13} className="text-emerald-600" />
                        <span className="text-emerald-600 hidden sm:inline">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} />
                        <span className="hidden sm:inline">Copy</span>
                      </>
                    )}
                  </button>
                )}

                {/* Maximize / Minimize Button */}
                <button
                  type="button"
                  onClick={() => setIsMaximized(!isMaximized)}
                  className="p-1.5 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors cursor-pointer"
                  title={isMaximized ? "Restore size" : "Maximize window"}
                >
                  {isMaximized ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>

                {/* Download Button */}
                {previewFile.dataUrl && (
                  <button
                    type="button"
                    onClick={() => downloadFile(previewFile)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-[#4318FF] hover:bg-blue-100 text-xs font-semibold transition-colors cursor-pointer"
                    title="Download file"
                  >
                    <Download size={14} />
                    <span className="hidden sm:inline">Download</span>
                  </button>
                )}

                {/* Close Button */}
                <button
                  type="button"
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
                  title="Close modal"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Modal Body / Viewer */}
            <div className="flex-1 min-h-0 flex flex-col bg-gray-50/50 overflow-hidden">
              {previewFile.dataUrl &&
                (previewFile.name.match(/\.(png|jpe?g|webp|gif|svg)$/i) ||
                  previewFile.type?.startsWith("image/")) ? (
                /* IMAGE VIEWER */
                <div className="flex-1 min-h-0 overflow-auto p-4 sm:p-6 flex flex-col items-center justify-center">
                  <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-sm max-w-full max-h-full flex flex-col items-center">
                    <img
                      src={previewFile.dataUrl}
                      alt={previewFile.name}
                      className="max-h-[70vh] max-w-full object-contain rounded-xl"
                    />
                    <p className="mt-2.5 text-xs text-slate-500 font-semibold">
                      {previewFile.name} &bull; {formatFileSize(previewFile.size)}
                    </p>
                  </div>
                </div>
              ) : previewFile.dataUrl &&
                (previewFile.name.toLowerCase().endsWith(".pdf") ||
                  previewFile.type === "application/pdf") ? (
                /* PDF VIEWER */
                <div className="flex-1 min-h-0 w-full h-full p-3 sm:p-4 flex flex-col">
                  <iframe
                    src={previewFile.dataUrl}
                    title={previewFile.name}
                    className="w-full flex-1 min-h-0 rounded-xl border border-gray-200 bg-white shadow-xs"
                  />
                </div>
              ) : csvRows && previewTab === "table" ? (
                /* CSV TABLE VIEWER */
                <div className="flex-1 min-h-0 p-3 sm:p-4 overflow-auto">
                  <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      {csvRows.length > 0 && (
                        <thead>
                          <tr className="bg-gray-50 border-b border-gray-200 text-slate-700 font-bold uppercase">
                            <th className="py-2.5 px-3 w-10 text-center text-slate-400">#</th>
                            {csvRows[0].map((header, hIdx) => (
                              <th key={hIdx} className="py-2.5 px-3 whitespace-nowrap">
                                {header || `Col ${hIdx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                      )}
                      <tbody className="divide-y divide-gray-100">
                        {csvRows.slice(1).map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-blue-50/30 transition-colors">
                            <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                              {rIdx + 1}
                            </td>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="py-2 px-3 text-slate-800 whitespace-nowrap">
                                {cell}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : previewText !== null ? (
                /* CODE & TEXT VIEWER - STARTS AT LINE 1 WITH NO NEGATIVE SCROLL */
                <div className="flex-1 min-h-0 flex flex-col p-3 sm:p-4 overflow-hidden">
                  <div className="flex-1 min-h-0 bg-white rounded-xl border border-gray-200 shadow-2xs overflow-auto flex text-xs sm:text-[13px] leading-relaxed font-mono">
                    {/* Line Numbers Gutter */}
                    <div className="select-none bg-slate-50 border-r border-gray-200 py-3 px-3 text-right text-slate-400 shrink-0 sticky left-0 z-10 font-mono text-[11px] sm:text-xs">
                      {textLines.map((_, i) => (
                        <div key={i} className="leading-6">
                          {i + 1}
                        </div>
                      ))}
                    </div>

                    {/* Text / Code Content */}
                    <div
                      className={`flex-1 py-3 px-4 min-w-0 font-mono text-slate-800 ${isWordWrap ? "whitespace-pre-wrap break-words" : "whitespace-pre"
                        }`}
                    >
                      {textLines.map((line, i) => (
                        <div key={i} className="leading-6">
                          {line || "\u00A0"}
                        </div>
                      ))}
                    </div>
                  </div>

                  {previewText.length > MAX_TEXT_PREVIEW_CHARS && (
                    <p className="text-[11px] text-gray-400 text-center pt-2 shrink-0">
                      Showing the first {MAX_TEXT_PREVIEW_CHARS.toLocaleString()} characters.
                      Download the file to see the complete contents.
                    </p>
                  )}
                </div>
              ) : (
                /* UNSUPPORTED FORMAT VIEWER */
                <div className="flex-1 min-h-0 p-8 flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 rounded-2xl bg-blue-50 text-[#4318FF] flex items-center justify-center mx-auto mb-3 shadow-2xs">
                    <FileText size={32} />
                  </div>
                  <h4 className="text-base font-bold text-slate-800 mb-1">{previewFile.name}</h4>
                  <p className="text-xs text-slate-500 mb-4 max-w-sm leading-relaxed">
                    This file format ({previewFile.name.split(".").pop()?.toUpperCase() || "File"})
                    cannot be previewed in the browser. Download it to view the full contents.
                  </p>
                  <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 text-slate-700 text-xs font-semibold mb-4">
                    <span>File Size: {formatFileSize(previewFile.size)}</span>
                  </div>
                  {previewFile.dataUrl ? (
                    <button
                      type="button"
                      onClick={() => downloadFile(previewFile)}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4318FF] text-white text-xs font-bold hover:bg-[#3410d1] transition-all shadow-sm cursor-pointer"
                    >
                      <Download size={14} />
                      Download File
                    </button>
                  ) : (
                    <p className="text-xs text-gray-400 italic">No file data available to download.</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}



      {/* ROW-LEVEL CREATE NOTE MODAL */}
      {isRowCreateNoteModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-5 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-gray-100 overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#4318FF] flex items-center justify-center shadow-xs">
                  <FileText size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1B2559]">
                    Create Project Note
                  </h3>
                  <p className="text-xs text-gray-500">
                    Add a new note for project:{" "}
                    <span className="font-semibold text-[#4318FF]">
                      {rowModalProjectName || "Project"}
                    </span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={closeRowCreateNoteModal}
                disabled={isRowModalSubmitting}
                className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Body */}
            <form
              onSubmit={handleRowModalSubmit}
              className="flex-1 overflow-y-auto px-6 py-5 space-y-4"
            >
              {/* Row: Project Name & Project Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Project Name */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black mb-1.5 uppercase tracking-wider">
                    Project Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rowModalProjectName}
                    onChange={(e) => {
                      setRowModalProjectName(e.target.value);
                      if (rowModalErrors.projectName) {
                        setRowModalErrors((prev) => ({ ...prev, projectName: undefined }));
                      }
                    }}
                    placeholder="Enter project name..."
                    className={`w-full px-3 py-1.5 text-sm font-medium font-sans rounded-xl border text-slate-800 placeholder:text-gray-400 transition-all h-[36px] ${rowModalErrors.projectName
                        ? "border-red-400 ring-2 ring-red-100 focus:outline-none"
                        : "border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 focus:outline-none"
                      }`}
                  />
                  {rowModalErrors.projectName && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      {rowModalErrors.projectName}
                    </p>
                  )}
                </div>

                {/* Project Title */}
                <div className="min-w-0">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black mb-1.5 uppercase tracking-wider">
                    Project Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={rowModalTitle}
                    onChange={(e) => {
                      setRowModalTitle(e.target.value);
                      if (rowModalErrors.title) {
                        setRowModalErrors((prev) => ({ ...prev, title: undefined }));
                      }
                    }}
                    placeholder="Enter project title..."
                    className={`w-full px-3 py-1.5 text-sm font-medium font-sans rounded-xl border text-slate-800 placeholder:text-gray-400 transition-all h-[36px] ${rowModalErrors.title
                        ? "border-red-400 ring-2 ring-red-100 focus:outline-none"
                        : "border-gray-200 focus:border-[#4318FF] focus:ring-2 focus:ring-[#4318FF]/15 focus:outline-none"
                      }`}
                  />
                  {rowModalErrors.title && (
                    <p className="mt-1 text-xs font-semibold text-red-500">
                      {rowModalErrors.title}
                    </p>
                  )}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs sm:text-[13px] font-bold font-sans text-black mb-1.5 uppercase tracking-wider">
                  Description
                </label>
                <RichTextEditor
                  initialValue={rowModalDescription}
                  onChange={(html) => setRowModalDescription(html)}
                  placeholder="Write your notes, key updates, documentation, or action items here..."
                />
              </div>

              {/* Files & Attachments */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs sm:text-[13px] font-bold font-sans text-black tracking-wider uppercase flex items-center gap-2">
                    <Paperclip size={15} className="text-[#4318FF]" />
                    <span>Files & Attachments</span>
                  </label>
                  {rowModalFiles.length > 0 && (
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                      {rowModalFiles.length} {rowModalFiles.length === 1 ? "file" : "files"} attached
                    </span>
                  )}
                </div>

                {/* Drop zone */}
                <div
                  onClick={() => rowModalFileInputRef.current?.click()}
                  className="border border-dashed border-gray-200 hover:border-[#4318FF] rounded-xl py-2 px-3 flex items-center justify-center gap-2.5 bg-gray-50/60 hover:bg-blue-50/30 transition-all cursor-pointer group text-center"
                >
                  <div className="w-7 h-7 rounded-lg bg-blue-50 group-hover:bg-blue-100 flex items-center justify-center text-[#4318FF] transition-colors shrink-0 shadow-2xs">
                    <UploadCloud size={16} />
                  </div>
                  <div className="text-left sm:text-center">
                    <p className="text-xs font-bold font-sans text-slate-800">
                      <span className="text-[#4318FF] underline underline-offset-2 font-extrabold">
                        Click to upload
                      </span>{" "}
                      or drag and drop multiple files
                      <span className="hidden md:inline text-[11px] text-slate-400 font-normal ml-2">
                        (PDF, Word, Excel, images, or documents)
                      </span>
                    </p>
                  </div>
                </div>

                <input
                  ref={rowModalFileInputRef}
                  type="file"
                  multiple
                  className="hidden"
                  onChange={handleRowModalFileUpload}
                />

                {/* Attached Files Grid List */}
                {rowModalFiles.length > 0 && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {rowModalFiles.map((file, fIdx) => (
                      <div
                        key={file.id || fIdx}
                        className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-blue-200 shadow-2xs transition-all"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#4318FF] flex items-center justify-center shrink-0">
                            {getFileIcon(file.name)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p
                              className="text-xs font-bold text-slate-900 truncate"
                              title={file.name}
                            >
                              {file.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-semibold">
                              {formatFileSize(file.size)} &bull;{" "}
                              {file.name.split(".").pop()?.toUpperCase() || "FILE"}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0 ml-2">
                          <button
                            type="button"
                            onClick={() => openFilePreview(file)}
                            title="Preview file"
                            className="p-1.5 rounded-lg text-gray-500 hover:text-[#4318FF] hover:bg-blue-50 transition-colors cursor-pointer"
                          >
                            <Eye size={14} />
                          </button>
                          {file.dataUrl && (
                            <button
                              type="button"
                              onClick={() => downloadFile(file)}
                              title="Download file"
                              className="p-1.5 rounded-lg text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors cursor-pointer"
                            >
                              <Download size={14} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => removeRowModalFile(file.id)}
                            title="Remove file"
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={closeRowCreateNoteModal}
                  disabled={isRowModalSubmitting}
                  className="w-full sm:w-auto px-4 py-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-gray-100 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRowModalSubmitting}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#4318FF] hover:bg-[#3410d1] disabled:opacity-50 text-white text-xs sm:text-sm font-bold px-5 py-1.5 rounded-xl shadow-sm shadow-[#4318FF]/25 transition-all cursor-pointer"
                >
                  {isRowModalSubmitting && <Loader2 size={15} className="animate-spin" />}
                  Save Project Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {noteToDelete && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-gray-100">
            <div className="w-11 h-11 rounded-full bg-red-50 text-red-600 flex items-center justify-center mb-3.5">
              <Trash2 size={20} />
            </div>

            <h3 className="text-base font-bold text-[#1B2559]">Delete Note</h3>

            <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
              Are you sure you want to delete &quot;
              <span className="font-semibold text-gray-700">
                {noteToDelete.title || "Untitled note"}
              </span>
              &quot;? This action cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2 mt-5">
              <button
                type="button"
                onClick={() => setNoteToDelete(null)}
                disabled={isDeleting}
                className="px-3.5 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                {isDeleting && <Loader2 size={13} className="animate-spin" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeNotes;