import React from "react";

export interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: React.ReactNode;
  iconBgColor?: string; // defaults to bg-[#4318FF]/10
  iconTextColor?: string; // defaults to text-[#4318FF]
  badge?: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  iconBgColor = "bg-[#4318FF]/10",
  iconTextColor = "text-[#4318FF]",
  badge,
  className = "",
  onClick,
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center justify-between gap-4 transition-all duration-150 ${
        onClick ? "hover:shadow-md hover:border-[#4318FF]/20 cursor-pointer active:scale-98" : ""
      } ${className}`}
    >
      <div className="flex items-center gap-4">
        {icon && (
          <div
            className={`w-12 h-12 rounded-2xl ${iconBgColor} ${iconTextColor} flex items-center justify-center shrink-0 shadow-2xs`}
          >
            {icon}
          </div>
        )}
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            {title}
          </p>
          <h3 className="text-xl md:text-2xl font-black text-[#2B3674] tracking-tight mt-0.5">
            {value}
          </h3>
          {subtitle && (
            <p className="text-xs text-gray-500 font-medium mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {badge && <div className="shrink-0">{badge}</div>}
    </div>
  );
};

export default StatCard;
