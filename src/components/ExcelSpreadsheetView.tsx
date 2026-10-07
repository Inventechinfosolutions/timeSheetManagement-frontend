import React, { useEffect, useMemo, useState } from "react";
import { Button, Empty, Input, Spin, Tag } from "antd";
import { Download, FileSpreadsheet, Layers, Search } from "lucide-react";
import Spreadsheet, { type CellBase, type Matrix } from "react-spreadsheet";
import { parseExcelFile, type ExcelWorkbookData } from "../Notes/utils/excelExtract";

type SheetCell = CellBase<string | number>;

const rowsToMatrix = (rows: any[][]): Matrix<SheetCell> =>
  (rows || []).map((row) =>
    (Array.isArray(row) ? row : []).map((cell) => ({
      value: cell === undefined || cell === null ? "" : cell,
    }))
  );

const matrixToRows = (data: Matrix<SheetCell>): any[][] =>
  (data || []).map((row) => (row || []).map((cell) => cell?.value ?? ""));

interface ExcelSpreadsheetViewProps {
  fileName?: string;
  file?: File | null;
  blob?: Blob | null;
  workbook?: ExcelWorkbookData | null;
  onWorkbookChange?: (workbook: ExcelWorkbookData) => void;
  onDownload?: () => void;
  embedded?: boolean;
}

export const ExcelSpreadsheetView: React.FC<ExcelSpreadsheetViewProps> = ({
  fileName = "Spreadsheet.xlsx",
  file,
  blob,
  workbook,
  onWorkbookChange,
  onDownload,
  embedded = false,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sheetNames, setSheetNames] = useState<string[]>(workbook?.sheetNames || []);
  const [activeSheet, setActiveSheet] = useState<string>(workbook?.sheetNames?.[0] || "");
  const [sheetsData, setSheetsData] = useState<Record<string, any[][]>>(workbook?.sheetsData || {});
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (workbook?.sheetNames?.length) {
      setSheetNames(workbook.sheetNames);
      setSheetsData(workbook.sheetsData);
      setActiveSheet((prev) =>
        workbook.sheetNames.includes(prev) ? prev : workbook.sheetNames[0]
      );
      setError(null);
      return;
    }

    const source = file || blob;
    if (!source) return;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const parsed = await parseExcelFile(source, fileName);
        setSheetNames(parsed.sheetNames);
        setSheetsData(parsed.sheetsData);
        setActiveSheet(parsed.sheetNames[0]);
      } catch (err: any) {
        setError(err?.message || "Failed to parse spreadsheet.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [workbook, file, blob, fileName]);

  const currentSheetRows = sheetsData[activeSheet] || [];

  const spreadsheetData = useMemo(() => {
    if (!currentSheetRows.length) return [];
    if (!searchQuery.trim()) return rowsToMatrix(currentSheetRows);
    const query = searchQuery.toLowerCase();
    return rowsToMatrix(
      currentSheetRows.filter((row) =>
        (row || []).some((cell) => String(cell ?? "").toLowerCase().includes(query))
      )
    );
  }, [currentSheetRows, searchQuery]);

  const columnCount = useMemo(() => {
    if (!currentSheetRows.length) return 0;
    return Math.max(...currentSheetRows.map((row) => (Array.isArray(row) ? row.length : 0)), 0);
  }, [currentSheetRows]);

  return (
    <div className={`flex flex-col gap-3 ${embedded ? "h-full min-h-[680px]" : ""}`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-1">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-emerald-100 text-emerald-700 rounded-2xl shadow-xs">
            <FileSpreadsheet className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-[#2B3674]">{workbook?.fileName || fileName}</h3>
              <Tag color="emerald" className="font-semibold text-xs rounded-md uppercase">
                Excel Viewer
              </Tag>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              {currentSheetRows.length} row{currentSheetRows.length === 1 ? "" : "s"} • {columnCount}{" "}
              column{columnCount === 1 ? "" : "s"}
            </p>
          </div>
        </div>
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

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gray-50/80 p-2.5 rounded-2xl border border-gray-200/70">
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

      <div className="border border-gray-200 rounded-2xl overflow-hidden bg-white shadow-2xs flex-1">
        {loading ? (
          <div className="py-24 flex flex-col items-center justify-center gap-3 text-gray-400">
            <Spin size="large" />
            <span className="text-xs font-medium">Parsing spreadsheet data...</span>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-500 text-sm font-medium px-4">{error}</div>
        ) : spreadsheetData.length === 0 ? (
          <div className="py-16">
            <Empty
              description={
                searchQuery ? `No rows match search "${searchQuery}"` : "This sheet has no data"
              }
            />
          </div>
        ) : (
          <div className={`overflow-auto p-2 excel-spreadsheet-host ${embedded ? "max-h-[72vh]" : "max-h-[520px]"}`}>
            <Spreadsheet
              data={spreadsheetData}
              onChange={(next) => {
                if (searchQuery.trim() || !activeSheet) return;
                const nextSheets = { ...sheetsData, [activeSheet]: matrixToRows(next) };
                setSheetsData(nextSheets);
                onWorkbookChange?.({
                  fileName: workbook?.fileName || fileName,
                  sheetNames,
                  sheetsData: nextSheets,
                });
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default ExcelSpreadsheetView;
