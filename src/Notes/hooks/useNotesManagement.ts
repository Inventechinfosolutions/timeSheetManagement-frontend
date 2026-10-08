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
import { useNoteDragDrop } from "./useNoteDragDrop";
import {
  buildDocumentPagesHtml,
  isNoteLandscape,
  orientationFromLandscape,
  paginateToA4Sheets,
  removeEmptyPages,
} from "../utils/documentLayout";
import {
  attachmentKeysInHtml,
  refreshAttachmentBadges,
} from "../utils/noteEditorAttachmentHelpers";
import {
  justifyImportedContent,
  wrapWideTablesInRoot,
  noteMatchesSearch,
  noteMatchesCreatedDate,
} from "../utils/notesHelpers";
import {
  parseExcelFile,
  parseExcelWorkbookFromHtml,
  isExcelFileName,
  workbookDataToFile,
  embedExcelWorkbookInHtml,
  stripExcelWorkbookStore,
  htmlHasVisibleNoteContent,
  mergeExcelWorkbooks,
  type ExcelWorkbookData,
} from "../utils/excelExtract";

export const useNotesManagement = (options?: { loadList?: boolean }) => {
  const loadList = options?.loadList !== false;
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
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

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
    if (!note?.id) return;
    dispatch(fetchNoteById(note.id))
      .unwrap()
      .then((full) => {
        if (!full) return;
        setSendNoteModal((prev) =>
          prev.open && prev.note?.id === note.id ? { open: true, note: full } : prev
        );
      })
      .catch(() => {
        /* list data is enough to send; names refresh when the note opens */
      });
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
    rotation: 0,
  });

  const [autoSaveStatus, setAutoSaveStatus] = useState<AutoSaveStatus>("idle");
  const autoSaveTimerRef = useRef<any>(null);
  const isSavingRef = useRef<boolean>(false);
  const lastSavedRef = useRef<{
    title: string;
    description: string;
    projectName: string;
    isPinned: boolean;
    isVertical: boolean;
    rotation: number;
  }>({
    title: "",
    description: "",
    projectName: "",
    isPinned: false,
    isVertical: true,
    rotation: 0,
  });

  const [isDraggingModalFile, setIsDraggingModalFile] = useState(false);
  const [textColor, setTextColor] = useState("#1B2559");
  const [highlightColor, setHighlightColor] = useState("transparent");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const doclingJsonInputRef = useRef<HTMLInputElement>(null);
  const excelExtractInputRef = useRef<HTMLInputElement>(null);
  const xlsImportInputRef = useRef<HTMLInputElement>(null);
  const [isImportingDocling, setIsImportingDocling] = useState(false);
  const [isExtractingExcel, setIsExtractingExcel] = useState(false);

  const editorRef = useRef<HTMLDivElement>(null);

  // searchQuery is already debounced via SearchBox (useDebounce)
  useEffect(() => {
    if (!loadList) return;
    loadNotes();
  }, [activeTab, selectedProject, searchQuery, fromDate, toDate, loadList]);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, selectedProject, searchQuery, fromDate, toDate]);

  const loadNotes = () => {
    if (activeTab === "ARCHIVED") {
      dispatch(
        fetchNotes({
          isArchived: true,
          search: searchQuery || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
        })
      );
    } else {
      dispatch(
        fetchNotes({
          type: activeTab,
          isArchived: false,
          projectName: activeTab === "PROJECT" ? selectedProject || undefined : undefined,
          search: searchQuery || undefined,
          fromDate: fromDate || undefined,
          toDate: toDate || undefined,
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

  /** Keep caret inside a real block in .page so formatBlock never turns the sheet into H1/H2 */
  const ensureEditableBlockInPage = () => {
    const editor = editorRef.current;
    if (!editor) return null;

    let page = editor.querySelector(":scope > .page") as HTMLElement | null;
    if (!page) {
      page = document.createElement("div");
      page.className = "page";
      page.setAttribute("data-page", "1");
      while (editor.firstChild) page.appendChild(editor.firstChild);
      editor.appendChild(page);
    }

    const sel = window.getSelection();
    const anchor =
      sel?.anchorNode?.nodeType === Node.ELEMENT_NODE
        ? (sel.anchorNode as HTMLElement)
        : sel?.anchorNode?.parentElement || null;

    // If caret is on the page/editor itself, put it in a paragraph first
    const onSheet =
      !anchor ||
      anchor === editor ||
      anchor === page ||
      (anchor.classList?.contains("page") && page.contains(anchor) && anchor.tagName === "DIV");

    let block = anchor?.closest?.("p, h1, h2, h3, h4, h5, h6, li, blockquote, pre") as HTMLElement | null;
    if (!block || !page.contains(block) || onSheet) {
      block = page.querySelector("p, h1, h2, h3, h4, h5, h6") as HTMLElement | null;
      if (!block) {
        block = document.createElement("p");
        block.innerHTML = "<br>";
        page.appendChild(block);
      }
      const range = document.createRange();
      range.selectNodeContents(block);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
    return block;
  };

  /** After H1/H2, repair if the browser converted .page into a heading (causes double sheet) */
  const repairPageAfterFormatBlock = () => {
    const editor = editorRef.current;
    if (!editor) return;

    // Heading that stole the .page class / replaced the sheet
    Array.from(editor.querySelectorAll("h1.page, h2.page, h3.page, p.page")).forEach((bad) => {
      const page = document.createElement("div");
      page.className = "page";
      page.setAttribute("data-page", "1");
      bad.classList.remove("page");
      bad.removeAttribute("data-page");
      bad.parentNode?.insertBefore(page, bad);
      page.appendChild(bad);
    });

    // Headings sitting directly under the editor (outside any .page)
    const looseBlocks = Array.from(editor.children).filter(
      (el) => !el.classList.contains("page")
    ) as HTMLElement[];
    if (looseBlocks.length > 0) {
      let page = editor.querySelector(":scope > .page") as HTMLElement | null;
      if (!page) {
        page = document.createElement("div");
        page.className = "page";
        page.setAttribute("data-page", "1");
        editor.appendChild(page);
      }
      looseBlocks.forEach((el) => page!.appendChild(el));
    }

    removeEmptyPages(editor);
    const landscape =
      editor.classList.contains("is-landscape") || isNoteLandscape(formData);
    // Collapse accidental extra sheets from formatBlock without full reflow thrash
    const pages = Array.from(editor.querySelectorAll(":scope > .page")) as HTMLElement[];
    if (pages.length > 1) {
      const first = pages[0];
      pages.slice(1).forEach((p) => {
        while (p.firstChild) first.appendChild(p.firstChild);
        p.remove();
      });
      paginateToA4Sheets(editor, landscape, true);
      removeEmptyPages(editor);
    }
  };

  // Rich Text Editor Commands
  const executeEditorCommand = (command: string, value: string = "") => {
    if (editorRef.current) {
      editorRef.current.focus();
    }
    try {
      if (command === "formatBlock") {
        ensureEditableBlockInPage();
        const success = document.execCommand("formatBlock", false, value);
        if (!success) {
          document.execCommand("formatBlock", false, value.replace(/[<>]/g, ""));
        }
        repairPageAfterFormatBlock();
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

  const paginateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runA4Pagination = (reflow = true) => {
    const editor = editorRef.current;
    if (!editor) return;
    const landscape =
      editor.classList.contains("is-landscape") || isNoteLandscape(formData);
    paginateToA4Sheets(editor, landscape, reflow);
    setFormData((prev) => ({
      ...prev,
      description: editor.innerHTML,
    }));
  };

  const persistExcelToMinio = async (workbook: ExcelWorkbookData): Promise<ExcelWorkbookData> => {
    const file = workbookDataToFile(workbook);
    // Upload to MinIO only — do not pass noteId (that would list it under Files & Attachments)
    const res = await dispatch(
      uploadDirectNoteFiles({
        files: [file],
      })
    ).unwrap();
    const uploaded = Array.isArray(res.uploaded) ? res.uploaded[0] : res.uploaded;
    const key = uploaded?.key || uploaded?.fileKey || workbook.fileKey;
    return {
      ...workbook,
      fileKey: key,
      fileName: workbook.fileName || file.name,
    };
  };

  async function handleExcelExtract(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".xlsx", ".xls", ".csv"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      message.error("Please upload an Excel file (.xlsx, .xls, .csv)");
      e.target.value = "";
      return;
    }

    try {
      setIsExtractingExcel(true);
      message.loading({ content: "Loading spreadsheet...", key: "excel-extract", duration: 0 });
      const parsed = await parseExcelFile(file, file.name);

      // Already in spreadsheet mode — merge sheets, keep previous
      if (formData.excelWorkbook) {
        const merged = mergeExcelWorkbooks(formData.excelWorkbook, parsed);
        const saved = await persistExcelToMinio(merged);
        const existingHtml =
          editorRef.current?.innerHTML ||
          stripExcelWorkbookStore(formData.description) ||
          "";
        setFormData((prev) => ({
          ...prev,
          excelWorkbook: saved,
          description: embedExcelWorkbookInHtml(existingHtml, saved),
          title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
          // Spreadsheet lives in Description viewer — not Files & Attachments
        }));
        message.success({
          content: "Excel sheets added to the existing spreadsheet",
          key: "excel-extract",
        });
        return;
      }

      // Keep existing A4/description content; open Excel grid viewer alongside it
      const existingHtml = (
        editorRef.current?.innerHTML ||
        stripExcelWorkbookStore(formData.description) ||
        ""
      ).trim();
      const hadContent = htmlHasVisibleNoteContent(existingHtml);
      const saved = await persistExcelToMinio(parsed);

      setFormData((prev) => ({
        ...prev,
        excelWorkbook: saved,
        description: embedExcelWorkbookInHtml(existingHtml, saved),
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
        // Spreadsheet lives in Description viewer — not Files & Attachments
      }));

      message.success({
        content: hadContent
          ? "Excel added below your existing description (spreadsheet viewer)"
          : "Excel opened in the spreadsheet viewer",
        key: "excel-extract",
      });
    } catch (err: any) {
      console.error("Excel extract error:", err);
      message.error({
        content: err?.response?.data?.message || err?.message || "Failed to extract Excel",
        key: "excel-extract",
      });
    } finally {
      setIsExtractingExcel(false);
      e.target.value = "";
    }
  }

  const handleXlsImport = handleExcelExtract;

  const hydrateExcelWorkbook = async (note: Note): Promise<ExcelWorkbookData | null> => {
    // Only show Excel in Description when the note was saved as an Excel document
    // (hidden workbook store in description). A normal .xlsx under Files must NOT
    // replace the description with the spreadsheet viewer.
    const stored = parseExcelWorkbookFromHtml(note.description);
    if (!stored) return null;

    const matchedAtt =
      note.attachments?.find(
        (a) => (a.key || a.fileKey) && (a.key || a.fileKey) === stored.fileKey
      ) ||
      note.attachments?.find(
        (a) => (a.fileName || a.name) === stored.fileName && isExcelFileName(a.fileName || a.name)
      );
    const fileKey = stored.fileKey || matchedAtt?.key || matchedAtt?.fileKey;
    const fileName =
      stored.fileName || matchedAtt?.fileName || matchedAtt?.name || "Spreadsheet.xlsx";

    if (stored.sheetNames?.length && stored.sheetsData && Object.keys(stored.sheetsData).length) {
      return { ...stored, fileKey, fileName };
    }
    if (!fileKey) return null;

    const response = await dispatch(
      previewNoteAttachment({ key: fileKey, fileName })
    ).unwrap();
    const blob = new Blob([response.data]);
    const parsed = await parseExcelFile(blob, fileName);
    parsed.fileKey = fileKey;
    return parsed;
  };

  const resolveDescriptionForSave = async () => {
    const richHtml =
      editorRef.current?.innerHTML ||
      stripExcelWorkbookStore(formData.description) ||
      "";
    if (!formData.excelWorkbook) {
      return richHtml || formData.description || "";
    }
    const saved = await persistExcelToMinio(formData.excelWorkbook);
    const merged = embedExcelWorkbookInHtml(richHtml, saved);
    setFormData((prev) => ({
      ...prev,
      excelWorkbook: saved,
      description: merged,
    }));
    return merged;
  };

  const getSavedDescription = () => {
    const richHtml =
      editorRef.current?.innerHTML ||
      stripExcelWorkbookStore(formData.description) ||
      "";
    if (formData.excelWorkbook) {
      return embedExcelWorkbookInHtml(richHtml, formData.excelWorkbook);
    }
    return richHtml || formData.description || "";
  };

  const handleEditorInput = (opts?: { skipPagination?: boolean }) => {
    if (editorRef.current) {
      setFormData((prev) => ({
        ...prev,
        description: editorRef.current?.innerHTML || "",
      }));
    }
    if (paginateTimerRef.current) {
      clearTimeout(paginateTimerRef.current);
      paginateTimerRef.current = null;
    }
    // Undo/redo restores exact HTML — re-paginating would wipe the undo result
    if (opts?.skipPagination) return;
    paginateTimerRef.current = setTimeout(() => runA4Pagination(false), 400);
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
      rotation: 0,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    lastSavedRef.current = {
      title: "",
      description: "",
      projectName: initialProject,
      isPinned: false,
      isVertical: true,
      rotation: 0,
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
      isVertical: true,
      rotation: 0,
    });
    if (editorRef.current) {
      editorRef.current.innerHTML = "";
    }
    lastSavedRef.current = {
      title: "",
      description: "",
      projectName: initialProject,
      isPinned: false,
      isVertical: true,
      rotation: 0,
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
    const initialWorkbook = parseExcelWorkbookFromHtml(note.description);
    const noteOrient = orientationFromLandscape(isNoteLandscape(note));
    setFormData({
      title: note.title,
      description: note.description || "",
      type: note.type,
      projectName: note.projectName || "",
      attachmentKeys: [],
      attachments: [],
      files: [],
      isPinned: note.isPinned || false,
      isAutoSave: !!note.isAutoSave,
      isVertical: noteOrient.isVertical,
      rotation: noteOrient.rotation,
    });
    lastSavedRef.current = {
      title: note.title,
      description: note.description || "",
      projectName: note.projectName || "",
      isPinned: note.isPinned || false,
      isVertical: noteOrient.isVertical,
      rotation: noteOrient.rotation,
    };
    setAutoSaveStatus("idle");
    setPageMode("edit");
    window.scrollTo({ top: 0, behavior: "smooth" });

    // Call API GET /api/notes/:id to fetch fresh detailed note data
    try {
      const detailedNote = await dispatch(fetchNoteById(note.id)).unwrap();
      if (detailedNote) {
        setActiveNote(detailedNote);
        const workbook = await hydrateExcelWorkbook(detailedNote);
        const detailOrient = orientationFromLandscape(isNoteLandscape(detailedNote));
        const embeddedKeys = attachmentKeysInHtml(detailedNote.description);
        if (workbook?.fileKey) embeddedKeys.add(workbook.fileKey);
        const filesOnlyKeys = (detailedNote.attachments || [])
          .map((a) => a.key || a.fileKey)
          .filter(
            (k): k is string =>
              Boolean(k) && !embeddedKeys.has(String(k))
          );
        setFormData({
          title: detailedNote.title,
          description: detailedNote.description || "",
          type: detailedNote.type,
          projectName: detailedNote.projectName || "",
          // Keep only true Files-section keys (exclude Excel / table-row embeds)
          attachmentKeys: filesOnlyKeys,
          attachments: [],
          files: [],
          isPinned: detailedNote.isPinned || false,
          isAutoSave: !!detailedNote.isAutoSave,
          isVertical: detailOrient.isVertical,
          rotation: detailOrient.rotation,
          excelWorkbook: workbook,
        });
        lastSavedRef.current = {
          title: detailedNote.title,
          description: detailedNote.description || "",
          projectName: detailedNote.projectName || "",
          isPinned: detailedNote.isPinned || false,
          isVertical: detailOrient.isVertical,
          rotation: detailOrient.rotation,
        };
        if (editorRef.current) {
          // Keep visible HTML even when an Excel workbook is also attached
          editorRef.current.innerHTML =
            stripExcelWorkbookStore(detailedNote.description) ||
            (workbook ? "" : detailedNote.description || "");
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
        const workbook = await hydrateExcelWorkbook(detailedNote);
        setFormData((prev) => ({
          ...prev,
          excelWorkbook: workbook,
          description: detailedNote.description || prev.description,
        }));
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

  const getNotesImportMaxPages = () => {
    const raw = Number(import.meta.env.VITE_NOTES_IMPORT_MAX_PAGES);
    return Number.isFinite(raw) && raw > 0 ? raw : 50;
  };

  const getExtractedPageCount = (data: any): number => {
    if (typeof data?.pageCount === "number" && data.pageCount > 0) return data.pageCount;
    if (Array.isArray(data?.pages) && data.pages.length > 0) return data.pages.length;
    const jsonPages = data?.json?.pages;
    if (jsonPages && typeof jsonPages === "object") {
      return Object.keys(jsonPages).length;
    }
    return 0;
  };

  /** Attach a long PDF/Doc under Files & Attachments (not Description). */
  const attachFileToFilesSection = async (file: File) => {
    const res = await dispatch(
      uploadDirectNoteFiles({
        noteId: activeNote?.id,
        files: [file],
      })
    ).unwrap();
    const uploaded = Array.isArray(res.uploaded) ? res.uploaded[0] : res.uploaded;
    const key = uploaded?.key || uploaded?.fileKey;
    if (!key) throw new Error("Upload succeeded but no file key was returned");

    setFormData((prev) => ({
      ...prev,
      title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
      attachmentKeys: prev.attachmentKeys.includes(key)
        ? prev.attachmentKeys
        : [...prev.attachmentKeys, key],
      attachments: [
        ...prev.attachments,
        {
          id: uploaded?.id,
          key,
          fileKey: key,
          name: uploaded?.fileName || uploaded?.name || file.name,
          size: uploaded?.fileSize || uploaded?.size || file.size,
          file,
        },
      ],
    }));

    if (activeNote?.id) {
      const updated = await dispatch(fetchNoteById(activeNote.id)).unwrap();
      if (updated) setActiveNote(updated);
    }
  };

  // Upload Docling File / JSON handler
  const handleDoclingJsonUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validExtensions = [".pdf", ".docx", ".doc"];
    const fileExt = file.name.substring(file.name.lastIndexOf(".")).toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      message.error("Please upload a PDF or Word document (.pdf, .docx, .doc)");
      return;
    }

    const uploadData = new FormData();
    uploadData.append("files", file);
    uploadData.append("file", file);
    const maxPages = getNotesImportMaxPages();

    try {
      setIsImportingDocling(true);
      message.loading({ content: "Extracting document with Docling...", key: "docling-import", duration: 0 });

      const response = await axios.post("/api/notes/extract", uploadData, {
        timeout: 600000,
      });

      const pageCount = getExtractedPageCount(response.data);
      const serverMax = Number(response.data?.maxPages);
      const effectiveMax =
        Number.isFinite(serverMax) && serverMax > 0 ? serverMax : maxPages;
      const tooLong =
        Boolean(response.data?.tooLong) ||
        (pageCount > 0 && pageCount > effectiveMax);

      // Too long for Description → attach under Files & Attachments instead
      if (tooLong) {
        try {
          await attachFileToFilesSection(file);
          message.warning({
            content:
              response.data?.message ||
              `Document is too long${pageCount ? ` (${pageCount} pages)` : ""}; max ${effectiveMax} pages for Description. Added to Files & Attachments instead.`,
            key: "docling-import",
            duration: 7,
          });
        } catch (attachErr: any) {
          message.error({
            content:
              attachErr?.message ||
              "Document is too long for Description, and attaching to Files failed. Please use Files & Attachments to upload it.",
            key: "docling-import",
            duration: 7,
          });
        }
        return;
      }

      const generatedHtml = buildDocumentPagesHtml(
        response.data?.description || response.data?.html || "",
        response.data?.json,
        response.data?.markdown,
        response.data?.pages,
        isNoteLandscape(formData)
      );
      const hasContent = /<(p|h1|h2|h3|li|td|img|table)\b/i.test(generatedHtml) &&
        /<(p|h1|h2|h3|li|td|img)\b[^>]*>[\s\S]*?<\/\1>|<img\b[^>]*\/?>/i.test(generatedHtml);

      // Keep existing A4 content AND any Excel workbook — never wipe either
      const existingWorkbook = formData.excelWorkbook;
      const existingVisible = stripExcelWorkbookStore(
        editorRef.current?.innerHTML || formData.description || ""
      ).trim();
      const existingHasContent = htmlHasVisibleNoteContent(existingVisible);
      const mergedVisible = existingHasContent
        ? `${existingVisible}${generatedHtml}`
        : generatedHtml;
      const withWorkbook = (html: string) =>
        existingWorkbook ? embedExcelWorkbookInHtml(html, existingWorkbook) : html;

      if (editorRef.current) {
        editorRef.current.innerHTML = mergedVisible;
        requestAnimationFrame(() => {
          if (!editorRef.current) return;
          const landscape = isNoteLandscape(formData);
          justifyImportedContent(editorRef.current, {
            landscape,
            reflowPages: true,
          });
          wrapWideTablesInRoot(editorRef.current);
          removeEmptyPages(editorRef.current);
          paginateToA4Sheets(editorRef.current, landscape, true);
          removeEmptyPages(editorRef.current);
          wrapWideTablesInRoot(editorRef.current);
          const finalVisible = editorRef.current.innerHTML || mergedVisible;
          setFormData((prev) => ({
            ...prev,
            description: withWorkbook(finalVisible),
            title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
            rotation: prev.rotation || 0,
            // Preserve spreadsheet if user already imported Excel
            excelWorkbook: prev.excelWorkbook ?? existingWorkbook,
          }));
        });
      }

      setFormData((prev) => ({
        ...prev,
        description: withWorkbook(mergedVisible),
        title: prev.title || file.name.replace(/\.[^/.]+$/, ""),
        rotation: prev.rotation || 0,
        excelWorkbook: prev.excelWorkbook ?? existingWorkbook,
      }));

      if (!hasContent) {
        message.warning({
          content: "Pages were created, but Docling returned no text or images for this file. Restart the Docling service and try again.",
          key: "docling-import",
          duration: 6,
        });
        return;
      }

      // Import goes into Description only — do not list under Files & Attachments
      message.success({
        content: existingWorkbook
          ? "Document added; existing Excel spreadsheet kept."
          : existingHasContent
            ? "Document added below your existing description."
            : "Document extracted into Description box! You can now edit it directly.",
        key: "docling-import",
      });
    } catch (err: any) {
      console.error("Docling conversion error:", err);
      const data = err.response?.data;
      const code = data?.code || data?.message?.code;
      const tooLongError =
        err.response?.status === 413 ||
        code === "DOCUMENT_TOO_LONG" ||
        data?.attachAsFile ||
        data?.attach_as_file ||
        data?.tooLong;

      if (tooLongError) {
        const pageCount =
          Number(data?.pageCount || data?.page_count || data?.message?.pageCount) || 0;
        const limit =
          Number(data?.maxPages || data?.max_pages || data?.message?.maxPages) ||
          maxPages;
        const warnText =
          (typeof data?.message === "string" && data.message) ||
          data?.message?.message ||
          `Document is too long${pageCount ? ` (${pageCount} pages)` : ""}; max ${limit} pages for Description. Added to Files & Attachments instead.`;
        try {
          await attachFileToFilesSection(file);
          message.warning({ content: warnText, key: "docling-import", duration: 7 });
        } catch (attachErr: any) {
          message.error({
            content:
              attachErr?.message ||
              "Document is too long for Description, and attaching to Files failed. Please use Files & Attachments to upload it.",
            key: "docling-import",
            duration: 7,
          });
        }
        return;
      }

      const timedOut = err.code === "ECONNABORTED" || /timeout/i.test(err.message || "");
      const apiMessage =
        (typeof data?.message === "string" && data.message) ||
        data?.message?.message ||
        data?.detail;
      message.error({
        content: timedOut
          ? "Import timed out. Keep the Docling service running and try a smaller file."
          : apiMessage || "Failed to parse document with Docling",
        key: "docling-import",
      });
    } finally {
      setIsImportingDocling(false);
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

    const currentDescription = await resolveDescriptionForSave();

    const hasChanged =
      trimmedTitle !== lastSavedRef.current.title ||
      currentDescription !== lastSavedRef.current.description ||
      formData.projectName.trim() !== lastSavedRef.current.projectName ||
      !!formData.isPinned !== !!lastSavedRef.current.isPinned ||
      (formData.rotation || 0) !== (lastSavedRef.current.rotation || 0) ||
      !!formData.isVertical !== !!lastSavedRef.current.isVertical;

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
              rotation: formData.rotation || 0,
            })
          ).unwrap();

          const createdSub = res?.subNote || res;
          if (createdSub) {
            lastSavedRef.current = {
              title: trimmedTitle,
              description: currentDescription,
              projectName: formData.projectName.trim(),
              isPinned: !!formData.isPinned,
              isVertical: formData.isVertical !== false,
              rotation: formData.rotation || 0,
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
              isVertical: formData.isVertical !== false,
              rotation: formData.rotation || 0,
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
              isVertical: formData.isVertical !== false,
              rotation: formData.rotation || 0,
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
            isVertical: formData.isVertical !== false,
            rotation: formData.rotation || 0,
          })
        ).unwrap();

        if (updated) {
          lastSavedRef.current = {
            title: trimmedTitle,
            description: currentDescription,
            projectName: formData.type === "PROJECT" ? formData.projectName.trim() : "",
            isPinned: !!formData.isPinned,
            isVertical: formData.isVertical !== false,
            rotation: formData.rotation || 0,
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
      !!formData.isPinned !== !!lastSavedRef.current.isPinned ||
      (formData.rotation || 0) !== (lastSavedRef.current.rotation || 0) ||
      !!formData.isVertical !== !!lastSavedRef.current.isVertical;

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
    formData.rotation,
    formData.isVertical,
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

    const currentDescription = await resolveDescriptionForSave();

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
              rotation: formData.rotation || 0,
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
              isVertical: formData.isVertical !== false,
              rotation: formData.rotation || 0,
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
            isVertical: formData.isVertical !== false,
            rotation: formData.rotation || 0,
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
        isVertical: formData.isVertical !== false,
        rotation: formData.rotation || 0,
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

  // Preview Attachment — keep Excel inside the app (modal), same as PDF/images
  const handlePreviewAttachment = async (item: NoteDocumentItem) => {
    const displayName = item.name || item.fileName || "document";
    const ext = displayName.split(".").pop()?.toLowerCase() || "";
    const isExcel = ["xlsx", "xls", "csv"].includes(ext);

    if (item.file) {
      if (isExcel) {
        setExcelViewerModal({
          open: true,
          fileName: displayName,
          file: item.file,
          blob: null,
          onDownload: () => handleDownloadAttachment(item),
        });
      } else {
        const localUrl = URL.createObjectURL(item.file);
        setPreviewImageModal({ open: true, url: localUrl, title: displayName });
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
      const response = await dispatch(
        previewNoteAttachment({ key, fileName: displayName })
      ).unwrap();
      hide();
      const contentType = response.headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });

      if (isExcel) {
        setExcelViewerModal({
          open: true,
          fileName: displayName,
          blob,
          file: null,
          onDownload: () => handleDownloadAttachment(item),
        });
        return;
      }

      const blobUrl = window.URL.createObjectURL(blob);
      setPreviewImageModal({ open: true, url: blobUrl, title: displayName });
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

  const handleSearchChange = (val: string) => {
    dispatch(setSearchQuery(val));
  };

  const handleClearSearch = () => {
    dispatch(setSearchQuery(""));
  };

  const handleFromDateChange = (value: string) => {
    setFromDate(value);
  };

  const handleToDateChange = (value: string) => {
    setToDate(value);
  };

  const handleClearDates = () => {
    setFromDate("");
    setToDate("");
  };

  // Filtered Notes (tab/project + search and created date, including child notes)
  const displayNotes = useMemo(() => {
    const searchOn = Boolean(searchQuery.trim());
    const dateOn = Boolean(fromDate || toDate);
    return notes.filter((n) => {
      if (activeTab === "ARCHIVED") {
        if (!n.isArchived) return false;
      } else {
        if (n.isArchived) return false;
        if (activeTab === "PERSONAL" && n.type !== "PERSONAL") return false;
        if (activeTab === "PROJECT") {
          if (n.type !== "PROJECT") return false;
          if (
            selectedProject &&
            n.projectName?.toLowerCase() !== selectedProject.toLowerCase()
          ) {
            return false;
          }
        }
      }

      if (!searchOn && !dateOn) return true;

      const parentMatches =
        noteMatchesSearch(n, searchQuery) &&
        noteMatchesCreatedDate(n.createdAt, fromDate, toDate);
      const childMatches = (n.subNotes || []).some(
        (sub) =>
          noteMatchesSearch(sub, searchQuery) &&
          noteMatchesCreatedDate(sub.createdAt, fromDate, toDate),
      );
      return parentMatches || childMatches;
    });
  }, [notes, activeTab, selectedProject, searchQuery, fromDate, toDate]);

  useEffect(() => {
    if (!searchQuery.trim() && !fromDate && !toDate) return;
    const parentIds = displayNotes
      .filter((note) => {
        const parentMatches =
          noteMatchesSearch(note, searchQuery) &&
          noteMatchesCreatedDate(note.createdAt, fromDate, toDate);
        const childMatches = (note.subNotes || []).some(
          (sub) =>
            noteMatchesSearch(sub, searchQuery) &&
            noteMatchesCreatedDate(sub.createdAt, fromDate, toDate),
        );
        return childMatches && !parentMatches;
      })
      .map((note) => note.id);
    if (parentIds.length === 0) return;
    setExpandedNotes((prev) => {
      const next = { ...prev };
      parentIds.forEach((id) => {
        next[id] = true;
      });
      return next;
    });
  }, [displayNotes, searchQuery, fromDate, toDate]);

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

  // Keys embedded in Description (table-row badges + Excel workbook) — hide from Files list
  const embeddedAttachmentKeys = useMemo(() => {
    const keys = attachmentKeysInHtml(formData.description);
    const excelKey =
      formData.excelWorkbook?.fileKey ||
      parseExcelWorkbookFromHtml(formData.description)?.fileKey;
    if (excelKey) keys.add(excelKey);
    // Also hide by Excel file name when older notes stored the workbook under Files
    const excelName =
      formData.excelWorkbook?.fileName ||
      parseExcelWorkbookFromHtml(formData.description)?.fileName;
    if (excelName) keys.add(`name:${excelName}`);
    return keys;
  }, [formData.description, formData.excelWorkbook]);

  const isFilesSectionAttachment = (key?: string | null, name?: string | null) => {
    if (key && embeddedAttachmentKeys.has(String(key))) return false;
    if (name && embeddedAttachmentKeys.has(`name:${name}`)) return false;
    return Boolean(key || name);
  };

  const totalAttachmentsCount =
    formData.attachments.filter((a) =>
      isFilesSectionAttachment(a.key || a.fileKey, a.name || a.fileName)
    ).length +
    (activeNote?.attachments || []).filter((a) =>
      isFilesSectionAttachment(a.key || a.fileKey, a.fileName || a.name)
    ).length;

  // Hydrate editor only when switching note / mode — NOT on every activeNote
  // object refresh (auto-save), or live edits + undo history get wiped.
  useEffect(() => {
    // Pure Excel notes: no A4 editor. Mixed notes: still hydrate visible HTML.
    if (
      formData.excelWorkbook &&
      !htmlHasVisibleNoteContent(formData.description)
    ) {
      return;
    }
    if ((pageMode === "create" || pageMode === "edit") && editorRef.current) {
      const nextHtml = buildDocumentPagesHtml(
        stripExcelWorkbookStore(formData.description) || "",
        undefined,
        undefined,
        undefined,
        isNoteLandscape(formData)
      );
      if (editorRef.current.innerHTML !== nextHtml) {
        editorRef.current.innerHTML = nextHtml;
      }
      refreshAttachmentBadges(editorRef.current);
      wrapWideTablesInRoot(editorRef.current);
      requestAnimationFrame(() => {
        if (editorRef.current) {
          paginateToA4Sheets(
            editorRef.current,
            isNoteLandscape(formData),
            true
          );
          refreshAttachmentBadges(editorRef.current);
          wrapWideTablesInRoot(editorRef.current);
        }
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only on note id / mode change
  }, [pageMode, activeNote?.id]);

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
    fromDate,
    toDate,
    handleFromDateChange,
    handleToDateChange,
    handleClearDates,
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
    excelExtractInputRef,
    isImportingDocling,
    isExtractingExcel,
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
    handleExcelExtract,
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
    handleSearchChange,
    handleClearSearch,
  };
};
