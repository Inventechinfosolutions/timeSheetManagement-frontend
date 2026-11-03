import { useState, useRef, useEffect } from "react";
import { message } from "antd";
import { Note, NotesFormData, NoteDocumentItem } from "../types/notes.types";
import { useAppDispatch } from "../../hooks";
import { uploadDirectNoteFiles } from "../../reducers/notes.reducer";
import {
  ROW_ATTACH_BTN_HTML,
  ROW_ATTACH_ADD_BTN_HTML,
  ROW_ATTACH_HEADER_HTML,
  getRowBadgeHtml,
} from "../utils/noteEditorAttachmentHelpers";
import {
  getColLabel,
  clearSelectionVisuals as clearTableSelectionVisuals,
  applySelectionVisuals,
  updateTableHeadersAndSl,
  ensureEditorTableHorizontalScroll,
  restoreNoteScroll,
  snapshotNoteScroll,
} from "../utils/noteEditorTableHelpers";

interface UseNoteTableParams {
  editorRef: React.RefObject<HTMLDivElement>;
  setFormData: React.Dispatch<React.SetStateAction<NotesFormData>>;
  activeNote: Note | null;
  saveUndoSnapshot: () => void;
  handleEditorInputWrapper: (opts?: { skipPagination?: boolean }) => void;
  onPreviewAttachment: (item: NoteDocumentItem) => void;
  onDownloadAttachment: (item: NoteDocumentItem) => void;
  onPreviewImage?: (url: string, title?: string) => void;
}

export const useNoteTable = ({
  editorRef,
  setFormData,
  activeNote,
  saveUndoSnapshot,
  handleEditorInputWrapper,
  onPreviewAttachment,
  onDownloadAttachment,
  onPreviewImage,
}: UseNoteTableParams) => {
  const dispatch = useAppDispatch();
  const rowAttachmentInputRef = useRef<HTMLInputElement>(null);
  const activeRowUploadCellRef = useRef<HTMLTableCellElement | null>(null);

  const [isTableDropdownOpen, setIsTableDropdownOpen] = useState<boolean>(false);
  const [hoverGrid, setHoverGrid] = useState<{ rows: number; cols: number }>({ rows: 0, cols: 0 });
  const [customRows, setCustomRows] = useState<number>(2);
  const [customCols, setCustomCols] = useState<number>(2);
  const [fillMode, setFillMode] = useState<"bg" | "text">("bg");
  const lastActiveCellRef = useRef<HTMLTableCellElement | null>(null);
  const selectedCellsRef = useRef<HTMLTableCellElement[]>([]);
  const selectionKindRef = useRef<"row" | "column" | "cell" | "table" | null>(null);
  /** Remembers last row/col selection so Del Row/Col still work after toolbar click */
  const lastSelectedRowRef = useRef<HTMLTableRowElement | null>(null);
  const lastSelectedColIndexRef = useRef<number>(-1);
  /** Caret in the note body — survives toolbar / Insert Table popover focus steal */
  const savedCaretRangeRef = useRef<Range | null>(null);
  /** DOM node near last click/caret — more reliable than Range after focus steal */
  const savedInsertAnchorRef = useRef<HTMLElement | null>(null);
  const savedInsertClientYRef = useRef<number | null>(null);
  const syncExpandHandleRef = useRef<() => void>(() => {});

  const captureEditorCaret = (
    fromEventTarget?: EventTarget | null,
    clientY?: number | null
  ) => {
    const editor = editorRef.current;
    if (!editor) return;

    if (typeof clientY === "number") {
      savedInsertClientYRef.current = clientY;
    }

    if (fromEventTarget && fromEventTarget instanceof Node && editor.contains(fromEventTarget)) {
      const t =
        fromEventTarget.nodeType === Node.ELEMENT_NODE
          ? (fromEventTarget as HTMLElement)
          : fromEventTarget.parentElement;
      if (t && !t.closest("[data-notes-toolbar], .ant-popover, .ant-popover-content")) {
        savedInsertAnchorRef.current =
          (t.closest(
            ".note-table-scroll, .note-inserted-table, td, th, p, h1, h2, h3, h4, li, blockquote, pre, .page"
          ) as HTMLElement | null) || t;
      }
    }

    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    const range = sel.getRangeAt(0);
    if (!editor.contains(range.commonAncestorContainer)) return;
    const anchorEl =
      range.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (range.commonAncestorContainer as HTMLElement)
        : range.commonAncestorContainer.parentElement;
    if (anchorEl?.closest?.("[data-notes-toolbar], .ant-popover, .ant-popover-content")) return;
    try {
      savedCaretRangeRef.current = range.cloneRange();
      if (!savedInsertAnchorRef.current || !editor.contains(savedInsertAnchorRef.current)) {
        savedInsertAnchorRef.current =
          (anchorEl?.closest(
            ".note-table-scroll, .note-inserted-table, td, th, p, h1, h2, h3, h4, li, blockquote, pre, .page"
          ) as HTMLElement | null) || anchorEl;
      }
    } catch {
      /* ignore */
    }
  };

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

  const clearSelectionVisuals = (table?: HTMLElement | null) => {
    clearTableSelectionVisuals(table, getTargetTable() || editorRef.current);
  };

  const clearTableSelection = (table?: HTMLElement | null) => {
    clearSelectionVisuals(table);
    selectedCellsRef.current = [];
    selectionKindRef.current = null;
    syncExpandHandleRef.current();
  };

  const focusEditableCell = (cell: HTMLTableCellElement | null) => {
    if (!cell || !document.contains(cell)) return;
    const row = cell.closest("tr");
    const editable =
      cell.getAttribute("contenteditable") === "true"
        ? cell
        : ((row?.querySelector(
            'td[contenteditable="true"]:not(.excel-sl-col):not(.excel-attachment-cell)'
          ) as HTMLTableCellElement | null) ||
          (cell.getAttribute("contenteditable") !== "false" ? cell : null));
    const target = editable || cell;
    const snaps = snapshotNoteScroll(editorRef.current);
    editorRef.current?.focus({ preventScroll: true });
    try {
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(target);
      range.collapse(true);
      sel?.removeAllRanges();
      sel?.addRange(range);
    } catch {
      /* ignore */
    }
    restoreNoteScroll(snaps);
    requestAnimationFrame(() => restoreNoteScroll(snaps));
    lastActiveCellRef.current = target;
  };

  const selectTableRow = (tr: HTMLTableRowElement) => {
    const table = tr.closest("table") as HTMLTableElement | null;
    if (!table) return;
    const rowCells = Array.from(tr.cells) as HTMLTableCellElement[];
    if (!rowCells.length) return;
    clearSelectionVisuals(table);
    // Prefer a data cell as lastActive so Del Col never targets SL by accident
    lastActiveCellRef.current =
      (rowCells.find(
        (c) =>
          !c.classList.contains("excel-sl-col") &&
          !c.classList.contains("excel-attachment-cell")
      ) as HTMLTableCellElement | undefined) || rowCells[0];
    selectedCellsRef.current = rowCells;
    lastSelectedRowRef.current = tr;
    lastSelectedColIndexRef.current = -1;
    applySelectionVisuals(rowCells, "row");
    selectionKindRef.current = "row";
    syncExpandHandleRef.current();
  };

  const selectTableColumn = (table: HTMLTableElement, colIndex: number) => {
    if (colIndex < 0) return;
    const colCells: HTMLTableCellElement[] = [];
    Array.from(table.rows).forEach((row) => {
      if (row.cells[colIndex]) colCells.push(row.cells[colIndex] as HTMLTableCellElement);
    });
    if (!colCells.length) return;
    clearSelectionVisuals(table);
    lastActiveCellRef.current = colCells[0];
    selectedCellsRef.current = colCells;
    lastSelectedColIndexRef.current = colIndex;
    lastSelectedRowRef.current = null;
    applySelectionVisuals(colCells, "column");
    selectionKindRef.current = "column";
    syncExpandHandleRef.current();
  };

  // Track caret + active table cell on selection change
  useEffect(() => {
    const handleSelectionChange = () => {
      captureEditorCaret();

      // Do not clobber Excel row/column/table selections when caret moves (e.g. toolbar click)
      if (
        selectionKindRef.current === "row" ||
        selectionKindRef.current === "column" ||
        selectionKindRef.current === "table"
      ) {
        return;
      }
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0) return;
      const node = sel.anchorNode;
      if (!node) return;
      const el = (node.nodeType === Node.ELEMENT_NODE ? node : node.parentElement) as HTMLElement | null;
      const cell = el?.closest("td, th") as HTMLTableCellElement | null;
      if (cell) {
        lastActiveCellRef.current = cell;
      }

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

  // Capture caret on pointer down BEFORE toolbar/popover steals focus
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const onPointerDown = (e: PointerEvent) => {
      captureEditorCaret(e.target, e.clientY);
    };
    editor.addEventListener("pointerdown", onPointerDown, true);
    return () => editor.removeEventListener("pointerdown", onPointerDown, true);
  }, [editorRef]);

  // Click on table header (TH) to select entire column, or click SL cell to select entire row
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleTableClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Remove pasted screenshot via X control
      const removeImgBtn = target.closest<HTMLElement>("[data-image-action='remove']");
      if (removeImgBtn && editor.contains(removeImgBtn)) {
        e.preventDefault();
        e.stopPropagation();
        const wrap = removeImgBtn.closest<HTMLElement>(".note-inline-image");
        saveUndoSnapshot();
        if (wrap) wrap.remove();
        else removeImgBtn.parentElement?.remove();
        handleEditorInputWrapper();
        return;
      }

      // Click pasted / inline screenshot → open full-size preview
      if (target.tagName === "IMG" && onPreviewImage) {
        const img = target as HTMLImageElement;
        const src = img.currentSrc || img.src;
        if (src) {
          e.preventDefault();
          e.stopPropagation();
          onPreviewImage(
            src,
            img.getAttribute("alt") || img.getAttribute("title") || "Screenshot"
          );
          return;
        }
      }

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

      // Click empty space (outside cells) -> remove blue selection + hide expand handle
      if (!cell || !editor.contains(cell)) {
        clearTableSelection(getTargetTable() || editor);
        return;
      }

      const table = cell.closest("table");
      if (!table) {
        clearTableSelection(editor);
        return;
      }

      const isFirstColSl =
        table.rows[0]?.cells[0]?.textContent?.trim() === "SL" ||
        table.rows[0]?.cells[0]?.classList.contains("excel-sl-col");
      const alreadySelectedCol =
        selectionKindRef.current === "column" &&
        selectedCellsRef.current.some(
          (c) => document.contains(c) && c.closest("table") === table && c.cellIndex === cell.cellIndex
        );
      const alreadySelectedCell =
        selectionKindRef.current === "cell" &&
        selectedCellsRef.current.length === 1 &&
        selectedCellsRef.current[0] === cell;

      const isSlRowNumber =
        isFirstColSl &&
        cell.cellIndex === 0 &&
        cell !== table.rows[0]?.cells[0] &&
        cell.tagName !== "TH";

      // Click row number (1, 2, 3…) -> select that row only
      if (isSlRowNumber) {
        e.preventDefault();
        const tr = cell.closest("tr") as HTMLTableRowElement | null;
        const alreadySelectedRow =
          selectionKindRef.current === "row" &&
          selectedCellsRef.current.some(
            (c) => document.contains(c) && c.closest("tr") === tr
          );
        if (alreadySelectedRow) {
          clearTableSelection(table);
          return;
        }
        if (tr) selectTableRow(tr);
      }
      // Click any header (including SL) -> select that column so Del Col works on SL too
      else if (cell.tagName === "TH" || (table.rows[0] && cell.parentElement === table.rows[0])) {
        e.preventDefault();
        if (alreadySelectedCol) {
          clearTableSelection(table);
          return;
        }
        selectTableColumn(table as HTMLTableElement, cell.cellIndex);
      }
      // Click on normal cell -> select that cell; click same cell again to clear
      else {
        if (alreadySelectedCell) {
          clearTableSelection(table);
          lastSelectedRowRef.current = null;
          lastSelectedColIndexRef.current = -1;
          return;
        }
        clearSelectionVisuals(table);
        lastActiveCellRef.current = cell;
        selectedCellsRef.current = [cell];
        lastSelectedRowRef.current = cell.closest("tr");
        lastSelectedColIndexRef.current = cell.classList.contains("excel-sl-col")
          ? -1
          : cell.cellIndex;
        applySelectionVisuals([cell], "cells");
        selectionKindRef.current = "cell";
        syncExpandHandleRef.current();
        // Leave the caret where the user clicked. Forcing it to the start of the
        // cell makes the table scroll back to the beginning of the row.
        lastActiveCellRef.current = cell;
      }
    };

    editor.addEventListener("click", handleTableClick);
    return () => {
      editor.removeEventListener("click", handleTableClick);
    };
  }, [editorRef, onDownloadAttachment, onPreviewAttachment, onPreviewImage]);

  useEffect(() => {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "notes-excel-fill-handle";
    handle.textContent = "+";
    handle.title = "Drag to resize column · Click to close selection";
    handle.contentEditable = "false";
    document.body.appendChild(handle);

    const isSl = (cell?: Element | null) => Boolean(cell?.classList.contains("excel-sl-col"));
    const MIN = 48;

    const readWidths = (table: HTMLTableElement) =>
      Array.from(table.rows[0]?.cells || []).map((c) =>
        Math.round((c as HTMLTableCellElement).getBoundingClientRect().width)
      );

    const applyWidths = (table: HTMLTableElement, widths: number[]) => {
      Array.from(table.rows).forEach((row) => {
        widths.forEach((w, i) => {
          const cell = row.cells[i] as HTMLTableCellElement | undefined;
          if (!cell) return;
          if (isSl(cell)) {
            cell.style.setProperty("width", "44px", "important");
            cell.style.setProperty("min-width", "44px", "important");
            cell.style.setProperty("max-width", "44px", "important");
            return;
          }
          const px = Math.max(MIN, Math.round(w));
          cell.style.setProperty("width", `${px}px`, "important");
          cell.style.setProperty("min-width", `${px}px`, "important");
          cell.style.setProperty("max-width", `${px}px`, "important");
          // Shrink/wrap content with the column — do not overflow into the next cell
          cell.style.setProperty("overflow", "hidden", "important");
          cell.style.setProperty("white-space", "normal", "important");
          cell.style.setProperty("overflow-wrap", "anywhere", "important");
          cell.style.setProperty("word-break", "break-word", "important");
        });
      });
      const total = widths.reduce((sum, w) => sum + Math.max(MIN, Math.round(w)), 0);
      table.classList.add("note-wide-table");
      table.style.setProperty("width", `${total}px`, "important");
      table.style.removeProperty("min-width");
      table.style.setProperty("max-width", "none", "important");
      table.style.setProperty("table-layout", "fixed", "important");
      if (!table.closest(".note-table-scroll")) {
        ensureEditorTableHorizontalScroll(table);
      }
    };

    /** Grow or shrink only the selected column, out to the right. Neighbors stay put. */
    const setSelectedColWidth = (
      table: HTMLTableElement,
      colIndex: number,
      startWidths: number[],
      targetWidth: number
    ) => {
      const header = table.rows[0]?.cells[colIndex];
      if (!header || isSl(header)) return;
      const widths = startWidths.map((w) => Math.round(w));
      widths[colIndex] = Math.max(MIN, Math.round(targetWidth));
      applyWidths(table, widths);
      const scroller = table.closest(".note-table-scroll") as HTMLElement | null;
      const grown = table.rows[0]?.cells[colIndex] as HTMLTableCellElement | undefined;
      if (scroller && grown) {
        const right = grown.offsetLeft + grown.offsetWidth;
        const viewRight = scroller.scrollLeft + scroller.clientWidth;
        if (right > viewRight - 12) {
          scroller.scrollLeft = right - scroller.clientWidth + 16;
        }
      }
    };

    /** + expand only for a selected vertical column (header click) — never for single cell / row */
    const getExpandTarget = () => {
      const kind = selectionKindRef.current;
      // + only for a selected data column (A/B/C…), not whole-table / row / cell
      if (kind !== "column") return null;
      const cells = selectedCellsRef.current.filter(
        (c) => document.contains(c) && c.classList.contains("excel-cell-selected")
      );
      const table = cells[0]?.closest("table") as HTMLTableElement | null;
      if (!table || !cells.length) return null;
      const colIndex = cells[0].cellIndex;
      const header = table.rows[0]?.cells[colIndex] as HTMLTableCellElement | undefined;
      if (!header || isSl(header) || isSl(cells[0])) return null;
      return { table, colIndex, anchor: header, kind: "column" as const };
    };

    const syncHandle = () => {
      const target = getExpandTarget();
      if (!target) {
        handle.classList.remove("is-visible");
        return;
      }
      const rect = target.anchor.getBoundingClientRect();
      // Top of the column header — vertical column select only
      handle.style.left = `${rect.right}px`;
      handle.style.top = `${rect.top}px`;
      handle.classList.add("is-visible");
    };
    syncExpandHandleRef.current = syncHandle;

    type DragState = {
      table: HTMLTableElement;
      colIndex: number;
      startX: number;
      startWidths: number[];
      moved: boolean;
      pointerId: number;
    };
    let drag: DragState | null = null;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const target = getExpandTarget();
      if (!target) return;
      handle.setPointerCapture(e.pointerId);
      handle.classList.add("is-dragging");
      saveUndoSnapshot();
      drag = {
        table: target.table,
        colIndex: target.colIndex,
        startX: e.clientX,
        startWidths: readWidths(target.table),
        moved: false,
        pointerId: e.pointerId,
      };
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const dx = e.clientX - drag.startX;
      if (!drag.moved && Math.abs(dx) < 2) return;
      drag.moved = true;
      setSelectedColWidth(
        drag.table,
        drag.colIndex,
        drag.startWidths,
        drag.startWidths[drag.colIndex] + dx
      );
      syncHandle();
    };

    const clearExpandMode = () => {
      const table = getExpandTarget()?.table || getTargetTable();
      clearSelectionVisuals(table);
      selectedCellsRef.current = [];
      selectionKindRef.current = null;
      handle.classList.remove("is-visible", "is-dragging");
    };

    const endDrag = (e: PointerEvent) => {
      if (!drag || e.pointerId !== drag.pointerId) return;
      const current = drag;
      drag = null;
      handle.classList.remove("is-dragging");
      try {
        handle.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      if (!current.moved) {
        // Click + again: turn off expand mode (remove blue column line)
        clearExpandMode();
        return;
      }
      // Width-only change — A4 reflow would incorrectly push rows to the next page
      handleEditorInputWrapper({ skipPagination: true });
      requestAnimationFrame(syncHandle);
    };

    // Click outside editor/table: clear blue selection — but keep it for toolbar / Insert Table
    const onDocPointerDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (handle.contains(t)) return;
      const el = t as HTMLElement;
      if (
        el.closest?.(
          "[data-notes-toolbar], .ant-popover, .ant-popover-content, .ant-popover-inner, .ant-message, .notes-excel-fill-handle"
        )
      ) {
        return;
      }
      const editor = editorRef.current;
      if (editor && editor.contains(t)) {
        if (!el.closest?.("td, th, table")) {
          clearExpandMode();
        }
        return;
      }
      if (selectionKindRef.current) {
        clearExpandMode();
      }
    };

    handle.addEventListener("pointerdown", onPointerDown);
    handle.addEventListener("pointermove", onPointerMove);
    handle.addEventListener("pointerup", endDrag);
    handle.addEventListener("pointercancel", endDrag);
    document.addEventListener("pointerdown", onDocPointerDown, true);
    window.addEventListener("scroll", syncHandle, true);
    window.addEventListener("resize", syncHandle);

    return () => {
      handle.removeEventListener("pointerdown", onPointerDown);
      handle.removeEventListener("pointermove", onPointerMove);
      handle.removeEventListener("pointerup", endDrag);
      handle.removeEventListener("pointercancel", endDrag);
      document.removeEventListener("pointerdown", onDocPointerDown, true);
      window.removeEventListener("scroll", syncHandle, true);
      window.removeEventListener("resize", syncHandle);
      handle.remove();
    };
  }, [saveUndoSnapshot, handleEditorInputWrapper, editorRef]);

  /** When a table is already selected, grow it by N rows + M columns (do not nest a new table). */
  const expandExistingTable = (table: HTMLTableElement, addRows: number, addCols: number) => {
    const headerRow =
      (table.querySelector("thead tr") as HTMLTableRowElement | null) || table.rows[0];
    const isFirstColSl =
      headerRow?.cells[0]?.classList.contains("excel-sl-col") ||
      headerRow?.cells[0]?.textContent?.trim() === "SL";
    const tbody = table.querySelector("tbody") || table;
    let insertAfter: HTMLTableRowElement | null = getSelectedRowTr(table);

    const rowsToAdd = Math.max(0, Math.min(50, addRows));
    const colsToAdd = Math.max(0, Math.min(50, addCols));

    for (let n = 0; n < colsToAdd; n++) {
      Array.from(table.rows).forEach((row) => {
        const isHeader = row === headerRow || row.parentElement?.tagName === "THEAD";
        if (isHeader) {
          const th = document.createElement("th");
          th.setAttribute("contenteditable", "false");
          th.style.setProperty("min-width", "120px", "important");
          th.textContent = "·";
          row.appendChild(th);
        } else {
          const td = document.createElement("td");
          td.setAttribute("contenteditable", "true");
          td.style.setProperty("min-width", "120px", "important");
          td.innerHTML = "&nbsp;";
          row.appendChild(td);
        }
      });
    }

    const colsCount = table.rows[0]?.cells.length || 1;
    const headerCells = headerRow ? Array.from(headerRow.cells) : [];
    for (let n = 0; n < rowsToAdd; n++) {
      const newRow = document.createElement("tr");
      for (let i = 0; i < colsCount; i++) {
        const td = document.createElement("td");
        const isAttachmentCol =
          headerCells[i]?.classList.contains("excel-attachment-col") ||
          headerCells[i]?.getAttribute("data-col-type") === "attachment";
        if (i === 0 && isFirstColSl) {
          td.setAttribute("contenteditable", "false");
          td.className = "excel-sl-col";
          td.setAttribute("title", "Click to select this row");
          td.textContent = "0";
        } else if (isAttachmentCol) {
          td.setAttribute("contenteditable", "false");
          td.className = "excel-attachment-cell";
          td.setAttribute("data-col-type", "attachment");
          td.innerHTML = ROW_ATTACH_BTN_HTML;
        } else {
          td.setAttribute("contenteditable", "true");
          td.style.setProperty("min-width", "120px", "important");
          td.innerHTML = "&nbsp;";
        }
        newRow.appendChild(td);
      }
      if (insertAfter?.parentElement) {
        insertAfter.parentElement.insertBefore(newRow, insertAfter.nextSibling);
        insertAfter = newRow;
      } else {
        tbody.appendChild(newRow);
        insertAfter = newRow;
      }
    }

    updateTableHeadersAndSl(table);
    ensureEditorTableHorizontalScroll(table);
    clearTableSelection(table);
    handleEditorInputWrapper({ skipPagination: true });
  };

  /** Expand only when the user is clearly inside / selecting a table — not when caret is below it */
  const getTableToExpand = (): HTMLTableElement | null => {
    const editor = editorRef.current;
    if (!editor) return null;

    if (
      selectionKindRef.current === "row" ||
      selectionKindRef.current === "column" ||
      selectionKindRef.current === "cell" ||
      selectionKindRef.current === "table"
    ) {
      const t = getTargetTable();
      if (t && editor.contains(t)) return t;
    }

    const caret = savedCaretRangeRef.current;
    if (caret && editor.contains(caret.commonAncestorContainer)) {
      const el =
        caret.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
          ? (caret.commonAncestorContainer as HTMLElement)
          : caret.commonAncestorContainer.parentElement;
      const table = el?.closest("table") as HTMLTableElement | null;
      if (table && editor.contains(table)) return table;
    }

    const anchor = savedInsertAnchorRef.current;
    if (anchor && editor.contains(anchor)) {
      if (anchor.closest(".note-table-scroll") && !anchor.closest("td, th")) {
        // Clicked the table chrome / scrollbar area — treat as "after this table", not expand
        return null;
      }
      const table = anchor.closest("table") as HTMLTableElement | null;
      if (table && editor.contains(table)) return table;
    }
    return null;
  };

  // Insert standard table with Excel headers: SL, A, B, C... at the saved caret
  // If a table row/cell is selected → add that many rows & cols to the existing table instead.
  const handleInsertTable = (numRows: number, numCols: number) => {
    const editor = editorRef.current;
    if (!editor) return;
    saveUndoSnapshot();

    const existingTable = getTableToExpand();
    if (existingTable) {
      expandExistingTable(existingTable, numRows, numCols);
      setIsTableDropdownOpen(false);
      message.success(
        `Added ${numRows} row${numRows === 1 ? "" : "s"} and ${numCols} column${
          numCols === 1 ? "" : "s"
        } to the selected table`
      );
      return;
    }

    // Restore caret from before the toolbar/popover stole focus
    let caret = savedCaretRangeRef.current;
    if (caret && !editor.contains(caret.commonAncestorContainer)) {
      caret = null;
      savedCaretRangeRef.current = null;
    }

    const snaps = snapshotNoteScroll(editor);
    editor.focus({ preventScroll: true });
    const sel = window.getSelection();
    if (caret && sel) {
      try {
        sel.removeAllRanges();
        sel.addRange(caret);
      } catch {
        /* ignore */
      }
    }
    restoreNoteScroll(snaps);

    const liveRange =
      sel && sel.rangeCount > 0 && editor.contains(sel.getRangeAt(0).commonAncestorContainer)
        ? sel.getRangeAt(0).cloneRange()
        : caret;

    const rangeAnchorEl = liveRange
      ? liveRange.commonAncestorContainer.nodeType === Node.ELEMENT_NODE
        ? (liveRange.commonAncestorContainer as HTMLElement)
        : liveRange.commonAncestorContainer.parentElement
      : null;

    const clickAnchor =
      savedInsertAnchorRef.current && editor.contains(savedInsertAnchorRef.current)
        ? savedInsertAnchorRef.current
        : null;

    let page =
      (clickAnchor?.closest(".page") as HTMLElement | null) ||
      (rangeAnchorEl?.closest(".page") as HTMLElement | null) ||
      (editor.querySelector(":scope > .page") as HTMLElement | null);

    if (!page || !editor.contains(page)) {
      page = document.createElement("div");
      page.className = "page";
      page.setAttribute("data-page", "1");
      editor.appendChild(page);
    }

    const wrap = document.createElement("div");
    wrap.className = "note-table-scroll";
    wrap.setAttribute("contenteditable", "false");
    wrap.tabIndex = -1;

    const inner = document.createElement("div");
    inner.className = "note-table-scroll-inner";
    inner.setAttribute("contenteditable", "true");

    const host = document.createElement("div");
    host.className = "note-inserted-table";
    host.setAttribute(
      "style",
      "display:block;width:max-content;min-width:100%;max-width:none;clear:both;margin:0.5em 0;"
    );

    const table = document.createElement("table");
    table.className = "note-editor-table note-wide-table";
    table.setAttribute(
      "style",
      "width:max-content;min-width:100%;max-width:none;table-layout:auto;display:table;clear:both;"
    );

    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (let c = 0; c < numCols; c++) {
      const isSlCol = numCols > 1 && c === 0;
      const colName = getColLabel(c, numCols);
      const th = document.createElement("th");
      th.setAttribute("contenteditable", "false");
      if (isSlCol) th.className = "excel-sl-col";
      else th.style.setProperty("min-width", "120px", "important");
      th.title = isSlCol
        ? "Click to select entire table"
        : `Column ${colName} (Click to select column)`;
      th.textContent = colName;
      headRow.appendChild(th);
    }
    thead.appendChild(headRow);
    table.appendChild(thead);

    const tbody = document.createElement("tbody");
    for (let r = 0; r < numRows; r++) {
      const tr = document.createElement("tr");
      for (let c = 0; c < numCols; c++) {
        const isSlCol = numCols > 1 && c === 0;
        const td = document.createElement("td");
        if (isSlCol) {
          td.setAttribute("contenteditable", "false");
          td.className = "excel-sl-col";
          td.title = "Click to select this row";
          td.textContent = String(r + 1);
        } else {
          td.setAttribute("contenteditable", "true");
          td.style.setProperty("min-width", "120px", "important");
          td.innerHTML = "&nbsp;";
        }
        tr.appendChild(td);
      }
      tbody.appendChild(tr);
    }
    table.appendChild(tbody);

    host.appendChild(table);
    inner.appendChild(host);
    wrap.appendChild(inner);

    const spacerBefore = document.createElement("p");
    spacerBefore.innerHTML = "<br>";
    const spacerAfter = document.createElement("p");
    spacerAfter.innerHTML = "<br>";

    const placeAfter = (node: Node) => {
      const parent = node.parentNode;
      if (!parent) return false;
      const next = node.nextSibling;
      parent.insertBefore(spacerBefore, next);
      parent.insertBefore(wrap, spacerBefore.nextSibling);
      parent.insertBefore(spacerAfter, wrap.nextSibling);
      return true;
    };

    const placeBefore = (node: Node) => {
      const parent = node.parentNode;
      if (!parent) return false;
      parent.insertBefore(spacerBefore, node);
      parent.insertBefore(wrap, spacerBefore.nextSibling);
      parent.insertBefore(spacerAfter, wrap.nextSibling);
      return true;
    };

    const insertByClickY = () => {
      const clickY = savedInsertClientYRef.current;
      if (typeof clickY !== "number") return false;
      const candidates = Array.from(
        page.querySelectorAll(
          ":scope > .note-table-scroll, :scope > .note-inserted-table, :scope > p, :scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > div, :scope > ul, :scope > ol, :scope > blockquote"
        )
      ) as HTMLElement[];
      let best: HTMLElement | null = null;
      let bestDist = Infinity;
      for (const el of candidates) {
        const rect = el.getBoundingClientRect();
        if (rect.bottom <= clickY + 4) {
          const dist = clickY - rect.bottom;
          if (dist < bestDist) {
            bestDist = dist;
            best = el;
          }
        }
      }
      if (!best || bestDist > 160) return false;
      if (!placeAfter(best)) return false;
      const next = spacerAfter.nextElementSibling as HTMLElement | null;
      if (
        next &&
        next.tagName === "P" &&
        !(next.textContent || "").trim() &&
        !next.querySelector("img, table")
      ) {
        next.remove();
      }
      return true;
    };

    const insertAtCaret = () => {
      // 1) Clicked on / beside an existing table chrome → insert right after that table
      const scrollFromClick = clickAnchor?.closest?.(
        ".note-table-scroll, .note-inserted-table"
      ) as HTMLElement | null;
      if (scrollFromClick && page.contains(scrollFromClick) && !clickAnchor?.closest?.("td, th")) {
        const host =
          (scrollFromClick.classList.contains("note-table-scroll")
            ? scrollFromClick
            : scrollFromClick.closest(".note-table-scroll")) || scrollFromClick;
        if (placeAfter(host)) return;
      }

      // 2) Empty paragraph at click/caret → table replaces that spot
      const blockFromClick =
        (clickAnchor?.closest?.("p, h1, h2, h3, h4, li, blockquote, pre") as HTMLElement | null) ||
        null;
      if (
        blockFromClick &&
        page.contains(blockFromClick) &&
        !blockFromClick.closest("table") &&
        !blockFromClick.classList.contains("page")
      ) {
        const empty = !(blockFromClick.textContent || "").trim();
        if (empty) {
          if (placeBefore(blockFromClick)) {
            blockFromClick.remove();
            return;
          }
        }
      }

      const block =
        (rangeAnchorEl?.closest("p, h1, h2, h3, h4, li, blockquote, pre") as HTMLElement | null) ||
        blockFromClick;

      const inTextBlock =
        Boolean(block) &&
        page.contains(block!) &&
        !block!.classList.contains("page") &&
        block !== page &&
        !block!.closest("table") &&
        Boolean((block!.textContent || "").trim());

      // 3) Non-empty text block → split / before / after at caret
      if (liveRange && inTextBlock && block) {
        const atStart =
          liveRange.startOffset === 0 &&
          (liveRange.startContainer === block ||
            (liveRange.startContainer.nodeType === Node.TEXT_NODE &&
              liveRange.startContainer === block.firstChild));
        const atEnd = (() => {
          try {
            const endCheck = document.createRange();
            endCheck.selectNodeContents(block);
            endCheck.setStart(liveRange.startContainer, liveRange.startOffset);
            return !(endCheck.toString() || "").trim();
          } catch {
            return false;
          }
        })();

        if (atStart) {
          placeBefore(block);
          return;
        }
        if (atEnd) {
          placeAfter(block);
          return;
        }

        const afterRange = document.createRange();
        afterRange.selectNodeContents(block);
        afterRange.setStart(liveRange.startContainer, liveRange.startOffset);
        const trailing = afterRange.extractContents();
        const afterBlock = block.cloneNode(false) as HTMLElement;
        afterBlock.appendChild(trailing);
        if (!(afterBlock.textContent || "").trim() && !afterBlock.querySelector("img, br, table")) {
          afterBlock.innerHTML = "<br>";
        }
        if (!(block.textContent || "").trim() && !block.querySelector("img, br, table")) {
          block.innerHTML = "<br>";
        }
        placeAfter(block);
        spacerAfter.after(afterBlock);
        return;
      }

      // 4) Empty block at caret
      if (block && page.contains(block) && !(block.textContent || "").trim() && !block.closest("table")) {
        if (placeBefore(block)) {
          block.remove();
          return;
        }
      }

      // 5) Whitespace click under a table (page gap) — use click Y
      if (
        !inTextBlock &&
        (clickAnchor?.classList.contains("page") ||
          clickAnchor === page ||
          !clickAnchor ||
          clickAnchor === editor)
      ) {
        if (insertByClickY()) return;
      }

      // 6) Caret is a child-index into .page
      if (
        liveRange &&
        (liveRange.startContainer === page || liveRange.startContainer === editor)
      ) {
        const container = liveRange.startContainer as Node;
        const ref = container.childNodes[liveRange.startOffset] as ChildNode | undefined;
        if (ref) {
          placeBefore(ref);
          return;
        }
        container.appendChild(spacerBefore);
        container.appendChild(wrap);
        container.appendChild(spacerAfter);
        return;
      }

      if (insertByClickY()) return;

      if (liveRange && page.contains(liveRange.commonAncestorContainer)) {
        try {
          const r = liveRange.cloneRange();
          r.collapse(true);
          const frag = document.createDocumentFragment();
          frag.appendChild(spacerBefore);
          frag.appendChild(wrap);
          frag.appendChild(spacerAfter);
          r.insertNode(frag);
          return;
        } catch {
          /* fall through */
        }
      }

      const lastScroll = page.querySelector(
        ":scope > .note-table-scroll:last-of-type, :scope > .note-inserted-table:last-of-type"
      );
      if (lastScroll) {
        placeAfter(lastScroll);
        return;
      }
      page.appendChild(spacerBefore);
      page.appendChild(wrap);
      page.appendChild(spacerAfter);
    };

    insertAtCaret();

    ensureEditorTableHorizontalScroll(table);
    lastActiveCellRef.current =
      (table.querySelector(
        'td[contenteditable="true"]:not(.excel-sl-col)'
      ) as HTMLTableCellElement | null) || null;

    // Place caret in the paragraph after the new table
    try {
      const afterSel = window.getSelection();
      const afterRange = document.createRange();
      afterRange.selectNodeContents(spacerAfter);
      afterRange.collapse(true);
      afterSel?.removeAllRanges();
      afterSel?.addRange(afterRange);
      savedCaretRangeRef.current = afterRange.cloneRange();
    } catch {
      /* ignore */
    }

    restoreNoteScroll(snaps);
    handleEditorInputWrapper({ skipPagination: true });
    setIsTableDropdownOpen(false);
    message.success(`Inserted ${numRows}×${numCols} table (Excel style)`);
  };

  /** Resolve data-row target — same idea as Del Col: only the selected row */
  const getSelectedRowTr = (table: HTMLTableElement): HTMLTableRowElement | null => {
    const headerRow =
      (table.querySelector("thead tr") as HTMLTableRowElement | null) || table.rows[0] || null;
    const isDataRow = (tr: HTMLTableRowElement | null): tr is HTMLTableRowElement =>
      Boolean(
        tr &&
          document.contains(tr) &&
          table.contains(tr) &&
          tr !== headerRow &&
          tr.parentElement?.tagName !== "THEAD"
      );

    // Column selection is for Del Col only
    if (selectionKindRef.current === "column") return null;

    if (selectionKindRef.current === "row") {
      const cell = selectedCellsRef.current.find(
        (c) => document.contains(c) && c.closest("table") === table
      );
      const tr = cell?.closest("tr") as HTMLTableRowElement | null;
      if (isDataRow(tr)) return tr;
    }

    // Toolbar click may clear visuals — still honor last clicked SL row
    if (isDataRow(lastSelectedRowRef.current) && table.contains(lastSelectedRowRef.current)) {
      return lastSelectedRowRef.current;
    }

    const fromSelection =
      selectedCellsRef.current.find((c) => {
        if (!document.contains(c) || c.closest("table") !== table) return false;
        return isDataRow(c.closest("tr") as HTMLTableRowElement | null);
      }) || null;
    if (fromSelection) {
      return fromSelection.closest("tr") as HTMLTableRowElement;
    }

    const currentCell = lastActiveCellRef.current;
    if (currentCell && currentCell.closest("table") === table) {
      const tr = currentCell.closest("tr") as HTMLTableRowElement | null;
      if (isDataRow(tr)) return tr;
    }
    return null;
  };

  const removeTableIfEmpty = (table: HTMLTableElement) => {
    if (table.rows.length > 0 && (table.rows[0]?.cells.length || 0) > 0) return false;
    const wrapper =
      (table.closest(".note-table-scroll") as HTMLElement | null) ||
      (table.closest(".note-inserted-table") as HTMLElement | null) ||
      table;
    wrapper.remove();
    clearTableSelection();
    lastActiveCellRef.current = null;
    return true;
  };

  /** Resolve column index — never from a row selection (row starts on SL and would wipe SL) */
  const getSelectedColIndex = (table: HTMLTableElement): number => {
    if (selectionKindRef.current === "row" || selectionKindRef.current === "table") {
      return -1;
    }

    if (selectionKindRef.current === "column") {
      const fromSelection =
        selectedCellsRef.current.find((c) => document.contains(c) && c.closest("table") === table) ||
        null;
      if (fromSelection) return fromSelection.cellIndex;
      if (
        lastSelectedColIndexRef.current >= 0 &&
        lastSelectedColIndexRef.current < (table.rows[0]?.cells.length || 0)
      ) {
        return lastSelectedColIndexRef.current;
      }
      return -1;
    }

    const fromSelection =
      selectedCellsRef.current.find((c) => document.contains(c) && c.closest("table") === table) ||
      null;
    if (fromSelection && !fromSelection.classList.contains("excel-sl-col")) {
      return fromSelection.cellIndex;
    }
    const currentCell = lastActiveCellRef.current;
    if (
      currentCell &&
      currentCell.closest("table") === table &&
      !currentCell.classList.contains("excel-sl-col")
    ) {
      return currentCell.cellIndex;
    }
    if (
      lastSelectedColIndexRef.current >= 0 &&
      lastSelectedColIndexRef.current < (table.rows[0]?.cells.length || 0)
    ) {
      return lastSelectedColIndexRef.current;
    }
    return -1;
  };

  // Table Row & Column Manipulation Actions (Exact Excel/Word: Above, Below, Before, After)
  const handleInsertRow = (position: "above" | "below" = "below") => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Click inside a table first to add a row");
      return;
    }
    const targetTr = getSelectedRowTr(table);
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
        td.setAttribute("title", "Click to select this row");
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
    ensureEditorTableHorizontalScroll(table);
    clearTableSelection(table);
    const targetCell =
      (newRow.querySelector(
        'td[contenteditable="true"]:not(.excel-sl-col):not(.excel-attachment-cell)'
      ) as HTMLTableCellElement | null) ||
      newRow.cells[1] ||
      newRow.cells[0];
    focusEditableCell(targetCell);
    // Structural edits must not reflow A4 (that was cloning headers and freezing the page)
    handleEditorInputWrapper({ skipPagination: true });
    message.success(position === "above" ? "Row inserted above" : "Row inserted below");
  };

  const handleDeleteRow = () => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Select a row (click its number) first, then Del Row");
      return;
    }

    // Same as Del Col: remove only the selected unit — this one data row
    const headerRow =
      (table.querySelector("thead tr") as HTMLTableRowElement | null) || table.rows[0];
    const tr = getSelectedRowTr(table);
    if (!tr || !table.contains(tr) || tr === headerRow) {
      message.warning("Select a row first (click 1 / 2 / 3…), then Del Row");
      return;
    }

    const fallback =
      (tr.nextElementSibling as HTMLTableRowElement | null) ||
      (tr.previousElementSibling as HTMLTableRowElement | null);

    tr.remove();
    lastSelectedRowRef.current = null;
    // Keep SL column; only renumber remaining rows
    updateTableHeadersAndSl(table);
    ensureEditorTableHorizontalScroll(table);

    if (fallback && fallback !== headerRow && document.contains(fallback)) {
      clearTableSelection(table);
      const cell =
        (fallback.querySelector(
          'td[contenteditable="true"]:not(.excel-sl-col):not(.excel-attachment-cell)'
        ) as HTMLTableCellElement | null) ||
        fallback.cells[1] ||
        fallback.cells[0];
      focusEditableCell(cell);
    } else {
      clearTableSelection(table);
      lastActiveCellRef.current = null;
    }
    handleEditorInputWrapper({ skipPagination: true });
    message.success("Selected row deleted");
  };

  const handleInsertColumn = (position: "before" | "after" = "after") => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Click inside a table first to add a column");
      return;
    }
    const rawColIndex = getSelectedColIndex(table);
    const totalCols = table.rows[0]?.cells.length || 0;
    const targetIndex = rawColIndex >= 0 ? rawColIndex : Math.max(0, totalCols - 1);

    const rows = Array.from(table.rows);
    const insertIndex = position === "before" ? Math.max(0, targetIndex) : targetIndex + 1;
    const isFirstColSl = table.rows[0]?.cells[0]?.textContent?.trim() === "SL";

    rows.forEach((row, rIdx) => {
      if (rIdx === 0 && row.parentElement?.tagName === "THEAD") {
        const th = document.createElement("th");
        th.setAttribute("contenteditable", "false");
        th.style.setProperty("min-width", "120px", "important");
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
        td.style.setProperty("min-width", "120px", "important");
        td.innerHTML = "&nbsp;";
        if (insertIndex < row.cells.length) {
          row.insertBefore(td, row.cells[insertIndex]);
        } else {
          row.appendChild(td);
        }
      }
    });

    updateTableHeadersAndSl(table);
    ensureEditorTableHorizontalScroll(table);
    selectTableColumn(table, Math.min(insertIndex, (table.rows[0]?.cells.length || 1) - 1));
    handleEditorInputWrapper({ skipPagination: true });
    message.success(position === "before" ? "Column inserted before" : "Column inserted after");
  };

  const handleDeleteColumn = () => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Select a column first to delete it");
      return;
    }

    // Row selected → delete that row (same as Del Row), never the SL column
    if (selectionKindRef.current === "row") {
      handleDeleteRow();
      return;
    }

    const targetIndex = getSelectedColIndex(table);
    if (targetIndex < 0) {
      message.warning("Select a column first (click A/B/C… header), then Del Col");
      return;
    }

    const firstCell = table.rows[0]?.cells[0];
    const isFirstColSl =
      firstCell?.classList.contains("excel-sl-col") || firstCell?.textContent?.trim() === "SL";
    if (isFirstColSl && targetIndex === 0) {
      message.warning("SL column stays — select A/B/C… to delete a data column");
      return;
    }

    const rows = Array.from(table.rows);
    rows.forEach((row) => {
      if (row.cells[targetIndex]) {
        row.deleteCell(targetIndex);
      }
    });
    lastSelectedColIndexRef.current = -1;

    if (removeTableIfEmpty(table)) {
      handleEditorInputWrapper({ skipPagination: true });
      message.success("Column deleted");
      return;
    }

    updateTableHeadersAndSl(table);
    ensureEditorTableHorizontalScroll(table);
    const remaining = table.rows[0]?.cells.length || 0;
    if (remaining > 0) {
      const nextCol = Math.min(targetIndex, remaining - 1);
      selectTableColumn(
        table,
        isFirstColSl && nextCol === 0 && remaining > 1 ? 1 : nextCol
      );
    } else {
      clearTableSelection(table);
      lastActiveCellRef.current = null;
    }
    handleEditorInputWrapper({ skipPagination: true });
    message.success("Selected column deleted");
  };

  const handleAddAttachmentColumn = () => {
    saveUndoSnapshot();
    const table = getTargetTable();
    if (!table) {
      message.warning("Click inside a table first to add an attachment column");
      return;
    }

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
    ensureEditorTableHorizontalScroll(table);
    clearSelectionVisuals(table);
    handleEditorInputWrapper({ skipPagination: true });
    setIsTableDropdownOpen(false);
    message.success("Attachment column added to table");
  };

  const handleRowFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const cell = activeRowUploadCellRef.current;
    if (!file || !cell) return;

    saveUndoSnapshot();

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
      // Upload to MinIO only — row badge keeps the key; do not list under Files & Attachments
      const res = await dispatch(
        uploadDirectNoteFiles({
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

      const container = cell.querySelector<HTMLElement>(".row-attach-container");
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

      const newHtml = editorRef.current ? editorRef.current.innerHTML : "";
      setFormData((prev) => {
        const alreadyListed = (prev.attachmentKeys || []).includes(fileKey);
        return {
          ...prev,
          description: newHtml || prev.description,
          // Also list under Files & Attachments (file upload section)
          attachmentKeys: alreadyListed
            ? prev.attachmentKeys
            : [...(prev.attachmentKeys || []), fileKey],
          attachments: alreadyListed
            ? prev.attachments
            : [
                ...(prev.attachments || []),
                {
                  key: fileKey,
                  fileKey,
                  name: fileName,
                  fileName,
                  size: file.size,
                  file,
                },
              ],
        };
      });

      handleEditorInputWrapper();
      message.success(`Attached "${fileName}" to row and Files & Attachments`);
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

  const handleApplyFillColor = (color: string, mode: "bg" | "text" = "bg") => {
    const selected = selectedCellsRef.current.filter((c) => document.contains(c));
    const activeCell =
      lastActiveCellRef.current && document.contains(lastActiveCellRef.current)
        ? lastActiveCellRef.current
        : null;
    const cellsToColor = selected.length > 0 ? selected : activeCell ? [activeCell] : [];
    if (!cellsToColor.length) {
      message.warning("Select a table cell, row, or column first");
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
      } else if (isClear) {
        el.style.removeProperty("color");
      } else {
        el.style.setProperty("color", color, "important");
      }
    };

    cellsToColor.forEach((c) => applyToElement(c));
    const table = cellsToColor[0]?.closest("table");
    if (table) clearSelectionVisuals(table);
    message.success(
      isClear
        ? "Color cleared"
        : `${cellsToColor.length > 1 ? `${cellsToColor.length} cells` : "Cell"} ${
            mode === "bg" ? "fill" : "text"
          } applied`
    );

    // Style-only change — A4 reflow would incorrectly push table rows to the next page
    handleEditorInputWrapper({ skipPagination: true });
  };

  const openTableDropdown = (open: boolean) => {
    if (open) captureEditorCaret();
    setIsTableDropdownOpen(open);
  };

  return {
    isTableDropdownOpen,
    setIsTableDropdownOpen: openTableDropdown,
    hoverGrid,
    setHoverGrid,
    customRows,
    setCustomRows,
    customCols,
    setCustomCols,
    fillMode,
    setFillMode,
    lastActiveCellRef,
    selectedCellsRef,
    rowAttachmentInputRef,
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
  };
};
