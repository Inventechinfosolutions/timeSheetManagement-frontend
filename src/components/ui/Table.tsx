import React from "react";
import { FileSpreadsheet } from "lucide-react";
import { WorksphereLogoLoader } from "../ApiLoadingSpinner";

export interface TableColumn<T = any> {
  key: string;
  title: React.ReactNode;
  dataIndex?: keyof T;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string | number;
  minWidth?: string | number;
  sticky?: "left" | "right";
  stickyOffset?: string | number;
  className?: string;
  headerClassName?: string;
}

export interface TableProps<T = any> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: keyof T | ((record: T, index: number) => string | number);
  loading?: boolean;
  emptyText?: React.ReactNode;
  onRowClick?: (record: T, index: number) => void;
  headerTheme?: "brand" | "neutral" | "light";
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  containerClassName?: string;
}

export function Table<T extends Record<string, any> = any>({
  columns,
  data,
  rowKey,
  loading = false,
  emptyText = "No records found",
  onRowClick,
  headerTheme = "brand",
  striped = true,
  hoverable = true,
  className = "",
  containerClassName = "",
}: TableProps<T>) {
  const getRowKey = (record: T, index: number): string | number => {
    if (typeof rowKey === "function") return rowKey(record, index);
    if (rowKey && record[rowKey] !== undefined) return String(record[rowKey]);
    return record.id || record.key || record.employeeId || index;
  };

  const headerThemeClasses = {
    brand: "bg-[#2B3674] text-white",
    neutral: "bg-gray-100 text-[#2B3674]",
    light: "bg-[#F4F7FE] text-[#2B3674]",
  };

  const alignClasses = {
    left: "text-left",
    center: "text-center",
    right: "text-right",
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xs ${containerClassName}`}
    >
      <div className="overflow-x-auto custom-scrollbar">
        <table className={`w-full text-xs text-left border-collapse select-none ${className}`}>
          {/* Table Header */}
          <thead>
            <tr className={`${headerThemeClasses[headerTheme]} font-black text-[11px] uppercase tracking-wider`}>
              {columns.map((col) => {
                const alignClass = alignClasses[col.align || "left"];
                const isStickyLeft = col.sticky === "left";
                const isStickyRight = col.sticky === "right";

                const stickyStyles: React.CSSProperties = {};
                if (isStickyLeft) {
                  stickyStyles.left = col.stickyOffset ?? 0;
                  stickyStyles.position = "sticky";
                  stickyStyles.zIndex = 20;
                } else if (isStickyRight) {
                  stickyStyles.right = col.stickyOffset ?? 0;
                  stickyStyles.position = "sticky";
                  stickyStyles.zIndex = 20;
                }

                return (
                  <th
                    key={col.key}
                    style={{
                      width: col.width,
                      minWidth: col.minWidth,
                      ...stickyStyles,
                    }}
                    className={`py-3.5 px-3 border-r border-white/10 ${alignClass} ${
                      isStickyLeft || isStickyRight ? headerThemeClasses[headerTheme] : ""
                    } ${col.headerClassName || ""}`}
                  >
                    {col.title}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-gray-100 bg-white">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center">
                  <div className="flex flex-col items-center justify-center">
                    <WorksphereLogoLoader />
                  </div>
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center text-gray-400">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileSpreadsheet size={36} className="text-gray-300" />
                    <span className="text-xs font-bold text-[#2B3674]">{emptyText}</span>
                  </div>
                </td>
              </tr>
            ) : (
              data.map((record, rowIndex) => {
                const key = getRowKey(record, rowIndex);
                const isEven = rowIndex % 2 === 0;
                const rowBg = striped && !isEven ? "bg-[#F8FAFC]" : "bg-white";

                return (
                  <tr
                    key={key}
                    onClick={() => onRowClick && onRowClick(record, rowIndex)}
                    className={`transition-colors ${rowBg} ${
                      hoverable ? "hover:bg-blue-50/40" : ""
                    } ${onRowClick ? "cursor-pointer" : ""}`}
                  >
                    {columns.map((col) => {
                      const alignClass = alignClasses[col.align || "left"];
                      const isStickyLeft = col.sticky === "left";
                      const isStickyRight = col.sticky === "right";

                      const stickyStyles: React.CSSProperties = {};
                      if (isStickyLeft) {
                        stickyStyles.left = col.stickyOffset ?? 0;
                        stickyStyles.position = "sticky";
                        stickyStyles.zIndex = 10;
                      } else if (isStickyRight) {
                        stickyStyles.right = col.stickyOffset ?? 0;
                        stickyStyles.position = "sticky";
                        stickyStyles.zIndex = 10;
                      }

                      const val = col.dataIndex ? record[col.dataIndex] : undefined;
                      const renderedCell = col.render
                        ? col.render(val, record, rowIndex)
                        : val !== undefined && val !== null
                        ? String(val)
                        : "—";

                      return (
                        <td
                          key={col.key}
                          style={{
                            width: col.width,
                            minWidth: col.minWidth,
                            ...stickyStyles,
                          }}
                          className={`py-3 px-3 border-r border-gray-100 ${alignClass} ${
                            isStickyLeft || isStickyRight ? rowBg : ""
                          } ${col.className || ""}`}
                        >
                          {renderedCell}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
