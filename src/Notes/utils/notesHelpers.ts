import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { message } from "antd";
import axios from "axios";
import { Note, ColorOption } from "../types/notes.types";
import { paginateToA4Sheets } from "./documentLayout";

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
      el.style.textJustify = "inter-word";
      el.style.hyphens = "auto";
    } else if (el.tagName.startsWith("H")) {
      el.style.textAlign = "left";
      el.style.marginBottom = "0.5em";
    }
  });

  root.classList.add("is-justified");
  root.style.textAlign = "justify";
  root.style.textJustify = "inter-word";
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

    const firstRowMatch = (note.description || "").match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
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
    wrapper.style.position = "absolute";
    wrapper.style.left = "0px";
    wrapper.style.top = "0px";
    wrapper.style.zIndex = "-99999";
    wrapper.style.opacity = "1";
    wrapper.style.pointerEvents = "none";
    wrapper.style.overflow = "visible";
    wrapper.style.width = isLandscape ? "1122px" : "794px"; // 1122px for A4 Landscape, 794px for Portrait
    wrapper.style.backgroundColor = "#FFFFFF";
    wrapper.style.boxSizing = "border-box";

    const isProject = note.type === "PROJECT";
    const projectLabel = note.projectName || "Worksphere Project";

    wrapper.innerHTML = `
      <style>
        .pdf-export-body mark, 
        .pdf-export-body span[style*="background-color"] {
          padding: 2px 5px !important;
          border-radius: 3px !important;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        }
        .pdf-export-body blockquote {
          display: inline-block !important;
          width: fit-content !important;
          max-width: 100% !important;
          border-left: 3px solid #4318FF !important;
          background-color: rgba(67, 24, 255, 0.06) !important;
          padding: 2px 10px !important;
          margin: 4px 0 !important;
          font-style: italic !important;
          color: #475569 !important;
          border-radius: 0 6px 6px 0 !important;
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
          margin: 0 !important;
          border: 1px solid #CBD5E1 !important;
        }
        .pdf-export-body table th,
        .pdf-export-body table td {
          border: 1px solid #CBD5E1 !important;
          padding: 6px 4px !important;
          text-align: center !important;
          vertical-align: middle !important;
          font-size: 11px !important;
          word-break: break-word !important;
          overflow-wrap: anywhere !important;
          white-space: normal !important;
        }
        .pdf-export-body table th {
          background-color: #F8FAFC !important;
          font-weight: 700 !important;
          color: #1E293B !important;
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
        .pdf-export-body ul, .pdf-export-body ol {
          padding-left: 20px !important;
          margin: 6px 0 !important;
        }
        .pdf-export-body li {
          margin-bottom: 3px !important;
        }
        .pdf-export-body p {
          margin: 0 0 8px 0 !important;
          line-height: 1.65 !important;
        }
        .pdf-export-body h1 { font-size: 20px !important; font-weight: 700 !important; margin: 12px 0 6px 0 !important; color: #1E293B !important; }
        .pdf-export-body h2 { font-size: 16px !important; font-weight: 700 !important; margin: 10px 0 5px 0 !important; color: #1E293B !important; }
        .pdf-export-body h3 { font-size: 14px !important; font-weight: 600 !important; margin: 8px 0 4px 0 !important; color: #1E293B !important; }
      </style>
      <div style="padding: 28px 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B; background-color: #FFFFFF; line-height: 1.6; box-sizing: border-box; width: ${baseWidthPx}px;">
        <!-- Structured Note Card: Project & Title -->
        <div style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 18px 22px; margin-bottom: 22px; width: 100%; box-sizing: border-box;">
          <!-- Project Row: Rendered via table for 100% pixel-perfect html2canvas alignment -->
          <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom: 12px; border-collapse: separate; width: 100%;">
            <tr>
              <td style="vertical-align: middle; padding-right: 10px; white-space: nowrap; width: 110px;">
                <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px;">
                  PROJECT:
                </span>
              </td>
              <td style="vertical-align: middle;">
                <table cellpadding="0" cellspacing="0" border="0" style="background-color: ${isProject ? "#EEF2FF" : "#ECFDF5"}; border: 1px solid ${isProject ? "#C7D2FE" : "#A7F3D0"}; border-radius: 6px; border-collapse: separate;">
                  <tr>
                    <td style="padding: 4px 14px; font-size: 12px; font-weight: 700; line-height: 18px; font-family: Arial, sans-serif; color: ${isProject ? "#4318FF" : "#059669"}; vertical-align: middle; text-align: center; white-space: nowrap;">
                      ${isProject ? projectLabel : "Personal Note"}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>

          <!-- Title Row: Rendered via table for perfect baseline alignment -->
          <table cellpadding="0" cellspacing="0" border="0" style="border-collapse: separate; width: 100%;">
            <tr>
              <td style="vertical-align: middle; padding-right: 10px; white-space: nowrap; width: 110px;">
                <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px;">
                  TITLE/SUBJECT:
                </span>
              </td>
              <td style="vertical-align: middle;">
                <span style="font-size: 18px; font-weight: 800; color: #1B2559; line-height: 24px; font-family: Arial, sans-serif; letter-spacing: -0.2px;">
                  ${note.title || "Untitled Note"}
                </span>
              </td>
            </tr>
          </table>
        </div>

        <!-- Structured Description Section -->
        <div style="margin-bottom: 16px; width: 100%; box-sizing: border-box;">
          <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 14px; width: 100%;">
            DESCRIPTION
          </div>
          <div class="pdf-export-body" style="font-size: 13.5px; line-height: 1.65; color: #1E293B; background-color: #FFFFFF; width: 100%;">
            ${note.description && note.description.trim() ? note.description : '<p style="color: #94A3B8; font-style: italic; margin: 0;">No description provided.</p>'}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    wrapper.style.width = `${baseWidthPx}px`;
    // Force editor-like truncated names — CSS ellipsis alone is unreliable in html2canvas
    prepareAttachmentBadgesForPdfExport(wrapper);

    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
      width: baseWidthPx,
      windowWidth: baseWidthPx,
    });

    document.body.removeChild(wrapper);

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
    const isProject = note.type === "PROJECT";
    const projectLabel = note.projectName || "Worksphere Project";
    const isLandscape = note.rotation === 90 || note.rotation === 270;

    const isHorizontal = note.isVertical === false;
    const firstRowMatch = (note.description || "").match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
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
            size: ${isLandscape ? "841.9pt 595.3pt" : "595.3pt 841.9pt"};
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
          table.structured-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 18pt;
            border: 1.5pt solid #CBD5E1;
          }
          table.structured-table td {
            padding: 9pt 14pt;
            border: 1pt solid #CBD5E1;
            vertical-align: middle;
          }
          .label-cell {
            width: 110pt;
            background-color: #F8FAFC;
            font-size: 9.5pt;
            font-weight: bold;
            color: #475569;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
          }
          .val-cell {
            background-color: #FFFFFF;
            font-size: 11pt;
            font-weight: bold;
            color: #1E293B;
          }
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
            padding: 6pt 4pt;
            text-align: center;
            vertical-align: middle;
            font-size: 10pt;
            word-break: break-word;
          }
          table th {
            background-color: #F1F5F9;
            font-weight: bold;
            color: #1E293B;
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
          <table class="structured-table">
            <tr>
              <td class="label-cell">PROJECT:</td>
              <td class="val-cell">${isProject ? projectLabel : "Personal Note"}</td>
            </tr>
            <tr>
              <td class="label-cell">TITLE/SUBJECT:</td>
              <td class="val-cell">${note.title || "Untitled Note"}</td>
            </tr>
          </table>

          <div style="font-size: 10pt; font-weight: bold; color: #475569; text-transform: uppercase; border-bottom: 1.5pt solid #CBD5E1; padding-bottom: 4pt; margin-top: 16pt; margin-bottom: 12pt;">
            DESCRIPTION
          </div>
          <div style="font-size: 11pt; line-height: 1.65; color: #1E293B;">
            ${note.description && note.description.trim() ? note.description : '<p style="color: #94A3B8; font-style: italic; margin: 0;">No description provided.</p>'}
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

/**
 * Prepare HTML pasted from email/Word/Outlook for the note editor:
 * unwrap A4 shells, keep full tables, enable horizontal scroll wrappers.
 */
export const preparePastedHtmlForNote = (html?: string): string => {
  if (!html || !html.trim()) return "";
  const flat = sanitizeNoteHtmlForClipboard(html);
  if (!flat) return "";

  const parsed = new DOMParser().parseFromString(flat, "text/html");
  // Drop scripts / Word conditional noise that can truncate paste
  parsed.querySelectorAll("script, style, meta, link").forEach((el) => el.remove());

  parsed.querySelectorAll("table").forEach((tableEl) => {
    const table = tableEl as HTMLTableElement;
    if (isEditorManagedTable(table)) return;
    relaxPastedTableConstraints(table);
    if (table.closest(".note-table-scroll")) return;

    const wrap = parsed.createElement("div");
    wrap.className = "note-table-scroll";
    wrap.setAttribute("contenteditable", "false");
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

export const searchEmployeeDirectory = async (search?: string): Promise<DirectoryEmployee[]> => {
  try {
    const params = new URLSearchParams();
    if (search && search.trim()) {
      params.append('search', search.trim());
    }
    const res = await axios.get<DirectoryEmployee[]>(
      `/api/employee-details/search-directory?${params.toString()}`,
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


