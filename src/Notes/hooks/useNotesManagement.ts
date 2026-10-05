import React, { useState, useEffect, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { message } from "antd";
import { useAppDispatch, useAppSelector } from "../../hooks";
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
  togglePinNote,
  toggleAutoSaveNote,
  toggleArchiveNote,
  downloadNoteAttachment,
  previewNoteAttachment,
  setActiveTab,
  setSelectedProject,
  setSearchQuery,
} from "../../reducers/notes.reducer";
import {
  Note,
  NoteType,
  PageMode,
  AutoSaveStatus,
  NotesFormData,
  NoteDocumentItem,
  PreviewImageModalState,
  ExcelViewerModalState,
} from "../types/notes.types";
import { openExcelInNewTab } from "../../utils/excelViewer";
import { useNoteDragDrop } from "./useNoteDragDrop";

export const useNotesManagement = () => {
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
  const [pageMode, setPageMode] = useState<PageMode>("list");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Accordion expansion state for sub-tables
  const [expandedNotes, setExpandedNotes] = useState<Record<number, boolean>>({});

  // Active note for View and Edit
  const [activeNote, setActiveNote] = useState<Note | null>(null);

  // Parent Note context when creating a sub-note
  const [parentNoteContext, setParentNoteContext] = useState<Note | null>(null);

  // Success Toast state
  const [showSaveToast, setShowSaveToast] = useState(false);

  // Excel / Image preview modals
  const [previewImageModal, setPreviewImageModal] = useState<PreviewImageModalState>({
    open: false,
    url: "",
    title: "",
  });

  const [excelViewerModal, setExcelViewerModal] = useState<ExcelViewerModalState>({
    open: false,
    fileName: "",
    blob: null,
    file: null,
  });

  // Send Note Modal State
  const [sendNoteModal, setSendNoteModal] = useState<{
    open: boolean;
    note: Note | null;
  }>({
    open: false,
    note: null,
  });

  const handleOpenSendModal = (note: Note) => {
    setSendNoteModal({ open: true, note });
  };

  const handleCloseSendModal = () => {
    setSendNoteModal({ open: false, note: null });
  };


  // Form State
  const [formData, setFormData] = useState<NotesFormData>({
    title: "",
    description: "",
    type: "PROJECT",
    projectName: "",
    attachmentKeys: [],
    attachments: [],
    files: [],
    isPinned: false,
    isAutoSave: false,
    isVertical: true,
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const autoSaveTimerRef = useRef<any>(null);
  const isSavingRef = useRef<boolean>(false);
  const lastSavedRef = useRef<{
    title: string;
    description: string;
    projectName: string;
    isPinned: boolean;
  }>({
    title: "",
    description: "",
    projectName: "",
    isPinned: false,
  });

  const [isDraggingModalFile, setIsDraggingModalFile] = useState(false);
  const [textColor, setTextColor] = useState("#1B2559");
  const [highlightColor, setHighlightColor] = useState("transparent");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const doclingJsonInputRef = useRef<HTMLInputElement>(null);
  const xlsImportInputRef = useRef<HTMLInputElement>(null);
  const [isImportingDocling, setIsImportingDocling] = useState(false);

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
    if (activeTab === "ARCHIVED") {
      dispatch(
        fetchNotes({
          isArchived: true,
          search: searchQuery || undefined,
        })
      );
    } else {
      dispatch(
        fetchNotes({
          type: activeTab,
          isArchived: false,
          projectName: activeTab === "PROJECT" ? selectedProject || undefined : undefined,
          search: searchQuery || undefined,
        })
      );
    }
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

  // Rich Text Editor Commands
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
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setParentNoteContext(null);
    setActiveNote(null);
    const initialProject = noteType === "PROJECT" ? selectedProject || "" : "";
    setFormData({
      title: "",
      description: "",
      type: noteType,
      projectName: initialProject,
      attachmentKeys: [],
      attachments: [],
      files: [],
      isPinned: false,
      isAutoSave: false,
      isVertical: true,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    lastSavedRef.current = {
      title: "",
      description: "",
      projectName: initialProject,
      isPinned: false,
    };
    setAutoSaveStatus("idle");
    setPageMode("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Start Create Sub-Note (+ Add Note button in Sub-Table)
  const handleStartCreateSubNote = (parent: Note) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setParentNoteContext(parent);
    setActiveNote(null);
    const initialProject = parent.projectName || "";
    setFormData({
      title: "",
      description: "",
      type: parent.type,
      projectName: initialProject,
      attachmentKeys: [],
      attachments: [],
      files: [],
      isPinned: false,
      isAutoSave: false,
      isVertical: parent.isVertical ?? true,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    lastSavedRef.current = {
      title: "",
      description: "",
      projectName: initialProject,
      isPinned: false,
    };
    setAutoSaveStatus("idle");
    setPageMode("create");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Start Edit Note or Sub-Note (fetches fresh details from API)
  const handleStartEdit = async (note: Note) => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
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
      isPinned: note.isPinned || false,
      isAutoSave: note.isAutoSave ?? false,
      isVertical: note.isVertical ?? true,
    });
    lastSavedRef.current = {
      title: note.title,
      description: note.description || "",
      projectName: note.projectName || "",
      isPinned: note.isPinned || false,
    };
    setAutoSaveStatus("idle");
    setPageMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Call API GET /api/notes/:id to fetch fresh detailed note data
    try {
      const detailedNote = await dispatch(fetchNoteById(note.id)).unwrap();
      if (detailedNote) {
        setActiveNote(detailedNote);
        setFormData({
          title: detailedNote.title,
          description: detailedNote.description || "",
          type: detailedNote.type,
          projectName: detailedNote.projectName || "",
          attachmentKeys: [],
          attachments: [],
          files: [],
          isPinned: detailedNote.isPinned || false,
          isAutoSave: detailedNote.isAutoSave ?? false,
          isVertical: detailedNote.isVertical ?? true,
        });
        lastSavedRef.current = {
          title: detailedNote.title,
          description: detailedNote.description || "",
          projectName: detailedNote.projectName || "",
          isPinned: detailedNote.isPinned || false,
        };
        if (editorRef.current) {
          editorRef.current.innerHTML = detailedNote.description || "";
        }
      }
    } catch (err) {
      console.warn("Failed to fetch fresh note details on edit:", err);
    }
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

  const location = useLocation();

  // Listen to navigation state (e.g. navigating to edit or view a specific note)
  useEffect(() => {
    const state = location.state as { editNoteId?: number; viewNoteId?: number } | null;
    if (state?.editNoteId) {
      dispatch(fetchNoteById(state.editNoteId))
        .unwrap()
        .then((note) => {
          if (note) {
            handleStartEdit(note);
          }
        })
        .catch((err) => console.warn("Failed to load note for edit from location state:", err));
    } else if (state?.viewNoteId) {
      dispatch(fetchNoteById(state.viewNoteId))
        .unwrap()
        .then((note) => {
          if (note) {
            handleStartView(note);
          }
        })
        .catch((err) => console.warn("Failed to load note for view from location state:", err));
    }
  }, [location.state]);

  // Back to Main List View
  const handleBackToList = () => {
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }
    setAutoSaveStatus("idle");
    setPageMode("list");
    setActiveNote(null);
    setParentNoteContext(null);
    loadNotes();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Upload Docling File / JSON handler
  const handleDoclingJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".pdf", ".docx", ".doc", ".png", ".jpg", ".jpeg", ".json"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      message.error("Please upload a PDF, DOCX, or Docling JSON file");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("files", file);
    uploadData.append("file", file);

    try {
      setIsImportingDocling(true);
      message.loading({ content: "Extracting document with Docling...", key: "docling-import", duration: 0 });

      const response = await axios.post("/api/notes/extract", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const generatedHtml = response.data?.description || response.data?.html || "";

      if (editorRef.current) {
        editorRef.current.innerHTML = generatedHtml;
      }

      setFormData((prev) => ({
        ...prev,
        description: generatedHtml,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));

      message.success({
        content: "Document extracted into Description box! You can now edit it directly.",
        key: "docling-import",
      });
    } catch (err: any) {
      console.error("Docling conversion error:", err);
      message.error({
        content: err.response?.data?.message || "Failed to parse document with Docling",
        key: "docling-import",
      });
    } finally {
      setIsImportingDocling(false);
      if (e.target) e.target.value = "";
    }
  };

  // Handle XLS/Excel file import — calls the extract API and inserts into editor
  const handleXlsImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      message.error("Please upload an Excel file (.xlsx, .xls, .csv)");
      if (e.target) e.target.value = "";
      return;
    }

    const uploadData = new FormData();
    uploadData.append("files", file);
    uploadData.append("file", file);

    try {
      message.loading({ content: "Extracting Excel data...", key: "xls-import", duration: 0 });

      const response = await axios.post("/api/notes/extract", uploadData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const generatedHtml = response.data?.description || response.data?.html || "";

      if (editorRef.current) {
        editorRef.current.innerHTML = generatedHtml;
      }

      setFormData((prev) => ({
        ...prev,
        description: generatedHtml,
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      }));

      message.success({
        content: "Excel data extracted into Description box! You can now edit it directly.",
        key: "xls-import",
      });
    } catch (err: any) {
      console.error("Excel extraction error:", err);
      message.error({
        content: err.response?.data?.message || "Failed to extract Excel data",
        key: "xls-import",
      });
    } finally {
      if (e.target) e.target.value = "";
    }
  };

  // Process and Upload Files
  const handleProcessUploadFiles = async (filesToUpload: File[]) => {
    if (!filesToUpload || filesToUpload.length === 0) return;

    message.loading({ content: `Uploading ${filesToUpload.length} file(s)...`, key: "upload-file-toast" });

    if (pageMode === "view" && activeNote?.id) {
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

  // Perform silent background Auto-Save
  const performAutoSave = async () => {
    if (isSavingRef.current) return;

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) return;
    if (formData.type === "PROJECT" && !formData.projectName.trim()) return;

    const currentDescription = editorRef.current ? editorRef.current.innerHTML : (formData.description || "");

    const hasChanged =
      trimmedTitle !== lastSavedRef.current.title ||
      currentDescription !== lastSavedRef.current.description ||
      formData.projectName.trim() !== lastSavedRef.current.projectName ||
      !!formData.isPinned !== !!lastSavedRef.current.isPinned;

    if (!hasChanged) {
      return;
    }

    try {
      isSavingRef.current = true;
      setAutoSaveStatus("saving");

      if (pageMode === "create") {
        if (parentNoteContext) {
          const res = await dispatch(
            createSubNote({
              parentId: parentNoteContext.id,
              title: trimmedTitle,
              description: currentDescription,
              attachmentKeys: formData.attachmentKeys,
              files: formData.files.length > 0 ? formData.files : undefined,
            })
          ).unwrap();

          const createdSub = res?.subNote || res;
          if (createdSub) {
            lastSavedRef.current = {
              title: trimmedTitle,
              description: currentDescription,
              projectName: formData.projectName.trim(),
              isPinned: !!formData.isPinned,
            };
            setActiveNote(createdSub);
            setPageMode("edit");
            setAutoSaveStatus("saved");
            dispatch(fetchNoteStats());
            loadNotes();
          }
        } else {
          const created = await dispatch(
            createNote({
              title: trimmedTitle,
              description: currentDescription,
              type: formData.type,
              projectName: formData.type === "PROJECT" ? formData.projectName.trim() : undefined,
              color: "#4318FF",
              isPinned: formData.isPinned,
              isAutoSave: formData.isAutoSave,
              isVertical: formData.isVertical ?? true,
              attachmentKeys: formData.attachmentKeys,
              files: formData.files.length > 0 ? formData.files : undefined,
            })
          ).unwrap();

          if (created) {
            lastSavedRef.current = {
              title: trimmedTitle,
              description: currentDescription,
              projectName: formData.type === "PROJECT" ? formData.projectName.trim() : "",
              isPinned: !!formData.isPinned,
            };
            setActiveNote(created);
            setPageMode("edit");
            setAutoSaveStatus("saved");
            dispatch(fetchNoteStats());
            loadNotes();
          }
        }
      } else if (pageMode === "edit" && activeNote?.id) {
        const updated = await dispatch(
          updateNote({
            id: activeNote.id,
            title: trimmedTitle,
            description: currentDescription,
            type: formData.type,
            projectName: formData.type === "PROJECT" ? formData.projectName.trim() : undefined,
            isPinned: formData.isPinned,
            autoSave: formData.isAutoSave,
            isVertical: formData.isVertical ?? true,
          })
        ).unwrap();

        if (updated) {
          lastSavedRef.current = {
            title: trimmedTitle,
            description: currentDescription,
            projectName: formData.type === "PROJECT" ? formData.projectName.trim() : "",
            isPinned: !!formData.isPinned,
          };
          setActiveNote(updated);
          setAutoSaveStatus("saved");
          dispatch(fetchNoteStats());
        }
      }
    } catch (err) {
      console.warn("Auto-save error:", err);
      setAutoSaveStatus("error");
    } finally {
      isSavingRef.current = false;
    }
  };

  // Watch for form changes to trigger debounced auto-save
  useEffect(() => {
    if (pageMode !== "create" && pageMode !== "edit") {
      return;
    }

    if (!formData.isAutoSave) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      return;
    }

    const trimmedTitle = formData.title.trim();
    if (!trimmedTitle) {
      return;
    }

    if (formData.type === "PROJECT" && !formData.projectName.trim()) {
      return;
    }

    const currentDesc = editorRef.current ? editorRef.current.innerHTML : (formData.description || "");
    const hasChanged =
      trimmedTitle !== lastSavedRef.current.title ||
      currentDesc !== lastSavedRef.current.description ||
      formData.projectName.trim() !== lastSavedRef.current.projectName ||
      !!formData.isPinned !== !!lastSavedRef.current.isPinned;

    if (!hasChanged) {
      return;
    }

    setAutoSaveStatus("unsaved");

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(() => {
      performAutoSave();
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
    };
  }, [
    formData.title,
    formData.description,
    formData.projectName,
    formData.isPinned,
    formData.isAutoSave,
    pageMode,
    activeNote?.id,
  ]);

  // Toggle Auto-Save Setting
  const handleToggleAutoSave = async () => {
    const nextVal = !formData.isAutoSave;
    setFormData((prev) => ({ ...prev, isAutoSave: nextVal }));
    if (!nextVal) {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current);
      }
      setAutoSaveStatus("idle");
    } else {
      setAutoSaveStatus("unsaved");
    }

    if (activeNote?.id) {
      try {
        await dispatch(toggleAutoSaveNote({ id: activeNote.id, autoSave: nextVal })).unwrap();
      } catch (err) {
        console.warn("Failed to update autoSave setting on server:", err);
      }
    }
  };

  // Submit Note Form
  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();

    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

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
              isPinned: formData.isPinned,
              isAutoSave: formData.isAutoSave,
              isVertical: formData.isVertical ?? true,
              attachmentKeys: formData.attachmentKeys,
              files: formData.files.length > 0 ? formData.files : undefined,
            })
          ).unwrap();
        }
      } else if (pageMode === "edit" && activeNote) {
        const updatedNote = await dispatch(
          updateNote({
            id: activeNote.id,
            title: formData.title.trim(),
            description: currentDescription,
            type: formData.type,
            projectName: formData.type === "PROJECT" ? formData.projectName.trim() : undefined,
            isPinned: formData.isPinned,
            autoSave: formData.isAutoSave,
            isVertical: formData.isVertical ?? true,
          })
        ).unwrap();

        if (updatedNote) {
          setActiveNote(updatedNote);
        }

        if (formData.files.length > 0) {
          await dispatch(
            uploadNoteAttachments({
              noteId: activeNote.id,
              files: formData.files,
            })
          ).unwrap();
        }
      }

      lastSavedRef.current = {
        title: formData.title.trim(),
        description: currentDescription,
        projectName: formData.type === "PROJECT" ? formData.projectName.trim() : "",
        isPinned: !!formData.isPinned,
      };
      setAutoSaveStatus("saved");
      triggerSuccessToast();
      dispatch(fetchNoteStats());
      dispatch(fetchProjectsList());
      handleBackToList();
    } catch (err: any) {
      message.error(err || "Failed to save note");
    }
  };

  // Toggle Pin Status
  const handleTogglePin = async (noteId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await dispatch(togglePinNote(noteId)).unwrap();
      message.success(updated.isPinned ? "Note pinned to top" : "Note unpinned");
      loadNotes();
      dispatch(fetchNoteStats());
      if (activeNote && activeNote.id === noteId) {
        setActiveNote(updated);
      }
    } catch (err: any) {
      message.error(err || "Failed to update pin status");
    }
  };

  // Toggle Archive Status
  const handleToggleArchive = async (noteId: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await dispatch(toggleArchiveNote(noteId)).unwrap();
      message.success(updated.isArchived ? "Note moved to archive" : "Note restored from archive");
      loadNotes();
      dispatch(fetchNoteStats());
      if (activeNote && activeNote.id === noteId) {
        setActiveNote(updated);
      }
    } catch (err: any) {
      message.error(err || "Failed to update archive status");
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

  // Filtered Notes
  const displayNotes = useMemo(() => {
    return notes.filter((n) => {
      if (activeTab === "ARCHIVED") return n.isArchived;
      if (n.isArchived) return false;
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

  // Drag and Drop Hook integration
  const dragDrop = useNoteDragDrop(displayNotes, (noteId) => {
    setExpandedNotes((prev) => ({ ...prev, [noteId]: true }));
  });

  // Total Attachments count
  const totalAttachmentsCount = formData.attachments.length + (activeNote?.attachments?.length || 0);

  // Set editor innerHTML on initial edit/create load
  useEffect(() => {
    if ((pageMode === "create" || pageMode === "edit") && editorRef.current) {
      if (editorRef.current.innerHTML !== (formData.description || "")) {
        editorRef.current.innerHTML = formData.description || "";
      }
    }
  }, [pageMode, activeNote]);

  return {
    notes,
    displayNotes,
    paginatedNotes,
    totalPages,
    currentPage,
    setCurrentPage,
    pageSize,
    activeTab,
    selectedProject,
    searchQuery,
    loading,
    actionLoading,
    currentUser,
    pageMode,
    setPageMode,
    activeNote,
    parentNoteContext,
    showSaveToast,
    previewImageModal,
    setPreviewImageModal,
    excelViewerModal,
    setExcelViewerModal,
    formData,
    setFormData,
    isDraggingModalFile,
    setIsDraggingModalFile,
    textColor,
    setTextColor,
    highlightColor,
    setHighlightColor,
    fileInputRef,
    doclingJsonInputRef,
    isImportingDocling,
    editorRef,
    expandedNotes,
    toggleExpand,
    handleTabSwitch,
    executeEditorCommand,
    handleEditorInput,
    handleInsertLink,
    handleStartCreate,
    handleStartCreateSubNote,
    handleStartEdit,
    handleStartView,
    handleBackToList,
    handleDoclingJsonUpload,
    handleProcessUploadFiles,
    handleFileChange,
    handleRemoveSelectedFile,
    handleSubmitForm,
    handleDeleteNote,
    handleDeleteAttachment,
    handlePreviewAttachment,
    handleDownloadAttachment,
    dragDrop,
    totalAttachmentsCount,
    handleTogglePin,
    handleToggleArchive,
    autoSaveStatus,
    handleToggleAutoSave,
    sendNoteModal,
    setSendNoteModal,
    handleOpenSendModal,
    handleCloseSendModal,
    xlsImportInputRef,
    handleXlsImport,
    dispatch,
    setSearchQuery,
  };
};
