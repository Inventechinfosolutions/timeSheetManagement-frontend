import React, { useState, useCallback } from "react";
import { message } from "antd";
import { useAppDispatch } from "../../hooks";
import {
  uploadNoteAttachments,
  fetchNotes,
  moveNote,
} from "../../reducers/notes.reducer";
import { Note } from "../../types/notes.types";

export interface DraggedItem {
  id: number;
  title: string;
  itemType: "note" | "sub-note";
  parentId: number | null;
  projectName?: string;
  index: number;
}

export interface DragOverTarget {
  id: number;
  type: "root" | "sub";
  position: "above" | "below" | "inside";
}

export function useNoteDragDrop(
  displayNotes: Note[] = [],
  onExpandNote?: (noteId: number) => void
) {
  const dispatch = useAppDispatch();
  const [draggedItem, setDraggedItem] = useState<DraggedItem | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<DragOverTarget | null>(null);
  const [isHeaderDropTarget, setIsHeaderDropTarget] = useState<boolean>(false);
  const [fileDropTargetNoteId, setFileDropTargetNoteId] = useState<number | null>(null);

  // Start Note Drag
  const startNoteDrag = useCallback(
    (e: React.DragEvent, item: DraggedItem) => {
      e.dataTransfer.setData("application/json", JSON.stringify(item));
      e.dataTransfer.effectAllowed = "move";
      setDraggedItem(item);
    },
    []
  );

  // End Note Drag
  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverTarget(null);
    setIsHeaderDropTarget(false);
    setFileDropTargetNoteId(null);
  }, []);

  // Row Drag Over (File drop or Note reorder/nest)
  const handleRowDragOver = useCallback(
    (e: React.DragEvent<HTMLTableRowElement>, targetNote: Note, targetIndex?: number) => {
      e.preventDefault();
      const typesList = Array.from(e.dataTransfer.types || []);
      const isFileDrag = typesList.includes("Files") || typesList.includes("public.file-url");

      if (isFileDrag) {
        e.stopPropagation();
        e.dataTransfer.dropEffect = "copy";
        setFileDropTargetNoteId(targetNote.id);
        return;
      }

      if (!draggedItem || draggedItem.id === targetNote.id) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clientY = e.clientY - rect.top;
      const height = rect.height;

      // Middle 40% drops inside (nest as sub-note), top 30% above, bottom 30% below
      let position: "above" | "below" | "inside" = "inside";
      if (clientY < height * 0.3) {
        position = "above";
      } else if (clientY > height * 0.7) {
        position = "below";
      } else {
        position = "inside";
      }

      setDragOverTarget({
        id: targetNote.id,
        type: "root",
        position,
      });
    },
    [draggedItem]
  );

  // Row Drag Leave
  const handleRowDragLeave = useCallback(
    (e: React.DragEvent<HTMLTableRowElement>, targetNote: Note) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setFileDropTargetNoteId((prev) => (prev === targetNote.id ? null : prev));
      setDragOverTarget((prev) => (prev?.id === targetNote.id ? null : prev));
    },
    []
  );

  // Row Drop (Handles both file attachment uploads & note reordering/nesting)
  const handleRowDrop = useCallback(
    async (
      e: React.DragEvent<HTMLTableRowElement>,
      targetNote: Note,
      targetIndex?: number
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setFileDropTargetNoteId(null);
      const currentTarget = dragOverTarget;
      setDragOverTarget(null);

      // 1. Check if files were dropped
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const filesArray = Array.from(e.dataTransfer.files);
        try {
          message.loading({ content: `Uploading ${filesArray.length} file(s)...`, key: "upload-toast" });
          await dispatch(
            uploadNoteAttachments({
              noteId: targetNote.id,
              files: filesArray,
            })
          ).unwrap();
          message.success({ content: `Attached ${filesArray.length} file(s) to "${targetNote.title}"`, key: "upload-toast" });
          dispatch(fetchNotes({}));
        } catch (err: any) {
          message.error({ content: err || "Failed to upload attachments", key: "upload-toast" });
        }
        return;
      }

      // 2. Check if note/sub-note was dropped
      if (!draggedItem || draggedItem.id === targetNote.id) return;

      try {
        const idx = targetIndex ?? 0;
        if (currentTarget?.position === "inside") {
          // Nest note inside targetNote
          await dispatch(
            moveNote({
              id: draggedItem.id,
              targetParentId: targetNote.id,
            })
          ).unwrap();
          message.success(`Nested "${draggedItem.title}" under "${targetNote.title}"`);
          if (onExpandNote) onExpandNote(targetNote.id);
        } else {
          // Reorder relative to targetNote
          const orderIndex = currentTarget?.position === "above" ? idx : idx + 1;
          await dispatch(
            moveNote({
              id: draggedItem.id,
              targetParentId: null,
              orderIndex,
            })
          ).unwrap();
          message.success(`Moved "${draggedItem.title}"`);
        }
        dispatch(fetchNotes({}));
      } catch (err: any) {
        message.error(err || "Failed to move note");
      } finally {
        setDraggedItem(null);
      }
    },
    [dispatch, draggedItem, dragOverTarget, onExpandNote]
  );

  // Sub-row Drag Over
  const handleSubRowDragOver = useCallback(
    (
      e: React.DragEvent<HTMLTableRowElement>,
      parentNote: Note,
      subNote: Note,
      subIndex?: number
    ) => {
      e.preventDefault();
      if (!draggedItem || draggedItem.id === subNote.id) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clientY = e.clientY - rect.top;
      const height = rect.height;
      const position = clientY < height * 0.5 ? "above" : "below";

      setDragOverTarget({
        id: subNote.id,
        type: "sub",
        position,
      });
    },
    [draggedItem]
  );

  // Sub-row Drag Leave
  const handleSubRowDragLeave = useCallback(
    (e: React.DragEvent<HTMLTableRowElement>, subNote: Note) => {
      if (e.currentTarget.contains(e.relatedTarget as Node)) return;
      setDragOverTarget((prev) => (prev?.id === subNote.id ? null : prev));
    },
    []
  );

  // Sub-row Drop
  const handleSubRowDrop = useCallback(
    async (
      e: React.DragEvent<HTMLTableRowElement>,
      parentNote: Note,
      targetSubNote: Note,
      targetIndex?: number
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const currentTarget = dragOverTarget;
      setDragOverTarget(null);

      if (!draggedItem || draggedItem.id === targetSubNote.id) return;

      try {
        const idx = targetIndex ?? 0;
        const orderIndex = currentTarget?.position === "above" ? idx : idx + 1;
        await dispatch(
          moveNote({
            id: draggedItem.id,
            targetParentId: parentNote.id,
            orderIndex,
          })
        ).unwrap();
        message.success(`Reordered sub-note "${draggedItem.title}"`);
        dispatch(fetchNotes({}));
      } catch (err: any) {
        message.error(err || "Failed to reorder sub-note");
      } finally {
        setDraggedItem(null);
      }
    },
    [dispatch, draggedItem, dragOverTarget]
  );

  // Header Drag Over (to promote sub-note to root)
  const handleHeaderDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsHeaderDropTarget(true);
  }, []);

  // Header Drag Leave
  const handleHeaderDragLeave = useCallback(() => {
    setIsHeaderDropTarget(false);
  }, []);

  // Header Drop (Promote sub-note to root)
  const handleHeaderDrop = useCallback(
    async (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();
      setIsHeaderDropTarget(false);

      if (!draggedItem || draggedItem.itemType !== "sub-note") return;

      try {
        await dispatch(
          moveNote({
            id: draggedItem.id,
            targetParentId: null,
            orderIndex: 0,
          })
        ).unwrap();
        message.success(`Promoted "${draggedItem.title}" to top-level note`);
        dispatch(fetchNotes({}));
      } catch (err: any) {
        message.error(err || "Failed to promote sub-note");
      } finally {
        setDraggedItem(null);
      }
    },
    [dispatch, draggedItem]
  );

  return {
    draggedItem,
    dragOverTarget,
    isHeaderDropTarget,
    fileDropTargetNoteId,
    startNoteDrag,
    handleDragEnd,
    handleRowDragOver,
    handleRowDragLeave,
    handleRowDrop,
    handleSubRowDragOver,
    handleSubRowDragLeave,
    handleSubRowDrop,
    handleHeaderDragOver,
    handleHeaderDragLeave,
    handleHeaderDrop,
  };
}
