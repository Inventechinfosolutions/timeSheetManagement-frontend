import React from "react";

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  status?: "online" | "offline" | "busy" | "away";
  className?: string;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = "User",
  size = "md",
  status,
  className = "",
}) => {
  const sizeMap = {
    xs: {
      container: "w-6 h-6 text-[10px]",
      status: "w-1.5 h-1.5",
    },
    sm: {
      container: "w-8 h-8 text-xs",
      status: "w-2 h-2",
    },
    md: {
      container: "w-10 h-10 text-sm",
      status: "w-2.5 h-2.5",
    },
    lg: {
      container: "w-12 h-12 text-base",
      status: "w-3 h-3",
    },
    xl: {
      container: "w-16 h-16 text-lg",
      status: "w-3.5 h-3.5",
    },
  };

  const statusColors = {
    online: "bg-[#01B574]",
    offline: "bg-gray-400",
    busy: "bg-[#DC2626]",
    away: "bg-[#D97706]",
  };

  const getInitials = (str: string) => {
    if (!str) return "U";
    const parts = str.trim().split(" ");
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`relative inline-flex shrink-0 select-none ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${currentSize.container} rounded-full object-cover border-2 border-white shadow-xs`}
        />
      ) : (
        <div
          className={`${currentSize.container} rounded-full bg-[#4318FF]/10 text-[#4318FF] font-bold flex items-center justify-center border-2 border-white shadow-xs`}
        >
          {getInitials(name)}
        </div>
      )}
      {status && (
        <span
          className={`absolute bottom-0 right-0 ${currentSize.status} ${statusColors[status]} rounded-full border-2 border-white shadow-2xs`}
        />
      )}
    </div>
  );
};

export default Avatar;
