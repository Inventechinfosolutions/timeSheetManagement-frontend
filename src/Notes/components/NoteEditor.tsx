import React, { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import { message } from "antd";
import { Toggle } from "../../components/ui";
import { Note, NotesFormData, NoteDocumentItem, AutoSaveStatus } from "../types/notes.types";
import { NoteAttachmentChip } from "./NoteAttachmentChip";
import { NoteEditorToolbar } from "./NoteEditorToolbar";
import { useNoteTable } from "../hooks";
import {
  normalizeAttachmentCell,
  updateTableHeadersAndSl,
  formatDocumentStructure,
} from "../utils";

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
  totalAttachmentsCount: number;
  editorRef: React.RefObject<HTMLDivElement>;
  fileInputRef: React.RefObject<HTMLInputElement>;
  doclingJsonInputRef: React.RefObject<HTMLInputElement>;
  onEditorInput: () => void;
  onExecuteCommand: (command: string, value?: string) => void;
  onInsertLink: () => void;
  onDoclingUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
  totalAttachmentsCount,
  editorRef,
  fileInputRef,
  doclingJsonInputRef,
  onEditorInput,
  onExecuteCommand,
  onInsertLink,
  onDoclingUpload,
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
  const [orientation, setOrientation] = useState<"portrait" | "landscape">(
    formData.isVertical === false ? "landscape" : "portrait"
  );
  const [fontSize, setFontSize] = useState<string>("14");
  const [isFontSizeOpen, setIsFontSizeOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [hasContent, setHasContent] = useState<boolean>(false);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);

  // History & Snapshot management
  const lastClearedHtmlRef = useRef<string | null>(null);
  const undoHistoryRef = useRef<string[]>([]);
  const redoHistoryRef = useRef<string[]>([]);
  const isHistoryNavigatingRef = useRef<boolean>(false);
  const typingTimerRef = useRef<any>(null);
  const isTypingSessionRef = useRef<boolean>(false);

  const saveUndoSnapshot = () => {
    if (!editorRef.current || isHistoryNavigatingRef.current) return;
    const currentHtml = editorRef.current.innerHTML;
    const lastSnap = undoHistoryRef.current[undoHistoryRef.current.length - 1];
    if (currentHtml && currentHtml !== lastSnap) {
      undoHistoryRef.current.push(currentHtml);
      if (undoHistoryRef.current.length > 50) {
        undoHistoryRef.current.shift();
      }
      redoHistoryRef.current = [];
    }
  };

  const handleEditorInputWrapper = () => {
    onEditorInput();
    setHasContent(checkHasContent());

    if (!isTypingSessionRef.current) {
      saveUndoSnapshot();
      isTypingSessionRef.current = true;
    }
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    typingTimerRef.current = setTimeout(() => {
      isTypingSessionRef.current = false;
      saveUndoSnapshot();
    }, 700);
  };

  // Encapsulated Table Operations Hook
  const {
    isTableDropdownOpen,
    setIsTableDropdownOpen,
    hoverGrid,
    setHoverGrid,
    customRows,
    setCustomRows,
    customCols,
    setCustomCols,
    fillMode,
    setFillMode,
    rowAttachmentInputRef,
    selectedCellsRef,
    getTargetTable,
    clearSelectionVisuals,
    handleInsertTable,
    handleInsertRow,
    handleDeleteRow,
    handleInsertColumn,
    handleDeleteColumn,
    handleAddAttachmentColumn,
    handleRowFileChange,
    handleApplyFillColor,
  } = useNoteTable({
    editorRef,
    setFormData,
    activeNote,
    saveUndoSnapshot,
    handleEditorInputWrapper,
    onPreviewAttachment,
    onDownloadAttachment,
  });

  const handleToolbarCommand = (command: string, value?: string) => {
    saveUndoSnapshot();
    onExecuteCommand(command, value);
    handleEditorInputWrapper();
  };

  const checkHasContent = useCallback(() => {
    if (editorRef.current) {
      const text = (editorRef.current.innerText || editorRef.current.textContent || "").trim();
      const hasMedia = Boolean(
        editorRef.current.querySelector("img, table, video, canvas, svg, iframe")
      );
      return text.length > 0 || hasMedia;
    }
    if (formData.description) {
      const stripped = formData.description.replace(/<[^>]*>/g, "").trim();
      return (
        stripped.length > 0 ||
        /<(img|table|video|canvas|svg|iframe)/i.test(formData.description)
      );
    }
    return false;
  }, [editorRef, formData.description]);

  useEffect(() => {
    setHasContent(checkHasContent());
  }, [formData.description, checkHasContent]);


  useEffect(() => {
    if (formData.isVertical !== undefined) {
      setOrientation(formData.isVertical ? "portrait" : "landscape");
    }
  }, [formData.isVertical]);

  const handleToggleOrientation = () => {
    const next = orientation === "portrait" ? "landscape" : "portrait";
    setOrientation(next);
    setFormData((prev) => ({
      ...prev,
      isVertical: next === "portrait",
    }));
    if (typeof window !== "undefined") {
      window.dispatchEvent(
        new CustomEvent("note-orientation-change", {
          detail: { orientation: next, isVertical: next === "portrait" },
        })
      );
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        fontSizeDropdownRef.current &&
        !fontSizeDropdownRef.current.contains(e.target as Node)
      ) {
        setIsFontSizeOpen(false);
      }
    };
    const handleScroll = () => {
      setIsFontSizeOpen(false);
    };

    document.addEventListener("mousedown", handleClickOutside);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    if (!editorRef.current) return;
    editorRef.current.focus();

    saveUndoSnapshot();

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) {
      const span = document.createElement("span");
      span.style.fontSize = `${size}px`;
      span.innerHTML = "&#8203;";
      range.insertNode(span);
      range.selectNodeContents(span);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      document.execCommand("styleWithCSS", false, "true");
      document.execCommand("fontSize", false, "7");
      const fontTags = editorRef.current.querySelectorAll('font[size="7"]');
      fontTags.forEach((tag: Element) => {
        const el = tag as HTMLElement;
        el.removeAttribute("size");
        el.style.fontSize = `${size}px`;
      });
      const spans = editorRef.current.querySelectorAll('span[style*="xxx-large"]');
      spans.forEach((tag: Element) => {
        const el = tag as HTMLElement;
        el.style.fontSize = `${size}px`;
      });
    }
    handleEditorInputWrapper();
  };

  const handleCopyAll = async () => {
    if (!editorRef.current || !hasContent) return;
    try {
      editorRef.current.focus();
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
        selection.addRange(range);
      }
      const textToCopy = editorRef.current.innerText || editorRef.current.textContent || "";
      const htmlToCopy = editorRef.current.innerHTML || "";

      if (navigator.clipboard && window.ClipboardItem) {
        const textBlob = new Blob([textToCopy], { type: "text/plain" });
        const htmlBlob = new Blob([htmlToCopy], { type: "text/html" });
        await navigator.clipboard.write([
          new ClipboardItem({
            "text/plain": textBlob,
            "text/html": htmlBlob,
          }),
        ]);
      } else if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
      } else {
        document.execCommand("copy");
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
    if (!editorRef.current || !hasContent) return;
    editorRef.current.focus();

    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    lastClearedHtmlRef.current = editorRef.current.innerHTML;
    document.execCommand("delete", false);
    handleEditorInputWrapper();
  };

  const handleUndo = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (undoHistoryRef.current.length > 0) {
      isHistoryNavigatingRef.current = true;
      const currentHtml = editorRef.current.innerHTML;
      redoHistoryRef.current.push(currentHtml);

      const prevHtml = undoHistoryRef.current.pop();
      if (prevHtml !== undefined) {
        editorRef.current.innerHTML = prevHtml;
        // Move cursor to END of content (browser resets to start after innerHTML set)
        const undoRange = document.createRange();
        const undoSel = window.getSelection();
        undoRange.selectNodeContents(editorRef.current);
        undoRange.collapse(false);
        undoSel?.removeAllRanges();
        undoSel?.addRange(undoRange);
        const currentTable = getTargetTable();
        if (currentTable) {
          updateTableHeadersAndSl(currentTable);
          clearSelectionVisuals(currentTable);
        }
        const updated = editorRef.current.innerHTML;
        setFormData((prev) => ({
          ...prev,
          description: updated,
        }));
        onEditorInput();
        setHasContent(checkHasContent());
        message.info("Undid last action");
      }
      isHistoryNavigatingRef.current = false;
      return;
    }

    document.execCommand("undo", false);
    if (
      (!editorRef.current.innerHTML || editorRef.current.innerHTML === "<br>") &&
      lastClearedHtmlRef.current
    ) {
      editorRef.current.innerHTML = lastClearedHtmlRef.current;
      lastClearedHtmlRef.current = null;
    }
    handleEditorInputWrapper();
  };

  const handleRedo = () => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    if (redoHistoryRef.current.length > 0) {
      isHistoryNavigatingRef.current = true;
      const currentHtml = editorRef.current.innerHTML;
      undoHistoryRef.current.push(currentHtml);

      const nextHtml = redoHistoryRef.current.pop();
      if (nextHtml !== undefined) {
        editorRef.current.innerHTML = nextHtml;
        // Move cursor to END of content (browser resets to start after innerHTML set)
        const redoRange = document.createRange();
        const redoSel = window.getSelection();
        redoRange.selectNodeContents(editorRef.current);
        redoRange.collapse(false);
        redoSel?.removeAllRanges();
        redoSel?.addRange(redoRange);
        const currentTable = getTargetTable();
        if (currentTable) {
          updateTableHeadersAndSl(currentTable);
          clearSelectionVisuals(currentTable);
        }
        const updated = editorRef.current.innerHTML;
        setFormData((prev) => ({
          ...prev,
          description: updated,
        }));
        onEditorInput();
        setHasContent(checkHasContent());
        message.info("Redid action");
      }
      isHistoryNavigatingRef.current = false;
      return;
    }

    document.execCommand("redo", false);
    handleEditorInputWrapper();
  };

  const handleFormatContent = () => {
    const editor = editorRef.current;
    if (!editor || !hasContent) return;

    saveUndoSnapshot();

    const selection = window.getSelection();
    const hasTextSelection =
      selection &&
      !selection.isCollapsed &&
      selection.rangeCount > 0 &&
      editor.contains(selection.anchorNode) &&
      (selection.toString() || "").trim().length > 0;

    const hasSelectedCells =
      selectedCellsRef.current.length > 0 &&
      selectedCellsRef.current.some((c) => editor.contains(c));

    if (hasTextSelection) {
      const range = selection.getRangeAt(0);
      try {
        const fragment = range.extractContents();
        const tempDiv = document.createElement("div");
        tempDiv.appendChild(fragment);
        formatDocumentStructure(tempDiv);

        const cleanedFragment = document.createDocumentFragment();
        while (tempDiv.firstChild) {
          cleanedFragment.appendChild(tempDiv.firstChild);
        }
        range.insertNode(cleanedFragment);
        message.success("Formatted selected content");
      } catch {
        document.execCommand("removeFormat", false, undefined);
        message.success("Formatted selected content");
      }
    } else if (hasSelectedCells) {
      selectedCellsRef.current.forEach((cell) => {
        formatDocumentStructure(cell);
      });
      clearSelectionVisuals();
      message.success(`Formatted ${selectedCellsRef.current.length} selected cell(s)`);
    } else {
      formatDocumentStructure(editor);
      message.success("Formatted entire document");
    }

    const currentHtml = editor.innerHTML;
    setFormData((prev) => ({
      ...prev,
      description: currentHtml,
    }));
    handleEditorInputWrapper();
  };

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
                      setFormData((prev) => ({ ...prev, isAutoSave: !prev.isAutoSave }));
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

            <div className="w-full bg-white border border-slate-200 rounded-2xl focus-within:border-[#4318FF] focus-within:ring-1 focus-within:ring-[#4318FF]/20 transition-all shadow-xs flex flex-col">
              {/* Modular Rich Text Toolbar */}
              <NoteEditorToolbar
                fontSize={fontSize}
                isFontSizeOpen={isFontSizeOpen}
                setIsFontSizeOpen={setIsFontSizeOpen}
                onFontSizeChange={handleFontSizeChange}
                orientation={orientation}
                onToggleOrientation={handleToggleOrientation}
                onToolbarCommand={handleToolbarCommand}
                onInsertLink={onInsertLink}
                isTableDropdownOpen={isTableDropdownOpen}
                setIsTableDropdownOpen={setIsTableDropdownOpen}
                hoverGrid={hoverGrid}
                setHoverGrid={setHoverGrid}
                customRows={customRows}
                setCustomRows={setCustomRows}
                customCols={customCols}
                setCustomCols={setCustomCols}
                onInsertTable={handleInsertTable}
                onInsertRow={handleInsertRow}
                onDeleteRow={handleDeleteRow}
                onInsertColumn={handleInsertColumn}
                onDeleteColumn={handleDeleteColumn}
                onAddAttachmentColumn={handleAddAttachmentColumn}
                fillMode={fillMode}
                setFillMode={setFillMode}
                onApplyFillColor={handleApplyFillColor}
                textColor={textColor}
                setTextColor={setTextColor}
                highlightColor={highlightColor}
                setHighlightColor={setHighlightColor}
                onExecuteCommand={onExecuteCommand}
                saveUndoSnapshot={saveUndoSnapshot}
                handleEditorInputWrapper={handleEditorInputWrapper}
                doclingJsonInputRef={doclingJsonInputRef}
                onDoclingUpload={onDoclingUpload}
                isImportingDocling={isImportingDocling}
                xlsImportInputRef={xlsImportInputRef}
                onXlsImport={onXlsImport}
                hasContent={hasContent}
                handleFormatContent={handleFormatContent}
                handleUndo={handleUndo}
                handleClearPage={handleClearPage}
                handleCopyAll={handleCopyAll}
                isCopied={isCopied}
              />

              {/* A4 Workspace Simulation */}
              <div className="a4-page-workspace w-full flex justify-start items-start overflow-x-auto bg-slate-100/80 p-4 sm:p-8 min-h-[640px] rounded-b-2xl">
                <div
                  className={`a4-page shrink-0 transition-all duration-300 ${orientation === "landscape" ? "landscape" : ""
                    }`}
                  style={
                    orientation === "landscape"
                      ? { minWidth: "337mm", width: "max-content", minHeight: "210mm" }
                      : { minWidth: "210mm", width: "max-content", minHeight: "297mm" }
                  }
                >
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleEditorInputWrapper}
                    onKeyDown={(e) => {
                      if (e.ctrlKey || e.metaKey) {
                        if (e.key.toLowerCase() === "z") {
                          e.preventDefault();
                          if (e.shiftKey) {
                            handleRedo();
                          } else {
                            handleUndo();
                          }
                          return;
                        }
                        if (e.key.toLowerCase() === "y") {
                          e.preventDefault();
                          handleRedo();
                          return;
                        }
                      }
                    }}
                    data-placeholder="Write your notes, key updates, documentation, or action items here..."
                    className="notes-rich-editor outline-none w-full text-slate-800 leading-relaxed"
                    style={{
                      fontSize: "14px",
                      minHeight: orientation === "landscape" ? "170mm" : "257mm",
                    }}
                  />
                </div>
              </div>
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

            {/* Attached File Cards */}
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {/* Server Attachments */}
              {activeNote?.attachments &&
                activeNote.attachments.map((att) => (
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
                    onDelete={() => onDeleteServerAttachment(activeNote.id, att.key || att.fileKey)}
                  />
                ))}

              {/* Uploaded Form Attachments */}
              {formData.attachments.map((item, idx) => (
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
