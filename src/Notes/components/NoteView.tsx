import React, { useLayoutEffect, useRef } from "react";
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
import { Note, NoteDocumentItem, ExcelWorkbookData } from "../types/notes.types";
import { NoteAttachmentChip } from "./NoteAttachmentChip";
import {
  exportNoteToPdf,
  exportNoteToWord,
  copyNoteContentToClipboard,
  wrapWideTablesInRoot,
  wrapNoteInlineImages,
} from "../utils/notesHelpers";
import {
  absorbOrphansIntoPages,
  buildDocumentPagesHtml,
  isNoteLandscape,
} from "../utils/documentLayout";
import { refreshAttachmentBadges } from "../utils/noteEditorAttachmentHelpers";
import {
  htmlHasVisibleNoteContent,
  parseExcelWorkbookFromHtml,
  stripExcelWorkbookStore,
} from "../utils/excelExtract";
import { ExcelSpreadsheetView } from "../../components/ExcelSpreadsheetView";

interface NoteViewProps {
  activeNote: Note;
  excelWorkbook?: ExcelWorkbookData | null;
  onStartEdit: (note: Note) => void;
  onBack: () => void;
  onPreviewAttachment: (item: NoteDocumentItem) => void;
  onDownloadAttachment: (item: NoteDocumentItem) => void;
  onPreviewImage?: (url: string, title?: string) => void;
  /** Resolve authorized blob URLs for inline images saved as attachment keys */
  onHydrateInlineImages?: (root: HTMLElement) => Promise<void>;
  onTogglePin?: (noteId: number) => void;
  onToggleArchive?: (noteId: number) => void;
  onOpenSendModal?: (note: Note) => void;
  canEdit?: boolean;
  canDelete?: boolean;
  onDelete?: (noteId: number) => void;
}

export const NoteView: React.FC<NoteViewProps> = ({
  activeNote,
  excelWorkbook,
  onStartEdit,
  onBack,
  onPreviewAttachment,
  onDownloadAttachment,
  onPreviewImage,
  onHydrateInlineImages,
  onTogglePin,
  onToggleArchive,
  onOpenSendModal,
  canEdit = true,
  canDelete = false,
  onDelete,
}) => {
  const isProjectNote = activeNote.type === "PROJECT";
  const isLandscape = isNoteLandscape(activeNote);
  // Excel viewer only when description is an Excel note (workbook store), not when .xlsx is just a file attachment
  const storedWorkbook = parseExcelWorkbookFromHtml(activeNote.description);
  const viewerWorkbook =
    storedWorkbook && excelWorkbook?.sheetNames?.length
      ? excelWorkbook
      : storedWorkbook?.sheetNames?.length
        ? storedWorkbook
        : null;
  const visibleDescription = stripExcelWorkbookStore(activeNote.description);
  const showA4Content = htmlHasVisibleNoteContent(visibleDescription);
  const contentRef = useRef<HTMLDivElement>(null);

  // Match edit: show Files uploads (incl. row attaches); hide Excel workbook only
  const filesSectionAttachments = (activeNote.attachments || []).filter((att) => {
    const key = att.key || att.fileKey;
    const name = att.fileName || att.name;
    const excelKey = storedWorkbook?.fileKey || excelWorkbook?.fileKey;
    const excelName = storedWorkbook?.fileName || excelWorkbook?.fileName;
    if (key && excelKey && key === excelKey) return false;
    if (name && excelName && name === excelName) return false;
    return true;
  });

  useLayoutEffect(() => {
    if (!showA4Content || !contentRef.current) return;
    const root = contentRef.current;
    // Match edit: keep saved page layout — do NOT reflow onto a next sheet
    absorbOrphansIntoPages(root, isLandscape);
    wrapWideTablesInRoot(root);
    wrapNoteInlineImages(root);
    refreshAttachmentBadges(root);
    wrapWideTablesInRoot(root);
    let cancelled = false;
    (async () => {
      if (onHydrateInlineImages) {
        await onHydrateInlineImages(root);
      }
      if (cancelled || !contentRef.current) return;
      wrapNoteInlineImages(contentRef.current);
      wrapWideTablesInRoot(contentRef.current);
    })();
    return () => {
      cancelled = true;
    };
  }, [activeNote.description, isLandscape, showA4Content, onHydrateInlineImages]);

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

    if (target.tagName === "IMG" && onPreviewImage) {
      const img = target as HTMLImageElement;
      const src = img.currentSrc || img.src;
      if (src) {
        e.preventDefault();
        e.stopPropagation();
        onPreviewImage(src, img.getAttribute("alt") || img.getAttribute("title") || "Screenshot");
        return;
      }
    }

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
                <span>{dayjs(activeNote.createdAt).format("MMM DD, YYYY hh:mm A")}</span>
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

        {/* DESCRIPTION / NOTE CONTENT VIEW */}
        <div className="space-y-3 w-full">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#4318FF]" />
              <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider">
                Description & Content
              </span>
            </div>

            <div className="flex items-center gap-2">
              {activeNote.description && activeNote.description.trim() && (
                <button
                  type="button"
                  onClick={() => copyNoteContentToClipboard(activeNote.description)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-[#4318FF] bg-slate-50 hover:bg-indigo-50/50 px-3 py-1.5 rounded-lg border border-slate-200/70 transition cursor-pointer"
                  title="Copy note text to clipboard"
                >
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Text</span>
                </button>
              )}
            </div>
          </div>

          {/* A4 description (kept) + Excel grid when present — Excel never replaces existing content */}
          <div className="w-full flex flex-col gap-4">
            {showA4Content ? (
              <div
                className={`a4-page-workspace w-full rounded-2xl flex items-start overflow-x-auto overflow-y-visible bg-slate-100/80 p-4 sm:p-8 min-h-[720px] border border-slate-200/60${
                  isLandscape ? " is-landscape justify-start" : " justify-center"
                }`}
              >
                <div className="a4-page-rotator">
                  <div className="a4-page doc-pages">
                    <div
                      className={`notes-content-view doc-pages-editor text-slate-800 text-sm sm:text-base leading-relaxed break-words${isLandscape ? " is-landscape" : ""}`}
                      ref={contentRef}
                      onClick={handleContentViewClick}
                      dangerouslySetInnerHTML={{
                        __html: buildDocumentPagesHtml(
                          visibleDescription,
                          undefined,
                          undefined,
                          undefined,
                          isLandscape
                        ),
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : !viewerWorkbook?.sheetNames?.length ? (
              <div
                className={`a4-page-workspace w-full rounded-2xl flex items-start overflow-x-auto overflow-y-visible bg-slate-100/80 p-4 sm:p-8 min-h-[720px] border border-slate-200/60${
                  isLandscape ? " is-landscape justify-start" : " justify-center"
                }`}
              >
                <div className="a4-page-rotator">
                  <div className="a4-page doc-pages">
                    <div className="notes-content-view doc-pages-editor">
                      <div className="page">
                        <div className="flex flex-col items-center justify-center py-24 text-center text-slate-400 gap-3">
                          <FileText className="w-12 h-12 text-slate-300 stroke-[1.5]" />
                          <p className="text-sm font-medium text-slate-500">
                            No description or notes have been added yet.
                          </p>
                          <button
                            type="button"
                            onClick={() => onStartEdit(activeNote)}
                            className="mt-1 px-4 py-2 bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 font-semibold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>Add Description</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            {viewerWorkbook?.sheetNames?.length ? (
              <div className="w-full overflow-auto bg-white rounded-2xl p-4 sm:p-5 min-h-[480px] border border-slate-200/60">
                <ExcelSpreadsheetView embedded workbook={viewerWorkbook} />
              </div>
            ) : null}
          </div>
      </div>

        {/* Files & Attachments — only true file uploads, not Excel/table embeds */}
        {filesSectionAttachments.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-[#4318FF]" />
              <span className="text-xs md:text-sm font-bold text-[#1B2559] uppercase tracking-wider block">
                FILES & ATTACHMENTS ({filesSectionAttachments.length})
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {filesSectionAttachments.map((att) => (
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
