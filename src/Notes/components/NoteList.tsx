import React, { useState } from "react";
import {
  FileText,
  Plus,
  Trash2,
  Edit3,
  Eye,
  Pin,
  Archive,
  ArchiveRestore,
  Send,
  Paperclip,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Tooltip } from "antd";
import { PopconfirmWithTooltip } from "../../components/ui/PopconfirmWithTooltip";
import dayjs from "dayjs";
import { Note, NoteType } from "../types/notes.types";
import { noteMatchesCreatedDate, noteMatchesSearch } from "../utils/notesHelpers";
import { SearchBox, Pagination } from "../../components/ui";
import { useNoteDragDrop } from "../hooks/useNoteDragDrop";
import { WorksphereLogoLoader } from "../../components/ApiLoadingSpinner";

interface NoteListProps {
  loading?: boolean;
  notes: Note[];
  paginatedNotes: Note[];
  totalNotesCount?: number;
  currentPage: number;
  pageSize: number;
  totalPages: number;
  activeTab: NoteType;
  searchQuery: string;
  fromDate: string;
  toDate: string;
  expandedNotes: Record<number, boolean>;
  loadingSubNotes?: Record<number, boolean>;
  currentUser?: { loginId?: string } | null;
  dragDrop?: ReturnType<typeof useNoteDragDrop>;
  childPages?: Record<number, number>;
  childTotals?: Record<number, number>;
  childFilters?: Record<number, { search: string; from: string; to: string }>;
  onChildPageChange?: (parentId: number, page: number) => void;
  onChildFilterChange?: (parentId: number, patch: Partial<{ search: string; from: string; to: string }>) => void;
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
  totalNotesCount,
  currentPage,
  pageSize,
  totalPages,
  activeTab,
  searchQuery,
  fromDate,
  toDate,
  expandedNotes,
  loadingSubNotes,
  currentUser,
  childPages,
  childTotals,
  childFilters,
  onChildPageChange,
  onChildFilterChange,
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
  const CHILD_PAGE_SIZE = 3;
  const [localChildFilters, setLocalChildFilters] = useState<
    Record<number, { search: string; from: string; to: string }>
  >({});
  const [localChildPages, setLocalChildPages] = useState<Record<number, number>>({});

  const getChildPage = (noteId: number) =>
    (childPages && childPages[noteId]) || localChildPages[noteId] || 1;
  const setChildPage = (noteId: number, page: number) => {
    setLocalChildPages((prev) => ({ ...prev, [noteId]: page }));
    if (onChildPageChange) {
      onChildPageChange(noteId, page);
    }
  };

  const childFilterFor = (noteId: number) =>
    (childFilters && childFilters[noteId]) ||
    localChildFilters[noteId] || { search: "", from: "", to: "" };

  const setChildFilter = (
    noteId: number,
    patch: Partial<{ search: string; from: string; to: string }>,
  ) => {
    setLocalChildFilters((prev) => ({
      ...prev,
      [noteId]: { ...childFilterFor(noteId), ...prev[noteId], ...patch },
    }));
    setLocalChildPages((prev) => ({ ...prev, [noteId]: 1 }));
    if (onChildFilterChange) {
      onChildFilterChange(noteId, patch);
    }
  };


  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-[0_2px_12px_rgba(0,0,0,0.02)] overflow-hidden">
      {loading ? (
        <div className="py-24 text-center flex flex-col items-center justify-center">
          <WorksphereLogoLoader />
          <span className="mt-3 text-xs font-semibold text-slate-500">Loading notes...</span>
        </div>
      ) : notes.length === 0 ? (
        <div className="p-16 text-center flex flex-col items-center justify-center">
          <div className="w-14 h-14 bg-indigo-50 text-[#4318FF] rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
            <FileText className="w-7 h-7 text-[#4318FF]" />
          </div>
          <h3 className="text-base font-bold text-[#1B2559] mb-1">
            {searchQuery || fromDate || toDate ? "No matching notes found" : "No notes created yet"}
          </h3>
          <p className="text-slate-400 text-xs md:text-sm max-w-sm mb-6">
            {searchQuery || fromDate || toDate
              ? "Try clearing your search or date filter."
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
                {/* <th className="py-4 px-6">DESCRIPTION</th> */}
                <th className="py-4 px-6">CREATED BY</th>
                <th className="py-4 px-6 text-center w-48">ACTION</th>
              </tr>
            </thead>



            <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700 font-medium">
              {paginatedNotes.map((note, index) => {
                const slNo = (currentPage - 1) * pageSize + index + 1;
                const isExpanded = !!expandedNotes[note.id];
                const subNotes = note.subNotes || [];
                const childFilter = childFilterFor(note.id);
                const parentMatchesFilters =
                  noteMatchesSearch(note, searchQuery) &&
                  noteMatchesCreatedDate(note.createdAt, fromDate, toDate);
                const childCurrentPage = getChildPage(note.id);
                const totalChildCount =
                  (childTotals && childTotals[note.id] !== undefined)
                    ? childTotals[note.id]
                    : ((note as any).subNotesTotal !== undefined
                        ? (note as any).subNotesTotal
                        : ((note as any).subNotesCount !== undefined ? (note as any).subNotesCount : subNotes.length));

                // When subNotes are paginated by the server (3 per page), display them directly.
                // Fall back to client-side slice if an unpaginated list with > 3 items was provided.
                const paginatedSubNotes =
                  (note as any).subNotesTotal !== undefined || (childTotals && childTotals[note.id] !== undefined) || subNotes.length <= CHILD_PAGE_SIZE
                    ? subNotes
                    : subNotes.slice((childCurrentPage - 1) * CHILD_PAGE_SIZE, childCurrentPage * CHILD_PAGE_SIZE);
                return (
                  <React.Fragment key={note.id}>
                    <tr className="hover:bg-slate-50/80 transition-colors">
                      {/* SL NO with Expand Button */}
                      <td className="py-4 px-6">
                        <div className="flex items-center justify-center gap-2">
                          <span className="font-bold text-slate-800">{slNo}</span>
                          <button
                            type="button"
                            onClick={() => onToggleExpand(note.id)}
                            className={`w-6 h-6 rounded border flex items-center justify-center text-xs font-bold transition cursor-pointer ${
                              isExpanded
                                ? "border-[#4318FF] bg-[#4318FF] text-white"
                                : "border-slate-300 hover:border-[#4318FF] text-slate-600 hover:text-[#4318FF] bg-white shadow-xs"
                            }`}
                            title={isExpanded ? "Collapse sub-notes" : `Expand sub-notes${(note as any).subNotesCount ? ` (${(note as any).subNotesCount})` : ""}`}
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
                        </div>
                        {(((note as any).attachmentsCount ?? 0) > 0 || (note.attachments && note.attachments.length > 0)) && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#4318FF] font-semibold">
                            <Paperclip className="w-3 h-3 text-[#4318FF]" />
                            <span>
                              {(note as any).attachmentsCount ?? note.attachments?.length} attachment{((note as any).attachmentsCount ?? note.attachments?.length) > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Description Column */}
                      {/* <td className="py-4 px-6">
                        <div className="max-w-xs sm:max-w-sm text-slate-500 text-xs line-clamp-2">
                          {getCleanDescriptionSnippet(note.description, 75) || (
                            <span
                              onClick={() => onStartView(note)}
                              className="text-[#4318FF] hover:underline cursor-pointer"
                            >
                              Click View to read
                            </span>
                          )}
                        </div>
                        {(((note as any).attachmentsCount ?? 0) > 0 || (note.attachments && note.attachments.length > 0)) && (
                          <div className="mt-1 flex items-center gap-1 text-[11px] text-[#4318FF] font-semibold">
                            <Paperclip className="w-3 h-3 text-[#4318FF]" />
                            <span>
                              {(note as any).attachmentsCount ?? note.attachments?.length} attachment{((note as any).attachmentsCount ?? note.attachments?.length) > 1 ? "s" : ""}
                            </span>
                          </div>
                        )}
                      </td> */}

                      {/* Created By */}
                      <td className="py-4 px-6 text-slate-600">
                        <div>{dayjs(note.createdAt).format("MMM DD, YYYY hh:mm A")}</div>
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
                        <td colSpan={isProjectNotesTab ? 5 : 4} className="p-0 bg-slate-50/50">
                          <div className="p-5 pl-12 space-y-3">
                            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                              <div className="flex flex-wrap items-center gap-2">
                                <SearchBox
                                  placeholder="Search child notes..."
                                  value={childFilter.search}
                                  onDebounce={(value) => setChildFilter(note.id, { search: value })}
                                  onClear={() => setChildFilter(note.id, { search: "" })}
                                  containerClassName="w-full sm:w-56"
                                />
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                  From
                                  <input
                                    type="date"
                                    value={childFilter.from}
                                    max={childFilter.to || undefined}
                                    onChange={(e) => setChildFilter(note.id, { from: e.target.value })}
                                    className="h-9 px-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700"
                                  />
                                </label>
                                <label className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                                  To
                                  <input
                                    type="date"
                                    value={childFilter.to}
                                    min={childFilter.from || undefined}
                                    onChange={(e) => setChildFilter(note.id, { to: e.target.value })}
                                    className="h-9 px-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-700"
                                  />
                                </label>
                                {(childFilter.search || childFilter.from || childFilter.to) && (
                                  <button
                                    type="button"
                                    onClick={() => setChildFilter(note.id, { search: "", from: "", to: "" })}
                                    className="h-9 px-3 rounded-xl border border-slate-200 bg-white text-[11px] font-semibold text-slate-600 hover:bg-slate-50 cursor-pointer"
                                  >
                                    Clear
                                  </button>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => onStartCreateSubNote(note)}
                                className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#4318FF] hover:bg-[#320fe0] text-white text-xs font-semibold rounded-xl shadow-sm transition cursor-pointer self-start lg:self-auto"
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
                                    {/* <th className="py-3 px-6">DESCRIPTION</th> */}
                                    <th className="py-3 px-6">CREATED BY</th>
                                    <th className="py-3 px-6 text-center w-44">ACTIONS</th>
                                  </tr>
                                </thead>

                                <tbody className="divide-y divide-slate-100 text-xs md:text-sm text-slate-700">
                                  {loadingSubNotes?.[note.id] ? (
                                    <tr>
                                      <td colSpan={4} className="py-8 text-center text-slate-500">
                                        <div className="flex items-center justify-center gap-2">
                                          <div className="w-4 h-4 border-2 border-[#4318FF] border-t-transparent rounded-full animate-spin" />
                                          <span className="text-xs">Loading child notes...</span>
                                        </div>
                                      </td>
                                    </tr>
                                  ) : paginatedSubNotes.length === 0 ? (
                                    <tr>
                                      <td colSpan={4} className="py-8 text-center text-slate-400">
                                        {subNotes.length === 0 ? (
                                          <>
                                            No notes yet. Click{" "}
                                            <button
                                              type="button"
                                              onClick={() => onStartCreateSubNote(note)}
                                              className="font-bold text-[#4318FF] hover:underline cursor-pointer bg-transparent border-none p-0 inline"
                                            >
                                              + Add Note
                                            </button>{" "}
                                            to add one.
                                          </>
                                        ) : (
                                          "No child notes match this search or date."
                                        )}
                                      </td>
                                    </tr>
                                  ) : (
                                    paginatedSubNotes.map((sub, subIdx) => {
                                      const subSlNo = (childCurrentPage - 1) * CHILD_PAGE_SIZE + subIdx + 1;
                                      return (
                                        <tr
                                          key={sub.id}
                                          className="hover:bg-slate-50 transition-colors"
                                        >
                                          <td className="py-3 px-5 text-center font-bold text-slate-700">
                                            <span>{subSlNo}</span>
                                          </td>
                                          <td className="py-3 px-6">
                                            <span
                                              onClick={() => onStartView(sub)}
                                              className="font-semibold text-slate-800 hover:text-[#4318FF] transition cursor-pointer"
                                            >
                                              {sub.title}
                                            </span>
                                            {sub.attachments && sub.attachments.length > 0 && (
                                              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#4318FF] font-semibold">
                                                <Paperclip className="w-2.5 h-2.5 text-[#4318FF]" />
                                                <span>
                                                  {sub.attachments.length} attachment{sub.attachments.length > 1 ? "s" : ""}
                                                </span>
                                              </div>
                                            )}
                                          </td>
                                          {/* Sub-note Description Column */}
                                          {/* <td className="py-3 px-6">
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
                                          </td> */}
                                          <td className="py-3 px-6 text-slate-600">
                                            <div>{dayjs(sub.createdAt).format("MMM DD, YYYY hh:mm A")}</div>
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

                              {totalChildCount > 0 && (
                                <div className="p-3 border-t border-slate-100 bg-white">
                                  <Pagination
                                    currentPage={childCurrentPage}
                                    totalItems={totalChildCount}
                                    pageSize={CHILD_PAGE_SIZE}
                                    onPageChange={(page) => setChildPage(note.id, page)}
                                    showTotal={true}
                                  />
                                </div>
                              )}
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
      {notes.length > 0 && (() => {
        const totalCount = totalNotesCount && totalNotesCount > 0 ? totalNotesCount : notes.length;
        const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
        const endItem = Math.min(startItem + notes.length - 1, totalCount);

        return (
          <div className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-100 text-xs text-slate-500">
            <div>
              Showing <span className="font-bold text-slate-800">{startItem}</span> -{" "}
              <span className="font-bold text-slate-800">{endItem}</span> of{" "}
              <span className="font-bold text-slate-800">{totalCount}</span> notes
            </div>

            <div className="flex items-center gap-1.5">
              {/* Previous Page Button */}
              <button
                type="button"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage <= 1}
                className="w-7 h-7 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center font-semibold"
                title="Previous page"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>

              {/* Numbered Page Buttons */}
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => (
                <button
                  key={`page-${pg}`}
                  type="button"
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

              {/* Next Page Button */}
              <button
                type="button"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage >= totalPages}
                className="w-7 h-7 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-all flex items-center justify-center font-semibold"
                title="Next page"
                aria-label="Next page"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
};

export default NoteList;

