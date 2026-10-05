import React from "react";
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Eye,
  GripVertical,
  FolderInput,
  CornerDownRight,
  Pin,
  Archive,
  ArchiveRestore,
  Send,
  Paperclip,
} from "lucide-react";
import { Tooltip } from "antd";
import { PopconfirmWithTooltip } from "../../components/ui/PopconfirmWithTooltip";
import dayjs from "dayjs";
import { Note, NoteType } from "../types/notes.types";
import { getCleanDescriptionSnippet } from "../utils/notesHelpers";
import { useNoteDragDrop } from "../hooks/useNoteDragDrop";

interface NoteListProps {
  loading?: boolean;
  notes: Note[];
  paginatedNotes: Note[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
  activeTab: NoteType;
  searchQuery: string;
  expandedNotes: Record<number, boolean>;
  currentUser?: { loginId?: string } | null;
  dragDrop: ReturnType<typeof useNoteDragDrop>;
  onToggleExpand: (noteId: number) => void;
  onStartView: (note: Note) => void;
  onStartEdit: (note: Note) => void;
  onDeleteNote: (noteId: number) => void;
  onTogglePin: (noteId: number, e?: React.MouseEvent) => void;
  onToggleArchive: (noteId: number, e?: React.MouseEvent) => void;
  onOpenSendModal: (note: Note) => void;
  onStartCreateSubNote: (parent: Note) => void;
  onTabSwitch: (tab: NoteType) => void;
  onPageChange: (page: number) => void;
}

export const NoteList: React.FC<NoteListProps> = ({
  loading,
  notes,
  paginatedNotes,
  currentPage,
  pageSize,
  totalPages,
  activeTab,
  searchQuery,
  expandedNotes,
  currentUser,
  dragDrop,
  onToggleExpand,
  onStartView,
  onStartEdit,
  onDeleteNote,
  onTogglePin,
  onToggleArchive,
  onOpenSendModal,
  onStartCreateSubNote,
  onTabSwitch,
  onPageChange,
}) => {
  const isProjectNotesTab = activeTab === "PROJECT";
  const {
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
  } = dragDrop;

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
      {notes.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-indigo-50 text-[#4318FF] rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
            <FileText className="w-7 h-7 text-[#4318FF]" />
          </div>
          <h3 className="text-base font-bold text-[#1B2559] mb-1">
            {searchQuery ? "No matching notes found" : "No notes created yet"}
          </h3>
          <p className="text-slate-400 text-xs md:text-sm max-w-sm mb-6">
            {searchQuery
              ? "Try clearing your search query or switching filters."
              : "Click '+ Create Project Note' or '+ Create Personal Note' above to add your notes."}
          </p>
          {isProjectNotesTab && (
            <button
              onClick={() => onTabSwitch("PERSONAL")}
              className="px-4 py-2 bg-[#4318FF] text-white text-xs font-semibold rounded-xl shadow-sm hover:bg-[#320fe0] transition cursor-pointer"
            >
              Switch to Personal Notes
            </button>
          )}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#4318FF] text-white text-xs font-bold uppercase tracking-wider">
                <th className="py-4 px-6 text-center w-28">SL NO</th>
                {isProjectNotesTab && <th className="py-4 px-6">PROJECT NAME</th>}
                <th className="py-4 px-6">TITLE</th>
                <th className="py-4 px-6">DESCRIPTION</th>
                <th className="py-4 px-6">CREATED BY</th>
                <th className="py-4 px-6 text-center w-48">ACTION</th>
              </tr>
            </thead>

            {/* Drop Target Banner for Sub-notes being promoted to root */}
            {draggedItem && draggedItem.itemType === "sub-note" && (
              <div
                onDragOver={handleHeaderDragOver}
                onDragLeave={handleHeaderDragLeave}
                onDrop={handleHeaderDrop}
                className={`p-3 m-4 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 text-xs font-bold transition-all ${
                  isHeaderDropTarget
                    ? "bg-[#4318FF] text-white border-white shadow-md scale-[1.01]"
                    : "bg-indigo-50/80 border-[#4318FF] text-[#4318FF]"
                }`}
              >
                <CornerDownRight className="w-4 h-4" />
                <span>Drop here to promote "{draggedItem.title}" to a top-level note</span>
              </div>
            )}

            <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700 font-medium">
              {paginatedNotes.map((note, index) => {
                const slNo = (currentPage - 1) * pageSize + index + 1;
                const isExpanded = !!expandedNotes[note.id];
                const subNotes = note.subNotes || [];
                const isBeingDragged = draggedItem?.id === note.id;
                const isCurrentDropTarget = dragOverTarget?.id === note.id && dragOverTarget.type === "root";
                const isFileDropTarget = fileDropTargetNoteId === note.id;

                return (
                  <React.Fragment key={note.id}>
                    <tr
                      draggable
                      onDragStart={(e) =>
                        startNoteDrag(e, {
                          id: note.id,
                          title: note.title,
                          itemType: "note",
                          parentId: null,
                          projectName: note.projectName || undefined,
                          index,
                        })
                      }
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleRowDragOver(e, note, index)}
                      onDragLeave={(e) => handleRowDragLeave(e, note)}
                      onDrop={(e) => handleRowDrop(e, note, index)}
                      className={`transition-all duration-150 ${
                        isBeingDragged ? "opacity-30 bg-slate-100" : ""
                      } ${
                        isFileDropTarget
                          ? "bg-emerald-50/90 ring-2 ring-emerald-500 ring-dashed shadow-inner"
                          : isCurrentDropTarget
                          ? dragOverTarget.position === "above"
                            ? "border-t-2 border-t-[#4318FF] bg-indigo-50/50"
                            : dragOverTarget.position === "below"
                            ? "border-b-2 border-b-[#4318FF] bg-indigo-50/50"
                            : "bg-indigo-50/90 ring-2 ring-[#4318FF] ring-inset"
                          : "hover:bg-slate-50/80"
                      }`}
                    >
                      {/* SL NO with Drag Handle & Expand Button */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <div
                            className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-[#4318FF] transition-colors rounded hover:bg-slate-100"
                            title="Drag to reorder or nest into another note"
                          >
                            <GripVertical className="w-4 h-4" />
                          </div>
                          <span className="font-bold text-slate-800">{slNo}</span>
                          <button
                            type="button"
                            onClick={() => onToggleExpand(note.id)}
                            className={`w-6 h-6 rounded border flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                              isExpanded
                                ? "border-[#4318FF] bg-[#4318FF] text-white"
                                : "border-slate-300 hover:border-[#4318FF] text-slate-600 hover:text-[#4318FF] bg-white shadow-xs"
                            }`}
                            title={isExpanded ? "Collapse sub-notes" : "Expand sub-notes"}
                          >
                            {isExpanded ? "−" : "+"}
                          </button>
                        </div>
                      </td>

                      {/* Project Name */}
                      {isProjectNotesTab && (
                        <td className="py-4 px-6 font-semibold text-slate-800">
                          {note.projectName || "Worksphere"}
                        </td>
                      )}

                      {/* Title */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2 flex-wrap">
                          {note.isPinned && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 shrink-0 shadow-2xs">
                              <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                              <span>Pinned</span>
                            </span>
                          )}
                          <span
                            onClick={() => onStartView(note)}
                            className="font-semibold text-slate-800 hover:text-[#4318FF] transition cursor-pointer"
                          >
                            {note.title}
                          </span>
                          {isCurrentDropTarget && (dragOverTarget.position === "inside" || (dragOverTarget.position as any) === "nest") && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#4318FF] text-white shadow-xs animate-pulse">
                              <FolderInput className="w-3 h-3" />
                              Nest as sub-note
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Description Column */}
                      <td className="py-4 px-6">
                        <div className="max-w-xs sm:max-w-sm text-slate-500 text-xs line-clamp-2">
                          {getCleanDescriptionSnippet(note.description, 75) || (
                            <span className="text-slate-300 italic">No description</span>
                          )}
                        </div>
                        {note.attachments && note.attachments.length > 0 && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#4318FF] font-semibold">
                            <Paperclip className="w-3 h-3 text-[#4318FF]" />
                            <span>
                              {note.attachments.length} attachment{note.attachments.length > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Created By */}
                      <td className="py-4 px-6 text-slate-600">
                        <div>{dayjs(note.createdAt).format("MMM DD, YYYY")}</div>
                        <div className="text-[11px] text-slate-400">
                          Created by {note.createdBy || currentUser?.loginId || "Kusuma"}
                        </div>
                      </td>

                      {/* Action Badges: Send, Pin, Archive, View, Edit, Delete */}
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Send Note */}
                          <Tooltip title="Send / Share Note" placement="top">
                            <button
                              type="button"
                              onClick={() => onOpenSendModal(note)}
                              className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                              aria-label="Send Note"
                            >
                              <Send className="w-3.5 h-3.5 text-[#4318FF]" />
                            </button>
                          </Tooltip>

                          {/* Pin Toggle */}
                          <Tooltip title={note.isPinned ? "Unpin Note" : "Pin Note to top"} placement="top">
                            <button
                              type="button"
                              onClick={(e) => onTogglePin(note.id, e)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer shadow-xs ${
                                note.isPinned
                                  ? "bg-[#FEF3C7] text-[#D97706] hover:bg-[#FDE68A]"
                                  : "bg-slate-100/80 text-slate-500 hover:text-[#D97706] hover:bg-amber-50"
                              }`}
                              aria-label={note.isPinned ? "Unpin Note" : "Pin Note"}
                            >
                              <Pin className={`w-3.5 h-3.5 ${note.isPinned ? "fill-[#D97706]" : ""}`} />
                            </button>
                          </Tooltip>

                          {/* Archive Toggle */}
                          <Tooltip title={note.isArchived ? "Restore Note from Archive" : "Archive Note"} placement="top">
                            <button
                              type="button"
                              onClick={(e) => onToggleArchive(note.id, e)}
                              className={`w-8 h-8 rounded-xl flex items-center justify-center transition cursor-pointer shadow-xs ${
                                note.isArchived
                                  ? "bg-[#ECFDF5] text-[#059669] hover:bg-[#D1FAE5]"
                                  : "bg-slate-100/80 text-slate-500 hover:text-[#4318FF] hover:bg-indigo-50"
                              }`}
                              aria-label={note.isArchived ? "Restore Note" : "Archive Note"}
                            >
                              {note.isArchived ? (
                                <ArchiveRestore className="w-3.5 h-3.5" />
                              ) : (
                                <Archive className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </Tooltip>

                          {/* View */}
                          <Tooltip title="View Note" placement="top">
                            <button
                              type="button"
                              onClick={() => onStartView(note)}
                              className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                              aria-label="View Note"
                            >
                              <Eye className="w-3.5 h-3.5 text-[#4318FF]" />
                            </button>
                          </Tooltip>

                          {/* Edit */}
                          <Tooltip title="Edit Note" placement="top">
                            <button
                              type="button"
                              onClick={() => onStartEdit(note)}
                              className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                              aria-label="Edit Note"
                            >
                              <Edit3 className="w-3.5 h-3.5 text-[#4318FF]" />
                            </button>
                          </Tooltip>

                          {/* Delete */}
                          <PopconfirmWithTooltip
                            title="Delete Note"
                            description="Are you sure you want to delete this note and its sub-notes?"
                            tooltipTitle="Delete Note"
                            onConfirm={() => onDeleteNote(note.id)}
                            okText="Delete"
                            cancelText="Cancel"
                            okButtonProps={{ danger: true }}
                          >
                            <button
                              type="button"
                              className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] flex items-center justify-center transition cursor-pointer shadow-xs"
                              aria-label="Delete Note"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                            </button>
                          </PopconfirmWithTooltip>
                        </div>
                      </td>
                    </tr>

                    {/* Sub-Table Expansion */}
                    {isExpanded && (
                      <tr>
                        <td colSpan={isProjectNotesTab ? 6 : 5} className="p-0 bg-slate-50/50">
                          <div className="p-5 pl-12 space-y-3">
                            <div className="flex items-center justify-end">
                              <button
                                type="button"
                                onClick={() => onStartCreateSubNote(note)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#4318FF] hover:bg-[#320fe0] text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add Note</span>
                              </button>
                            </div>

                            <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-xs">
                              <table className="w-full text-left border-collapse">
                                <thead>
                                  <tr className="bg-[#4318FF] text-white text-xs font-bold uppercase tracking-wider">
                                    <th className="py-3 px-5 text-center w-24">SL NO</th>
                                    <th className="py-3 px-6">TITLE</th>
                                    <th className="py-3 px-6">DESCRIPTION</th>
                                    <th className="py-3 px-6">CREATED BY</th>
                                    <th className="py-3 px-6 text-center w-44">ACTIONS</th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700">
                                  {subNotes.length === 0 ? (
                                    <tr>
                                      <td colSpan={5} className="py-8 text-center text-slate-400">
                                        No notes yet. Click{" "}
                                        <button
                                          type="button"
                                          onClick={() => onStartCreateSubNote(note)}
                                          className="font-bold text-[#4318FF] hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                                        >
                                          + Add Note
                                        </button>{" "}
                                        to add one, or drag a note here.
                                      </td>
                                    </tr>
                                  ) : (
                                    subNotes.map((sub, subIdx) => {
                                      const isSubDragged = draggedItem?.id === sub.id;
                                      const isSubDropTarget = dragOverTarget?.id === sub.id && dragOverTarget.type === "sub";

                                      return (
                                        <tr
                                          key={sub.id}
                                          draggable
                                          onDragStart={(e) =>
                                            startNoteDrag(e, {
                                              id: sub.id,
                                              title: sub.title,
                                              itemType: "sub-note",
                                              parentId: note.id,
                                              projectName: note.projectName || undefined,
                                              index: subIdx,
                                            })
                                          }
                                          onDragEnd={handleDragEnd}
                                          onDragOver={(e) => handleSubRowDragOver(e, note, sub, subIdx)}
                                          onDragLeave={(e) => handleSubRowDragLeave(e, sub)}
                                          onDrop={(e) => handleSubRowDrop(e, note, sub, subIdx)}
                                          className={`transition-all duration-150 ${
                                            isSubDragged ? "opacity-30 bg-slate-100" : ""
                                          } ${
                                            isSubDropTarget
                                              ? dragOverTarget.position === "above"
                                                ? "border-t-2 border-t-[#4318FF] bg-indigo-50/50"
                                                : "border-b-2 border-b-[#4318FF] bg-indigo-50/50"
                                              : "hover:bg-slate-50"
                                          }`}
                                        >
                                          <td className="py-3 px-5 text-center font-bold text-slate-700">
                                            <div className="flex items-center justify-center gap-1.5">
                                              <div
                                                className="cursor-grab active:cursor-grabbing p-1 text-slate-300 hover:text-[#4318FF] transition-colors rounded hover:bg-slate-100"
                                                title="Drag to reorder sub-note"
                                              >
                                                <GripVertical className="w-3.5 h-3.5" />
                                              </div>
                                              <span>{subIdx + 1}</span>
                                            </div>
                                          </td>
                                          <td className="py-3 px-6">
                                            <span
                                              onClick={() => onStartView(sub)}
                                              className="font-semibold text-slate-800 hover:text-[#4318FF] transition cursor-pointer"
                                            >
                                              {sub.title}
                                            </span>
                                          </td>
                                          {/* Sub-note Description Column */}
                                          <td className="py-3 px-6">
                                            <div className="max-w-xs text-slate-500 text-xs line-clamp-2">
                                              {getCleanDescriptionSnippet(sub.description, 60) || (
                                                <span className="text-slate-300 italic">No description</span>
                                              )}
                                            </div>
                                            {sub.attachments && sub.attachments.length > 0 && (
                                              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#4318FF] font-semibold">
                                                <Paperclip className="w-2.5 h-2.5 text-[#4318FF]" />
                                                <span>
                                                  {sub.attachments.length} attachment{sub.attachments.length > 1 ? "s" : ""}
                                                </span>
                                              </div>
                                            )}
                                          </td>
                                          <td className="py-3 px-6 text-slate-600">
                                            <div>{dayjs(sub.createdAt).format("MMM DD, YYYY")}</div>
                                            <div className="text-[11px] text-slate-400">
                                              Created by {sub.createdBy || currentUser?.loginId || "Kusuma"}
                                            </div>
                                          </td>
                                          <td className="py-3 px-6 text-center">
                                            <div className="flex items-center justify-center gap-1.5">
                                              <Tooltip title="Send Sub-note" placement="top">
                                                <button
                                                  type="button"
                                                  onClick={() => onOpenSendModal(sub)}
                                                  className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                                                  aria-label="Send Sub-note"
                                                >
                                                  <Send className="w-3.5 h-3.5 text-[#4318FF]" />
                                                </button>
                                              </Tooltip>

                                              <Tooltip title="View Sub-note" placement="top">
                                                <button
                                                  type="button"
                                                  onClick={() => onStartView(sub)}
                                                  className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                                                  aria-label="View Sub-note"
                                                >
                                                  <Eye className="w-3.5 h-3.5 text-[#4318FF]" />
                                                </button>
                                              </Tooltip>

                                              <Tooltip title="Edit Sub-note" placement="top">
                                                <button
                                                  type="button"
                                                  onClick={() => onStartEdit(sub)}
                                                  className="w-8 h-8 rounded-xl bg-[#EEF2FF] text-[#4318FF] hover:bg-[#E0E7FF] flex items-center justify-center transition cursor-pointer shadow-xs"
                                                  aria-label="Edit Sub-note"
                                                >
                                                  <Edit3 className="w-3.5 h-3.5 text-[#4318FF]" />
                                                </button>
                                              </Tooltip>

                                              <PopconfirmWithTooltip
                                                title="Delete Sub-Note"
                                                description="Are you sure you want to delete this sub-note?"
                                                tooltipTitle="Delete Sub-note"
                                                onConfirm={() => onDeleteNote(sub.id)}
                                                okText="Delete"
                                                cancelText="Cancel"
                                                okButtonProps={{ danger: true }}
                                              >
                                                <button
                                                  type="button"
                                                  className="w-8 h-8 rounded-xl bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] flex items-center justify-center transition cursor-pointer shadow-xs"
                                                  aria-label="Delete Sub-note"
                                                >
                                                  <Trash2 className="w-3.5 h-3.5 text-[#EF4444]" />
                                                </button>
                                              </PopconfirmWithTooltip>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    })
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Table Footer: Showing X of Y notes & Pagination */}
      {notes.length > 0 && (
        <div className="p-4 flex items-center justify-between border-t border-slate-100 text-xs text-slate-500">
          <div>
            Showing {Math.min((currentPage - 1) * pageSize + 1, notes.length)} -{" "}
            {Math.min(currentPage * pageSize, notes.length)} of {notes.length} notes
          </div>

          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
              <button
                key={`page-${pg}`}
                onClick={() => onPageChange(pg)}
                className={`w-7 h-7 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center ${
                  currentPage === pg
                    ? "bg-[#4318FF] text-white shadow-xs"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200"
                }`}
              >
                {pg}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NoteList;

