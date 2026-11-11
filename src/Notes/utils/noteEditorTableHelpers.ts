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

export type NoteScrollSnap = { el: HTMLElement; left: number; top: number };

const isNoteScroller = (el: HTMLElement) =>
  el.classList.contains("note-table-scroll") ||
  el.classList.contains("page") ||
  el.classList.contains("note-editor-x-scroll") ||
  el.classList.contains("a4-page-workspace");

/** The real page scroller (main), not only the table's sideways box. */
const scrollsOnItsOwn = (el: HTMLElement) => {
  const style = getComputedStyle(el);
  const y = style.overflowY;
  const x = style.overflowX;
  const vertical = (y === "auto" || y === "scroll" || y === "overlay") && el.scrollHeight > el.clientHeight + 8;
  const horizontal = (x === "auto" || x === "scroll" || x === "overlay") && el.scrollWidth > el.clientWidth + 8;
  return vertical || horizontal;
};

/** Remember horizontal/vertical scroll of table hosts, pages, and the page scroller before an edit. */
export const snapshotNoteScroll = (root: ParentNode | null | undefined): NoteScrollSnap[] => {
  if (!root) return [];
  const found = new Map<HTMLElement, NoteScrollSnap>();
  const add = (el: HTMLElement) => {
    found.set(el, { el, left: el.scrollLeft, top: el.scrollTop });
  };
  if (root instanceof HTMLElement) {
    if (isNoteScroller(root) || scrollsOnItsOwn(root)) add(root);
    const main = root.closest("main");
    if (main instanceof HTMLElement) add(main);
    let parent = root.parentElement;
    while (parent) {
      if (isNoteScroller(parent) || scrollsOnItsOwn(parent)) add(parent);
      parent = parent.parentElement;
    }
  }
  const scrollingElement = document.scrollingElement;
  if (scrollingElement instanceof HTMLElement && scrollingElement.scrollTop > 0) {
    add(scrollingElement);
  }
  root.querySelectorAll<HTMLElement>(".note-table-scroll, .page, .note-editor-x-scroll").forEach(add);
  return Array.from(found.values());
};

/** Put table/page scroll back so typing or paste does not jump to column 1 / row 1. */
export const restoreNoteScroll = (snaps: NoteScrollSnap[]) => {
  snaps.forEach(({ el, left, top }) => {
    if (!el.isConnected) return;
    if (el.scrollLeft !== left) el.scrollLeft = left;
    if (el.scrollTop !== top) el.scrollTop = top;
  });
};

/** Mark Excel tables as wide and wrap them so extra columns scroll horizontally. */
/** Capture current rendered column widths (px). */
export const snapshotTableColumnWidths = (table: HTMLTableElement): number[] =>
  Array.from(table.rows[0]?.cells || []).map((c) =>
    Math.max(48, Math.round((c as HTMLTableCellElement).getBoundingClientRect().width))
  );

/**
 * Lock column widths so paste/typing content wraps inside the cell
 * instead of stretching the column. Manual + drag resize still updates these.
 */
export const applyLockedTableColumnWidths = (
  table: HTMLTableElement,
  widths: number[]
) => {
  if (!widths.length) return;
  Array.from(table.rows).forEach((row) => {
    widths.forEach((w, i) => {
      const cell = row.cells[i] as HTMLTableCellElement | undefined;
      if (!cell) return;
      if (cell.classList.contains("excel-sl-col")) {
        cell.style.setProperty("width", "44px", "important");
        cell.style.setProperty("min-width", "44px", "important");
        cell.style.setProperty("max-width", "44px", "important");
        return;
      }
      const px = Math.max(48, Math.round(w));
      cell.style.setProperty("width", `${px}px`, "important");
      cell.style.setProperty("min-width", `${px}px`, "important");
      cell.style.setProperty("max-width", `${px}px`, "important");
      cell.style.setProperty("overflow", "hidden", "important");
      cell.style.setProperty("white-space", "normal", "important");
      cell.style.setProperty("overflow-wrap", "anywhere", "important");
      cell.style.setProperty("word-break", "break-word", "important");
    });
  });
  const total = widths.reduce((sum, w) => sum + Math.max(48, Math.round(w)), 0);
  table.classList.add("note-editor-table", "note-wide-table");
  table.style.setProperty("width", `${total}px`, "important");
  table.style.setProperty("min-width", "100%", "important");
  table.style.setProperty("max-width", "none", "important");
  table.style.setProperty("table-layout", "fixed", "important");
};

/** Freeze whatever widths the table has right now (call before/after paste). */
export const lockCurrentTableColumnWidths = (table: HTMLTableElement | null) => {
  if (!table || !document.contains(table)) return;
  applyLockedTableColumnWidths(table, snapshotTableColumnWidths(table));
};

export const ensureEditorTableHorizontalScroll = (table: HTMLTableElement | null) => {
  if (!table || !document.contains(table)) return;

  table.classList.add("note-editor-table", "note-wide-table");

  // If columns were locked (paste) or manually resized, keep fixed layout
  const header = table.rows[0];
  const hasLockedCols = header
    ? Array.from(header.cells).some(
        (c) =>
          !c.classList.contains("excel-sl-col") &&
          Boolean((c as HTMLTableCellElement).style.maxWidth)
      )
    : false;

  if (hasLockedCols) {
    const widths = snapshotTableColumnWidths(table);
    applyLockedTableColumnWidths(table, widths);
  } else {
    table.style.removeProperty("width");
    table.style.removeProperty("min-width");
    table.style.removeProperty("max-width");
    table.style.setProperty("width", "max-content", "important");
    table.style.setProperty("min-width", "100%", "important");
    table.style.setProperty("max-width", "none", "important");
    table.style.setProperty("table-layout", "auto", "important");
  }

  const inserted = table.closest(".note-inserted-table") as HTMLElement | null;
  if (inserted) {
    inserted.style.setProperty("display", "block", "important");
    inserted.style.setProperty("width", "max-content", "important");
    inserted.style.setProperty("min-width", "100%", "important");
    inserted.style.setProperty("max-width", "none", "important");
    inserted.style.setProperty("clear", "both", "important");
  }

  Array.from(table.querySelectorAll<HTMLElement>("th, td")).forEach((cell) => {
    if (cell.classList.contains("excel-sl-col")) {
      cell.style.setProperty("min-width", "44px", "important");
      cell.style.setProperty("width", "44px", "important");
      cell.style.setProperty("max-width", "44px", "important");
      return;
    }
    if (
      cell.classList.contains("excel-attachment-col") ||
      cell.classList.contains("excel-attachment-cell")
    ) {
      cell.style.setProperty("min-width", "160px", "important");
      if (!cell.style.maxWidth) {
        cell.style.removeProperty("width");
        cell.style.removeProperty("max-width");
      }
      return;
    }
    // Preserve locked / manually resized columns — paste must not clear them
    if (cell.style.maxWidth) return;
    cell.style.setProperty("min-width", "120px", "important");
    cell.style.removeProperty("width");
    cell.style.removeProperty("max-width");
  });

  if (table.closest(".note-table-scroll")) return;

  const wrap = document.createElement("div");
  wrap.className = "note-table-scroll";
  wrap.setAttribute("contenteditable", "false");
  wrap.setAttribute("tabindex", "-1");

  const inner = document.createElement("div");
  inner.className = "note-table-scroll-inner";
  inner.setAttribute("contenteditable", "true");

  const host = table.closest(".note-inserted-table");
  if (host && host.parentNode) {
    host.parentNode.insertBefore(wrap, host);
    wrap.appendChild(inner);
    inner.appendChild(host);
    return;
  }

  table.parentNode?.insertBefore(wrap, table);
  wrap.appendChild(inner);
  inner.appendChild(table);
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
  const elements = target.querySelectorAll(
    ".excel-cell-selected, [style*='60a5fa'], [style*='rgb(96, 165, 250)']"
  );
  elements.forEach((el) => {
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
  type: "row" | "column" | "cells" | "table" = "cells"
) => {
  if (cells.length === 0) return;
  const table = cells[0].closest("table");
  clearSelectionVisuals(table);

  const borderColor = "#60a5fa"; // Soft selection blue

  if (type === "table" && table) {
    // Outer box around the whole table only
    const rows = Array.from(table.rows);
    const lastRowIdx = rows.length - 1;
    rows.forEach((row, rIdx) => {
      const cellsInRow = Array.from(row.cells) as HTMLTableCellElement[];
      const lastColIdx = cellsInRow.length - 1;
      cellsInRow.forEach((c, cIdx) => {
        c.classList.add("excel-cell-selected");
        if (rIdx === 0) {
          c.style.setProperty("border-top", `2px solid ${borderColor}`, "important");
        }
        if (rIdx === lastRowIdx) {
          c.style.setProperty("border-bottom", `2px solid ${borderColor}`, "important");
        }
        if (cIdx === 0) {
          c.style.setProperty("border-left", `2px solid ${borderColor}`, "important");
        }
        if (cIdx === lastColIdx) {
          c.style.setProperty("border-right", `2px solid ${borderColor}`, "important");
        }
        c.style.setProperty("z-index", "2", "important");
      });
    });
    return;
  }

  if (type === "row") {
    // ONLY outer border: Top and bottom across the row, left on first cell, right on last cell.
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
    // ONLY outer border: Left and right down the column, top on first cell, bottom on last cell.
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
  if (!table.rows.length) return;

  const firstHeader = table.rows[0]?.cells[0]?.textContent?.trim();
  let isFirstColSl =
    Boolean(table.rows[0]?.cells[0]?.classList.contains("excel-sl-col")) ||
    firstHeader === "SL";

  // Keep SL as the fixed row-index column if it was stripped
  if (
    !isFirstColSl &&
    (firstHeader === "A" || table.querySelector(".excel-attachment-cell, .excel-attachment-col"))
  ) {
    Array.from(table.rows).forEach((row, idx) => {
      if (idx === 0) {
        const th = document.createElement("th");
        th.setAttribute("contenteditable", "false");
        th.className = "excel-sl-col";
        th.textContent = "SL";
        th.setAttribute("title", "Click to select entire table");
        row.insertBefore(th, row.cells[0]);
      } else {
        const td = document.createElement("td");
        td.setAttribute("contenteditable", "false");
        td.className = "excel-sl-col";
        td.textContent = `${idx}`;
        td.setAttribute("title", "Click to select this row");
        row.insertBefore(td, row.cells[0]);
      }
    });
    isFirstColSl = true;
  }

  const headerRow = (table.querySelector("thead tr") as HTMLTableRowElement | null) || table.rows[0];
  if (headerRow) {
    let letterCounter = 0;
    (Array.from(headerRow.cells) as HTMLTableCellElement[]).forEach((th, idx) => {
      if (isFirstColSl && idx === 0) {
        th.textContent = "SL";
        th.className = "excel-sl-col";
        th.setAttribute("contenteditable", "false");
        th.setAttribute("title", "Click to select entire table");
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
      th.classList.remove("excel-sl-col");
      th.setAttribute("title", `Column ${letter} (Click to select column)`);
    });
  }

  // Renumber SL after a row delete (1, 2, 3…) — column itself stays
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
        firstCell.setAttribute("title", "Click to select this row");
      }
    });
  }
};

const isFormattableCell = (cell: HTMLTableCellElement) =>
  document.contains(cell) &&
  !cell.classList.contains("excel-sl-col") &&
  !cell.classList.contains("excel-attachment-cell") &&
  cell.getAttribute("contenteditable") !== "false";

export const getSelectedTableCells = (
  selectedCells: HTMLTableCellElement[]
): HTMLTableCellElement[] =>
  selectedCells.filter(
    (cell) => cell.classList.contains("excel-cell-selected") && isFormattableCell(cell)
  );

export const applyToolbarCommandToCells = (
  cells: HTMLTableCellElement[],
  command: string,
  value = ""
): boolean => {
  const targets = cells.filter(isFormattableCell);
  if (!targets.length) return false;

  const selection = window.getSelection();
  document.execCommand("styleWithCSS", false, "true");

  targets.forEach((cell) => {
    const range = document.createRange();
    range.selectNodeContents(cell);
    selection?.removeAllRanges();
    selection?.addRange(range);

    if (command === "formatBlock") {
      const ok = document.execCommand("formatBlock", false, value);
      if (!ok) document.execCommand("formatBlock", false, value.replace(/[<>]/g, ""));
    } else if (command === "hiliteColor") {
      const ok = document.execCommand("hiliteColor", false, value);
      if (!ok) document.execCommand("backColor", false, value);
    } else if (command === "foreColor") {
      document.execCommand("foreColor", false, value);
      cell.style.color = value;
    } else {
      document.execCommand(command, false, value || undefined);
    }
  });

  selection?.removeAllRanges();
  return true;
};
