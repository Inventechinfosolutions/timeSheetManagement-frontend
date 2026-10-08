import React, { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { Input, InputProps } from "./Input";
import { useDebounce } from "../../hooks/useDebounce";

export interface SearchBoxProps extends Omit<InputProps, "prefixIcon"> {
  placeholder?: string;
  /** Fires after debounce (default 400ms). Use for API / filter side-effects. */
  onDebounce?: (debouncedValue: string) => void;
  debounceDelay?: number;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = "Search by name or ID...",
  allowClear = true,
  variant = "filled",
  containerClassName = "w-full max-w-md",
  value,
  defaultValue = "",
  onChange,
  onClear,
  onDebounce,
  debounceDelay = 400,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(
    value !== undefined ? String(value) : String(defaultValue || ""),
  );

  // Sync when parent clears / resets the controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(String(value));
    }
  }, [value]);

  const [debouncedValue, flush] = useDebounce(internalValue, debounceDelay);

  // Keep callback stable so debounce effect does not re-fire on every parent render
  const onDebounceRef = useRef(onDebounce);
  onDebounceRef.current = onDebounce;

  useEffect(() => {
    onDebounceRef.current?.(debouncedValue);
  }, [debouncedValue]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    onChange?.(e);
  };

  const handleClear = () => {
    setInternalValue("");
    flush("");
    onClear?.();
    onDebounceRef.current?.("");
  };

  return (
    <Input
      prefixIcon={<Search size={14} />}
      placeholder={placeholder}
      allowClear={allowClear}
      variant={variant}
      containerClassName={containerClassName}
      // Always show typed text immediately; parent may only update on debounce
      value={internalValue}
      onChange={handleChange}
      onClear={handleClear}
      {...props}
    />
  );
};

export default SearchBox;
