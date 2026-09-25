import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  Pin,
  Trash2,
  Edit3,
  Paperclip,
  Download,
  Eye,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Folder,
  X,
  CornerDownRight,
  Calendar,
  Briefcase,
  UserCheck,
  Tag,
  AlertTriangle,
  AlertCircle,
  Save,
  ArrowLeft,
  UploadCloud,
} from "lucide-react";
import { Modal, message, Popconfirm, Tooltip } from "antd";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  fetchNotes,
  fetchNoteStats,
  fetchProjectsList,
  fetchNoteById,
  createNote,
  updateNote,
  deleteNote,
  togglePinNote,
  createSubNote,
  uploadNoteAttachments,
  deleteNoteAttachment,
  downloadNoteAttachment,
  previewNoteAttachment,
  setActiveTab,
  setSelectedProject,
  setSearchQuery,
} from "../reducers/notes.reducer";
import { Note, NoteType } from "../types/notes.types";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import ExcelViewerModal from "../components/ExcelViewerModal";
import { openExcelInNewTab } from "../utils/excelViewer";

dayjs.extend(relativeTime);

// Helper to determine file category and styling
const getFileMeta = (fileName: string = "") => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["pdf"].includes(ext)) {
    return {
      type: "pdf",
      badgeColor: "bg-red-50 text-red-600 border-red-200",
      iconColor: "text-red-500",
      label: "PDF",
    };
  }
  if (["xlsx", "xls", "csv"].includes(ext)) {
    return {
      type: "excel",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      iconColor: "text-emerald-600",
      label: "XLS",
    };
  }
  if (["doc", "docx", "rtf", "odt"].includes(ext)) {
    return {
      type: "doc",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      iconColor: "text-blue-600",
      label: "DOC",
    };
  }
  if (["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext)) {
    return {
      type: "image",
      badgeColor: "bg-purple-50 text-purple-700 border-purple-200",
      iconColor: "text-purple-600",
      label: "IMG",
    };
  }
  if (["zip", "rar", "7z", "tar", "gz"].includes(ext)) {
    return {
      type: "archive",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      iconColor: "text-amber-600",
      label: "ZIP",
    };
  }
  if (["js", "ts", "jsx", "tsx", "json", "html", "css", "sql", "py", "java"].includes(ext)) {
    return {
      type: "code",
      badgeColor: "bg-cyan-50 text-cyan-700 border-cyan-200",
      iconColor: "text-cyan-600",
      label: ext.toUpperCase(),
    };
  }
  return {
    type: "file",
    badgeColor: "bg-slate-100 text-slate-700 border-slate-200",
    iconColor: "text-slate-600",
    label: ext ? ext.toUpperCase() : "FILE",
  };
};

// Generic document item interface
interface NoteDocumentItem {
  id?: number;
  key?: string;
  name: string;
  url?: string;
  file?: File;
  fileKey?: string;
  fileName?: string;
}

// Compact, elegant Attachment Chip for Note Cards & Rows
const NoteAttachmentChip: React.FC<{
  item: NoteDocumentItem;
  onPreview: (item: NoteDocumentItem) => void;
  onDownload: (item: NoteDocumentItem) => void;
  onDelete?: (item: NoteDocumentItem) => void;
  disabled?: boolean;
}> = ({ item, onPreview, onDownload, onDelete, disabled }) => {
  const displayName = item.name || item.fileName || "File";
  const meta = getFileMeta(displayName);

  return (
    <div
      onClick={(e) => {
        e.stopPropagation();
        onPreview(item);
      }}
      className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-white border border-slate-200/90 hover:border-[#4318FF]/50 rounded-xl shadow-xs hover:shadow-sm transition-all duration-150 cursor-pointer text-xs group"
      title={`${displayName} - Click to view`}
    >
      {/* File Extension Badge */}
      <span
        className={`px-1.5 py-0.5 rounded font-bold text-[10px] tracking-wider uppercase border shrink-0 ${meta.badgeColor}`}
      >
        {meta.label}
      </span>

      {/* File Name */}
      <span className="font-semibold text-slate-700 group-hover:text-[#4318FF] truncate max-w-[130px] sm:max-w-[180px] transition-colors">
        {displayName}
      </span>

      {/* Action Buttons */}
      <div
        className="flex items-center gap-1 shrink-0 ml-1"
        onClick={(e) => e.stopPropagation()}
      >
        <Tooltip title="View file in new tab">
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="p-1 text-slate-400 hover:text-[#4318FF] hover:bg-[#4318FF]/10 rounded-md transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip title="Download file">
          <button
            type="button"
            onClick={() => onDownload(item)}
            className="p-1 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        {onDelete && !disabled && (
          <Tooltip title="Remove file">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

// Sleek file item for Upload lists inside Create / Edit forms
const NoteUploadItem: React.FC<{
  item: NoteDocumentItem;
  onPreview: (item: NoteDocumentItem) => void;
  onDownload: (item: NoteDocumentItem) => void;
  onDelete?: (item: NoteDocumentItem) => void;
}> = ({ item, onPreview, onDownload, onDelete }) => {
  const displayName = item.name || item.fileName || "File";
  const meta = getFileMeta(displayName);
  const sizeFormatted = item.file
    ? item.file.size > 1024 * 1024
      ? `${(item.file.size / (1024 * 1024)).toFixed(1)} MB`
      : `${(item.file.size / 1024).toFixed(0)} KB`
    : null;

  return (
    <div className="flex items-center justify-between gap-3 p-2.5 bg-white rounded-xl border border-slate-200 hover:border-[#4318FF]/40 shadow-xs transition-all">
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <span
          className={`px-2 py-0.5 rounded-md font-bold text-[10px] tracking-wide uppercase border shrink-0 ${meta.badgeColor}`}
        >
          {meta.label}
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-xs text-slate-800 truncate" title={displayName}>
            {displayName}
          </p>
          {sizeFormatted && <span className="text-[10px] text-slate-400">{sizeFormatted}</span>}
        </div>
      </div>

      <div className="flex items-center gap-1 shrink-0">
        <Tooltip title="View">
          <button
            type="button"
            onClick={() => onPreview(item)}
            className="p-1.5 text-slate-400 hover:text-[#4318FF] hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        <Tooltip title="Download">
          <button
            type="button"
            onClick={() => onDownload(item)}
            className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </Tooltip>
        {onDelete && (
          <Tooltip title="Delete">
            <button
              type="button"
              onClick={() => onDelete(item)}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </Tooltip>
        )}
      </div>
    </div>
  );
};

export const NotesManagement: React.FC = () => {
  const dispatch = useAppDispatch();
  const {
    notes,
    activeTab,
    selectedProject,
    searchQuery,
    projects,
    loading,
    actionLoading,
  } = useAppSelector((state) => state.notes);

  const currentUser = useAppSelector((state) => state.user.currentUser);

  // Page Mode: 'list' (Main Table) | 'create' (Full Page) | 'edit' (Full Page) | 'view' (Full Page)
  const [pageMode, setPageMode] = useState<"list" | "create" | "edit" | "view">("list");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Expanded notes for accordion in table
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  // Active note for View and Edit full pages
  const [activeNote, setActiveNote] = useState<Note | null>(null);
  const [viewNoteLoading, setViewNoteLoading] = useState(false);

  // Sub-note Modals (Lightweight modals for adding/editing sub-notes)
  const [isSubNoteModalOpen, setIsSubNoteModalOpen] = useState(false);
  const [isEditSubNoteModalOpen, setIsEditSubNoteModalOpen] = useState(false);
  const [parentNoteForSubNote, setParentNoteForSubNote] = useState<Note | null>(null);
  const [editingSubNote, setEditingSubNote] = useState<Note | null>(null);

  // Delete Note Confirmation Modal (Extracts and lists sub-notes)
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{
    open: boolean;
    note: Note | null;
  }>({
    open: false,
    note: null,
  });

  // Image Preview Modal
  const [previewImageModal, setPreviewImageModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: "",
    title: "",
  });

  // Excel Spreadsheet Preview Modal
  const [excelViewerModal, setExcelViewerModal] = useState<{
    open: boolean;
    fileName: string;
    blob?: Blob | null;
    file?: File | null;
    onDownload?: () => void;
  }>({
    open: false,
    fileName: "",
    blob: null,
    file: null,
  });

  // Form State for Create / Edit Note
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "PROJECT" as NoteType,
    projectName: "",
    color: "#4318FF",
    isPinned: false,
    files: [] as File[],
  });

  // Form state for Sub-Note creation
  const [subNoteForm, setSubNoteForm] = useState({
    title: "",
    description: "",
    files: [] as File[],
  });

  // Form state for Sub-Note editing
  const [editSubNoteForm, setEditSubNoteForm] = useState({
    title: "",
    description: "",
    files: [] as File[],
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editFileInputRef = useRef<HTMLInputElement>(null);
  const subNoteFileInputRef = useRef<HTMLInputElement>(null);
  const editSubNoteFileInputRef = useRef<HTMLInputElement>(null);

  // Fetch initial data
  useEffect(() => {
    dispatch(fetchNoteStats());
    dispatch(fetchProjectsList());
    loadNotes();
  }, [activeTab, selectedProject, searchQuery]);

  // Reset page to 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedProject, searchQuery]);

  const loadNotes = () => {
    dispatch(
      fetchNotes({
        type: activeTab,
        projectName: activeTab === "PROJECT" ? selectedProject || undefined : undefined,
        search: searchQuery || undefined,
      })
    );
  };

  // Toggle accordion expand for a row
  const toggleExpand = (noteId: number) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  // Switch Tab (Personal vs Project)
  const handleTabSwitch = (tab: NoteType) => {
    dispatch(setActiveTab(tab));
    dispatch(setSelectedProject(""));
    setCurrentPage(1);
  };

  // Navigation: Go to Create Full Page
  const handleStartCreate = (defaultType: NoteType = activeTab) => {
    setFormData({
      title: "",
      description: "",
      type: defaultType,
      projectName: selectedProject || "",
      color: "#4318FF",
      isPinned: false,
      files: [],
    });
    setPageMode("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Navigation: Go to Edit Full Page
  const handleStartEdit = (note: Note) => {
    setActiveNote(note);
    setFormData({
      title: note.title,
      description: note.description || "",
      type: note.type,
      projectName: note.projectName || "",
      color: note.color || "#4318FF",
      isPinned: note.isPinned,
      files: [],
    });
    setPageMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Navigation: Go to View Full Page
  const handleStartView = async (note: Note) => {
    setActiveNote(note);
    setPageMode("view");
    setViewNoteLoading(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const detailedNote = await dispatch(fetchNoteById(note.id)).unwrap();
      if (detailedNote) {
        setActiveNote(detailedNote);
      }
    } catch (err: any) {
      console.error("Failed to fetch detailed note:", err);
    } finally {
      setViewNoteLoading(false);
    }
  };

  // Navigation: Back to Notes List
  const handleBackToList = () => {
    setPageMode("list");
    setActiveNote(null);
    loadNotes();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Handle File Selection for Create / Edit
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selected = Array.from(e.target.files);
      setFormData((prev) => ({
        ...prev,
        files: [...prev.files, ...selected],
      }));
    }
    e.target.value = "";
  };

  const handleRemoveSelectedFile = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  // Submit Create Note (Full Page)
  const handleSubmitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      message.error("Note title is required");
      return;
    }
    if (formData.type === "PROJECT" && !formData.projectName.trim()) {
      message.error("Project name is required for Project Notes");
      return;
    }

    try {
      await dispatch(
        createNote({
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          projectName: formData.type === "PROJECT" ? formData.projectName.trim() : undefined,
          color: formData.color,
          isPinned: formData.isPinned,
          files: formData.files,
        })
      ).unwrap();

      message.success("Note created successfully!");
      dispatch(fetchNoteStats());
      dispatch(fetchProjectsList());
      handleBackToList();
    } catch (err: any) {
      message.error(err || "Failed to create note");
    }
  };

  // Submit Edit Note (Full Page)
  const handleSubmitEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeNote) return;
    if (!formData.title.trim()) {
      message.error("Note title is required");
      return;
    }

    try {
      await dispatch(
        updateNote({
          id: activeNote.id,
          title: formData.title.trim(),
          description: formData.description.trim(),
          type: formData.type,
          projectName: formData.type === "PROJECT" ? formData.projectName.trim() : undefined,
          color: formData.color,
          isPinned: formData.isPinned,
        })
      ).unwrap();

      // If new files were selected, upload them
      if (formData.files.length > 0) {
        await dispatch(
          uploadNoteAttachments({
            noteId: activeNote.id,
            files: formData.files,
          })
        ).unwrap();
      }

      message.success("Note updated successfully!");
      handleBackToList();
    } catch (err: any) {
      message.error(err || "Failed to update note");
    }
  };

  // Open Delete Parent Note Confirmation Modal
  const handlePromptDeleteParentNote = (note: Note) => {
    setDeleteConfirmModal({ open: true, note });
  };

  // Confirm Delete Parent Note (with all sub-notes warning)
  const handleConfirmDeleteParentNote = async () => {
    if (!deleteConfirmModal.note) return;
    const noteId = deleteConfirmModal.note.id;
    try {
      await dispatch(deleteNote(noteId)).unwrap();
      message.success("Note and associated sub-notes deleted successfully");
      setDeleteConfirmModal({ open: false, note: null });
      if (pageMode === "view" && activeNote?.id === noteId) {
        handleBackToList();
      } else {
        dispatch(fetchNoteStats());
        loadNotes();
      }
    } catch (err: any) {
      message.error(err || "Failed to delete note");
    }
  };

  // Toggle Pin
  const handleTogglePin = async (id: number) => {
    try {
      await dispatch(togglePinNote(id)).unwrap();
      dispatch(fetchNoteStats());
      loadNotes();
      if (activeNote && activeNote.id === id) {
        setActiveNote((prev) => (prev ? { ...prev, isPinned: !prev.isPinned } : null));
      }
    } catch (err: any) {
      message.error(err || "Failed to update pin status");
    }
  };

  // Open Sub-Note Creation Modal
  const handleOpenSubNoteModal = (parent: Note) => {
    setParentNoteForSubNote(parent);
    setSubNoteForm({
      title: "",
      description: "",
      files: [],
    });
    setIsSubNoteModalOpen(true);
  };

  // Submit Sub-Note Creation
  const handleSubmitSubNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!parentNoteForSubNote) return;
    if (!subNoteForm.title.trim()) {
      message.error("Sub-note title is required");
      return;
    }

    try {
      await dispatch(
        createSubNote({
          parentId: parentNoteForSubNote.id,
          title: subNoteForm.title.trim(),
          description: subNoteForm.description.trim(),
          files: subNoteForm.files,
        })
      ).unwrap();

      message.success("Sub-note added successfully!");
      setIsSubNoteModalOpen(false);
      setExpandedNotes((prev) => ({ ...prev, [parentNoteForSubNote.id]: true }));

      // If active note is open on view page, refresh it
      if (pageMode === "view" && activeNote && activeNote.id === parentNoteForSubNote.id) {
        const detailed = await dispatch(fetchNoteById(activeNote.id)).unwrap();
        if (detailed) setActiveNote(detailed);
      }
      loadNotes();
    } catch (err: any) {
      message.error(err || "Failed to add sub-note");
    }
  };

  // Open Edit Sub-Note Modal
  const handleOpenEditSubNote = (subNote: Note) => {
    setEditingSubNote(subNote);
    setEditSubNoteForm({
      title: subNote.title,
      description: subNote.description || "",
      files: [],
    });
    setIsEditSubNoteModalOpen(true);
  };

  // Submit Edit Sub-Note
  const handleSubmitEditSubNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubNote) return;
    if (!editSubNoteForm.title.trim()) {
      message.error("Sub-note title is required");
      return;
    }

    try {
      await dispatch(
        updateNote({
          id: editingSubNote.id,
          title: editSubNoteForm.title.trim(),
          description: editSubNoteForm.description.trim(),
        })
      ).unwrap();

      if (editSubNoteForm.files.length > 0) {
        await dispatch(
          uploadNoteAttachments({
            noteId: editingSubNote.id,
            files: editSubNoteForm.files,
          })
        ).unwrap();
      }

      message.success("Sub-note updated successfully!");
      setIsEditSubNoteModalOpen(false);

      if (pageMode === "view" && activeNote) {
        const detailed = await dispatch(fetchNoteById(activeNote.id)).unwrap();
        if (detailed) setActiveNote(detailed);
      }
      loadNotes();
    } catch (err: any) {
      message.error(err || "Failed to update sub-note");
    }
  };

  // Delete Sub-note
  const handleDeleteSubNote = async (subNoteId: number) => {
    try {
      await dispatch(deleteNote(subNoteId)).unwrap();
      message.success("Sub-note deleted successfully");
      if (activeNote) {
        setActiveNote((prev) =>
          prev
            ? {
                ...prev,
                subNotes: prev.subNotes?.filter((s) => s.id !== subNoteId),
              }
            : null
        );
      }
      dispatch(fetchNoteStats());
      loadNotes();
    } catch (err: any) {
      message.error(err || "Failed to delete sub-note");
    }
  };

  // Delete Attachment
  const handleDeleteAttachment = async (noteId?: number, key?: string) => {
    if (!key) return;
    try {
      await dispatch(deleteNoteAttachment({ noteId, key })).unwrap();
      message.success("Attachment removed successfully");
      loadNotes();
      if (activeNote && noteId === activeNote.id) {
        setActiveNote((prev) =>
          prev
            ? {
                ...prev,
                attachments: prev.attachments?.filter((a) => (a.key || a.fileKey) !== key),
              }
            : null
        );
      }
    } catch (err: any) {
      message.error(err || "Failed to delete attachment");
    }
  };

  // Preview Attachment
  const handlePreviewAttachment = async (item: NoteDocumentItem) => {
    const displayName = item.name || item.fileName || "document";
    const ext = displayName.split(".").pop()?.toLowerCase() || "";
    const isImg = ["png", "jpg", "jpeg", "webp", "gif", "svg", "bmp"].includes(ext);
    const isExcel = ["xlsx", "xls", "csv"].includes(ext);

    // If local file object (pending upload)
    if (item.file) {
      if (isImg) {
        const localUrl = URL.createObjectURL(item.file);
        setPreviewImageModal({ open: true, url: localUrl, title: displayName });
      } else if (isExcel) {
        await openExcelInNewTab(item.file, displayName);
      } else {
        const localUrl = URL.createObjectURL(item.file);
        window.open(localUrl, "_blank");
      }
      return;
    }

    const key = item.key || item.fileKey;
    if (!key) {
      message.error("File key is not available");
      return;
    }

    const hide = message.loading(`Opening ${displayName}...`, 0);
    try {
      const response = await dispatch(previewNoteAttachment(key)).unwrap();
      hide();
      const contentType = response.headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });

      if (isImg) {
        const blobUrl = window.URL.createObjectURL(blob);
        setPreviewImageModal({ open: true, url: blobUrl, title: displayName });
        return;
      }

      if (isExcel) {
        await openExcelInNewTab(blob, displayName);
        return;
      }

      // For PDF and other previewable files, open in new tab
      const blobUrl = window.URL.createObjectURL(blob);
      const newWindow = window.open(blobUrl, "_blank");
      if (!newWindow) {
        const link = document.createElement("a");
        link.href = blobUrl;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }
    } catch (err: any) {
      hide();
      message.error(err || "Failed to preview file from server");
      console.error("Preview error:", err);
    }
  };

  // Download Attachment
  const handleDownloadAttachment = async (item: NoteDocumentItem) => {
    const displayName = item.name || item.fileName || "download";

    if (item.file) {
      const localUrl = URL.createObjectURL(item.file);
      const link = document.createElement("a");
      link.href = localUrl;
      link.download = displayName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(localUrl);
      return;
    }

    const key = item.key || item.fileKey;
    if (!key) {
      message.error("File key is not available");
      return;
    }

    const hide = message.loading(`Downloading ${displayName}...`, 0);
    try {
      await dispatch(downloadNoteAttachment({ key, fileName: displayName })).unwrap();
      hide();
      message.success(`Downloaded ${displayName}`);
    } catch (err: any) {
      hide();
      message.error(err || "Failed to download file");
    }
  };

  // Filtered Notes
  const displayNotes = useMemo(() => {
    return notes.filter((n) => {
      if (activeTab === "PERSONAL") return n.type === "PERSONAL";
      if (activeTab === "PROJECT") {
        if (selectedProject) return n.projectName?.toLowerCase() === selectedProject.toLowerCase();
        return n.type === "PROJECT";
      }
      return true;
    });
  }, [notes, activeTab, selectedProject]);

  // Paginated Notes
  const totalPages = Math.max(1, Math.ceil(displayNotes.length / pageSize));
  const paginatedNotes = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return displayNotes.slice(start, start + pageSize);
  }, [displayNotes, currentPage, pageSize]);

  // ==========================================
  // RENDER: FULL PAGE CREATE NOTE
  // ==========================================
  if (pageMode === "create") {
    return (
      <div className="w-full min-h-screen bg-[#F4F7FE] p-4 md:p-8 flex flex-col gap-6 font-sans">
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#4318FF] rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center"
              title="Back to Notes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Notes Management</span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-bold text-[#4318FF]">Create Note</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] tracking-tight mt-0.5">
                {formData.type === "PROJECT" ? "Create Project Note" : "Create Personal Note"}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Full-Page Form Card */}
        <form onSubmit={handleSubmitCreate} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Note Type Segmented Pill Toggle */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Note Type</label>
              <div className="flex items-center gap-3 max-w-md p-1 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "PROJECT" }))}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    formData.type === "PROJECT"
                      ? "bg-[#4318FF] text-white shadow-md shadow-[#4318FF]/20"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <Briefcase className="w-4 h-4" />
                  <span>Project Note</span>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, type: "PERSONAL" }))}
                  className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 transition cursor-pointer ${
                    formData.type === "PERSONAL"
                      ? "bg-[#4318FF] text-white shadow-md shadow-[#4318FF]/20"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <UserCheck className="w-4 h-4" />
                  <span>Personal Note</span>
                </button>
              </div>
            </div>

            {/* Project Name (Only for Project Notes) */}
            {formData.type === "PROJECT" && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Folder className="w-4 h-4 text-[#4318FF]" />
                  <span>Project Name <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
                  placeholder="e.g. Worksphere, Timesheet Portal, HRMS..."
                  className="w-full px-4 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition placeholder:text-slate-400"
                  required
                />
              </div>
            )}

            {/* Title Field with Character Count */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Tag className="w-4 h-4 text-[#4318FF]" />
                <span>Title <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Weekly Roadmap, Key Requirements, Meeting Notes..."
                  className="w-full px-4 pr-16 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition placeholder:text-slate-400"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                  {formData.title.length}/100
                </span>
              </div>
            </div>

            {/* Description / Content Field with Character Count */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <FileText className="w-4 h-4 text-[#4318FF]" />
                <span>Description / Content</span>
              </label>
              <div className="relative">
                <textarea
                  rows={6}
                  maxLength={2000}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Add your note content, details, markdown, or summary..."
                  className="w-full px-4 py-3 pb-8 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition resize-none placeholder:text-slate-400"
                />
                <span className="absolute right-3.5 bottom-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                  {formData.description.length}/2000
                </span>
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Paperclip className="w-4 h-4 text-[#4318FF]" />
                  <span>Upload Documents (Optional)</span>
                </label>
                <span className="text-xs text-slate-400">
                  Supports all file types (PDF, Excel, Word, Images, etc.)
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-[#4318FF]/60 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-6 transition flex flex-col items-center justify-center cursor-pointer text-center"
              >
                <UploadCloud className="w-8 h-8 text-[#4318FF] mb-2" />
                <span className="text-sm font-bold text-[#4318FF]">
                  Upload Documents ({formData.files.length}/10)
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Drag and drop files here or click to browse
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {formData.files.length === 0 ? (
                  <div className="w-full mt-3 py-2 px-4 bg-white/80 border border-dashed border-slate-200 rounded-xl text-xs text-slate-400 flex items-center gap-2 justify-center">
                    <FileText className="w-4 h-4 text-slate-400" />
                    <span>No files attached yet.</span>
                  </div>
                ) : null}
              </div>

              {/* Selected Files List with Inner Scrolling */}
              {formData.files.length > 0 && (
                <div
                  className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar"
                  onClick={(e) => e.stopPropagation()}
                >
                  {formData.files.map((file, idx) => (
                    <NoteUploadItem
                      key={`create-file-${idx}`}
                      item={{ name: file.name, file }}
                      onPreview={handlePreviewAttachment}
                      onDownload={handleDownloadAttachment}
                      onDelete={() => handleRemoveSelectedFile(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-8 py-3 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#4318FF]/25 hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{actionLoading ? "Saving..." : "Save Note"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // RENDER: FULL PAGE EDIT NOTE
  // ==========================================
  if (pageMode === "edit" && activeNote) {
    return (
      <div className="w-full min-h-screen bg-[#F4F7FE] p-4 md:p-8 flex flex-col gap-6 font-sans">
        {/* Top Navigation Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#4318FF] rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center"
              title="Back to Notes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Notes Management</span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-bold text-[#4318FF]">Edit Note</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] tracking-tight mt-0.5">
                Edit Note: {activeNote.title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleBackToList}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>

        {/* Full-Page Edit Form Card */}
        <form onSubmit={handleSubmitEdit} className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6 md:p-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {/* Project Name (Only for Project Notes) */}
            {activeNote.type === "PROJECT" && (
              <div>
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                  <Folder className="w-4 h-4 text-[#4318FF]" />
                  <span>Project Name <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  value={formData.projectName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition"
                  required
                />
              </div>
            )}

            {/* Title Field with Character Count */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Tag className="w-4 h-4 text-[#4318FF]" />
                <span>Title <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={100}
                  value={formData.title}
                  onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full px-4 pr-16 py-3 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition"
                  required
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                  {formData.title.length}/100
                </span>
              </div>
            </div>

            {/* Description / Content Field with Character Count */}
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <FileText className="w-4 h-4 text-[#4318FF]" />
                <span>Description / Content</span>
              </label>
              <div className="relative">
                <textarea
                  rows={6}
                  maxLength={2000}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 pb-8 bg-slate-50/50 hover:bg-white focus:bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition resize-none"
                />
                <span className="absolute right-3.5 bottom-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                  {formData.description.length}/2000
                </span>
              </div>
            </div>

            {/* Attachments Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Paperclip className="w-4 h-4 text-[#4318FF]" />
                  <span>Note Attachments</span>
                </label>
                <span className="text-xs text-slate-400">
                  Upload additional documents or remove existing ones
                </span>
              </div>

              {/* Upload Dropzone */}
              <div
                onClick={() => editFileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-[#4318FF]/60 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-6 transition flex flex-col items-center justify-center cursor-pointer text-center"
              >
                <UploadCloud className="w-8 h-8 text-[#4318FF] mb-2" />
                <span className="text-sm font-bold text-[#4318FF]">
                  Upload Additional Documents
                </span>
                <span className="text-xs text-slate-400 mt-1">
                  Click to browse files
                </span>

                <input
                  ref={editFileInputRef}
                  type="file"
                  multiple
                  accept="*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setFormData((prev) => ({
                        ...prev,
                        files: [...prev.files, ...Array.from(e.target.files!)],
                      }));
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>

              {/* Combined Files List with Inner Scrolling */}
              {((activeNote?.attachments && activeNote.attachments.length > 0) || formData.files.length > 0) && (
                <div
                  className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar"
                  onClick={(e) => e.stopPropagation()}
                >
                  {activeNote?.attachments?.map((att) => (
                    <NoteUploadItem
                      key={`existing-edit-${att.key || att.fileKey}`}
                      item={att}
                      onPreview={handlePreviewAttachment}
                      onDownload={handleDownloadAttachment}
                      onDelete={() => handleDeleteAttachment(activeNote.id, att.key || att.fileKey)}
                    />
                  ))}
                  {formData.files.map((file, idx) => (
                    <NoteUploadItem
                      key={`new-edit-${idx}`}
                      item={{ name: file.name, file }}
                      onPreview={handlePreviewAttachment}
                      onDownload={handleDownloadAttachment}
                      onDelete={() => handleRemoveSelectedFile(idx)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs md:text-sm rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-8 py-3 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#4318FF]/25 hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{actionLoading ? "Updating..." : "Update Note"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    );
  }

  // ==========================================
  // RENDER: FULL PAGE VIEW NOTE
  // ==========================================
  if (pageMode === "view" && activeNote) {
    return (
      <div className="w-full min-h-screen bg-[#F4F7FE] p-4 md:p-8 flex flex-col gap-6 font-sans">
        {/* Top Navigation & Action Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBackToList}
              className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-[#4318FF] rounded-xl border border-slate-200 transition cursor-pointer flex items-center justify-center"
              title="Back to Notes"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-400">Notes Management</span>
                <span className="text-xs text-slate-300">/</span>
                <span className="text-xs font-bold text-[#4318FF]">View Note Details</span>
              </div>
              <h1 className="text-xl md:text-2xl font-bold text-[#1B2559] tracking-tight mt-0.5">
                {activeNote.title}
              </h1>
            </div>
          </div>

          {/* Action Buttons: Pin, Add Sub-note, Edit Note, Delete Note */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => handleTogglePin(activeNote.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl transition cursor-pointer text-xs md:text-sm font-semibold ${
                activeNote.isPinned
                  ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              <Pin className={`w-4 h-4 ${activeNote.isPinned ? "fill-amber-500 text-amber-500" : ""}`} />
              <span>{activeNote.isPinned ? "Pinned" : "Pin Note"}</span>
            </button>

            <button
              onClick={() => handleOpenSubNoteModal(activeNote)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-[#4318FF] text-xs md:text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Sub-note</span>
            </button>

            <button
              onClick={() => handleStartEdit(activeNote)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs md:text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Note</span>
            </button>

            <button
              onClick={() => handlePromptDeleteParentNote(activeNote)}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs md:text-sm font-semibold rounded-xl transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Note</span>
            </button>
          </div>
        </div>

        {/* View Details Content Body */}
        {viewNoteLoading ? (
          <div className="py-24 flex flex-col items-center justify-center bg-white rounded-2xl border border-slate-100">
            <div className="w-8 h-8 border-3 border-[#4318FF] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-semibold text-slate-400 mt-3">Loading note details...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Note Meta Card */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-2 flex-wrap">
                  {activeNote.type === "PROJECT" ? (
                    <span className="px-3 py-1 bg-blue-50 border border-blue-100 text-[#4318FF] font-semibold text-xs rounded-xl flex items-center gap-1.5">
                      <Folder className="w-3.5 h-3.5" />
                      <span>{activeNote.projectName || "Project Note"}</span>
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 font-semibold text-xs rounded-xl flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Personal Note</span>
                    </span>
                  )}

                  {activeNote.isPinned && (
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-600 border border-amber-200 text-xs font-bold rounded-xl flex items-center gap-1">
                      <Pin className="w-3 h-3 fill-amber-500" />
                      Pinned
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Created: {dayjs(activeNote.createdAt).format("MMM D, YYYY h:mm A")}</span>
                  </div>
                  {activeNote.createdBy && (
                    <span>• Created by {activeNote.createdBy}</span>
                  )}
                </div>
              </div>

              {/* Title & Description */}
              <div className="pt-4 space-y-3">
                <h2 className="text-lg md:text-xl font-bold text-[#1B2559]">
                  {activeNote.title}
                </h2>

                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                    Description / Content
                  </div>
                  <div className="p-4 bg-slate-50/70 rounded-xl border border-slate-200/70 text-sm text-slate-700 font-normal leading-relaxed whitespace-pre-wrap">
                    {activeNote.description || <span className="text-slate-400 italic">No description provided.</span>}
                  </div>
                </div>

                {/* Attached Documents */}
                {activeNote.attachments && activeNote.attachments.length > 0 && (
                  <div className="pt-3">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-[#4318FF]" />
                      <span>Attached Documents ({activeNote.attachments.length})</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {activeNote.attachments.map((att) => (
                        <NoteAttachmentChip
                          key={att.key || att.fileKey}
                          item={att}
                          onPreview={handlePreviewAttachment}
                          onDownload={handleDownloadAttachment}
                          onDelete={() => handleDeleteAttachment(activeNote.id, att.key || att.fileKey)}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sub-notes Section */}
            <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-6">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div className="flex items-center gap-2">
                  <CornerDownRight className="w-5 h-5 text-[#4318FF]" />
                  <h3 className="text-base font-bold text-[#1B2559]">
                    Sub-notes ({activeNote.subNotes?.length || 0})
                  </h3>
                </div>
                <button
                  onClick={() => handleOpenSubNoteModal(activeNote)}
                  className="flex items-center gap-1.5 px-4 py-2 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Sub-note</span>
                </button>
              </div>

              {activeNote.subNotes && activeNote.subNotes.length > 0 ? (
                <div className="space-y-3">
                  {activeNote.subNotes.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="p-4 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-200/80 space-y-2.5 transition"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5 min-w-0 flex-1">
                          <span className="px-2 py-0.5 bg-[#4318FF]/10 text-[#4318FF] rounded-lg font-bold text-xs shrink-0 mt-0.5">
                            #{idx + 1}
                          </span>
                          <div>
                            <h4 className="font-bold text-sm text-[#1B2559]">{sub.title}</h4>
                            {sub.description && (
                              <p className="text-xs text-slate-600 mt-1 whitespace-pre-wrap leading-relaxed">
                                {sub.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Sub-note Actions */}
                        <div className="flex items-center gap-1 shrink-0">
                          <Tooltip title="Edit Sub-note">
                            <button
                              onClick={() => handleOpenEditSubNote(sub)}
                              className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          </Tooltip>

                          <Popconfirm
                            title="Delete Sub-note"
                            description="Are you sure you want to delete this sub-note?"
                            onConfirm={() => handleDeleteSubNote(sub.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                              title="Delete Sub-note"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </Popconfirm>
                        </div>
                      </div>

                      {/* Sub-note Attachments */}
                      {sub.attachments && sub.attachments.length > 0 && (
                        <div className="pl-7 pt-1 flex flex-wrap gap-2">
                          {sub.attachments.map((subAtt) => (
                            <NoteAttachmentChip
                              key={subAtt.key || subAtt.fileKey}
                              item={subAtt}
                              onPreview={handlePreviewAttachment}
                              onDownload={handleDownloadAttachment}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                  No sub-notes created yet. Click "+ Add Sub-note" above to create one.
                </div>
              )}
            </div>
          </div>
        )}

        {/* Retained Modals for Sub-notes and Delete */}
        <Modal
          open={isSubNoteModalOpen}
          onCancel={() => setIsSubNoteModalOpen(false)}
          footer={null}
          width={620}
          centered
          closable={false}
          styles={{ body: { padding: "24px" } }}
        >
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#4318FF] shrink-0">
                <CornerDownRight className="w-5 h-5 text-[#4318FF]" />
              </div>
              <div>
                <h2 className="text-base md:text-lg font-bold text-[#1B2559]">Add Sub-note</h2>
                <p className="text-xs text-slate-400 font-normal mt-0.5">
                  Add a sub-task, detail or observation to this note.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsSubNoteModalOpen(false)}
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmitSubNote} className="space-y-4 pt-3.5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <Tag className="w-3.5 h-3.5 text-[#4318FF]" />
                <span>Sub-note Title <span className="text-red-500">*</span></span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  maxLength={100}
                  value={subNoteForm.title}
                  onChange={(e) => setSubNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="e.g. Sub-note title, step, or item name..."
                  className="w-full px-3.5 pr-14 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#4318FF] transition placeholder:text-slate-400"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                  {subNoteForm.title.length}/100
                </span>
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
                <FileText className="w-3.5 h-3.5 text-[#4318FF]" />
                <span>Description / Details</span>
              </label>
              <div className="relative">
                <textarea
                  rows={3}
                  maxLength={1000}
                  value={subNoteForm.description}
                  onChange={(e) => setSubNoteForm((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Sub-note details or observations..."
                  className="w-full px-3.5 py-2.5 pb-6 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#4318FF] transition resize-none placeholder:text-slate-400"
                />
                <span className="absolute right-3 bottom-2 text-[11px] text-slate-400 font-medium pointer-events-none">
                  {subNoteForm.description.length}/1000
                </span>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Paperclip className="w-3.5 h-3.5 text-[#4318FF]" />
                  <span>Attachments (Optional)</span>
                </label>
                <span className="text-[11px] text-slate-400">
                  All formats (PDF, Excel, Word, Images, etc.)
                </span>
              </div>

              <div
                onClick={() => subNoteFileInputRef.current?.click()}
                className="border-2 border-dashed border-indigo-200 hover:border-[#4318FF]/60 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-4 transition flex flex-col items-center justify-center cursor-pointer text-center"
              >
                <UploadCloud className="w-6 h-6 text-[#4318FF] mb-1" />
                <span className="text-xs font-bold text-[#4318FF]">
                  Upload Documents ({subNoteForm.files.length}/10)
                </span>
                <span className="text-[11px] text-slate-400 mt-0.5">
                  Drag and drop files here or click to browse
                </span>

                <input
                  ref={subNoteFileInputRef}
                  type="file"
                  multiple
                  accept="*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setSubNoteForm((prev) => ({
                        ...prev,
                        files: [...prev.files, ...Array.from(e.target.files!)],
                      }));
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />

                {subNoteForm.files.length === 0 ? (
                  <div className="w-full mt-2.5 py-2 px-3 bg-white/80 border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>No files attached yet.</span>
                  </div>
                ) : (
                  <div
                    className="w-full mt-2.5 space-y-1.5 max-h-44 overflow-y-auto pr-1.5 custom-scrollbar text-left"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {subNoteForm.files.map((file, idx) => (
                      <NoteUploadItem
                        key={`sub-file-${idx}`}
                        item={{ name: file.name, file }}
                        onPreview={handlePreviewAttachment}
                        onDownload={handleDownloadAttachment}
                        onDelete={() =>
                          setSubNoteForm((prev) => ({
                            ...prev,
                            files: prev.files.filter((_, i) => i !== idx),
                          }))
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsSubNoteModalOpen(false)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#4318FF]/25 hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Sub-note</span>
              </button>
            </div>
          </form>
        </Modal>

        {/* Delete Parent Note Confirmation Modal */}
        <Modal
          open={deleteConfirmModal.open}
          onCancel={() => setDeleteConfirmModal({ open: false, note: null })}
          footer={null}
          width={580}
          centered
          closable={false}
          styles={{ body: { padding: "24px" } }}
        >
          {deleteConfirmModal.note && (
            <div className="space-y-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 shadow-sm">
                  <AlertTriangle className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-[#1B2559]">
                    Delete Note: "{deleteConfirmModal.note.title}"?
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Please review the contents that will be permanently removed.
                  </p>
                </div>
              </div>

              {deleteConfirmModal.note.subNotes && deleteConfirmModal.note.subNotes.length > 0 ? (
                <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200/80 space-y-2.5 text-amber-950">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>
                      Warning: This note contains {deleteConfirmModal.note.subNotes.length} nested sub-note{deleteConfirmModal.note.subNotes.length > 1 ? "s" : ""}
                    </span>
                  </div>

                  <p className="text-xs text-amber-900 leading-relaxed">
                    Deleting this note will <strong>permanently delete all of the following sub-notes</strong> and their attachments:
                  </p>

                  <div className="space-y-1.5 pl-2 max-h-40 overflow-y-auto pr-1">
                    {deleteConfirmModal.note.subNotes.map((sub, idx) => (
                      <div
                        key={sub.id || idx}
                        className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200/60 text-xs font-medium text-slate-800"
                      >
                        <span className="font-bold text-[#4318FF] shrink-0">#{idx + 1}</span>
                        <span className="font-semibold truncate">{sub.title}</span>
                        {sub.description && (
                          <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                            — {sub.description}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-[11px] text-amber-800 font-semibold pt-1">
                    ⚠️ This action is irreversible. All nested content will be permanently lost.
                  </p>
                </div>
              ) : (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to delete <strong>"{deleteConfirmModal.note.title}"</strong>
                  {deleteConfirmModal.note.attachments?.length
                    ? ` along with its ${deleteConfirmModal.note.attachments.length} attachment(s)`
                    : ""}
                  ? This action cannot be undone.
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDeleteConfirmModal({ open: false, note: null })}
                  className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDeleteParentNote}
                  className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-red-500/25 transition cursor-pointer flex items-center gap-1.5"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>
                    {deleteConfirmModal.note.subNotes && deleteConfirmModal.note.subNotes.length > 0
                      ? `Delete Note & All (${deleteConfirmModal.note.subNotes.length}) Sub-notes`
                      : "Delete Note"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* Excel Spreadsheet Preview Modal */}
        <ExcelViewerModal
          open={excelViewerModal.open}
          onClose={() =>
            setExcelViewerModal({
              open: false,
              fileName: "",
              blob: null,
              file: null,
            })
          }
          fileName={excelViewerModal.fileName}
          blob={excelViewerModal.blob}
          file={excelViewerModal.file}
          onDownload={excelViewerModal.onDownload}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN LIST / TABLE VIEW (MOCKUP)
  // ==========================================
  return (
    <div className="w-full min-h-screen bg-[#F4F7FE] p-4 md:p-8 flex flex-col gap-6 font-sans">
      {/* Top Header Strip: Page Title & Top-Right Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B2559] tracking-tight">
            {activeTab === "PROJECT" ? "Project Notes" : "Personal Notes"}
          </h1>
        </div>

        {/* Two Top-Right Action Buttons matching user mockups */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleStartCreate("PROJECT")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#4318FF]/20 hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project Note</span>
          </button>

          <button
            onClick={() => handleStartCreate("PERSONAL")}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border-2 border-[#4318FF] hover:bg-indigo-50 text-[#4318FF] font-semibold text-xs md:text-sm rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Personal Note</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar Card */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        {/* Search Input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search notes..."
            className="w-full pl-10 pr-9 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition placeholder:text-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => dispatch(setSearchQuery(""))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Dropdown (Project Notes / Personal Notes + Project Selector) */}
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => handleTabSwitch(e.target.value as NoteType)}
              className="px-4 py-2.5 pr-9 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition cursor-pointer appearance-none shadow-xs"
            >
              <option value="PROJECT">Project Notes</option>
              <option value="PERSONAL">Personal Notes</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {activeTab === "PROJECT" && projects.length > 0 && (
            <div className="relative">
              <select
                value={selectedProject}
                onChange={(e) => dispatch(setSelectedProject(e.target.value))}
                className="px-4 py-2.5 pr-9 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-[#4318FF]/20 focus:border-[#4318FF] transition cursor-pointer appearance-none shadow-xs"
              >
                <option value="">All Projects</option>
                {projects.map((proj) => (
                  <option key={proj} value={proj}>
                    {proj}
                  </option>
                ))}
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          )}
        </div>
      </div>

      {/* Main Table Container matching mockups */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-3 border-[#4318FF]/20 border-t-[#4318FF] rounded-full animate-spin"></div>
            <span className="mt-3 text-xs font-medium text-slate-500">Loading notes...</span>
          </div>
        ) : displayNotes.length === 0 ? (
          /* Empty State matching Image 2 */
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 bg-indigo-50 text-[#4318FF] rounded-2xl flex items-center justify-center mb-4 shadow-xs">
              <FileText className="w-8 h-8 text-[#4318FF]" />
            </div>
            <h3 className="text-base md:text-lg font-bold text-[#1B2559] mb-1">No matching notes found</h3>
            <p className="text-slate-400 text-xs md:text-sm max-w-sm mb-6">
              Try clearing your search query or switching filters...
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleStartCreate(activeTab)}
                className="flex items-center gap-1.5 px-4 py-2 bg-[#4318FF] text-white text-xs font-semibold rounded-xl shadow hover:bg-[#320fe0] transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Create {activeTab === "PROJECT" ? "Project Note" : "Personal Note"}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Solid Purple Table Header matching mockup */}
              <thead>
                <tr className="bg-[#4318FF] text-white text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-5 text-center w-24">SL NO</th>
                  {activeTab === "PROJECT" ? (
                    <>
                      <th className="py-4 px-6">PROJECT NAME</th>
                      <th className="py-4 px-6">TITLE</th>
                    </>
                  ) : (
                    <>
                      <th className="py-4 px-6">TITLE</th>
                      <th className="py-4 px-6">DESCRIPTION</th>
                    </>
                  )}
                  <th className="py-4 px-6">CREATED BY</th>
                  <th className="py-4 px-6 text-center w-36">ACTION</th>
                </tr>
              </thead>

              {/* Table Rows */}
              <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700 font-medium">
                {paginatedNotes.map((note, index) => {
                  const slNo = (currentPage - 1) * pageSize + index + 1;
                  const isExpanded = !!expandedNotes[note.id];
                  const hasSubNotes = note.subNotes && note.subNotes.length > 0;
                  const hasAttachments = note.attachments && note.attachments.length > 0;

                  return (
                    <React.Fragment key={note.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        {/* SL NO with [+] / [-] Expand Button */}
                        <td className="py-4 px-5">
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-bold text-slate-800">{slNo}</span>
                            <button
                              type="button"
                              onClick={() => toggleExpand(note.id)}
                              className={`w-6 h-6 rounded border flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                                isExpanded
                                  ? "border-[#4318FF] bg-[#4318FF] text-white"
                                  : "border-slate-300 hover:border-[#4318FF] text-slate-600 hover:text-[#4318FF] bg-white shadow-xs"
                              }`}
                              title={isExpanded ? "Collapse Details & Sub-notes" : "Expand Details & Sub-notes"}
                            >
                              {isExpanded ? "−" : "+"}
                            </button>
                          </div>
                        </td>

                        {/* Project Name & Title (for Project Notes) */}
                        {activeTab === "PROJECT" ? (
                          <>
                            <td className="py-4 px-6 font-bold text-slate-800">
                              {note.projectName || "Worksphere"}
                            </td>
                            <td className="py-4 px-6">
                              <span
                                onClick={() => handleStartView(note)}
                                className="font-semibold text-slate-800 hover:text-[#4318FF] transition cursor-pointer"
                              >
                                {note.title}
                              </span>
                            </td>
                          </>
                        ) : (
                          /* Title & Description (for Personal Notes) */
                          <>
                            <td className="py-4 px-6 font-bold text-slate-800">
                              <span
                                onClick={() => handleStartView(note)}
                                className="hover:text-[#4318FF] transition cursor-pointer"
                              >
                                {note.title}
                              </span>
                            </td>
                            <td className="py-4 px-6 text-slate-500 max-w-xs truncate">
                              {note.description || "—"}
                            </td>
                          </>
                        )}

                        {/* Created By & Date */}
                        <td className="py-4 px-6 text-xs text-slate-500">
                          <div className="font-semibold text-slate-800">
                            {dayjs(note.createdAt).format("MMM D, YYYY")}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-0.5">
                            Created by {note.createdBy || currentUser?.aliasLoginName || currentUser?.loginId || "Employee"}
                          </div>
                        </td>

                        {/* Action Icons matching mockup */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Button -> Full Page View */}
                            <Tooltip title="View Full Page">
                              <button
                                onClick={() => handleStartView(note)}
                                className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </Tooltip>

                            {/* Edit Button -> Full Page Edit */}
                            <Tooltip title="Edit Note">
                              <button
                                onClick={() => handleStartEdit(note)}
                                className="p-2 bg-purple-50 hover:bg-purple-100 text-[#4318FF] rounded-lg transition cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            </Tooltip>

                            {/* Delete Button -> Delete Confirmation Modal */}
                            <Tooltip title="Delete Note">
                              <button
                                onClick={() => handlePromptDeleteParentNote(note)}
                                className="p-2 bg-red-50 hover:bg-red-100 text-red-500 rounded-lg transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </Tooltip>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Sub-notes & Attachments Panel */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <td colSpan={5} className="p-4 md:p-6">
                            <div className="bg-white rounded-xl border border-slate-200/80 p-4 space-y-4 shadow-xs">
                              {/* Full Note Description */}
                              {note.description && (
                                <div>
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                                    Description
                                  </span>
                                  <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                    {note.description}
                                  </p>
                                </div>
                              )}

                              {/* Attached Documents */}
                              {hasAttachments && (
                                <div>
                                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                                    Attached Documents ({note.attachments!.length})
                                  </span>
                                  <div className="flex flex-wrap gap-2">
                                    {note.attachments!.map((att) => (
                                      <NoteAttachmentChip
                                        key={att.key || att.fileKey}
                                        item={att}
                                        onPreview={handlePreviewAttachment}
                                        onDownload={handleDownloadAttachment}
                                        onDelete={() => handleDeleteAttachment(note.id, att.key || att.fileKey)}
                                      />
                                    ))}
                                  </div>
                                </div>
                              )}

                              {/* Nested Sub-notes Section */}
                              <div className="pt-2 border-t border-slate-100">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="text-xs font-bold text-[#1B2559] flex items-center gap-1.5">
                                    <CornerDownRight className="w-4 h-4 text-[#4318FF]" />
                                    <span>Sub-notes ({note.subNotes?.length || 0})</span>
                                  </span>
                                  <button
                                    onClick={() => handleOpenSubNoteModal(note)}
                                    className="flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4318FF] text-xs font-semibold rounded-lg transition cursor-pointer"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Add Sub-note</span>
                                  </button>
                                </div>

                                {hasSubNotes ? (
                                  <div className="space-y-2">
                                    {note.subNotes!.map((sub, sIdx) => (
                                      <div
                                        key={sub.id || sIdx}
                                        className="p-3 bg-slate-50 rounded-lg border border-slate-200/70 flex flex-col md:flex-row md:items-center justify-between gap-2"
                                      >
                                        <div className="min-w-0 flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="px-1.5 py-0.5 bg-[#4318FF]/10 text-[#4318FF] font-bold text-[10px] rounded">
                                              #{sIdx + 1}
                                            </span>
                                            <span className="font-bold text-xs text-slate-800">{sub.title}</span>
                                          </div>
                                          {sub.description && (
                                            <p className="text-[11px] text-slate-500 mt-1 pl-6">
                                              {sub.description}
                                            </p>
                                          )}

                                          {/* Sub-note Attachments */}
                                          {sub.attachments && sub.attachments.length > 0 && (
                                            <div className="pl-6 pt-1.5 flex flex-wrap gap-1.5">
                                              {sub.attachments.map((sAtt) => (
                                                <NoteAttachmentChip
                                                  key={sAtt.key || sAtt.fileKey}
                                                  item={sAtt}
                                                  onPreview={handlePreviewAttachment}
                                                  onDownload={handleDownloadAttachment}
                                                />
                                              ))}
                                            </div>
                                          )}
                                        </div>

                                        <div className="flex items-center gap-1 self-end md:self-auto shrink-0">
                                          <button
                                            onClick={() => handleOpenEditSubNote(sub)}
                                            className="p-1 text-slate-400 hover:text-blue-500 rounded transition cursor-pointer"
                                            title="Edit Sub-note"
                                          >
                                            <Edit3 className="w-3.5 h-3.5" />
                                          </button>
                                          <Popconfirm
                                            title="Delete sub-note?"
                                            onConfirm={() => handleDeleteSubNote(sub.id)}
                                            okText="Delete"
                                            cancelText="Cancel"
                                            okButtonProps={{ danger: true }}
                                          >
                                            <button
                                              className="p-1 text-slate-400 hover:text-red-500 rounded transition cursor-pointer"
                                              title="Delete sub-note"
                                            >
                                              <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                          </Popconfirm>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="p-3 bg-slate-50/50 rounded-lg border border-dashed border-slate-200 text-xs text-slate-400 text-center">
                                    No sub-notes added yet. Click "+ Add Sub-note" to create one.
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Bottom Pagination matching mockup */}
        {!loading && displayNotes.length > 0 && (
          <div className="p-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <div>
              Showing {Math.min((currentPage - 1) * pageSize + 1, displayNotes.length)} -{" "}
              {Math.min(currentPage * pageSize, displayNotes.length)} of {displayNotes.length} notes
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
                <button
                  key={pageNum}
                  type="button"
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg font-bold text-xs flex items-center justify-center transition cursor-pointer ${
                    currentPage === pageNum
                      ? "bg-[#4318FF] text-white shadow-xs"
                      : "border border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
                  }`}
                >
                  {pageNum}
                </button>
              ))}

              <button
                type="button"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="w-8 h-8 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center justify-center transition cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Retained Modals: Sub-notes, Delete confirmation, Image and Excel previews */}
      <Modal
        open={isSubNoteModalOpen}
        onCancel={() => setIsSubNoteModalOpen(false)}
        footer={null}
        width={620}
        centered
        closable={false}
        styles={{ body: { padding: "24px" } }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#4318FF] shrink-0">
              <CornerDownRight className="w-5 h-5 text-[#4318FF]" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-[#1B2559]">Add Sub-note</h2>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                Add a sub-task, detail or observation to this note.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsSubNoteModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitSubNote} className="space-y-4 pt-3.5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-[#4318FF]" />
              <span>Sub-note Title <span className="text-red-500">*</span></span>
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={100}
                value={subNoteForm.title}
                onChange={(e) => setSubNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="e.g. Sub-note title, step, or item name..."
                className="w-full px-3.5 pr-14 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#4318FF] transition placeholder:text-slate-400"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                {subNoteForm.title.length}/100
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-[#4318FF]" />
              <span>Description / Details</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                maxLength={1000}
                value={subNoteForm.description}
                onChange={(e) => setSubNoteForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Sub-note details or observations..."
                className="w-full px-3.5 py-2.5 pb-6 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#4318FF] transition resize-none placeholder:text-slate-400"
              />
              <span className="absolute right-3 bottom-2 text-[11px] text-slate-400 font-medium pointer-events-none">
                {subNoteForm.description.length}/1000
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Paperclip className="w-3.5 h-3.5 text-[#4318FF]" />
                <span>Attachments (Optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                All formats (PDF, Excel, Word, Images, etc.)
              </span>
            </div>

            <div
              onClick={() => subNoteFileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-[#4318FF]/60 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-4 transition flex flex-col items-center justify-center cursor-pointer text-center"
            >
              <UploadCloud className="w-6 h-6 text-[#4318FF] mb-1" />
              <span className="text-xs font-bold text-[#4318FF]">
                Upload Documents ({subNoteForm.files.length}/10)
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Drag and drop files here or click to browse
              </span>

              <input
                ref={subNoteFileInputRef}
                type="file"
                multiple
                accept="*"
                onChange={(e) => {
                  if (e.target.files) {
                    setSubNoteForm((prev) => ({
                      ...prev,
                      files: [...prev.files, ...Array.from(e.target.files!)],
                    }));
                  }
                  e.target.value = "";
                }}
                className="hidden"
              />

              {subNoteForm.files.length === 0 ? (
                <div className="w-full mt-2.5 py-2 px-3 bg-white/80 border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>No files attached yet.</span>
                </div>
              ) : (
                <div
                  className="w-full mt-2.5 space-y-1.5 max-h-44 overflow-y-auto pr-1.5 custom-scrollbar text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {subNoteForm.files.map((file, idx) => (
                    <NoteUploadItem
                      key={`sub-file-${idx}`}
                      item={{ name: file.name, file }}
                      onPreview={handlePreviewAttachment}
                      onDownload={handleDownloadAttachment}
                      onDelete={() =>
                        setSubNoteForm((prev) => ({
                          ...prev,
                          files: prev.files.filter((_, i) => i !== idx),
                        }))
                      }
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsSubNoteModalOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#4318FF]/25 hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Sub-note</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Sub-Note Modal */}
      <Modal
        open={isEditSubNoteModalOpen}
        onCancel={() => setIsEditSubNoteModalOpen(false)}
        footer={null}
        width={620}
        centered
        closable={false}
        styles={{ body: { padding: "24px" } }}
      >
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-[#4318FF] shrink-0">
              <Edit3 className="w-5 h-5 text-[#4318FF]" />
            </div>
            <div>
              <h2 className="text-base md:text-lg font-bold text-[#1B2559]">Edit Sub-note</h2>
              <p className="text-xs text-slate-400 font-normal mt-0.5">
                Update sub-note title, description and manage attachments.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEditSubNoteModalOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmitEditSubNote} className="space-y-4 pt-3.5 max-h-[75vh] overflow-y-auto pr-1 custom-scrollbar">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <Tag className="w-3.5 h-3.5 text-[#4318FF]" />
              <span>Sub-note Title <span className="text-red-500">*</span></span>
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={100}
                value={editSubNoteForm.title}
                onChange={(e) => setEditSubNoteForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3.5 pr-14 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#4318FF] transition placeholder:text-slate-400"
                required
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] text-slate-400 font-medium pointer-events-none">
                {editSubNoteForm.title.length}/100
              </span>
            </div>
          </div>

          <div>
            <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700 mb-1.5">
              <FileText className="w-3.5 h-3.5 text-[#4318FF]" />
              <span>Description / Details</span>
            </label>
            <div className="relative">
              <textarea
                rows={3}
                maxLength={1000}
                value={editSubNoteForm.description}
                onChange={(e) => setEditSubNoteForm((prev) => ({ ...prev, description: e.target.value }))}
                className="w-full px-3.5 py-2.5 pb-6 bg-white border border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-[#4318FF] transition resize-none"
              />
              <span className="absolute right-3 bottom-2 text-[11px] text-slate-400 font-medium pointer-events-none">
                {editSubNoteForm.description.length}/1000
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Paperclip className="w-3.5 h-3.5 text-[#4318FF]" />
                <span>Attachments (Optional)</span>
              </label>
              <span className="text-[11px] text-slate-400">
                All formats (PDF, Excel, Word, Images, etc.)
              </span>
            </div>

            <div
              onClick={() => editSubNoteFileInputRef.current?.click()}
              className="border-2 border-dashed border-indigo-200 hover:border-[#4318FF]/60 bg-indigo-50/20 hover:bg-indigo-50/40 rounded-2xl p-4 transition flex flex-col items-center justify-center cursor-pointer text-center"
            >
              <UploadCloud className="w-6 h-6 text-[#4318FF] mb-1" />
              <span className="text-xs font-bold text-[#4318FF]">
                Upload Documents ({editSubNoteForm.files.length + (editingSubNote?.attachments?.length || 0)}/10)
              </span>
              <span className="text-[11px] text-slate-400 mt-0.5">
                Drag and drop files here or click to browse
              </span>

              <input
                ref={editSubNoteFileInputRef}
                type="file"
                multiple
                accept="*"
                onChange={(e) => {
                  if (e.target.files) {
                    setEditSubNoteForm((prev) => ({
                      ...prev,
                      files: [...prev.files, ...Array.from(e.target.files!)],
                    }));
                  }
                  e.target.value = "";
                }}
                className="hidden"
              />

              {((editingSubNote?.attachments && editingSubNote.attachments.length > 0) || editSubNoteForm.files.length > 0) ? (
                <div
                  className="w-full mt-2.5 space-y-1.5 max-h-44 overflow-y-auto pr-1.5 custom-scrollbar text-left"
                  onClick={(e) => e.stopPropagation()}
                >
                  {editingSubNote?.attachments?.map((att) => (
                    <NoteUploadItem
                      key={`sub-att-${att.key || att.fileKey}`}
                      item={att}
                      onPreview={handlePreviewAttachment}
                      onDownload={handleDownloadAttachment}
                      onDelete={() => handleDeleteAttachment(editingSubNote.id, att.key || att.fileKey)}
                    />
                  ))}
                  {editSubNoteForm.files.map((file, idx) => (
                    <NoteUploadItem
                      key={`sub-new-file-${idx}`}
                      item={{ name: file.name, file }}
                      onPreview={handlePreviewAttachment}
                      onDownload={handleDownloadAttachment}
                      onDelete={() =>
                        setEditSubNoteForm((prev) => ({
                          ...prev,
                          files: prev.files.filter((_, i) => i !== idx),
                        }))
                      }
                    />
                  ))}
                </div>
              ) : (
                <div className="w-full mt-2.5 py-2 px-3 bg-white/80 border border-dashed border-slate-200 rounded-xl text-[11px] text-slate-400 flex items-center gap-1.5 justify-center">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>No files attached yet.</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsEditSubNoteModalOpen(false)}
              className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs rounded-xl shadow-md shadow-[#4318FF]/25 hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Update Sub-note</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Parent Note Confirmation Modal */}
      <Modal
        open={deleteConfirmModal.open}
        onCancel={() => setDeleteConfirmModal({ open: false, note: null })}
        footer={null}
        width={580}
        centered
        closable={false}
        styles={{ body: { padding: "24px" } }}
      >
        {deleteConfirmModal.note && (
          <div className="space-y-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0 shadow-sm">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1B2559]">
                  Delete Note: "{deleteConfirmModal.note.title}"?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Please review the contents that will be permanently removed.
                </p>
              </div>
            </div>

            {deleteConfirmModal.note.subNotes && deleteConfirmModal.note.subNotes.length > 0 ? (
              <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200/80 space-y-2.5 text-amber-950">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-800">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>
                    Warning: This note contains {deleteConfirmModal.note.subNotes.length} nested sub-note{deleteConfirmModal.note.subNotes.length > 1 ? "s" : ""}
                  </span>
                </div>

                <p className="text-xs text-amber-900 leading-relaxed">
                  Deleting this note will <strong>permanently delete all of the following sub-notes</strong> and their attachments:
                </p>

                <div className="space-y-1.5 pl-2 max-h-40 overflow-y-auto pr-1">
                  {deleteConfirmModal.note.subNotes.map((sub, idx) => (
                    <div
                      key={sub.id || idx}
                      className="flex items-center gap-2 bg-white/80 px-3 py-1.5 rounded-lg border border-amber-200/60 text-xs font-medium text-slate-800"
                    >
                      <span className="font-bold text-[#4318FF] shrink-0">#{idx + 1}</span>
                      <span className="font-semibold truncate">{sub.title}</span>
                      {sub.description && (
                        <span className="text-[11px] text-slate-400 truncate max-w-[150px]">
                          — {sub.description}
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <p className="text-[11px] text-amber-800 font-semibold pt-1">
                  ⚠️ This action is irreversible. All nested content will be permanently lost.
                </p>
              </div>
            ) : (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 leading-relaxed">
                Are you sure you want to delete <strong>"{deleteConfirmModal.note.title}"</strong>
                {deleteConfirmModal.note.attachments?.length
                  ? ` along with its ${deleteConfirmModal.note.attachments.length} attachment(s)`
                  : ""}
                ? This action cannot be undone.
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setDeleteConfirmModal({ open: false, note: null })}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteParentNote}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md shadow-red-500/25 transition cursor-pointer flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>
                  {deleteConfirmModal.note.subNotes && deleteConfirmModal.note.subNotes.length > 0
                    ? `Delete Note & All (${deleteConfirmModal.note.subNotes.length}) Sub-notes`
                    : "Delete Note"}
                </span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={previewImageModal.open}
        title={previewImageModal.title}
        footer={null}
        onCancel={() => setPreviewImageModal({ open: false, url: "", title: "" })}
        width={720}
        centered
        styles={{
          body: {
            padding: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            backgroundColor: "#000",
            borderRadius: "0 0 8px 8px",
          },
        }}
      >
        <img
          alt="preview"
          style={{
            maxWidth: "100%",
            maxHeight: "75vh",
            objectFit: "contain",
          }}
          src={previewImageModal.url}
        />
      </Modal>

      {/* Excel Spreadsheet Preview Modal */}
      <ExcelViewerModal
        open={excelViewerModal.open}
        onClose={() =>
          setExcelViewerModal({
            open: false,
            fileName: "",
            blob: null,
            file: null,
          })
        }
        fileName={excelViewerModal.fileName}
        blob={excelViewerModal.blob}
        file={excelViewerModal.file}
        onDownload={excelViewerModal.onDownload}
      />
    </div>
  );
};

export default NotesManagement;
