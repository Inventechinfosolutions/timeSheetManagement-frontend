import { ROW_ATTACH_HEADER_HTML } from "./noteEditorAttachmentHelpers";

/**
 * Excel column label generator:
 * 0 -> "SL", 1 -> "A", 2 -> "B", 3 -> "C"...
 */
export const getColLabel = (colIdx: number, total: number): string => {
  if (total > 1) {
    if (colIdx === 0) return "SL";
    return String.fromCharCode(65 + ((colIdx - 1) % 26));
  }
  return "A";
};

/**
 * Clears visual selection outlines from table cells
 */
export const clearSelectionVisuals = (
  table?: HTMLElement | null,
  fallbackTarget?: HTMLElement | null
) => {
  const target = table || fallbackTarget;
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

/**
 * Visual selection styling (Excel-style: ONLY outer border box, NO in-between lines!)
 */
export const applySelectionVisuals = (
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

/**
 * Re-sync column headers (A, B, C...) and row numbers (1, 2, 3...)
 */
export const updateTableHeadersAndSl = (table: HTMLTableElement) => {
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
