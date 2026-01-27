import React, { useCallback, useState, useEffect, useRef } from "react";
import { Button, message, UploadFile, Modal } from "antd";
import {
  DeleteOutlined,
  DownloadOutlined,
  EyeOutlined,
  CloseOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import styled from "styled-components";
import { useDispatch } from "react-redux";
import ImageCardWrapper from "./ImageCardWrapper";

const StyledWrapper = styled.div`
  width: 100%;
`;

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
  grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
  gap: 12px;
  margin-top: 16px;
  @media (max-width: 768px) {
    grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
    gap: 10px;
  }

  @media (max-width: 480px) {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
    gap: 8px;
  }
`;

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

const StyledCloseButton = styled.button`
  position: absolute;
  top: 6px;
  right: 6px;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: rgba(255, 59, 48, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  font-size: 11px;
  transition: all 0.2s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

  &:hover {
    transform: scale(1.15) rotate(90deg);
    background: rgba(220, 20, 20, 1);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.4);
  }

  &:active {
    transform: scale(1.05) rotate(90deg);
  }
`;

export const StyledOverlay = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  background: linear-gradient(
    to top,
    rgba(0, 0, 0, 0.9) 0%,
    rgba(0, 0, 0, 0.5) 60%,
    transparent 100%
  );
  padding: 6px;
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  height: 45%;

  ${StyledImageCard}:hover & {
    opacity: 1;
  }
`;

export const StyledActionButtons = styled.div`
  display: flex;
  justify-content: center;
  gap: 4px;

  .ant-btn {
    background: rgba(255, 255, 255, 0.95);
    border: none;
    backdrop-filter: blur(10px);
    padding: 2px 6px;
    height: 24px;
    font-size: 11px;
    line-height: 1;
    border-radius: 4px;

    &:hover {
      background: white;
      transform: translateY(-1px);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
    }

    .anticon {
      font-size: 11px;
    }

    span {
      font-size: 10px;
    }
  }
`;

const StyledNonImageCard = styled.div`
  position: relative;
  width: 100%;
  padding-bottom: 100%;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  cursor: pointer;

  &:hover {
    transform: translateY(-4px) scale(1.02);
    box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  }
`;

const StyledNonImageWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  color: white;
  padding: 10px;
`;

const StyledFileExtension = styled.div`
  font-size: 18px;
  font-weight: 700;
  margin-top: 6px;
  color: white;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
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
  background: rgba(0, 0, 0, 0.6);
  padding: 3px 5px;
  border-radius: 4px;
  backdrop-filter: blur(4px);
`;

const StyledEmptyState = styled.div`
  text-align: center;
  padding: 60px 20px;
  color: #999;
  font-size: 14px;
  background: #fafafa;
  border-radius: 12px;
  border: 2px dashed #d9d9d9;
`;

interface FileListResponse {
  key: string;
  name: string;
  url: string;
  refId: number;
  refType: string;
  entityType: string;
  entityId: number;
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
  successMessage?: string;
  deleteMessage?: string;
  multiple?: boolean;
}

const CommonMultipleUploader: React.FC<CommonMultipleUploaderProps> = ({
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
  allowedTypes = ["images", "pdf"],
  onFileUpload = () => {},
  onFileDelete = () => {},
  successMessage = "Your file has been uploaded successfully and is now available for use",
  deleteMessage = "The file has been deleted successfully and is no longer available",
  multiple = true,
}) => {
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
  }, [fileList]);

  useEffect(() => {
    blobUrlsRef.current = blobUrls;
  }, [blobUrls]);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [messageApi, contextHolder] = message.useMessage();

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");

  const showSuccessMessage = (msg: string) => {
    messageApi.success(msg, 4);
  };
  const showErrorMessage = (msg: string) => {
    messageApi.error(msg, 4);
  };

  useEffect(() => {
    const fetchFiles = async () => {
      if (entityId === undefined || entityId === null) {
        return;
      }

      // If fetchOnMount is false, we should never fetch in this effect.
      // This allows the component to start with an empty list for new applications.
      if (!fetchOnMount) {
        lastFetchedIdRef.current = entityId;
        return;
      }

      // Skip if we already fetched for this specific entityId
      if (lastFetchedIdRef.current === entityId) {
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
          const formattedFiles: UploadFile[] = relevantFiles.map(
            (file: FileListResponse) => ({
              uid: file.key,
              name: file.name,
              status: "done" as const,
              url: (file as any).url || (file as any).image_url || "",
            }),
          );
          setExistingFiles(formattedFiles);
          setFileList(relevantFiles);
        } else {
          setExistingFiles([]);
          setFileList([]);
        }
        lastFetchedIdRef.current = entityId;
      } catch (error) {
        console.error("Error fetching files:", error);
      }
    };
    fetchFiles();
  }, [entityId, refType, refId, entityType, dispatch, getFiles]);

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
          const finalUrl = isValidUrl(backendUrl) ? backendUrl : localUrl;

          const newUploadFile: UploadFile = {
            uid: uploadedData.key,
            name: uploadedData.name || uploadedData.fileName || file.name,
            status: "done" as const,
            url: finalUrl,
          };

          setExistingFiles((prev) => [...prev, newUploadFile]);
          setFileList((prev) => [...prev, newFileResponse]);
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
    }

    return acceptedTypes;
  };

  const handleUploadButtonClick = () => {
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
    if (isValidUrl(file.url) && file.url?.startsWith("blob:")) {
      const link = document.createElement("a");
      link.href = file.url;
      link.setAttribute("download", file.name || "download");
      document.body.appendChild(link);
      link.click();
      link.remove();
      return;
    }

    try {
      if (!downloadFile) {
        showErrorMessage("Download action not configured");
        return;
      }
      const response = await dispatch(
        downloadFile({
          entityId: selectedFile.entityId,
          refId: selectedFile.refId,
          refType: selectedFile.refType,
          entityType: selectedFile.entityType,
          key: file.uid,
        }),
      ).unwrap();

      const contentType =
        response.headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", file.name || "download");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      showErrorMessage("Failed to download file");
    }
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

    if (isImageFile(file.name)) {
      if (isValidUrl(file.url)) {
        setPreviewImage(file.url!);
        setPreviewTitle(file.name || "Image Preview");
        setPreviewOpen(true);
        return;
      }

      const thumbUrl = await getImageUrl(file);
      if (isValidUrl(thumbUrl)) {
        setPreviewImage(thumbUrl);
        setPreviewTitle(file.name || "Image Preview");
        setPreviewOpen(true);
        return;
      }
    }

    if (isValidUrl(file.url) && file.url?.startsWith("blob:")) {
      window.open(file.url, "_blank");
      return;
    }

    try {
      if (!previewFile) {
        showErrorMessage("Preview action not configured");
        return;
      }
      const response = await dispatch(
        previewFile({
          entityId: selectedFile.entityId,
          refId: selectedFile.refId,
          refType: selectedFile.refType,
          entityType: selectedFile.entityType,
          key: file.uid,
        }),
      ).unwrap();

      const contentType =
        response.headers?.["content-type"] || "application/octet-stream";
      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      if (isImageFile(file.name)) {
        setPreviewImage(url);
        setPreviewTitle(file.name || "Image Preview");
        setPreviewOpen(true);
        return;
      }

      const newWindow = window.open(url, "_blank");

      if (newWindow) {
        newWindow.onload = () => {
          setTimeout(() => {
            window.URL.revokeObjectURL(url);
          }, 100);
        };
      } else {
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      showErrorMessage("Failed to preview file");
      console.error("Preview error:", error);
    }
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

  const isImageFile = (fileName: string) => {
    const imageExtensions = [".png", ".jpg", ".jpeg", ".webp", ".gif"];
    return imageExtensions.some((ext) => fileName.toLowerCase().endsWith(ext));
  };

  const getFileExtension = (fileName: string) => {
    return fileName.split(".").pop()?.toUpperCase() || "FILE";
  };

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

      const selectedFile = fileListRef.current.find((f) => f.key === file.uid);
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
    [dispatch, previewFile], // fileList and blobUrls removed from dependencies
  );

  const getImageUrl = useCallback(
    async (file: UploadFile): Promise<string> => {
      if (file.url) {
        return file.url;
      }
      return (await loadImageAsBlob(file)) || "";
    },
    [loadImageAsBlob],
  );

  useEffect(() => {
    return () => {
      blobUrls.forEach((url) => {
        if (url.startsWith("blob:")) {
          window.URL.revokeObjectURL(url);
        }
      });
    };
  }, [blobUrls]);

  const getAcceptString = () => {
    return Object.values(getAcceptedFileTypes()).flat().join(",");
  };

  return (
    <StyledWrapper>
      {contextHolder}

      {!disabled && (
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

      {existingFiles.length > 0 || uploadingFiles.length > 0 ? (
        <StyledGalleryContainer>
          {uploadingFiles.map((file) => (
            <StyledImageCard key={file.uid}>
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
          ))}

          {existingFiles.map((file) =>
            isImageFile(file.name) ? (
              <StyledImageCard key={file.uid}>
                {finalShowDelete && (
                  <StyledCloseButton onClick={(e) => handleDelete(file, e)}>
                    <CloseOutlined />
                  </StyledCloseButton>
                )}

                {(() => {
                  return (
                    <ImageCardWrapper
                      file={file}
                      onPreview={handlePreview}
                      onDownload={handleDownload}
                      getImageUrl={getImageUrl}
                      showPreview={showPreview}
                      showDownload={showDownload}
                    />
                  );
                })()}
              </StyledImageCard>
            ) : (
              <StyledNonImageCard key={file.uid}>
                {finalShowDelete && (
                  <StyledCloseButton onClick={(e) => handleDelete(file, e)}>
                    <CloseOutlined />
                  </StyledCloseButton>
                )}

                <StyledNonImageWrapper>
                  <EyeOutlined style={{ fontSize: 24 }} />
                  <StyledFileExtension>
                    {getFileExtension(file.name)}
                  </StyledFileExtension>
                </StyledNonImageWrapper>

                <StyledFileName title={file.name}>{file.name}</StyledFileName>

                <StyledOverlay>
                  <StyledActionButtons>
                    {showPreview && (
                      <Button
                        type="default"
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={(e) => handlePreview(file, e)}
                      >
                        View
                      </Button>
                    )}
                    {showDownload && (
                      <Button
                        type="default"
                        size="small"
                        icon={<DownloadOutlined />}
                        onClick={(e) => handleDownload(file, e)}
                      >
                        Save
                      </Button>
                    )}
                    {showDelete && (
                      <Button
                        type="default"
                        size="small"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(file);
                        }}
                      >
                        Delete
                      </Button>
                    )}
                  </StyledActionButtons>
                </StyledOverlay>
              </StyledNonImageCard>
            ),
          )}
        </StyledGalleryContainer>
      ) : (
        <StyledEmptyState>
          {disabled
            ? "📄 No documents attached."
            : '📄 No documents uploaded yet. Click "Upload Documents" button above to get started.'}
        </StyledEmptyState>
      )}
      <Modal
        open={previewOpen}
        title={previewTitle}
        footer={null}
        onCancel={() => setPreviewOpen(false)}
        width={800}
        centered
        styles={{
          body: {
            padding: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
            backgroundColor: "#000",
            borderRadius: "0 0 8px 8px",
          },
        }}
      >
        <img
          alt="preview"
          style={{
            maxWidth: "100%",
            maxHeight: "80vh",
            objectFit: "contain",
          }}
          src={previewImage}
        />
      </Modal>
    </StyledWrapper>
  );
};

export default CommonMultipleUploader;
