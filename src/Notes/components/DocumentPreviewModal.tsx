import React from "react";
import { Modal } from "antd";

interface DocumentPreviewModalProps {
  open: boolean;
  url: string;
  title: string;
  onClose: () => void;
}

export const DocumentPreviewModal: React.FC<DocumentPreviewModalProps> = ({
  open,
  url,
  title,
  onClose,
}) => {
  const titleLower = (title || "").toLowerCase();
  const isPdf = titleLower.endsWith(".pdf") || url.includes("pdf");
  const isImage =
    /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(titleLower) ||
    /\.(png|jpe?g|webp|gif|svg)/i.test(url);
  const isWord = /\.(docx?|rtf|odt)$/i.test(titleLower);
  const isExcel = /\.(xlsx?|csv)$/i.test(titleLower);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      title={
        <div className="flex items-center justify-between pr-8">
          <span className="font-semibold text-sm text-slate-800 truncate max-w-sm sm:max-w-md">
            {title}
          </span>
          {url && (
            <a
              href={url}
              download={title || "document"}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#EEF2FF] hover:bg-[#E0E7FF] text-[#4318FF] text-xs font-semibold rounded-lg border border-[#C7D2FE] transition-all shadow-sm active:scale-95 ml-4 shrink-0"
              title="Download document"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" x2="12" y1="15" y2="3" />
              </svg>
              <span>Download</span>
            </a>
          )}
        </div>
      }
      width={920}
      centered
      styles={{ body: { padding: 0 } }}
    >
      <div className="w-full flex items-center justify-center p-2 bg-slate-50/60 rounded-b-xl min-h-[350px]">
        {url &&
          (isPdf ? (
            <iframe
              src={url}
              title={title}
              className="w-full h-[76vh] rounded-lg border border-slate-200 bg-white"
            />
          ) : isImage ? (
            <img
              src={url}
              alt={title || "Preview"}
              className="max-h-[76vh] max-w-full object-contain rounded-lg shadow-2xs"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-8 text-center bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md w-full my-10">
              <div
                className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${
                  isWord
                    ? "bg-blue-50 border border-blue-100"
                    : isExcel
                      ? "bg-emerald-50 border border-emerald-100"
                      : "bg-purple-50 border border-purple-100"
                }`}
              >
                {isWord ? (
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="M10 9H8" />
                    <path d="M16 13H8" />
                    <path d="M16 17H8" />
                  </svg>
                ) : isExcel ? (
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                    <path d="M8 13h8" />
                    <path d="M8 17h8" />
                    <path d="M12 9v12" />
                  </svg>
                ) : (
                  <svg
                    width="34"
                    height="34"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#64748b"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
                    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
                  </svg>
                )}
              </div>
              <h3 className="font-bold text-slate-800 text-base mb-1 truncate max-w-xs">
                {title}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {isWord
                  ? "Word Document"
                  : isExcel
                    ? "Spreadsheet Document"
                    : "Attachment File"}
              </p>
              <a
                href={url}
                download={title || "document"}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-[#4318FF] hover:bg-[#320fe0] text-white text-sm font-semibold rounded-xl shadow-md shadow-[#4318FF]/20 hover:shadow-lg transition-all active:scale-95"
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" x2="12" y1="15" y2="3" />
                </svg>
                <span>Download Document</span>
              </a>
            </div>
          ))}
      </div>
    </Modal>
  );
};
export default DocumentPreviewModal;
