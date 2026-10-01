import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Loader2 } from "lucide-react";
import { Tooltip } from "./Tooltip";
import { useDebounce } from "../../hooks/useDebounce";

export interface SearchDropdownOption<T = string> {
  value: T;
  label: string;
  subLabel?: string;
  dotColor?: string;
  badgeText?: string;
  badgeClass?: string;
  tooltipText?: string;
  icon?: React.ReactNode;
}

export interface SearchDropdownProps<T = string> {
  options: SearchDropdownOption<T>[];
  value: T;
  onChange: (value: T) => void;
  defaultValue?: T;
  placeholder?: string;
  searchPlaceholder?: string;
  prefixIcon?: React.ReactNode;
  allowClear?: boolean;
  onClear?: () => void;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  maxLabelWidth?: string; // e.g. "max-w-[85px]"
  disabled?: boolean;
  error?: string;
  loading?: boolean;
  searchValue?: string;
  onSearchChange?: (query: string) => void;
  debounceDelay?: number;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  serverSearch?: boolean;
  emptyMessage?: string;
}

export function SearchDropdown<T extends string = string>({
  options,
  value,
  onChange,
  defaultValue,
  placeholder = "Select...",
  searchPlaceholder = "Search options...",
  prefixIcon,
  allowClear = false,
  onClear,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  maxLabelWidth = "max-w-[85px]",
  disabled = false,
  error,
  loading = false,
  searchValue,
  onSearchChange,
  debounceDelay,
  onScroll,
  serverSearch = false,
  emptyMessage = "No matching options",
}: SearchDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const isControlledSearch = searchValue !== undefined;
  const currentSearch = isControlledSearch ? searchValue : searchQuery;

  // Use the shared custom hook instead of inline debouncing
  const [debouncedSearch, flushDebouncedSearch] = useDebounce(
    currentSearch,
    debounceDelay ?? (serverSearch ? 400 : 150),
  );

  // Close on outside click and reset search query
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
        if (!isControlledSearch) {
          setSearchQuery("");
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isControlledSearch]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else if (!isControlledSearch) {
      setSearchQuery("");
    }
  }, [isOpen, isControlledSearch]);

  // Notify onSearchChange when debounced value updates
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(debouncedSearch);
    }
  }, [debouncedSearch, onSearchChange]);

  const selectedOption = options.find((opt) => opt.value === value);
  const currentLabel = selectedOption?.label || placeholder;
  const isSelected = Boolean(value && (defaultValue !== undefined ? value !== defaultValue : true));

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onClear) {
      onClear();
    } else if (defaultValue !== undefined) {
      onChange(defaultValue);
    } else {
      onChange("" as T);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    if (!isControlledSearch) {
      setSearchQuery(nextVal);
    }
  };

  // Filter options based on debounced search query (unless serverSearch is active)
  const filteredOptions = useMemo(() => {
    if (serverSearch) return options;
    if (!debouncedSearch.trim()) return options;
    const q = debouncedSearch.toLowerCase().trim();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, debouncedSearch, serverSearch]);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <Tooltip
        title={isSelected && maxLabelWidth !== "max-w-none" ? currentLabel : undefined}
        placement="top"
        mouseEnterDelay={0.3}
      >
        <div
          onClick={() => !disabled && setIsOpen(!isOpen)}
          className={`flex items-center gap-1.5 px-3 py-1.5 bg-[#F4F7FE] hover:bg-gray-100 rounded-xl text-xs font-bold text-[#2B3674] transition-all border ${
            error ? "border-red-500 ring-2 ring-red-100" : "border-transparent"
          } cursor-pointer select-none ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${buttonClassName}`}
        >
          {prefixIcon && <span className="text-[#4318FF] shrink-0">{prefixIcon}</span>}
          <span className={`${maxLabelWidth} truncate`}>{currentLabel}</span>
          {selectedOption?.badgeText && (
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] border shrink-0 tracking-wide uppercase ${
                selectedOption.badgeClass ||
                "bg-gray-100 text-gray-600 border-gray-200"
              }`}
            >
              {selectedOption.badgeText}
            </span>
          )}
          {allowClear && isSelected && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              className="p-0.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer ml-auto shrink-0"
              title="Clear selection"
            >
              <X size={14} />
            </span>
          ) : (
            <ChevronDown
              size={14}
              className={`text-gray-400 shrink-0 ml-auto transition-transform cursor-pointer ${
                isOpen ? "rotate-180" : ""
              }`}
            />
          )}
        </div>
      </Tooltip>

      {error && <p className="text-red-500 text-xs mt-1 ml-2 font-medium">{error}</p>}

      {isOpen && (
        <div
          className={`absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150 ${menuClassName}`}
        >
          {/* Internal Search Input */}
          <div className="flex items-center bg-[#F4F7FE] rounded-xl px-2.5 py-2 mb-2 border border-transparent focus-within:border-[#4318FF]/30 transition-all">
            <Search size={14} className="text-gray-400 mr-2 shrink-0" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={currentSearch}
              onChange={handleSearchInputChange}
              className="bg-transparent border-none outline-none text-xs font-semibold text-[#2B3674] w-full placeholder:text-gray-400"
            />
            {currentSearch && (
              <button
                type="button"
                onClick={() => {
                  if (!isControlledSearch) {
                    setSearchQuery("");
                  }
                  flushDebouncedSearch("");
                  onSearchChange?.("");
                }}
                className="text-gray-400 hover:text-gray-600 cursor-pointer p-0.5"
                title="Clear search"
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Options List */}
          <div
            onScroll={onScroll}
            className="max-h-56 overflow-y-auto overflow-x-hidden custom-scrollbar flex flex-col gap-0.5"
          >
            {loading && filteredOptions.length === 0 ? (
              <div className="py-6 flex items-center justify-center text-[#4318FF]">
                <Loader2 size={20} className="animate-spin" />
              </div>
            ) : filteredOptions.length === 0 ? (
              <div className="py-5 text-center text-xs font-medium text-gray-400">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const isItemActive = option.value === value;
                return (
                  <button
                    key={String(option.value)}
                    type="button"
                    title={option.label}
                    onClick={() => {
                      onChange(option.value);
                      setIsOpen(false);
                      if (!isControlledSearch) {
                        setSearchQuery("");
                      }
                    }}
                    className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                      isItemActive
                        ? "bg-[#4318FF] text-white shadow-xs"
                        : "text-[#2B3674] hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      {option.icon ? (
                        <span className={isItemActive ? "text-white" : "text-[#4318FF]"}>
                          {option.icon}
                        </span>
                      ) : option.dotColor ? (
                        <span
                          style={{
                            backgroundColor: isItemActive ? "#FFFFFF" : option.dotColor,
                          }}
                          className="w-2 h-2 rounded-full shrink-0"
                        />
                      ) : null}
                      <div className="flex flex-col min-w-0">
                        <span className="truncate">{option.label}</span>
                        {option.subLabel && (
                          <span
                            className={`text-[10px] truncate ${
                              isItemActive ? "text-white/80" : "text-gray-400"
                            }`}
                          >
                            {option.subLabel}
                          </span>
                        )}
                      </div>
                    </div>
                    {option.badgeText && (
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-[6px] border shrink-0 tracking-wide uppercase ml-1.5 ${
                          isItemActive
                            ? "bg-white/20 text-white border-white/20"
                            : option.badgeClass ||
                              "bg-gray-100 text-gray-600 border-gray-200"
                        }`}
                      >
                        {option.badgeText}
                      </span>
                    )}
                  </button>
                );
              })
            )}
            {loading && filteredOptions.length > 0 && (
              <div className="py-2 flex justify-center items-center text-[#4318FF]">
                <Loader2 size={16} className="animate-spin" />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default SearchDropdown;
