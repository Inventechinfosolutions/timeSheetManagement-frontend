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
  }, [editorRef, onDownloadAttachment, onPreviewAttachment]);

  // Insert standard table with Excel headers: SL, A, B, C...
  const handleInsertTable = (numRows: number, numCols: number) => {
    if (!editorRef.current) return;
    editorRef.current.focus();

    let tableHtml = `<table><thead><tr>`;
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

    const cellsToColor =
      selectedCellsRef.current.length > 0
        ? selectedCellsRef.current.filter((c) => table.contains(c))
        : [cell];

    cellsToColor.forEach((c) => applyToElement(c));
    clearSelectionVisuals(table);
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
