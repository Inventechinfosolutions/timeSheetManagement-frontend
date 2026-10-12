import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { message } from "antd";
import axios from "axios";
import dayjs from "dayjs";
import { Note, ColorOption } from "../types/notes.types";
import { paginateToA4Sheets } from "./documentLayout";
import {
  htmlHasVisibleNoteContent,
  parseExcelWorkbookFromHtml,
  stripExcelWorkbookStore,
} from "./excelExtract";

export const TEXT_COLORS: ColorOption[] = [
  { label: "None / Default", color: "none" },
  { label: "Default Dark", color: "#1B2559" },
  { label: "Primary Purple", color: "#4318FF" },
  { label: "Ocean Blue", color: "#2563EB" },
  { label: "Sky Cyan", color: "#0284C7" },
  { label: "Emerald Green", color: "#059669" },
  { label: "Amber Orange", color: "#D97706" },
  { label: "Crimson Red", color: "#DC2626" },
  { label: "Violet Purple", color: "#7C3AED" },
  { label: "Rose Pink", color: "#DB2777" },
  { label: "Slate Gray", color: "#64748B" },
];

export const HIGHLIGHT_COLORS: ColorOption[] = [
  { label: "Clear / None", color: "transparent" },
  { label: "Soft Yellow", color: "#FEF08A" },
  { label: "Soft Green", color: "#BBF7D0" },
  { label: "Soft Blue", color: "#BFDBFE" },
  { label: "Soft Pink", color: "#FECDD3" },
  { label: "Soft Purple", color: "#E9D5FF" },
  { label: "Soft Orange", color: "#FED7AA" },
];

/** Strip HTML/CSS/base64 noise so search does not match "#fff", style junk, etc. */
export const plainTextForSearch = (html?: string): string => {
  if (!html) return "";
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/data:[^"'\s>]*/gi, " ")
    .replace(/#[0-9a-fA-F]{3,8}\b/g, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/&[a-zA-Z]+;/g, " ")
    .replace(/&#\d+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
};

export const noteMatchesSearch = (
  note: Pick<Note, "id" | "title" | "projectName" | "createdBy" | "description">,
  query: string,
): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  // Short queries: title / id / names only — avoid false hits inside HTML descriptions
  const meta = [note.id, note.title, note.projectName, note.createdBy]
    .filter((value) => value !== undefined && value !== null && String(value).trim() !== "")
    .join(" ")
    .toLowerCase();
  if (q.length < 3) {
    return meta.includes(q);
  }
  const text = `${meta} ${plainTextForSearch(note.description)}`.trim();
  return text.includes(q);
};

export const noteMatchesCreatedDate = (
  createdAt: string | undefined,
  fromDate?: string,
  toDate?: string,
): boolean => {
  if (!fromDate && !toDate) return true;
  if (!createdAt) return false;
  const day = dayjs(createdAt).format("YYYY-MM-DD");
  if (fromDate && day < fromDate) return false;
  if (toDate && day > toDate) return false;
  return true;
};

export const formatFileSize = (bytes?: number): string => {
  if (!bytes || bytes === 0) return "8.4 KB";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
};

const SKIP_JUSTIFY_TAGS = new Set(["SCRIPT", "STYLE", "PRE", "CODE", "TEXTAREA"]);
const NO_JUSTIFY_ALIGN_TAGS = new Set([
  "H1",
  "H2",
  "H3",
  "H4",
  "H5",
  "H6",
  "IMG",
  "TABLE",
  "THEAD",
  "TBODY",
  "TR",
  "TH",
  "BUTTON",
  "INPUT",
  "SVG",
]);

/** Collapse OCR / PDF "l e t t e r   s p a c e d" words back into normal words. */
const collapseLetterSpacedWords = (text: string): string => {
  const tokens = text.split(" ").filter((token) => token.length > 0);
  if (tokens.length < 4) return text.replace(/ {2,}/g, " ").trim();
  const singleCount = tokens.filter((token) => token.length === 1).length;
  if (singleCount / tokens.length < 0.5) return text.replace(/ {2,}/g, " ").trim();

  let rebuilt = "";
  tokens.forEach((token) => {
    if (token.length === 1) {
      rebuilt += token;
    } else {
      if (rebuilt && !rebuilt.endsWith(" ")) rebuilt += " ";
      rebuilt += `${token} `;
    }
  });
  return rebuilt.replace(/ {2,}/g, " ").trim();
};

/** Strip NBSP, zero-width, tabs, multi-spaces — PDF/DOCX import cleanup. */
const normalizeImportedText = (raw: string): string => {
  const flattened = raw
    .replace(/\u00a0/g, " ") // nbsp
    .replace(/\u00ad/g, "") // soft hyphen
    .replace(/[\u2000-\u200B\u200C\u200D\u202F\u205F\u3000\uFEFF]/g, " ")
    .replace(/[\r\n\t\f\v]+/g, " ")
    .replace(/ {2,}/g, " ");
  return collapseLetterSpacedWords(flattened);
};

const isVisuallyEmptyBlock = (el: HTMLElement): boolean => {
  const text = (el.textContent || "")
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length > 0) return false;
  if (el.querySelector("img, table, video, canvas, svg, iframe, input, button")) return false;
  return true;
};

/**
 * Clean extra imported spaces / vertical gaps and justify like an original PDF.
 * Also merges A4 pages and reflows so content packs to the top (no mid-page holes).
 */
export const justifyImportedContent = (
  root: HTMLElement,
  options?: { landscape?: boolean; reflowPages?: boolean }
) => {
  const landscape = Boolean(options?.landscape);
  const reflowPages = options?.reflowPages !== false;

  // 1) Normalize every text node (remove NBSP, double spaces, letter-spacing OCR junk)
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  while (walker.nextNode()) textNodes.push(walker.currentNode as Text);

  textNodes.forEach((node) => {
    const parent = node.parentElement;
    if (!parent || SKIP_JUSTIFY_TAGS.has(parent.tagName)) return;
    node.textContent = normalizeImportedText(node.textContent || "");
  });

  // 2) Strip forced heights / padding that create empty bands (Docling/PDF leftovers)
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (el.classList.contains("page")) return;
    if (SKIP_JUSTIFY_TAGS.has(el.tagName)) return;
    if (el.closest("table, th, td, .excel-sl-col, .excel-attachment-cell")) return;

    el.style.removeProperty("min-height");
    el.style.removeProperty("height");
    el.style.removeProperty("max-height");
    const padTop = parseFloat(el.style.paddingTop || "0");
    const padBottom = parseFloat(el.style.paddingBottom || "0");
    if (padTop > 8) el.style.paddingTop = "0";
    if (padBottom > 8) el.style.paddingBottom = "0";
    el.style.marginTop = "0";
    el.style.marginBottom = "0.35em";
    el.style.whiteSpace = "normal";
    el.style.letterSpacing = "normal";
    el.style.wordSpacing = "normal";
  });

  // 3) Remove empty spacer blocks (&nbsp;, <br>-only, empty p/div/li/span)
  const removeEmptySpacers = () => {
    const candidates = Array.from(
      root.querySelectorAll<HTMLElement>("p, div, span, li, h1, h2, h3, h4, h5, h6, section, article")
    );
    let removed = 0;
    candidates.forEach((el) => {
      if (SKIP_JUSTIFY_TAGS.has(el.tagName)) return;
      if (el.classList.contains("page") || el.classList.contains("doc-flow")) return;
      if (el.closest("table, th, td, .excel-sl-col, .excel-attachment-cell")) return;
      if (el.querySelector(".page")) return;

      // Collapse consecutive <br>
      el.querySelectorAll("br").forEach((br) => {
        if (br.previousSibling && br.previousSibling.nodeName === "BR") br.remove();
      });

      if (!isVisuallyEmptyBlock(el)) return;

      // Keep real list structure only if it has nested content later — empty li goes
      if (["P", "DIV", "SPAN", "LI", "SECTION", "ARTICLE"].includes(el.tagName)) {
        el.remove();
        removed += 1;
      }
    });
    return removed;
  };
  // Pass twice so nested empty wrappers clear after children are gone
  removeEmptySpacers();
  removeEmptySpacers();

  // 4) Apply justify alignment
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    if (SKIP_JUSTIFY_TAGS.has(el.tagName)) return;
    if (el.classList.contains("excel-sl-col") || el.classList.contains("excel-attachment-cell")) return;
    if (el.classList.contains("page")) return;

    el.style.textAlignLast = "left";
    el.style.wordBreak = "normal";
    el.style.overflowWrap = "break-word";
    el.style.lineHeight = "1.55";

    if (!NO_JUSTIFY_ALIGN_TAGS.has(el.tagName)) {
      el.style.textAlign = "justify";
      (el.style as any).textJustify = "inter-word";
      el.style.hyphens = "auto";
    } else if (el.tagName.startsWith("H")) {
      el.style.textAlign = "left";
      el.style.marginBottom = "0.5em";
    }
  });

  root.classList.add("is-justified");
  root.style.textAlign = "justify";
  (root.style as any).textJustify = "inter-word";
  root.style.whiteSpace = "normal";
  root.style.letterSpacing = "normal";
  root.style.wordSpacing = "normal";

  // 5) Merge all A4 sheets into one flow, then re-paginate so content packs to the top
  //    (fixes huge empty bands left from PDF page imports)
  if (reflowPages) {
    const pages = Array.from(root.querySelectorAll(":scope > .page")) as HTMLElement[];
    if (pages.length > 0) {
      const first = pages[0];
      pages.slice(1).forEach((page) => {
        while (page.firstChild) first.appendChild(page.firstChild);
        page.remove();
      });
      // Drop leading empty nodes inside the merged page
      while (first.firstChild) {
        const node = first.firstChild;
        if (node.nodeType === Node.TEXT_NODE && !(node.textContent || "").trim()) {
          first.removeChild(node);
          continue;
        }
        if (node.nodeType === Node.ELEMENT_NODE && isVisuallyEmptyBlock(node as HTMLElement)) {
          first.removeChild(node);
          continue;
        }
        break;
      }
      first.classList.add("is-justified");
      paginateToA4Sheets(root, landscape, true);
    } else {
      // No page wrappers yet — still mark justified
      paginateToA4Sheets(root, landscape, true);
    }
  }

  root.querySelectorAll(".page").forEach((page) => {
    (page as HTMLElement).classList.add("is-justified");
    (page as HTMLElement).style.textAlign = "justify";
  });
};

/**
 * PDF Attachment badges — full filename visible (wrap), no vertical clip.
 * [file icon] [full name] [eye] [download]
 */
const prepareAttachmentBadgesForPdfExport = (root: HTMLElement): void => {
  root
    .querySelectorAll(
      ".row-attach-add-btn, .row-attach-upload-btn, .row-attach-loading, .table-file-btn.remove"
    )
    .forEach((el) => el.remove());

  root.querySelectorAll<HTMLElement>("th.excel-attachment-col, td.excel-attachment-cell").forEach((cell) => {
    cell.style.setProperty("width", "280px", "important");
    cell.style.setProperty("min-width", "260px", "important");
    cell.style.setProperty("max-width", "320px", "important");
    cell.style.setProperty("word-break", "break-word", "important");
    cell.style.setProperty("overflow-wrap", "anywhere", "important");
    cell.style.setProperty("white-space", "normal", "important");
    cell.style.setProperty("overflow", "visible", "important");
    cell.style.setProperty("vertical-align", "middle", "important");
    cell.style.setProperty("padding", "8px", "important");
  });

  root.querySelectorAll<HTMLElement>(".table-file-badge").forEach((badge) => {
    badge.style.cssText = [
      "display:flex",
      "flex-direction:row",
      "flex-wrap:nowrap",
      "align-items:flex-start",
      "gap:6px",
      "width:100%",
      "max-width:100%",
      "box-sizing:border-box",
      "padding:6px 8px",
      "background:#ffffff",
      "border:1px solid #e2e8f0",
      "border-radius:6px",
      "overflow:visible",
      "text-align:left",
      "font-size:11px",
      "line-height:1.45",
      "color:#1e293b",
    ].join(";");

    const nameEl = badge.querySelector<HTMLElement>(".table-file-name");
    if (nameEl) {
      const full =
        badge.getAttribute("data-file-name") ||
        nameEl.getAttribute("title") ||
        nameEl.textContent ||
        "Attachment";
      // Full name — do not truncate for PDF
      nameEl.textContent = full;
      nameEl.setAttribute("title", full);
      nameEl.style.cssText = [
        "flex:1 1 auto",
        "min-width:0",
        "max-width:none",
        "overflow:visible",
        "white-space:normal",
        "word-break:break-word",
        "overflow-wrap:anywhere",
        "font-weight:500",
        "font-size:11px",
        "line-height:1.45",
        "text-align:left",
        "display:block",
      ].join(";");
    }

    const fileIcon = badge.querySelector<SVGElement>(":scope > svg");
    if (fileIcon) {
      fileIcon.style.flexShrink = "0";
      fileIcon.style.width = "14px";
      fileIcon.style.height = "14px";
      fileIcon.style.marginTop = "1px";
    }

    badge.querySelectorAll<HTMLElement>(".table-file-btn").forEach((btn) => {
      btn.style.cssText =
        "display:inline-flex;align-items:center;justify-content:center;width:18px;height:18px;margin-top:1px;padding:0;border:none;background:transparent;flex-shrink:0;";
      const svg = btn.querySelector("svg") as SVGElement | null;
      if (svg) {
        svg.style.width = "12px";
        svg.style.height = "12px";
        svg.style.display = "block";
      }
    });
  });
};

/** Same palette as backend note email template — used so download matches emailed description. */
const TABLE_COLORS_MAP: Record<string, string> = {
  "--tbl-black": "#000000",
  "--tbl-dark-slate": "#1e293b",
  "--tbl-slate-gray": "#475569",
  "--tbl-deep-blue": "#1d4ed8",
  "--tbl-electric-blue": "#2563eb",
  "--tbl-teal": "#0284c7",
  "--tbl-dark-green": "#15803d",
  "--tbl-bold-green": "#16a34a",
  "--tbl-bold-amber": "#d97706",
  "--tbl-bold-orange": "#ea580c",
  "--tbl-crimson-red": "#dc2626",
  "--tbl-deep-red": "#b91c1c",
  "--tbl-bold-pink": "#e11d48",
  "--tbl-vibrant-purple": "#9333ea",
  "--tbl-deep-purple": "#6b21a8",
  "--tbl-white": "#FFFFFF",
  "--tbl-gray": "#F1F5F9",
  "--tbl-blue": "#DBEAFE",
  "--tbl-cyan": "#A5F3FC",
  "--tbl-green": "#DCFCE7",
  "--tbl-lime": "#D9F99D",
  "--tbl-yellow": "#FEF9C3",
  "--tbl-orange": "#FED7AA",
  "--tbl-light-red": "#FEE2E2",
  "--tbl-purple": "#F3E8FF",
};

/**
 * Inline table theme colors exactly like the share-email template
 * (`inlineTableEmailColors`) so PDF/Word match what recipients see in description.
 */
export const inlineTableExportColors = (html: string): string => {
  if (!html) return "";
  let result = html;

  result = result.replace(/var\((--tbl-[a-z0-9-]+)\)/gi, (match, varName) => {
    return TABLE_COLORS_MAP[String(varName).toLowerCase()] || match;
  });

  for (const [varName, hex] of Object.entries(TABLE_COLORS_MAP)) {
    const cls = "bg-" + varName.replace("--", "");
    const classPattern = new RegExp(
      `(<(td|th|tr)[^>]*?class="[^"]*?\\b${cls}\\b[^"]*"[^>]*?)>`,
      "gi"
    );
    result = result.replace(classPattern, (_match, openTag: string) => {
      let updatedTag = openTag;
      if (!updatedTag.includes("bgcolor=")) {
        updatedTag += ` bgcolor="${hex}"`;
      }
      if (updatedTag.includes('style="')) {
        return (
          updatedTag.replace('style="', `style="background-color: ${hex} !important; `) +
          ">"
        );
      }
      return `${updatedTag} style="background-color: ${hex} !important;">`;
    });
  }

  result = result.replace(
    /<(td|th|tr)([^>]*?style="[^"]*?background-color:\s*(#[0-9a-fA-F]{3,8})[^"]*"[^>]*?)>/gi,
    (match, tag, rest) => {
      if (match.includes("bgcolor=")) return match;
      const hexMatch = match.match(/background-color:\s*(#[0-9a-fA-F]{3,8})/i);
      if (hexMatch?.[1]) {
        return `<${tag}${rest} bgcolor="${hexMatch[1]}">`;
      }
      return match;
    }
  );

  return result;
};

/** Clean note HTML for PDF/Word — same description pipeline as email (no logo/header). */
const prepareNoteDescriptionForExport = (note: Note): string => {
  const raw = note.description || "";
  const workbook = parseExcelWorkbookFromHtml(raw);
  let html = stripExcelWorkbookStore(raw);

  // Safety: strip any leftover URL-encoded workbook JSON blobs
  html = html.replace(/%7B%22fileName%22%3A[\s\S]*?%7D/gi, "").trim();

  const parsed = new DOMParser().parseFromString(html || "", "text/html");
  parsed
    .querySelectorAll(
      ".excel-workbook-store, .note-inline-image-remove, .row-attach-upload-btn, .row-attach-add-btn, .row-attach-loading, .table-file-btn.remove, .note-table-scroll, .a4-page-workspace, .a4-page-rotator"
    )
    .forEach((el) => {
      // Unwrap scroll shells so table content stays; remove edit-only controls
      if (
        el.classList.contains("note-table-scroll") ||
        el.classList.contains("a4-page-workspace") ||
        el.classList.contains("a4-page-rotator")
      ) {
        const parent = el.parentNode;
        if (!parent) return;
        while (el.firstChild) parent.insertBefore(el.firstChild, el);
        el.remove();
        return;
      }
      el.remove();
    });
  parsed.querySelectorAll(".note-inline-image, .note-table-scroll-inner").forEach((wrap) => {
    const parent = wrap.parentNode;
    if (!parent) return;
    while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap);
    parent.removeChild(wrap);
  });

  const pages = Array.from(parsed.body.querySelectorAll(".page"));
  if (pages.length > 0) {
    html = pages.map((p) => p.innerHTML).join("");
  } else {
    html = parsed.body.innerHTML.trim();
  }

  // Match email: strip attach UI regex leftovers + inline tbl-* colors
  html = stripAttachmentUiFromHtml(html);
  html = inlineTableExportColors(html);

  if (htmlHasVisibleNoteContent(html)) {
    return html;
  }

  if (workbook?.fileName || workbook?.fileKey) {
    const name = workbook.fileName || "Spreadsheet.xlsx";
    return `<p style="margin:0;color:#334155;"><strong>Attached spreadsheet:</strong> ${name}</p>`;
  }

  return '<p style="color:#94a3b8;font-style:italic;margin:0;font-family:Arial,sans-serif;font-size:14.5px;">No content provided.</p>';
};

/**
 * Dynamically prepares all content inside the PDF export container:
 * - Header card: aligned grid with unified baseline for project badge and title.
 * - Table alignments: SL column centered with #f1f5f9, data cells cleanly left-aligned
 *   while dynamically preserving any custom user alignments (center, right, justify).
 * - Strikethrough (s, strike, del, line-through): tight glyph line-height so the strike line
 *   renders dead-center through text without floating above in html2canvas.
 * - Lists (ul, ol, li): inline paragraph unwrapping so bullets and numbers stay on the same baseline.
 * - Highlights and cell shading: zero paragraph margins inside cells for pixel-perfect vertical centering.
 * - Inline quotes (.notes-inline-quote, blockquote): purple left-accent bar and soft lavender background.
 */
const preparePdfExportDom = (root: HTMLElement): void => {
  // 1. Process attachment badges
  prepareAttachmentBadgesForPdfExport(root);

  // 2. Process all tables dynamically
  const tables = root.querySelectorAll<HTMLTableElement>("table");
  tables.forEach((table) => {
    const firstRow = table.rows[0];
    const firstCellText = firstRow?.cells[0]?.textContent?.trim() || "";
    const isFirstColSl =
      firstCellText === "SL" ||
      firstRow?.cells[0]?.classList.contains("excel-sl-col") ||
      table.querySelector(".excel-sl-col") !== null;

    Array.from(table.rows).forEach((row) => {
      Array.from(row.cells).forEach((cell, colIdx) => {
        const isSl =
          cell.classList.contains("excel-sl-col") ||
          (isFirstColSl && colIdx === 0);

        if (isSl) {
          cell.classList.add("excel-sl-col");
          cell.style.setProperty("text-align", "center", "important");
          cell.style.setProperty("vertical-align", "top", "important");
          cell.style.setProperty("background-color", "#f1f5f9", "important");
          cell.style.setProperty("color", "#475569", "important");
          cell.style.setProperty("font-weight", "600", "important");
          cell.style.setProperty("font-size", "13px", "important");
          cell.style.setProperty("width", "44px", "important");
          cell.style.setProperty("min-width", "44px", "important");
          cell.style.setProperty("max-width", "44px", "important");
          cell.style.setProperty("padding", "8px 4px", "important");
          return;
        }

        if (
          cell.classList.contains("excel-attachment-col") ||
          cell.classList.contains("excel-attachment-cell")
        ) {
          return;
        }

        // Dynamically resolve cell alignment: preserve custom alignment or default to left
        const cellInlineAlign = cell.style.textAlign;
        const cellAttrAlign = cell.getAttribute("align");
        const styledChild = cell.querySelector<HTMLElement>(
          "[style*='text-align'], [align], .text-center, .text-right, .text-left, .text-justify"
        );
        let dynamicAlign = cellInlineAlign || cellAttrAlign || "";

        if (!dynamicAlign && styledChild) {
          dynamicAlign =
            styledChild.style.textAlign ||
            styledChild.getAttribute("align") ||
            (styledChild.classList.contains("text-center") ? "center" : "") ||
            (styledChild.classList.contains("text-right") ? "right" : "") ||
            (styledChild.classList.contains("text-justify") ? "justify" : "") ||
            (styledChild.classList.contains("text-left") ? "left" : "");
        }

        if (dynamicAlign && dynamicAlign !== "inherit") {
          cell.style.setProperty("text-align", dynamicAlign, "important");
        } else {
          cell.style.setProperty("text-align", "left", "important");
        }

        // Align cell to top with 8px padding: avoids html2canvas baseline-shift bug that drops text below background boxes
        cell.style.setProperty("vertical-align", "top", "important");
        cell.style.setProperty("padding", "8px 12px", "important");

        // Cell background fill preservation & child content normalization
        const cellBg = cell.style.backgroundColor;
        if (cellBg && cellBg !== "transparent" && cellBg !== "inherit") {
          cell.style.setProperty("background-color", cellBg, "important");
        }

        cell.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p, div").forEach((el) => {
          el.style.setProperty("background-color", "transparent", "important");
          el.style.setProperty("margin", "0", "important");
          el.style.setProperty("padding", "0", "important");
          el.style.setProperty("line-height", "1.35", "important");
        });
      });
    });
  });

  // 3. Strikethrough fix: Use Unicode combining stroke overlay (\u0336) on text characters
  // so the strike line is drawn by the font rasterizer dead-center through each character,
  // completely avoiding html2canvas's buggy misplaced text-decoration lines and absolute spans.
  root
    .querySelectorAll<HTMLElement>(
      "s, strike, del, [style*='line-through']"
    )
    .forEach((el) => {
      el.style.setProperty("display", "inline", "important");
      el.style.setProperty("vertical-align", "baseline", "important");
      el.style.setProperty("line-height", "inherit", "important");
      el.style.setProperty("text-decoration", "none", "important");
      el.querySelectorAll(".pdf-export-strike-line, .pdf-strike-line").forEach((l) => l.remove());

      const strikeWalk = (node: Node) => {
        if (node.nodeType === Node.TEXT_NODE && node.nodeValue) {
          if (!node.nodeValue.includes("\u0336")) {
            node.nodeValue = node.nodeValue
              .split("")
              .map((c) => (c === " " || c === "\u00A0" ? c : c + "\u0336"))
              .join("");
          }
        } else {
          node.childNodes.forEach(strikeWalk);
        }
      };
      strikeWalk(el);
    });

  // 4. Inline quotes & blockquotes
  root
    .querySelectorAll<HTMLElement>(".notes-inline-quote, blockquote")
    .forEach((quote) => {
      quote.style.setProperty("display", "inline-block", "important");
      quote.style.setProperty("border-left", "3px solid #4318FF", "important");
      quote.style.setProperty("background-color", "#EEF2FF", "important");
      quote.style.setProperty("padding", "2px 8px", "important");
      quote.style.setProperty("margin", "0 2px", "important");
      quote.style.setProperty("font-style", "italic", "important");
      quote.style.setProperty("color", "#475569", "important");
      quote.style.setProperty("border-radius", "0 4px 4px 0", "important");
      quote.style.setProperty("vertical-align", "middle", "important");
      quote.style.setProperty("line-height", "1.15", "important");
      quote.querySelectorAll<HTMLElement>("p").forEach((p) => {
        p.style.setProperty("display", "inline", "important");
        p.style.setProperty("background", "transparent", "important");
        p.style.setProperty("margin", "0", "important");
        p.style.setProperty("padding", "0", "important");
      });
    });

  // 5. Lists (ul, ol, li): remove native list markers which html2canvas detaches onto separate lines.
  // Insert explicit inline marker spans so bullets and numbers stay on the EXACT same baseline as the text.
  root.querySelectorAll<HTMLElement>("ul, ol").forEach((list) => {
    const isOrdered = list.tagName.toLowerCase() === "ol";
    list.style.setProperty("list-style", "none", "important");
    list.style.setProperty("list-style-type", "none", "important");
    list.style.setProperty("padding-left", "0", "important");
    list.style.setProperty("margin", "0", "important");
    list.style.setProperty("text-align", "left", "important");

    const items = Array.from(list.children).filter(
      (c) => c.tagName.toLowerCase() === "li"
    ) as HTMLElement[];

    items.forEach((li, idx) => {
      li.style.setProperty("list-style", "none", "important");
      li.style.setProperty("list-style-type", "none", "important");
      li.style.setProperty("display", "block", "important");
      li.style.setProperty("margin", "0", "important");
      li.style.setProperty("padding", "0", "important");
      li.style.setProperty("line-height", "1.4", "important");
      li.style.setProperty("text-align", "left", "important");

      li.querySelectorAll<HTMLElement>("p, div").forEach((lp) => {
        lp.style.setProperty("display", "inline", "important");
        lp.style.setProperty("margin", "0", "important");
        lp.style.setProperty("padding", "0", "important");
        lp.style.setProperty("line-height", "inherit", "important");
      });

      if (!li.querySelector(".pdf-export-list-marker")) {
        const marker = document.createElement("span");
        marker.className = "pdf-export-list-marker";
        marker.style.setProperty("display", "inline", "important");
        marker.style.setProperty("margin-right", "5px", "important");
        marker.style.setProperty("font-weight", isOrdered ? "normal" : "bold", "important");
        marker.style.setProperty("line-height", "inherit", "important");
        marker.style.setProperty("vertical-align", "baseline", "important");
        marker.textContent = isOrdered ? `${idx + 1}. ` : "• ";
        li.insertBefore(marker, li.firstChild);
      }
    });
  });

  // 6. Highlights: clean inline-block text highlight for identification with text centered horizontally & vertically inside the color pill
  root
    .querySelectorAll<HTMLElement>(
      "mark, span[style*='background-color'], font[style*='background-color']"
    )
    .forEach((mark) => {
      if (
        !mark.classList.contains("notes-inline-quote") &&
        mark.tagName !== "TD" &&
        mark.tagName !== "TH"
      ) {
        mark.style.setProperty("display", "inline-block", "important");
        mark.style.setProperty("vertical-align", "middle", "important");
        mark.style.setProperty("line-height", "1.15", "important");
        mark.style.setProperty("padding", "2px 6px", "important");
        mark.style.setProperty("border-radius", "4px", "important");
        mark.style.setProperty("box-sizing", "border-box", "important");
        mark.style.setProperty("text-align", "center", "important");
      }
    });
};

/**
 * Export Note to PDF with 100% exact visual fidelity (highlighter colors, text colors,
 * boxes, cards, tables, and HTML formatting) matching the Word export and on-screen view.
 */
export const exportNoteToPdf = async (note: Note): Promise<void> => {
  const safeTitle = (note.title || "Note").replace(/[/\\?%*:|"<>]/g, "_");
  const hideLoading = message.loading("Generating PDF with exact visual styles...", 0);

  try {
    // Notify backend API endpoint with format=pdf for server logging/tracking
    if (note.id) {
      axios.get(`/api/notes/${note.id}/download?format=pdf`).catch(() => {
        // Backend ping in background
      });
    }

    const exportDescription = prepareNoteDescriptionForExport(note);
    const firstRowMatch = exportDescription.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
    const colCount = firstRowMatch
      ? (firstRowMatch[1].match(/<t[dh][^>]*>/gi) || []).length
      : 0;
    const isLandscape =
      note.isVertical === false ||
      note.rotation === 90 ||
      note.rotation === 270 ||
      colCount > 6;
    const baseWidthPx = isLandscape ? 1123 : 794;
    const pdfWidth = isLandscape ? 297 : 210;
    const pdfHeight = isLandscape ? 210 : 297;

    const wrapper = document.createElement("div");
    wrapper.setAttribute("data-pdf-export-root", "true");
    // Off-screen but still paintable — negative z-index often yields a blank canvas
    wrapper.style.position = "fixed";
    wrapper.style.left = "-10000px";
    wrapper.style.top = "0px";
    wrapper.style.zIndex = "0";
    wrapper.style.opacity = "1";
    wrapper.style.pointerEvents = "none";
    wrapper.style.overflow = "visible";
    wrapper.style.width = isLandscape ? "1122px" : "794px";
    wrapper.style.backgroundColor = "#FFFFFF";
    wrapper.style.boxSizing = "border-box";

    const isProject = note.type === "PROJECT";
    const projectLabel = note.projectName || "Worksphere Project";

    wrapper.innerHTML = `
      <style>
        .pdf-export-body {
          color: #1E293B !important;
          line-height: 1.65 !important;
        }
        .pdf-export-body mark, 
        .pdf-export-body span[style*="background-color"],
        .pdf-export-body font[style*="background-color"] {
          display: inline-block !important;
          vertical-align: middle !important;
          line-height: 1.15 !important;
          padding: 2px 6px !important;
          border-radius: 4px !important;
          box-sizing: border-box !important;
          text-align: center !important;
        }
        .pdf-export-body .notes-inline-quote,
        .pdf-export-body blockquote {
          display: inline-block !important;
          width: fit-content !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          border-left: 3px solid #4318FF !important;
          background-color: #EEF2FF !important;
          padding: 2px 8px !important;
          margin: 0 2px !important;
          font-style: italic !important;
          color: #475569 !important;
          border-radius: 0 4px 4px 0 !important;
          vertical-align: middle !important;
          line-height: 1.15 !important;
        }
        .pdf-export-body .notes-inline-quote p,
        .pdf-export-body blockquote p {
          display: inline !important;
          margin: 0 !important;
          background: transparent !important;
          border: none !important;
          padding: 0 !important;
        }
        .pdf-export-body s,
        .pdf-export-body strike,
        .pdf-export-body del,
        .pdf-export-body [style*="line-through"] {
          display: inline !important;
          vertical-align: baseline !important;
          line-height: inherit !important;
          text-decoration: none !important;
        }
        .pdf-export-body pre {
          font-family: Consolas, Monaco, "Courier New", monospace !important;
          background-color: #0F172A !important;
          color: #F8FAFC !important;
          padding: 12px 16px !important;
          border-radius: 8px !important;
          font-size: 12px !important;
          line-height: 1.55 !important;
          margin: 10px 0 !important;
          white-space: pre-wrap !important;
          word-break: break-word !important;
        }
        .pdf-export-body code {
          font-family: Consolas, Monaco, "Courier New", monospace !important;
          background-color: #F1F5F9 !important;
          color: #0F172A !important;
          padding: 2px 5px !important;
          border-radius: 4px !important;
          font-size: 12px !important;
        }
        .pdf-export-body pre code {
          background-color: transparent !important;
          color: #F8FAFC !important;
          padding: 0 !important;
        }
        .pdf-export-body .page {
          width: 100% !important;
          min-width: 0 !important;
          max-width: 100% !important;
          min-height: 0 !important;
          height: auto !important;
          margin: 0 !important;
          padding: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
        }
        .pdf-export-body table {
          width: 100% !important;
          max-width: 100% !important;
          min-width: 0 !important;
          table-layout: fixed !important;
          border-collapse: collapse !important;
          margin: 8px 0 !important;
          border: 1px solid #E2E8F0 !important;
        }
        .pdf-export-body table th,
        .pdf-export-body table td {
          border: 1px solid #E2E8F0 !important;
          padding: 8px 12px !important;
          text-align: left;
          vertical-align: top !important;
          font-size: 13px !important;
          line-height: 1.4 !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
          box-sizing: border-box !important;
        }
        /* Do not force th background — preserve inlined email/table theme colors */
        .pdf-export-body table th {
          font-weight: 700 !important;
          color: #1e293b !important;
        }
        .pdf-export-body table td h1,
        .pdf-export-body table th h1,
        .pdf-export-body table td h2,
        .pdf-export-body table th h2,
        .pdf-export-body table td h3,
        .pdf-export-body table th h3,
        .pdf-export-body table td p,
        .pdf-export-body table th p {
          margin: 0 !important;
          padding: 0 !important;
          line-height: 1.35 !important;
          background: transparent !important;
        }
        .pdf-export-body table th.excel-sl-col,
        .pdf-export-body table td.excel-sl-col {
          width: 44px !important;
          min-width: 44px !important;
          max-width: 44px !important;
          padding: 8px 4px !important;
          text-align: center !important;
          white-space: nowrap !important;
          overflow: hidden !important;
          vertical-align: top !important;
          background-color: #f1f5f9 !important;
          color: #475569 !important;
          font-weight: 600 !important;
          font-size: 13px !important;
        }
        .pdf-export-body th.excel-attachment-col,
        .pdf-export-body td.excel-attachment-cell {
          width: 280px !important;
          min-width: 260px !important;
          max-width: 320px !important;
          text-align: left !important;
          vertical-align: middle !important;
          overflow: visible !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
          padding: 8px !important;
        }
        .pdf-export-body .row-attach-container {
          display: flex !important;
          flex-direction: column !important;
          align-items: stretch !important;
          gap: 6px !important;
          width: 100% !important;
          max-width: 100% !important;
        }
        .pdf-export-body .table-file-badge {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          align-items: flex-start !important;
          gap: 6px !important;
          width: 100% !important;
          max-width: 100% !important;
          box-sizing: border-box !important;
          padding: 6px 8px !important;
          background: #ffffff !important;
          border: 1px solid #e2e8f0 !important;
          border-radius: 6px !important;
          text-align: left !important;
          overflow: visible !important;
          line-height: 1.45 !important;
        }
        .pdf-export-body .table-file-name {
          flex: 1 1 auto !important;
          min-width: 0 !important;
          max-width: none !important;
          overflow: visible !important;
          text-overflow: clip !important;
          white-space: normal !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          text-align: left !important;
          display: block !important;
          font-size: 11px !important;
          line-height: 1.45 !important;
        }
        .pdf-export-body .table-file-btn {
          display: inline-flex !important;
          align-items: center !important;
          justify-content: center !important;
          width: 18px !important;
          height: 18px !important;
          flex-shrink: 0 !important;
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
        }
        .pdf-export-body .table-file-btn svg {
          width: 12px !important;
          height: 12px !important;
          display: block !important;
        }
        .pdf-export-body .row-attach-add-btn,
        .pdf-export-body .row-attach-upload-btn,
        .pdf-export-body .table-file-btn.remove {
          display: none !important;
        }
        .pdf-export-body li {
          margin-bottom: 5px !important;
        .pdf-export-body ul,
        .pdf-export-body ol {
          list-style: none !important;
          list-style-type: none !important;
          padding-left: 0 !important;
          margin: 4px 0 !important;
          text-align: left !important;
        }
        .pdf-export-body li {
          list-style: none !important;
          list-style-type: none !important;
          display: block !important;
          margin-bottom: 2px !important;
          line-height: 1.4 !important;
          text-align: left !important;
        }
        .pdf-export-body li p {
          display: inline !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .pdf-export-body .pdf-export-list-marker {
          display: inline !important;
          margin-right: 5px !important;
          line-height: inherit !important;
          vertical-align: baseline !important;
        }
        .pdf-export-body table td ul,
        .pdf-export-body table th ul,
        .pdf-export-body table td ol,
        .pdf-export-body table th ol {
          list-style: none !important;
          list-style-type: none !important;
          padding-left: 0 !important;
          margin: 0 !important;
          text-align: left !important;
        }
        .pdf-export-body table td li,
        .pdf-export-body table th li {
          list-style: none !important;
          list-style-type: none !important;
          display: block !important;
          text-align: left !important;
          margin: 0 !important;
          line-height: 1.4 !important;
        }
        /* Match email .note-content typography (description only — no logo/header) */
        .pdf-export-body p {
          margin: 0 0 14px 0 !important;
          line-height: 1.8 !important;
          font-size: 14.5px !important;
          color: #334155 !important;
          font-family: Arial, sans-serif !important;
        }
        .pdf-export-body h1 { font-size: 24px !important; font-weight: 700 !important; margin: 0 0 12px 0 !important; color: #0f172a !important; font-family: Arial, sans-serif !important; }
        .pdf-export-body h2 { font-size: 20px !important; font-weight: 700 !important; margin: 0 0 10px 0 !important; color: #0f172a !important; font-family: Arial, sans-serif !important; }
        .pdf-export-body h3 { font-size: 17px !important; font-weight: 700 !important; margin: 0 0 8px 0 !important; color: #0f172a !important; font-family: Arial, sans-serif !important; }
        .pdf-export-body ul, .pdf-export-body ol {
          padding-left: 24px !important;
          margin: 0 0 14px 0 !important;
          font-size: 14.5px !important;
          line-height: 1.8 !important;
          color: #334155 !important;
        }
        .pdf-export-body blockquote {
          border-left: 4px solid #0a8fe7 !important;
          margin: 0 0 14px 0 !important;
          padding: 12px 18px !important;
          background-color: #f0f9ff !important;
          color: #0369a1 !important;
          font-size: 14px !important;
          border-radius: 0 6px 6px 0 !important;
        }
        .pdf-export-body img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
        }
        .pdf-export-body h1 { font-size: 20px !important; font-weight: 700 !important; margin: 12px 0 6px 0 !important; color: #1E293B !important; }
        .pdf-export-body h2 { font-size: 16px !important; font-weight: 700 !important; margin: 10px 0 5px 0 !important; color: #1E293B !important; }
        .pdf-export-body h3 { font-size: 14px !important; font-weight: 600 !important; margin: 8px 0 4px 0 !important; color: #1E293B !important; }

        /* Dynamic alignment classes and attributes */
        .pdf-export-body .text-center,
        .pdf-export-body [align="center"],
        .pdf-export-body [style*="text-align: center"],
        .pdf-export-body [style*="text-align:center"] {
          text-align: center !important;
        }
        .pdf-export-body .text-right,
        .pdf-export-body [align="right"],
        .pdf-export-body [style*="text-align: right"],
        .pdf-export-body [style*="text-align:right"] {
          text-align: right !important;
        }
        .pdf-export-body .text-left,
        .pdf-export-body [align="left"],
        .pdf-export-body [style*="text-align: left"],
        .pdf-export-body [style*="text-align:left"] {
          text-align: left !important;
        }
        .pdf-export-body .text-justify,
        .pdf-export-body [align="justify"],
        .pdf-export-body [style*="text-align: justify"],
        .pdf-export-body [style*="text-align:justify"],
        .pdf-export-body .is-justified,
        .pdf-export-body .is-justified p,
        .pdf-export-body .is-justified td {
          text-align: justify !important;
          text-justify: inter-word !important;
        }
      </style>
      <div style="padding: 28px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B; background-color: #FFFFFF; line-height: 1.6; box-sizing: border-box; width: ${baseWidthPx}px;">
        <!-- Header: Project (No box) & Title -->
        <div style="margin-bottom: 20px; width: 100%; box-sizing: border-box;">
          <div style="display: flex; align-items: baseline; gap: 8px; margin-bottom: 8px;">
            <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;">
              PROJECT:
            </span>
            <span style="font-size: 14px; font-weight: 700; color: #1B2559; line-height: 20px; text-transform: uppercase;">
              ${isProject ? projectLabel : "Personal Note"}
            </span>
          </div>
          <div style="display: flex; align-items: baseline; gap: 8px;">
            <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;">
              TITLE/SUBJECT:
            </span>
            <span style="font-size: 16px; font-weight: 800; color: #1B2559; line-height: 22px;">
              ${note.title || "Untitled Note"}
            </span>
          </div>
        </div>

        <!-- Structured Description Section -->
        <div style="margin-bottom: 16px; width: 100%; box-sizing: border-box;">
          <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 14px; width: 100%;">
            DESCRIPTION
          </div>
          <div class="notes-content-view doc-pages-editor pdf-export-body" style="font-size: 13.5px; line-height: 1.65; color: #1E293B; background-color: #FFFFFF; width: 100%;">
            ${exportDescription && exportDescription.trim() ? exportDescription : '<p style="color: #94A3B8; font-style: italic; margin: 0;">No description provided.</p>'}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    wrapper.style.width = `${baseWidthPx}px`;
    // Dynamically prepare all content (alignments, SL col, badges, quotes, lists, highlights, strikethrough)
    preparePdfExportDom(wrapper);

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
      width: baseWidthPx,
      windowWidth: baseWidthPx,
      foreignObjectRendering: false,
    });

    document.body.removeChild(wrapper);

    if (!canvas.width || !canvas.height) {
      throw new Error("PDF render produced an empty canvas");
    }

    // Initialize jsPDF in A4 with correct orientation
    const pdf = new jsPDF({
      orientation: isLandscape ? "landscape" : "portrait",
      unit: "mm",
      format: "a4",
    });

    const a4Aspect = pdfHeight / pdfWidth;
    const pageHeightPx = Math.floor(canvas.width * a4Aspect);

    // 1. If note content fits on 1 full page (common for tables/notes), render on single page without any cuts
    if (canvas.height <= pageHeightPx) {
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeightPx;
      const ctx = pageCanvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
        ctx.drawImage(canvas, 0, 0);
      }
      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(pageImgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    } else {
      // 2. Multi-page document: slice at natural blank whitespace rows so no text, headings, or table rows are ever cut
      const canvasCtx = canvas.getContext("2d");
      let currentY = 0;
      let pageNum = 0;

      while (currentY < canvas.height) {
        if (pageNum > 0) {
          pdf.addPage("a4", isLandscape ? "landscape" : "portrait");
        }

        const remainingHeight = canvas.height - currentY;
        let sliceHeight = Math.min(pageHeightPx, remainingHeight);

        // Scan upwards from target cutoff for a solid band of whitespace between paragraphs/sections/tables
        if (remainingHeight > pageHeightPx && canvasCtx) {
          const minSlice = Math.floor(pageHeightPx * 0.70);
          const targetY = currentY + pageHeightPx;
          const searchStartX = Math.floor(canvas.width * 0.05);
          const searchEndX = Math.floor(canvas.width * 0.95);
          const sampleStep = 8;

          let consecutiveWhiteRows = 0;
          let bestSplitY = targetY;

          for (let y = targetY; y >= currentY + minSlice; y--) {
            const rowData = canvasCtx.getImageData(searchStartX, y, searchEndX - searchStartX, 1).data;
            let isRowWhite = true;

            for (let i = 0; i < rowData.length; i += sampleStep * 4) {
              const r = rowData[i];
              const g = rowData[i + 1];
              const b = rowData[i + 2];
              const a = rowData[i + 3];
              if (a > 20 && (r < 248 || g < 248 || b < 248)) {
                isRowWhite = false;
                break;
              }
            }

            if (isRowWhite) {
              consecutiveWhiteRows++;
              if (consecutiveWhiteRows >= 6) {
                bestSplitY = y + 3;
                break;
              }
            } else {
              consecutiveWhiteRows = 0;
            }
          }

          sliceHeight = bestSplitY - currentY;
        }

        const pageCanvas = document.createElement("canvas");
        pageCanvas.width = canvas.width;
        pageCanvas.height = pageHeightPx;
        const pageCtx = pageCanvas.getContext("2d");
        if (pageCtx) {
          pageCtx.fillStyle = "#FFFFFF";
          pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
          pageCtx.drawImage(
            canvas,
            0,
            currentY,
            canvas.width,
            sliceHeight,
            0,
            0,
            canvas.width,
            sliceHeight
          );
        }

        const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
        pdf.addImage(pageImgData, "JPEG", 0, 0, pdfWidth, pdfHeight);

        currentY += sliceHeight;
        pageNum++;
      }
    }

    pdf.save(`${safeTitle}.pdf`);
    hideLoading();
    message.success("PDF downloaded directly successfully");
  } catch (err: any) {
    document.querySelectorAll("[data-pdf-export-root]").forEach((node) => node.remove());
    hideLoading();
    console.error("PDF download error:", err);
    message.error("Failed to generate PDF download");
  }
};

/**
 * Export Note to Word (.doc) with 100% exact visual fidelity (highlighters, font colors,
 * boxes, callouts, tables, sub-notes, attachments) and calls the backend download API with format=word.
 */
export const exportNoteToWord = async (note: Note): Promise<void> => {
  const safeTitle = (note.title || "Note").replace(/[/\\?%*:|"<>]/g, "_");
  const hideLoading = message.loading("Preparing Word document download...", 0);

  try {
    const exportDescription = prepareNoteDescriptionForExport(note);
    const isLandscape = note.rotation === 90 || note.rotation === 270;

    const isHorizontal = note.isVertical === false;
    const firstRowMatch = exportDescription.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
    let colCount = 0;
    if (firstRowMatch) {
      const cells = firstRowMatch[1].match(/<t[dh][^>]*>/gi);
      colCount = cells ? cells.length : 0;
    }
    const isWide = isHorizontal || colCount > 3;
    let pageWidthPt = isWide ? 841.9 : 595.3;
    let pageHeightPt = isWide ? 595.3 : 841.9;
    if (colCount > 5) {
      pageWidthPt = Math.max(841.9, colCount * 135 + 72);
    }

    const wordDocHtml = `
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <!--[if gte mso 9]>
        <xml>
          <w:WordDocument>
            <w:View>Print</w:View>
            <w:Zoom>100</w:Zoom>
            <w:DoNotOptimizeForBrowser/>
          </w:WordDocument>
        </xml>
        <![endif]-->
        <title>${note.title || "Note"}</title>
        <style>
          @page Section1 {
            size: ${isLandscape || isWide ? `${pageWidthPt}pt ${pageHeightPt}pt` : "595.3pt 841.9pt"};
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
            mso-page-orientation: ${isLandscape ? "landscape" : "portrait"};
            mso-paper-source: 0;
          }
          div.Section1 { page: Section1; }
          body {
            font-family: 'Segoe UI', Calibri, Arial, Helvetica, sans-serif;
            font-size: 11pt;
            line-height: 1.6;
            color: #1E293B;
            background-color: #FFFFFF;
          }
          h1, h2, h3, h4, h5, h6 {
            color: #1E293B;
            font-family: 'Segoe UI', Calibri, Arial, sans-serif;
            margin-top: 14pt;
            margin-bottom: 6pt;
          }
          h1 {
            color: #1E293B;
            font-size: 18pt;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 0;
          }
          p { margin-top: 0; margin-bottom: 8pt; line-height: 1.6; }
          .desc-container {
            border: 1.5pt solid #CBD5E1;
            margin-bottom: 18pt;
          }
          .desc-header {
            padding: 9pt 14pt;
            background-color: #F8FAFC;
            border-bottom: 1.5pt solid #CBD5E1;
            font-size: 9.5pt;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
          }
          .desc-body {
            padding: 16pt 18pt;
            font-size: 11pt;
            line-height: 1.65;
            color: #1E293B;
            background-color: #FFFFFF;
          }
          mark, span[style*="background-color"] {
            padding: 2pt 4pt;
            border-radius: 2pt;
          }
          .notes-inline-quote,
          blockquote {
            display: inline-block;
            width: fit-content;
            max-width: 100%;
            border-left: 3pt solid #4318FF;
            background-color: #F4F1FF;
            padding: 2pt 8pt;
            margin: 4pt 0;
            font-style: italic;
            color: #475569;
          }
          pre, code {
            font-family: 'Consolas', 'Courier New', monospace;
            background-color: #F1F5F9;
            padding: 3pt 6pt;
            border-radius: 3pt;
            font-size: 10pt;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin: 12pt 0;
            table-layout: fixed;
            mso-table-layout-alt: fixed;
          }
          table th, table td {
            border: 1pt solid #CBD5E1;
            padding: 6pt 8pt;
            text-align: left;
            vertical-align: middle;
            font-size: 11pt;
            font-family: Arial, sans-serif;
            color: #334155;
            word-break: break-word;
          }
          /* Preserve inlined email/table theme colors (do not force gray header fill) */
          table th {
            font-weight: bold;
            color: #1E293B;
          }
          table th.excel-sl-col, table td.excel-sl-col {
            width: 44px;
            text-align: center;
            background-color: #F1F5F9;
            color: #475569;
            font-weight: bold;
          }
          th.excel-attachment-col, td.excel-attachment-cell {
            width: 260px;
            min-width: 220px;
            white-space: normal;
            word-break: break-word;
          }
          .table-file-badge {
            display: block;
            background-color: #F1F5F9;
            border: 1pt solid #CBD5E1;
            padding: 4pt 6pt;
            border-radius: 4pt;
            font-size: 9pt;
            color: #334155;
            margin: 2pt 0;
            width: 100%;
            box-sizing: border-box;
            overflow: visible;
            white-space: normal;
            word-break: break-word;
          }
          .table-file-name {
            white-space: normal !important;
            overflow: visible !important;
            word-break: break-word !important;
            line-height: 1.4;
          }
          .table-file-btn.remove,
          .row-attach-add-btn,
          .row-attach-upload-btn {
            display: none !important;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <h1 style="font-family:Arial,sans-serif;font-size:24px;font-weight:bold;color:#0f172a;line-height:1.3;margin:0 0 12pt 0;">${note.title || "Untitled Note"}</h1>
          <div class="note-content" style="font-family:Arial,sans-serif;font-size:14.5px;line-height:1.8;color:#1e293b;margin-top:12pt;">
            ${exportDescription}
          </div>
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(["\ufeff", wordDocHtml], {
      type: "application/msword;charset=utf-8",
    });
    const link = document.createElement("a");
    link.href = window.URL.createObjectURL(blob);
    link.download = `${safeTitle}.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
    hideLoading();
    message.success("Word document downloaded directly successfully");
  } catch (err: any) {
    hideLoading();
    console.error("Word export error:", err);
    message.error("Failed to export Word document");
  }
};

/**
 * Flatten copied/pasted note HTML so we don't paste nested A4 .page shells
 * (that creates the double-page layout).
 */
export const sanitizeNoteHtmlForClipboard = (html?: string): string => {
  if (!html || !html.trim()) return "";
  const parsed = new DOMParser().parseFromString(html, "text/html");
  parsed
    .querySelectorAll(
      ".a4-page-workspace, .a4-page-rotator, .a4-page, .excel-workbook-store"
    )
    .forEach((el) => {
      const parent = el.parentNode;
      if (!parent) return;
      while (el.firstChild) parent.insertBefore(el.firstChild, el);
      el.remove();
    });

  const pages = Array.from(parsed.body.querySelectorAll(".page"));
  if (pages.length > 0) {
    return pages
      .map((page) => page.innerHTML.trim())
      .filter(Boolean)
      .join("");
  }
  return parsed.body.innerHTML.trim();
};

const isEditorManagedTable = (table: HTMLTableElement) =>
  Boolean(
    table.querySelector(
      ".excel-sl-col, .excel-attachment-col, .excel-attachment-cell, .row-attach-container, .table-file-badge"
    )
  );

/** Strip width locks that clip Outlook/Gmail tables inside A4. */
const relaxPastedTableConstraints = (table: HTMLTableElement) => {
  table.classList.add("note-wide-table");
  table.removeAttribute("width");
  table.style.removeProperty("width");
  table.style.removeProperty("max-width");
  table.style.removeProperty("min-width");
  table.style.removeProperty("table-layout");
  table.querySelectorAll<HTMLElement>("col, colgroup, th, td").forEach((el) => {
    el.removeAttribute("width");
    el.style.removeProperty("width");
    el.style.removeProperty("max-width");
    el.style.removeProperty("min-width");
  });
};

/**
 * Wrap wide / pasted tables so they can scroll horizontally inside the A4 page
 * instead of being clipped (production email paste issue).
 */
export const wrapWideTablesInRoot = (root: HTMLElement | null | undefined) => {
  if (!root) return;
  root.querySelectorAll("table").forEach((tableEl) => {
    const table = tableEl as HTMLTableElement;
    if (isEditorManagedTable(table)) return;
    if (table.closest(".note-table-scroll")) {
      relaxPastedTableConstraints(table);
      return;
    }
    const colCount = table.rows[0]?.cells.length || 0;
    // Always scroll-wrap pasted/email tables; also wrap any wide table
    const shouldWrap =
      table.classList.contains("note-wide-table") ||
      colCount >= 4 ||
      table.querySelector("colgroup, col") !== null;

    relaxPastedTableConstraints(table);
    if (!shouldWrap && colCount < 3) return;

    const wrap = document.createElement("div");
    wrap.className = "note-table-scroll";
    wrap.setAttribute("contenteditable", "false");
    table.parentNode?.insertBefore(wrap, table);
    // Inner editable host so users can still edit cell text
    const inner = document.createElement("div");
    inner.className = "note-table-scroll-inner";
    inner.setAttribute("contenteditable", "true");
    wrap.appendChild(inner);
    inner.appendChild(table);
  });
};

/** Join "I\\nN\\nF\\nO" style clipboard garbage into normal text. */
export const collapseVerticalCharPaste = (text: string): string => {
  if (!text) return "";
  const lines = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  if (lines.length < 6) return text;
  const single = lines.filter((l) => l.length <= 1).length;
  if (single / lines.length < 0.55) return text;
  // Mostly one char per line → join; keep blank lines as paragraph breaks
  const joined: string[] = [];
  let buf = "";
  for (const line of lines) {
    if (line.length === 0) {
      if (buf) joined.push(buf);
      buf = "";
      joined.push("");
    } else if (line.length === 1) {
      buf += line;
    } else {
      if (buf) {
        joined.push(buf);
        buf = "";
      }
      joined.push(line);
    }
  }
  if (buf) joined.push(buf);
  return joined.join("\n");
};

export const plainTextToPasteHtml = (plain: string): string => {
  const normalized = collapseVerticalCharPaste(plain);
  if (!normalized.trim()) return "";
  return normalized
    .split(/\n{2,}/)
    .map((block) => {
      const lines = block
        .split("\n")
        .map((line) => line.replace(/</g, "&lt;").replace(/>/g, "&gt;"))
        .join("<br>");
      return `<p style="display:block;width:100%;max-width:100%;margin:0 0 0.4em;clear:both;">${
        lines || "<br>"
      }</p>`;
    })
    .join("");
};

/** True when HTML is mostly tiny spans/divs (causes vertical overlap beside tables). */
const isFragmentedPasteHtml = (root: ParentNode): boolean => {
  const els = Array.from(root.querySelectorAll("span, div, p, font, b, i")).slice(0, 400);
  if (els.length < 12) return false;
  let tiny = 0;
  els.forEach((el) => {
    const t = (el.textContent || "").replace(/\s+/g, "");
    if (t.length > 0 && t.length <= 2 && el.children.length === 0) tiny += 1;
  });
  return tiny / els.length > 0.45;
};

/** Strip chat/Word layout styles that clip pasted text or stack it beside tables. */
const normalizePastedLayoutStyles = (root: ParentNode) => {
  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.removeProperty("margin-left");
    el.style.removeProperty("margin-right");
    el.style.removeProperty("padding-left");
    el.style.removeProperty("padding-right");
    el.style.removeProperty("text-indent");
    el.style.removeProperty("transform");
    el.style.removeProperty("left");
    el.style.removeProperty("right");
    el.style.removeProperty("top");
    el.style.removeProperty("bottom");
    el.style.removeProperty("position");
    el.style.removeProperty("float");
    el.style.removeProperty("max-width");
    el.style.removeProperty("min-width");
    el.style.removeProperty("writing-mode");
    el.style.removeProperty("column-count");
    el.style.removeProperty("column-width");
    el.style.removeProperty("columns");
    el.style.removeProperty("flex");
    el.style.removeProperty("flex-direction");
    el.style.removeProperty("grid-template-columns");
    const display = (el.style.display || "").toLowerCase();
    if (
      display.includes("flex") ||
      display.includes("grid") ||
      display === "inline-block" ||
      display === "inline"
    ) {
      if (!["SPAN", "A", "B", "I", "STRONG", "EM", "U", "S", "CODE", "LABEL"].includes(el.tagName)) {
        el.style.display = "block";
      } else {
        el.style.removeProperty("display");
      }
    }
    const w = el.style.width;
    if (w && (w.includes("px") || w.includes("vw") || w.includes("%") || parseFloat(w) > 0)) {
      // Tiny widths force one-char-per-line wrapping beside tables
      const px = parseFloat(w);
      if (w.includes("%") || px > 100 || px < 40) {
        el.style.removeProperty("width");
      }
    }
    el.style.maxWidth = "100%";
    if (["DIV", "P", "SECTION", "ARTICLE", "LI"].includes(el.tagName)) {
      el.style.clear = "both";
    }
    if (el.tagName === "PRE" || el.tagName === "CODE") {
      el.style.whiteSpace = "pre-wrap";
      el.style.wordBreak = "break-word";
      el.style.maxWidth = "100%";
    }
  });
};

/**
 * Prepare HTML pasted from email/Word/Outlook/chat for the note editor:
 * unwrap A4 shells, keep full tables, strip layout that clips text.
 * Pass plainText to fall back when HTML is fragmented (avoids vertical overlap).
 */
export const preparePastedHtmlForNote = (html?: string, plainText?: string): string => {
  if (!html || !html.trim()) return "";
  const flat = sanitizeNoteHtmlForClipboard(html);
  if (!flat) return "";

  const parsed = new DOMParser().parseFromString(flat, "text/html");
  // Drop scripts / Word conditional noise that can truncate paste
  parsed.querySelectorAll("script, style, meta, link").forEach((el) => el.remove());

  // Fragmented / OCR-style HTML → use plain text so it lays out neatly with tables
  if (plainText && isFragmentedPasteHtml(parsed.body)) {
    return plainTextToPasteHtml(plainText);
  }

  normalizePastedLayoutStyles(parsed.body);

  parsed.querySelectorAll("table").forEach((tableEl) => {
    const table = tableEl as HTMLTableElement;
    if (isEditorManagedTable(table)) return;
    relaxPastedTableConstraints(table);
    if (table.closest(".note-table-scroll")) return;

    const wrap = parsed.createElement("div");
    wrap.className = "note-table-scroll";
    wrap.setAttribute("contenteditable", "false");
    wrap.setAttribute(
      "style",
      "display:block;width:100%;max-width:100%;clear:both;margin:0.5em 0;"
    );
    const inner = parsed.createElement("div");
    inner.className = "note-table-scroll-inner";
    inner.setAttribute("contenteditable", "true");
    table.parentNode?.insertBefore(wrap, table);
    wrap.appendChild(inner);
    inner.appendChild(table);
  });

  return parsed.body.innerHTML.trim();
};

export const copyNoteContentToClipboard = async (
  htmlContent?: string
): Promise<void> => {
  if (!htmlContent || !htmlContent.trim()) {
    message.info("No content to copy");
    return;
  }

  try {
    // Copy inner content only — not outer .page / A4 wrappers
    const fullHtml = sanitizeNoteHtmlForClipboard(htmlContent);

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = fullHtml;
    const textContent = tempDiv.innerText || tempDiv.textContent || "";

    if (navigator.clipboard && window.ClipboardItem) {
      const textBlob = new Blob([textContent], { type: "text/plain" });
      const htmlBlob = new Blob([fullHtml], { type: "text/html" });
      await navigator.clipboard.write([
        new ClipboardItem({
          "text/plain": textBlob,
          "text/html": htmlBlob,
        }),
      ]);
    } else {
      await navigator.clipboard.writeText(textContent);
    }
    message.success("Page copied to clipboard!");
  } catch (err) {
    // Fallback
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = sanitizeNoteHtmlForClipboard(htmlContent);
    const textContent = tempDiv.innerText || tempDiv.textContent || "";
    navigator.clipboard.writeText(textContent);
    message.success("Page copied to clipboard!");
  }
};

/** Dispatched on the editor DOM before bulk HTML mutations (e.g. Docling import). */
export const NOTE_EDITOR_CHECKPOINT_EVENT = "note-editor-checkpoint";

const INLINE_FILE_KEY_ATTR = "data-inline-file-key";

/** Convert a data:image URL into a File for MinIO upload. */
export const dataUrlToFile = (dataUrl: string, fileName?: string): File | null => {
  try {
    const match = /^data:([^;,]+)?(;base64)?,(.*)$/i.exec(dataUrl);
    if (!match) return null;
    const mime = (match[1] || "image/png").trim();
    const isBase64 = Boolean(match[2]);
    const data = match[3] || "";
    let bytes: Uint8Array;
    if (isBase64) {
      const binary = atob(data);
      bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    } else {
      const decoded = decodeURIComponent(data);
      bytes = new Uint8Array(decoded.length);
      for (let i = 0; i < decoded.length; i++) bytes[i] = decoded.charCodeAt(i);
    }
    const ext = mime.split("/")[1]?.split("+")[0] || "png";
    const name = fileName || `inline-image-${Date.now()}.${ext}`;
    const buffer = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;
    return new File([buffer], name, { type: mime });
  } catch {
    return null;
  }
};

export const getInlineImageFileKey = (img: HTMLImageElement): string | null => {
  const attr = img.getAttribute(INLINE_FILE_KEY_ATTR);
  if (attr) return attr;
  const src = img.getAttribute("src") || "";
  const match = /\/api\/notes\/attachments\/([^/?#]+)\/(?:view|download)/i.exec(src);
  return match?.[1] ? decodeURIComponent(match[1]) : null;
};

/**
 * Upload embedded data:image sources and normalize blob/preview srcs so saved
 * description HTML stays small (keys + view URLs instead of base64).
 */
export const rewriteInlineDataImagesInHtml = async (
  html: string,
  upload: (file: File) => Promise<string | null | undefined>,
  toPreviewUrl: (key: string) => string
): Promise<string> => {
  if (!html || !html.trim()) return html || "";
  const needsRewrite =
    /data:image\//i.test(html) ||
    html.includes("blob:") ||
    html.includes(INLINE_FILE_KEY_ATTR) ||
    /\/api\/notes\/attachments\//i.test(html);
  if (!needsRewrite) return html;

  const parsed = new DOMParser().parseFromString(html, "text/html");
  const images = Array.from(parsed.querySelectorAll("img"));
  let changed = false;

  for (const img of images) {
    const src = img.getAttribute("src") || "";
    const existingKey = getInlineImageFileKey(img);

    if (src.startsWith("data:image")) {
      const file = dataUrlToFile(src, img.getAttribute("alt") || undefined);
      if (!file) continue;
      const key = await upload(file);
      if (!key) continue;
      img.setAttribute(INLINE_FILE_KEY_ATTR, key);
      img.setAttribute("src", toPreviewUrl(key));
      changed = true;
      continue;
    }

    if (src.startsWith("blob:") && !existingKey) {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const ext = (blob.type.split("/")[1] || "png").split("+")[0];
        const file = new File(
          [blob],
          img.getAttribute("alt") || `inline-image-${Date.now()}.${ext}`,
          { type: blob.type || "image/png" }
        );
        const key = await upload(file);
        if (!key) continue;
        img.setAttribute(INLINE_FILE_KEY_ATTR, key);
        img.setAttribute("src", toPreviewUrl(key));
        changed = true;
        try {
          URL.revokeObjectURL(src);
        } catch {
          /* ignore */
        }
      } catch {
        /* leave blob src — save may still fail if not uploaded */
      }
      continue;
    }

    if (existingKey) {
      const canonical = toPreviewUrl(existingKey);
      if (img.getAttribute(INLINE_FILE_KEY_ATTR) !== existingKey) {
        img.setAttribute(INLINE_FILE_KEY_ATTR, existingKey);
        changed = true;
      }
      if (src.startsWith("blob:") || src !== canonical) {
        img.setAttribute("src", canonical);
        changed = true;
      }
    }
  }

  return changed ? parsed.body.innerHTML : html;
};

/**
 * Resolve authorized blob URLs for inline images that were saved as attachment keys.
 * Keeps data-inline-file-key so the next save can re-canonicalize srcs.
 */
export const hydrateInlineImagesInRoot = async (
  root: HTMLElement | null | undefined,
  fetchBlobUrl: (key: string, fileName?: string) => Promise<string | null>
): Promise<void> => {
  if (!root) return;
  const images = Array.from(root.querySelectorAll<HTMLImageElement>("img"));
  await Promise.all(
    images.map(async (img) => {
      const key = getInlineImageFileKey(img);
      if (!key) return;
      const src = img.getAttribute("src") || "";
      if (src.startsWith("blob:") || src.startsWith("data:")) return;
      try {
        const blobUrl = await fetchBlobUrl(key, img.getAttribute("alt") || undefined);
        if (blobUrl) {
          img.setAttribute(INLINE_FILE_KEY_ATTR, key);
          img.src = blobUrl;
        }
      } catch {
        // leave preview URL — may still work if cookies auth the view route
      }
    })
  );
};

/**
 * Wrap pasted/inline screenshots so edit mode can show a remove (X) control.
 * Skips Docling page images and images already wrapped.
 */
export const wrapNoteInlineImages = (root: HTMLElement | null | undefined) => {
  if (!root) return;
  const images = Array.from(
    root.querySelectorAll<HTMLImageElement>("img:not(.docling-page-image)")
  );
  images.forEach((img) => {
    if (img.closest(".note-inline-image")) return;
    const wrap = document.createElement("span");
    wrap.className = "note-inline-image";
    wrap.setAttribute("contenteditable", "false");
    const removeBtn = document.createElement("button");
    removeBtn.type = "button";
    removeBtn.className = "note-inline-image-remove";
    removeBtn.setAttribute("data-image-action", "remove");
    removeBtn.setAttribute("title", "Remove screenshot");
    removeBtn.setAttribute("aria-label", "Remove screenshot");
    removeBtn.textContent = "×";
    img.parentNode?.insertBefore(wrap, img);
    wrap.appendChild(img);
    wrap.appendChild(removeBtn);
  });
};

/**
 * Remove edit-only attach controls from note HTML.
 * Keeps file badges (name + preview/download) so View mode matches Edit.
 */
export const stripAttachmentUiFromHtml = (html?: string): string => {
  if (!html || !html.trim()) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  tempDiv
    .querySelectorAll(
      ".row-attach-upload-btn, .row-attach-add-btn, .row-attach-loading, .table-file-btn.remove, .note-inline-image-remove"
    )
    .forEach((el) => el.remove());
  // Unwrap note-inline-image spans so saved/view HTML stays clean
  tempDiv.querySelectorAll(".note-inline-image").forEach((wrap) => {
    const parent = wrap.parentNode;
    if (!parent) return;
    while (wrap.firstChild) parent.insertBefore(wrap.firstChild, wrap);
    parent.removeChild(wrap);
  });
  return tempDiv.innerHTML;
};

/**
 * Plain-text snippet for lists/send preview — exclude attachment chip labels
 * so file names are not mistaken for the note description.
 */
export const getCleanDescriptionSnippet = (html?: string, maxLength: number = 75): string => {
  if (!html || !html.trim()) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  tempDiv
    .querySelectorAll(
      ".table-file-badge, .row-attach-upload-btn, .row-attach-add-btn, .row-attach-loading, .row-attach-container"
    )
    .forEach((el) => el.remove());
  const text = (tempDiv.innerText || tempDiv.textContent || "").replace(/\s+/g, " ").trim();
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + "...";
};

export interface SendNotePayload {
  noteId: number;
  recipientEmail: string;
  recipients?: string[];
  subject: string;
  customMessage?: string;
  includeDescription: boolean;
  includeFiles: boolean;
  hasDocument?: boolean;
  hasDescription?: boolean;
  selectedAttachmentKeys?: string[];
  attachmentKeys?: string[];
  permission?: string;
  permissions?: string[];
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  /** Deliver into Worksphere Inbox (application) */
  sendToInbox?: boolean;
  /** Also send email notification */
  sendToEmail?: boolean;
}

/**
 * Send Note and attachments via email/notification API with graceful client fallback.
 */
export const sendNoteContent = async (payload: SendNotePayload): Promise<boolean> => {
  try {
    const recipientsList =
      payload.recipients ||
      payload.recipientEmail
        .split(/[,;\s]+/)
        .map((s) => s.trim())
        .filter(Boolean);

    const hasDoc = payload.hasDocument !== undefined ? payload.hasDocument : payload.includeFiles;
    const hasDesc = payload.hasDescription !== undefined ? payload.hasDescription : payload.includeDescription;

    const body = {
      ...payload,
      recipients: recipientsList,
      to: recipientsList[0] || payload.recipientEmail,
      email: recipientsList[0] || payload.recipientEmail,
      permission: payload.permission,
      permissions: payload.permissions,
      canView: payload.canView,
      canEdit: payload.canEdit,
      canDelete: payload.canDelete,
      hasDocument: hasDoc,
      hasDescription: hasDesc,
      includeFiles: hasDoc,
      includeDescription: hasDesc,
      attachmentKeys: payload.selectedAttachmentKeys || payload.attachmentKeys || [],
      sendToInbox: payload.sendToInbox !== false,
      sendToEmail: payload.sendToEmail !== false,
    };
    await axios.post(`/api/notes/${payload.noteId}/send`, body);
    return true;
  } catch (err) {
    console.warn("Backend send API error:", err);
    throw err;
  }
};

export interface DirectoryEmployee {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  designation: string;
}

/** Empty/omitted search returns all active employees (backend Get All / Select All). */
export const searchEmployeeDirectory = async (search?: string): Promise<DirectoryEmployee[]> => {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    const qs = params.toString();
    const res = await axios.get<DirectoryEmployee[]>(
      `/api/employee-details/search-directory${qs ? `?${qs}` : ''}`,
      {
        headers: { 'x-skip-loader': 'true' },
      }
    );
    return res.data || [];
  } catch (error) {
    console.error('Error searching employee directory:', error);
    return [];
  }
};


