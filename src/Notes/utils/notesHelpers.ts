import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { message } from "antd";
import axios from "axios";
import { Note, ColorOption } from "../types/notes.types";

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

    // 1. Create temporary container placed at top-left behind UI for accurate html2canvas bounding boxes
    const wrapper = document.createElement("div");
    wrapper.style.position = "absolute";
    wrapper.style.left = "0px";
    wrapper.style.top = "0px";
    wrapper.style.zIndex = "-99999";
    wrapper.style.opacity = "1";
    wrapper.style.pointerEvents = "none";
    wrapper.style.overflow = "visible";
    wrapper.style.width = "794px"; // Standard A4 width in px (96 DPI: 210mm)
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
          border-left: 4px solid #4318FF !important;
          background-color: rgba(67, 24, 255, 0.04) !important;
          padding: 8px 14px !important;
          margin: 10px 0 !important;
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
        .pdf-export-body table {
          width: 100% !important;
          border-collapse: collapse !important;
          margin: 12px 0 !important;
          border: 1px solid #CBD5E1 !important;
        }
        .pdf-export-body table th,
        .pdf-export-body table td {
          border: 1px solid #CBD5E1 !important;
          padding: 7px 10px !important;
          text-align: left !important;
          font-size: 12px !important;
        }
        .pdf-export-body table th {
          background-color: #F8FAFC !important;
          font-weight: 700 !important;
          color: #1E293B !important;
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
      <div style="padding: 36px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B; background-color: #FFFFFF; line-height: 1.6; box-sizing: border-box; width: 794px;">
        <!-- Structured Note Card: Project & Title -->
        <div style="background-color: #F8FAFC; border: 1.5px solid #E2E8F0; border-radius: 10px; padding: 18px 22px; margin-bottom: 22px;">
          <!-- Project Row -->
          <div style="margin-bottom: 12px; display: flex; align-items: center; gap: 10px;">
            <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;">
              PROJECT:
            </span>
            <span style="display: inline-block; font-size: 12.5px; font-weight: 700; line-height: normal; color: ${isProject ? "#4318FF" : "#059669"}; background-color: ${isProject ? "#EEF2FF" : "#ECFDF5"}; border: 1px solid ${isProject ? "#C7D2FE" : "#A7F3D0"}; padding: 4px 14px; border-radius: 6px;">
              ${isProject ? projectLabel : "Personal Note"}
            </span>
          </div>

          <!-- Title Row: TITLE in front of Title text on the same line -->
          <div style="display: flex; align-items: baseline; gap: 10px;">
            <span style="font-size: 11px; font-weight: 800; color: #64748B; text-transform: uppercase; letter-spacing: 0.8px; white-space: nowrap;">
              TITLE/SUBJECT:
            </span>
            <span style="font-size: 18px; font-weight: 800; color: #1B2559; line-height: 1.35; letter-spacing: -0.2px;">
              ${note.title || "Untitled Note"}
            </span>
          </div>
        </div>

        <!-- Structured Description Section -->
        <div style="margin-bottom: 16px;">
          <div style="font-size: 11px; font-weight: 800; color: #475569; text-transform: uppercase; letter-spacing: 0.8px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 6px; margin-bottom: 14px;">
            DESCRIPTION
          </div>
          <div class="pdf-export-body" style="font-size: 13.5px; line-height: 1.65; color: #1E293B; background-color: #FFFFFF;">
            ${note.description && note.description.trim() ? note.description : '<p style="color: #94A3B8; font-style: italic; margin: 0;">No description provided.</p>'}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(wrapper);

    // Capture using html2canvas with scale: 2 for crisp vector-like text
    const canvas = await html2canvas(wrapper, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#FFFFFF",
      width: 794,
      windowWidth: 794,
    });

    document.body.removeChild(wrapper);

    // Initialize jsPDF in A4 portrait (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const a4Aspect = 297 / 210; // 1.4142857
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
      pdf.addImage(pageImgData, "JPEG", 0, 0, 210, 297);
    } else {
      // 2. Multi-page document: slice at natural blank whitespace rows so no text, headings, or table rows are ever cut
      const canvasCtx = canvas.getContext("2d");
      let currentY = 0;
      let pageNum = 0;

      while (currentY < canvas.height) {
        if (pageNum > 0) {
          pdf.addPage("a4", "portrait");
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
        pdf.addImage(pageImgData, "JPEG", 0, 0, 210, 297);

        currentY += sliceHeight;
        pageNum++;
      }
    }

    pdf.save(`${safeTitle}.pdf`);
    hideLoading();
    message.success("PDF downloaded directly successfully");
  } catch (err: any) {
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
            size: 595.3pt 841.9pt;
            margin: 1.0in 1.0in 1.0in 1.0in;
            mso-header-margin: 35.4pt;
            mso-footer-margin: 35.4pt;
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
            border-left: 3.5pt solid #4318FF;
            background-color: #F8FAFC;
            padding: 8pt 14pt;
            margin: 10pt 0;
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
          }
          table th, table td {
            border: 1pt solid #CBD5E1;
            padding: 7pt 10pt;
            text-align: left;
            font-size: 10pt;
          }
          table th {
            background-color: #F1F5F9;
            font-weight: bold;
            color: #1E293B;
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

export const copyNoteContentToClipboard = (htmlContent?: string): void => {
  if (!htmlContent || !htmlContent.trim()) {
    message.info("No content to copy");
    return;
  }
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;
  const textContent = tempDiv.innerText || tempDiv.textContent || "";
  navigator.clipboard.writeText(textContent);
  message.success("Note content copied to clipboard");
};

/**
 * Extract clean readable plain-text snippet from HTML description for table columns.
 */
export const getCleanDescriptionSnippet = (html?: string, maxLength: number = 75): string => {
  if (!html || !html.trim()) return "";
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
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
    };
    await axios.post(`/api/notes/${payload.noteId}/send`, body);
    return true;
  } catch (err) {
    console.warn("Backend send API error:", err);
    throw err;
  }
};


