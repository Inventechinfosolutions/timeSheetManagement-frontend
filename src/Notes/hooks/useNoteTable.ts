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
} from "../utils/noteEditorTableHelpers";

interface UseNoteTableParams {
  editorRef: React.RefObject<HTMLDivElement>;
  setFormData: React.Dispatch<React.SetStateAction<NotesFormData>>;
  activeNote: Note | null;
  saveUndoSnapshot: () => void;
  handleEditorInputWrapper: () => void;
  onPreviewAttachment: (item: NoteDocumentItem) => void;
  onDownloadAttachment: (item: NoteDocumentItem) => void;
}

export const useNoteTable = ({
  editorRef,
  setFormData,
  activeNote,
  saveUndoSnapshot,
  handleEditorInputWrapper,
  onPreviewAttachment,
  onDownloadAttachment,
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
  const selectionKindRef = useRef<"row" | "column" | "cell" | null>(null);
  const syncExpandHandleRef = useRef<() => void>(() => {});

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

  // Click on table header (TH) to select entire column, or click SL cell to select entire row
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

      const isFirstColSl = table.rows[0]?.cells[0]?.textContent?.trim() === "SL";
      const alreadySelectedCol =
        selectionKindRef.current === "column" &&
        selectedCellsRef.current.some(
          (c) => document.contains(c) && c.closest("table") === table && c.cellIndex === cell.cellIndex
        );
      const alreadySelectedCell =
        selectionKindRef.current === "cell" &&
        selectedCellsRef.current.length === 1 &&
        selectedCellsRef.current[0] === cell;

      // Click on TH (column header) -> select column, or click again to turn expand mode off
      if (cell.tagName === "TH") {
        if (isFirstColSl && cell.cellIndex === 0) {
          clearTableSelection(table);
          return;
        }
        if (alreadySelectedCol) {
          clearTableSelection(table);
          return;
        }
        clearSelectionVisuals(table);
        const colIdx = cell.cellIndex;
        const colCells: HTMLTableCellElement[] = [];
        Array.from(table.rows).forEach((row) => {
          if (row.cells[colIdx]) {
            colCells.push(row.cells[colIdx] as HTMLTableCellElement);
          }
        });
        if (colCells.length > 0) {
          lastActiveCellRef.current = colCells[0];
          selectedCellsRef.current = colCells;
          applySelectionVisuals(colCells, "column");
          selectionKindRef.current = "column";
          syncExpandHandleRef.current();
        }
      }
      // Click on SL cell (1st col TD) -> select entire row's BODY cells only
      else if (cell.cellIndex === 0 && isFirstColSl) {
        if (selectionKindRef.current === "row") {
          clearTableSelection(table);
          return;
        }
        clearSelectionVisuals(table);
        const tr = cell.closest("tr");
        if (tr) {
          const bodyCells = (Array.from(tr.cells) as HTMLTableCellElement[]).filter(
            (c) => c.cellIndex !== 0
          );
          if (bodyCells.length > 0) {
            lastActiveCellRef.current = bodyCells[0];
            selectedCellsRef.current = bodyCells;
            applySelectionVisuals(bodyCells, "row");
            selectionKindRef.current = "row";
            syncExpandHandleRef.current();
          }
        }
      }
      // Click on normal cell -> select that cell; click same cell again to clear
      else {
        if (alreadySelectedCell) {
          clearTableSelection(table);
          return;
        }
        clearSelectionVisuals(table);
        lastActiveCellRef.current = cell;
        selectedCellsRef.current = [cell];
        applySelectionVisuals([cell], "cells");
        selectionKindRef.current = "cell";
        syncExpandHandleRef.current();
      }
    };

    editor.addEventListener("click", handleTableClick);
    return () => {
      editor.removeEventListener("click", handleTableClick);
    };
  }, [editorRef, onDownloadAttachment, onPreviewAttachment]);

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
          cell.style.setProperty("width", `${w}px`, "important");
          cell.style.setProperty("min-width", "0", "important");
          cell.style.removeProperty("max-width");
        });
      });
      table.style.setProperty("width", "100%", "important");
      table.style.setProperty("max-width", "100%", "important");
      table.style.setProperty("table-layout", "fixed", "important");
    };

    /** Resize only selected column; take/give space from neighbors so table stays on page. */
    const setSelectedColWidth = (
      table: HTMLTableElement,
      colIndex: number,
      startWidths: number[],
      targetWidth: number
    ) => {
      const header = table.rows[0]?.cells[colIndex];
      if (!header || isSl(header)) return;
      const widths = startWidths.map((w) => Math.round(w));
      const desired = Math.max(MIN, Math.round(targetWidth));
      let delta = desired - widths[colIndex];
      if (delta === 0) return;

      if (delta > 0) {
        for (let i = colIndex + 1; i < widths.length && delta > 0; i++) {
          if (isSl(table.rows[0]?.cells[i])) continue;
          const take = Math.min(delta, widths[i] - MIN);
          if (take > 0) {
            widths[i] -= take;
            widths[colIndex] += take;
            delta -= take;
          }
        }
        for (let i = colIndex - 1; i >= 0 && delta > 0; i--) {
          if (isSl(table.rows[0]?.cells[i])) continue;
          const take = Math.min(delta, widths[i] - MIN);
          if (take > 0) {
            widths[i] -= take;
            widths[colIndex] += take;
            delta -= take;
          }
        }
      } else {
        let give = -delta;
        widths[colIndex] = Math.max(MIN, widths[colIndex] - give);
        give = startWidths[colIndex] - widths[colIndex];
        const next = colIndex + 1;
        if (next < widths.length && !isSl(table.rows[0]?.cells[next])) {
          widths[next] += give;
        }
      }
      applyWidths(table, widths);
    };

    /** + expand only for a selected vertical column (header click) — never for single cell / row */
    const getExpandTarget = () => {
      if (selectionKindRef.current !== "column") return null;
      const cells = selectedCellsRef.current.filter(
        (c) => document.contains(c) && c.classList.contains("excel-cell-selected")
      );
      const table = cells[0]?.closest("table") as HTMLTableElement | null;
      if (!table || !cells.length) return null;
      const colIndex = cells[0].cellIndex;
      const header = table.rows[0]?.cells[colIndex] as HTMLTableCellElement | undefined;
      if (!header || isSl(header) || isSl(cells[0])) return null;
      return { table, colIndex, anchor: header };
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
      handleEditorInputWrapper();
      requestAnimationFrame(syncHandle);
    };

    // Click outside editor/table: clear blue selection
    const onDocPointerDown = (e: PointerEvent) => {
      const t = e.target as Node | null;
      if (!t) return;
      if (handle.contains(t)) return;
      const editor = editorRef.current;
      if (editor && editor.contains(t)) {
        const el = t as HTMLElement;
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

  // Insert standard table with Excel headers: SL, A, B, C...
  const handleInsertTable = (numRows: number, numCols: number) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHtml = `<table style="width:100%;max-width:100%;table-layout:fixed;"><thead><tr>`;
    for (let c = 0; c < numCols; c++) {
      const isSlCol = numCols > 1 && c === 0;
      const colName = getColLabel(c, numCols);
      tableHtml += `<th contenteditable="false" class="${
        isSlCol ? "excel-sl-col" : ""
      }" title="Column ${colName} (Click to select column)">${colName}</th>`;
    }
    tableHtml += `</tr></thead><tbody>`;

    for (let r = 0; r < numRows; r++) {
      tableHtml += `<tr>`;
      for (let c = 0; c < numCols; c++) {
        const isSlCol = numCols > 1 && c === 0;
        if (isSlCol) {
          tableHtml += `<td contenteditable="false" class="excel-sl-col" title="Row ${
            r + 1
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
      selectedCellsRef.current.length > 0 && selectedCellsRef.current[0]?.closest("table") === table
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

    const tbody = table.querySelector("tbody") || table;
    const rows = Array.from(tbody.querySelectorAll("tr")).filter(
      (r) => r.parentElement?.tagName !== "THEAD" && r !== headerRow
    );
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
      setFormData((prev) => ({
        ...prev,
        description: newHtml || prev.description,
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

    handleEditorInputWrapper();
  };

  return {
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
