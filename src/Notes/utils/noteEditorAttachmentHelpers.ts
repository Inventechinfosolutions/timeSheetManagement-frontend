export const ROW_ATTACH_BTN_HTML = `<button type="button" class="row-attach-upload-btn" data-row-upload="true" title="Attach file (PDF, Word, Excel, Image)"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg><span>Attach</span></button>`;

export const ROW_ATTACH_ADD_BTN_HTML = `<button type="button" contenteditable="false" class="row-attach-add-btn" data-row-upload="true" title="Add another attachment to this row"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg></button>`;

export const ROW_ATTACH_HEADER_HTML = `<span class="excel-attachment-header-wrap"><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#4318ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg><span>Attachment</span></span>`;

export const getRowFileIconSvg = (fileName: string) => {
  const ext = (fileName || "").split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext || "")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
  }
  if (ext === "pdf") {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 12h4"/><path d="M10 16h4"/></svg>`;
  }
  if (["xls", "xlsx", "csv"].includes(ext || "")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M12 9v12"/></svg>`;
  }
  if (["doc", "docx"].includes(ext || "")) {
    return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>`;
};

export const getRowBadgeHtml = (fileKey: string, fileName: string) => {
  const icon = getRowFileIconSvg(fileName);
  return `
    <div class="table-file-badge" contenteditable="false" data-file-key="${fileKey}" data-file-name="${fileName}" title="${fileName}">
      ${icon}
      <span class="table-file-name">${fileName}</span>
      <button type="button" contenteditable="false" class="table-file-btn preview" data-file-action="preview" data-key="${fileKey}" data-name="${fileName}" title="Preview file">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#4318ff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
      </button>
      <button type="button" contenteditable="false" class="table-file-btn download" data-file-action="download" data-key="${fileKey}" data-name="${fileName}" title="Download file">
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#0284c7" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
      </button>
      <button type="button" contenteditable="false" class="table-file-btn remove" data-file-action="remove" title="Remove attachment">
        <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
      </button>
    </div>
  `.trim();
};

export const normalizeAttachmentCell = (cell: HTMLTableCellElement) => {
  const badges = Array.from(cell.querySelectorAll<HTMLElement>(".table-file-badge"));
  if (badges.length === 0) return;

  const rebuilt = badges
    .map((badge) => {
      const fileKey = badge.getAttribute("data-file-key") || "";
      const fileName =
        badge.getAttribute("data-file-name") ||
        badge.querySelector(".table-file-name")?.textContent ||
        "Attachment";
      if (!fileKey) return badge.outerHTML;
      return getRowBadgeHtml(fileKey, fileName);
    })
    .join("");

  cell.innerHTML = `<div class="row-attach-container">${rebuilt}${ROW_ATTACH_ADD_BTN_HTML}</div>`;
};

export const attachmentKeysInHtml = (html?: string | null): Set<string> => {
  const keys = new Set<string>();
  if (!html) return keys;
  const pattern = /data-file-key="([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(html))) {
    if (match[1]) keys.add(match[1]);
  }
  return keys;
};

export const refreshAttachmentBadges = (root: ParentNode) => {
  root.querySelectorAll<HTMLTableCellElement>("td").forEach((cell) => {
    if (cell.querySelector(".table-file-badge")) {
      normalizeAttachmentCell(cell);
    }
  });
};
