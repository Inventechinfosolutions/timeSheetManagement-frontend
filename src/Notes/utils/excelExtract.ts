import * as XLSX from "xlsx";
import { buildDocumentPagesHtml } from "./documentLayout";

const escapeHtml = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const rowsToTable = (rows: any[][]): string => {
  if (!rows.length) return "<p></p>";
  const maxCols = Math.max(...rows.map((row) => (Array.isArray(row) ? row.length : 0)), 1);
  const header = rows[0] || [];
  const body = rows.slice(1);
  const cell = (value: unknown, tag: "th" | "td") =>
    `<${tag}>${escapeHtml(value)}</${tag}>`;
  const headerRow = `<tr>${Array.from({ length: maxCols }, (_, index) => cell(header[index], "th")).join("")}</tr>`;
  const bodyRows = (body.length ? body : [[]]).map(
    (row) =>
      `<tr>${Array.from({ length: maxCols }, (_, index) => cell(row?.[index], "td")).join("")}</tr>`
  );
  return `<table><thead>${headerRow}</thead><tbody>${bodyRows.join("")}</tbody></table>`;
};

export interface ExcelWorkbookData {
  fileName: string;
  sheetNames: string[];
  sheetsData: Record<string, any[][]>;
  fileKey?: string;
}

export const isExcelFileName = (name?: string) => /\.(xlsx|xls|csv)$/i.test(name || "");

export const findExcelAttachment = (
  attachments?: Array<{ name?: string; fileName?: string; key?: string; fileKey?: string }>
) => attachments?.find((item) => isExcelFileName(item.fileName || item.name));

export const sheetsDataToPagesHtml = (
  workbook: ExcelWorkbookData,
  landscape = false
): string => {
  const sheetsHtml = workbook.sheetNames
    .map((name) => `<h2>${escapeHtml(name)}</h2>${rowsToTable(workbook.sheetsData[name] || [])}`)
    .join("");
  return buildDocumentPagesHtml(`<div class="page">${sheetsHtml}</div>`, null, undefined, undefined, landscape);
};

const WORKBOOK_STORE_CLASS = "excel-workbook-store";

export const parseExcelWorkbookFromHtml = (html?: string | null): ExcelWorkbookData | null => {
  if (!html) return null;
  try {
    const parsed = new DOMParser().parseFromString(html, "text/html");
    const store = parsed.querySelector(`.${WORKBOOK_STORE_CLASS}`);
    if (!store?.textContent) return null;
    const data = JSON.parse(decodeURIComponent(store.textContent));
    if (!data?.fileName && !data?.fileKey) return null;
    return {
      fileName: data.fileName || "Spreadsheet.xlsx",
      sheetNames: data.sheetNames || [],
      sheetsData: data.sheetsData || {},
      fileKey: data.fileKey,
    };
  } catch {
    return null;
  }
};

export const embedExcelWorkbookInHtml = (html: string, workbook: ExcelWorkbookData): string => {
  const parsed = new DOMParser().parseFromString(html || "", "text/html");
  parsed.querySelectorAll(`.${WORKBOOK_STORE_CLASS}`).forEach((node) => node.remove());
  const store = parsed.createElement("div");
  store.className = WORKBOOK_STORE_CLASS;
  store.setAttribute("hidden", "true");
  store.textContent = encodeURIComponent(
    JSON.stringify({
      fileName: workbook.fileName,
      fileKey: workbook.fileKey,
    })
  );
  parsed.body.insertBefore(store, parsed.body.firstChild);
  return parsed.body.innerHTML;
};

export const descriptionFromExcelWorkbook = (workbook: ExcelWorkbookData): string =>
  embedExcelWorkbookInHtml("", workbook);

const WORKBOOK_STORE_RE =
  /<div[^>]*class=["'][^"']*excel-workbook-store[^"']*["'][^>]*>[\s\S]*?<\/div>/gi;

/** Remove hidden workbook store from HTML (keeps typed / imported A4 content). */
export const stripExcelWorkbookStore = (html?: string | null): string =>
  (html || "").replace(WORKBOOK_STORE_RE, "").trim();

/** True when HTML has visible note content (ignores excel-workbook-store). */
export const htmlHasVisibleNoteContent = (html?: string | null): boolean => {
  const withoutStore = stripExcelWorkbookStore(html);
  if (!withoutStore) return false;
  return (
    /<(img|table|video|canvas|svg|iframe)\b/i.test(withoutStore) ||
    withoutStore.replace(/<[^>]*>/g, "").trim().length > 0
  );
};

/** Unique sheet name within a set (Excel max 31 chars). */
const uniqueSheetName = (base: string, used: Set<string>): string => {
  const clipped = (base || "Sheet1").slice(0, 31);
  if (!used.has(clipped)) return clipped;
  for (let i = 2; i < 1000; i++) {
    const suffix = ` (${i})`;
    const name = `${clipped.slice(0, Math.max(1, 31 - suffix.length))}${suffix}`;
    if (!used.has(name)) return name;
  }
  return `${clipped.slice(0, 24)}_${Date.now().toString(36)}`.slice(0, 31);
};

/** Merge incoming sheets into existing workbook; rename duplicates (Sheet1 (2)). */
export const mergeExcelWorkbooks = (
  existing: ExcelWorkbookData,
  incoming: ExcelWorkbookData
): ExcelWorkbookData => {
  const used = new Set(existing.sheetNames.map((n) => n || "Sheet1"));
  const sheetNames = [...existing.sheetNames];
  const sheetsData: Record<string, any[][]> = { ...existing.sheetsData };

  for (const name of incoming.sheetNames) {
    const unique = uniqueSheetName(name || "Sheet1", used);
    used.add(unique);
    sheetNames.push(unique);
    sheetsData[unique] = incoming.sheetsData[name] || [];
  }

  return {
    fileName: existing.fileName || incoming.fileName || "Spreadsheet.xlsx",
    sheetNames,
    sheetsData,
    fileKey: existing.fileKey || incoming.fileKey,
  };
};

export async function parseExcelFile(file: File | Blob, fileName = "Spreadsheet.xlsx"): Promise<ExcelWorkbookData> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  if (!workbook.SheetNames?.length) {
    throw new Error("No sheets found in this Excel file");
  }

  const sheetsData: Record<string, any[][]> = {};
  workbook.SheetNames.forEach((name) => {
    sheetsData[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], {
      header: 1,
      defval: "",
      raw: false,
    });
  });

  return {
    fileName,
    sheetNames: workbook.SheetNames,
    sheetsData,
  };
}

export function workbookDataToFile(data: ExcelWorkbookData): File {
  const book = XLSX.utils.book_new();
  const names = data.sheetNames.length ? data.sheetNames : Object.keys(data.sheetsData);
  names.forEach((name) => {
    const sheetName = (name || "Sheet1").slice(0, 31);
    const sheet = XLSX.utils.aoa_to_sheet(data.sheetsData[name] || []);
    XLSX.utils.book_append_sheet(book, sheet, sheetName);
  });
  const bytes = XLSX.write(book, { bookType: "xlsx", type: "array" });
  return new File([bytes], data.fileName || "spreadsheet.xlsx", {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
}
