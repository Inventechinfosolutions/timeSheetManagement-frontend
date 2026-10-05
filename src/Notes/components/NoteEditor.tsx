import React, { useState, useRef, useEffect, useCallback } from "react";
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
  Table as TableIcon,
  Trash2,
  PaintBucket,
  Undo2,
  Sparkles,
} from "lucide-react";
import { Popover, message } from "antd";
import { Toggle } from "../../components/ui";
import { Note, NotesFormData, NoteDocumentItem, AutoSaveStatus } from "../types/notes.types";
import { NoteAttachmentChip } from "./NoteAttachmentChip";
import { TEXT_COLORS, HIGHLIGHT_COLORS } from "../utils/notesHelpers";
import { useAppDispatch } from "../../hooks";
import { uploadDirectNoteFiles } from "../../reducers/notes.reducer";

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
  const [hasContent, setHasContent] = useState<boolean>(false);
  const fontSizeDropdownRef = useRef<HTMLDivElement>(null);

  const dispatch = useAppDispatch();
  const rowAttachmentInputRef = useRef<HTMLInputElement>(null);
  const activeRowUploadCellRef = useRef<HTMLTableCellElement | null>(null);

  const ROW_ATTACH_BTN_HTML = `<button type="button" class="row-attach-upload-btn" data-row-upload="true" title="Attach file (PDF, Word, Excel, Image)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg><span>Attach</span></button>`;

  const ROW_ATTACH_ADD_BTN_HTML = `<button type="button" class="row-attach-add-btn" data-row-upload="true" title="Add another attachment to this row"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>`;

  const ROW_ATTACH_HEADER_HTML = `<span class="excel-attachment-header-wrap"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4318ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg><span>Attachment</span></span>`;

  const normalizeAttachmentCell = (cell: HTMLTableCellElement) => {
    const badges = Array.from(cell.querySelectorAll<HTMLElement>(".table-file-badge"));
    if (badges.length === 0) return;

    let container = cell.querySelector<HTMLElement>(".row-attach-container");
    if (!container) {
      container = document.createElement("div");
      container.className = "row-attach-container";
      badges.forEach((b) => container!.appendChild(b));
      cell.innerHTML = "";
      cell.appendChild(container);
    }
    if (!container.querySelector(".row-attach-add-btn")) {
      container.insertAdjacentHTML("beforeend", ROW_ATTACH_ADD_BTN_HTML);
    }

    // Ensure all badges have the download button
    badges.forEach((badge) => {
      const fileKey = badge.getAttribute("data-file-key");
      const fileName = badge.getAttribute("data-file-name") || "Attachment";
      if (!badge.querySelector("[data-file-action='download']") && fileKey) {
        const previewBtn = badge.querySelector("[data-file-action='preview']");
        const downloadBtnHtml = `<button type="button" class="table-file-btn download" data-file-action="download" data-key="${fileKey}" data-name="${fileName}" title="Download file"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></button>`;
        if (previewBtn) {
          previewBtn.insertAdjacentHTML("afterend", downloadBtnHtml);
        } else {
          badge.insertAdjacentHTML("beforeend", downloadBtnHtml);
        }
      }
    });
  };

  const getRowFileIconSvg = (fileName: string) => {
    const ext = (fileName || "").split(".").pop()?.toLowerCase();
    if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "")) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
    }
    if (ext === "pdf") {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>`;
    }
    if (["xls", "xlsx", "csv"].includes(ext || "")) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M12 9v12"/></svg>`;
    }
    if (["doc", "docx"].includes(ext || "")) {
      return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;
    }
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="shrink-0"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;
  };

  const getRowBadgeHtml = (fileKey: string, fileName: string) => {
    const icon = getRowFileIconSvg(fileName);
    return `
      <div class="table-file-badge" data-file-key="${fileKey}" data-file-name="${fileName}" title="${fileName}">
        ${icon}
        <span class="table-file-name">${fileName}</span>
        <button type="button" class="table-file-btn preview" data-file-action="preview" data-key="${fileKey}" data-name="${fileName}" title="Preview file">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
        </button>
        <button type="button" class="table-file-btn download" data-file-action="download" data-key="${fileKey}" data-name="${fileName}" title="Download file">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
        </button>
        <button type="button" class="table-file-btn remove" data-file-action="remove" title="Remove attachment">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
        </button>
      </div>
    `.trim();
  };

  // Table States
  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState<boolean>(false);
  const [hoverGrid, setHoverGrid] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });
  const [customRows, setCustomRows] = useState<number>(2);
  const [customCols, setCustomCols] = useState<number>(2);
  const [fillMode, setFillMode] = useState<"bg" | "text">("bg");
  const lastActiveCellRef = useRef<HTMLTableCellElement | null>(null);
  const selectedCellsRef = useRef<HTMLTableCellElement[]>([]);
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
    if (!editorRef.current) return;
    const tables = editorRef.current.querySelectorAll<HTMLTableElement>("table");
    tables.forEach((table) => {
      updateTableHeadersAndSl(table);
    });
    const badges = editorRef.current.querySelectorAll<HTMLElement>(".table-file-badge");
    badges.forEach((badge) => {
      const cell = badge.closest<HTMLTableCellElement>("td");
      if (cell) normalizeAttachmentCell(cell);
    });
  }, [formData.description, editorRef]);

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

  // Track active table cell & multi-cell selection on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const node = sel.anchorNode;
      if (!node) return;
      const el = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement) as HTMLElement | null;
      const cell = el?.closest("td, th") as HTMLTableCellElement | null;
      if (cell) {
        lastActiveCellRef.current = cell;
      }

      // Collect all selected table cells if user highlighted multiple cells with mouse
      const table = cell?.closest("table") || getTargetTable();
      if (table) {
        const allCells = Array.from(table.querySelectorAll("th, td")) as HTMLTableCellElement[];
        const selected = allCells.filter((c) => {
          try {
            return sel.containsNode(c, true);
          } catch {
            return false;
          }
        });
        if (selected.length > 0) {
          selectedCellsRef.current = selected;
        } else if (cell) {
          selectedCellsRef.current = [cell];
        }
      }
    };
    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
    };
  }, []);

  // Visual selection styling helpers (Excel-style: ONLY outer border box, NO in-between lines!)
  const clearSelectionVisuals = (table?: HTMLElement | null) => {
    const target = table || getTargetTable() || editorRef.current;
    if (!target) return;
    target.querySelectorAll(".excel-cell-selected").forEach((el) => {
      el.classList.remove("excel-cell-selected");
      const hEl = el as HTMLElement;
      hEl.style.removeProperty("border-top");
      hEl.style.removeProperty("border-bottom");
      hEl.style.removeProperty("border-left");
      hEl.style.removeProperty("border-right");
      hEl.style.removeProperty("outline");
      hEl.style.removeProperty("outline-offset");
      hEl.style.removeProperty("z-index");
    });
  };

  const applySelectionVisuals = (
    cells: HTMLTableCellElement[],
    type: "row" | "column" | "cells" = "cells"
  ) => {
    if (cells.length === 0) return;
    const table = cells[0].closest("table");
    clearSelectionVisuals(table);

    const borderColor = "#2563eb"; // Excel selection blue

    if (type === "row") {
      // ONLY outer border: Top and bottom across the row, left on first cell, right on last cell. NO vertical lines in-between!
      cells.forEach((c, idx) => {
        c.classList.add("excel-cell-selected");
        c.style.setProperty("border-top", `2px solid ${borderColor}`, "important");
        c.style.setProperty("border-bottom", `2px solid ${borderColor}`, "important");
        if (idx === 0) {
          c.style.setProperty("border-left", `2px solid ${borderColor}`, "important");
        }
        if (idx === cells.length - 1) {
          c.style.setProperty("border-right", `2px solid ${borderColor}`, "important");
        }
        c.style.setProperty("z-index", "2", "important");
      });
    } else if (type === "column") {
      // ONLY outer border: Left and right down the column, top on first cell, bottom on last cell. NO horizontal lines in-between!
      cells.forEach((c, idx) => {
        c.classList.add("excel-cell-selected");
        c.style.setProperty("border-left", `2px solid ${borderColor}`, "important");
        c.style.setProperty("border-right", `2px solid ${borderColor}`, "important");
        if (idx === 0) {
          c.style.setProperty("border-top", `2px solid ${borderColor}`, "important");
        }
        if (idx === cells.length - 1) {
          c.style.setProperty("border-bottom", `2px solid ${borderColor}`, "important");
        }
        c.style.setProperty("z-index", "2", "important");
      });
    } else {
      // Single cell or irregular selection
      cells.forEach((c) => {
        c.classList.add("excel-cell-selected");
        c.style.setProperty("outline", `2px solid ${borderColor}`, "important");
        c.style.setProperty("outline-offset", "-2px", "important");
        c.style.setProperty("z-index", "2", "important");
      });
    }
  };

  // Helper to re-sync column headers (A, B, C...) and row numbers (1, 2, 3...)
  const updateTableHeadersAndSl = (table: HTMLTableElement) => {
    const firstHeader = table.rows[0]?.cells[0]?.textContent?.trim();
    let isFirstColSl = firstHeader === "SL";

    // If an Excel table lost its SL column (e.g. first header is "A" or table has attachment col/cells):
    if (!isFirstColSl && (firstHeader === "A" || table.querySelector(".excel-attachment-cell, .excel-attachment-col"))) {
      const rows = Array.from(table.rows);
      rows.forEach((row, idx) => {
        if (idx === 0) {
          const th = document.createElement("th");
          th.setAttribute("contenteditable", "false");
          th.className = "excel-sl-col";
          th.textContent = "SL";
          th.setAttribute("title", "Serial Number Column");
          row.insertBefore(th, row.cells[0]);
        } else {
          const td = document.createElement("td");
          td.setAttribute("contenteditable", "false");
          td.className = "excel-sl-col";
          td.textContent = `${idx}`;
          td.setAttribute("title", `Row ${idx} (Click to select row)`);
          row.insertBefore(td, row.cells[0]);
        }
      });
      isFirstColSl = true;
    }

    // Update headers
    const headerRow = (table.querySelector("thead tr") as HTMLTableRowElement | null) || table.rows[0];
    if (headerRow) {
      let letterCounter = 0;
      (Array.from(headerRow.cells) as HTMLTableCellElement[]).forEach((th, idx) => {
        if (isFirstColSl && idx === 0) {
          th.textContent = "SL";
          th.className = "excel-sl-col";
          th.setAttribute("contenteditable", "false");
          return;
        }
        if (th.classList.contains("excel-attachment-col") || th.getAttribute("data-col-type") === "attachment") {
          th.innerHTML = ROW_ATTACH_HEADER_HTML;
          th.setAttribute("title", "Attachment Column (Click to attach files to rows)");
          return;
        }
        const letter = String.fromCharCode(65 + (letterCounter % 26));
        letterCounter++;
        th.textContent = letter;
        th.setAttribute("title", `Column ${letter} (Click to select column)`);
      });
    }

    // Update row numbers in SL column
    if (isFirstColSl) {
      const tbody = table.querySelector("tbody") || table;
      const dataRows = (Array.from(tbody.querySelectorAll("tr")) as HTMLTableRowElement[]).filter(
        (r) => r.parentElement?.tagName !== "THEAD" && r !== headerRow
      );
      dataRows.forEach((row, idx) => {
        const firstCell = row.cells[0];
        if (firstCell) {
          firstCell.textContent = `${idx + 1}`;
          firstCell.setAttribute("contenteditable", "false");
          firstCell.className = "excel-sl-col";
          firstCell.setAttribute("title", `Row ${idx + 1} (Click to select row)`);
        }
      });
    }
  };

  // Click on table header (TH) to select entire column, or click SL cell to select entire row (Excel-like with visual border)
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // 1. Click on Row Upload Button or Add More Button
      const uploadBtn = target.closest<HTMLElement>(
        "[data-row-upload='true'], .row-attach-upload-btn, .row-attach-add-btn"
      );
      if (uploadBtn && editor.contains(uploadBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const cell = uploadBtn.closest<HTMLTableCellElement>("td");
        if (cell) {
          activeRowUploadCellRef.current = cell;
          if (rowAttachmentInputRef.current) {
            rowAttachmentInputRef.current.value = "";
            rowAttachmentInputRef.current.click();
          }
        }
        return;
      }

      // 2. Click on Remove Action
      const removeBtn = target.closest<HTMLElement>("[data-file-action='remove']");
      if (removeBtn && editor.contains(removeBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const cell = removeBtn.closest<HTMLTableCellElement>("td");
        const badge = removeBtn.closest<HTMLElement>(".table-file-badge");
        const fileKey = badge?.getAttribute("data-file-key");
        if (cell && badge) {
          saveUndoSnapshot();
          badge.remove();

          // Check if any badges remain in this cell
          const remainingBadges = cell.querySelectorAll(".table-file-badge");
          if (remainingBadges.length === 0) {
            cell.innerHTML = ROW_ATTACH_BTN_HTML;
          }

          const currentHtml = editorRef.current?.innerHTML || "";
          setFormData((prev) => ({
            ...prev,
            description: currentHtml,
            attachmentKeys: fileKey
              ? (prev.attachmentKeys || []).filter((k) => k !== fileKey)
              : prev.attachmentKeys,
          }));
          handleEditorInputWrapper();
          message.info("Attachment removed from row");
        }
        return;
      }

      // 3. Click on Download Action
      const downloadBtn = target.closest<HTMLElement>("[data-file-action='download']");
      if (downloadBtn && editor.contains(downloadBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const key =
          downloadBtn.getAttribute("data-key") ||
          downloadBtn.getAttribute("data-file-key") ||
          downloadBtn.closest<HTMLElement>("[data-file-key]")?.getAttribute("data-file-key");
        const name =
          downloadBtn.getAttribute("data-name") ||
          downloadBtn.getAttribute("data-file-name") ||
          downloadBtn.closest<HTMLElement>("[data-file-name]")?.getAttribute("data-file-name") ||
          "Attachment";
        if (key && onDownloadAttachment) {
          onDownloadAttachment({
            key,
            fileKey: key,
            name,
            fileName: name,
          });
        }
        return;
      }

      // 4. Click on Preview Action or File Badge
      const previewBtn = target.closest<HTMLElement>("[data-file-action='preview'], .table-file-badge");
      if (previewBtn && editor.contains(previewBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const key =
          previewBtn.getAttribute("data-key") ||
          previewBtn.getAttribute("data-file-key") ||
          previewBtn.closest<HTMLElement>("[data-file-key]")?.getAttribute("data-file-key");
        const name =
          previewBtn.getAttribute("data-name") ||
          previewBtn.getAttribute("data-file-name") ||
          previewBtn.closest<HTMLElement>("[data-file-name]")?.getAttribute("data-file-name") ||
          "Attachment";
        if (key) {
          onPreviewAttachment({
            key,
            fileKey: key,
            name,
            fileName: name,
          });
        }
        return;
      }

      const cell = target.closest("td, th") as HTMLTableCellElement | null;
      if (!cell || !editor.contains(cell)) return;

      const table = cell.closest("table");
      if (!table) return;

      const isFirstColSl = table.rows[0]?.cells[0]?.textContent?.trim() === "SL";

      // Click on TH (column header) -> select only body cells down the column (SL header cannot be selected)
      if (cell.tagName === "TH") {
        if (isFirstColSl && cell.cellIndex === 0) {
          clearSelectionVisuals(table);
          selectedCellsRef.current = [];
          return;
        }
        clearSelectionVisuals(table);
        const colIdx = cell.cellIndex;
        const colCells: HTMLTableCellElement[] = [];
        Array.from(table.rows).forEach((row, rIdx) => {
          if (rIdx > 0 && row.cells[colIdx]) {
            colCells.push(row.cells[colIdx] as HTMLTableCellElement);
          }
        });
        if (colCells.length > 0) {
          lastActiveCellRef.current = colCells[0];
          selectedCellsRef.current = colCells;
          applySelectionVisuals(colCells, "column");
        }
      }
      // Click on SL cell (1st col TD) -> select entire row's BODY cells only (NEVER select or highlight the SL cell!)
      else if (cell.cellIndex === 0 && isFirstColSl) {
        clearSelectionVisuals(table);
        const tr = cell.closest("tr");
        if (tr) {
          // Select only body cells from index 1 onwards
          const bodyCells = (Array.from(tr.cells) as HTMLTableCellElement[]).filter(
            (c) => c.cellIndex !== 0
          );
          if (bodyCells.length > 0) {
            lastActiveCellRef.current = bodyCells[0];
            selectedCellsRef.current = bodyCells;
            applySelectionVisuals(bodyCells, "row");
          }
        }
      }
      // Click on normal cell -> clear visual selection outlines
      else {
        clearSelectionVisuals(table);
        lastActiveCellRef.current = cell;
        selectedCellsRef.current = [cell];
      }
    };

    editor.addEventListener("click", handleTableClick);
    return () => {
      editor.removeEventListener("click", handleTableClick);
    };
  }, [editorRef]);

  // Helper to get active table
  const getTargetTable = (): HTMLTableElement | null => {
    if (lastActiveCellRef.current && document.contains(lastActiveCellRef.current)) {
      return lastActiveCellRef.current.closest("table");
    }
    if (editorRef.current) {
      const tables = editorRef.current.querySelectorAll("table");
      if (tables.length > 0) {
        return tables[tables.length - 1];
      }
    }
    return null;
  };

  // Insert standard table (from Table Dropdown grid or custom size) with Excel headers: SL, A, B, C...
  const handleInsertTable = (numRows: number, numCols: number) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    // Helper for Excel column label: 0 -> "SL", 1 -> "A", 2 -> "B", 3 -> "C"...
    const getColLabel = (colIdx: number, total: number) => {
      if (total > 1) {
        if (colIdx === 0) return "SL";
        return String.fromCharCode(65 + ((colIdx - 1) % 26));
      }
      return "A";
    };

    let tableHtml = `<table>`;
    // Header row (Locked / Non-editable)
    tableHtml += `<thead><tr>`;
    for (let c = 0; c < numCols; c++) {
      const isSlCol = numCols > 1 && c === 0;
      const colName = getColLabel(c, numCols);
      tableHtml += `<th contenteditable="false" class="${isSlCol ? "excel-sl-col" : ""
        }" title="Column ${colName} (Click to select column)">${colName}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    // Data rows (SL column locked, data cells editable and enlarged via CSS)
    for (let r = 0; r < numRows; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < numCols; c++) {
        const isSlCol = numCols > 1 && c === 0;
        if (isSlCol) {
          tableHtml += `<td contenteditable="false" class="excel-sl-col" title="Row ${r + 1
            } (Click to select row)">${r + 1}</td>`;
        } else {
          tableHtml += `<td contenteditable="true">&nbsp;</td>`;
        }
      }
      tableHtml += `</tr>`;
    }
    tableHtml += `</tbody></table><p><br/></p>`;

    document.execCommand("insertHTML", false, tableHtml);
    handleEditorInputWrapper();
    setIsTableDropdownOpen(false);
    message.success(`Inserted ${numRows}×${numCols} table (Excel style)`);
  };

  // Table Row & Column Manipulation Actions (Exact Excel/Word: Above, Below, Before, After)
  const handleInsertRow = (position: "above" | "below" = "below") => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Click inside a table first to add a row");
      return;
    }
    const currentCell = lastActiveCellRef.current;
    const targetTr = currentCell && currentCell.closest("table") === table ? currentCell.closest("tr") : null;
    const tbody = table.querySelector("tbody") || table;
    const colsCount = table.rows[0]?.cells.length || 1;
    const isFirstColSl = table.rows[0]?.cells[0]?.textContent?.trim() === "SL";
    const nextRowNumber = table.rows.length;

    const headerRow = (table.querySelector("thead tr") as HTMLTableRowElement | null) || table.rows[0];
    const headerCells = headerRow ? Array.from(headerRow.cells) : [];

    const newRow = document.createElement("tr");
    for (let i = 0; i < colsCount; i++) {
      const td = document.createElement("td");
      const isAttachmentCol =
        headerCells[i]?.classList.contains("excel-attachment-col") ||
        headerCells[i]?.getAttribute("data-col-type") === "attachment";

      if (i === 0 && isFirstColSl) {
        td.setAttribute("contenteditable", "false");
        td.className = "excel-sl-col";
        td.setAttribute("title", `Row ${nextRowNumber} (Click to select row)`);
        td.textContent = `${nextRowNumber}`;
      } else if (isAttachmentCol) {
        td.setAttribute("contenteditable", "false");
        td.className = "excel-attachment-cell";
        td.setAttribute("data-col-type", "attachment");
        td.innerHTML = ROW_ATTACH_BTN_HTML;
      } else {
        td.setAttribute("contenteditable", "true");
        td.innerHTML = "&nbsp;";
      }
      newRow.appendChild(td);
    }

    if (targetTr && targetTr.parentElement) {
      if (position === "above") {
        targetTr.parentElement.insertBefore(newRow, targetTr);
      } else {
        targetTr.parentElement.insertBefore(newRow, targetTr.nextSibling);
      }
    } else {
      tbody.appendChild(newRow);
    }

    updateTableHeadersAndSl(table);
    clearSelectionVisuals(table);
    handleEditorInputWrapper();
    message.success(position === "above" ? "Row inserted above" : "Row inserted below");
  };

  const handleDeleteRow = () => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Click inside a table first to delete a row");
      return;
    }
    const headerRow = (table.querySelector("thead tr") as HTMLTableRowElement | null) || table.rows[0];
    const cellForDelete =
      (selectedCellsRef.current.length > 0 && selectedCellsRef.current[0]?.closest("table") === table)
        ? selectedCellsRef.current[0]
        : lastActiveCellRef.current;

    if (cellForDelete && cellForDelete.closest("table") === table) {
      const tr = cellForDelete.closest("tr");
      if (tr && tr !== headerRow && tr.parentElement?.tagName !== "THEAD") {
        tr.remove();
        updateTableHeadersAndSl(table);
        clearSelectionVisuals(table);
        selectedCellsRef.current = [];
        lastActiveCellRef.current = null;
        handleEditorInputWrapper();
        message.success("Row deleted");
        return;
      }
    }
    // Fallback: delete last row of tbody
    const tbody = table.querySelector("tbody") || table;
    const rows = Array.from(tbody.querySelectorAll("tr")).filter((r) => r.parentElement?.tagName !== "THEAD" && r !== headerRow);
    if (rows.length > 0) {
      rows[rows.length - 1].remove();
      updateTableHeadersAndSl(table);
      clearSelectionVisuals(table);
      selectedCellsRef.current = [];
      lastActiveCellRef.current = null;
      handleEditorInputWrapper();
      message.success("Last row deleted");
    }
  };

  const handleInsertColumn = (position: "before" | "after" = "after") => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Click inside a table first to add a column");
      return;
    }
    const currentCell = lastActiveCellRef.current;
    let targetIndex = -1;
    if (currentCell && currentCell.closest("table") === table) {
      targetIndex = currentCell.cellIndex;
    } else {
      const firstRow = table.rows[0];
      if (firstRow && firstRow.cells.length > 0) {
        targetIndex = firstRow.cells.length - 1;
      }
    }

    const rows = Array.from(table.rows);
    const totalCols = rows[0]?.cells.length || 0;
    const insertIndex = position === "before" ? Math.max(0, targetIndex) : targetIndex + 1;
    const isFirstColSl = table.rows[0]?.cells[0]?.textContent?.trim() === "SL";

    rows.forEach((row, rIdx) => {
      if (rIdx === 0 && row.parentElement?.tagName === "THEAD") {
        const th = document.createElement("th");
        th.setAttribute("contenteditable", "false");
        const nextLetter = isFirstColSl
          ? String.fromCharCode(65 + ((totalCols - 1) % 26))
          : String.fromCharCode(65 + (totalCols % 26));
        th.textContent = nextLetter;
        th.setAttribute("title", `Column ${nextLetter} (Click to select column)`);
        if (insertIndex < row.cells.length) {
          row.insertBefore(th, row.cells[insertIndex]);
        } else {
          row.appendChild(th);
        }
      } else {
        const td = document.createElement("td");
        td.setAttribute("contenteditable", "true");
        td.innerHTML = "&nbsp;";
        if (insertIndex < row.cells.length) {
          row.insertBefore(td, row.cells[insertIndex]);
        } else {
          row.appendChild(td);
        }
      }
    });

    updateTableHeadersAndSl(table);
    clearSelectionVisuals(table);
    handleEditorInputWrapper();
    message.success(position === "before" ? "Column inserted before" : "Column inserted after");
  };

  const handleDeleteColumn = () => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Click inside a table first to delete a column");
      return;
    }
    const isFirstColSl = table.rows[0]?.cells[0]?.textContent?.trim() === "SL";
    const currentCell = lastActiveCellRef.current;
    let targetIndex = -1;
    if (currentCell && currentCell.closest("table") === table) {
      targetIndex = currentCell.cellIndex;
    } else {
      const firstRow = table.rows[0];
      if (firstRow && firstRow.cells.length > 0) {
        targetIndex = firstRow.cells.length - 1;
      }
    }

    // STRICT CHECK: Never allow deleting the SL column!
    if (isFirstColSl && targetIndex === 0) {
      message.warning("The serial number (SL) column cannot be deleted");
      return;
    }

    if (targetIndex >= 0) {
      const rows = Array.from(table.rows);
      rows.forEach((row) => {
        if (row.cells[targetIndex]) {
          row.deleteCell(targetIndex);
        }
      });
      updateTableHeadersAndSl(table);
      clearSelectionVisuals(table);
      selectedCellsRef.current = [];
      lastActiveCellRef.current = null;
      handleEditorInputWrapper();
      message.success("Column deleted");
    }
  };

  const handleAddAttachmentColumn = () => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Click inside a table first to add an attachment column");
      return;
    }

    // Check if an attachment column already exists
    const headerRow = (table.querySelector("thead tr") as HTMLTableRowElement | null) || table.rows[0];
    if (headerRow) {
      const hasAttachmentCol = Array.from(headerRow.cells).some(
        (c) => c.classList.contains("excel-attachment-col") || c.getAttribute("data-col-type") === "attachment"
      );
      if (hasAttachmentCol) {
        message.info("Attachment column already exists in this table");
        return;
      }
    }

    const rows = Array.from(table.rows);
    rows.forEach((row, rIdx) => {
      if (rIdx === 0 && row.parentElement?.tagName === "THEAD") {
        const th = document.createElement("th");
        th.setAttribute("contenteditable", "false");
        th.className = "excel-attachment-col";
        th.setAttribute("data-col-type", "attachment");
        th.innerHTML = ROW_ATTACH_HEADER_HTML;
        th.setAttribute("title", "Attachment Column (Click to attach files to rows)");
        row.appendChild(th);
      } else {
        const td = document.createElement("td");
        td.setAttribute("contenteditable", "false");
        td.className = "excel-attachment-cell";
        td.setAttribute("data-col-type", "attachment");
        td.innerHTML = ROW_ATTACH_BTN_HTML;
        row.appendChild(td);
      }
    });

    updateTableHeadersAndSl(table);
    clearSelectionVisuals(table);
    handleEditorInputWrapper();
    setIsTableDropdownOpen(false);
    message.success("Attachment column added to table");
  };

  const handleRowFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const cell = activeRowUploadCellRef.current;
    if (!file || !cell) return;

    saveUndoSnapshot();

    // Check if the cell already contains existing badges or container
    const existingContainer = cell.querySelector<HTMLElement>(".row-attach-container");
    const originalContent = cell.innerHTML;
    let tempLoadingEl: HTMLElement | null = null;

    if (existingContainer) {
      tempLoadingEl = document.createElement("span");
      tempLoadingEl.className = "row-attach-loading";
      tempLoadingEl.textContent = "⏳ Uploading...";
      existingContainer.appendChild(tempLoadingEl);
    } else {
      cell.innerHTML = `<span class="row-attach-loading">⏳ Uploading...</span>`;
    }

    try {
      const res = await dispatch(
        uploadDirectNoteFiles({
          noteId: activeNote?.id,
          files: [file],
        })
      ).unwrap();

      const uploaded = res.uploaded?.[0];
      const fileKey = uploaded?.key || uploaded?.fileKey;
      const fileName = uploaded?.fileName || uploaded?.name || file.name;

      if (!fileKey) {
        throw new Error("No file key returned from upload");
      }

      const newBadgeHtml = getRowBadgeHtml(fileKey, fileName);

      if (tempLoadingEl && tempLoadingEl.parentElement) {
        tempLoadingEl.remove();
      }

      let container = cell.querySelector<HTMLElement>(".row-attach-container");
      if (container) {
        const addBtn = container.querySelector(".row-attach-add-btn");
        if (addBtn) {
          addBtn.insertAdjacentHTML("beforebegin", newBadgeHtml);
        } else {
          container.insertAdjacentHTML("beforeend", `${newBadgeHtml}${ROW_ATTACH_ADD_BTN_HTML}`);
        }
      } else {
        const existingBadges = Array.from(cell.querySelectorAll<HTMLElement>(".table-file-badge"));
        if (existingBadges.length > 0) {
          const allBadgesHtml = existingBadges.map((b) => b.outerHTML).join("") + newBadgeHtml;
          cell.innerHTML = `<div class="row-attach-container">${allBadgesHtml}${ROW_ATTACH_ADD_BTN_HTML}</div>`;
        } else {
          cell.innerHTML = `<div class="row-attach-container">${newBadgeHtml}${ROW_ATTACH_ADD_BTN_HTML}</div>`;
        }
      }

      // Persist the updated table HTML into formData.description immediately
      const newHtml = editorRef.current ? editorRef.current.innerHTML : (formData.description || "");
      setFormData((prev) => ({
        ...prev,
        description: newHtml,
        attachmentKeys: Array.from(new Set([...(prev.attachmentKeys || []), fileKey])),
      }));

      handleEditorInputWrapper();
      message.success(`Attached "${fileName}" to row`);
    } catch (err: any) {
      if (tempLoadingEl && tempLoadingEl.parentElement) {
        tempLoadingEl.remove();
      } else {
        cell.innerHTML = originalContent;
      }
      message.error(typeof err === "string" ? err : "Failed to upload file to MinIO");
    } finally {
      if (rowAttachmentInputRef.current) {
        rowAttachmentInputRef.current.value = "";
      }
      activeRowUploadCellRef.current = null;
    }
  };

  // Fill Color (Excel Style: colors whichever cells, row, or column are selected)
  const handleApplyFillColor = (
    color: string,
    mode: "bg" | "text" = "bg"
  ) => {
    const table = getTargetTable();
    const cell = lastActiveCellRef.current;
    if (!table || !cell || cell.closest("table") !== table) {
      message.warning("Click inside a table cell or header first to color it");
      return;
    }

    saveUndoSnapshot();

    const isClear = color === "none";
    const applyToElement = (el: HTMLElement) => {
      if (mode === "bg") {
        if (isClear) {
          el.style.removeProperty("background-color");
        } else {
          el.style.setProperty("background-color", color, "important");
        }
      } else {
        if (isClear) {
          el.style.removeProperty("color");
        } else {
          el.style.setProperty("color", color, "important");
        }
      }
    };

    // Color all currently selected cells (multi-cell drag selection, clicked header column, clicked SL row, or single cell)
    const cellsToColor =
      selectedCellsRef.current.length > 0
        ? selectedCellsRef.current.filter((c) => table.contains(c))
        : [cell];

    cellsToColor.forEach((c) => applyToElement(c));
    clearSelectionVisuals(table);
    message.success(
      isClear
        ? "Color cleared"
        : `${cellsToColor.length > 1 ? `${cellsToColor.length} cells` : "Cell"} ${mode === "bg" ? "fill" : "text"
        } applied`
    );

    handleEditorInputWrapper();
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

  const boldDarkColors = [
    { color: "var(--tbl-black)", className: "bg-tbl-black", label: "Black" },
    { color: "var(--tbl-dark-slate)", className: "bg-tbl-dark-slate", label: "Dark Slate" },
    { color: "var(--tbl-slate-gray)", className: "bg-tbl-slate-gray", label: "Slate Gray" },
    { color: "var(--tbl-deep-blue)", className: "bg-tbl-deep-blue", label: "Deep Blue" },
    { color: "var(--tbl-electric-blue)", className: "bg-tbl-electric-blue", label: "Royal Blue" },
    { color: "var(--tbl-teal)", className: "bg-tbl-teal", label: "Dark Cyan" },
    { color: "var(--tbl-dark-green)", className: "bg-tbl-dark-green", label: "Forest Green" },
    { color: "var(--tbl-bold-green)", className: "bg-tbl-bold-green", label: "Emerald Green" },
    { color: "var(--tbl-bold-amber)", className: "bg-tbl-bold-amber", label: "Bold Amber" },
    { color: "var(--tbl-bold-orange)", className: "bg-tbl-bold-orange", label: "Bold Orange" },
    { color: "var(--tbl-crimson-red)", className: "bg-tbl-crimson-red", label: "Crimson Red" },
    { color: "var(--tbl-deep-red)", className: "bg-tbl-deep-red", label: "Deep Red" },
    { color: "var(--tbl-bold-pink)", className: "bg-tbl-bold-pink", label: "Bold Pink" },
    { color: "var(--tbl-vibrant-purple)", className: "bg-tbl-vibrant-purple", label: "Vibrant Purple" },
    { color: "var(--tbl-deep-purple)", className: "bg-tbl-deep-purple", label: "Deep Purple" },
  ];

  const lightShadingColors = [
    { color: "var(--tbl-white)", className: "bg-tbl-white", label: "White" },
    { color: "var(--tbl-gray)", className: "bg-tbl-gray", label: "Light Gray" },
    { color: "var(--tbl-blue)", className: "bg-tbl-blue", label: "Soft Blue" },
    { color: "var(--tbl-cyan)", className: "bg-tbl-cyan", label: "Soft Cyan" },
    { color: "var(--tbl-green)", className: "bg-tbl-green", label: "Soft Green" },
    { color: "var(--tbl-lime)", className: "bg-tbl-lime", label: "Lime" },
    { color: "var(--tbl-yellow)", className: "bg-tbl-yellow", label: "Soft Yellow" },
    { color: "var(--tbl-orange)", className: "bg-tbl-orange", label: "Peach" },
    { color: "var(--tbl-light-red)", className: "bg-tbl-light-red", label: "Light Red" },
    { color: "var(--tbl-purple)", className: "bg-tbl-purple", label: "Lavender" },
  ];

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
      message.success("All sheet content copied to clipboard!");
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

    // Select all contents of editor
    const range = document.createRange();
    range.selectNodeContents(editorRef.current);
    const selection = window.getSelection();
    if (selection) {
      selection.removeAllRanges();
      selection.addRange(range);
    }

    lastClearedHtmlRef.current = editorRef.current.innerHTML;

    // Execute native delete command so browser registers this action in the native Undo (Ctrl+Z) stack
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

  // Helper to sanitize & clean formatting on pasted/external HTML
  // Helper to convert manually typed lists (e.g. "• item", "- item", "1. item") into semantic <ul>/<ol>
  const convertManualListsInContainer = (container: HTMLElement) => {
    const listContainers = [
      container,
      ...Array.from(container.querySelectorAll<HTMLElement>("blockquote, td")),
    ];

    listContainers.forEach((parent) => {
      const children = Array.from(parent.children);
      let activeList: HTMLUListElement | HTMLOListElement | null = null;
      let activeType: "ul" | "ol" | null = null;

      children.forEach((child) => {
        if (child.tagName === "P" || child.tagName === "DIV") {
          const rawText = (child.textContent || "").trim();
          const bulletMatch = rawText.match(/^([•\-\*▪–—])\s+(.+)$/s);
          const numberMatch = rawText.match(/^(\d+)[\.\)\-]\s+(.+)$/s);

          if (bulletMatch) {
            if (activeType !== "ul" || !activeList) {
              activeList = document.createElement("ul");
              activeType = "ul";
              child.parentNode?.insertBefore(activeList, child);
            }
            const li = document.createElement("li");
            const cloned = child.cloneNode(true) as HTMLElement;
            // Strip leading bullet marker from first non-empty text node
            const firstTextNode = Array.from(cloned.childNodes).find(
              (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0
            );
            if (firstTextNode && firstTextNode.textContent) {
              firstTextNode.textContent = firstTextNode.textContent.replace(
                /^([•\-\*▪–—])\s+/,
                ""
              );
            }
            while (cloned.firstChild) li.appendChild(cloned.firstChild);
            activeList.appendChild(li);
            child.remove();
            return;
          } else if (numberMatch) {
            if (activeType !== "ol" || !activeList) {
              activeList = document.createElement("ol");
              activeType = "ol";
              child.parentNode?.insertBefore(activeList, child);
            }
            const li = document.createElement("li");
            const cloned = child.cloneNode(true) as HTMLElement;
            const firstTextNode = Array.from(cloned.childNodes).find(
              (n) => n.nodeType === Node.TEXT_NODE && (n.textContent || "").trim().length > 0
            );
            if (firstTextNode && firstTextNode.textContent) {
              firstTextNode.textContent = firstTextNode.textContent.replace(
                /^(\d+)[\.\)\-]\s+/,
                ""
              );
            }
            while (cloned.firstChild) li.appendChild(cloned.firstChild);
            activeList.appendChild(li);
            child.remove();
            return;
          }
        }

        activeList = null;
        activeType = null;
      });
    });
  };

  // Comprehensive Document Formatting & Visual Structure Normalizer
  const formatDocumentStructure = (container: HTMLElement) => {
    // 1. Strip external Office, web metadata, scripts, and comments
    const junkSelectors = "o\\:p, xml, style, meta, link, script, noscript";
    try {
      container.querySelectorAll(junkSelectors).forEach((t) => t.remove());
    } catch {
      // ignore
    }

    // Unwrap <font> tags while preserving their children
    container.querySelectorAll("font").forEach((font) => {
      while (font.firstChild) {
        font.parentNode?.insertBefore(font.firstChild, font);
      }
      font.remove();
    });

    // 2. Convert raw <div> lines to <p> (except attachment containers and tables)
    const divs = Array.from(container.querySelectorAll("div"));
    divs.forEach((div) => {
      if (
        div.classList.contains("row-attach-container") ||
        div.classList.contains("table-file-badge") ||
        div.closest(".row-attach-container") ||
        div.closest(".table-file-badge") ||
        div.querySelector("table, ul, ol, blockquote, pre")
      ) {
        return;
      }
      const p = document.createElement("p");
      while (div.firstChild) {
        p.appendChild(div.firstChild);
      }
      div.parentNode?.replaceChild(p, div);
    });

    // 3. Collapse multiple consecutive <br> tags within blocks
    const blocksWithBrs = container.querySelectorAll("p, div, li, blockquote");
    blocksWithBrs.forEach((el) => {
      let consecutiveBrCount = 0;
      const nodes = Array.from(el.childNodes);
      nodes.forEach((node) => {
        if (node.nodeName === "BR") {
          consecutiveBrCount++;
          if (consecutiveBrCount > 1) {
            node.remove();
          }
        } else if (
          node.nodeType === Node.TEXT_NODE &&
          (node.textContent || "").trim() === ""
        ) {
          // empty space between brs, ignore
        } else {
          consecutiveBrCount = 0;
        }
      });
    });

    // 4. Convert manual bullet points and numbered lists
    convertManualListsInContainer(container);

    // 5. Detect and promote obvious headings / section titles
    const paras = Array.from(container.querySelectorAll("p"));
    paras.forEach((p) => {
      if (p.closest("table") || p.closest("ul") || p.closest("ol") || p.closest("blockquote")) {
        return;
      }
      const rawText = (p.textContent || "").trim();
      if (!rawText) return;

      // Markdown # Heading
      const mdH1 = rawText.match(/^#\s+(.+)$/);
      const mdH2 = rawText.match(/^##\s+(.+)$/);
      const mdH3 = rawText.match(/^###+\s+(.+)$/);
      if (mdH1) {
        const h = document.createElement("h2");
        h.textContent = mdH1[1];
        p.parentNode?.replaceChild(h, p);
        return;
      }
      if (mdH2) {
        const h = document.createElement("h2");
        h.textContent = mdH2[1];
        p.parentNode?.replaceChild(h, p);
        return;
      }
      if (mdH3) {
        const h = document.createElement("h3");
        h.textContent = mdH3[1];
        p.parentNode?.replaceChild(h, p);
        return;
      }

      // Standalone Bold Heading: e.g. <p><b>Important Section Title</b></p>
      if (
        p.children.length === 1 &&
        (p.children[0].tagName === "B" || p.children[0].tagName === "STRONG") &&
        rawText.length > 2 &&
        rawText.length <= 80 &&
        !rawText.endsWith(".")
      ) {
        const h = document.createElement("h3");
        while (p.children[0].firstChild) {
          h.appendChild(p.children[0].firstChild);
        }
        p.parentNode?.replaceChild(h, p);
        return;
      }

      // Standalone uppercase section title or ending in colon (e.g. "PROJECT OVERVIEW:", "DELIVERABLES:")
      const isShortTitle =
        rawText.length >= 3 &&
        rawText.length <= 60 &&
        ((rawText === rawText.toUpperCase() && /[A-Z]/.test(rawText)) ||
          (rawText.endsWith(":") && !rawText.includes(".")));
      if (isShortTitle && !p.querySelector("img, a, input, button")) {
        const h = document.createElement("h3");
        while (p.firstChild) {
          h.appendChild(p.firstChild);
        }
        p.parentNode?.replaceChild(h, p);
        return;
      }
    });

    // 6. Normalize headings (h4-h6 promoted to h3) and clean typography
    container.querySelectorAll("h4, h5, h6").forEach((h) => {
      const h3 = document.createElement("h3");
      while (h.firstChild) h3.appendChild(h.firstChild);
      h.parentNode?.replaceChild(h3, h);
    });

    // 7. Strip dirty external styles, normalize typography & spacing
    const allElements = Array.from(container.querySelectorAll<HTMLElement>("*"));
    allElements.forEach((el) => {
      // NEVER touch attachment chips, download buttons, or preview buttons!
      if (
        el.classList.contains("table-file-badge") ||
        el.classList.contains("row-attach-container") ||
        el.classList.contains("row-attach-add-btn") ||
        el.classList.contains("row-attach-upload-btn") ||
        el.closest(".table-file-badge") ||
        el.closest(".row-attach-container")
      ) {
        return;
      }

      const tagName = el.tagName;
      const isTable = tagName === "TABLE";
      const isTh = tagName === "TH";
      const isTd = tagName === "TD";
      const isHeading = ["H1", "H2", "H3"].includes(tagName);
      const isList = tagName === "UL" || tagName === "OL";
      const isLi = tagName === "LI";
      const isPara = tagName === "P";

      // Strip foreign fonts, sizes, line-heights, letter-spacing
      el.style.removeProperty("font-family");
      el.style.removeProperty("font-size");
      el.style.removeProperty("line-height");
      el.style.removeProperty("letter-spacing");
      el.style.removeProperty("word-spacing");
      el.style.removeProperty("text-indent");
      el.style.removeProperty("margin-left");
      el.style.removeProperty("margin-right");
      el.style.removeProperty("max-width");

      // Apply standard WorkSphere document styling
      if (isPara) {
        el.style.margin = "0 0 0.65rem 0";
        el.style.lineHeight = "1.75";
      } else if (isHeading) {
        el.style.marginTop = tagName === "H1" ? "1.25rem" : tagName === "H2" ? "1rem" : "0.75rem";
        el.style.marginBottom = "0.4rem";
        el.style.fontWeight = tagName === "H1" || tagName === "H2" ? "700" : "600";
        el.style.color = "#1B2559";
      } else if (isList) {
        el.style.paddingLeft = "1.75rem";
        el.style.marginTop = "0.4rem";
        el.style.marginBottom = "0.6rem";
      } else if (isLi) {
        el.style.marginBottom = "0.25rem";
        el.style.lineHeight = "1.7";
      } else if (!isTable && !isTh && !isTd) {
        el.style.removeProperty("margin-top");
        el.style.removeProperty("margin-bottom");
        el.style.removeProperty("width");
      }

      // Clean background-color if external web highlight
      const bg = el.style.backgroundColor;
      if (bg && bg !== "transparent" && !bg.startsWith("var(--tbl-") && !isTh && !isTd) {
        el.style.removeProperty("background-color");
      }

      // Clean text color if external web color
      const color = el.style.color;
      if (color && !color.startsWith("var(--tbl-") && color !== "inherit" && !isHeading) {
        el.style.removeProperty("color");
      }

      // Clean external borders if not a table or cell
      if (!isTable && !isTh && !isTd) {
        el.style.removeProperty("border");
        el.style.removeProperty("border-top");
        el.style.removeProperty("border-bottom");
        el.style.removeProperty("border-left");
        el.style.removeProperty("border-right");
      }

      // Remove dirty external classes
      const classList = Array.from(el.classList);
      classList.forEach((cls) => {
        if (
          !cls.startsWith("excel-") &&
          !cls.startsWith("table-") &&
          !cls.startsWith("row-") &&
          !cls.startsWith("a4-") &&
          !cls.startsWith("bg-tbl-")
        ) {
          el.classList.remove(cls);
        }
      });
      if (el.classList.length === 0) {
        el.removeAttribute("class");
      }

      // Remove empty style attributes
      if (!el.getAttribute("style") || el.getAttribute("style")?.trim() === "") {
        el.removeAttribute("style");
      }

      // Unwrap empty/useless spans
      if (tagName === "SPAN" && el.attributes.length === 0) {
        while (el.firstChild) {
          el.parentNode?.insertBefore(el.firstChild, el);
        }
        el.remove();
      }
    });

    // 8. Clean and normalize tables
    const tables = Array.from(container.querySelectorAll<HTMLTableElement>("table"));
    tables.forEach((tbl) => {
      tbl.style.borderCollapse = "collapse";
      tbl.style.margin = "1rem 0";
      tbl.style.border = "1px solid #64748b";

      // If missing thead, promote first row
      if (!tbl.querySelector("thead") && tbl.rows.length > 0) {
        const thead = tbl.createTHead();
        const firstRow = tbl.rows[0];
        thead.appendChild(firstRow);
        Array.from(firstRow.cells).forEach((c) => {
          const th = document.createElement("th");
          while (c.firstChild) th.appendChild(c.firstChild);
          c.parentNode?.replaceChild(th, c);
        });
      }

      // Header cells styling
      tbl.querySelectorAll("th").forEach((th) => {
        if (!th.classList.contains("excel-sl-col")) {
          th.style.backgroundColor = "#f8fafc";
          th.style.fontWeight = "600";
          th.style.color = "#1e293b";
          th.style.textAlign = "center";
          th.style.border = "1px solid #64748b";
          th.style.padding = "8px 14px";
        }
      });

      // Data cells styling
      tbl.querySelectorAll("td").forEach((td) => {
        if (!td.classList.contains("excel-sl-col")) {
          td.style.border = "1px solid #64748b";
          td.style.padding = "8px 14px";
          td.style.color = "#1e293b";
        }
      });

      // Maintain Excel headers and SL column
      updateTableHeadersAndSl(tbl);
    });

    // 9. Remove excessive blank paragraphs (more than 1 consecutive empty paragraph)
    const paragraphs = Array.from(container.querySelectorAll("p"));
    let consecutiveEmptyCount = 0;
    paragraphs.forEach((p) => {
      const text = (p.textContent || "").trim();
      const hasMedia = p.querySelector("img, table, iframe, svg, canvas, button");
      const isEmpty = text.length === 0 && !hasMedia;

      if (isEmpty) {
        consecutiveEmptyCount++;
        if (consecutiveEmptyCount > 1) {
          p.remove();
        } else {
          p.innerHTML = "<br/>";
        }
      } else {
        consecutiveEmptyCount = 0;
      }
    });

    // Clean leading and trailing empty paragraphs
    while (
      container.firstElementChild &&
      container.firstElementChild.tagName === "P" &&
      !(container.firstElementChild.textContent || "").trim() &&
      !container.firstElementChild.querySelector("img, table, iframe, button")
    ) {
      container.firstElementChild.remove();
    }
    while (
      container.lastElementChild &&
      container.lastElementChild.tagName === "P" &&
      !(container.lastElementChild.textContent || "").trim() &&
      !container.lastElementChild.querySelector("img, table, iframe, button")
    ) {
      container.lastElementChild.remove();
    }
  };

  // Format Content Action (dual-mode: cleans & structures selection if active, otherwise entire sheet)
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
                    handleToolbarCommand("bold");
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
                    handleToolbarCommand("italic");
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
                    handleToolbarCommand("underline");
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
                    handleToolbarCommand("strikeThrough");
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
                              className={`w-full py-1 text-center rounded-md text-xs font-semibold transition cursor-pointer ${isSelected
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
                      className={`h-8 w-[52px] px-2 bg-white rounded-lg text-xs font-semibold text-slate-800 flex items-center justify-between gap-1 transition cursor-pointer border ${isFontSizeOpen
                        ? "border-[#4318FF] text-[#4318FF]"
                        : "border-slate-200 hover:border-slate-300"
                        }`}
                      title="Font Size (Default: 14)"
                    >
                      <span>{fontSize}</span>
                      <ChevronDown
                        className={`w-3 h-3 text-slate-400 transition-transform duration-150 ${isFontSizeOpen ? "rotate-180 text-[#4318FF]" : ""
                          }`}
                      />
                    </button>
                  </Popover>
                </div>

                {/* Word Page Orientation Toggle (Icon only, borderless) */}
                <button
                  type="button"
                  onClick={handleToggleOrientation}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer shrink-0 select-none ${orientation === "landscape"
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
                    handleToolbarCommand("insertUnorderedList");
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
                    handleToolbarCommand("insertOrderedList");
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
                    handleToolbarCommand("formatBlock", "<blockquote>");
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
                                onClick={() => handleInsertTable(r, c)}
                                className={`w-5 h-5 rounded-xs border transition cursor-pointer ${isHighlighted
                                  ? "bg-[#4318FF] border-[#4318FF]"
                                  : "bg-white border-slate-300 hover:border-indigo-400"
                                  }`}
                                title={`${c} × ${r}`}
                              />
                            );
                          })
                        )}
                      </div>

                      {/* Manual / Custom Dimension Inputs (e.g. 2x2, 5x4, 10x10) */}
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

                      {/* Row/Col Management options below grid (Excel/Word Style: Above/Below, Left/Right) */}
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
                                handleInsertRow("above");
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
                                handleInsertRow("below");
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
                                handleDeleteRow();
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
                                handleInsertColumn("before");
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
                                handleInsertColumn("after");
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
                                handleDeleteColumn();
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
                              handleAddAttachmentColumn();
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
                    className={`w-8 h-8 flex items-center justify-center rounded-lg transition cursor-pointer shrink-0 ${isTableDropdownOpen
                      ? "bg-indigo-50 text-[#4318FF]"
                      : "text-slate-800 hover:text-[#4318FF] hover:bg-slate-100"
                      }`}
                    title="Insert Table (Hover grid, custom dimensions & row/col tools)"
                  >
                    <TableIcon className="w-4 h-4" />
                  </button>
                </Popover>

                {/* TABLE FILL / SHADING POPOVER (Cell, Row, Column Color like Excel) */}
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

                      {/* Color Mode: Background Fill vs Text Color */}
                      <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Color Target:
                        </span>
                        <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-100 rounded-lg">
                          <button
                            type="button"
                            onClick={() => setFillMode("bg")}
                            className={`py-1 text-center text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${fillMode === "bg"
                              ? "bg-white text-slate-800 shadow-xs"
                              : "text-slate-500 hover:text-slate-800"
                              }`}
                          >
                            <span>🪣 Background</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setFillMode("text")}
                            className={`py-1 text-center text-xs font-semibold rounded-md transition cursor-pointer flex items-center justify-center gap-1 ${fillMode === "text"
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
                          {boldDarkColors.map((c) => (
                            <button
                              key={`tbl-bg-${c.className}`}
                              type="button"
                              onClick={() => handleApplyFillColor(c.color, fillMode)}
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
                          {lightShadingColors.map((c) => (
                            <button
                              key={`tbl-bg-${c.className}`}
                              type="button"
                              onClick={() => handleApplyFillColor(c.color, fillMode)}
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
                            className={`w-7 h-7 rounded-lg border flex items-center justify-center transition cursor-pointer ${textColor === c.color
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
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition cursor-pointer ${highlightColor === c.color
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

                {/* Right side toolbar controls: Format, Undo, Redo, Clear Page & Copy All */}
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
                    className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition select-none ${!hasContent
                      ? "bg-slate-100/70 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-60"
                      : "bg-rose-50/70 text-rose-700 border-rose-200 hover:bg-rose-100 hover:border-rose-300 cursor-pointer"
                      }`}
                    title={
                      !hasContent
                        ? "Sheet is already empty"
                        : "Clear entire sheet"
                    }
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Clear Page</span>
                  </button>

                  {/* Copy All Button */}
                  <button
                    type="button"
                    onClick={handleCopyAll}
                    disabled={!hasContent}
                    className={`h-8 px-2.5 flex items-center gap-1.5 rounded-lg text-xs font-semibold border transition select-none ${!hasContent
                      ? "bg-slate-100/70 text-slate-400 border-slate-200/80 cursor-not-allowed opacity-60"
                      : isCopied
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 cursor-pointer"
                        : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:text-[#4318FF] cursor-pointer"
                      }`}
                    title={
                      !hasContent
                        ? "No content in sheet to copy"
                        : "Copy all content in A4 sheet to clipboard"
                    }
                  >
                    {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-600" />}
                    <span>{isCopied ? "Copied!" : "Copy All"}</span>
                  </button>
                </div>
              </div>

              {/* A4 Workspace Simulation */}
              <div className="a4-page-workspace w-full flex justify-center items-start overflow-x-auto bg-slate-100/80 p-4 sm:p-8 min-h-[640px]">
                <div
                  className={`a4-page shrink-0 transition-all duration-300 ${orientation === "landscape" ? "landscape" : ""
                    }`}
                  style={
                    orientation === "landscape"
                      ? { minWidth: "337mm", width: "max-content", minHeight: "210mm" }
                      : { width: "210mm", maxWidth: "210mm", minHeight: "297mm" }
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
