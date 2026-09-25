import React, { useState, useEffect, useMemo } from "react";
import { Modal, Button, Input, Table, Spin, Empty, Tag, Tooltip } from "antd";
import {
  FileSpreadsheet,
  Download,
  Search,
  Layers,
  FileText,
} from "lucide-react";
import * as XLSX from "xlsx";

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
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>([]);
  const [activeSheet, setActiveSheet] = useState<string>("");
  const [sheetsData, setSheetsData] = useState<Record<string, any[][]>>({});
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    if (!open || (!blob && !file)) {
      setSheetsData({});
      setSheetNames([]);
      setActiveSheet("");
      setError(null);
      setSearchQuery("");
      return;
    }

    const parseExcel = async () => {
      setLoading(true);
      setError(null);
      try {
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

        const dataMap: Record<string, any[][]> = {};
        workbook.SheetNames.forEach((name) => {
          const ws = workbook.Sheets[name];
          const json: any[][] = XLSX.utils.sheet_to_json(ws, {
            header: 1,
            defval: "",
            raw: false,
          });
          dataMap[name] = json;
        });

        setSheetNames(workbook.SheetNames);
        setActiveSheet(workbook.SheetNames[0]);
        setSheetsData(dataMap);
      } catch (err: any) {
        console.error("Error parsing spreadsheet:", err);
        setError("Failed to parse spreadsheet. The file might be corrupted or in an unsupported format.");
      } finally {
        setLoading(false);
      }
    };

    parseExcel();
  }, [open, blob, file]);

  const currentSheetRows = useMemo(() => {
    if (!activeSheet || !sheetsData[activeSheet]) return [];
    return sheetsData[activeSheet];
  }, [activeSheet, sheetsData]);

  // Compute table columns and data source
  const { columns, dataSource } = useMemo(() => {
    if (!currentSheetRows || currentSheetRows.length === 0) {
      return { columns: [], dataSource: [] };
    }

    const maxCols = Math.max(...currentSheetRows.map((r) => (Array.isArray(r) ? r.length : 0)), 1);

    // Row number index column
    const cols: any[] = [
      {
        title: "#",
        dataIndex: "__rowNumber",
        key: "__rowNumber",
        width: 60,
        fixed: "left",
        align: "center",
        render: (val: number) => (
          <span className="font-semibold text-gray-400 text-xs">{val}</span>
        ),
      },
    ];

    // Build letter header (A, B, C... or Col 1, Col 2...)
    const getColLetter = (index: number) => {
      let letter = "";
      let temp = index;
      while (temp >= 0) {
        letter = String.fromCharCode((temp % 26) + 65) + letter;
        temp = Math.floor(temp / 26) - 1;
      }
      return letter;
    };

    // Use Row 0 as headers if available or generic column names
    const firstRow = currentSheetRows[0] || [];
    for (let c = 0; c < maxCols; c++) {
      const headerTitle = firstRow[c] !== undefined && firstRow[c] !== "" ? String(firstRow[c]) : getColLetter(c);
      cols.push({
        title: (
          <div className="flex flex-col">
            <span className="text-[10px] text-gray-400 font-normal uppercase">{getColLetter(c)}</span>
            <span className="font-bold text-gray-800 truncate" title={headerTitle}>
              {headerTitle}
            </span>
          </div>
        ),
        dataIndex: `col_${c}`,
        key: `col_${c}`,
        width: 140,
        ellipsis: true,
        render: (cellVal: any) => {
          const str = cellVal !== undefined && cellVal !== null ? String(cellVal) : "";
          if (!searchQuery) return str;
          const matchIndex = str.toLowerCase().indexOf(searchQuery.toLowerCase());
          if (matchIndex === -1) return str;
          const before = str.substring(0, matchIndex);
          const matched = str.substring(matchIndex, matchIndex + searchQuery.length);
          const after = str.substring(matchIndex + searchQuery.length);
          return (
            <span>
              {before}
              <mark className="bg-amber-200 px-0.5 rounded text-gray-900 font-bold">{matched}</mark>
              {after}
            </span>
          );
        },
      });
    }

    // Prepare rows (skip row 0 if it was used for headers, or show all rows)
    const rows = currentSheetRows.map((rowArr, rowIdx) => {
      const rowObj: Record<string, any> = {
        key: `row-${rowIdx}`,
        __rowNumber: rowIdx + 1,
      };
      for (let c = 0; c < maxCols; c++) {
        rowObj[`col_${c}`] = rowArr && rowArr[c] !== undefined ? rowArr[c] : "";
      }
      return rowObj;
    });

    // Filter rows based on search query
    const filtered = searchQuery
      ? rows.filter((row) =>
          Object.entries(row).some(
            ([key, val]) =>
              key !== "key" &&
              key !== "__rowNumber" &&
              String(val).toLowerCase().includes(searchQuery.toLowerCase())
          )
        )
      : rows;

    return { columns: cols, dataSource: filtered };
  }, [currentSheetRows, searchQuery]);

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      width="90vw"
      style={{ maxWidth: 1200, top: 20 }}
      centered
      title={
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-6 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-xs">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-[#2B3674]">{fileName}</h3>
                <Tag color="emerald" className="font-semibold text-xs rounded-md uppercase">
                  Excel Viewer
                </Tag>
              </div>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                {currentSheetRows.length} row{currentSheetRows.length === 1 ? "" : "s"} •{" "}
                {columns.length > 1 ? `${columns.length - 1} column${columns.length > 2 ? "s" : ""}` : "0 columns"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onDownload && (
              <Button
                type="default"
                icon={<Download className="w-4 h-4" />}
                onClick={onDownload}
                className="flex items-center gap-1.5 font-semibold text-xs h-9 rounded-xl border-gray-200 hover:border-emerald-500 hover:text-emerald-600"
              >
                Download
              </Button>
            )}
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-3 pt-2">
        {/* Top Control Bar: Search & Sheet Selection */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/80 p-2.5 rounded-2xl border border-gray-200/70">
          {/* Sheet Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 px-1">
              <Layers className="w-3.5 h-3.5 text-gray-500" />
              <span>Sheets:</span>
            </span>
            {sheetNames.map((name) => (
              <button
                key={name}
                type="button"
                onClick={() => setActiveSheet(name)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  activeSheet === name
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {name}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="w-full sm:w-64">
            <Input
              prefix={<Search className="w-3.5 h-3.5 text-gray-400 mr-1" />}
              placeholder="Search in sheet..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              allowClear
              size="small"
              className="rounded-xl border-gray-200 text-xs py-1.5"
            />
          </div>
        </div>

        {/* Content Area */}
        <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs">
          {loading ? (
            <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
              <Spin size="large" />
              <span className="text-xs font-medium">Parsing spreadsheet data...</span>
            </div>
          ) : error ? (
            <div className="py-16 text-center text-red-500 text-sm font-medium px-4">
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
          ) : dataSource.length === 0 ? (
            <div className="py-16">
              <Empty
                description={
                  searchQuery
                    ? `No rows match search "${searchQuery}"`
                    : "This sheet has no data"
                }
              />
            </div>
          ) : (
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={{
                pageSize: 25,
                showSizeChanger: true,
                pageSizeOptions: ["10", "25", "50", "100"],
                size: "small",
                className: "px-4 py-2",
              }}
              scroll={{ x: "max-content", y: 480 }}
              size="small"
              bordered
              rowClassName={(_, index) => (index % 2 === 0 ? "bg-white" : "bg-gray-50/50")}
            />
          )}
        </div>
      </div>
    </Modal>
  );
};

export default ExcelViewerModal;
