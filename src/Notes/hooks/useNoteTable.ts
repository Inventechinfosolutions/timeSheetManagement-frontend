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
  const skipColumnClickRef = useRef(false);
  const selectionKindRef = useRef<"row" | "column" | null>(null);
  const fillHandleSyncRef = useRef<() => void>(() => {});

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
      if (skipColumnClickRef.current) return;
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

      // Click on TH (column header) -> select only body cells down the column
      if (cell.tagName === "TH") {
        if (isFirstColSl && cell.cellIndex === 0) {
          clearSelectionVisuals(table);
          selectedCellsRef.current = [];
          selectionKindRef.current = null;
          fillHandleSyncRef.current();
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
          fillHandleSyncRef.current();
        }
      }
      // Click on SL cell (1st col TD) -> select entire row's BODY cells only
      else if (cell.cellIndex === 0 && isFirstColSl) {
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
            fillHandleSyncRef.current();
          }
        }
      }
      // Click on normal cell -> clear visual selection outlines
      else {
        clearSelectionVisuals(table);
        lastActiveCellRef.current = cell;
        selectedCellsRef.current = [cell];
        selectionKindRef.current = null;
        fillHandleSyncRef.current();
      }
    };

    editor.addEventListener("click", handleTableClick);
    return () => {
      editor.removeEventListener("click", handleTableClick);
    };
  }, [editorRef, onDownloadAttachment, onPreviewAttachment]);

  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const EDGE = 10;
    let drag: {
      table: HTMLTableElement;
      colIndex: number;
      startX: number;
      startWidth: number;
      moved: boolean;
    } | null = null;

    const ensureColgroup = (table: HTMLTableElement) => {
      const colCount = table.rows[0]?.cells.length || 0;
      let colgroup = table.querySelector("colgroup");
      if (!colgroup) {
        colgroup = document.createElement("colgroup");
        table.insertBefore(colgroup, table.firstChild);
      }
      while (colgroup.children.length < colCount) {
        colgroup.appendChild(document.createElement("col"));
      }
      while (colgroup.children.length > colCount) {
        colgroup.lastElementChild?.remove();
      }
      return colgroup;
    };

    const getPageInnerWidth = (table: HTMLTableElement) => {
      const page = table.closest(".page") as HTMLElement | null;
      if (page) {
        const styles = window.getComputedStyle(page);
        return (
          page.clientWidth -
          (parseFloat(styles.paddingLeft) || 0) -
          (parseFloat(styles.paddingRight) || 0)
        );
      }
      return table.parentElement?.clientWidth || table.getBoundingClientRect().width;
    };

    const isLockedCol = (cell?: HTMLTableCellElement) =>
      Boolean(cell?.classList.contains("excel-sl-col"));

    const minWidthFor = (cell?: HTMLTableCellElement) => {
      if (!cell) return 48;
      if (cell.classList.contains("excel-sl-col")) return 44;
      if (cell.classList.contains("excel-attachment-col") || cell.classList.contains("excel-attachment-cell")) {
        return 120;
      }
      return 48;
    };

    const applyWidths = (table: HTMLTableElement, widths: number[]) => {
      const colgroup = ensureColgroup(table);
      const maxTableWidth = Math.max(120, Math.round(getPageInnerWidth(table)));
      const next = widths.map((w, i) =>
        Math.max(minWidthFor(table.rows[0]?.cells[i] as HTMLTableCellElement), Math.round(w))
      );
      next.forEach((width, index) => {
        const col = colgroup.children[index] as HTMLTableColElement | undefined;
        if (col) col.style.width = `${width}px`;
        Array.from(table.rows).forEach((row) => {
          const cell = row.cells[index] as HTMLTableCellElement | undefined;
          if (!cell) return;
          cell.style.setProperty("width", `${width}px`, "important");
          if (isLockedCol(cell)) {
            cell.style.setProperty("min-width", `${width}px`, "important");
            cell.style.setProperty("max-width", `${width}px`, "important");
          } else {
            cell.style.setProperty("min-width", "0", "important");
            cell.style.removeProperty("max-width");
          }
        });
      });
      const total = next.reduce((sum, w) => sum + w, 0);
      table.style.setProperty("width", `${Math.min(total, maxTableWidth)}px`, "important");
      table.style.setProperty("max-width", "100%", "important");
      table.style.setProperty("table-layout", "fixed", "important");
    };

    const currentWidths = (table: HTMLTableElement) =>
      Array.from(table.rows[0]?.cells || []).map((cell) =>
        Math.round((cell as HTMLTableCellElement).getBoundingClientRect().width)
      );

    const setColumnWidth = (table: HTMLTableElement, colIndex: number, width: number) => {
      const headerCell = table.rows[0]?.cells[colIndex] as HTMLTableCellElement | undefined;
      if (!headerCell || isLockedCol(headerCell)) return;
      const widths = currentWidths(table);
      const maxTableWidth = Math.max(120, Math.round(getPageInnerWidth(table)));
      const others = widths.reduce((sum, w, i) => (i === colIndex ? sum : sum + w), 0);
      const maxThis = Math.max(minWidthFor(headerCell), maxTableWidth - others);
      widths[colIndex] = Math.min(Math.max(minWidthFor(headerCell), Math.round(width)), maxThis);
      applyWidths(table, widths);
    };

    const snapshotColumnWidths = (table: HTMLTableElement) => {
      applyWidths(table, currentWidths(table));
    };

    const autoFitColumn = (table: HTMLTableElement, colIndex: number) => {
      const headerCell = table.rows[0]?.cells[colIndex];
      if (!headerCell || isLockedCol(headerCell)) return;
      let fitWidth = minWidthFor(headerCell);
      Array.from(table.rows).forEach((row) => {
        const cell = row.cells[colIndex] as HTMLTableCellElement | undefined;
        if (!cell) return;
        const probe = cell.cloneNode(true) as HTMLElement;
        probe.style.cssText =
          "position:absolute;visibility:hidden;height:auto;width:auto;min-width:0;max-width:none;white-space:normal;overflow-wrap:anywhere;";
        document.body.appendChild(probe);
        fitWidth = Math.max(fitWidth, Math.ceil(probe.getBoundingClientRect().width) + 16);
        probe.remove();
      });
      const maxTableWidth = getPageInnerWidth(table);
      const others = currentWidths(table).reduce(
        (sum, w, i) => (i === colIndex ? sum : sum + w),
        0
      );
      setColumnWidth(table, colIndex, Math.min(fitWidth, Math.max(48, maxTableWidth - others)));
    };

    const getResizeColumn = (e: MouseEvent) => {
      const cell = (e.target as HTMLElement | null)?.closest("th, td") as HTMLTableCellElement | null;
      if (!cell || !editor.contains(cell)) return null;
      const table = cell.closest("table");
      if (!table) return null;
      const headerRow = table.rows[0];
      const inHeader = cell.tagName === "TH" || cell.parentElement === headerRow;
      if (!inHeader) return null;
      const rect = cell.getBoundingClientRect();
      let colIndex = -1;
      if (rect.right - e.clientX <= EDGE) colIndex = cell.cellIndex;
      else if (e.clientX - rect.left <= EDGE) colIndex = cell.cellIndex - 1;
      if (colIndex < 0) return null;
      const headerCell = headerRow?.cells[colIndex];
      if (!headerCell || headerCell.classList.contains("excel-sl-col")) return null;
      return { table, colIndex };
    };

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return;
      const target = getResizeColumn(e);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      snapshotColumnWidths(target.table);
      drag = {
        ...target,
        startX: e.clientX,
        startWidth: Math.round(
          (target.table.rows[0]?.cells[target.colIndex] as HTMLTableCellElement).getBoundingClientRect().width
        ),
        moved: false,
      };
      skipColumnClickRef.current = true;
      editor.classList.add("notes-col-resizing");
      saveUndoSnapshot();
    };

    const onMouseMove = (e: MouseEvent) => {
      if (drag) {
        const delta = e.clientX - drag.startX;
        if (!drag.moved && Math.abs(delta) < 4) return;
        drag.moved = true;
        setColumnWidth(drag.table, drag.colIndex, drag.startWidth + delta);
        return;
      }
      editor.classList.toggle("notes-col-resize-hover", Boolean(getResizeColumn(e)));
    };

    const finishDrag = (e?: MouseEvent) => {
      if (!drag) return;
      const current = drag;
      drag = null;
      editor.classList.remove("notes-col-resizing");
      if (!current.moved) {
        autoFitColumn(current.table, current.colIndex);
      }
      handleEditorInputWrapper();
      window.setTimeout(() => {
        skipColumnClickRef.current = false;
      }, 0);
    };

    const onMouseUp = (e: MouseEvent) => finishDrag(e);

    const onDoubleClick = (e: MouseEvent) => {
      const target = getResizeColumn(e);
      if (!target) return;
      e.preventDefault();
      e.stopPropagation();
      skipColumnClickRef.current = true;
      snapshotColumnWidths(target.table);
      saveUndoSnapshot();
      autoFitColumn(target.table, target.colIndex);
      handleEditorInputWrapper();
      window.setTimeout(() => {
        skipColumnClickRef.current = false;
      }, 0);
    };

    editor.addEventListener("mousedown", onMouseDown, true);
    editor.addEventListener("mousemove", onMouseMove);
    editor.addEventListener("dblclick", onDoubleClick, true);
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
    return () => {
      editor.removeEventListener("mousedown", onMouseDown, true);
      editor.removeEventListener("mousemove", onMouseMove);
      editor.removeEventListener("dblclick", onDoubleClick, true);
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
      editor.classList.remove("notes-col-resizing", "notes-col-resize-hover");
    };
  }, [editorRef]);

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
      }" style="${isSlCol ? "width:44px;min-width:44px;max-width:44px;" : ""}" title="Column ${colName} (Click to select column)">${colName}</th>`;
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

  useEffect(() => {
    const handle = document.createElement("button");
    handle.type = "button";
    handle.className = "notes-excel-fill-handle";
    handle.textContent = "+";
    handle.title = "Click or drag to expand this column";
    handle.contentEditable = "false";
    document.body.appendChild(handle);

    const isSl = (cell?: Element | null) => Boolean(cell?.classList.contains("excel-sl-col"));

    const colWidths = (table: HTMLTableElement) =>
      Array.from(table.rows[0]?.cells || []).map((cell) =>
        Math.round((cell as HTMLTableCellElement).getBoundingClientRect().width)
      );

    const minDataWidth = 48;

    const applyAllWidths = (table: HTMLTableElement, widths: number[]) => {
      Array.from(table.rows).forEach((row) => {
        widths.forEach((width, index) => {
          const cell = row.cells[index] as HTMLTableCellElement | undefined;
          if (!cell) return;
          if (isSl(cell)) {
            cell.style.setProperty("width", "44px", "important");
            cell.style.setProperty("min-width", "44px", "important");
            cell.style.setProperty("max-width", "44px", "important");
            return;
          }
          cell.style.setProperty("width", `${width}px`, "important");
          cell.style.setProperty("min-width", "0", "important");
          cell.style.removeProperty("max-width");
        });
      });
      table.style.setProperty("width", "100%", "important");
      table.style.setProperty("max-width", "100%", "important");
      table.style.setProperty("table-layout", "fixed", "important");
    };

    const growColumn = (table: HTMLTableElement, colIndex: number, extra: number) => {
      const header = table.rows[0]?.cells[colIndex] as HTMLTableCellElement | undefined;
      if (!header || isSl(header) || extra === 0) return;
      const widths = colWidths(table);
      let need = Math.abs(extra);
      const growing = extra > 0;
      const order: number[] = [];
      for (let i = colIndex + 1; i < widths.length; i++) order.push(i);
      for (let i = colIndex - 1; i >= 0; i--) order.push(i);
      for (const i of order) {
        if (need <= 0) break;
        const cell = table.rows[0]?.cells[i] as HTMLTableCellElement | undefined;
        if (!cell || isSl(cell)) continue;
        if (growing) {
          const take = Math.min(need, widths[i] - minDataWidth);
          if (take > 0) {
            widths[i] -= take;
            widths[colIndex] += take;
            need -= take;
          }
        } else {
          const take = Math.min(need, widths[colIndex] - minDataWidth);
          if (take > 0) {
            widths[colIndex] -= take;
            widths[i] += take;
            need -= take;
          }
        }
      }
      applyAllWidths(table, widths);
    };

    const applyColWidth = (table: HTMLTableElement, colIndex: number, width: number) => {
      const current = colWidths(table)[colIndex] || 0;
      growColumn(table, colIndex, Math.round(width) - current);
    };

    const applyRowHeight = (row: HTMLTableRowElement, height: number) => {
      const next = Math.max(28, Math.round(height));
      Array.from(row.cells).forEach((cell) => {
        if (isSl(cell)) return;
        (cell as HTMLTableCellElement).style.setProperty("height", `${next}px`, "important");
      });
    };

    const syncFillHandle = () => {
      const kind = selectionKindRef.current;
      const cells = selectedCellsRef.current.filter(
        (cell) => document.contains(cell) && cell.classList.contains("excel-cell-selected")
      );
      const table = cells[0]?.closest("table");
      if (!kind || !table || !cells.length) {
        handle.classList.remove("is-visible");
        return;
      }
      if (kind === "column") {
        const header = table.rows[0]?.cells[cells[0].cellIndex] as HTMLTableCellElement | undefined;
        if (!header || isSl(header)) {
          handle.classList.remove("is-visible");
          return;
        }
        const rect = header.getBoundingClientRect();
        handle.style.left = `${rect.right}px`;
        handle.style.top = `${rect.top}px`;
        handle.classList.add("is-visible");
        return;
      }
      const first = cells[0].getBoundingClientRect();
      const last = cells[cells.length - 1].getBoundingClientRect();
      handle.style.left = `${(first.left + last.right) / 2}px`;
      handle.style.top = `${first.top}px`;
      handle.classList.add("is-visible");
    };

    fillHandleSyncRef.current = syncFillHandle;

    let sizeDrag: {
      kind: "row" | "column";
      table: HTMLTableElement;
      colIndex: number;
      row: HTMLTableRowElement | null;
      startX: number;
      startY: number;
      startSize: number;
      moved: boolean;
    } | null = null;

    const onHandleMouseDown = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const cells = selectedCellsRef.current.filter((c) => document.contains(c));
      const table = cells[0]?.closest("table");
      const kind = selectionKindRef.current;
      if (!table || !kind) return;
      const header = table.rows[0]?.cells[cells[0].cellIndex];
      if (kind === "column" && isSl(header)) return;
      skipColumnClickRef.current = true;
      saveUndoSnapshot();
      const row = cells[0].closest("tr");
      sizeDrag = {
        kind,
        table,
        colIndex: cells[0].cellIndex,
        row,
        startX: e.clientX,
        startY: e.clientY,
        startSize:
          kind === "column"
            ? header?.getBoundingClientRect().width || 80
            : row?.getBoundingClientRect().height || 32,
        moved: false,
      };
    };

    const onSizeMove = (e: MouseEvent) => {
      if (!sizeDrag) return;
      const dx = e.clientX - sizeDrag.startX;
      const dy = e.clientY - sizeDrag.startY;
      if (!sizeDrag.moved && Math.abs(dx) < 3 && Math.abs(dy) < 3) return;
      sizeDrag.moved = true;
      if (sizeDrag.kind === "column") {
        applyColWidth(sizeDrag.table, sizeDrag.colIndex, sizeDrag.startSize + dx);
      } else if (sizeDrag.row) {
        applyRowHeight(sizeDrag.row, sizeDrag.startSize + dy);
      }
      syncFillHandle();
    };

    const onSizeUp = () => {
      if (!sizeDrag) return;
      const current = sizeDrag;
      sizeDrag = null;
      if (!current.moved) {
        if (current.kind === "column") {
          growColumn(current.table, current.colIndex, 72);
        } else if (current.row) {
          applyRowHeight(current.row, current.startSize + 28);
        }
      }
      handleEditorInputWrapper();
      requestAnimationFrame(syncFillHandle);
      window.setTimeout(() => {
        skipColumnClickRef.current = false;
      }, 0);
    };

    const onHandleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    handle.addEventListener("mousedown", onHandleMouseDown);
    handle.addEventListener("click", onHandleClick);
    window.addEventListener("mousemove", onSizeMove);
    window.addEventListener("mouseup", onSizeUp);
    window.addEventListener("scroll", syncFillHandle, true);
    window.addEventListener("resize", syncFillHandle);

    return () => {
      handle.removeEventListener("mousedown", onHandleMouseDown);
      handle.removeEventListener("click", onHandleClick);
      window.removeEventListener("mousemove", onSizeMove);
      window.removeEventListener("mouseup", onSizeUp);
      window.removeEventListener("scroll", syncFillHandle, true);
      window.removeEventListener("resize", syncFillHandle);
      handle.remove();
    };
  }, []);

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
