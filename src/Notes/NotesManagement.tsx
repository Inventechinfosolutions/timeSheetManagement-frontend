import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit3,
  Paperclip,
  Download,
  Eye,
  ChevronDown,
  X,
  ArrowLeft,
  UploadCloud,
  CheckCircle2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  FileCode,
  Palette,
  Highlighter,
  GripVertical,
  FolderInput,
  CornerDownRight,
  Folder,
  Calendar,
  User,
  Copy,
  Check,
} from "lucide-react";
import { Modal, message, Popconfirm, Dropdown, Popover, type MenuProps } from "antd";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAppDispatch, useAppSelector } from "../hooks";
import {
  fetchNotes,
  fetchNoteStats,
  fetchProjectsList,
  fetchNoteById,
  createNote,
  updateNote,
  deleteNote,
  createSubNote,
  uploadNoteAttachments,
  uploadDirectNoteFiles,
  deleteNoteAttachment,
  downloadNoteAttachment,
  previewNoteAttachment,
  setActiveTab,
  setSelectedProject,
  setSearchQuery,
} from "../reducers/notes.reducer";
import { Note, NoteType } from "../types/notes.types";
import dayjs from "dayjs";
import ExcelViewerModal from "../components/ExcelViewerModal";
import { useNoteDragDrop } from "./hooks/useNoteDragDrop";
import { openExcelInNewTab } from "../utils/excelViewer";

const TEXT_COLORS = [
  { label: "None / Default", color: "none" },
  { label: "Default Dark", color: "#1B2559" },
  { label: "Primary Purple", color: "#4318FF" },
  { label: "Ocean Blue", color: "#2563EB" },
  { label: "Sky Cyan", color: "#0284C7" },
  { label: "Emerald Green", color: "#059669" },
  { label: "Amber Orange", color: "#D97706" },
  { label: "Crimson Red", color: "#DC2626" },
  { label: "Violet Purple", color: "#7C3AED" },
  { label: "Rose Pink", color: "#DB2777" },
  { label: "Slate Gray", color: "#64748B" },
];

const HIGHLIGHT_COLORS = [
  { label: "Clear / None", color: "transparent" },
  { label: "Soft Yellow", color: "#FEF08A" },
  { label: "Soft Green", color: "#BBF7D0" },
  { label: "Soft Blue", color: "#BFDBFE" },
  { label: "Soft Pink", color: "#FECDD3" },
  { label: "Soft Purple", color: "#E9D5FF" },
  { label: "Soft Orange", color: "#FED7AA" },
];

const formatFileSize = (bytes?: number) => {
  if (!bytes || bytes === 0) return "8.4 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

interface NoteDocumentItem {
  id?: number;
  key?: string;
  name: string;
  url?: string;
  file?: File;
  fileKey?: string;
  fileName?: string;
  size?: number;
}

// Uploaded file item chip matching the screenshot badge
const NoteAttachmentChipItem: React.FC<{
  item: NoteDocumentItem;
  onPreview: (item: NoteDocumentItem) => void;
  onDownload: (item: NoteDocumentItem) => void;
  onDelete?: (item: NoteDocumentItem) => void;
}> = ({ item, onPreview, onDownload, onDelete }) => {
  const displayName = item.name || item.fileName || "Attachment";
  const ext = displayName.includes(".") ? displayName.split(".").pop()?.toUpperCase() : "FILE";
  const sizeText = formatFileSize(item.file?.size || item.size);

  return (
    <div className="inline-flex items-center gap-3.5 p-3 px-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs min-w-[280px] max-w-sm transition hover:shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-slate-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs md:text-sm font-bold text-[#1B2559] truncate max-w-[170px]" title={displayName}>
          {displayName}
        </p>
        <p className="text-[11px] text-slate-400 font-medium">
          {sizeText} • {ext}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-1">
        <button
          type="button"
          onClick={() => onPreview(item)}
          className="p-1.5 text-slate-400 hover:text-[#4318FF] hover:bg-slate-50 rounded-lg transition cursor-pointer"
          title="Preview File"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDownload(item)}
          className="p-1.5 text-slate-400 hover:text-[#4318FF] hover:bg-slate-50 rounded-lg transition cursor-pointer"
          title="Download File"
        >
          <Download className="w-4 h-4" />
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Remove File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
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
    loading,
    actionLoading,
  } = useAppSelector((state) => state.notes);

  const currentUser = useAppSelector((state) => state.user.currentUser);

  // View Modes: 'list' | 'create' | 'edit' | 'view'
  const [pageMode, setPageMode] = useState<"list" | "create" | "edit" | "view">("list");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Accordion expansion state for sub-tables
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  // Active note for View and Edit
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Parent Note context when creating a sub-note
  const [parentNoteContext, setParentNoteContext] = useState<Note | null>(null);

  // Success Toast state matching manual popup: "✓ Successfully saved your note •"
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Excel / Image preview modals
  const [previewImageModal, setPreviewImageModal] = useState<{ open: boolean; url: string; title: string }>({
    open: false,
    url: "",
    title: "",
  });

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

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    type: "PROJECT" as NoteType,
    projectName: "",
    attachmentKeys: [] as string[],
    attachments: [] as NoteDocumentItem[],
    files: [] as File[],
  });

  const [isDraggingModalFile, setIsDraggingModalFile] = useState(false);
  const [textColor, setTextColor] = useState("#1B2559");
  const [highlightColor, setHighlightColor] = useState("transparent");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load notes on mount and filter changes
  useEffect(() => {
    dispatch(fetchNoteStats());
    dispatch(fetchProjectsList());
    loadNotes();
  }, [activeTab, selectedProject, searchQuery]);

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

  // Toggle sub-table accordion
  const toggleExpand = (noteId: number) => {
    setExpandedNotes((prev) => ({
      ...prev,
      [noteId]: !prev[noteId],
    }));
  };

  // Switch between Project Notes and Personal Notes
  const handleTabSwitch = (tab: NoteType) => {
    dispatch(setActiveTab(tab));
    dispatch(setSelectedProject(""));
    setCurrentPage(1);
  };

  // Rich Text Editor Commands (Prevents losing selection focus on mousedown)
  const executeEditorCommand = (command: string, value: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    try {
      if (command === "formatBlock") {
        const success = document.execCommand("formatBlock", false, value);
        if (!success) {
          document.execCommand("formatBlock", false, value.replace(/[<>]/g, ""));
        }
      } else if (command === "hiliteColor") {
        const success = document.execCommand("hiliteColor", false, value);
        if (!success) {
          document.execCommand("backColor", false, value);
        }
      } else {
        document.execCommand(command, false, value);
      }
    } catch (e) {
      console.warn("Editor formatting error:", e);
    }

    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current?.innerHTML || "",
      }));
    }
  };

  const handleEditorInput = () => {
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current?.innerHTML || "",
      }));
    }
  };

  const handleInsertLink = () => {
    const sel = window.getSelection();
    let savedRange: Range | null = null;
    if (sel && sel.rangeCount > 0) {
      savedRange = sel.getRangeAt(0).cloneRange();
    }

    const url = prompt("Enter link URL (e.g. https://example.com):");
    if (url) {
      if (editorRef.current) {
        editorRef.current.focus();
      }
      if (savedRange && sel) {
        sel.removeAllRanges();
        sel.addRange(savedRange);
      }
      document.execCommand("createLink", false, url);
      if (editorRef.current) {
        setFormData((prev) => ({
          ...prev,
          description: editorRef.current?.innerHTML || "",
        }));
      }
    }
  };

  // Floating save toast trigger
  const triggerSuccessToast = () => {
    setShowSaveToast(true);
    setTimeout(() => {
      setShowSaveToast(false);
    }, 4000);
  };

  // Start Create Root Note
  const handleStartCreate = (noteType: NoteType = activeTab) => {
    setParentNoteContext(null);
    setActiveNote(null);
    setFormData({
      title: "",
      description: "",
      type: noteType,
      projectName: noteType === "PROJECT" ? selectedProject || "" : "",
      attachmentKeys: [],
      attachments: [],
      files: [],
    });
    setPageMode("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Start Create Sub-Note (+ Add Note button in Sub-Table)
  const handleStartCreateSubNote = (parent: Note) => {
    setParentNoteContext(parent);
    setActiveNote(null);
    setFormData({
      title: "",
      description: "",
      type: parent.type,
      projectName: parent.projectName || "",
      attachmentKeys: [],
      attachments: [],
      files: [],
    });
    setPageMode("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Start Edit Note or Sub-Note
  const handleStartEdit = (note: Note) => {
    setActiveNote(note);
    setParentNoteContext(null);
    setFormData({
      title: note.title,
      description: note.description || "",
      type: note.type,
      projectName: note.projectName || "",
      attachmentKeys: [],
      attachments: [],
      files: [],
    });
    setPageMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Start View Note
  const handleStartView = async (note: Note) => {
    setActiveNote(note);
    setPageMode("view");
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const detailedNote = await dispatch(fetchNoteById(note.id)).unwrap();
      if (detailedNote) {
        setActiveNote(detailedNote);
      }
    } catch (err) {
      console.error("Failed to load note details:", err);
    }
  };

  // Back to Main List View
  const handleBackToList = () => {
    setPageMode("list");
    setActiveNote(null);
    setParentNoteContext(null);
    loadNotes();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };



  // ==========================================
  // 2. SEPARATE ATTACHMENTS UPLOAD HANDLER
  // Uploads files as attachments (stored in attachments list)
  // ==========================================
  const handleProcessUploadFiles = async (filesToUpload: File[]) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    message.loading({ content: `Uploading ${filesToUpload.length} file(s)...`, key: "upload-file-toast" });

    if (pageMode === "view" && activeNote?.id) {
      // In view mode: upload directly to note attachments
      try {
        await dispatch(
          uploadNoteAttachments({
            noteId: activeNote.id,
            files: filesToUpload,
          })
        ).unwrap();
        message.success({ content: `Attached ${filesToUpload.length} file(s) successfully`, key: "upload-file-toast" });
        const updated = await dispatch(fetchNoteById(activeNote.id)).unwrap();
        if (updated) setActiveNote(updated);
        loadNotes();
      } catch (err: any) {
        message.error({ content: err || "Failed to upload attachments", key: "upload-file-toast" });
      }
    } else {
      // In create / edit mode: upload directly to object_store as attachment chips
      try {
        const res = await dispatch(
          uploadDirectNoteFiles({
            noteId: activeNote?.id,
            files: filesToUpload,
          })
        ).unwrap();

        const uploadedList = res.uploaded || [];
        const newKeys: string[] = [];
        const newDocItems: NoteDocumentItem[] = [];

        uploadedList.forEach((u: any, idx: number) => {
          const key = u.key || u.fileKey;
          if (key) newKeys.push(key);
          newDocItems.push({
            id: u.id,
            key: key,
            fileKey: key,
            name: u.fileName || u.name || filesToUpload[idx]?.name || "Attachment",
            size: u.fileSize || u.size || filesToUpload[idx]?.size,
            file: filesToUpload[idx],
          });
        });

        setFormData((prev) => ({
          ...prev,
          attachmentKeys: [...prev.attachmentKeys, ...newKeys],
          attachments: [...prev.attachments, ...newDocItems],
        }));

        message.success({ content: `Attached ${filesToUpload.length} file(s) successfully`, key: "upload-file-toast" });
      } catch (err: any) {
        message.error({ content: err || "Failed to upload files", key: "upload-file-toast" });
      }
    }
  };

  // File Selection for Attachments
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      handleProcessUploadFiles(selected);
    }
    e.target.value = "";
  };

  const handleRemoveSelectedFile = async (index: number) => {
    const itemToRemove = formData.attachments[index];
    if (itemToRemove?.key) {
      try {
        await dispatch(deleteNoteAttachment({ key: itemToRemove.key })).unwrap();
      } catch (err) {
        console.warn("Failed to delete attachment from server:", err);
      }
    }
    setFormData((prev) => ({
      ...prev,
      attachmentKeys: prev.attachmentKeys.filter((k) => k !== itemToRemove?.key),
      attachments: prev.attachments.filter((_, i) => i !== index),
    }));
  };

  // Submit Note Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      message.error("Note title is required");
      return;
    }

    if (formData.type === "PROJECT" && !formData.projectName.trim()) {
      message.error("Project name is required for Project Notes");
      return;
    }

    const currentDescription = editorRef.current ? editorRef.current.innerHTML : (formData.description || "");

    try {
      if (pageMode === "create") {
        if (parentNoteContext) {
          await dispatch(
            createSubNote({
              parentId: parentNoteContext.id,
              title: formData.title.trim(),
              description: currentDescription,
              attachmentKeys: formData.attachmentKeys,
              files: formData.files.length > 0 ? formData.files : undefined,
            })
          ).unwrap();

          setExpandedNotes((prev) => ({ ...prev, [parentNoteContext.id]: true }));
        } else {
          await dispatch(
            createNote({
              title: formData.title.trim(),
              description: currentDescription,
              type: formData.type,
              projectName: formData.type === "PROJECT" ? formData.projectName.trim() : undefined,
              color: "#4318FF",
              attachmentKeys: formData.attachmentKeys,
              files: formData.files.length > 0 ? formData.files: undefined,
            })
          ).unwrap();
        }
      } else if (pageMode === "edit" && activeNote) {
        await dispatch(
          updateNote({
            id: activeNote.id,
            title: formData.title.trim(),
            description: currentDescription,
            type: formData.type,
            projectName: formData.type === "PROJECT" ? formData.projectName.trim() : undefined,
          })
        ).unwrap();

        if (formData.files.length > 0) {
          await dispatch(
            uploadNoteAttachments({
              noteId: activeNote.id,
              files: formData.files,
            })
          ).unwrap();
        }
      }

      triggerSuccessToast();
      dispatch(fetchNoteStats());
      dispatch(fetchProjectsList());
      handleBackToList();
    } catch (err: any) {
      message.error(err || "Failed to save note");
    }
  };

  // Delete Note / Sub-Note
  const handleDeleteNote = async (noteId: number) => {
    try {
      await dispatch(deleteNote(noteId)).unwrap();
      message.success("Note deleted successfully");
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

  // ==========================================
  // DIRECT FILE DOWNLOADS: PDF, EXCEL, WORD
  // ==========================================
  const handleExportPDF = (note: Note) => {
    try {
      const doc = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 15;
      const contentWidth = pageWidth - margin * 2;

      // Top brand accent bar
      doc.setFillColor(67, 24, 255); // #4318FF
      doc.rect(margin, 12, contentWidth, 3, "F");

      // Brand Header
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(67, 24, 255);
      doc.text("WORKSPHERE EMPLOYEE NOTE", margin, 22);

      // Note Title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(18);
      doc.setTextColor(27, 37, 89); // #1B2559
      const titleLines = doc.splitTextToSize(note.title || "Untitled Note", contentWidth);
      doc.text(titleLines, margin, 32);

      let currentY = 32 + titleLines.length * 7;

      // Metadata Table / Grid
      const metaData = [
        [
          note.projectName
            ? `Project: ${note.projectName}`
            : `Type: ${note.type === "PROJECT" ? "Project Note" : "Personal Note"}`,
          `Created By: ${note.createdBy || "User"}`,
          `Date: ${dayjs(note.createdAt).format("MMM DD, YYYY")}`,
        ],
      ];

      autoTable(doc, {
        startY: currentY,
        head: [],
        body: metaData,
        theme: "plain",
        styles: {
          fontSize: 9,
          textColor: [112, 126, 174],
          cellPadding: { top: 2, bottom: 4, left: 0, right: 8 },
        },
        margin: { left: margin, right: margin },
      });

      currentY = (doc as any).lastAutoTable.finalY + 4;

      // Divider line
      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, currentY, pageWidth - margin, currentY);

      currentY += 8;

      // Description Section Heading
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(67, 24, 255);
      doc.text("DESCRIPTION", margin, currentY);

      currentY += 6;

      // Clean HTML from description for PDF
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = note.description || "";
      const rawText = tempDiv.innerText || tempDiv.textContent || "No description provided.";

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(43, 54, 116);

      const splitDesc = doc.splitTextToSize(rawText, contentWidth);

      // Add description text with auto-pagination
      for (let i = 0; i < splitDesc.length; i++) {
        if (currentY > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }
        doc.text(splitDesc[i], margin, currentY);
        currentY += 5.5;
      }

      // If sub-notes exist, add sub-notes table
      if (note.subNotes && note.subNotes.length > 0) {
        currentY += 8;
        if (currentY > pageHeight - 30) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(67, 24, 255);
        doc.text(`SUB-NOTES (${note.subNotes.length})`, margin, currentY);
        currentY += 4;

        const subTableBody = note.subNotes.map((sub, idx) => {
          const subDiv = document.createElement("div");
          subDiv.innerHTML = sub.description || "";
          const subText = subDiv.innerText || subDiv.textContent || "";
          return [
            String(idx + 1),
            sub.title,
            sub.createdBy || "User",
            dayjs(sub.createdAt).format("MMM DD, YYYY"),
            subText.length > 80 ? subText.substring(0, 77) + "..." : subText,
          ];
        });

        autoTable(doc, {
          startY: currentY,
          head: [["SL NO", "Title", "Created By", "Date", "Description"]],
          body: subTableBody,
          theme: "grid",
          headStyles: {
            fillColor: [67, 24, 255],
            textColor: [255, 255, 255],
            fontSize: 9,
            fontStyle: "bold",
          },
          bodyStyles: {
            fontSize: 8,
            textColor: [43, 54, 116],
          },
          margin: { left: margin, right: margin },
        });

        currentY = (doc as any).lastAutoTable.finalY + 8;
      }

      // Footer
      const totalPages = doc.getNumberOfPages();
      for (let p = 1; p <= totalPages; p++) {
        doc.setPage(p);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(160, 174, 192);
        doc.text(
          `© ${new Date().getFullYear()} WorkSphere Powered by inventech  |  Page ${p} of ${totalPages}`,
          pageWidth / 2,
          pageHeight - 8,
          { align: "center" }
        );
      }

      const fileName = `${(note.title || "Note").replace(/[/\\?%*:|"<>]/g, "_")}.pdf`;
      doc.save(fileName);
      message.success("PDF downloaded directly successfully");
    } catch (err: any) {
      console.error("PDF download error:", err);
      message.error("Failed to generate PDF download");
    }
  };

  const handleExportWord = (note: Note) => {
    const header = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>${note.title || "Note"}</title>
        <style>
          body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; padding: 30px; color: #1B2559; }
          h1 { color: #4318FF; font-size: 24pt; margin-bottom: 4pt; }
          .meta { color: #64748B; font-size: 10pt; margin-bottom: 20pt; border-bottom: 1pt solid #CBD5E1; padding-bottom: 10pt; }
          .section-title { font-size: 12pt; font-weight: bold; color: #4318FF; text-transform: uppercase; margin-top: 16pt; margin-bottom: 6pt; }
          .content { font-size: 11pt; line-height: 1.6; }
          blockquote { border-left: 3pt solid #4318FF; padding-left: 10pt; font-style: italic; color: #475569; }
        </style>
      </head>
      <body>
        <h1>${note.title}</h1>
        <div class="meta">
          ${note.projectName ? `<strong>Project:</strong> ${note.projectName} &nbsp;|&nbsp; ` : ""}
          <strong>Type:</strong> ${note.type === "PROJECT" ? "Project Note" : "Personal Note"} &nbsp;|&nbsp; 
          <strong>Created By:</strong> ${note.createdBy || "User"} &nbsp;|&nbsp; 
          <strong>Date:</strong> ${dayjs(note.createdAt).format("MMMM DD, YYYY")}
        </div>
        <div class="section-title">Description</div>
        <div class="content">${note.description || "No description provided."}</div>
      </body>
    </html>`;

    const blob = new Blob(["\ufeff", header], {
      type: "application/msword;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${note.title || "Note"}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
    message.success("Word document downloaded directly successfully");
  };

  const getDownloadMenuItems = (note: Note): MenuProps["items"] => [
    {
      key: "pdf",
      icon: <FileText className="w-4 h-4 text-red-500" />,
      label: "Download as PDF",
      onClick: () => handleExportPDF(note),
    },
    {
      key: "word",
      icon: <FileCode className="w-4 h-4 text-blue-600" />,
      label: "Download as Word (.doc)",
      onClick: () => handleExportWord(note),
    },
  ];

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


  // Dedicated Drag and Drop Hook
  const {
    draggedItem,
    dragOverTarget,
    isHeaderDropTarget,
    fileDropTargetNoteId,
    startNoteDrag,
    handleDragEnd,
    handleRowDragOver,
    handleRowDragLeave,
    handleRowDrop,
    handleSubRowDragOver,
    handleSubRowDragLeave,
    handleSubRowDrop,
    handleHeaderDragOver,
    handleHeaderDragLeave,
    handleHeaderDrop,
  } = useNoteDragDrop(displayNotes, (noteId) => {
    setExpandedNotes((prev) => ({ ...prev, [noteId]: true }));
  });

  // Total Attachments count in form
  const totalAttachmentsCount = formData.attachments.length + (activeNote?.attachments?.length || 0);

  // Set editor innerHTML on initial edit/create load
  useEffect(() => {
    if ((pageMode === "create" || pageMode === "edit") && editorRef.current) {
      if (editorRef.current.innerHTML !== (formData.description || "")) {
        editorRef.current.innerHTML = formData.description || "";
      }
    }
  }, [pageMode, activeNote]);

  // ==========================================
  // RENDER: CREATE / EDIT FULL PAGE FORM
  // (Full-width card maximizing available space, draggable editor)
  // ==========================================
  if (pageMode === "create" || pageMode === "edit") {
    const isProjectNote = formData.type === "PROJECT";

    return (
      <div className="w-full min-h-full bg-[#F4F7FE] p-2 sm:p-3 md:p-4 flex flex-col gap-3 font-sans">
        {/* Floating Success Toast Popup */}
        {showSaveToast && (
          <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 animate-bounce">
            <CheckCircle2 className="w-4 h-4 text-white" />
            <span className="text-xs md:text-sm font-semibold">Successfully saved your note •</span>
          </div>
        )}

        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] p-4 sm:p-5">
          <form onSubmit={handleSubmitForm} className="space-y-3 w-full">
            {/* Top Form Header: Input boxes + Back Button matching screenshot */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1 border-b border-slate-100">
              <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1 min-w-0">
                {/* Parent Note Context Indicator */}
                {parentNoteContext && (
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-[#4318FF] shrink-0">
              
                  </div>
                )}

                {/* PROJECT NAME (Only for Project Notes) */}
                {isProjectNote && (
                  <div className="flex items-center gap-2.5 shrink-0 min-w-[200px] sm:min-w-[240px] max-w-xs">
                    <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider whitespace-nowrap">
                      PROJECT NAME:
                    </span>
                    <input
                      type="text"
                      value={formData.projectName}
                      onChange={(e) => setFormData((prev) => ({ ...prev, projectName: e.target.value }))}
                      placeholder="Enter project name..."
                      className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 outline-none focus:ring-1 focus:ring-[#4318FF] transition placeholder:text-slate-400 font-medium"
                      required
                    />
                  </div>
                )}

                {/* TITLE: Extends all the way to Back button */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0">
                  <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider whitespace-nowrap">
                    TITLE:
                  </span>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="Enter title..."
                    className="w-full px-3.5 py-1.5 bg-white border border-slate-200 rounded-xl text-xs md:text-sm text-slate-800 outline-none focus:ring-1 focus:ring-[#4318FF] transition placeholder:text-slate-400 font-medium"
                    required
                  />
                </div>
              </div>

              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToList}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[#4318FF] text-xs md:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer self-start lg:self-center shrink-0"
              >
                <ArrowLeft className="w-4 h-4 text-[#4318FF]" />
                <span>Back</span>
              </button>
            </div>

            {/* DESCRIPTION & RICH TEXT FORMATTING TOOLBAR */}
            <div className="space-y-1.5 w-full">
              <span className="block text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider">
                DESCRIPTION
              </span>

              <div
                style={{ resize: "vertical", minHeight: "560px" }}
                className="w-full bg-white border border-slate-200 rounded-2xl focus-within:border-[#4318FF] focus-within:ring-1 focus-within:ring-[#4318FF]/20 transition-all shadow-xs flex flex-col resize-y min-h-[560px] overflow-hidden"
              >
                {/* Rich Text Toolbar matching mockup */}
                <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 p-2 px-3 bg-white border-b border-slate-100 text-slate-700 select-none shrink-0">
                  {/* Bold */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("bold");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Bold (Ctrl+B)"
                  >
                    B
                  </button>

                  {/* Italic */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("italic");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg italic font-serif text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Italic (Ctrl+I)"
                  >
                    I
                  </button>

                  {/* Underline */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("underline");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg underline text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Underline (Ctrl+U)"
                  >
                    U
                  </button>

                  {/* Strikethrough */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("strikeThrough");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg line-through text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Strikethrough"
                  >
                    S
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  {/* Heading 1 */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("formatBlock", "<h1>");
                    }}
                    className="px-2 h-8 flex items-center justify-center rounded-lg font-bold text-xs text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Heading 1"
                  >
                    H₁
                  </button>

                  {/* Heading 2 */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("formatBlock", "<h2>");
                    }}
                    className="px-2 h-8 flex items-center justify-center rounded-lg font-bold text-xs text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Heading 2"
                  >
                    H₂
                  </button>

                  {/* Normal */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("formatBlock", "<p>");
                    }}
                    className="px-2.5 h-8 flex items-center justify-center rounded-lg font-medium text-xs text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Normal Text"
                  >
                    Normal
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  {/* Bullet List */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("insertUnorderedList");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Bullet List"
                  >
                    <List className="w-4 h-4" />
                  </button>

                  {/* Numbered List */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("insertOrderedList");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Numbered List"
                  >
                    <ListOrdered className="w-4 h-4" />
                  </button>

                  {/* Quote */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      executeEditorCommand("formatBlock", "<blockquote>");
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Quote"
                  >
                    <Quote className="w-4 h-4" />
                  </button>

                  {/* Link */}
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      handleInsertLink();
                    }}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Insert Link"
                  >
                    <LinkIcon className="w-4 h-4" />
                  </button>

                  <div className="h-4 w-px bg-slate-200 mx-0.5" />

                  {/* Text Color Palette */}
                  <Popover
                    trigger="click"
                    placement="bottom"
                    content={
                      <div className="p-2 space-y-2.5 w-56 select-none">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Text Color
                          </span>
                          <button
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              executeEditorCommand("foreColor", "#1B2559");
                              setTextColor("none");
                            }}
                            className="text-[11px] text-[#4318FF] hover:underline font-semibold cursor-pointer"
                          >
                            Reset
                          </button>
                        </div>
                        <div className="grid grid-cols-6 gap-1.5">
                          {TEXT_COLORS.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              title={c.label}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (c.color === "none") {
                                  executeEditorCommand("foreColor", "#1B2559");
                                  setTextColor("none");
                                } else {
                                  executeEditorCommand("foreColor", c.color);
                                  setTextColor(c.color);
                                }
                              }}
                              className={`w-7 h-7 rounded-lg border flex items-center justify-center hover:scale-110 hover:shadow-xs transition cursor-pointer ${
                                c.color === "none"
                                  ? "border-slate-300 bg-slate-100 text-[10px] font-bold text-slate-600"
                                  : "border-slate-200/90"
                              }`}
                              style={c.color !== "none" ? { backgroundColor: c.color } : {}}
                            >
                              {c.color === "none" ? (
                                textColor === "none" ? "✓" : "None"
                              ) : textColor === c.color ? (
                                <span className="w-2 h-2 rounded-full bg-white shadow-xs" />
                              ) : null}
                            </button>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-medium">Custom Color:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={textColor === "none" ? "#1B2559" : textColor}
                              onChange={(e) => {
                                setTextColor(e.target.value);
                                executeEditorCommand("foreColor", e.target.value);
                              }}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                            />
                            <span className="text-[11px] text-slate-400 font-mono">
                              {textColor === "none" ? "Default" : textColor}
                            </span>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      className="h-8 px-2 flex items-center gap-1 rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                      title="Font Color Palette"
                    >
                      <Palette className="w-4 h-4 text-slate-700" />
                      <span
                        className="w-3.5 h-1.5 rounded-full shrink-0 border border-slate-200 shadow-2xs"
                        style={{
                          backgroundColor:
                            textColor === "none" ? "#1B2559" : textColor || "#1B2559",
                        }}
                      />
                    </button>
                  </Popover>

                  {/* Highlighter / Background Color */}
                  <Popover
                    trigger="click"
                    placement="bottom"
                    content={
                      <div className="p-2 space-y-2.5 w-52 select-none">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                            Highlighter
                          </span>
                          <span className="text-[10px] text-slate-400 font-medium">Background</span>
                        </div>
                        <div className="grid grid-cols-4 gap-1.5">
                          {HIGHLIGHT_COLORS.map((c) => (
                            <button
                              key={c.color}
                              type="button"
                              title={c.label}
                              onMouseDown={(e) => {
                                e.preventDefault();
                                if (c.color === "transparent") {
                                  executeEditorCommand("removeFormat");
                                } else {
                                  executeEditorCommand("hiliteColor", c.color);
                                }
                                setHighlightColor(c.color);
                              }}
                              className="w-9 h-7 rounded-lg border border-slate-200 flex items-center justify-center hover:scale-105 hover:shadow-xs transition cursor-pointer text-xs font-semibold text-slate-700"
                              style={{
                                backgroundColor: c.color === "transparent" ? "#F8FAFC" : c.color,
                              }}
                            >
                              {c.color === "transparent" ? "None" : highlightColor === c.color ? "✓" : ""}
                            </button>
                          ))}
                        </div>
                        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-600 font-medium">Custom Highlight:</span>
                          <div className="flex items-center gap-1.5">
                            <input
                              type="color"
                              value={highlightColor === "transparent" ? "#FEF08A" : highlightColor}
                              onChange={(e) => {
                                setHighlightColor(e.target.value);
                                executeEditorCommand("hiliteColor", e.target.value);
                              }}
                              className="w-6 h-6 p-0 border-0 rounded cursor-pointer bg-transparent"
                            />
                            <span className="text-[11px] text-slate-400 font-mono">
                              {highlightColor === "transparent" ? "#FEF08A" : highlightColor}
                            </span>
                          </div>
                        </div>
                      </div>
                    }
                  >
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      className="h-8 px-2 flex items-center gap-1 rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                      title="Text Highlighter"
                    >
                      <Highlighter className="w-4 h-4 text-slate-700" />
                      <span
                        className="w-3.5 h-1.5 rounded-full shrink-0 border border-slate-200 shadow-2xs"
                        style={{
                          backgroundColor:
                            highlightColor === "transparent" ? "#FEF08A" : highlightColor,
                        }}
                      />
                    </button>
                  </Popover>
                </div>

                {/* Content Editable Area with large height */}
                <div
                  ref={editorRef}
                  contentEditable
                  onInput={handleEditorInput}
                  data-placeholder="Write your notes, key updates, documentation, or action items here..."
                  className="notes-rich-editor flex-1 min-h-[480px] overflow-y-auto p-4 sm:p-5 text-sm md:text-base text-slate-800 leading-relaxed outline-none"
                />
              </div>
            </div>

            {/* FILES & ATTACHMENTS SECTION */}
            <div className="space-y-2 pt-1 w-full">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Paperclip className="w-4 h-4 text-[#4318FF]" />
                  <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider">
                    FILES & ATTACHMENTS
                  </span>
                </div>
                {totalAttachmentsCount > 0 && (
                  <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                    {totalAttachmentsCount} file{totalAttachmentsCount > 1 ? "s" : ""} attached
                  </span>
                )}
              </div>

              {/* Compact Drag and Drop Upload Zone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingModalFile(true);
                }}
                onDragEnter={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingModalFile(true);
                }}
                onDragLeave={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingModalFile(false);
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsDraggingModalFile(false);
                  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    const droppedFiles = Array.from(e.dataTransfer.files);
                    handleProcessUploadFiles(droppedFiles);
                  }
                }}
                className={`w-full max-w-md border-2 border-dashed rounded-xl p-3 transition flex items-center gap-2.5 cursor-pointer ${
                  isDraggingModalFile
                    ? "border-[#4318FF] bg-indigo-50/80 scale-[1.01] shadow-sm ring-2 ring-indigo-200"
                    : "border-indigo-200 hover:border-[#4318FF] bg-indigo-50/20 hover:bg-indigo-50/40"
                }`}
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-100/60 flex items-center justify-center text-[#4318FF] shrink-0">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <span className="text-xs text-slate-600">
                  <strong className="text-[#4318FF] font-semibold">Click to upload</strong> or drag and drop <span className="text-slate-400 text-[11px]">(PDF, Word, Excel, Images)</span>
                </span>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Attached File Cards */}
              <div className="flex flex-wrap items-center gap-3 pt-1">
                {/* Server Attachments */}
                {activeNote?.attachments && activeNote.attachments.map((att) => (
                  <NoteAttachmentChipItem
                    key={`server-att-${att.id || att.key || att.fileKey}`}
                    item={{
                      id: att.id,
                      key: att.key || att.fileKey,
                      name: att.fileName || att.name || "Attachment",
                      size: att.fileSize,
                    }}
                    onPreview={handlePreviewAttachment}
                    onDownload={handleDownloadAttachment}
                    onDelete={() => handleDeleteAttachment(activeNote.id, att.key || att.fileKey)}
                  />
                ))}

                {/* Uploaded Form Attachments */}
                {formData.attachments.map((item, idx) => (
                  <NoteAttachmentChipItem
                    key={`form-att-${item.key || idx}`}
                    item={item}
                    onPreview={handlePreviewAttachment}
                    onDownload={handleDownloadAttachment}
                    onDelete={() => handleRemoveSelectedFile(idx)}
                  />
                ))}
              </div>
            </div>

            {/* Bottom Actions: Cancel & Save Project Note / Save Personal Note */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={handleBackToList}
                className="px-5 py-2.5 bg-transparent hover:bg-slate-100 text-slate-600 font-semibold text-xs md:text-sm rounded-xl transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-7 py-2.5 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#4318FF]/20 hover:shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                {actionLoading
                  ? "Saving..."
                  : parentNoteContext
                  ? "Save Sub-Note"
                  : isProjectNote
                  ? "Save Project Note"
                  : "Save Personal Note"}
              </button>
            </div>
          </form>
        </div>

        {/* Image Preview Modal */}
        <Modal
          open={previewImageModal.open}
          onCancel={() => setPreviewImageModal({ open: false, url: "", title: "" })}
          footer={null}
          title={previewImageModal.title}
          width={800}
        >
          <div className="flex items-center justify-center p-4">
            <img src={previewImageModal.url} alt="Preview" className="max-h-[70vh] object-contain rounded-lg" />
          </div>
        </Modal>

        {/* Excel Spreadsheet Preview Modal */}
        <ExcelViewerModal
          open={excelViewerModal.open}
          onClose={() => setExcelViewerModal({ open: false, fileName: "", blob: null, file: null })}
          fileName={excelViewerModal.fileName}
          blob={excelViewerModal.blob}
          file={excelViewerModal.file}
          onDownload={excelViewerModal.onDownload}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER: VIEW FULL PAGE NOTE
  // (Modern Document Reading Mode + Downloads + Previews)
  // ==========================================
  if (pageMode === "view" && activeNote) {
    const isProjectNote = activeNote.type === "PROJECT";

    const handleCopyContent = () => {
      if (!activeNote.description) {
        message.info("No content to copy");
        return;
      }
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = activeNote.description;
      const textContent = tempDiv.innerText || tempDiv.textContent || "";
      navigator.clipboard.writeText(textContent);
      message.success("Note content copied to clipboard");
    };

    return (
      <div className="w-full min-h-full bg-[#F4F7FE] p-3 sm:p-4 md:p-6 flex flex-col gap-4 font-sans">
        <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 md:p-8 flex flex-col gap-6">
          {/* Header Row: Project Pill, Title, Meta and Actions */}
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 pb-5 border-b border-slate-100">
            <div className="space-y-2 max-w-3xl">
              {/* Project or Personal Category Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                {isProjectNote ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50/90 text-[#4318FF] border border-indigo-100/90 rounded-lg text-xs font-bold uppercase tracking-wider shadow-2xs">
                    <Folder className="w-3.5 h-3.5 text-[#4318FF]" />
                    <span>Project: {activeNote.projectName || "Worksphere"}</span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold uppercase tracking-wider shadow-2xs">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Personal Note</span>
                  </span>
                )}
                <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 text-slate-600 rounded-md text-[11px] font-semibold">
                  {isProjectNote ? "Project Note" : "Personal Note"}
                </span>
              </div>

              {/* Note Title */}
              <h1 className="text-2xl sm:text-3xl font-extrabold text-[#1B2559] tracking-tight leading-snug break-words">
                {activeNote.title}
              </h1>

              {/* Metadata Row: Date, Author, Attachments count */}
              <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm text-slate-500 pt-0.5">
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <span>{dayjs(activeNote.createdAt).format("MMM DD, YYYY")}</span>
                </div>
                <span className="text-slate-300">•</span>
                <div className="flex items-center gap-1.5 font-medium text-slate-600">
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Created by <strong className="text-slate-800">{activeNote.createdBy || "User"}</strong></span>
                </div>
                {activeNote.attachments && activeNote.attachments.length > 0 && (
                  <>
                    <span className="text-slate-300">•</span>
                    <div className="flex items-center gap-1.5 font-medium text-[#4318FF]">
                      <Paperclip className="w-4 h-4" />
                      <span>{activeNote.attachments.length} attachment{activeNote.attachments.length > 1 ? "s" : ""}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Action Buttons: Download Dropdown (PDF, Word), Edit, Back */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start">
              {/* Download Dropdown */}
              <Dropdown menu={{ items: getDownloadMenuItems(activeNote) }} trigger={["click"]}>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center gap-2 shadow-2xs hover:shadow-xs"
                >
                  <Download className="w-4 h-4 text-[#4318FF]" />
                  <span>Download Note</span>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </Dropdown>

              {/* Edit Note Button */}
              <button
                type="button"
                onClick={() => handleStartEdit(activeNote)}
                className="px-4 py-2.5 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-md shadow-[#4318FF]/20 hover:shadow-lg"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Note</span>
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={handleBackToList}
                className="px-4 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-[#4318FF] font-semibold text-xs sm:text-sm rounded-xl transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
              >
                <ArrowLeft className="w-4 h-4 text-[#4318FF]" />
                <span>Back</span>
              </button>
            </div>
          </div>

          {/* DESCRIPTION / NOTE CONTENT VIEW */}
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#4318FF]" />
                <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider">
                  Description & Content
                </span>
              </div>

              {activeNote.description && activeNote.description.trim() && (
                <button
                  type="button"
                  onClick={handleCopyContent}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#4318FF] bg-slate-50 hover:bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-slate-200/70 transition cursor-pointer"
                  title="Copy note text to clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>
              )}
            </div>

            <div className="w-full bg-[#FAFCFF] rounded-2xl border border-slate-200/90 p-6 sm:p-8 min-h-[480px] shadow-2xs">
              {activeNote.description && activeNote.description.trim() ? (
                <div
                  className="notes-content-view prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: activeNote.description }}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400 gap-3">
                  <FileText className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-500">No description or notes have been added yet.</p>
                  <button
                    type="button"
                    onClick={() => handleStartEdit(activeNote)}
                    className="mt-1 px-4 py-2 bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Add Description</span>
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Files & Attachments */}
          {activeNote.attachments && activeNote.attachments.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-[#4318FF]" />
                <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider block">
                  FILES & ATTACHMENTS ({activeNote.attachments.length})
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                {activeNote.attachments.map((att) => (
                  <NoteAttachmentChipItem
                    key={`view-att-${att.id || att.key || att.fileKey}`}
                    item={{
                      id: att.id,
                      key: att.key || att.fileKey,
                      name: att.fileName || att.name || "Attachment",
                      size: att.fileSize,
                    }}
                    onPreview={handlePreviewAttachment}
                    onDownload={handleDownloadAttachment}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Image Preview Modal */}
        <Modal
          open={previewImageModal.open}
          onCancel={() => setPreviewImageModal({ open: false, url: "", title: "" })}
          footer={null}
          title={previewImageModal.title}
          width={800}
        >
          <div className="flex items-center justify-center p-4">
            <img src={previewImageModal.url} alt="Preview" className="max-h-[70vh] object-contain rounded-lg" />
          </div>
        </Modal>

        {/* Excel Spreadsheet Preview Modal */}
        <ExcelViewerModal
          open={excelViewerModal.open}
          onClose={() => setExcelViewerModal({ open: false, fileName: "", blob: null, file: null })}
          fileName={excelViewerModal.fileName}
          blob={excelViewerModal.blob}
          file={excelViewerModal.file}
          onDownload={excelViewerModal.onDownload}
        />
      </div>
    );
  }

  // ==========================================
  // RENDER: MAIN LIST VIEW
  // (3 Action Badges: View, Edit, Delete matching manual design)
  // ==========================================
  const isProjectNotesTab = activeTab === "PROJECT";

  return (
    <div className="w-full min-h-full bg-[#F4F7FE] p-2 sm:p-3 md:p-4 flex flex-col gap-4 font-sans">
      {/* Floating Success Toast Popup */}
      {showSaveToast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white rounded-full shadow-lg shadow-emerald-500/30 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-white" />
          <span className="text-xs md:text-sm font-semibold">Successfully saved your note •</span>
        </div>
      )}

      {/* Top Header: Title & Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-[#1B2559] tracking-tight">
          {isProjectNotesTab ? "Project Notes" : "Personal Notes"}
        </h1>

        {/* Top-Right Action Buttons & Dropdown Filter */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => handleStartCreate("PROJECT")}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs md:text-sm rounded-xl shadow-md shadow-[#4318FF]/20 hover:shadow-lg transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Project Note</span>
          </button>

          <button
            onClick={() => handleStartCreate("PERSONAL")}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#4318FF] hover:bg-indigo-50 text-[#4318FF] font-semibold text-xs md:text-sm rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Personal Note</span>
          </button>

          {/* Filter Dropdown */}
          <div className="relative">
            <select
              value={activeTab}
              onChange={(e) => handleTabSwitch(e.target.value as NoteType)}
              className="px-4 py-2 pr-9 bg-white border border-slate-200 rounded-xl text-xs md:text-sm font-semibold text-slate-700 outline-none focus:ring-1 focus:ring-[#4318FF] transition cursor-pointer appearance-none shadow-xs"
            >
              <option value="PROJECT">Project Notes</option>
              <option value="PERSONAL">Personal Notes</option>
            </select>
            <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)]">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => dispatch(setSearchQuery(e.target.value))}
            placeholder="Search notes..."
            className="w-full pl-10 pr-9 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs md:text-sm text-slate-700 outline-none focus:bg-white focus:ring-1 focus:ring-[#4318FF] transition placeholder:text-slate-400"
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
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <div className="w-8 h-8 border-3 border-[#4318FF]/20 border-t-[#4318FF] rounded-full animate-spin"></div>
            <span className="mt-3 text-xs font-medium text-slate-500">Loading notes...</span>
          </div>
        ) : displayNotes.length === 0 ? (
          /* Empty State */
          <div className="p-16 text-center flex flex-col items-center justify-center">
            <div className="w-14 h-14 bg-indigo-50 text-[#4318FF] rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
              <FileText className="w-7 h-7 text-[#4318FF]" />
            </div>
            <h3 className="text-base font-bold text-[#1B2559] mb-1">
              {searchQuery ? "No matching notes found" : "No notes created yet"}
            </h3>
            <p className="text-slate-400 text-xs md:text-sm max-w-sm mb-6">
              {searchQuery
                ? "Try clearing your search query or switching filters."
                : "Click '+ Create Project Note' or '+ Create Personal Note' above to add your notes."}
            </p>
            {isProjectNotesTab && (
              <button
                onClick={() => handleTabSwitch("PERSONAL")}
                className="px-4 py-2 bg-[#4318FF] text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-[#320fe0] transition cursor-pointer"
              >
                Switch to Personal Notes
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              {/* Table Header: Purple banner matching PDF */}
              <thead>
                <tr className="bg-[#4318FF] text-white text-xs font-bold uppercase tracking-wider">
                  <th className="py-4 px-6 text-center w-28">SL NO</th>
                  {isProjectNotesTab && <th className="py-4 px-6">PROJECT NAME</th>}
                  <th className="py-4 px-6">TITLE</th>
                  <th className="py-4 px-6">CREATED BY</th>
                  <th className="py-4 px-6 text-center w-40">ACTION</th>
                </tr>
              </thead>

              {/* Drop Target Banner for Sub-notes being promoted to root */}
              {draggedItem && draggedItem.itemType === "sub-note" && (
                <div
                  onDragOver={handleHeaderDragOver}
                  onDragLeave={handleHeaderDragLeave}
                  onDrop={handleHeaderDrop}
                  className={`p-3 m-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                    isHeaderDropTarget
                      ? "bg-[#4318FF] text-white border-white shadow-md scale-[1.01]"
                      : "bg-indigo-50/80 border-[#4318FF] text-[#4318FF]"
                  }`}
                >
                  <CornerDownRight className="w-4 h-4" />
                  <span>Drop here to promote \"{draggedItem.title}\" to a top-level note</span>
                </div>
              )}

              {/* Table Body */}
              <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700 font-medium">
                {paginatedNotes.map((note, index) => {
                  const slNo = (currentPage - 1) * pageSize + index + 1;
                  const isExpanded = !!expandedNotes[note.id];
                  const subNotes = note.subNotes || [];
                  const isBeingDragged = draggedItem?.id === note.id;
                  const isCurrentDropTarget = dragOverTarget?.id === note.id && dragOverTarget.type === "root";
                  const isFileDropTarget = fileDropTargetNoteId === note.id;

                  return (
                    <React.Fragment key={note.id}>
                      <tr
                        draggable
                        onDragStart={(e) =>
                          startNoteDrag(e, {
                            id: note.id,
                            title: note.title,
                            itemType: "note",
                            parentId: null,
                            projectName: note.projectName,
                            index,
                          })
                        }
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleRowDragOver(e, note, index)}
                        onDragLeave={(e) => handleRowDragLeave(e, note)}
                        onDrop={(e) => handleRowDrop(e, note, index)}
                        className={`transition-all duration-150 ${
                          isBeingDragged ? "opacity-30 bg-slate-100" : ""
                        } ${
                          isFileDropTarget
                            ? "bg-emerald-50/90 ring-2 ring-emerald-500 ring-dashed shadow-inner"
                            : isCurrentDropTarget
                            ? dragOverTarget.position === "above"
                              ? "border-t-2 border-t-[#4318FF] bg-indigo-50/50"
                              : dragOverTarget.position === "below"
                              ? "border-b-2 border-b-[#4318FF] bg-indigo-50/50"
                              : "bg-indigo-50/90 ring-2 ring-[#4318FF] ring-inset"
                            : "hover:bg-slate-50/80"
                        }`}
                      >
                        {/* SL NO with Drag Handle & [+] / [-] Expand Button */}
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-center gap-2">
                            {/* Grip Drag Handle */}
                            <div
                              className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-[#4318FF] transition-colors rounded hover:bg-slate-100"
                              title="Drag to reorder or nest into another note"
                            >
                              <GripVertical className="w-4 h-4" />
                            </div>
                            <span className="font-bold text-slate-800">{slNo}</span>
                            <button
                              type="button"
                              onClick={() => toggleExpand(note.id)}
                              className={`w-6 h-6 rounded border flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                                isExpanded
                                  ? "border-[#4318FF] bg-[#4318FF] text-white"
                                  : "border-slate-300 hover:border-[#4318FF] text-slate-600 hover:text-[#4318FF] bg-white shadow-xs"
                              }`}
                              title={isExpanded ? "Collapse sub-notes" : "Expand sub-notes"}
                            >
                              {isExpanded ? "−" : "+"}
                            </button>
                          </div>
                        </td>

                        {/* Project Name (Only for Project Notes) */}
                        {isProjectNotesTab && (
                          <td className="py-4 px-6 font-semibold text-slate-800">
                            {note.projectName || "Worksphere"}
                          </td>
                        )}

                        {/* Title */}
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-2">
                            <span
                              onClick={() => handleStartView(note)}
                              className="font-semibold text-slate-800 hover:text-[#4318FF] transition cursor-pointer"
                            >
                              {note.title}
                            </span>
                            {isCurrentDropTarget && dragOverTarget.position === "nest" && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4318FF] text-white shadow-xs animate-pulse">
                                <FolderInput className="w-3 h-3" />
                                Nest as sub-note
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Created By */}
                        <td className="py-4 px-6 text-slate-600">
                          <div>{dayjs(note.createdAt).format("MMM DD, YYYY")}</div>
                          <div className="text-[11px] text-slate-400">
                            Created by {note.createdBy || currentUser?.loginId || "Kusuma"}
                          </div>
                        </td>

                        {/* Exact 3 Action Badges: View, Edit, Delete */}
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {/* View Action Badge */}
                            <button
                              onClick={() => handleStartView(note)}
                              className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                              title="View Note"
                            >
                              <Eye className="w-4 h-4 text-[#4318FF]" />
                            </button>

                            {/* Edit Action Badge */}
                            <button
                              onClick={() => handleStartEdit(note)}
                              className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                              title="Edit Note"
                            >
                              <Edit3 className="w-4 h-4 text-[#4318FF]" />
                            </button>

                            {/* Delete Action Badge */}
                            <Popconfirm
                              title="Delete Note"
                              description="Are you sure you want to delete this note and its sub-notes?"
                              onConfirm={() => handleDeleteNote(note.id)}
                              okText="Delete"
                              cancelText="Cancel"
                              okButtonProps={{ danger: true }}
                            >
                              <button
                                className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] flex items-center justify-center transition cursor-pointer shadow-xs"
                                title="Delete Note"
                              >
                                <Trash2 className="w-4 h-4 text-[#EF4444]" />
                              </button>
                            </Popconfirm>
                          </div>
                        </td>
                      </tr>

                      {/* SUB-TABLE ACCORDION EXPANSION */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={isProjectNotesTab ? 5 : 4} className="p-0 bg-slate-50/50">
                            <div className="p-5 pl-12 space-y-3">
                              {/* Sub-Table Header Bar with + Add Note Button */}
                              <div className="flex items-center justify-end">
                                <button
                                  type="button"
                                  onClick={() => handleStartCreateSubNote(note)}
                                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#4318FF] hover:bg-[#320fe0] text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Add Note</span>
                                </button>
                              </div>

                              {/* Sub-Table */}
                              <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                                <table className="w-full text-left border-collapse">
                                  <thead>
                                    <tr className="bg-[#4318FF] text-white text-xs font-bold uppercase tracking-wider">
                                      <th className="py-3 px-5 text-center w-24">SL NO</th>
                                      <th className="py-3 px-6">TITLE</th>
                                      <th className="py-3 px-6">CREATED BY</th>
                                      <th className="py-3 px-6 text-center w-40">ACTIONS</th>
                                    </tr>
                                  </thead>

                                  <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700">
                                    {subNotes.length === 0 ? (
                                      <tr>
                                        <td colSpan={4} className="py-8 text-center text-slate-400">
                                          No notes yet. Click{" "}
                                          <button
                                            type="button"
                                            onClick={() => handleStartCreateSubNote(note)}
                                            className="font-bold text-[#4318FF] hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                                          >
                                            + Add Note
                                          </button>{" "}
                                          to add one, or drag a note here.
                                        </td>
                                      </tr>
                                    ) : (
                                      subNotes.map((sub, subIdx) => {
                                        const isSubDragged = draggedItem?.id === sub.id;
                                        const isSubDropTarget = dragOverTarget?.id === sub.id && dragOverTarget.type === "sub";

                                        return (
                                          <tr
                                            key={sub.id}
                                            draggable
                                            onDragStart={(e) =>
                                              startNoteDrag(e, {
                                                id: sub.id,
                                                title: sub.title,
                                                itemType: "sub-note",
                                                parentId: note.id,
                                                projectName: note.projectName,
                                                index: subIdx,
                                              })
                                            }
                                            onDragEnd={handleDragEnd}
                                            onDragOver={(e) => handleSubRowDragOver(e, note, sub, subIdx)}
                                            onDragLeave={(e) => handleSubRowDragLeave(e, sub)}
                                            onDrop={(e) => handleSubRowDrop(e, note, sub, subIdx)}
                                            className={`transition-all duration-150 ${
                                              isSubDragged ? "opacity-30 bg-slate-100" : ""
                                            } ${
                                              isSubDropTarget
                                                ? dragOverTarget.position === "above"
                                                  ? "border-t-2 border-t-[#4318FF] bg-indigo-50/50"
                                                  : "border-b-2 border-b-[#4318FF] bg-indigo-50/50"
                                                : "hover:bg-slate-50"
                                            }`}
                                          >
                                            <td className="py-3 px-5 text-center font-bold text-slate-700">
                                              <div className="flex items-center justify-center gap-1.5">
                                                <div
                                                  className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-[#4318FF] transition-colors rounded hover:bg-slate-100"
                                                  title="Drag to reorder sub-note"
                                                >
                                                  <GripVertical className="w-3.5 h-3.5" />
                                                </div>
                                                <span>{subIdx + 1}</span>
                                              </div>
                                            </td>
                                          <td className="py-3 px-6">
                                            <span
                                              onClick={() => handleStartView(sub)}
                                              className="font-semibold text-slate-800 hover:text-[#4318FF] transition cursor-pointer"
                                            >
                                              {sub.title}
                                            </span>
                                          </td>
                                          <td className="py-3 px-6 text-slate-600">
                                            <div>{dayjs(sub.createdAt).format("MMM DD, YYYY")}</div>
                                            <div className="text-[11px] text-slate-400">
                                              Created by {sub.createdBy || currentUser?.loginId || "Kusuma"}
                                            </div>
                                          </td>
                                          <td className="py-3 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                              {/* View Sub-Note Badge */}
                                              <button
                                                onClick={() => handleStartView(sub)}
                                                className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                                                title="View Sub-note"
                                              >
                                                <Eye className="w-4 h-4 text-[#4318FF]" />
                                              </button>

                                              {/* Edit Sub-Note Badge */}
                                              <button
                                                onClick={() => handleStartEdit(sub)}
                                                className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                                                title="Edit Sub-note"
                                              >
                                                <Edit3 className="w-4 h-4 text-[#4318FF]" />
                                              </button>

                                              {/* Delete Sub-Note Badge */}
                                              <Popconfirm
                                                title="Delete Sub-Note"
                                                description="Are you sure you want to delete this sub-note?"
                                                onConfirm={() => handleDeleteNote(sub.id)}
                                                okText="Delete"
                                                cancelText="Cancel"
                                                okButtonProps={{ danger: true }}
                                              >
                                                <button
                                                  className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] flex items-center justify-center transition cursor-pointer shadow-xs"
                                                  title="Delete Sub-note"
                                                >
                                                  <Trash2 className="w-4 h-4 text-[#EF4444]" />
                                                </button>
                                              </Popconfirm>
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
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Table Footer: Showing X of Y notes & Pagination */}
        {displayNotes.length > 0 && (
          <div className="p-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing {Math.min((currentPage - 1) * pageSize + 1, displayNotes.length)} -{" "}
              {Math.min(currentPage * pageSize, displayNotes.length)} of {displayNotes.length} notes
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center gap-1.5">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={`page-${pg}`}
                  onClick={() => setCurrentPage(pg)}
                  className={`w-7 h-7 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                    currentPage === pg
                      ? "bg-[#4318FF] text-white shadow-xs"
                      : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                  }`}
                >
                  {pg}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer Powered By Inventech */}
      <div className="text-center py-4 text-xs text-slate-400">
        © 2026 WorkSphere Powered by <strong className="text-slate-600 font-semibold">inventech</strong>
      </div>
    </div>
  );
};

export default NotesManagement;
