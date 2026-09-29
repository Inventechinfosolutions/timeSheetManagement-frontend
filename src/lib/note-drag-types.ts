export const NOTE_ITEM_MIME = "application/x-timesheet-note-item";

export type NoteItemDragPayload = {
  id: number;
  title: string;
  itemType: "note" | "sub-note";
  parentId?: number | null;
  projectName?: string | null;
  index?: number;
};

export function createNoteItemDragPreview(
  label: string,
  itemType: "note" | "sub-note"
) {
  const el = document.createElement("div");
  el.textContent = `${itemType === "sub-note" ? "📄 Sub-Note" : "📁 Note"} · ${label}`;
  el.setAttribute("aria-hidden", "true");
  Object.assign(el.style, {
    position: "fixed",
    top: "-1000px",
    left: "-1000px",
    zIndex: "99999",
    maxWidth: "18rem",
    overflow: "hidden",
    textOverflow: "ellipsis",
    whiteSpace: "nowrap",
    padding: "0.45rem 0.85rem",
    borderRadius: "0.75rem",
    border: "1.5px solid #4318FF",
    background: "#1B2559",
    color: "#ffffff",
    boxShadow: "0 10px 25px -5px rgba(67, 24, 255, 0.4)",
    fontFamily: "inherit",
    fontSize: "0.75rem",
    fontWeight: "600",
    pointerEvents: "none",
  } satisfies Partial<CSSStyleDeclaration>);
  document.body.appendChild(el);
  return el;
}

export function setNoteItemDragData(
  dataTransfer: DataTransfer,
  payload: NoteItemDragPayload
) {
  const label = payload.title?.trim() || String(payload.id);
  dataTransfer.effectAllowed = "move";
  dataTransfer.setData(NOTE_ITEM_MIME, JSON.stringify(payload));
  dataTransfer.setData("text/plain", label);

  const preview = createNoteItemDragPreview(label, payload.itemType);
  dataTransfer.setDragImage(preview, 15, 15);
  requestAnimationFrame(() => {
    preview.remove();
  });
}

export function hasNoteItemDragType(
  types: Iterable<string> | ArrayLike<string>
): boolean {
  return Array.from(types as ArrayLike<string>).includes(NOTE_ITEM_MIME);
}

export function parseNoteItemDragPayload(
  dataTransfer: DataTransfer
): NoteItemDragPayload | null {
  const payloadText = dataTransfer.getData(NOTE_ITEM_MIME);
  if (!payloadText) {
    return null;
  }

  try {
    const payload = JSON.parse(payloadText) as NoteItemDragPayload;
    if (!payload.id || (payload.itemType !== "note" && payload.itemType !== "sub-note")) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}
