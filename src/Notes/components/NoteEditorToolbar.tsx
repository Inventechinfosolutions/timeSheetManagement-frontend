import React, { useState, useEffect } from "react";
import {
  List,
  ListOrdered,
  Quote,
  Link as LinkIcon,
  ChevronDown,
  Table as TableIcon,
  Paperclip,
  PaintBucket,
  Palette,
  Highlighter,
  FileCode,
  FileSpreadsheet,
  Undo2,
  Trash2,
  Copy,
  Check,
  Sparkles,
} from "lucide-react";
import { Popover } from "antd";
import {
  WordOrientationIcon,
  FONT_SIZES,
  BOLD_DARK_COLORS,
  LIGHT_SHADING_COLORS,
  TEXT_COLORS,
  HIGHLIGHT_COLORS,
} from "../utils";

export interface NoteEditorToolbarProps {
  fontSize: string;
  isFontSizeOpen: boolean;
  setIsFontSizeOpen: (open: boolean) => void;
  onFontSizeChange: (size: string) => void;
  orientation: "portrait" | "landscape";
  onToggleOrientation: () => void;
  onToolbarCommand: (command: string, value?: string) => void;
  onInsertLink: () => void;
  // Table Dropdown
  isTableDropdownOpen: boolean;
  setIsTableDropdownOpen: (open: boolean) => void;
  hoverGrid: { rows: number; cols: number };
  setHoverGrid: (grid: { rows: number; cols: number }) => void;
  customRows: number;
  setCustomRows: (rows: number) => void;
  customCols: number;
  setCustomCols: (cols: number) => void;
  onInsertTable: (rows: number, cols: number) => void;
  onInsertRow: (position: "above" | "below") => void;
  onDeleteRow: () => void;
  onInsertColumn: (position: "before" | "after") => void;
  onDeleteColumn: () => void;
  onAddAttachmentColumn: () => void;
  // Shading
  fillMode: "bg" | "text";
  setFillMode: (mode: "bg" | "text") => void;
  onApplyFillColor: (color: string, mode: "bg" | "text") => void;
  // Text & Hilite Color
  textColor: string;
  setTextColor: (val: string) => void;
  highlightColor: string;
  setHighlightColor: (val: string) => void;
  onExecuteCommand: (command: string, value?: string) => void;
  saveUndoSnapshot: () => void;
  handleEditorInputWrapper: () => void;
  // Docling / Import
  doclingJsonInputRef: React.RefObject<HTMLInputElement>;
  onDoclingUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isImportingDocling: boolean;
  // XLS Import
  xlsImportInputRef?: React.RefObject<HTMLInputElement>;
  onXlsImport?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Right side buttons
  hasContent: boolean;
  handleFormatContent: () => void;
  handleUndo: () => void;
  handleClearPage: () => void;
  handleCopyAll: () => void;
  isCopied: boolean;
}

export const NoteEditorToolbar: React.FC<NoteEditorToolbarProps> = ({
  fontSize,
  isFontSizeOpen,
  setIsFontSizeOpen,
  onFontSizeChange,
  orientation,
  onToggleOrientation,
  onToolbarCommand,
  onInsertLink,
  isTableDropdownOpen,
  setIsTableDropdownOpen,
  hoverGrid,
  setHoverGrid,
  customRows,
  setCustomRows,
  customCols,
  setCustomCols,
  onInsertTable,
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onDeleteColumn,
  onAddAttachmentColumn,
  fillMode,
  setFillMode,
  onApplyFillColor,
  textColor,
  setTextColor,
  highlightColor,
  setHighlightColor,
  onExecuteCommand,
  saveUndoSnapshot,
  handleEditorInputWrapper,
  doclingJsonInputRef,
  onDoclingUpload,
  isImportingDocling,
  xlsImportInputRef,
  onXlsImport,
  hasContent,
  handleFormatContent,
  handleUndo,
  handleClearPage,
  handleCopyAll,
  isCopied,
}) => {
  // Local state for custom rows/cols input so user can freely delete, edit and press Enter
  const [rowInput, setRowInput] = useState<string>(String(customRows || 1));
  const [colInput, setColInput] = useState<string>(String(customCols || 2));

  useEffect(() => {
    setRowInput(String(customRows || 1));
  }, [customRows]);

  useEffect(() => {
    setColInput(String(customCols || 2));
  }, [customCols]);

  const handleRowChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setRowInput("");
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setRowInput(val);
      if (num >= 1 && num <= 50) {
        setCustomRows(num);
      }
    }
  };

  const handleRowBlur = () => {
    const num = parseInt(rowInput, 10);
    if (isNaN(num) || num < 1) {
      setRowInput("1");
      setCustomRows(1);
    } else if (num > 50) {
      setRowInput("50");
      setCustomRows(50);
    } else {
      setRowInput(String(num));
      setCustomRows(num);
    }
  };

  const handleColChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setColInput("");
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setColInput(val);
      if (num >= 1 && num <= 50) {
        setCustomCols(num);
      }
    }
  };

  const handleColBlur = () => {
    const num = parseInt(colInput, 10);
    if (isNaN(num) || num < 1) {
      setColInput("1");
      setCustomCols(1);
    } else if (num > 50) {
      setColInput("50");
      setCustomCols(50);
    } else {
      setColInput(String(num));
      setCustomCols(num);
    }
  };

  const handleCustomInsert = () => {
    const r = Math.max(1, Math.min(50, parseInt(rowInput, 10) || customRows || 1));
    const c = Math.max(1, Math.min(50, parseInt(colInput, 10) || customCols || 2));
    setCustomRows(r);
    setCustomCols(c);
    setRowInput(String(r));
    setColInput(String(c));
    onInsertTable(r, c);
  };

  return (
    <div className="flex items-center overflow-x-auto flex-nowrap gap-1 sm:gap-1.5 p-2 px-3 bg-white border-b border-slate-100 text-slate-700 select-none shrink-0 sticky top-0 z-30 rounded-t-2xl shadow-xs scrollbar-thin">
      {/* Bold */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault();
          onToolbarCommand("bold");
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
          onToolbarCommand("italic");
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
          onToolbarCommand("underline");
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
          onToolbarCommand("strikeThrough");
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
                      onFontSizeChange(size);
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
        onClick={onToggleOrientation}
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
          onToolbarCommand("insertUnorderedList");
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
          onToolbarCommand("insertOrderedList");
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
          onToolbarCommand("formatBlock", "<blockquote>");
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

      {/* TABLE FEATURE: Dropdown (Grid Picker + Insert/Delete Row/Col) */}
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
            {/* Title and live hover dimension */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Insert Table</span>
              <span className="text-xs font-semibold text-[#4318FF]">
                {hoverGrid.rows > 0 && hoverGrid.cols > 0
                  ? `${hoverGrid.cols} × ${hoverGrid.rows}`
                  : "Hover to pick"}
              </span>
            </div>

            {/* 8x8 Hover Grid */}
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
                      onClick={() => onInsertTable(r, c)}
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

            {/* Manual / Custom Dimension Inputs */}
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
                    value={rowInput}
                    onChange={handleRowChange}
                    onBlur={handleRowBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomInsert();
                      }
                    }}
                    className="w-11 px-1.5 py-1 text-xs text-center font-bold text-slate-800 bg-white border border-slate-200 rounded-md focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                    title="Number of rows (Press Enter to insert)"
                  />
                  <span className="text-xs text-slate-400 font-bold">×</span>
                  <input
                    type="number"
                    min={1}
                    max={50}
                    value={colInput}
                    onChange={handleColChange}
                    onBlur={handleColBlur}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleCustomInsert();
                      }
                    }}
                    className="w-11 px-1.5 py-1 text-xs text-center font-bold text-slate-800 bg-white border border-slate-200 rounded-md focus:border-[#4318FF] focus:ring-1 focus:ring-[#4318FF] outline-none"
                    title="Number of columns (Press Enter to insert)"
                  />
                  <span className="text-[11px] text-slate-500 font-medium">grid</span>
                </div>
                <button
                  type="button"
                  onClick={handleCustomInsert}
                  className="px-2.5 py-1 bg-[#4318FF] hover:bg-[#320fe0] text-white text-xs font-bold rounded-md shadow-xs transition cursor-pointer shrink-0"
                  title={`Insert ${customRows}×${customCols} Table`}
                >
                  Insert
                </button>
              </div>
            </div>

            {/* Row/Col Management options */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-col gap-2">
              {/* Rows controls */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Rows
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onInsertRow("above");
                      setIsTableDropdownOpen(false);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-[#4318FF] rounded-md border border-slate-200 transition cursor-pointer text-center"
                    title="Insert row above selected cell"
                  >
                    + Above
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onInsertRow("below");
                      setIsTableDropdownOpen(false);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-[#4318FF] rounded-md border border-slate-200 transition cursor-pointer text-center"
                    title="Insert row below selected cell"
                  >
                    + Below
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteRow();
                      setIsTableDropdownOpen(false);
                    }}
                    className="px-1.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100 rounded-md border border-rose-200 transition cursor-pointer text-center"
                    title="Delete selected row"
                  >
                    Del Row
                  </button>
                </div>
              </div>

              {/* Columns controls */}
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-1">
                  Columns
                </span>
                <div className="grid grid-cols-3 gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      onInsertColumn("before");
                      setIsTableDropdownOpen(false);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-[#4318FF] rounded-md border border-slate-200 transition cursor-pointer text-center"
                    title="Insert column before (left of) selected cell"
                  >
                    + Left
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onInsertColumn("after");
                      setIsTableDropdownOpen(false);
                    }}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-slate-50 hover:bg-indigo-50 hover:text-[#4318FF] rounded-md border border-slate-200 transition cursor-pointer text-center"
                    title="Insert column after (right of) selected cell"
                  >
                    + Right
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteColumn();
                      setIsTableDropdownOpen(false);
                    }}
                    className="px-1.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50/60 hover:bg-rose-100 rounded-md border border-rose-200 transition cursor-pointer text-center"
                    title="Delete selected column"
                  >
                    Del Col
                  </button>
                </div>
              </div>

              {/* Attachment Column */}
              <div className="pt-1.5 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    onAddAttachmentColumn();
                    setIsTableDropdownOpen(false);
                  }}
                  className="w-full py-1.5 px-2 text-xs font-semibold text-[#4318FF] bg-indigo-50/70 hover:bg-indigo-100/90 rounded-md border border-indigo-200 transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                  title="Add an Attachment Column with upload button for each row"
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
          className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer shrink-0 ${
            isTableDropdownOpen
              ? "bg-indigo-50 text-[#4318FF]"
              : "text-slate-800 hover:text-[#4318FF] hover:bg-slate-100"
          }`}
          title="Insert Table (Hover grid, custom dimensions & row/col tools)"
        >
          <TableIcon className="w-4 h-4" />
        </button>
      </Popover>

      {/* TABLE FILL / SHADING POPOVER */}
      <Popover
        trigger="click"
        placement="bottom"
        content={
          <div className="p-3 w-64 select-none space-y-3">
            <div className="flex items-center justify-between pb-1.5 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700">Table Shading</span>
              <button
                type="button"
                onClick={() => onApplyFillColor("none", fillMode)}
                className="text-[11px] text-slate-500 hover:text-rose-600 hover:underline font-semibold cursor-pointer transition"
              >
                Clear
              </button>
            </div>

            {/* Color Mode: Background Fill vs Text Color */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Color Target:
              </span>
              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setFillMode("bg")}
                  className={`py-1 text-center text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                    fillMode === "bg"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>🪣 Background</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFillMode("text")}
                  className={`py-1 text-center text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${
                    fillMode === "text"
                      ? "bg-white text-slate-800 shadow-xs"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  <span>🅰️ Text Color</span>
                </button>
              </div>
            </div>

            {/* Bold & Dark Colors */}
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                Bold & Dark Colors
              </span>
              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                {BOLD_DARK_COLORS.map((c) => (
                  <button
                    key={`tbl-bg-${c.className}`}
                    type="button"
                    onClick={() => onApplyFillColor(c.color, fillMode)}
                    className={`w-7 h-7 rounded-lg border border-slate-300 hover:border-slate-600 hover:scale-110 active:scale-95 transition-all duration-150 shadow-xs cursor-pointer outline-none focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-500 ${c.className}`}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Soft & Light Shading Colors */}
            <div className="flex flex-col gap-1 pt-1 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Light Shading Tints
              </span>
              <div className="grid grid-cols-5 gap-1.5 pt-0.5">
                {LIGHT_SHADING_COLORS.map((c) => (
                  <button
                    key={`tbl-bg-${c.className}`}
                    type="button"
                    onClick={() => onApplyFillColor(c.color, fillMode)}
                    className={`w-7 h-7 rounded-lg border border-slate-300 hover:border-slate-600 hover:scale-110 active:scale-95 transition-all duration-150 shadow-xs cursor-pointer outline-none focus:outline-none focus:ring-2 focus:ring-slate-400/50 focus:border-slate-500 ${c.className}`}
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
          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-700 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer shrink-0"
          title="Table Shading / Fill Color (Cell, Row, Column)"
        >
          <PaintBucket className="w-4 h-4 text-slate-700" />
        </button>
      </Popover>

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
                  saveUndoSnapshot();
                  onExecuteCommand("foreColor", "#1B2559");
                  setTextColor("none");
                  handleEditorInputWrapper();
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
                    saveUndoSnapshot();
                    if (c.color === "none") {
                      onExecuteCommand("foreColor", "#1B2559");
                      setTextColor("none");
                    } else {
                      onExecuteCommand("foreColor", c.color);
                      setTextColor(c.color);
                    }
                    handleEditorInputWrapper();
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
                  saveUndoSnapshot();
                  onExecuteCommand("hiliteColor", "transparent");
                  setHighlightColor("transparent");
                  handleEditorInputWrapper();
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
                    saveUndoSnapshot();
                    onExecuteCommand("hiliteColor", c.color);
                    setHighlightColor(c.color);
                    handleEditorInputWrapper();
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

      {/* Docling JSON / Document Import Button */}
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

      {/* Right side toolbar controls: Format, Undo, Clear Page & Copy All */}
      <div className="ml-auto flex items-center gap-1.5 shrink-0 pl-2">
        {/* Format Content Button (Selected content or entire document) - Temporarily commented out */}
        {/* <button
          type="button"
          onMouseDown={(e) => e.preventDefault()}
          onClick={handleFormatContent}
          disabled={!hasContent}
          className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition select-none ${!hasContent
            ? "bg-slate-100/70 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-60"
            : "bg-indigo-50/80 text-[#4318FF] border-indigo-200 hover:bg-indigo-100 hover:border-indigo-300 cursor-pointer shadow-2xs"
            }`}
          title={
            !hasContent
              ? "Sheet is empty"
              : "Format Content (Cleans selected text if highlighted, otherwise formats entire sheet)"
          }
        >
          <Sparkles className="w-3.5 h-3.5 text-[#4318FF]" />
          <span>Format</span>
        </button> */}

        {/* Undo Button */}
        <button
          type="button"
          onClick={handleUndo}
          className="h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 hover:text-[#4318FF] transition select-none cursor-pointer"
          title="Undo last change (Ctrl+Z)"
        >
          <Undo2 className="w-3.5 h-3.5 text-slate-600" />
          <span>Undo</span>
        </button>

        {/* Clear Page Button */}
        <button
          type="button"
          onClick={handleClearPage}
          disabled={!hasContent}
          className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition select-none ${
            !hasContent
              ? "bg-slate-100/70 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-60"
              : "bg-rose-50/70 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300 cursor-pointer"
          }`}
          title={!hasContent ? "Sheet is already empty" : "Clear entire sheet"}
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-600" />
          <span>Clear Page</span>
        </button>

        {/* Copy All Button */}
        <button
          type="button"
          onClick={handleCopyAll}
          disabled={!hasContent}
          className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition select-none ${
            !hasContent
              ? "bg-slate-100/70 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-60"
              : isCopied
              ? "bg-emerald-50 text-emerald-700 border-emerald-300 cursor-pointer"
              : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#4318FF] cursor-pointer"
          }`}
          title={
            !hasContent
              ? "No content in sheet to copy"
              : "Copy page content to clipboard"
          }
        >
          {isCopied ? (
            <Check className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <Copy className="w-3.5 h-3.5 text-slate-600" />
          )}
          <span>{isCopied ? "Copied!" : "Copy Page"}</span>
        </button>
      </div>
    </div>
  );
};
