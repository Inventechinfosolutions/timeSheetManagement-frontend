import React from "react";

export interface TabItem<T = string> {
  key: T;
  label: string;
  icon?: React.ReactNode;
  count?: number;
}

export interface TabsProps<T = string> {
  tabs: TabItem<T>[];
  activeKey: T;
  onChange: (key: T) => void;
  variant?: "pill" | "underline";
  className?: string;
}

export function Tabs<T extends string = string>({
  tabs,
  activeKey,
  onChange,
  variant = "pill",
  className = "",
}: TabsProps<T>) {
  if (variant === "underline") {
    return (
      <div className={`flex items-center gap-6 border-b border-gray-200 ${className}`}>
        {tabs.map((tab) => {
          const isActive = tab.key === activeKey;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChange(tab.key)}
              className={`flex items-center gap-2 pb-3 text-xs md:text-sm font-bold border-b-2 transition-all cursor-pointer select-none ${
                isActive
                  ? "border-[#4318FF] text-[#4318FF]"
                  : "border-transparent text-gray-500 hover:text-[#2B3674]"
              }`}
            >
              {tab.icon && <span>{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    isActive
                      ? "bg-blue-50 text-[#4318FF]"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {tab.count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    );
  }

  // Pill variant
  return (
    <div
      className={`inline-flex items-center gap-1 bg-[#F4F7FE] p-1.5 rounded-2xl border border-gray-200/80 ${className}`}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onChange(tab.key)}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
              isActive
                ? "bg-white text-[#4318FF] shadow-xs"
                : "text-gray-500 hover:text-[#2B3674] hover:bg-gray-100/50"
            }`}
          >
            {tab.icon && <span>{tab.icon}</span>}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] font-semibold ${
                  isActive
                    ? "bg-blue-50 text-[#4318FF]"
                    : "bg-gray-200 text-gray-600"
                }`}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default Tabs;
