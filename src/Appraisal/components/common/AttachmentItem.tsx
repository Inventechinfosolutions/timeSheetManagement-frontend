import React, { useState } from "react";
import { Modal, Spin, message } from "antd";
import { Paperclip, Eye, Download, Trash2, FileText } from "lucide-react";
import { AppraisalApi } from "../../reducers/appraisal.reducer";
import { StoredPerformanceFile } from "../../types/appraisal.types";

export interface AttachmentItemProps {
  file: StoredPerformanceFile;
  canDelete?: boolean;
  onDelete?: (objectKey: string) => Promise<void> | void;
  readOnly?: boolean;
}

export const AttachmentItem: React.FC<AttachmentItemProps> = ({
  file,
  canDelete = false,
  onDelete,
  readOnly = false,
}) => {
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<string>("");

  const isImage = (type: string, name: string) => {
    return (
      (type && type.startsWith("image/")) ||
      /\.(png|jpe?g|gif|webp|svg|bmp)$/i.test(name)
    );
  };

  const isPdf = (type: string, name: string) => {
    return type === "application/pdf" || /\.pdf$/i.test(name);
  };

  const handleDownload = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!file.objectKey) {
      message.error("File key is missing");
      return;
    }
    setDownloading(true);
    try {
      await AppraisalApi.downloadPerformanceAttachment(file.objectKey, file.fileName);
      message.success(`Downloading ${file.fileName}`);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to download document.");
    } finally {
      setDownloading(false);
    }
  };

  const handlePreview = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!file.objectKey) {
      message.error("File key is missing");
      return;
    }
    setPreviewing(true);
    try {
      const { blobUrl, contentType } = await AppraisalApi.previewPerformanceAttachment(file.objectKey);
      setPreviewUrl(blobUrl);
      setPreviewType(contentType);
      setModalOpen(true);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to load document preview.");
    } finally {
      setPreviewing(false);
    }
  };

  const handleDelete = async (e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!onDelete || !file.objectKey) return;
    setDeleting(true);
    try {
      await onDelete(file.objectKey);
    } catch (error: any) {
      message.error(error?.response?.data?.message || "Failed to delete document.");
    } finally {
      setDeleting(false);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  return (
    <>
      <div className="group/chip inline-flex items-center gap-2.5 px-3 py-1.5 bg-[#EFF6FF] hover:bg-[#E0EEFF] border border-[#BFDBFE] hover:border-[#93C5FD] rounded-xl shadow-2xs transition-all max-w-full">
        <Paperclip className="w-4 h-4 text-[#2563EB] shrink-0" />
        <div className="flex flex-col min-w-0">
          <span
            className="text-xs font-bold text-[#0F172A] truncate max-w-[130px] sm:max-w-[180px] cursor-pointer hover:text-[#2563EB] transition-colors"
            title={file.fileName}
            onClick={handlePreview}
          >
            {file.fileName}
          </span>
          {file.sizeLabel && (
            <span className="text-[10px] text-[#64748B]">{file.sizeLabel}</span>
          )}
        </div>

        {/* Action Buttons: Preview, Download, Delete */}
        <div className="flex items-center gap-1 shrink-0 ml-1">
          {/* Preview Button */}
          <button
            type="button"
            onClick={handlePreview}
            disabled={previewing}
            className="p-1 text-[#2563EB] hover:text-[#1D4ED8] hover:bg-blue-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Preview document"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>

          {/* Download Button */}
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            title="Download document"
          >
            <Download className="w-3.5 h-3.5" />
          </button>

          {/* Delete Button (Only if canDelete and not readOnly) */}
          {canDelete && !readOnly && onDelete && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={deleting}
              className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              title="Delete document"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      <Modal
        open={modalOpen}
        onCancel={handleCloseModal}
        footer={[
          <button
            key="download"
            type="button"
            onClick={handleDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors cursor-pointer mr-2"
          >
            <Download className="w-3.5 h-3.5" />
            Download
          </button>,
          <button
            key="close"
            type="button"
            onClick={handleCloseModal}
            className="px-3 py-1.5 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>,
        ]}
        title={
          <div className="flex items-center gap-2 pr-6">
            <FileText className="w-4 h-4 text-[#2563EB]" />
            <span className="text-sm font-bold text-gray-900 truncate" title={file.fileName}>
              {file.fileName}
            </span>
          </div>
        }
        width={750}
        destroyOnClose
        centered
      >
        <div className="py-2 flex flex-col items-center justify-center min-h-[300px]">
          {previewUrl ? (
            isImage(previewType, file.fileName) ? (
              <img
                src={previewUrl}
                alt={file.fileName}
                className="max-h-[65vh] max-w-full object-contain rounded-lg shadow-sm border border-gray-100"
              />
            ) : isPdf(previewType, file.fileName) ? (
              <iframe
                src={previewUrl}
                title={file.fileName}
                className="w-full h-[65vh] rounded-lg border border-gray-200"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <FileText className="w-8 h-8" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-sm font-bold text-gray-800">{file.fileName}</h4>
                  <p className="text-xs text-gray-500">
                    Browser preview is not available for this file type ({previewType || "binary"}).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download File
                </button>
              </div>
            )
          ) : (
            <Spin size="large" />
          )}
        </div>
      </Modal>
    </>
  );
};

export default AttachmentItem;
