import React, { useState, useEffect } from "react";
import { Button, UploadFile, Spin } from "antd";
import { EyeOutlined, DownloadOutlined } from "@ant-design/icons";
import {
  StyledImageWrapper,
  StyledOverlay,
  StyledActionButtons,
} from "./CommonMultipleUploader";
// import {
//   StyledImageWrapper,
//   StyledOverlay,
//   StyledActionButtons,
// } from "./CommonMultipleUploader";

interface ImageCardWrapperProps {
  file: UploadFile;
  onPreview: (file: UploadFile, event: React.MouseEvent) => void;
  onDownload: (file: UploadFile, event: React.MouseEvent) => void;
  getImageUrl: (file: UploadFile) => Promise<string>;
  showPreview: boolean;
  showDownload: boolean;
}

const ImageCardWrapper: React.FC<ImageCardWrapperProps> = ({
  file,
  onPreview,
  onDownload,
  getImageUrl,
  showPreview,
  showDownload,
}) => {
  const [imageUrl, setImageUrl] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      try {
        setLoading(true);
        const url = await getImageUrl(file);
        if (isMounted) {
          setImageUrl(url);
        }
      } catch (error) {
        console.error("Failed to load image:", error);
        if (isMounted) {
          setImageUrl("");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [file.uid, getImageUrl]);

  const fallbackSvg =
    "data:image/svg+xml;utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E";

  return (
    <StyledImageWrapper
      onClick={(e: React.MouseEvent) => onPreview(file, e)}
      style={{
        backgroundImage: imageUrl ? `url("${imageUrl}")` : undefined,
      }}
    >
      {loading ? (
        <Spin size="small" />
      ) : (
        <img
          src={imageUrl || fallbackSvg}
          alt={file.name}
          onError={(e) => {
            console.error("Image failed to load:", imageUrl);
            (e.target as HTMLImageElement).src = fallbackSvg;
          }}
        />
      )}
      <StyledOverlay>
        <StyledActionButtons>
          {showPreview && (
            <Button
              type="default"
              size="small"
              icon={<EyeOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onPreview(file, e as React.MouseEvent);
              }}
            >
              Preview
            </Button>
          )}
          {showDownload && (
            <Button
              type="default"
              size="small"
              icon={<DownloadOutlined />}
              onClick={(e) => {
                e.stopPropagation();
                onDownload(file, e as React.MouseEvent);
              }}
            >
              Save
            </Button>
          )}
        </StyledActionButtons>
      </StyledOverlay>
    </StyledImageWrapper>
  );
};

export default ImageCardWrapper;
