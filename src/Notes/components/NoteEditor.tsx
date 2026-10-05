import React, { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Paperclip,
  UploadCloud,
  CheckCircle2,
  List,
  ListOrdered,
  Link as LinkIcon,
  Quote,
  FileCode,
  Palette,
  Highlighter,
  Pin,
  Cloud,
  Loader2,
  Check,
  User,
  FileSpreadsheet,
  Copy,
  ChevronDown,
} from "lucide-react";
import { Popover, message } from "antd";
import { Toggle } from "../../components/ui";
import { Note, NotesFormData, NoteDocumentItem, AutoSaveStatus } from "../types/notes.types";
import { NoteAttachmentChip } from "./NoteAttachmentChip";
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "../utils/notesHelpers";

const WordOrientationIcon = () => (
  <svg
    className="w-5 h-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Portrait sheet in background */}
    <path
      d="M3.5 2H9.5L12.5 5V13H3.5V2Z"
      fill="#F8FAFC"
      stroke="#64748B"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 2V5H12.5"
      fill="#CBD5E1"
      stroke="#64748B"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />

    {/* Curved Blue Arrow in top-right */}
    <path
      d="M14.5 2.5C17.5 2.8 19.5 4.5 19.5 7V7.5"
      stroke="#2563EB"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M17.5 5.5L19.5 7.5L21.5 5.5"
      stroke="#2563EB"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Landscape sheet in foreground */}
    <path
      d="M6.5 9H15.5L18.5 12V18H6.5V9Z"
      fill="#FFFFFF"
      stroke="#334155"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 9V12H18.5"
      fill="#E2E8F0"
      stroke="#334155"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

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
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);

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

  const FONT_SIZES = [
    "8",
    "9",
    "10",
    "11",
    "12",
    "14",
    "16",
    "18",
    "20",
    "22",
    "24",
    "26",
    "28",
    "36",
    "48",
    "72",
  ];

  const handleFontSizeChange = (size: string) => {
    setFontSize(size);
    if (!editorRef.current) return;
    editorRef.current.focus();

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
    onEditorInput();
  };

  const handleSelectAllAndCopy = async () => {
    if (!editorRef.current) return;
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
      if (textToCopy) {
        await navigator.clipboard.writeText(textToCopy);
        setIsCopied(true);
        message.success("All sheet content selected & copied to clipboard!");
        setTimeout(() => setIsCopied(false), 2000);
      } else {
        message.info("Sheet is currently empty");
      }
    } catch {
      document.execCommand("copy");
      setIsCopied(true);
      message.success("All sheet content selected!");
      setTimeout(() => setIsCopied(false), 2000);
    }
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
                className={`flex items-center gap-2.5 px-3 py-1.5 rounded-xl shadow-2xs border transition-all duration-200 ${
                  !formData.isAutoSave
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
                className={`px-3 py-1.5 border rounded-xl font-semibold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-2xs select-none ${
                  formData.isPinned
                    ? "bg-amber-50 text-amber-800 border-amber-200"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-800"
                }`}
                title={formData.isPinned ? "Note is pinned to top" : "Click to pin note to top"}
              >
                <Pin className={`w-3.5 h-3.5 ${formData.isPinned ? "fill-amber-500 text-amber-500" : "text-slate-400"}`} />
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

            <div className="w-full bg-white border border-slate-200 rounded-2xl focus-within:border-[#4318FF] focus-within:ring-1 focus-within:ring-[#4318FF]/20 transition-all shadow-xs flex flex-col overflow-hidden">
              {/* Rich Text Toolbar */}
              <div className="flex items-center overflow-x-auto flex-nowrap gap-1 sm:gap-1.5 p-2 px-3 bg-white border-b border-slate-100 text-slate-700 select-none shrink-0 sticky top-0 z-10 scrollbar-thin">
                {/* Bold */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onExecuteCommand("bold");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg font-bold text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Bold (Ctrl+B)"
                >
                  B
                </button>

                {/* Italic */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onExecuteCommand("italic");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg italic font-serif text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Italic (Ctrl+I)"
                >
                  I
                </button>

                {/* Underline */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onExecuteCommand("underline");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg underline text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Underline (Ctrl+U)"
                >
                  U
                </button>

                {/* Strikethrough */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onExecuteCommand("strikeThrough");
                  }}
                  className="w-8 h-8 flex items-center justify-center rounded-lg line-through text-sm text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer shrink-0"
                  title="Strikethrough"
                >
                  S
                </button>

                <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                {/* Font Size Dropdown (Matches button width, no dot, sleek scrollbar) */}
                <div className="flex items-center gap-1.5 shrink-0 px-1 select-none">
                  <span className="text-[11px] font-semibold text-slate-500 hidden sm:inline">Size:</span>
                  <Popover
                    trigger="click"
                    placement="bottomLeft"
                    autoAdjustOverflow={false}
                    open={isFontSizeOpen}
                    onOpenChange={(visible) => setIsFontSizeOpen(visible)}
                    arrow={false}
                    overlayInnerStyle={{ padding: "4px" }}
                    content={
                      <div className="w-[52px] max-h-48 overflow-y-auto select-none [&::-webkit-scrollbar]:w-1 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-300 [&::-webkit-scrollbar-thumb]:rounded-full [scrollbar-width:thin] flex flex-col gap-0.5">
                        {FONT_SIZES.map((size) => {
                          const isSelected = size === fontSize;
                          return (
                            <button
                              key={size}
                              type="button"
                              onClick={() => {
                                handleFontSizeChange(size);
                                setIsFontSizeOpen(false);
                              }}
                              className={`w-full py-1 text-center rounded-md text-xs font-semibold transition cursor-pointer ${
                                isSelected
                                  ? "bg-indigo-50 text-[#4318FF] font-bold"
                                  : "text-slate-700 hover:bg-indigo-50/60 hover:text-[#4318FF]"
                              }`}
                            >
                              {size}
                            </button>
                          );
                        })}
                      </div>
                    }
                  >
                    <button
                      type="button"
                      className={`h-8 w-[52px] px-2 bg-white rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-between gap-1 transition cursor-pointer border ${
                        isFontSizeOpen
                          ? "border-[#4318FF] text-[#4318FF]"
                          : "border-slate-200 hover:border-slate-300"
                      }`}
                      title="Font Size (Default: 14)"
                    >
                      <span>{fontSize}</span>
                      <ChevronDown
                        className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${
                          isFontSizeOpen ? "rotate-180 text-[#4318FF]" : ""
                        }`}
                      />
                    </button>
                  </Popover>
                </div>

                {/* Word Page Orientation Toggle (Icon only, borderless) */}
                <button
                  type="button"
                  onClick={handleToggleOrientation}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer shrink-0 select-none ${
                    orientation === "landscape"
                      ? "bg-indigo-50 text-[#4318FF]"
                      : "hover:bg-slate-100"
                  }`}
                  title={
                    orientation === "portrait"
                      ? "Page Orientation: Vertical (Portrait) — Click to switch to Horizontal (Landscape)"
                      : "Page Orientation: Horizontal (Landscape) — Click to switch to Vertical (Portrait)"
                  }
                >
                  <WordOrientationIcon />
                </button>

                <div className="h-4 w-px bg-slate-200 mx-0.5" />

                {/* Bullet List */}
                <button
                  type="button"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    onExecuteCommand("insertUnorderedList");
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
                    onExecuteCommand("insertOrderedList");
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
                    onExecuteCommand("formatBlock", "<blockquote>");
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
                    onInsertLink();
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
                            onExecuteCommand("foreColor", "#1B2559");
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
                                onExecuteCommand("foreColor", "#1B2559");
                                setTextColor("none");
                              } else {
                                onExecuteCommand("foreColor", c.color);
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
                    className="h-8 px-2 flex items-center gap-1 rounded-lg text-slate-800 hover:text-[#4318FF] hover:bg-slate-100 transition cursor-pointer"
                    title="Font Color"
                  >
                    <Palette className="w-4 h-4 text-slate-700" />
                    <span
                      className="w-3.5 h-1.5 rounded-full shrink-0 border border-slate-200 shadow-2xs"
                      style={{
                        backgroundColor: textColor === "none" ? "#1B2559" : textColor,
                      }}
                    />
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
                            onExecuteCommand("hiliteColor", "transparent");
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
                              onExecuteCommand("hiliteColor", c.color);
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

                <div className="h-4 w-px bg-slate-200 mx-0.5 shrink-0" />

                {/* Docling JSON / Document Import Button (Original Position) */}
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
                  disabled={isImportingDocling}
                  className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-[#4318FF] bg-[#4318FF]/10 hover:bg-[#4318FF]/20 transition cursor-pointer disabled:opacity-50 shrink-0"
                  title="Import / Parse PDF with Docling directly into this Description box"
                >
                  <FileCode className="w-4 h-4 text-[#4318FF]" />
                  <span>{isImportingDocling ? "Parsing PDF..." : "Import PDF / Docling"}</span>
                </button>

                {/* Excel / XLS Import Button */}
                {xlsImportInputRef && onXlsImport && (
                  <>
                    <input
                      type="file"
                      ref={xlsImportInputRef}
                      onChange={onXlsImport}
                      accept=".xlsx,.xls,.csv"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onMouseDown={(e) => e.preventDefault()}
                      onClick={() => xlsImportInputRef.current?.click()}
                      className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 transition cursor-pointer shrink-0"
                      title="Import Excel spreadsheet (.xlsx, .xls, .csv)"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                      <span>Import XLS</span>
                    </button>
                  </>
                )}

                {/* Right side toolbar controls: Select All */}
                <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
                  {/* Select All & Copy Button */}
                  <button
                    type="button"
                    onClick={handleSelectAllAndCopy}
                    className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer select-none ${
                      isCopied
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#4318FF]"
                    }`}
                    title="Select All content in A4 sheet & copy to clipboard"
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{isCopied ? "Copied!" : "Select All"}</span>
                  </button>
                </div>
              </div>

              {/* A4 Workspace Simulation */}
              <div className="a4-page-workspace w-full flex justify-center items-start overflow-x-auto bg-slate-100/80 p-4 sm:p-8 min-h-[640px]">
                <div
                  className={`a4-page shrink-0 transition-all duration-300 ${
                    orientation === "landscape" ? "landscape" : ""
                  }`}
                  style={
                    orientation === "landscape"
                      ? { width: "297mm", maxWidth: "297mm", minHeight: "210mm" }
                      : { width: "210mm", maxWidth: "210mm", minHeight: "297mm" }
                  }
                >
                  <div
                    ref={editorRef}
                    contentEditable
                    onInput={onEditorInput}
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
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
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
