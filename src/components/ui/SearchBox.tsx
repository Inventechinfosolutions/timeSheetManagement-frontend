import React, { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input, InputProps } from "./Input";
import { useDebounce } from "../../hooks/useDebounce";

export interface SearchBoxProps extends Omit<InputProps, "prefixIcon"> {
  placeholder?: string;
  onDebounce?: (debouncedValue: string) => void;
  debounceDelay?: number;
}

export const SearchBox: React.FC<SearchBoxProps> = ({
  placeholder = "Search name or ID...",
  allowClear = true,
  variant = "filled",
  containerClassName = "w-36",
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

  // Sync internal value when parent changes the controlled value
  useEffect(() => {
    if (value !== undefined) {
      setInternalValue(String(value));
    }
  }, [value]);

  const [debouncedValue, flush] = useDebounce(
    internalValue,
    debounceDelay,
  );

  // Notify parent after debounce
  useEffect(() => {
    onDebounce?.(debouncedValue);
  }, [debouncedValue, onDebounce]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;

    setInternalValue(newValue);
    onChange?.(e);
  };

  const handleClear = () => {
    setInternalValue("");
    flush("");
    onClear?.();
    onDebounce?.("");
  };

  return (
    <Input
      prefixIcon={<Search size={14} />}
      placeholder={placeholder}
      allowClear={allowClear}
      variant={variant}
      containerClassName={containerClassName}
      value={value !== undefined ? value : internalValue}
      onChange={handleChange}
      onClear={handleClear}
      {...props}
    />
  );
};

export default SearchBox;