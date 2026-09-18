import React from "react";
import {
  Plus,
  Minus,
  Eye,
  Pencil,
  Trash2,
  Download,
  X,
  Loader2,
  Paperclip,
  FileText,
  File,
} from "lucide-react";
import {
  EmployeeNote,
  NoteFile,
  NoteCategory,
  EmployeeNotesMobileProps,
} from "./Employeenotes.types";
import "./Employeenotes.css";

export type { EmployeeNotesMobileProps };

const stripHtmlTags = (html?: string) => {
  if (!html) return "";
  return html.replace(/<[^>]*>?/gm, "").trim();
};

const formatDateOnly = (iso?: string) => {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
  });
};

const capitalizeFirst = (str?: string) => {
  if (!str) return str || "";
  return str.charAt(0).toUpperCase() + str.slice(1);
};

const getFileIcon = (fileName: string) => {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (["png", "jpg", "jpeg", "webp", "gif", "svg"].includes(ext)) {
    return <FileText className="text-purple-500 shrink-0" size={13} />;
  }
  if (ext === "pdf") {
    return <FileText className="text-red-500 shrink-0" size={13} />;
  }
  if (["doc", "docx"].includes(ext)) {
    return <FileText className="text-blue-500 shrink-0" size={13} />;
  }
  if (["xls", "xlsx", "csv"].includes(ext)) {
    return <FileText className="text-emerald-500 shrink-0" size={13} />;
  }
  return <File className="text-gray-500 shrink-0" size={13} />;
};

const getNotePreview = (note: EmployeeNote) => {
  if (note.rows && note.rows.length > 0) {
    const first = note.rows[0];
    const firstLabel = first.notes || first.title || "Project details added";
    if (note.rows.length > 1) {
      return `${firstLabel} (+${note.rows.length - 1} more project${
        note.rows.length - 1 === 1 ? "" : "s"
      })`;
    }
    return firstLabel;
  }
  if (note.content) {
    const plain = stripHtmlTags(note.content);
    return plain || "No description added yet";
  }
  return "No description added yet";
};

export const EmployeeNotesMobile: React.FC<EmployeeNotesMobileProps> = ({
  paginatedNotes,
  allNotes,
  currentPage,
  itemsPerPage,
  canManageNotes,
  expandedRowProjectNotes,
  toggleRowProjectNotesExpand,
  openViewNote,
  openEditModal,
  setNoteToDelete,
  openSubTableCreateNote,
  uploadingNoteId,
  handleTableDirectUpload,
  handleTableRemoveFile,
  openFilePreview,
  downloadFile,
  getAuthorDisplay,
}) => {
  return (
    <div className="divide-y divide-gray-100">
      {paginatedNotes.map((note, idx) => {
        const slNo = (currentPage - 1) * itemsPerPage + idx + 1;
        const isProject = note.category === "Project Note";
        const createdDate = note.createdAt || note.updatedAt;
        const hasFiles = note.files && note.files.length > 0;
        const isUploadingThisNote = uploadingNoteId === note.id;
        const isExpanded = expandedRowProjectNotes.includes(note.id);

        // Child notes belonging to this parent note
        const childNotes = allNotes.filter((n) => n.parentNoteId === note.id);

        return (
          <div key={note.id} className="p-4 bg-white transition-colors">
            {/* Top Row: SL NO + Expand Toggle + Project/Category Badge */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-bold text-[#A3AED0] shrink-0">
                  #{slNo}
                </span>
                <button
                  type="button"
                  onClick={() => toggleRowProjectNotesExpand(note.id)}
                  className={`w-6 h-6 rounded-md flex items-center justify-center transition-all cursor-pointer shrink-0 ${
                    isExpanded
                      ? "bg-[#4318FF] text-white shadow-xs"
                      : "bg-blue-50 hover:bg-blue-100 text-[#4318FF] border border-blue-200"
                  }`}
                  title={isExpanded ? "Collapse notes" : "Expand notes"}
                  aria-label={isExpanded ? "Collapse notes" : "Expand notes"}
                >
                  {isExpanded ? (
                    <Minus size={13} className="stroke-[2.5]" />
                  ) : (
                    <Plus size={13} className="stroke-[2.5]" />
                  )}
                </button>
                {note.projectName && (
                  <span className="text-xs font-extrabold uppercase tracking-wider text-[#4318FF] truncate max-w-[160px]">
                    {note.projectName}
                  </span>
                )}
              </div>

              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#2B3674] shrink-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    isProject ? "bg-emerald-500" : "bg-blue-500"
                  }`}
                />
                {isProject ? "Project" : "Personal"}
              </span>
            </div>

            {/* Note Title */}
            <button
              type="button"
              onClick={() => openViewNote(note)}
              className="text-sm font-bold text-[#2B3674] hover:text-[#4318FF] hover:underline truncate text-left cursor-pointer max-w-full block mb-1"
              title={`View details: ${note.title}`}
            >
              {note.title || "Untitled note"}
            </button>

            {/* Note Preview */}
            <p className="text-xs text-[#475569] leading-snug line-clamp-2 mb-2">
              {getNotePreview(note)}
            </p>

            {/* Date & Author */}
            <p className="text-[11px] text-[#707EAE] font-semibold mb-2.5">
              {formatDateOnly(createdDate)} &bull; by{" "}
              {capitalizeFirst(getAuthorDisplay(note.createdBy))}
            </p>

            {/* Attachments / Files */}
            <div className="mb-3">
              {isUploadingThisNote ? (
                <div className="inline-flex items-center gap-1.5 text-xs text-[#4318FF] font-bold py-1 px-2.5 bg-blue-50 rounded-lg border border-blue-200">
                  <Loader2 size={13} className="animate-spin text-[#4318FF]" />
                  <span>Uploading...</span>
                </div>
              ) : (
                <div className="flex items-center flex-wrap gap-1.5">
                  {(note.files || []).map((f) => (
                    <div
                      key={f.id}
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-[#2B3674] text-[11px] font-semibold border border-blue-200"
                    >
                      {getFileIcon(f.name)}
                      <button
                        type="button"
                        onClick={() => openFilePreview(f)}
                        title={`View file: ${f.name}`}
                        className="truncate max-w-[100px] hover:underline cursor-pointer font-semibold"
                      >
                        {f.name}
                      </button>
                      <button
                        type="button"
                        onClick={() => openFilePreview(f)}
                        title="Preview"
                        className="text-[#4318FF] hover:text-[#3311CC] p-0.5 cursor-pointer"
                      >
                        <Eye size={11} />
                      </button>
                      {f.dataUrl && (
                        <button
                          type="button"
                          onClick={() => downloadFile(f)}
                          title="Download"
                          className="text-emerald-600 hover:text-emerald-700 p-0.5 cursor-pointer"
                        >
                          <Download size={11} />
                        </button>
                      )}
                      {canManageNotes && (
                        <button
                          type="button"
                          onClick={() => handleTableRemoveFile(note, f.id)}
                          title="Remove file"
                          className="text-gray-400 hover:text-red-500 p-0.5 cursor-pointer"
                        >
                          <X size={11} />
                        </button>
                      )}
                    </div>
                  ))}

                  {canManageNotes && (
                    <label
                      title="Add files (multiple allowed)"
                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md border border-dashed border-[#4318FF]/50 text-[#4318FF] bg-blue-50/60 hover:bg-blue-100 text-[11px] font-bold cursor-pointer transition-all"
                    >
                      <Plus size={12} className="text-[#4318FF] stroke-[2.5]" />
                      <span>{hasFiles ? "Add" : "Add files"}</span>
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => handleTableDirectUpload(note, e)}
                      />
                    </label>
                  )}

                  {!hasFiles && !canManageNotes && (
                    <span className="text-[11px] text-gray-400 font-medium">
                      No files
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Main Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openViewNote(note)}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 transition-colors cursor-pointer text-xs font-semibold"
              >
                <Eye size={13} />
                <span>View</span>
              </button>
              {canManageNotes && (
                <>
                  <button
                    type="button"
                    onClick={() => openEditModal(note)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-blue-50 text-[#4318FF] hover:bg-blue-100 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <Pencil size={13} />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setNoteToDelete(note)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg bg-red-50 text-red-500 hover:bg-red-100 transition-colors cursor-pointer text-xs font-semibold"
                  >
                    <Trash2 size={13} />
                    <span>Delete</span>
                  </button>
                </>
              )}
            </div>

            {/* EXPANDED SUB-CARDS SECTION */}
            {isExpanded && (
              <div className="mt-3 pt-3 border-t border-dashed border-blue-200 bg-gradient-to-b from-blue-50/60 to-indigo-50/40 rounded-xl p-3 space-y-3 animate-fadeIn">
                {/* Sub-section Header */}
                {canManageNotes && (
                  <div className="flex items-center justify-end pb-1 border-b border-blue-100">
                    <button
                      type="button"
                      onClick={() =>
                        openSubTableCreateNote(
                          note.projectName || "",
                          note.id,
                          note.category
                        )
                      }
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-md bg-[#4318FF] hover:bg-[#3410d1] text-white shadow-xs transition-all cursor-pointer shrink-0"
                      title={`Add ${isProject ? "project" : "personal"} note`}
                    >
                      <Plus size={13} className="stroke-[2.5]" />
                      <span>Add Note</span>
                    </button>
                  </div>
                )}

                {/* Sub-Cards List */}
                {childNotes.length === 0 ? (
                  <div className="text-center py-4 px-2 text-xs text-slate-400 font-medium bg-white rounded-lg border border-dashed border-gray-200">
                    No notes yet. Click{" "}
                    <span className="font-bold text-[#4318FF]">+ Add Note</span>{" "}
                    to add one.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {childNotes.map((child, cIdx) => {
                      const childCreatedDate =
                        child.createdAt || child.updatedAt;
                      return (
                        <div
                          key={child.id}
                          className="bg-white rounded-lg p-2.5 border border-blue-100 shadow-2xs space-y-2 hover:border-blue-300 transition-colors"
                        >
                          {/* Sub-card top: index + title + date */}
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <span className="text-[10px] font-extrabold text-[#4318FF] bg-blue-50 px-1.5 py-0.5 rounded shrink-0">
                                #{cIdx + 1}
                              </span>
                              <button
                                type="button"
                                onClick={() => openViewNote(child)}
                                className="text-xs font-bold text-slate-900 hover:text-[#4318FF] hover:underline text-left cursor-pointer truncate block"
                                title={child.title || "Untitled"}
                              >
                                {child.title || "Untitled"}
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-400 shrink-0 font-medium">
                              {formatDateOnly(childCreatedDate)}
                            </span>
                          </div>

                          {/* Sub-card middle: author & attachments badge */}
                          <div className="flex items-center justify-between text-[10px] text-slate-500">
                            <span>
                              by{" "}
                              {capitalizeFirst(
                                getAuthorDisplay(child.createdBy)
                              )}
                            </span>
                            {child.files && child.files.length > 0 && (
                              <span className="inline-flex items-center gap-1 text-[10px] text-[#4318FF] font-semibold bg-blue-50 px-1.5 py-0.5 rounded">
                                <Paperclip size={10} />
                                <span>
                                  {child.files.length} file
                                  {child.files.length > 1 ? "s" : ""}
                                </span>
                              </span>
                            )}
                          </div>

                          {/* Sub-card bottom: Action buttons */}
                          <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-gray-100">
                            <button
                              type="button"
                              onClick={() => openViewNote(child)}
                              title="View Note"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-[#4318FF] hover:bg-indigo-100 text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            {canManageNotes && (
                              <>
                                <button
                              type="button"
                              onClick={() => openEditModal(child)}
                              title="Edit Note"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-50 text-[#4318FF] hover:bg-blue-100 text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              <Pencil size={12} />
                              <span>Edit</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setNoteToDelete(child)}
                              title="Delete Note"
                              className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-red-50 text-red-500 hover:bg-red-100 text-[11px] font-semibold cursor-pointer transition-colors"
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default EmployeeNotesMobile;
