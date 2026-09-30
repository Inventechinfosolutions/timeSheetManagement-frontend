import React from "react";
import { Loader2 } from "lucide-react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "success"
  | "danger"
  | "outline"
  | "ghost";

export type ButtonSize = "sm" | "md" | "lg";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  children?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled = false,
  ...props
}) => {
  const baseClasses =
    "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-150 active:scale-95 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 select-none";

  const sizeClasses: Record<ButtonSize, string> = {
    sm: "px-3 py-1.5 text-xs gap-1.5 shadow-2xs",
    md: "px-4 py-2 text-xs md:text-sm gap-2 shadow-xs",
    lg: "px-5 py-2.5 text-sm gap-2.5 shadow-sm",
  };

  const variantClasses: Record<ButtonVariant, string> = {
    primary:
      "bg-[#4318FF] hover:bg-[#3311CC] text-white shadow-[#4318FF]/20",
    secondary:
      "bg-[#F4F7FE] hover:bg-gray-100 text-[#4318FF] border border-gray-200/80",
    success:
      "bg-[#01B574] hover:bg-[#009e65] text-white shadow-[#01B574]/20",
    danger:
      "bg-[#DC2626] hover:bg-[#B91C1C] text-white shadow-red-500/20",
    outline:
      "bg-white hover:bg-gray-50 text-[#2B3674] border border-gray-200 hover:border-gray-300",
    ghost:
      "bg-transparent hover:bg-gray-100 text-[#2B3674]",
  };

  const isDisabled = disabled || loading;

  return (
    <button
      disabled={isDisabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 size={15} className="animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      {children && <span>{children}</span>}
      {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};

export default Button;
