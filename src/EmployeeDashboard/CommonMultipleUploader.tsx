import React, { useCallback, useState, useEffect, useRef, useImperativeHandle, forwardRef } from "react";
import { Button, message, UploadFile, Modal, Spin } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  UploadOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileTextOutlined,
  FileUnknownOutlined,
  CloseOutlined,
  PaperClipOutlined,
  PictureOutlined,
} from "@ant-design/icons";
import styled, { createGlobalStyle } from "styled-components";
import { useDispatch } from "react-redux";

const StyledWrapper = styled.div`
  width: 100%;
`;

const FileNameWithExtension: React.FC<{
  name: string;
  style?: React.CSSProperties;
}> = ({ name, style }) => {
  if (!name) return null;
  const lastDotIndex = name.lastIndexOf(".");
  if (lastDotIndex > 0 && name.length - lastDotIndex <= 8) {
    const baseName = name.substring(0, lastDotIndex);
    const extension = name.substring(lastDotIndex);
    return (
      <div
        style={{
          display: "inline-flex",
          maxWidth: "100%",
          alignItems: "center",
          overflow: "hidden",
          ...style,
        }}
        title={name}
      ><span
        style={{
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          minWidth: 0,
          flex: "0 1 auto",
        }}
      >{baseName}</span><span style={{ flexShrink: 0, whiteSpace: "nowrap" }}>{extension}</span></div>
    );
  }
  return (
    <div
      style={{
        overflow: "hidden",
        textOverflow: "ellipsis",
        whiteSpace: "nowrap",
        width: "100%",
        ...style,
      }}
      title={name}
    >
      {name}
    </div>
  );
};

const StyledUploadButton = styled(Button)`
  width: 100%;
  height: 48px;
  margin-bottom: 20px;
  font-size: 16px;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
`;

const StyledGalleryContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 8px;
  // margin-top: 4px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(3, 1fr);
    gap: 6px;
  }
`;

const StyledChipContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
`;

const StyledFileChip = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  padding: 5px 10px 5px 8px;
  font-size: 12px;
  font-weight: 500;
  color: #334155;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;

  &:hover {
    border-color: #cbd5e1;
    background: #f8fafc;
  }
`;

const StyledAddFileChipButton = styled(Button)`
  display: inline-flex !important;
  align-items: center !important;
  justify-content: center !important;
  gap: 6px !important;
  background: #ffffff !important;
  border: 1.5px solid #2563eb !important;
  color: #2563eb !important;
  border-radius: 12px !important;
  padding: 0 14px !important;
  height: 44px !important;
  font-size: 12px !important;
  font-weight: 600 !important;
  box-shadow: none !important;
  flex-shrink: 0 !important;
  white-space: nowrap !important;

  @media (max-width: 767px) {
    width: 100% !important;
  }

  &:hover:not(:disabled) {
    background: #eff6ff !important;
    color: #1d4ed8 !important;
    border-color: #1d4ed8 !important;
  }

  &:disabled,
  &[disabled] {
    background: #f8fafc !important;
    border-color: #e2e8f0 !important;
    color: #94a3b8 !important;
    cursor: not-allowed !important;
    opacity: 0.7 !important;
  }
`;

/* Horizontal row for desktop/tablet/ipad (>= 768px), and stacked one-by-one on mobile (< 768px) */
const StyledFileRow = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: center;
  gap: 8px;
  width: 100%;
  overflow-x: auto;
  padding-bottom: 2px;
  box-sizing: border-box;
  /* Hide scrollbar but allow smooth scrolling */
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar {
    display: none;
  }

  @media (max-width: 767px) {
    flex-direction: column;
    align-items: stretch;
    flex-wrap: nowrap;
    overflow-x: visible;
    gap: 8px;
  }
`;

const StyledFileCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 5px 12px;
  /* Fixed width in one line on desktop and tab/ipad */
  flex: 0 0 250px;
  width: 250px;
  min-width: 250px;
  max-width: 250px;
  gap: 6px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
  height: 44px;
  box-sizing: border-box;
  overflow: hidden;
  flex-shrink: 0;

  @media (max-width: 767px) {
    flex: 1 1 auto;
    width: 100%;
    min-width: 0;
    max-width: 100%;
  }

  &:hover {
    border-color: #cbd5e1;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  }
`;

const StyledFileCardLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const StyledIconBox = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: #f1f5f9;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const StyledFileCardText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
  overflow: hidden;
`;

const StyledFileCardTitle = styled.div`
  font-size: 12px;
  font-weight: 700;
  color: #0f172a;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledFileCardSubtitle = styled.div`
  font-size: 10px;
  font-weight: 400;
  color: #64748b;
  margin-top: 1px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const StyledFileCardActions = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
  margin-left: auto;

  .ant-btn {
    padding: 0 !important;
    width: 28px;
    height: 28px;
    min-width: 28px;
    display: flex !important;
    align-items: center;
    justify-content: center;
    border-radius: 50% !important;
    border: none !important;
    background: transparent !important;
    transition: all 0.2s ease;

    &:hover {
      background: #f1f5f9 !important;
    }
  }
`;

export const StyledImageWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-repeat: no-repeat;
  background-position: center;
  background-size: cover;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  img {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: cover;
    display: block;
    border-radius: inherit;
    font-size: 0;
    line-height: 0;
  }
`;

export const StyledOverlay = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  background: rgba(0, 0, 0, 0.45);
  backdrop-filter: blur(2px);
  padding: 6px;
  opacity: 0;
  visibility: hidden;
  transition: opacity 0.25s ease, visibility 0.25s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  pointer-events: none;
  z-index: 10;
`;

export const StyledActionButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  background: #ffffff;
  border-radius: 24px;
  padding: 4px 8px;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.18);
  border: 1px solid #e2e8f0;

  .ant-btn {
    background: transparent !important;
    border: none !important;
    width: 30px;
    height: 30px;
    min-width: 30px;
    padding: 0 !important;
    display: flex !important;
    align-items: center;
    justify-content: center;
    border-radius: 50% !important;
    transition: all 0.2s ease;

    &:hover {
      background: #f1f5f9 !important;
      transform: scale(1.15);
    }

    .anticon {
      font-size: 16px;
    }

    &.action-btn-view .anticon,
    &.action-btn-download .anticon {
      color: #2563eb !important;
    }

    &.action-btn-delete .anticon {
      color: #ef4444 !important;
    }
  }
`;

const StyledFileName = styled.div`
  position: absolute;
  bottom: 6px;
  left: 6px;
  right: 6px;
  color: white;
  font-size: 9px;
  font-weight: 500;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);
  background: rgba(0, 0, 0, 0.65);
  padding: 3px 5px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
  z-index: 5;
  transition: opacity 0.2s ease, visibility 0.2s ease;
`;

/* StyledImageCard and StyledNonImageCard with hover hide rules */
const StyledImageCard = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background-color: #f5f5f5;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  &:hover ${StyledOverlay} {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  &:hover ${StyledFileName} {
    opacity: 0;
    visibility: hidden;
  }
`;

const StyledNonImageCard = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.10);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  border: 1px solid #e8ecf0;
  cursor: pointer;

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }

  &:hover ${StyledOverlay} {
    opacity: 1;
    visibility: visible;
    pointer-events: auto;
  }

  &:hover ${StyledFileName} {
    opacity: 0;
    visibility: hidden;
  }
`;

const StyledEmptyState = styled.div`
  text-align: center;
  padding: 16px 20px;
  color: #999;
  font-size: 14px;
  background: #fafafa;
  border-radius: 12px;
  border: 2px dashed #d9d9d9;
`;

// Global keyframe for the PDF thumbnail loading spinner
const UploaderGlobalStyles = createGlobalStyle`
  @keyframes uploaderSpin {
    to { transform: rotate(360deg); }
  }
`;

// ─── Standalone helpers (used by thumbnail sub-components) ──────────────────

const _isPdfFile = (fileName: string) => {
  const name = (fileName || "").toLowerCase();
  return name.endsWith(".pdf") || name.includes(".pdf");
};

const _getFileExt = (fileName: string): string => {
  if (_isPdfFile(fileName)) return "PDF";
  const parts = (fileName || "").split(".");
  if (parts.length > 1) {
    const ext = parts.pop()?.toUpperCase();
    if (ext && ext.length <= 5) return ext;
  }
  return "FILE";
};

const _getDocColors = (ext: string) => {
  if (ext === "PDF") return { header: "#e53e3e", light: "#fff8f8" };
  if (ext === "DOCX" || ext === "DOC") return { header: "#2b579a", light: "#f0f4fa" };
  if (ext === "XLSX" || ext === "XLS") return { header: "#217346", light: "#f0faf4" };
  if (ext === "TXT") return { header: "#718096", light: "#f7fafc" };
  if (ext === "CSV") return { header: "#d69e2e", light: "#fffdf0" };
  return { header: "#667eea", light: "#f0f4ff" };
};

const getFileCardIcon = (fileName: string) => {
  const name = (fileName || "").toLowerCase();

  if (
    [".png", ".jpg", ".jpeg", ".webp", ".gif"].some(
      (ext) => name.endsWith(ext) || name.includes(ext)
    )
  ) {
    return (
      <PictureOutlined
        style={{ color: "#2563eb", fontSize: 16 }}
      />
    );
  }

  if (name.endsWith(".pdf") || name.includes(".pdf")) {
    return (
      <FilePdfOutlined
        style={{ color: "#dc2626", fontSize: 16 }}
      />
    );
  }

  if (name.endsWith(".doc") || name.endsWith(".docx")) {
    return (
      <FileWordOutlined
        style={{ color: "#2563eb", fontSize: 16 }}
      />
    );
  }

  if (name.endsWith(".xls") || name.endsWith(".xlsx")) {
    return (
      <FileExcelOutlined
        style={{ color: "#16a34a", fontSize: 16 }}
      />
    );
  }

  return (
    <FileTextOutlined
      style={{ color: "#050796", fontSize: 16 }}
    />
  );
};

const renderFileChipIcon = (fileName: string) => {
  const name = (fileName || "").toLowerCase();
  if (name.endsWith(".pdf") || name.includes(".pdf")) {
    return <FilePdfOutlined style={{ color: "#dc2626", fontSize: "15px" }} />;
  }
  const isImage = [".png", ".jpg", ".jpeg", ".webp", ".gif"].some((ext) => name.endsWith(ext) || name.includes(ext));
  if (isImage) {
    return (
      <span
        style={{
          width: 12,
          height: 12,
          backgroundColor: "#2563eb",
          borderRadius: 2,
          display: "inline-block",
          flexShrink: 0,
        }}
      />
    );
  }
  return <FileTextOutlined style={{ color: "#2563eb", fontSize: "15px" }} />;
};

const truncateFileName = (name: string, maxLen: number = 18) => {
  if (!name) return "";
  if (name.length <= maxLen) return name;
  const extIdx = name.lastIndexOf(".");
  if (extIdx !== -1 && name.length - extIdx <= 6) {
    const ext = name.substring(extIdx);
    const base = name.substring(0, maxLen - ext.length - 3);
    return `${base}...${ext}`;
  }
  return `${name.substring(0, maxLen - 3)}...`;
};

// ─── Google Drive-style document mockup ─────────────────────────────────────
/** Renders a styled paper card (coloured header + simulated text lines). */
const DocFileMockup: React.FC<{ fileName: string; isUploading?: boolean }> = ({
  fileName,
  isUploading = false,
}) => {
  const ext = _getFileExt(fileName);
  const { header, light } = _getDocColors(ext);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        background: light,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: "inherit",
      }}
    >
      {/* Coloured type-badge header */}
      <div
        style={{
          background: header,
          height: "32%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          position: "relative",
        }}
      >
        <span
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: "13px",
            letterSpacing: "1.5px",
            // fontFamily: "system-ui, -apple-system, sans-serif",
            textShadow: "0 1px 3px rgba(0,0,0,0.25)",
          }}
        >
          {ext}
        </span>
        {isUploading && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(0,0,0,0.35)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "#fff", fontSize: "10px", fontWeight: 600 }}>Uploading…</span>
          </div>
        )}
      </div>
      {/* Simulated document body lines */}
      <div
        style={{
          padding: "6px 8px 4px",
          flex: 1,
          display: "flex",
          flexDirection: "column",
          gap: "4px",
          overflow: "hidden",
        }}
      >
        <div style={{ height: "7px", width: "75%", background: "#4a5568", borderRadius: "3px", opacity: 0.65 }} />
        {[100, 92, 85, 97, 78, 88, 72, 95].map((w, i) => (
          <div
            key={i}
            style={{ height: "5px", width: `${w}%`, background: "#c8d0da", borderRadius: "2px", opacity: 0.85 }}
          />
        ))}
      </div>
    </div>
  );
};

// ─── Lazy image thumbnail ────────────────────────────────────────────────────

// ─── Lazy image thumbnail ────────────────────────────────────────────────────
/** Fetches and displays the actual image bytes as a thumbnail. */
const ImageThumbnailCard: React.FC<{
  getUrl: () => Promise<string>;
  fileName: string;
}> = ({ getUrl, fileName }) => {
  const [src, setSrc] = useState<string | null>(null);
  const didFetch = useRef(false);

  useEffect(() => {
    if (didFetch.current) return;
    didFetch.current = true;
    let cancelled = false;
    getUrl()
      .then((url) => { if (!cancelled && url) setSrc(url); })
      .catch(() => { });
    return () => { cancelled = true; };
  }, []);

  if (!src) {
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f0f2f5",
        }}
      >
        <EyeOutlined style={{ fontSize: 28, color: "#bbb" }} />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={fileName}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        display: "block",
      }}
      onError={(e) => { e.currentTarget.style.display = "none"; }}
    />
  );
};

interface FileListResponse {
  key: string;
  name: string;
  url: string;
  refId: number;
  refType: string;
  entityType: string;
  entityId: number;
}

export interface CommonMultipleUploaderRef {
  openFileDialog: () => void;
  getFilesCount: () => number;
}

interface CommonMultipleUploaderProps {
  entityType: string;
  entityId: number;
  refId: number;
  refType: string;
  uploadFile?: any;
  downloadFile?: any;
  previewFile?: any;
  deleteFile?: any;
  getFiles?: any;
  disabled?: boolean;
  maxFileSize?: number;
  maxFiles?: number;
  showDelete?: boolean;
  showPreview?: boolean;
  fetchOnMount?: boolean;
  showDownload?: boolean;
  allowedTypes?: ("images" | "pdf" | "docs")[];
  onFileUpload?: (file: FileListResponse) => void;
  onFileDelete?: (fileKey: string) => void;
  onFilesChange?: (files: FileListResponse[]) => void;
  hideUploadButton?: boolean;
  hideEmptyState?: boolean;
  successMessage?: string;
  deleteMessage?: string;
  multiple?: boolean;
  variant?: "grid" | "chip";
}

const CommonMultipleUploader = forwardRef<CommonMultipleUploaderRef, CommonMultipleUploaderProps>(({
  uploadFile,
  downloadFile,
  previewFile,
  deleteFile,
  getFiles,
  entityType,
  entityId,
  refId,
  refType,
  showDelete,
  showPreview = true,
  fetchOnMount = true,
  showDownload = true,
  disabled = false,
  maxFiles = 10,
  allowedTypes = ["images", "pdf", "docs"],
  onFileUpload = () => { },
  onFileDelete = () => { },
  onFilesChange,
  hideUploadButton = false,
  hideEmptyState = false,
  successMessage = "Your file has been uploaded successfully and is now available for use",
  deleteMessage = "The file has been deleted successfully and is no longer available",
  multiple = true,
  variant = "grid",
}, ref) => {
  const finalShowDelete = showDelete !== undefined ? showDelete : !disabled;
  const dispatch = useDispatch();
  const [fileList, setFileList] = useState<FileListResponse[]>([]);
  const [existingFiles, setExistingFiles] = useState<UploadFile[]>([]);
  const lastFetchedIdRef = useRef<any>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<
    Array<{ uid: string; name: string; preview: string }>
  >([]);
  const [blobUrls, setBlobUrls] = useState<Map<string, string>>(new Map());
  const fileListRef = useRef<FileListResponse[]>([]);
  const blobUrlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    fileListRef.current = fileList;
    if (onFilesChange) {
      onFilesChange(fileList);
    }
  }, [fileList, onFilesChange]);

  useEffect(() => {
    blobUrlsRef.current = blobUrls;
  }, [blobUrls]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  useImperativeHandle(ref, () => ({
    openFileDialog: () => {
      handleUploadButtonClick();
    },
    getFilesCount: () => existingFiles.length,
  }));

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewType, setPreviewType] = useState<"image" | "pdf" | "doc">("image");
  const [previewDocUrl, setPreviewDocUrl] = useState("");
  const [previewDocFileName, setPreviewDocFileName] = useState("");
  const [previewTextContent, setPreviewTextContent] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const showSuccessMessage = (msg: string) => {
    messageApi.success(msg, 4);
  };
  const showErrorMessage = (msg: string) => {
    messageApi.error(msg, 4);
  };

  const loadingPreviewKeyRef = useRef<string | null>(null);

  const fetchFilesIfNeeded = useCallback(async () => {
    if (!getFiles || entityId === undefined || entityId === null || entityId === 0) {
      return;
    }

    const cacheKey = `${entityId}_${refId}`;
    if (lastFetchedIdRef.current === cacheKey) {
      return;
    }

    try {
      const response = await dispatch(
        getFiles({
          entityId: entityId,
          refId: refId,
          refType: refType,
          entityType: entityType,
        }),
      ).unwrap();

      const data = Array.isArray(response) ? response : response?.data || [];
      const relevantFiles = data.filter(
        (file: FileListResponse) => file.refType === refType,
      );

      if (relevantFiles && relevantFiles.length > 0) {
        const uniqueMap = new Map();
        relevantFiles.forEach((f: FileListResponse) => {
          if (!uniqueMap.has(f.key)) {
            uniqueMap.set(f.key, f);
          }
        });
        const deduplicatedFiles: FileListResponse[] = Array.from(uniqueMap.values());

        const formattedFiles: UploadFile[] = deduplicatedFiles.map(
          (file: FileListResponse) => ({
            uid: file.key,
            name: file.name,
            status: "done" as const,
            url: (file as any).url || (file as any).image_url || "",
          }),
        );
        setExistingFiles(formattedFiles);
        setFileList(deduplicatedFiles);
      } else {
        setExistingFiles([]);
        setFileList([]);
      }
      lastFetchedIdRef.current = cacheKey;
    } catch (error) {
      console.error("Error fetching files:", error);
    }
  }, [entityId, refId, refType, entityType, dispatch, getFiles]);

  useEffect(() => {
    if (fetchOnMount) {
      fetchFilesIfNeeded();
    }
  }, [fetchOnMount, fetchFilesIfNeeded]);

  const processFiles = async (acceptedFiles: File[]) => {
    if (existingFiles.length >= maxFiles) {
      showErrorMessage(`You cannot upload more than ${maxFiles} files`);
      return;
    }

    const remainingSlots = maxFiles - existingFiles.length;
    const filesToUpload = acceptedFiles.slice(0, remainingSlots);

    if (acceptedFiles.length > remainingSlots) {
      showErrorMessage(
        `Only ${remainingSlots} file(s) can be uploaded. Maximum limit is ${maxFiles} files.`,
      );
    }

    const validFiles = filesToUpload.filter((file) => {
      const isValidSize = file.size <= 5 * 1024 * 1024;
      if (!isValidSize) {
        showErrorMessage(`File ${file.name} is larger than 5MB`);
      }
      return isValidSize;
    });

    if (validFiles.length === 0) return;

    setUploading(true);

    const previews = validFiles.map((file) => ({
      uid: `temp-${Date.now()}-${Math.random()}`,
      name: file.name,
      preview: URL.createObjectURL(file),
    }));

    setUploadingFiles(previews);

    for (const file of validFiles) {
      const formData = new FormData();
      formData.append("file", file);

      try {
        if (!uploadFile) {
          showErrorMessage("Upload action not configured");
          return;
        }

        const response = await dispatch(
          uploadFile({
            entityType,
            entityId,
            refId,
            refType,
            formData,
          }),
        ).unwrap();

        if (response.success) {
          showSuccessMessage(successMessage);

          const uploadedFiles = Array.isArray(response.data)
            ? response.data
            : [response.data];
          const uploadedData = uploadedFiles[0];
          const newFileResponse = {
            key: uploadedData.key,
            name: uploadedData.name || uploadedData.fileName || file.name,
            url: uploadedData.url || uploadedData.image_url,
            refId:
              uploadedData.refId !== undefined ? uploadedData.refId : refId,
            refType: uploadedData.refType || refType,
            entityType: uploadedData.entityType || entityType,
            entityId:
              uploadedData.entityId !== undefined
                ? uploadedData.entityId
                : entityId,
          };

          const localUrl = URL.createObjectURL(file);
          const backendUrl = uploadedData.url || uploadedData.image_url;
          // At creation time (refId is 0 or invalid), we must use the local blob URL (localUrl)
          // as the backend URL will return 404 until the request is saved to the database.
          const isRefIdValid = refId && Number(refId) !== 0 && !isNaN(Number(refId));
          const finalUrl = (isValidUrl(backendUrl) && isRefIdValid) ? backendUrl : localUrl;

          // Track localUrl in blobUrls so it gets cleaned up/revoked when component unmounts
          if (finalUrl === localUrl) {
            setBlobUrls((prev) => {
              const newMap = new Map(prev);
              newMap.set(uploadedData.key, localUrl);
              return newMap;
            });
          }

          const newUploadFile: UploadFile = {
            uid: uploadedData.key,
            name: uploadedData.name || uploadedData.fileName || file.name,
            status: "done" as const,
            url: finalUrl,
          };

          setExistingFiles((prev) => {
            // Deduplicate: replace if key already exists, otherwise append
            const exists = prev.some((f) => f.uid === newUploadFile.uid);
            if (exists) return prev.map((f) => f.uid === newUploadFile.uid ? newUploadFile : f);
            return [...prev, newUploadFile];
          });
          setFileList((prev) => {
            // Deduplicate: replace if key already exists, otherwise append
            const exists = prev.some((f) => f.key === newFileResponse.key);
            if (exists) return prev.map((f) => f.key === newFileResponse.key ? newFileResponse : f);
            return [...prev, newFileResponse];
          });
          // NOTE: Do NOT reset lastFetchedIdRef here.
          // Resetting it triggers a re-fetch between sequential file uploads in the
          // for-loop, which causes the backend to receive conflicting state and throw
          // errors on the 4th+ upload. The cache is already invalidated implicitly
          // because the new file is added to local state directly.
          onFileUpload(newFileResponse);
        } else {
          showErrorMessage(`Failed to upload file: ${file.name}`);
        }
      } catch (error) {
        showErrorMessage(`Error uploading file: ${file.name}`);
        console.error(error);
      }
    }

    previews.forEach((preview) => URL.revokeObjectURL(preview.preview));
    setUploadingFiles([]);
    setUploading(false);
  };

  const getAcceptedFileTypes = () => {
    const acceptedTypes: { [key: string]: string[] } = {};

    if (allowedTypes.includes("images")) {
      acceptedTypes["image/*"] = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    }

    if (allowedTypes.includes("pdf")) {
      acceptedTypes["application/pdf"] = [".pdf"];
    }

    if (allowedTypes.includes("docs")) {
      acceptedTypes["application/msword"] = [".doc"];
      acceptedTypes[
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ] = [".docx"];
      acceptedTypes["application/vnd.ms-excel"] = [".xls"];
      acceptedTypes[
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
      ] = [".xlsx"];
      acceptedTypes["text/plain"] = [".txt"];
    }

    return acceptedTypes;
  };

  const handleUploadButtonClick = async () => {
    await fetchFilesIfNeeded();
    if (!disabled && existingFiles.length < maxFiles && !uploading) {
      fileInputRef.current?.click();
    }
  };

  const handleFileInputChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const files = event.target.files;
    if (files) {
      await processFiles(Array.from(files));
    }
    event.target.value = "";
  };

  const getMimeTypeByFileName = (fileName: string, fallback?: string): string => {
    const name = (fileName || "").toLowerCase();
    if (name.endsWith(".pdf")) return "application/pdf";
    if (name.endsWith(".png")) return "image/png";
    if (name.endsWith(".jpg") || name.endsWith(".jpeg")) return "image/jpeg";
    if (name.endsWith(".webp")) return "image/webp";
    if (name.endsWith(".gif")) return "image/gif";
    if (name.endsWith(".xlsx")) return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
    if (name.endsWith(".xls")) return "application/vnd.ms-excel";
    if (name.endsWith(".docx")) return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    if (name.endsWith(".doc")) return "application/msword";
    if (name.endsWith(".txt")) return "text/plain";
    if (name.endsWith(".csv")) return "text/csv";
    return fallback && fallback !== "application/octet-stream" ? fallback : "application/octet-stream";
  };

  const handleDownload = async (file: UploadFile, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (entityId === undefined || entityId === null) return;
    const selectedFile = fileList.find((f) => f.key === file.uid);
    if (!selectedFile) {
      showErrorMessage("File not found");
      return;
    }

    const fileName = file.name || selectedFile.name || "download";

    // 1. If stored on backend (valid entityId/key), dispatch downloadFile API
    const isServerFile = Boolean(
      selectedFile.entityId &&
      Number(selectedFile.entityId) > 0 &&
      selectedFile.key &&
      downloadFile
    );

    if (isServerFile) {
      try {
        const response = await dispatch(
          downloadFile({
            entityId: selectedFile.entityId,
            refId: selectedFile.refId,
            refType: selectedFile.refType,
            entityType: selectedFile.entityType,
            key: file.uid,
          }),
        ).unwrap();

        const contentType = getMimeTypeByFileName(
          fileName,
          response.headers?.["content-type"]
        );
        const blob = new Blob([response.data], { type: contentType });
        const url = window.URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", fileName);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
        return;
      } catch (error) {
        console.error("Download API error, attempting local fallback:", error);
      }
    }

    // 2. Fallback for unsaved local blob files (prior to form submission)
    if (isValidUrl(file.url) && file.url?.startsWith("blob:")) {
      const link = document.createElement("a");
      link.href = file.url;
      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    showErrorMessage("Failed to download file");
  };

  const cachedFileTypeRef = useRef<Map<string, "pdf" | "image" | "doc">>(new Map());

  const detectFileTypeFromBlob = async (blob: Blob, fileName: string): Promise<"pdf" | "image" | "doc"> => {
    const lowerName = (fileName || "").toLowerCase();
    if (lowerName.endsWith(".pdf") || lowerName.includes(".pdf")) {
      return "pdf";
    }
    const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    if (imageExtensions.some((ext) => lowerName.endsWith(ext) || lowerName.includes(ext))) {
      return "image";
    }
    if (
      lowerName.endsWith(".docx") ||
      lowerName.endsWith(".doc") ||
      lowerName.endsWith(".xlsx") ||
      lowerName.endsWith(".xls") ||
      lowerName.endsWith(".txt") ||
      lowerName.endsWith(".csv")
    ) {
      return "doc";
    }

    try {
      const slice = blob.slice(0, 12);
      const buffer = await slice.arrayBuffer();
      const arr = new Uint8Array(buffer);

      // %PDF magic bytes: 0x25 0x50 0x44 0x46
      if (arr[0] === 0x25 && arr[1] === 0x50 && arr[2] === 0x44 && arr[3] === 0x46) {
        return "pdf";
      }
      // PNG: 0x89 0x50 0x4E 0x47
      if (arr[0] === 0x89 && arr[1] === 0x50 && arr[2] === 0x4E && arr[3] === 0x47) {
        return "image";
      }
      // JPEG: 0xFF 0xD8 0xFF
      if (arr[0] === 0xFF && arr[1] === 0xD8 && arr[2] === 0xFF) {
        return "image";
      }
      // GIF: "GIF8"
      if (arr[0] === 0x47 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x38) {
        return "image";
      }
      // WEBP: "RIFF" .... "WEBP"
      if (arr[0] === 0x52 && arr[1] === 0x49 && arr[2] === 0x46 && arr[3] === 0x46) {
        return "image";
      }
    } catch (e) {
      console.error("Magic bytes detection error:", e);
    }

    return "doc";
  };

  const handlePreview = async (file: UploadFile, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    if (entityId === undefined || entityId === null) return;
    const selectedFile = fileList.find((f) => f.key === file.uid);
    if (!selectedFile) {
      showErrorMessage("File not found");
      return;
    }

    const fileName = file.name || selectedFile.name || "document";

    const openDocPreviewModal = async (url: string) => {
      setPreviewDocUrl(url);
      setPreviewDocFileName(fileName);
      setPreviewTextContent(null);
      // For txt files, read and show the text content inline
      const lowerName = fileName.toLowerCase();
      if (lowerName.endsWith(".txt")) {
        try {
          setPreviewLoading(true);
          const response = await fetch(url);
          const text = await response.text();
          setPreviewTextContent(text);
        } catch {
          setPreviewTextContent(null);
        } finally {
          setPreviewLoading(false);
        }
      }
      setPreviewTitle(fileName);
      setPreviewType("doc");
      setPreviewOpen(true);
    };

    // 1. If stored on server (valid entityId & key), dispatch previewFile API
    const isServerFile = Boolean(
      selectedFile.entityId &&
      Number(selectedFile.entityId) > 0 &&
      selectedFile.key &&
      previewFile
    );

    if (isServerFile) {
      if (loadingPreviewKeyRef.current === file.uid) return;
      loadingPreviewKeyRef.current = file.uid;

      try {
        const response = await dispatch(
          previewFile({
            entityId: selectedFile.entityId,
            refId: selectedFile.refId,
            refType: selectedFile.refType,
            entityType: selectedFile.entityType,
            key: file.uid,
          }),
        ).unwrap();

        const rawBlob = new Blob([response.data]);
        const detectedType = await detectFileTypeFromBlob(rawBlob, fileName);
        cachedFileTypeRef.current.set(file.uid, detectedType);

        const mimeType = getMimeTypeByFileName(
          fileName,
          detectedType === "pdf"
            ? "application/pdf"
            : response.headers?.["content-type"]
        );
        const blob = new Blob([response.data], { type: mimeType });
        const url = window.URL.createObjectURL(blob);

        setBlobUrls((prev) => {
          const newMap = new Map(prev);
          newMap.set(file.uid, url);
          return newMap;
        });

        if (detectedType === "pdf" || isPdfFile(fileName)) {
          window.open(url, "_blank");
          return;
        }

        if (detectedType === "image" || isImageFile(fileName)) {
          setPreviewImage(url);
          setPreviewTitle(fileName);
          setPreviewType("image");
          setPreviewOpen(true);
          return;
        }

        await openDocPreviewModal(url);
        return;
      } catch (error) {
        console.error("Preview API error, attempting local fallback:", error);
      } finally {
        loadingPreviewKeyRef.current = null;
      }
    }

    // 2. Fallback for cached or local blob URLs (unsaved drafts)
    if (blobUrls.has(file.uid)) {
      const cachedUrl = blobUrls.get(file.uid)!;
      const cachedType = cachedFileTypeRef.current.get(file.uid);
      const isPdf = cachedType === "pdf" || isPdfFile(fileName);
      const isImg = cachedType === "image" || isImageFile(fileName);

      if (isPdf) {
        window.open(cachedUrl, "_blank");
      } else if (isImg) {
        setPreviewImage(cachedUrl);
        setPreviewTitle(fileName);
        setPreviewType("image");
        setPreviewOpen(true);
      } else {
        await openDocPreviewModal(cachedUrl);
      }
      return;
    }

    if (isValidUrl(file.url) && file.url?.startsWith("blob:")) {
      if (isPdfFile(fileName)) {
        window.open(file.url, "_blank");
      } else if (isImageFile(fileName)) {
        setPreviewImage(file.url);
        setPreviewTitle(fileName);
        setPreviewType("image");
        setPreviewOpen(true);
      } else {
        await openDocPreviewModal(file.url);
      }
      return;
    }

    showErrorMessage("Failed to preview file");
  };

  const handleDelete = async (file: UploadFile, event?: React.MouseEvent) => {
    if (event) {
      event.stopPropagation();
    }

    const selectedFile = fileList.find((f) => f.key === file.uid);
    if (!selectedFile) {
      showErrorMessage("File not found");
      return;
    }
    // Optimistic UI update
    setExistingFiles((prev) => prev.filter((f) => f.uid !== file.uid));
    setFileList((prev) => prev.filter((f) => f.key !== file.uid));
    onFileDelete(file.uid);

    try {
      if (!deleteFile) {
        showErrorMessage("Delete action not configured");
        return;
      }
      await dispatch(
        deleteFile({
          entityId: selectedFile.entityId,
          refId: selectedFile.refId,
          refType: selectedFile.refType,
          entityType: selectedFile.entityType,
          key: file.uid,
        }),
      ).unwrap();

      showSuccessMessage(deleteMessage);
    } catch (error) {
      showErrorMessage("Failed to delete file");
    }
  };

  const isPdfFile = (fileName: string) => {
    const name = (fileName || "").toLowerCase();
    return name.endsWith(".pdf") || name.includes(".pdf");
  };

  const isImageFile = (fileName: string) => {
    if (isPdfFile(fileName)) return false;
    const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    const name = (fileName || "").toLowerCase();
    return imageExtensions.some((ext) => name.endsWith(ext) || name.includes(ext));
  };

  // getFileExtension is handled by _getFileExt helper

  const isValidUrl = (url?: string) => {
    if (!url) return false;
    return (
      url.startsWith("http") ||
      url.startsWith("/") ||
      url.startsWith("blob:") ||
      url.startsWith("data:")
    );
  };

  const loadImageAsBlob = useCallback(
    async (file: UploadFile): Promise<string> => {
      // Use ref to check for existing blob without adding to dependencies
      if (blobUrlsRef.current.has(file.uid)) {
        return blobUrlsRef.current.get(file.uid) || "";
      }

      const selectedFile = fileList.find((f) => f.key === file.uid);
      if (!selectedFile) return file.url || "";

      try {
        const response = await dispatch(
          previewFile({
            entityId: selectedFile.entityId,
            refId: selectedFile.refId,
            refType: selectedFile.refType,
            entityType: selectedFile.entityType,
            key: file.uid,
          }),
        ).unwrap();

        const blob = new Blob([response.data], {
          type: response.headers?.["content-type"] || "image/jpeg",
        });
        const blobUrl = window.URL.createObjectURL(blob);

        setBlobUrls((prev) => {
          const newMap = new Map(prev);
          newMap.set(file.uid, blobUrl);
          return newMap;
        });

        return blobUrl;
      } catch (error) {
        console.error("Failed to load image blob:", error);
        return file.url || "";
      }
    },
    [dispatch, previewFile, fileList],
  );

  const getImageUrl = useCallback(
    async (file: UploadFile): Promise<string> => {
      if (blobUrlsRef.current.has(file.uid)) {
        return blobUrlsRef.current.get(file.uid) || "";
      }
      if (file.url && !file.url.includes("/api/")) {
        return file.url;
      }
      // API-backed URLs need an authenticated fetch → blob conversion
      return loadImageAsBlob(file);
    },
    [loadImageAsBlob],
  );

  // Revoke all blob URLs only when the component fully unmounts.
  // Using the ref (not state) avoids re-running the cleanup on every
  // blobUrls state update, which previously revoked still-needed URLs
  // (e.g. revoking the PDF blob the moment an image blob was added).
  useEffect(() => {
    return () => {
      blobUrlsRef.current.forEach((url) => {
        if (url.startsWith("blob:")) {
          window.URL.revokeObjectURL(url);
        }
      });
    };
  }, []);

  const getAcceptString = () => {
    return Object.values(getAcceptedFileTypes()).flat().join(",");
  };

  return (
    <StyledWrapper>
      <UploaderGlobalStyles />
      {contextHolder}

      {variant !== "chip" && !disabled && !hideUploadButton && (
        <StyledUploadButton
          type="primary"
          icon={<UploadOutlined />}
          onClick={handleUploadButtonClick}
          disabled={existingFiles.length >= maxFiles || uploading}
          size="large"
          loading={uploading}
        >
          {uploading
            ? "Uploading..."
            : `Upload Documents (${existingFiles.length}/${maxFiles})`}
        </StyledUploadButton>
      )}

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={getAcceptString()}
        style={{ display: "none" }}
        onChange={handleFileInputChange}
      />

      {variant === "chip" ? (
        <StyledFileRow>
          {!hideUploadButton && (
            <StyledAddFileChipButton
              type="default"
              icon={<PaperClipOutlined style={{ fontSize: 14 }} />}
              onClick={handleUploadButtonClick}
              loading={uploading}
              disabled={disabled || existingFiles.length >= maxFiles || uploading}
            >
              Upload file
            </StyledAddFileChipButton>
          )}

          {uploadingFiles.map((file, index) => (
            <StyledFileCard key={`uploading-card-${file.uid}-${index}`}>
              <StyledFileCardLeft>
                <StyledIconBox>
                  <FileTextOutlined style={{ color: "#059669", fontSize: 16 }} />
                </StyledIconBox>
                <StyledFileCardText>
                  <FileNameWithExtension
                    name={file.name}
                    style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}
                  />
                  <StyledFileCardSubtitle style={{ color: "#94a3b8" }}>
                    Uploading...
                  </StyledFileCardSubtitle>
                </StyledFileCardText>
              </StyledFileCardLeft>
            </StyledFileCard>
          ))}

          {existingFiles.map((file, index) => (
            <StyledFileCard key={`existing-card-${file.uid}-${index}`}>
              <StyledFileCardLeft>
                <StyledIconBox>
                  {getFileCardIcon(file.name)}
                </StyledIconBox>

                <StyledFileCardText>
                  <FileNameWithExtension
                    name={file.name}
                    style={{ fontSize: 12, fontWeight: 700, color: "#0f172a" }}
                  />
                </StyledFileCardText>
              </StyledFileCardLeft>

              <StyledFileCardActions>
                {showPreview && (
                  <Button
                    type="text"
                    icon={
                      <EyeOutlined
                        style={{ color: "#2563eb", fontSize: 18 }}
                      />
                    }
                    onClick={(e) => handlePreview(file, e)}
                    title="View"
                  />
                )}

                {finalShowDelete && (
                  <Button
                    type="text"
                    icon={
                      <CloseOutlined
                        style={{ color: "#ef4444", fontSize: 16, fontWeight: 700 }}
                      />
                    }
                    onClick={(e) => handleDelete(file, e)}
                    title="Delete"
                  />
                )}
              </StyledFileCardActions>
            </StyledFileCard>
          ))}
        </StyledFileRow>
      ) : existingFiles.length > 0 || uploadingFiles.length > 0 ? (
        <StyledGalleryContainer>
          {uploadingFiles.map((file, index) =>
            isImageFile(file.name) ? (
              <StyledImageCard key={`uploading-${file.uid}-${index}`}>
                <StyledImageWrapper
                  style={{ backgroundImage: `url(${file.preview})` }}
                >
                  <img
                    src={file.preview}
                    alt={file.name}
                    style={{ opacity: 0.6 }}
                    onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                      e.currentTarget.style.display = "none";
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      background: "rgba(0,0,0,0.7)",
                      color: "white",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      fontSize: "12px",
                      fontWeight: 500,
                    }}
                  >
                    Uploading...
                  </div>
                </StyledImageWrapper>
              </StyledImageCard>
            ) : (
              <StyledNonImageCard key={`uploading-nonimg-${file.uid}-${index}`}>
                <DocFileMockup fileName={file.name} isUploading />
                <StyledFileName title={file.name}>
                  <FileNameWithExtension name={file.name} style={{ fontSize: 9, color: "white" }} />
                </StyledFileName>
              </StyledNonImageCard>
            )
          )}

          {existingFiles.map((file, index) =>
            isImageFile(file.name) ? (
              <StyledImageCard key={`existing-img-${file.uid}-${index}`}>
                <StyledImageWrapper>
                  <ImageThumbnailCard
                    getUrl={() => getImageUrl(file)}
                    fileName={file.name}
                  />
                </StyledImageWrapper>

                <StyledFileName title={file.name}>
                  <FileNameWithExtension name={file.name} style={{ fontSize: 9, color: "white" }} />
                </StyledFileName>

                <StyledOverlay>
                  <StyledActionButtons>
                    {showPreview && (
                      <Button
                        type="text"
                        className="action-btn-view"
                        icon={<EyeOutlined style={{ fontSize: 20 }} />}
                        onClick={(e) => handlePreview(file, e)}
                        title="View"
                      />
                    )}
                    {showDownload && (
                      <Button
                        type="text"
                        className="action-btn-download"
                        icon={<DownloadOutlined style={{ fontSize: 18 }} />}
                        onClick={(e) => handleDownload(file, e)}
                        title="Download"
                      />
                    )}
                    {finalShowDelete && (
                      <Button
                        type="text"
                        className="action-btn-delete"
                        icon={<CloseOutlined style={{ fontSize: 18, fontWeight: 700 }} />}
                        onClick={(e) => handleDelete(file, e)}
                        title="Delete"
                      />
                    )}
                  </StyledActionButtons>
                </StyledOverlay>
              </StyledImageCard>
            ) : (
              <StyledNonImageCard key={`existing-nonimg-${file.uid}-${index}`}>
                <DocFileMockup fileName={file.name} />

                <StyledFileName title={file.name}>
                  <FileNameWithExtension name={file.name} style={{ fontSize: 9, color: "white" }} />
                </StyledFileName>

                <StyledOverlay>
                  <StyledActionButtons>
                    {showPreview && (
                      <Button
                        type="text"
                        className="action-btn-view"
                        icon={<EyeOutlined style={{ fontSize: 20 }} />}
                        onClick={(e) => handlePreview(file, e)}
                        title="View"
                      />
                    )}
                    {showDownload && (
                      <Button
                        type="text"
                        className="action-btn-download"
                        icon={<DownloadOutlined style={{ fontSize: 18 }} />}
                        onClick={(e) => handleDownload(file, e)}
                        title="Download"
                      />
                    )}
                    {finalShowDelete && (
                      <Button
                        type="text"
                        className="action-btn-delete"
                        icon={<CloseOutlined style={{ fontSize: 18, fontWeight: 700 }} />}
                        onClick={(e) => handleDelete(file, e)}
                        title="Delete"
                      />
                    )}
                  </StyledActionButtons>
                </StyledOverlay>
              </StyledNonImageCard>
            ),
          )}
        </StyledGalleryContainer>
      ) : hideEmptyState ? null : (
        <StyledEmptyState>
          {disabled
            ? "📄 No documents attached."
            : '📄 No documents uploaded yet. Click "Upload Documents" button above to get started.'}
        </StyledEmptyState>
      )}
      <Modal
        open={previewOpen}
        title={
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {(() => {
              const n = (previewTitle || "").toLowerCase();
              if (n.endsWith(".pdf")) return <FilePdfOutlined style={{ color: "#e53e3e", fontSize: 18 }} />;
              if (n.endsWith(".docx") || n.endsWith(".doc")) return <FileWordOutlined style={{ color: "#2b579a", fontSize: 18 }} />;
              if (n.endsWith(".xlsx") || n.endsWith(".xls")) return <FileExcelOutlined style={{ color: "#217346", fontSize: 18 }} />;
              if (n.endsWith(".txt")) return <FileTextOutlined style={{ color: "#718096", fontSize: 18 }} />;
              return <FileUnknownOutlined style={{ color: "#718096", fontSize: 18 }} />;
            })()}
            {previewTitle}
          </span>
        }
        footer={null}
        onCancel={() => {
          setPreviewOpen(false);
        }}
        width={previewType === "pdf" ? 900 : previewType === "doc" ? 680 : 800}
        centered
        styles={{
          body: {
            padding: previewType === "doc" ? "32px 24px" : 0,
            display: "flex",
            justifyContent: "center",
            alignItems: previewType === "doc" ? "flex-start" : "center",
            overflow: previewType === "doc" ? "auto" : "hidden",
            backgroundColor: previewType === "image" ? "#000" : "#f5f5f5",
            borderRadius: "0 0 8px 8px",
            minHeight: previewType === "pdf" ? "80vh" : previewType === "doc" ? 220 : undefined,
            maxHeight: previewType === "doc" ? "70vh" : undefined,
            flexDirection: previewType === "doc" ? "column" : undefined,
            gap: previewType === "doc" ? 16 : undefined,
          },
        }}
      >
        {previewType === "image" && (
          <img
            alt="preview"
            style={{
              maxWidth: "100%",
              maxHeight: "80vh",
              objectFit: "contain",
            }}
            src={previewImage}
          />
        )}
        {previewType === "pdf" && (
          <iframe
            src={previewImage}
            title={previewTitle}
            style={{
              width: "100%",
              height: "80vh",
              border: "none",
            }}
          />
        )}
        {previewType === "doc" && (
          <div style={{ width: "100%" }}>
            {/* Show text content inline for .txt files */}
            {previewLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0" }}>
                <Spin size="large" />
                <p style={{ marginTop: 16, color: "#718096" }}>Loading file...</p>
              </div>
            ) : previewTextContent !== null ? (
              <div>
                <pre
                  style={{
                    background: "#fff",
                    border: "1px solid #e2e8f0",
                    borderRadius: 8,
                    padding: "16px 20px",
                    fontSize: 13,
                    lineHeight: 1.7,
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                    maxHeight: "55vh",
                    overflowY: "auto",
                    color: "#2d3748",
                    // fontFamily: "'Menlo', 'Consolas', monospace",
                    margin: 0,
                  }}
                >
                  {previewTextContent}
                </pre>
                <div style={{ marginTop: 20, textAlign: "center" }}>
                  <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = previewDocUrl;
                      link.setAttribute("download", previewDocFileName);
                      document.body.appendChild(link);
                      link.click();
                      link.remove();
                    }}
                  >
                    Download {previewDocFileName}
                  </Button>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center" }}>
                {/* File icon */}
                <div style={{ marginBottom: 20 }}>
                  {(() => {
                    const n = (previewDocFileName || "").toLowerCase();
                    const iconStyle = { fontSize: 72 };
                    if (n.endsWith(".docx") || n.endsWith(".doc"))
                      return <FileWordOutlined style={{ ...iconStyle, color: "#2b579a" }} />;
                    if (n.endsWith(".xlsx") || n.endsWith(".xls"))
                      return <FileExcelOutlined style={{ ...iconStyle, color: "#217346" }} />;
                    return <FileUnknownOutlined style={{ ...iconStyle, color: "#718096" }} />;
                  })()}
                </div>
                <p style={{ color: "#4a5568", fontSize: 15, fontWeight: 600, marginBottom: 6 }}>
                  {previewDocFileName}
                </p>
                <p style={{ color: "#718096", fontSize: 13, marginBottom: 28 }}>
                  This file type cannot be previewed directly in the browser.
                  <br />
                  Click the button below to download and open it in the appropriate app.
                </p>
                <Button
                  type="primary"
                  size="large"
                  icon={<DownloadOutlined />}
                  style={{ borderRadius: 8, paddingInline: 32 }}
                  onClick={() => {
                    const link = document.createElement("a");
                    link.href = previewDocUrl;
                    link.setAttribute("download", previewDocFileName);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                  }}
                >
                  Download to View
                </Button>
              </div>
            )}
          </div>
        )}
      </Modal>
    </StyledWrapper>
  );
});

export default CommonMultipleUploader;