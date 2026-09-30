import React from "react";

export type BadgeVariant =
  | "full_day"
  | "wfh"
  | "client_visit"
  | "half_day"
  | "weekend"
  | "holiday"
  | "leave"
  | "not_updated"
  | "inactive"
  | "upcoming"
  | "count"
  | "default";

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  showDot?: boolean;
  className?: string;
  dotClassName?: string;
  title?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "default",
  showDot = false,
  className = "",
  dotClassName = "",
  title,
}) => {
  const variantStyles: Record<
    BadgeVariant,
    { badge: string; dot: string }
  > = {
    full_day: {
      badge: "bg-[#DCFCE7] text-[#15803D] border border-[#86EFAC]",
      dot: "bg-[#16A34A]",
    },
    wfh: {
      badge: "bg-[#E0F2FE] text-[#0369A1] border border-[#7DD3FC]",
      dot: "bg-[#0284C7]",
    },
    client_visit: {
      badge: "bg-[#FFF1E6] text-[#B45309] border border-[#FED7AA]",
      dot: "bg-[#F59E0B]",
    },
    half_day: {
      badge: "bg-[#FEF08A] text-[#854D0E] border border-[#FACC15]",
      dot: "bg-[#EAB308]",
    },
    weekend: {
      badge: "bg-[#FFF0F0] text-[#DC2626] border border-[#FCA5A5]",
      dot: "bg-[#DC2626]",
    },
    holiday: {
      badge: "bg-[#DBEAFE] text-[#1D4ED8] border border-[#93C5FD]",
      dot: "bg-[#2563EB]",
    },
    leave: {
      badge: "bg-[#FFE4E6] text-[#E11D48] border border-[#FDA4AF]",
      dot: "bg-[#E11D48]",
    },
    not_updated: {
      badge: "bg-[#FFEDD5] text-[#C2410C] border border-[#FB923C]",
      dot: "bg-[#EA580C]",
    },
    inactive: {
      badge: "bg-gray-100 text-gray-500 border border-gray-200",
      dot: "bg-gray-400",
    },
    upcoming: {
      badge: "bg-gray-50 text-gray-400 border border-gray-200 italic font-normal",
      dot: "bg-gray-300",
    },
    count: {
      badge: "bg-blue-50 text-[#4318FF] border border-blue-100",
      dot: "bg-[#4318FF]",
    },
    default: {
      badge: "bg-[#F4F7FE] text-[#2B3674] border border-gray-200",
      dot: "bg-[#4318FF]",
    },
  };

  const current = variantStyles[variant] || variantStyles.default;

  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold select-none ${current.badge} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 ${current.dot} ${dotClassName}`}
        />
      )}
      {children}
    </span>
  );
};

export default Badge;
