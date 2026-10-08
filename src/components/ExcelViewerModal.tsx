import React from "react";
import { Modal } from "antd";
import { ExcelSpreadsheetView } from "./ExcelSpreadsheetView";

interface ExcelViewerModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  blob?: Blob | null;
  file?: File | null;
  onDownload?: () => void;
}

export const ExcelViewerModal: React.FC<ExcelViewerModalProps> = ({
  open,
  onClose,
  fileName,
  blob,
  file,
  onDownload,
}) => (
  <Modal
    open={open}
    onCancel={onClose}
    footer={null}
    width="90vw"
    style={{ maxWidth: 1200, top: 20 }}
    centered
  >
    <ExcelSpreadsheetView
      fileName={fileName}
      file={file}
      blob={blob}
      onDownload={onDownload}
    />
  </Modal>
);

export default ExcelViewerModal;
