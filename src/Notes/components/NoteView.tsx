import React, { useRef, useEffect } from "react";
import {
  FileText,
  Edit3,
  Paperclip,
  Download,
  ChevronDown,
  ArrowLeft,
  Copy,
  Folder,
  Calendar,
  User,
  FileCode,
  Pin,
  Archive,
  ArchiveRestore,
  Send,
  Trash2,
} from "lucide-react";
import { Dropdown, Popconfirm, type MenuProps } from "antd";
import dayjs from "dayjs";
import { Note, NoteDocumentItem } from "../types/notes.types";
import { NoteAttachmentChip } from "./NoteAttachmentChip";
import {
  exportNoteToPdf,
  exportNoteToWord,
  copyNoteContentToClipboard,
} from "../utils/notesHelpers";

interface NoteViewProps {
  activeNote: Note;
  onStartEdit: (note: Note) => void;
  onBack: () => void;
  onPreviewAttachment: (item: NoteDocumentItem) => void;
  onDownloadAttachment: (item: NoteDocumentItem) => void;
  onTogglePin?: (noteId: number) => void;
  onToggleArchive?: (noteId: number) => void;
  onOpenSendModal?: (note: Note) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: (noteId: number) => void;
}

export const NoteView: React.FC<NoteViewProps> = ({
  activeNote,
  onStartEdit,
  onBack,
  onPreviewAttachment,
  onDownloadAttachment,
  onTogglePin,
  onToggleArchive,
  onOpenSendModal,
  canEdit = true,
  canDelete = false,
  onDelete,
}) => {
  const isProjectNote = activeNote.type === "PROJECT";
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!contentRef.current) return;
    const badges = contentRef.current.querySelectorAll<HTMLElement>(".table-file-badge");
    badges.forEach((badge) => {
      const fileKey = badge.getAttribute("data-file-key") || badge.querySelector("[data-key]")?.getAttribute("data-key");
      const fileName = badge.getAttribute("data-file-name") || badge.querySelector(".table-file-name")?.textContent || "Attachment";
      if (!badge.querySelector("[data-file-action='download']") && fileKey) {
        const previewBtn = badge.querySelector("[data-file-action='preview']");
        const downloadBtnHtml = `<button type="button" class="table-file-btn download" data-file-action="download" data-key="${fileKey}" data-name="${fileName}" title="Download file"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg></button>`;
        if (previewBtn) {
          previewBtn.insertAdjacentHTML("afterend", downloadBtnHtml);
        } else {
          badge.insertAdjacentHTML("beforeend", downloadBtnHtml);
        }
      }
    });
  }, [activeNote.description]);

  const getDownloadMenuItems = (note: Note): MenuProps["items"] => [
    {
      key: "pdf",
      icon: <FileText className="w-4 h-4 text-red-500" />,
      label: "Download as PDF",
      onClick: () => exportNoteToPdf(note),
    },
    {
      key: "word",
      icon: <FileCode className="w-4 h-4 text-blue-600" />,
      label: "Download as Word (.doc)",
      onClick: () => exportNoteToWord(note),
    },
  ];

  const handleContentViewClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement | null;
    if (!target) return;

    const downloadBtn = target.closest<HTMLElement>("[data-file-action='download']");
    if (downloadBtn) {
      const key =
        downloadBtn.getAttribute("data-key") ||
        downloadBtn.getAttribute("data-file-key") ||
        downloadBtn.closest<HTMLElement>("[data-file-key]")?.getAttribute("data-file-key");
      const name =
        downloadBtn.getAttribute("data-name") ||
        downloadBtn.getAttribute("data-file-name") ||
        downloadBtn.closest<HTMLElement>("[data-file-name]")?.getAttribute("data-file-name") ||
        "Attachment";

      if (key && onDownloadAttachment) {
        e.preventDefault();
        e.stopPropagation();
        onDownloadAttachment({
          key,
          fileKey: key,
          name,
          fileName: name,
        });
      }
      return;
    }

    const btn = target.closest<HTMLElement>(
      "[data-file-action='preview'], [data-file-key], .table-file-badge, .table-file-btn"
    );
    if (btn) {
      const key =
        btn.getAttribute("data-key") ||
        btn.getAttribute("data-file-key") ||
        btn.closest<HTMLElement>("[data-file-key]")?.getAttribute("data-file-key");
      const name =
        btn.getAttribute("data-name") ||
        btn.getAttribute("data-file-name") ||
        btn.closest<HTMLElement>("[data-file-name]")?.getAttribute("data-file-name") ||
        "Attachment";

      if (key) {
        e.preventDefault();
        e.stopPropagation();
        onPreviewAttachment({
          key,
          fileKey: key,
          name,
          fileName: name,
        });
      }
    }
  };

  return (
    <div className="w-full min-h-full bg-[#F4F7FE] p-3 sm:p-4 md:p-6 flex flex-col gap-4 font-sans">
      <div className="w-full bg-white rounded-2xl border border-slate-100 shadow-[0_4px_24px_rgba(0,0,0,0.03)] p-5 sm:p-7 md:p-8 flex flex-col gap-6">
        {/* Header Row: Project Pill, Title, Meta and Actions - Sticky at Top */}
        <div className="sticky top-0 z-30 bg-white -mt-5 -mx-5 px-5 pt-4 pb-3.5 sm:-mt-7 sm:-mx-7 sm:px-7 sm:pt-5 sm:pb-4 md:-mt-8 md:-mx-8 md:px-8 md:pt-6 md:pb-4 rounded-t-2xl border-b border-slate-100 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
          <div className="space-y-1.5 min-w-0 flex-1">
            {/* Row 1: Project/Category pill + Title/Subject + Status Badges */}
            <div className="flex items-center gap-2 flex-wrap min-w-0">
              {isProjectNote ? (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-indigo-50/90 text-[#4318FF] border border-indigo-100/90 rounded-md text-xs font-bold uppercase tracking-wider shadow-2xs shrink-0">
                  <Folder className="w-3.5 h-3.5 text-[#4318FF]" />
                  <span>Project: {activeNote.projectName || "Worksphere"}</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-md text-xs font-bold uppercase tracking-wider shadow-2xs shrink-0">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Personal Note</span>
                </span>
              )}

              <div className="flex items-baseline gap-1.5 min-w-0">
                <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider shrink-0">
                  Title/Subject:
                </span>
                <h1 className="text-sm sm:text-base font-semibold text-[#1B2559] tracking-normal leading-snug break-words">
                  {activeNote.title}
                </h1>
              </div>

              {activeNote.isPinned && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-bold shadow-2xs shrink-0">
                  <Pin className="w-3 h-3 fill-amber-500 text-amber-500" />
                  <span>Pinned</span>
                </span>
              )}
              {activeNote.isArchived && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-md text-[11px] font-bold shadow-2xs shrink-0">
                  <Archive className="w-3 h-3 text-slate-500" />
                  <span>Archived</span>
                </span>
              )}
            </div>

            {/* Row 2: Metadata Row (Date, Author, Attachments count) - All cleanly on one line */}
            <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
              <div className="flex items-center gap-1.5 font-medium text-slate-600 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                <span>{dayjs(activeNote.createdAt).format("MMM DD, YYYY")}</span>
              </div>
              <span className="text-slate-300">•</span>
              <div className="flex items-center gap-1.5 font-medium text-slate-600 shrink-0">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Created by <strong className="text-slate-700">{activeNote.createdBy || "User"}</strong></span>
              </div>
              {activeNote.attachments && activeNote.attachments.length > 0 && (
                <>
                  <span className="text-slate-300">•</span>
                  <div className="flex items-center gap-1.5 font-semibold text-[#4318FF] shrink-0">
                    <Paperclip className="w-3.5 h-3.5" />
                    <span>{activeNote.attachments.length} attachment{activeNote.attachments.length > 1 ? "s" : ""}</span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Action Buttons: Pin, Archive, Download Dropdown, Edit, Back */}
          <div className="flex items-center gap-2 flex-wrap shrink-0 self-start lg:self-center">
            {/* Pin Button */}
            {onTogglePin && (
              <button
                type="button"
                onClick={() => onTogglePin(activeNote.id)}
                className={`px-3 py-1.5 border font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  activeNote.isPinned
                    ? "bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
                title={activeNote.isPinned ? "Unpin Note" : "Pin Note to top"}
              >
                <Pin className={`w-3.5 h-3.5 ${activeNote.isPinned ? "fill-amber-500 text-amber-500" : "text-slate-500"}`} />
                <span>{activeNote.isPinned ? "Pinned" : "Pin"}</span>
              </button>
            )}

            {/* Archive / Restore Button */}
            {onToggleArchive && (
              <button
                type="button"
                onClick={() => onToggleArchive(activeNote.id)}
                className={`px-3 py-1.5 border font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs ${
                  activeNote.isArchived
                    ? "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200"
                    : "bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200"
                }`}
                title={activeNote.isArchived ? "Restore Note from Archive" : "Archive Note"}
              >
                {activeNote.isArchived ? (
                  <>
                    <ArchiveRestore className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Restore</span>
                  </>
                ) : (
                  <>
                    <Archive className="w-3.5 h-3.5 text-slate-500" />
                    <span>Archive</span>
                  </>
                )}
              </button>
            )}

            {onOpenSendModal && (
              <button
                type="button"
                onClick={() => onOpenSendModal(activeNote)}
                className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[#4318FF] border border-indigo-200 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                title="Send & Share Note"
              >
                <Send className="w-3.5 h-3.5 text-[#4318FF]" />
                <span>Send Note</span>
              </button>
            )}

            <Dropdown menu={{ items: getDownloadMenuItems(activeNote) }} trigger={["click"]}>
              <button
                type="button"
                className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/90 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs hover:shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#4318FF]" />
                <span>Download Note</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </Dropdown>

            {canEdit !== false && (
              <button
                type="button"
                onClick={() => onStartEdit(activeNote)}
                className="px-3.5 py-1.5 bg-[#4318FF] hover:bg-[#320fe0] text-white font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-xs"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Note</span>
              </button>
            )}

            {(canDelete || activeNote.canDelete) && onDelete && (
              <Popconfirm
                title="Delete this note?"
                description="Are you sure you want to delete this note and its attachments?"
                onConfirm={() => onDelete(activeNote.id)}
                okText="Delete"
                cancelText="Cancel"
                okButtonProps={{ danger: true }}
              >
                <button
                  type="button"
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                  <span>Delete</span>
                </button>
              </Popconfirm>
            )}

            <button
              type="button"
              onClick={onBack}
              className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-[#4318FF] font-semibold text-xs rounded-lg transition cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-[#4318FF]" />
              <span>Back</span>
            </button>
          </div>
        </div>

        {/* NOTE CONTENT VIEW */}
        <div className="space-y-2 w-full">
          {activeNote.description && activeNote.description.trim() && (
            <div className="flex items-center justify-end">
              <button
                type="button"
                onClick={() => copyNoteContentToClipboard(activeNote.description)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#4318FF] bg-slate-50 hover:bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-slate-200/70 transition cursor-pointer"
                title="Copy page content to clipboard"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Page</span>
              </button>
            </div>
          )}

          {/* A4 Workspace Simulation for View Mode */}
          <div className="a4-page-workspace w-full rounded-2xl flex justify-start items-start overflow-x-auto bg-slate-100/80 p-4 sm:p-8 min-h-[640px] border border-slate-200/60">
            <div
              className={`a4-page shrink-0 transition-all duration-300 ${
                activeNote.isVertical === false ? "landscape" : ""
              }`}
              style={
                activeNote.isVertical === false
                  ? { minWidth: "337mm", width: "max-content", minHeight: "210mm" }
                  : { minWidth: "210mm", width: "max-content", minHeight: "297mm" }
              }
            >
              {activeNote.description && activeNote.description.trim() ? (
                <div
                  ref={contentRef}
                  className="notes-content-view prose prose-slate max-w-none text-slate-800 text-sm sm:text-base leading-relaxed break-words"
                  dangerouslySetInnerHTML={{ __html: activeNote.description }}
                  onClick={handleContentViewClick}
                />
              ) : (
                <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 gap-3">
                  <FileText className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                  <p className="text-sm font-medium text-slate-500">No description or notes have been added yet.</p>
                  <button
                    type="button"
                    onClick={() => onStartEdit(activeNote)}
                    className="mt-1 px-4 py-2 bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Add Description</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Files & Attachments */}
        {activeNote.attachments && activeNote.attachments.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#4318FF]" />
              <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider block">
                FILES & ATTACHMENTS ({activeNote.attachments.length})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {activeNote.attachments.map((att) => (
                <NoteAttachmentChip
                  key={`view-att-${att.id || att.key || att.fileKey}`}
                  item={{
                    id: att.id,
                    key: att.key || att.fileKey,
                    name: att.fileName || att.name || "Attachment",
                    size: att.fileSize,
                  }}
                  onPreview={onPreviewAttachment}
                  onDownload={onDownloadAttachment}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteView;
