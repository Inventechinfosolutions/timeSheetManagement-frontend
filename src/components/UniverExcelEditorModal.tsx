import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Spin, Tag, Tooltip, message } from "antd";
import {
  FileSpreadsheet,
  Download,
  Save,
  Maximize2,
  Minimize2,
} from "lucide-react";

// Univer imports
import { createUniver, LocaleType } from "@univerjs/presets";
import { UniverSheetsCorePreset } from "@univerjs/preset-sheets-core";
import "@univerjs/preset-sheets-core/lib/index.css";

// SheetJS for XLSX parsing
import * as XLSX from "xlsx";

interface UniverExcelEditorModalProps {
  open: boolean;
  onClose: () => void;
  fileName: string;
  blob?: Blob | null;
  file?: File | null;
  onDownload?: () => void;
  onSave?: (data: ArrayBuffer, fileName: string) => void;
}

/**
 * Convert SheetJS workbook data into the Univer workbook JSON format
 */
function xlsxToUniverData(workbook: XLSX.WorkBook) {
  const sheets: Record<string, any> = {};

  workbook.SheetNames.forEach((sheetName, sheetIndex) => {
    const ws = workbook.Sheets[sheetName];
    const ref = ws["!ref"];
    if (!ref) {
      sheets[`sheet-${sheetIndex}`] = {
        id: `sheet-${sheetIndex}`,
        name: sheetName,
        cellData: {},
        rowCount: 100,
        columnCount: 26,
      };
      return;
    }

    const range = XLSX.utils.decode_range(ref);
    const rowCount = Math.max(range.e.r + 1, 100);
    const columnCount = Math.max(range.e.c + 1, 26);
    const cellData: Record<number, Record<number, any>> = {};

    for (let r = range.s.r; r <= range.e.r; r++) {
      cellData[r] = {};
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cellAddress = XLSX.utils.encode_cell({ r, c });
        const cell = ws[cellAddress];
        if (cell) {
          const univerCell: any = {};

          // Set cell value
          if (cell.t === "n") {
            univerCell.v = cell.v;
            univerCell.t = 2; // CellValueType.NUMBER
          } else if (cell.t === "b") {
            univerCell.v = cell.v ? 1 : 0;
            univerCell.t = 1; // CellValueType.BOOLEAN
          } else if (cell.t === "s") {
            univerCell.v = cell.v || "";
            univerCell.t = 1; // CellValueType.STRING
          } else if (cell.t === "d") {
            univerCell.v = cell.w || String(cell.v);
            univerCell.t = 1;
          } else {
            univerCell.v = cell.v !== undefined ? String(cell.v) : "";
            univerCell.t = 1;
          }

          // Preserve formulas
          if (cell.f) {
            univerCell.f = `=${cell.f}`;
          }

          cellData[r][c] = univerCell;
        }
      }
    }

    // Handle merged cells
    const mergeData: any[] = [];
    if (ws["!merges"]) {
      ws["!merges"].forEach((merge) => {
        mergeData.push({
          startRow: merge.s.r,
          startColumn: merge.s.c,
          endRow: merge.e.r,
          endColumn: merge.e.c,
        });
      });
    }

    // Handle column widths
    const columnData: Record<number, any> = {};
    if (ws["!cols"]) {
      ws["!cols"].forEach((col, idx) => {
        if (col && col.wpx) {
          columnData[idx] = { w: col.wpx };
        } else if (col && col.wch) {
          columnData[idx] = { w: col.wch * 8 };
        }
      });
    }

    // Handle row heights
    const rowData: Record<number, any> = {};
    if (ws["!rows"]) {
      ws["!rows"].forEach((row, idx) => {
        if (row && row.hpx) {
          rowData[idx] = { h: row.hpx };
        } else if (row && row.hpt) {
          rowData[idx] = { h: row.hpt * 1.33 };
        }
      });
    }

    sheets[`sheet-${sheetIndex}`] = {
      id: `sheet-${sheetIndex}`,
      name: sheetName,
      cellData,
      rowCount,
      columnCount,
      mergeData: mergeData.length > 0 ? mergeData : undefined,
      columnData: Object.keys(columnData).length > 0 ? columnData : undefined,
      rowData: Object.keys(rowData).length > 0 ? rowData : undefined,
      defaultColumnWidth: 88,
      defaultRowHeight: 24,
    };
  });

  return {
    id: "workbook-1",
    name: "Workbook",
    appVersion: "1.0.0",
    sheetOrder: workbook.SheetNames.map((_, i) => `sheet-${i}`),
    sheets,
  };
}

export const UniverExcelEditorModal: React.FC<UniverExcelEditorModalProps> = ({
  open,
  onClose,
  fileName,
  blob,
  file,
  onDownload,
  onSave,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const univerRef = useRef<any>(null);
  const univerAPIRef = useRef<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [sheetCount, setSheetCount] = useState(0);

  useEffect(() => {
    if (!open) {
      // Clean up Univer on close
      if (univerRef.current) {
        try {
          univerRef.current.dispose();
        } catch (e) {
          // ignore
        }
        univerRef.current = null;
        univerAPIRef.current = null;
      }
      setError(null);
      setSheetCount(0);
      return;
    }

    if (!blob && !file) return;

    const initUniver = async () => {
      setLoading(true);
      setError(null);

      try {
        // Parse the Excel file
        const target = file || blob;
        if (!target) return;

        const arrayBuffer = await target.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, {
          type: "array",
          cellDates: true,
        });

        if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
          throw new Error("No sheets found in workbook");
        }

        setSheetCount(workbook.SheetNames.length);

        // Convert to Univer format
        const univerWorkbookData = xlsxToUniverData(workbook);

        // Wait for container to be ready
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (!containerRef.current) {
          throw new Error("Container not ready");
        }

        // Dispose previous instance
        if (univerRef.current) {
          try {
            univerRef.current.dispose();
          } catch (e) {
            // ignore
          }
        }

        // Create Univer instance
        const { univer, univerAPI } = createUniver({
          locale: LocaleType.EN_US,
          presets: [
            UniverSheetsCorePreset({
              container: containerRef.current,
            }),
          ],
        });

        univerRef.current = univer;
        univerAPIRef.current = univerAPI;

        // Load workbook data
        univerAPI.createWorkbook(univerWorkbookData);
      } catch (err: any) {
        console.error("Error loading Excel into Univer:", err);
        setError(
          err.message ||
            "Failed to load spreadsheet. The file might be corrupted or unsupported."
        );
      } finally {
        setLoading(false);
      }
    };

    // Small delay to ensure modal is rendered
    const timer = setTimeout(initUniver, 200);
    return () => clearTimeout(timer);
  }, [open, blob, file]);

  const handleExportSave = async () => {
    try {
      if (!univerAPIRef.current) {
        message.error("Spreadsheet not loaded");
        return;
      }

      // Get workbook data from Univer
      const workbookData = univerAPIRef.current.getActiveWorkbook()?.save();
      if (!workbookData) {
        message.error("Could not read spreadsheet data");
        return;
      }

      // Convert Univer data back to SheetJS workbook
      const wb = XLSX.utils.book_new();
      const sheetOrder = workbookData.sheetOrder || Object.keys(workbookData.sheets || {});

      sheetOrder.forEach((sheetId: string) => {
        const sheetData = workbookData.sheets?.[sheetId];
        if (!sheetData) return;

        const cellData = sheetData.cellData || {};
        const aoa: any[][] = [];

        const maxRow = Math.max(...Object.keys(cellData).map(Number), 0);

        for (let r = 0; r <= maxRow; r++) {
          const row: any[] = [];
          if (cellData[r]) {
            const maxCol = Math.max(...Object.keys(cellData[r]).map(Number), 0);
            for (let c = 0; c <= maxCol; c++) {
              const cell = cellData[r]?.[c];
              row.push(cell?.v !== undefined ? cell.v : "");
            }
          }
          aoa.push(row);
        }

        const ws = XLSX.utils.aoa_to_sheet(aoa);
        XLSX.utils.book_append_sheet(wb, ws, sheetData.name || `Sheet${sheetOrder.indexOf(sheetId) + 1}`);
      });

      const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });

      if (onSave) {
        onSave(wbout, fileName);
        message.success("Spreadsheet saved successfully!");
      } else {
        // Download locally
        const blob = new Blob([wbout], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = fileName || "spreadsheet.xlsx";
        a.click();
        URL.revokeObjectURL(url);
        message.success("Spreadsheet downloaded!");
      }
    } catch (err) {
      console.error("Error exporting spreadsheet:", err);
      message.error("Failed to export spreadsheet");
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen((prev) => !prev);
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width={isFullscreen ? "100vw" : "92vw"}
      style={{
        maxWidth: isFullscreen ? "100vw" : 1400,
        top: isFullscreen ? 0 : 20,
        padding: 0,
      }}
      centered={!isFullscreen}
      className={isFullscreen ? "univer-fullscreen-modal" : ""}
      title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#2B3674]">
                  {fileName}
                </h3>
                <Tag
                  color="emerald"
                  className="font-semibold text-xs rounded-md uppercase"
                >
                  Excel Editor
                </Tag>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {sheetCount} sheet{sheetCount === 1 ? "" : "s"} • Editable
                Spreadsheet
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Tooltip title="Save / Export as XLSX">
              <Button
                type="primary"
                icon={<Save className="w-4 h-4" />}
                onClick={handleExportSave}
                className="flex items-center gap-1.5 font-semibold text-xs h-9 rounded-xl bg-emerald-600 hover:bg-emerald-500 border-emerald-600"
              >
                Save
              </Button>
            </Tooltip>

            {onDownload && (
              <Tooltip title="Download original file">
                <Button
                  type="default"
                  icon={<Download className="w-4 h-4" />}
                  onClick={onDownload}
                  className="flex items-center gap-1.5 font-semibold text-xs h-9 rounded-xl border-gray-200 hover:border-emerald-500 hover:text-emerald-600"
                >
                  Download
                </Button>
              </Tooltip>
            )}

            <Tooltip title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}>
              <Button
                type="default"
                icon={
                  isFullscreen ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )
                }
                onClick={toggleFullscreen}
                className="flex items-center font-semibold text-xs h-9 w-9 rounded-xl border-gray-200 hover:border-emerald-500 hover:text-emerald-600 p-0 justify-center"
              />
            </Tooltip>
          </div>
        </div>
      }
    >
      <div className="flex flex-col pt-2">
        <div
          className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs"
          style={{
            height: isFullscreen ? "calc(100vh - 120px)" : "70vh",
            minHeight: 400,
          }}
        >
          {loading ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-gray-400">
              <Spin size="large" />
              <span className="text-xs font-medium">
                Loading spreadsheet into editor...
              </span>
            </div>
          ) : error ? (
            <div className="h-full flex flex-col items-center justify-center text-red-500 text-sm font-medium px-4">
              <p>{error}</p>
              {onDownload && (
                <Button
                  type="primary"
                  icon={<Download className="w-4 h-4" />}
                  onClick={onDownload}
                  className="mt-3 bg-emerald-600 hover:bg-emerald-500"
                >
                  Download File Instead
                </Button>
              )}
            </div>
          ) : (
            <div
              ref={containerRef}
              style={{ width: "100%", height: "100%" }}
            />
          )}
        </div>
      </div>

      <style>{`
        .univer-fullscreen-modal .ant-modal {
          max-width: 100vw !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .univer-fullscreen-modal .ant-modal-content {
          border-radius: 0 !important;
          height: 100vh;
        }
        /* Ensure Univer toolbar blends in */
        .univer-container {
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </Modal>
  );
};

export default UniverExcelEditorModal;
