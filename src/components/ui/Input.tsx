import React, { forwardRef } from "react";
import { X } from "lucide-react";

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  prefixIcon?: React.ReactNode;
  suffixIcon?: React.ReactNode;
  allowClear?: boolean;
  onClear?: () => void;
  variant?: "filled" | "outlined";
  inputSize?: "sm" | "md" | "lg";
  containerClassName?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      value,
      onChange,
      prefixIcon,
      suffixIcon,
      allowClear = false,
      onClear,
      variant = "filled",
      inputSize = "md",
      containerClassName = "",
      className = "",
      disabled = false,
      error,
      ...props
    },
    ref,
  ) => {
    const sizeClasses = {
      sm: "px-2.5 py-1 text-xs",
      md: "px-3 py-1.5 text-xs",
      lg: "px-3.5 py-2 text-sm",
    };

    const variantClasses = {
      filled:
        "bg-[#F4F7FE] border border-transparent focus-within:border-[#4318FF]/40 focus-within:bg-white",
      outlined:
        "bg-white border border-gray-200 focus-within:border-[#4318FF] focus-within:ring-2 focus-within:ring-[#4318FF]/10",
    };

    const hasValue = value !== undefined && value !== null && value !== "";

    const handleClear = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (onClear) {
        onClear();
      } else if (onChange) {
        const syntheticEvent = {
          target: { value: "" },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    };

    return (
      <div className="flex flex-col">
        <div
          className={`flex items-center rounded-xl transition-all duration-150 ${
            variantClasses[variant]
          } ${sizeClasses[inputSize]} ${
            disabled ? "opacity-50 cursor-not-allowed" : ""
          } ${
            error ? "border-red-400 focus-within:border-red-500" : ""
          } ${containerClassName}`}
        >
          {prefixIcon && (
            <span className="mr-2 text-gray-400 shrink-0 flex items-center justify-center">
              {prefixIcon}
            </span>
          )}
          <input
            ref={ref}
            value={value}
            onChange={onChange}
            disabled={disabled}
            className={`w-full bg-transparent border-none outline-none font-semibold text-[#2B3674] placeholder:text-gray-400 disabled:cursor-not-allowed ${className}`}
            {...props}
          />
          {allowClear && hasValue && !disabled && (
            <button
              type="button"
              onClick={handleClear}
              className="ml-1 p-0.5 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200/60 transition-colors cursor-pointer shrink-0"
              title="Clear input"
            >
              <X size={12} />
            </button>
          )}
          {suffixIcon && (
            <span className="ml-2 text-gray-400 shrink-0 flex items-center justify-center">
              {suffixIcon}
            </span>
          )}
        </div>
        {error && <span className="text-[11px] text-red-500 mt-1">{error}</span>}
      </div>
    );
  },
);

Input.displayName = "Input";
export default Input;
