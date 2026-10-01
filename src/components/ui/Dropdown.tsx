import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, X } from "lucide-react";
import { Tooltip } from "./Tooltip";

export interface DropdownOption<T = string> {
  value: T;
  label: string;
  dotColor?: string;
  badgeText?: string;
  badgeClass?: string;
  tooltipText?: string;
}

export interface DropdownProps<T = string> {
  options: DropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  defaultValue?: T;
  placeholder?: string;
  prefixIcon?: React.ReactNode;
  allowClear?: boolean;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  maxLabelWidth?: string; // e.g. "max-w-[85px]"
  disabled?: boolean;
}

export function Dropdown<T extends string = string>({
  options,
  value,
  onChange,
  defaultValue,
  placeholder = "Select...",
  prefixIcon,
  allowClear = false,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  maxLabelWidth = "max-w-[85px]",
  disabled = false,
}: DropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);
  const currentLabel = selectedOption?.label || placeholder;
  const isFiltered = defaultValue !== undefined ? value !== defaultValue : Boolean(value);

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (defaultValue !== undefined) {
      onChange(defaultValue);
    } else {
      onChange("" as T);
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Tooltip
        title={isFiltered ? currentLabel : undefined}
        placement="top"
        mouseEnterDelay={0.3}
      >
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FE] hover:bg-gray-100 rounded-xl text-xs font-bold text-[#2B3674] transition-all border border-transparent cursor-pointer select-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${buttonClassName}`}
        >
          {prefixIcon && <span className="text-[#4318FF] shrink-0">{prefixIcon}</span>}
          <span className={`${maxLabelWidth} truncate`}>{currentLabel}</span>
          {allowClear && isFiltered && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-200/70 transition-colors cursor-pointer ml-0.5 shrink-0"
              title="Clear filter"
            >
              <X size={12} />
            </span>
          ) : (
            <ChevronDown
              size={12}
              className={`text-gray-400 shrink-0 transition-transform cursor-pointer ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </Tooltip>

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-2 ${
            menuClassName || "min-w-[260px] max-w-[340px] w-max"
          } bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 max-h-64 overflow-y-auto overflow-x-hidden custom-scrollbar`}
        >
          {options.map((option) => {
            const isSelected = option.value === value;
            return (
              <button
                key={String(option.value)}
                type="button"
                title={option.label}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-[#4318FF] text-white shadow-xs"
                    : "text-[#2B3674] hover:bg-gray-50"
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  {option.dotColor && (
                    <span
                      style={{
                        backgroundColor: isSelected ? "#FFFFFF" : option.dotColor,
                      }}
                      className="w-2 h-2 rounded-full shrink-0"
                    />
                  )}
                  <span className="truncate">{option.label}</span>
                </div>
                {option.badgeText && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold shrink-0 ml-1.5 ${
                      isSelected
                        ? "bg-white/20 text-white border border-white/20"
                        : option.badgeClass ||
                          "bg-gray-100 text-gray-600 border border-gray-200"
                    }`}
                  >
                    {option.badgeText}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
