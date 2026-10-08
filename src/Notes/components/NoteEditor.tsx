import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import {
  ArrowLeft,
  Paperclip,
  UploadCloud,
  CheckCircle2,
  Pin,
  Cloud,
  Loader2,
  Check,
  User,
  FileType2,
  RectangleHorizontal,
  FileSpreadsheet,
  AlignJustify,
  Undo2,
  Trash2,
  Copy,
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  Palette,
  Highlighter,
  Heading1,
  Heading2,
  Type,
  Table as TableIcon,
  PaintBucket,
  ChevronDown,
} from "lucide-react";
import { message, Popover } from "antd";
import { Toggle } from "../../components/ui";
import { Note, NotesFormData, NoteDocumentItem, AutoSaveStatus } from "../types/notes.types";
import { NoteAttachmentChip } from "./NoteAttachmentChip";
import {
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
  justifyImportedContent,
  sanitizeNoteHtmlForClipboard,
} from "../utils/notesHelpers";
import { FONT_SIZES, BOLD_DARK_COLORS, LIGHT_SHADING_COLORS } from "../utils/noteEditorConstants";
import { descriptionFromExcelWorkbook } from "../utils/excelExtract";
import {
  applyLandscapeToPages,
  paginateToA4Sheets,
  removeEmptyPages,
} from "../utils/documentLayout";
import {
  embedExcelWorkbookInHtml,
  htmlHasVisibleNoteContent,
  stripExcelWorkbookStore,
} from "../utils/excelExtract";
import { attachmentKeysInHtml } from "../utils/noteEditorAttachmentHelpers";
import { ExcelSpreadsheetView } from "../../components/ExcelSpreadsheetView";
import { useNoteTable } from "../hooks";
import { applyToolbarCommandToCells, getSelectedTableCells } from "../utils/noteEditorTableHelpers";

interface NoteEditorProps {
  formData: NotesFormData;
  setFormData: React.Dispatch<React.SetStateAction<NotesFormData>>;
  parentNoteContext: Note | null;
  activeNote: Note | null;
  actionLoading: boolean;
  showSaveToast: boolean;
  isDraggingModalFile: boolean;
  setIsDraggingModalFile: (val: boolean) => void;
  textColor: string;
  setTextColor: (val: string) => void;
  highlightColor: string;
  setHighlightColor: (val: string) => void;
  isImportingDocling: boolean;
  isExtractingExcel?: boolean;
  totalAttachmentsCount: number;
  editorRef: React.RefObject<HTMLDivElement | null>;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  doclingJsonInputRef: React.RefObject<HTMLInputElement | null>;
  excelExtractInputRef?: React.RefObject<HTMLInputElement | null>;
  onEditorInput: (opts?: { skipPagination?: boolean }) => void;
  onExecuteCommand: (command: string, value?: string) => void;
  onInsertLink: () => void;
  onDoclingUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onExcelExtract?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onProcessDropFiles: (files: File[]) => void;
  onRemoveAttachment: (index: number) => void;
  onDeleteServerAttachment: (noteId: number, key?: string) => void;
  onPreviewAttachment: (item: NoteDocumentItem) => void;
  onDownloadAttachment: (item: NoteDocumentItem) => void;
  onSubmit: (e: React.FormEvent) => void;
  onBack: () => void;
  autoSaveStatus?: AutoSaveStatus;
  onToggleAutoSave?: () => void;
  xlsImportInputRef?: React.RefObject<HTMLInputElement>;
  onXlsImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const NoteEditor: React.FC<NoteEditorProps> = ({
  formData,
  setFormData,
  parentNoteContext,
  activeNote,
  actionLoading,
  showSaveToast,
  isDraggingModalFile,
  setIsDraggingModalFile,
  textColor,
  setTextColor,
  highlightColor,
  setHighlightColor,
  isImportingDocling,
  isExtractingExcel = false,
  totalAttachmentsCount,
  editorRef,
  fileInputRef,
  doclingJsonInputRef,
  excelExtractInputRef,
  onEditorInput,
  onExecuteCommand,
  onInsertLink,
  onDoclingUpload,
  onExcelExtract,
  onFileChange,
  onProcessDropFiles,
  onRemoveAttachment,
  onDeleteServerAttachment,
  onPreviewAttachment,
  onDownloadAttachment,
  onSubmit,
  onBack,
  autoSaveStatus = "idle",
  onToggleAutoSave,
  xlsImportInputRef,
  onXlsImport,
}) => {
  const isProjectNote = formData.type === "PROJECT";
  // isVertical true = Portrait; false = Landscape (persisted on backend)
  const isLandscape =
    formData.isVertical === false ||
    formData.rotation === 90 ||
    formData.rotation === 270;
  const [isCopied, setIsCopied] = useState(false);
  const [hasContent, setHasContent] = useState(false);
  const [fontSize, setFontSize] = useState("14");
  const [isFontSizeOpen, setIsFontSizeOpen] = useState(false);
  const savedSelectionRef = useRef<Range | null>(null);
  const lastClearedHtmlRef = useRef<string | null>(null);
  const undoHistoryRef = useRef<string[]>([]);
  const redoHistoryRef = useRef<string[]>([]);
  /** HTML known before the latest edit — what Undo should restore */
  const lastKnownHtmlRef = useRef<string>("");
  const isHistoryNavigatingRef = useRef(false);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isTypingSessionRef = useRef(false);
  const hydratedNoteKeyRef = useRef<string>("");
  const toolbarSentinelRef = useRef<HTMLDivElement | null>(null);
  const [toolbarStuck, setToolbarStuck] = useState(false);

  const checkHasContent = useCallback(() => {
    if (formData.excelWorkbook && (formData.excelWorkbook.sheetNames || []).length > 0) {
      return true;
    }
    if (editorRef.current) {
      const text = (editorRef.current.innerText || editorRef.current.textContent || "").trim();
      const hasMedia = Boolean(editorRef.current.querySelector("img, table, video, canvas, svg, iframe"));
      return text.length > 0 || hasMedia;
    }
    return htmlHasVisibleNoteContent(formData.description);
  }, [editorRef, formData.description, formData.excelWorkbook]);

  // Keep A4 editor when there is visible content; Excel viewer can show alongside
  const showA4Editor =
    !formData.excelWorkbook || htmlHasVisibleNoteContent(formData.description);

  // Table-row / Excel embeds stay in Description — hide them from Files & Attachments
  const embeddedAttachmentKeys = useMemo(() => {
    const keys = attachmentKeysInHtml(formData.description);
    if (formData.excelWorkbook?.fileKey) keys.add(formData.excelWorkbook.fileKey);
    if (formData.excelWorkbook?.fileName) {
      keys.add(`name:${formData.excelWorkbook.fileName}`);
    }
    return keys;
  }, [formData.description, formData.excelWorkbook]);

  const isFilesOnlyAttachment = (key?: string | null, name?: string | null) => {
    if (key && embeddedAttachmentKeys.has(String(key))) return false;
    if (name && embeddedAttachmentKeys.has(`name:${name}`)) return false;
    return true;
  };

  useEffect(() => {
    setHasContent(checkHasContent());
  }, [formData.description, formData.excelWorkbook, checkHasContent]);

  // When A4 editor (re)mounts next to Excel, restore visible HTML without the hidden store
  useEffect(() => {
    if (!showA4Editor || !editorRef.current) return;
    const visible = stripExcelWorkbookStore(formData.description);
    if (!visible) return;
    const current = (editorRef.current.innerHTML || "").trim();
    if (!current || current === "<br>" || current === "<p><br></p>") {
      editorRef.current.innerHTML = visible;
    }
  }, [showA4Editor, formData.excelWorkbook, activeNote?.id]);

  /** Push pre-change HTML onto the undo stack (call before mutating, or with prior HTML). */
  const pushUndoHtml = (html: string) => {
    if (isHistoryNavigatingRef.current) return;
    const lastSnap = undoHistoryRef.current[undoHistoryRef.current.length - 1];
    if (html === lastSnap) return;
    undoHistoryRef.current.push(html);
    if (undoHistoryRef.current.length > 50) undoHistoryRef.current.shift();
    redoHistoryRef.current = [];
  };

  /** Before a toolbar/table mutation: snapshot current editor HTML. */
  const saveUndoSnapshot = () => {
    if (!editorRef.current || isHistoryNavigatingRef.current) return;
    pushUndoHtml(editorRef.current.innerHTML);
  };

  const handleEditorInputWrapper = () => {
    if (isHistoryNavigatingRef.current) return;
    onEditorInput();
    setHasContent(checkHasContent());
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingSessionRef.current = false;
      if (editorRef.current) {
        lastKnownHtmlRef.current = editorRef.current.innerHTML;
      }
    }, 700);
  };

  // Capture HTML *before* each edit so Undo always has a real previous state
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const syncKnown = () => {
      lastKnownHtmlRef.current = editor.innerHTML;
    };
    syncKnown();

    const onBeforeInput = () => {
      if (isHistoryNavigatingRef.current) return;
      if (!isTypingSessionRef.current) {
        pushUndoHtml(editor.innerHTML);
        isTypingSessionRef.current = true;
      }
    };

    const onPaste = (e: ClipboardEvent) => {
      if (isHistoryNavigatingRef.current) return;
      pushUndoHtml(editor.innerHTML);
      isTypingSessionRef.current = true;

      const html = e.clipboardData?.getData("text/html");
      if (!html || !/class=["'][^"']*\bpage\b|a4-page/i.test(html)) {
        // Plain paste — pagination will settle layout after input
        return;
      }

      // Pasting note HTML with .page shells causes a double A4 layout — sanitize first
      e.preventDefault();
      const clean = sanitizeNoteHtmlForClipboard(html);
      if (!clean) {
        const text = e.clipboardData?.getData("text/plain") || "";
        document.execCommand("insertText", false, text);
      } else {
        document.execCommand("insertHTML", false, clean);
      }
      requestAnimationFrame(() => {
        if (!editorRef.current) return;
        const landscape = editorRef.current.classList.contains("is-landscape");
        removeEmptyPages(editorRef.current);
        paginateToA4Sheets(editorRef.current, landscape, true);
        removeEmptyPages(editorRef.current);
        handleEditorInputWrapper();
      });
    };

    editor.addEventListener("beforeinput", onBeforeInput);
    editor.addEventListener("paste", onPaste);
    return () => {
      editor.removeEventListener("beforeinput", onBeforeInput);
      editor.removeEventListener("paste", onPaste);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData.excelWorkbook, activeNote?.id]);

  // Reset undo history when opening a different note (not on auto-save refreshes)
  useEffect(() => {
    const key = `${activeNote?.id ?? "new"}`;
    if (hydratedNoteKeyRef.current === key) return;
    hydratedNoteKeyRef.current = key;
    undoHistoryRef.current = [];
    redoHistoryRef.current = [];
    isTypingSessionRef.current = false;
    requestAnimationFrame(() => {
      lastKnownHtmlRef.current = editorRef.current?.innerHTML || "";
    });
  }, [activeNote?.id]);

  // Elevate formatting toolbar when it sticks to the top while scrolling
  useEffect(() => {
    const sentinel = toolbarSentinelRef.current;
    if (!sentinel) return;
    const root =
      (document.querySelector("main.custom-scrollbar") as HTMLElement | null) || null;
    const io = new IntersectionObserver(
      ([entry]) => setToolbarStuck(!entry.isIntersecting),
      { root, threshold: 0, rootMargin: "-1px 0px 0px 0px" }
    );
    io.observe(sentinel);
    return () => io.disconnect();
  }, []);

  const {
    rowAttachmentInputRef,
    handleRowFileChange,
    isTableDropdownOpen,
    setIsTableDropdownOpen,
    hoverGrid,
    setHoverGrid,
    customRows,
    setCustomRows,
    customCols,
    setCustomCols,
    handleInsertTable,
    handleInsertRow,
    handleDeleteRow,
    handleInsertColumn,
    handleDeleteColumn,
    handleAddAttachmentColumn,
    selectedCellsRef,
    fillMode,
    setFillMode,
    handleApplyFillColor,
  } = useNoteTable({
    editorRef: editorRef as React.RefObject<HTMLDivElement>,
    setFormData,
    activeNote,
    saveUndoSnapshot,
    handleEditorInputWrapper,
    onPreviewAttachment,
    onDownloadAttachment,
  });

  const runToolbarCommand = (command: string, value?: string) => {
    saveUndoSnapshot();
    const selected = getSelectedTableCells(selectedCellsRef.current);
    if (selected.length > 0) {
      applyToolbarCommandToCells(selected, command, value || "");
      handleEditorInputWrapper();
      return;
    }
    onExecuteCommand(command, value);
    if (editorRef.current) {
      lastKnownHtmlRef.current = editorRef.current.innerHTML;
      onEditorInput();
    }
  };

  /** Quote wraps ONLY the selected text (inline), never a full-page block */
  const applyInlineQuote = () => {
    saveUndoSnapshot();
    if (!editorRef.current) return;
    editorRef.current.focus();

    const selectedCells = getSelectedTableCells(selectedCellsRef.current);
    if (selectedCells.length > 0) {
      selectedCells.forEach((cell) => {
        const existing = cell.querySelector(":scope > .notes-inline-quote");
        if (existing) {
          while (existing.firstChild) cell.insertBefore(existing.firstChild, existing);
          existing.remove();
          return;
        }
        const span = document.createElement("span");
        span.className = "notes-inline-quote";
        while (cell.firstChild) span.appendChild(cell.firstChild);
        cell.appendChild(span);
      });
      handleEditorInputWrapper();
      return;
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    let range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) return;

    const anchorEl =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;
    const existingQuote = anchorEl?.closest?.(
      ".notes-inline-quote, blockquote"
    ) as HTMLElement | null;

    // Toggle off if already in a quote
    if (existingQuote && editorRef.current.contains(existingQuote)) {
      const parent = existingQuote.parentNode;
      while (existingQuote.firstChild) {
        parent?.insertBefore(existingQuote.firstChild, existingQuote);
      }
      existingQuote.remove();
      handleEditorInputWrapper();
      return;
    }

    // No selection: wrap the current text node (what you typed, e.g. "yyy")
    if (range.collapsed) {
      const node = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE && (node.textContent || "").trim()) {
        range = document.createRange();
        range.selectNode(node);
        sel.removeAllRanges();
        sel.addRange(range);
      } else {
        message.info("Select text (or type something) then click Quote");
        return;
      }
    }

    const span = document.createElement("span");
    span.className = "notes-inline-quote";
    try {
      span.appendChild(range.extractContents());
      // Don't keep empty quote shells
      if (!(span.textContent || "").trim() && !span.querySelector("img, table")) {
        message.info("Select text then click Quote");
        return;
      }
      range.insertNode(span);
      const next = document.createRange();
      next.selectNodeContents(span);
      sel.removeAllRanges();
      sel.addRange(next);
    } catch {
      document.execCommand("formatBlock", false, "blockquote");
    }
    handleEditorInputWrapper();
  };

  const saveEditorSelection = () => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
    const anchor = sel.anchorNode;
    if (anchor && editorRef.current.contains(anchor)) {
      savedSelectionRef.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreEditorSelection = () => {
    const range = savedSelectionRef.current;
    if (!range || !editorRef.current) return false;
    editorRef.current.focus();
    const sel = window.getSelection();
    if (!sel) return false;
    try {
      sel.removeAllRanges();
      sel.addRange(range);
      return true;
    } catch {
      return false;
    }
  };

  /** Apply px font size to the current selection (works after dropdown click). */
  const applyFontSizeToSelection = (size: string) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0 || !editorRef.current) return;

    let range = sel.getRangeAt(0);
    if (!editorRef.current.contains(range.commonAncestorContainer)) {
      if (!restoreEditorSelection()) return;
      range = sel.getRangeAt(0);
    }

    const px = `${size}px`;

    if (range.collapsed) {
      // Caret only: set size on nearest block, or insert a sized span for typing
      let node: Node | null = range.startContainer;
      if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;
      const block = (node as HTMLElement | null)?.closest?.(
        "p, div, li, h1, h2, h3, h4, h5, h6, td, th, span"
      ) as HTMLElement | null;
      if (block && editorRef.current.contains(block) && !block.classList.contains("page")) {
        block.style.fontSize = px;
        block.querySelectorAll<HTMLElement>("*").forEach((el) => {
          if (!el.classList.contains("excel-sl-col")) el.style.fontSize = px;
        });
      } else {
        const span = document.createElement("span");
        span.style.fontSize = px;
        span.appendChild(document.createTextNode("\u200B"));
        range.insertNode(span);
        const caret = document.createRange();
        caret.setStart(span.firstChild || span, 1);
        caret.collapse(true);
        sel.removeAllRanges();
        sel.addRange(caret);
      }
      return;
    }

    // Wrap selected content in a sized span
    const span = document.createElement("span");
    span.style.fontSize = px;
    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
    } catch {
      // Fallback: legacy execCommand path
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, "7");
      editorRef.current.querySelectorAll('font[size="7"]').forEach((tag) => {
        const el = tag as HTMLElement;
        const wrapper = document.createElement("span");
        wrapper.style.fontSize = px;
        while (el.firstChild) wrapper.appendChild(el.firstChild);
        el.replaceWith(wrapper);
      });
      editorRef.current
        .querySelectorAll<HTMLElement>(
          'span[style*="xxx-large"], span[style*="-webkit-xxx-large"], font[size="7"]'
        )
        .forEach((el) => {
          el.style.fontSize = px;
          el.removeAttribute("size");
        });
      return;
    }

    span.querySelectorAll<HTMLElement>("*").forEach((el) => {
      el.style.fontSize = px;
    });

    const next = document.createRange();
    next.selectNodeContents(span);
    sel.removeAllRanges();
    sel.addRange(next);
    savedSelectionRef.current = next.cloneRange();
  };

  const applyFontSize = (size: string) => {
    setFontSize(String(size));
    setIsFontSizeOpen(false);
    saveUndoSnapshot();
    const selected = getSelectedTableCells(selectedCellsRef.current);
    if (selected.length > 0) {
      selected.forEach((cell) => {
        cell.style.fontSize = `${size}px`;
        cell.querySelectorAll<HTMLElement>("*").forEach((el) => {
          if (!el.classList.contains("excel-sl-col")) el.style.fontSize = `${size}px`;
        });
      });
      handleEditorInputWrapper();
      return;
    }
    if (!editorRef.current) return;
    restoreEditorSelection();
    applyFontSizeToSelection(String(size));
    handleEditorInputWrapper();
  };

  const handleCopyAll = async () => {
    if (!hasContent) return;
    try {
      if (editorRef.current) {
        editorRef.current.focus();
        const htmlToCopy = sanitizeNoteHtmlForClipboard(editorRef.current.innerHTML || "");
        const temp = document.createElement("div");
        temp.innerHTML = htmlToCopy;
        const textToCopy = temp.innerText || temp.textContent || "";
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({
              "text/plain": new Blob([textToCopy], { type: "text/plain" }),
              "text/html": new Blob([htmlToCopy], { type: "text/html" }),
            }),
          ]);
        } else if (textToCopy) {
          await navigator.clipboard.writeText(textToCopy);
        }
      }
      setIsCopied(true);
      message.success("Page copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    } catch {
      document.execCommand("copy");
      setIsCopied(true);
      message.success("All sheet content copied to clipboard!");
      setTimeout(() => setIsCopied(false), 2000);
    }
  };

  const handleClearPage = () => {
    if (!hasContent) return;
    if (formData.excelWorkbook && !showA4Editor) {
      setFormData((prev) => ({ ...prev, excelWorkbook: null, description: "" }));
      setHasContent(false);
      message.success("Cleared spreadsheet from this note");
      return;
    }
    if (formData.excelWorkbook && showA4Editor) {
      // Clear only the spreadsheet; keep A4 description
      setFormData((prev) => ({
        ...prev,
        excelWorkbook: null,
        description: stripExcelWorkbookStore(prev.description) || editorRef.current?.innerHTML || "",
      }));
      message.success("Cleared spreadsheet; description kept");
      return;
    }
    if (!editorRef.current) return;
    editorRef.current.focus();
    lastClearedHtmlRef.current = editorRef.current.innerHTML;
    saveUndoSnapshot();
    editorRef.current.innerHTML = "";
    handleEditorInputWrapper();
  };

  const handleUndo = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    const currentHtml = editorRef.current.innerHTML;
    // Drop no-op tops that match the live editor
    while (
      undoHistoryRef.current.length > 0 &&
      undoHistoryRef.current[undoHistoryRef.current.length - 1] === currentHtml
    ) {
      undoHistoryRef.current.pop();
    }

    if (undoHistoryRef.current.length > 0) {
      isHistoryNavigatingRef.current = true;
      isTypingSessionRef.current = false;
      if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
      redoHistoryRef.current.push(currentHtml);
      const prevHtml = undoHistoryRef.current.pop();
      if (prevHtml !== undefined) {
        editorRef.current.innerHTML = prevHtml;
        lastKnownHtmlRef.current = prevHtml;
        const undoRange = document.createRange();
        const undoSel = window.getSelection();
        undoRange.selectNodeContents(editorRef.current);
        undoRange.collapse(false);
        undoSel?.removeAllRanges();
        undoSel?.addRange(undoRange);
        setFormData((prev) => ({ ...prev, description: editorRef.current?.innerHTML || "" }));
        onEditorInput();
        setHasContent(checkHasContent());
        message.info("Undo last action");
      }
      requestAnimationFrame(() => {
        isHistoryNavigatingRef.current = false;
      });
      return;
    }

    // Fallback for native contentEditable when no custom snapshot exists
    const beforeNative = editorRef.current.innerHTML;
    document.execCommand("undo", false);
    if (
      (!editorRef.current.innerHTML || editorRef.current.innerHTML === "<br>") &&
      lastClearedHtmlRef.current
    ) {
      editorRef.current.innerHTML = lastClearedHtmlRef.current;
      lastClearedHtmlRef.current = null;
    }
    lastKnownHtmlRef.current = editorRef.current.innerHTML;
    if (editorRef.current.innerHTML !== beforeNative) {
      onEditorInput({ skipPagination: true });
      setHasContent(checkHasContent());
      message.info("Undo last action");
    }
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z" && !e.shiftKey) {
        // Only intercept when we have custom history; otherwise allow native undo
        if (undoHistoryRef.current.length > 0 || lastClearedHtmlRef.current) {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <form onSubmit={onSubmit} className="space-y-3 w-full">
          {/* Top Form Header: Input boxes + Back Button */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-1 border-b border-slate-100">
            <div className="flex flex-col md:flex-row md:items-center gap-4 flex-1 min-w-0">
              {/* Parent Note Context Indicator */}
              {parentNoteContext && (
                <div className="flex items-center gap-1.5 px-3 py-1 bg-indigo-50 border border-indigo-200 rounded-xl text-xs font-semibold text-[#4318FF] shrink-0">
                  <span className="text-slate-400">Parent Note:</span>
                  <span className="max-w-[160px] truncate font-bold">{parentNoteContext.title}</span>
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

              {/* Personal Note Category Badge (When not a Project Note) */}
              {!isProjectNote && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-wider shrink-0 shadow-2xs">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Personal Note</span>
                </div>
              )}

              {/* TITLE: Extends all the way to Back button */}
              <div className="flex items-center gap-2.5 flex-1 min-w-0">
                <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider whitespace-nowrap">
                  Title/Subject:
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

            {/* Top Right Controls: Auto-Save Toggle, Pin Button & Back Button */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0 self-start lg:self-center">
              {/* Auto-Save Toggle & Status */}
              <div
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl shadow-2xs border transition-all duration-200 ${!formData.isAutoSave
                    ? "bg-blue-50/70 border-blue-200"
                    : "bg-slate-50 border-slate-200"
                }`}
              >
                <Toggle
                  checked={!!formData.isAutoSave}
                  onChange={() => {
                    if (onToggleAutoSave) {
                      onToggleAutoSave();
                    } else {
                      setFormData((prev) => ({ ...prev, isAutoSave: prev.isAutoSave ? false : true }));
                    }
                  }}
                  label="Auto-Save"
                  size="sm"
                  activeColor="#10B981"
                  inactiveColor="#3B82F6"
                />

                {/* Auto-Save Dynamic Status Badge */}
                {formData.isAutoSave ? (
                  <div className="flex items-center pl-2 border-l border-slate-200 min-w-[55px]">
                    {autoSaveStatus === "saving" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-amber-600">
                        <Loader2 className="w-3 h-3 animate-spin text-amber-500" />
                        <span>Saving...</span>
                      </span>
                    )}
                    {autoSaveStatus === "saved" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                        <Check className="w-3 h-3 text-emerald-500" />
                        <span>Saved</span>
                      </span>
                    )}
                    {autoSaveStatus === "unsaved" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                        <span>Unsaved</span>
                      </span>
                    )}
                    {autoSaveStatus === "error" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-rose-500">
                        <span>Save failed</span>
                      </span>
                    )}
                    {autoSaveStatus === "idle" && (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-slate-400">
                        <Cloud className="w-3 h-3 text-slate-400" />
                        <span>Ready</span>
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="pl-2 border-l border-blue-200 text-[11px] font-bold text-[#4318FF] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#4318FF]" />
                    Off
                  </span>
                )}
              </div>

              {/* Pin Note Toggle Button */}
              <button
                type="button"
                onClick={() => setFormData((prev) => ({ ...prev, isPinned: !prev.isPinned }))}
                className={`px-3 py-1.5 border rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs select-none ${formData.isPinned
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                }`}
                title={formData.isPinned ? "Note is pinned to top" : "Click to pin note to top"}
              >
                <Pin
                  className={`w-3.5 h-3.5 ${formData.isPinned ? "fill-amber-500 text-amber-500" : "text-slate-400"
                    }`}
                />
                <span>{formData.isPinned ? "Pinned" : "Pin"}</span>
              </button>

              {/* Back Button */}
              <button
                type="button"
                onClick={onBack}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-[#4318FF] text-xs md:text-sm font-semibold rounded-xl shadow-xs transition cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4 text-[#4318FF]" />
                <span>Back</span>
              </button>
            </div>
          </div>

          {/* DESCRIPTION & RICH TEXT FORMATTING TOOLBAR */}
          <div className="space-y-1.5 w-full">
            <span className="block text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider">
              DESCRIPTION
            </span>

            <div className="w-full bg-white border border-slate-200 rounded-2xl transition-all shadow-xs flex flex-col overflow-visible">
              {/* Sentinel: when this leaves the scrollport, toolbar is stuck */}
              <div ref={toolbarSentinelRef} className="h-0 w-full" aria-hidden />
              {/* Rich Text Toolbar — sticks + elevates on scroll */}
              <div
                data-notes-toolbar
                className={`flex flex-nowrap items-center gap-0.5 sm:gap-1 p-1.5 px-2 text-slate-700 select-none shrink-0 sticky top-0 z-30 overflow-x-auto transition-all duration-200 ${
                  toolbarStuck
                    ? "bg-white/95 backdrop-blur-md border-b border-[#4318FF]/25 shadow-[0_8px_24px_rgba(67,24,255,0.12)] ring-1 ring-[#4318FF]/10 rounded-b-xl"
                    : "bg-white border-b border-slate-100"
                }`}
              >
                {/* Bold */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("bold");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg font-bold text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("italic");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg italic font-serif text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("underline");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg underline text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Underline (Ctrl+U)"
                >
                  U
                </button>

                {/* Strikethrough */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("strikeThrough");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg line-through text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Strikethrough"
                >
                  S
                </button>

                <Popover
                  trigger="click"
                  placement="bottomLeft"
                  open={isFontSizeOpen}
                  onOpenChange={(open) => {
                    if (open) saveEditorSelection();
                    setIsFontSizeOpen(open);
                  }}
                  arrow={false}
                  overlayInnerStyle={{ padding: "4px" }}
                  content={
                    <div className="w-[52px] max-h-48 overflow-y-auto select-none flex flex-col gap-0.5">
                      {FONT_SIZES.map((size) => (
                        <button
                          key={size}
                          type="button"
                          onMouseDown={(e) => {
                            // Keep editor selection — click would otherwise clear it
                            e.preventDefault();
                            e.stopPropagation();
                            applyFontSize(size);
                          }}
                          className={`w-full py-1 text-center rounded-md text-xs font-semibold transition cursor-pointer ${
                            String(size) === String(fontSize)
                              ? "bg-indigo-50 text-[#4318FF] font-bold"
                              : "text-slate-700 hover:bg-indigo-50/60 hover:text-[#4318FF]"
                          }`}
                        >
                          {size}
                        </button>
                      ))}
                    </div>
                  }
                >
                  <button
                    type="button"
                    onMouseDown={() => saveEditorSelection()}
                    className={`h-8 w-[52px] shrink-0 px-2 bg-white rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-between gap-1 transition cursor-pointer border ${
                      isFontSizeOpen ? "border-[#4318FF] text-[#4318FF]" : "border-slate-200 hover:border-slate-300"
                    }`}
                    title="Font Size"
                  >
                    <span>{fontSize}</span>
                    <ChevronDown className={`w-3 h-3 text-slate-400 ${isFontSizeOpen ? "rotate-180 text-[#4318FF]" : ""}`} />
                  </button>
                </Popover>

                <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                {/* Heading 1 */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("formatBlock", "<h1>");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Heading 1"
                >
                  <Heading1 className="w-4 h-4" />
                </button>

                {/* Heading 2 */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("formatBlock", "<h2>");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Heading 2"
                >
                  <Heading2 className="w-4 h-4" />
                </button>

                {/* Normal */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("formatBlock", "<p>");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Normal Text"
                >
                  <Type className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    saveUndoSnapshot();
                    const selected = getSelectedTableCells(selectedCellsRef.current);
                    if (selected.length > 0) {
                      selected.forEach((cell) => {
                        justifyImportedContent(cell, { reflowPages: false });
                        cell.style.textAlign = "justify";
                      });
                      handleEditorInputWrapper();
                      message.success("Justified selection — extra spaces cleaned");
                      return;
                    }
                    if (!editorRef.current) return;
                    // Remove empty page gaps, pack content to top, then justify like a PDF
                    justifyImportedContent(editorRef.current, {
                      landscape: isLandscape,
                      reflowPages: true,
                    });
                    onEditorInput({ skipPagination: true });
                    setHasContent(checkHasContent());
                    message.success("Spaces packed — content aligned like a PDF");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Justify: remove empty page gaps and align like a PDF"
                >
                  <AlignJustify className="w-4 h-4" />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                {/* Bullet List */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("insertUnorderedList");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Bullet List"
                >
                  <List className="w-4 h-4" />
                </button>

                {/* Numbered List */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    runToolbarCommand("insertOrderedList");
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Numbered List"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>

                {/* Quote — wraps selected text only, not the whole page */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    applyInlineQuote();
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Quote selected text only"
                >
                  <Quote className="w-4 h-4" />
                </button>

                {/* Link */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onInsertLink();
                  }}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                  title="Insert Link"
                >
                  <LinkIcon className="w-4 h-4" />
                </button>

                <Popover
                  trigger="click"
                  placement="bottomLeft"
                  open={isTableDropdownOpen}
                  onOpenChange={(v) => {
                    setIsTableDropdownOpen(v);
                    if (!v) setHoverGrid({ rows: 0, cols: 0 });
                  }}
                  content={
                    <div className="p-3 w-64 select-none">
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-700">Insert Table</span>
                        <span className="text-xs font-semibold text-[#4318FF]">
                          {hoverGrid.rows > 0 && hoverGrid.cols > 0
                            ? `${hoverGrid.cols} × ${hoverGrid.rows}`
                            : "Hover to pick"}
                        </span>
                      </div>
                      <div
                        className="grid grid-cols-8 gap-1 p-1 bg-slate-50/80 rounded-lg border border-slate-200"
                        onMouseLeave={() => setHoverGrid({ rows: 0, cols: 0 })}
                      >
                        {Array.from({ length: 8 }).map((_, rIdx) =>
                          Array.from({ length: 8 }).map((_, cIdx) => {
                            const r = rIdx + 1;
                            const c = cIdx + 1;
                            const isHighlighted = r <= hoverGrid.rows && c <= hoverGrid.cols;
                            return (
                              <button
                                key={`grid-${r}-${c}`}
                                type="button"
                                onMouseEnter={() => setHoverGrid({ rows: r, cols: c })}
                                onClick={() => handleInsertTable(r, c)}
                                className={`w-5 h-5 rounded-xs border transition cursor-pointer ${
                                  isHighlighted
                                    ? "bg-[#4318FF] border-[#4318FF]"
                                    : "bg-white border-slate-300 hover:border-indigo-400"
                                }`}
                                title={`${c} × ${r}`}
                              />
                            );
                          })
                        )}
                      </div>
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-col gap-1.5">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                          Custom Size
                        </span>
                        <div className="flex items-center gap-1.5 px-0.5">
                          <div className="flex items-center gap-1 flex-1">
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={customRows}
                              onChange={(e) => setCustomRows(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-11 px-1.5 py-1 text-xs text-center font-bold text-slate-800 bg-white border border-slate-200 rounded-md focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                              title="Number of rows"
                            />
                            <span className="text-xs text-slate-400 font-bold">×</span>
                            <input
                              type="number"
                              min={1}
                              max={50}
                              value={customCols}
                              onChange={(e) => setCustomCols(Math.max(1, parseInt(e.target.value) || 1))}
                              className="w-11 px-1.5 py-1 text-xs text-center font-bold text-slate-800 bg-white border border-slate-200 rounded-md focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                              title="Number of columns"
                            />
                            <span className="text-[11px] text-slate-500 font-medium">grid</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleInsertTable(customRows, customCols)}
                            className="px-2.5 py-1 bg-[#4318FF] hover:bg-[#320fe0] text-white text-xs font-bold rounded-md shadow-xs transition cursor-pointer shrink-0"
                            title={`Insert ${customRows}×${customCols} Table`}
                          >
                            Insert
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                            Rows
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleInsertRow("above");
                                setIsTableDropdownOpen(false);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-[#4318FF] rounded-md border border-slate-200 transition cursor-pointer text-center"
                            >
                              + Above
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleInsertRow("below");
                                setIsTableDropdownOpen(false);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-[#4318FF] rounded-md border border-slate-200 transition cursor-pointer text-center"
                            >
                              + Below
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteRow();
                                setIsTableDropdownOpen(false);
                              }}
                              className="px-1.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100 rounded-md border border-rose-200 transition cursor-pointer text-center"
                            >
                              Del Row
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                            Columns
                          </span>
                          <div className="grid grid-cols-3 gap-1">
                            <button
                              type="button"
                              onClick={() => {
                                handleInsertColumn("before");
                                setIsTableDropdownOpen(false);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-[#4318FF] rounded-md border border-slate-200 transition cursor-pointer text-center"
                            >
                              + Left
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleInsertColumn("after");
                                setIsTableDropdownOpen(false);
                              }}
                              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-[#4318FF] rounded-md border border-slate-200 transition cursor-pointer text-center"
                            >
                              + Right
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                handleDeleteColumn();
                                setIsTableDropdownOpen(false);
                              }}
                              className="px-1.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100 rounded-md border border-rose-200 transition cursor-pointer text-center"
                            >
                              Del Col
                            </button>
                          </div>
                        </div>
                        <div className="pt-1.5 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => {
                              handleAddAttachmentColumn();
                              setIsTableDropdownOpen(false);
                            }}
                            className="w-full py-1.5 px-2 text-xs font-semibold text-[#4318FF] bg-indigo-50/70 hover:bg-indigo-100/90 rounded-md border border-indigo-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-[#4318FF]" />
                            <span>+ Attachment Column</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  }
                >
                  <button
                    type="button"
                    className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg transition cursor-pointer ${
                      isTableDropdownOpen
                        ? "bg-indigo-50 text-[#4318FF]"
                        : "text-slate-800 hover:text-[#4318FF] hover:bg-slate-100"
                    }`}
                    title="Insert Table"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </Popover>

                <Popover
                  trigger="click"
                  placement="bottom"
                  content={
                    <div className="p-3 w-64 select-none space-y-3">
                      <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-700">Table Shading</span>
                        <button
                          type="button"
                          onClick={() => handleApplyFillColor("none", fillMode)}
                          className="text-[11px] text-slate-500 hover:text-rose-600 hover:underline font-semibold cursor-pointer transition"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Color Target:
                        </span>
                        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setFillMode("bg")}
                            className={`py-1 text-center text-xs font-semibold rounded-md transition cursor-pointer ${
                              fillMode === "bg"
                                ? "bg-white text-slate-800 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Background
                          </button>
                          <button
                            type="button"
                            onClick={() => setFillMode("text")}
                            className={`py-1 text-center text-xs font-semibold rounded-md transition cursor-pointer ${
                              fillMode === "text"
                                ? "bg-white text-slate-800 shadow-xs"
                                : "text-slate-500 hover:text-slate-800"
                            }`}
                          >
                            Text Color
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Bold & Dark Colors
                        </span>
                        <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                          {BOLD_DARK_COLORS.map((c) => (
                            <button
                              key={`tbl-dark-${c.color}`}
                              type="button"
                              onClick={() => handleApplyFillColor(c.color, fillMode)}
                              className="w-7 h-7 rounded-lg border border-slate-300 hover:border-slate-600 hover:scale-110 transition cursor-pointer"
                              style={{ backgroundColor: c.color }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                      <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Light Shading Tints
                        </span>
                        <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                          {LIGHT_SHADING_COLORS.map((c) => (
                            <button
                              key={`tbl-light-${c.color}`}
                              type="button"
                              onClick={() => handleApplyFillColor(c.color, fillMode)}
                              className="w-7 h-7 rounded-lg border border-slate-300 hover:border-slate-600 hover:scale-110 transition cursor-pointer"
                              style={{ backgroundColor: c.color }}
                              title={c.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  }
                >
                  <button
                    type="button"
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                    title="Table Shading / Fill Color (Cell, Row, Column)"
                  >
                    <PaintBucket className="w-4 h-4" />
                  </button>
                </Popover>

                <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

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
                            runToolbarCommand("foreColor", "#1B2559");
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
                            key={`tx-c-${c.color}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              if (c.color === "none") {
                                runToolbarCommand("foreColor", "#1B2559");
                                setTextColor("none");
                              } else {
                                runToolbarCommand("foreColor", c.color);
                                setTextColor(c.color);
                              }
                            }}
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${
                              textColor === c.color
                                ? "ring-2 ring-[#4318FF] scale-110 border-white shadow-xs"
                                : "border-slate-200 hover:scale-105"
                            }`}
                            style={{
                              backgroundColor: c.color === "none" ? "#FFFFFF" : c.color,
                            }}
                            title={c.label}
                          >
                            {c.color === "none" && (
                              <span className="text-[10px] font-bold text-slate-400">∅</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  }
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Font Color"
                  >
                    <Palette className="w-4 h-4 text-slate-700" />
                  </button>
                </Popover>

                {/* Text Highlighter Palette */}
                <Popover
                  trigger="click"
                  placement="bottom"
                  content={
                    <div className="p-2 space-y-2.5 w-56 select-none">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                          Highlight Color
                        </span>
                        <button
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            runToolbarCommand("hiliteColor", "transparent");
                            setHighlightColor("transparent");
                          }}
                          className="text-[11px] text-[#4318FF] hover:underline font-semibold cursor-pointer"
                        >
                          Clear
                        </button>
                      </div>
                      <div className="grid grid-cols-7 gap-1.5">
                        {HIGHLIGHT_COLORS.map((c) => (
                          <button
                            key={`hl-c-${c.color}`}
                            type="button"
                            onMouseDown={(e) => {
                              e.preventDefault();
                              runToolbarCommand("hiliteColor", c.color);
                              setHighlightColor(c.color);
                            }}
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition cursor-pointer ${
                              highlightColor === c.color
                                ? "ring-2 ring-[#4318FF] scale-110 border-white shadow-xs"
                                : "border-slate-200 hover:scale-105"
                            }`}
                            style={{
                              backgroundColor: c.color === "transparent" ? "#FFFFFF" : c.color,
                            }}
                            title={c.label}
                          >
                            {c.color === "transparent" && (
                              <span className="text-[10px] font-bold text-slate-400">∅</span>
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  }
                >
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Text Highlighter"
                  >
                    <Highlighter className="w-4 h-4 text-slate-700" />
                  </button>
                </Popover>

                <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                {/* Import PDF / Word */}
                <input
                  type="file"
                  ref={doclingJsonInputRef}
                  onChange={onDoclingUpload}
                  accept=".pdf,.docx,.doc,.png,.jpg,.jpeg,.json"
                  className="hidden"
                />
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => doclingJsonInputRef.current?.click()}
                  disabled={isImportingDocling || isExtractingExcel}
                  className="h-8 px-2 shrink-0 flex items-center gap-1 rounded-lg text-xs font-semibold text-[#4318FF] bg-[#4318FF]/10 hover:bg-[#4318FF]/20 transition cursor-pointer disabled:opacity-50"
                  title="Import PDF/Word text into Description only (not listed under Files & Attachments)."
                >
                  {isImportingDocling ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileType2 className="w-3.5 h-3.5" />
                  )}
                  <span className="whitespace-nowrap">
                    {isImportingDocling ? "Importing..." : "PDF / Doc"}
                  </span>
                </button>

                {/* Import Excel */}
                <input
                  type="file"
                  ref={excelExtractInputRef}
                  onChange={onExcelExtract}
                  accept=".xlsx,.xls,.csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                  className="hidden"
                />
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                  onClick={() => excelExtractInputRef?.current?.click()}
                  disabled={isImportingDocling || isExtractingExcel}
                  className="h-8 px-2 shrink-0 flex items-center gap-1 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                  title="Import Excel spreadsheet (.xlsx, .xls, .csv)"
                >
                  {isExtractingExcel ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  )}
                  <span className="whitespace-nowrap">
                    {isExtractingExcel ? "Importing..." : "Excel"}
                  </span>
                  </button>

                {/* Landscape / Portrait page */}
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => {
                    const nextLandscape = !isLandscape;
                    requestAnimationFrame(() => {
                      if (editorRef.current) {
                        applyLandscapeToPages(editorRef.current, nextLandscape);
                      }
                      setFormData((prev) => ({
                        ...prev,
                        isVertical: !nextLandscape,
                        rotation: nextLandscape ? 90 : 0,
                        description: editorRef.current?.innerHTML || prev.description,
                      }));
                    });
                  }}
                  className={`h-8 px-2 shrink-0 flex items-center gap-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    isLandscape
                      ? "text-white bg-[#4318FF] hover:bg-[#320fe0]"
                      : "text-slate-700 bg-slate-100 hover:bg-slate-200"
                  }`}
                  title={
                    isLandscape
                      ? "Page is Landscape — click for Portrait"
                      : "Page is Portrait — click for Landscape (wide A4)"
                  }
                >
                  <RectangleHorizontal className="w-3.5 h-3.5" />
                  <span className="whitespace-nowrap">
                    {isLandscape ? "Landscape" : "Portrait"}
                  </span>
                </button>

                <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                  onClick={handleUndo}
                  className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#4318FF] transition cursor-pointer"
                  title="Undo last change (Ctrl+Z)"
                    >
                  <Undo2 className="w-4 h-4" />
                    </button>
                  <button
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                  onClick={handleClearPage}
                  disabled={!hasContent}
                  className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border transition ${
                    !hasContent
                      ? "bg-slate-100/70 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-60"
                      : "bg-rose-50/70 text-rose-700 border-rose-200 hover:bg-rose-100 cursor-pointer"
                  }`}
                  title={!hasContent ? "Sheet is already empty" : "Clear entire sheet"}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={handleCopyAll}
                  disabled={!hasContent}
                  className={`w-8 h-8 shrink-0 flex items-center justify-center rounded-lg border transition ${
                    !hasContent
                      ? "bg-slate-100/70 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-60"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                  }`}
                  title={isCopied ? "Copied" : "Copy all sheet content"}
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                  </button>
              </div>

              {/* A4 workspace (kept when content exists) + Excel grid viewer (appended, never replaces) */}
              <div className="w-full flex flex-col gap-4">
                {showA4Editor && (
                  <div
                    className={`a4-page-workspace w-full flex justify-center items-start bg-slate-100/80 p-4 sm:p-8 min-h-[720px]${isLandscape ? " is-landscape" : ""}`}
                  >
                    <div className="a4-page-rotator">
                      <div className="a4-page doc-pages">
                        <div
                          ref={editorRef}
                          contentEditable
                          onInput={handleEditorInputWrapper}
                          onKeyDown={(e) => {
                            // Enter = next line on the same page (never split into a new A4 sheet)
                            if (e.key !== "Enter" || e.shiftKey || e.ctrlKey || e.metaKey || e.altKey) {
                              return;
                            }
                            const sel = window.getSelection();
                            if (!sel || sel.rangeCount === 0 || !editorRef.current) return;
                            const node = sel.anchorNode;
                            const el =
                              node?.nodeType === Node.ELEMENT_NODE
                                ? (node as HTMLElement)
                                : node?.parentElement;
                            if (!el || !editorRef.current.contains(el)) return;

                            const page = el.closest(".page") as HTMLElement | null;
                            const block = el.closest(
                              "p, div, li, h1, h2, h3, h4, h5, h6, blockquote, pre"
                            ) as HTMLElement | null;

                            if (!page) {
                              e.preventDefault();
                              const pages = editorRef.current.querySelectorAll(":scope > .page");
                              const target = (pages[pages.length - 1] as HTMLElement) || null;
                              if (!target) {
                                document.execCommand("insertHTML", false, "<p><br></p>");
                                return;
                              }
                              const p = document.createElement("p");
                              p.innerHTML = "<br>";
                              target.appendChild(p);
                              const range = document.createRange();
                              range.setStart(p, 0);
                              range.collapse(true);
                              sel.removeAllRanges();
                              sel.addRange(range);
                              handleEditorInputWrapper();
                              return;
                            }

                            if (block === page || block?.classList.contains("page")) {
                              e.preventDefault();
                              document.execCommand("insertHTML", false, "<p><br></p>");
                              handleEditorInputWrapper();
                            }
                          }}
                          data-placeholder="Write your notes, key updates, documentation, or action items here..."
                          className={`notes-rich-editor doc-pages-editor outline-none text-slate-800 text-sm sm:text-base leading-relaxed${isLandscape ? " is-landscape" : ""}`}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {formData.excelWorkbook && (
                  <div className="w-full overflow-auto bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 min-h-[480px]">
                    <ExcelSpreadsheetView
                      embedded
                      workbook={formData.excelWorkbook}
                      onWorkbookChange={(next) => {
                        setFormData((prev) => {
                          const richHtml =
                            editorRef.current?.innerHTML ||
                            stripExcelWorkbookStore(prev.description) ||
                            "";
                          return {
                            ...prev,
                            excelWorkbook: next,
                            description: embedExcelWorkbookInHtml(richHtml, next),
                          };
                        });
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* FILES & ATTACHMENTS SECTION */}
          <div className="space-y-2 pt-4 mt-2 w-full relative z-10 bg-white">
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

            {/* Drag and Drop Upload Zone */}
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
                  onProcessDropFiles(droppedFiles);
                }
              }}
              className={`w-full max-w-md border-2 border-dashed rounded-xl p-3 transition flex items-center gap-2.5 cursor-pointer ${isDraggingModalFile
                  ? "border-[#4318FF] bg-indigo-50/80 scale-[1.01] shadow-sm ring-2 ring-indigo-200"
                  : "border-indigo-200 hover:border-[#4318FF] bg-indigo-50/20 hover:bg-indigo-50/40"
              }`}
            >
              <div className="w-7 h-7 rounded-lg bg-indigo-100/60 flex items-center justify-center text-[#4318FF] shrink-0">
                <UploadCloud className="w-4 h-4" />
              </div>
              <span className="text-xs text-slate-600">
                <strong className="text-[#4318FF] font-semibold">Click to upload</strong> or drag and drop{" "}
                <span className="text-slate-400 text-[11px]">(PDF, Word, Excel, Images)</span>
              </span>

              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="*"
                onChange={onFileChange}
                className="hidden"
              />
            </div>

            {/* Standalone Hidden Input for Table Row Attachments */}
            <input
              ref={rowAttachmentInputRef}
              type="file"
              accept="*"
              onChange={handleRowFileChange}
              className="hidden"
            />

            {/* Attached File Cards — Files section only (not table/Excel embeds) */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {activeNote?.attachments &&
                activeNote.attachments
                  .filter((att) =>
                    isFilesOnlyAttachment(att.key || att.fileKey, att.fileName || att.name)
                  )
                  .map((att) => (
                    <NoteAttachmentChip
                      key={`server-att-${att.id || att.key || att.fileKey}`}
                      item={{
                        id: att.id,
                        key: att.key || att.fileKey,
                        name: att.fileName || att.name || "Attachment",
                        size: att.fileSize,
                      }}
                      onPreview={onPreviewAttachment}
                      onDownload={onDownloadAttachment}
                      onDelete={() =>
                        onDeleteServerAttachment(activeNote.id, att.key || att.fileKey)
                      }
                    />
                  ))}

              {formData.attachments
                .map((item, idx) => ({ item, idx }))
                .filter(({ item }) =>
                  isFilesOnlyAttachment(item.key || item.fileKey, item.name || item.fileName)
                )
                .map(({ item, idx }) => (
                  <NoteAttachmentChip
                    key={`form-att-${item.key || idx}`}
                    item={item}
                    onPreview={onPreviewAttachment}
                    onDownload={onDownloadAttachment}
                    onDelete={() => onRemoveAttachment(idx)}
                  />
                ))}
            </div>
          </div>

          {/* Bottom Actions: Cancel & Save */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100 pr-16 sm:pr-20 md:pr-24">
            <button
              type="button"
              onClick={onBack}
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
    </div>
  );
};

export default NoteEditor;
