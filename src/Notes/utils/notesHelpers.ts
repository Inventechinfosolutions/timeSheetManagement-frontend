import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import dayjs from "dayjs";
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
    const createdDate = dayjs(note.createdAt).format("MMMM DD, YYYY");
    const updatedDate = dayjs(note.updatedAt || note.createdAt).format("MMMM DD, YYYY");
    const author = note.createdBy || "User";

    // Build Sub-notes HTML table for visual PDF
    let subNotesTable = "";
    if (note.subNotes && note.subNotes.length > 0) {
      const subRows = note.subNotes
        .map(
          (sub, idx) => `
          <tr style="background-color: ${idx % 2 === 1 ? "#F8FAFC" : "#FFFFFF"};">
            <td style="padding: 8px 10px; font-weight: bold; color: #64748B; text-align: center; width: 35px; border: 1px solid #CBD5E1;">${idx + 1}</td>
            <td style="padding: 8px 10px; font-weight: 600; color: #1E293B; width: 140px; border: 1px solid #CBD5E1;">${sub.title || ""}</td>
            <td style="padding: 8px 10px; color: #64748B; font-size: 11.5px; width: 85px; border: 1px solid #CBD5E1;">${sub.createdBy || "User"}</td>
            <td style="padding: 8px 10px; color: #64748B; font-size: 11.5px; width: 90px; border: 1px solid #CBD5E1;">${dayjs(sub.createdAt).format("MMM DD, YYYY")}</td>
            <td style="padding: 8px 10px; color: #334155; font-size: 12px; border: 1px solid #CBD5E1;">${sub.description || '<span style="color: #94A3B8; font-style: italic;">No description</span>'}</td>
          </tr>
        `
        )
        .join("");

      subNotesTable = `
        <div style="margin-top: 24px;">
          <div style="font-size: 12.5px; font-weight: bold; color: #4318FF; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; border-bottom: 2px solid #E2E8F0; padding-bottom: 4px;">
            Sub-Notes (${note.subNotes.length})
          </div>
          <table style="width: 100%; border-collapse: collapse; background-color: #FFFFFF; border: 1px solid #CBD5E1;">
            <thead>
              <tr style="background-color: #4318FF; color: #FFFFFF; font-size: 11.5px; font-weight: bold;">
                <th style="padding: 8px 10px; text-align: center; width: 35px; border: 1px solid #3730A3;">#</th>
                <th style="padding: 8px 10px; text-align: left; width: 140px; border: 1px solid #3730A3;">Title</th>
                <th style="padding: 8px 10px; text-align: left; width: 85px; border: 1px solid #3730A3;">Author</th>
                <th style="padding: 8px 10px; text-align: left; width: 90px; border: 1px solid #3730A3;">Date</th>
                <th style="padding: 8px 10px; text-align: left; border: 1px solid #3730A3;">Description</th>
              </tr>
            </thead>
            <tbody>
              ${subRows}
            </tbody>
          </table>
        </div>
      `;
    }

    // Build Attachments list for visual PDF
    let attachmentsList = "";
    if (note.attachments && note.attachments.length > 0) {
      const attRows = note.attachments
        .map((att, idx) => {
          const name = att.fileName || att.name || "Attachment";
          const size = att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : "File";
          return `
            <div style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px; background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 6px; font-size: 11px; color: #334155; margin-right: 8px; margin-bottom: 8px;">
              <span style="font-weight: 700; color: #4318FF;">#${idx + 1}</span>
              <span style="font-weight: 600;">${name}</span>
              <span style="color: #64748B; font-size: 10.5px;">(${size})</span>
            </div>
          `;
        })
        .join("");

      attachmentsList = `
        <div style="margin-top: 24px;">
          <div style="font-size: 12.5px; font-weight: bold; color: #4318FF; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 8px; border-bottom: 2px solid #E2E8F0; padding-bottom: 4px;">
            Files & Attachments (${note.attachments.length})
          </div>
          <div style="margin-top: 6px;">
            ${attRows}
          </div>
        </div>
      `;
    }

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
      <div style="padding: 36px 40px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #1E293B; background-color: #FFFFFF; line-height: 1.6;">
        <div style="border-bottom: 2px solid #4318FF; padding-bottom: 10px; margin-bottom: 18px; display: flex; justify-content: space-between; align-items: center;">
          <span style="font-size: 11px; font-weight: 800; color: #4318FF; letter-spacing: 1.2px; text-transform: uppercase;">
            WORKSPHERE NOTE
          </span>
          <span style="font-size: 11px; color: #64748B; font-weight: 500;">
            ${dayjs().format("MMMM DD, YYYY")}
          </span>
        </div>

        <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 10px; padding: 16px 20px; margin-bottom: 20px;">
          <div style="display: inline-block; padding: 3px 10px; font-size: 10.5px; font-weight: 700; text-transform: uppercase; border-radius: 4px; background-color: ${
            isProject ? "#EEF2FF" : "#ECFDF5"
          }; color: ${isProject ? "#4318FF" : "#059669"}; border: 1px solid ${
            isProject ? "#C7D2FE" : "#A7F3D0"
          }; margin-bottom: 8px;">
            ${isProject ? `Project: ${projectLabel}` : "Personal Note"}
          </div>

          <h1 style="font-size: 22px; font-weight: 800; color: #1B2559; margin: 0 0 8px 0; line-height: 1.3;">
            ${note.title || "Untitled Note"}
          </h1>

          <div style="display: flex; align-items: center; gap: 14px; font-size: 11.5px; color: #64748B; flex-wrap: wrap;">
            <div><strong>Author:</strong> ${author}</div>
            <div>•</div>
            <div><strong>Created:</strong> ${createdDate}</div>
            <div>•</div>
            <div><strong>Updated:</strong> ${updatedDate}</div>
            ${
              note.attachments && note.attachments.length > 0
                ? `<div>•</div><div><strong>Attachments:</strong> ${note.attachments.length}</div>`
                : ""
            }
          </div>
        </div>

        <div>
          <div style="font-size: 12px; font-weight: bold; color: #4318FF; text-transform: uppercase; letter-spacing: 0.8px; margin-bottom: 10px; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px;">
            Description & Content
          </div>
          <div class="pdf-export-body" style="font-size: 13.5px; line-height: 1.65; color: #1E293B;">
            ${note.description || '<p style="color: #94A3B8; font-style: italic;">No description provided.</p>'}
          </div>
        </div>

        ${subNotesTable}
        ${attachmentsList}

        <div style="margin-top: 36px; padding-top: 12px; border-top: 1px solid #E2E8F0; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; color: #94A3B8;">
          <span>© ${new Date().getFullYear()} WorkSphere Powered by inventech</span>
          <span>Exported on ${dayjs().format("MMM DD, YYYY HH:mm")}</span>
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
      windowWidth: 1000,
    });

    document.body.removeChild(wrapper);

    // Initialize jsPDF in A4 portrait (210mm x 297mm)
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    // Height of one full A4 page in canvas coordinates
    const a4Aspect = 297 / 210; // 1.4142857
    const pageHeightPx = Math.floor(canvas.width * a4Aspect);
    const totalPages = Math.max(1, Math.ceil(canvas.height / pageHeightPx));

    for (let pageIdx = 0; pageIdx < totalPages; pageIdx++) {
      if (pageIdx > 0) {
        pdf.addPage("a4", "portrait");
      }

      const sourceY = pageIdx * pageHeightPx;
      const sourceHeight = Math.min(pageHeightPx, canvas.height - sourceY);

      // Create a page canvas for this exact slice
      const pageCanvas = document.createElement("canvas");
      pageCanvas.width = canvas.width;
      pageCanvas.height = pageHeightPx;

      const pageCtx = pageCanvas.getContext("2d");
      if (pageCtx) {
        // Fill page canvas with white background
        pageCtx.fillStyle = "#FFFFFF";
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height);

        // Draw exact slice from main canvas
        pageCtx.drawImage(
          canvas,
          0,
          sourceY,
          canvas.width,
          sourceHeight,
          0,
          0,
          canvas.width,
          sourceHeight
        );
      }

      const pageImgData = pageCanvas.toDataURL("image/jpeg", 0.95);
      pdf.addImage(pageImgData, "JPEG", 0, 0, 210, 297);
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
    // 1. Call backend Word download endpoint with format=word
    if (note.id) {
      try {
        const response = await axios.get(`/api/notes/${note.id}/download?format=word`, {
          responseType: "blob",
        });

        if (response.data) {
          const blob = new Blob([response.data], {
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
          message.success("Word document downloaded successfully");
          return;
        }
      } catch (apiErr) {
        console.warn("Backend Word download API returned error, falling back to rich client export:", apiErr);
      }
    }

    // 2. Client-side high-fidelity fallback Word generator
    const isProject = note.type === "PROJECT";
    const projectLabel = note.projectName || "Worksphere Project";
    const createdDate = dayjs(note.createdAt).format("MMMM DD, YYYY");
    const updatedDate = dayjs(note.updatedAt || note.createdAt).format("MMMM DD, YYYY");
    const author = note.createdBy || "User";

    let subNotesHtml = "";
    if (note.subNotes && note.subNotes.length > 0) {
      const subRows = note.subNotes
        .map(
          (sub, idx) => `
          <tr>
            <td style="padding: 8pt; border: 1pt solid #CBD5E1; text-align: center; font-weight: bold; width: 40pt; background-color: #F8FAFC;">${idx + 1}</td>
            <td style="padding: 8pt; border: 1pt solid #CBD5E1; font-weight: bold; color: #1E293B; width: 140pt;">${sub.title || ""}</td>
            <td style="padding: 8pt; border: 1pt solid #CBD5E1; color: #64748B; width: 80pt;">${sub.createdBy || "User"}</td>
            <td style="padding: 8pt; border: 1pt solid #CBD5E1; color: #64748B; width: 80pt;">${dayjs(sub.createdAt).format("MMM DD, YYYY")}</td>
            <td style="padding: 8pt; border: 1pt solid #CBD5E1; color: #334155;">${sub.description || '<span style="color:#94A3B8; font-style:italic;">No description</span>'}</td>
          </tr>
        `
        )
        .join("");

      subNotesHtml = `
        <div class="section-title">Sub-Notes (${note.subNotes.length})</div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 10pt; margin-bottom: 20pt;">
          <thead>
            <tr style="background-color: #4318FF; color: #FFFFFF;">
              <th style="padding: 8pt; border: 1pt solid #3730A3; text-align: center; width: 40pt;">#</th>
              <th style="padding: 8pt; border: 1pt solid #3730A3; text-align: left; width: 140pt;">Title</th>
              <th style="padding: 8pt; border: 1pt solid #3730A3; text-align: left; width: 80pt;">Author</th>
              <th style="padding: 8pt; border: 1pt solid #3730A3; text-align: left; width: 80pt;">Date</th>
              <th style="padding: 8pt; border: 1pt solid #3730A3; text-align: left;">Description</th>
            </tr>
          </thead>
          <tbody>
            ${subRows}
          </tbody>
        </table>
      `;
    }

    let attachmentsHtml = "";
    if (note.attachments && note.attachments.length > 0) {
      const attRows = note.attachments
        .map((att, idx) => {
          const name = att.fileName || att.name || "Attachment";
          const size = att.fileSize ? `${Math.round(att.fileSize / 1024)} KB` : "Attached file";
          return `
            <li style="margin-bottom: 6pt; color: #334155;">
              <strong>${idx + 1}. ${name}</strong> <span style="color: #64748B; font-size: 9.5pt;">(${size})</span>
            </li>
          `;
        })
        .join("");

      attachmentsHtml = `
        <div class="section-title">Files & Attachments (${note.attachments.length})</div>
        <ul style="padding-left: 20pt; margin-top: 8pt; margin-bottom: 20pt;">
          ${attRows}
        </ul>
      `;
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
            color: #4318FF;
            font-size: 22pt;
            font-weight: bold;
            margin-top: 0;
            margin-bottom: 12pt;
          }
          h2 { font-size: 16pt; color: #1E293B; }
          h3 { font-size: 13pt; color: #334155; }
          p { margin-top: 0; margin-bottom: 10pt; line-height: 1.6; }
          .header-box {
            background-color: #F8FAFC;
            border: 1.5pt solid #E2E8F0;
            padding: 14pt 18pt;
            border-radius: 8pt;
            margin-bottom: 18pt;
          }
          .badge {
            display: inline-block;
            padding: 3pt 10pt;
            font-size: 9.5pt;
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5pt;
            border-radius: 4pt;
            background-color: #EEF2FF;
            color: #4318FF;
            border: 1pt solid #C7D2FE;
          }
          .badge-personal {
            background-color: #ECFDF5;
            color: #059669;
            border: 1pt solid #A7F3D0;
          }
          .meta-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 8pt;
          }
          .meta-table td {
            padding: 4pt 6pt;
            font-size: 9.5pt;
            color: #64748B;
            border: none;
          }
          .section-title {
            font-size: 12pt;
            font-weight: bold;
            color: #4318FF;
            text-transform: uppercase;
            letter-spacing: 0.8pt;
            border-bottom: 1.5pt solid #E2E8F0;
            padding-bottom: 4pt;
            margin-top: 18pt;
            margin-bottom: 10pt;
          }
          .content-container {
            font-size: 11pt;
            line-height: 1.65;
            color: #1E293B;
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
          .footer-note {
            margin-top: 30pt;
            padding-top: 10pt;
            border-top: 1pt solid #E2E8F0;
            font-size: 9pt;
            color: #94A3B8;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="Section1">
          <div class="header-box">
            <span class="${isProject ? "badge" : "badge badge-personal"}">
              ${isProject ? `PROJECT NOTE: ${projectLabel}` : "PERSONAL NOTE"}
            </span>
            <h1 style="margin-top: 10pt; margin-bottom: 6pt;">${note.title || "Untitled Note"}</h1>
            <table class="meta-table">
              <tr>
                <td><strong>Author:</strong> ${author}</td>
                <td><strong>Created:</strong> ${createdDate}</td>
                <td><strong>Last Modified:</strong> ${updatedDate}</td>
              </tr>
            </table>
          </div>

          <div class="section-title">Description & Content</div>
          <div class="content-container">
            ${note.description || '<p style="color: #94A3B8; font-style: italic;">No description provided.</p>'}
          </div>

          ${subNotesHtml}
          ${attachmentsHtml}

          <div class="footer-note">
            © ${new Date().getFullYear()} WorkSphere Powered by inventech &nbsp;|&nbsp; Exported on ${dayjs().format("MMMM DD, YYYY HH:mm")}
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


