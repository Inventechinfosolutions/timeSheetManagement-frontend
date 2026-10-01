import React from "react";
import { FileText, Eye, Download, Trash2 } from "lucide-react";
import { NoteDocumentItem } from "../types/notes.types";
import { formatFileSize } from "../utils/notesHelpers";

interface NoteAttachmentChipProps {
  item: NoteDocumentItem;
  onPreview: (item: NoteDocumentItem) => void;
  onDownload: (item: NoteDocumentItem) => void;
  onDelete?: (item: NoteDocumentItem) => void;
}

export const NoteAttachmentChip: React.FC<NoteAttachmentChipProps> = ({
  item,
  onPreview,
  onDownload,
  onDelete,
}) => {
  const displayName = item.name || item.fileName || "Attachment";
  const ext = displayName.includes(".") ? displayName.split(".").pop()?.toUpperCase() : "FILE";
  const sizeText = formatFileSize(item.file?.size || item.size);

  return (
    <div className="inline-flex items-center gap-3.5 p-3 px-4 bg-white border border-slate-200/90 rounded-2xl shadow-xs min-w-[280px] max-w-sm transition hover:shadow-sm">
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0">
        <FileText className="w-5 h-5 text-slate-400" />
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-xs md:text-sm font-bold text-[#1B2559] truncate max-w-[170px]" title={displayName}>
          {displayName}
        </p>
        <p className="text-[11px] text-slate-400 font-medium">
          {sizeText} • {ext}
        </p>
      </div>

      <div className="flex items-center gap-1.5 shrink-0 ml-1">
        <button
          type="button"
          onClick={() => onPreview(item)}
          className="p-1.5 text-slate-400 hover:text-[#4318FF] hover:bg-slate-50 rounded-lg transition cursor-pointer"
          title="Preview File"
        >
          <Eye className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => onDownload(item)}
          className="p-1.5 text-slate-400 hover:text-[#4318FF] hover:bg-slate-50 rounded-lg transition cursor-pointer"
          title="Download File"
        >
          <Download className="w-4 h-4" />
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={() => onDelete(item)}
            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
            title="Remove File"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default NoteAttachmentChip;
