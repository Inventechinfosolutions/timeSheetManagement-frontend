import React, { useState, useRef, useEffect } from "react";

export interface TooltipProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  color?: string; // custom background hex/color, defaults to brand blue #4318FF
  mouseEnterDelay?: number; // delay in seconds before showing
  className?: string;
  disabled?: boolean;
}

export const Tooltip: React.FC<TooltipProps> = ({
  title,
  children,
  placement = "top",
  color = "#4318FF",
  mouseEnterDelay = 0.2,
  className = "",
  disabled = false,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (disabled || !title) return;
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true);
    }, mouseEnterDelay * 1000);
  };

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  if (!title || disabled) {
    return <>{children}</>;
  }

  // Positioning classes
  const placementClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  // Arrow classes
  const arrowClasses = {
    top: "top-full left-1/2 -translate-x-1/2 border-t-current border-r-transparent border-b-transparent border-l-transparent border-4",
    bottom: "bottom-full left-1/2 -translate-x-1/2 border-b-current border-r-transparent border-t-transparent border-l-transparent border-4",
    left: "left-full top-1/2 -translate-y-1/2 border-l-current border-t-transparent border-b-transparent border-r-transparent border-4",
    right: "right-full top-1/2 -translate-y-1/2 border-r-current border-t-transparent border-b-transparent border-l-transparent border-4",
  };

  return (
    <div
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible && (
        <div
          role="tooltip"
          style={{ backgroundColor: color, color: "#FFFFFF" }}
          className={`absolute z-50 px-2.5 py-1 text-xs font-semibold rounded-lg shadow-xl pointer-events-none whitespace-nowrap transition-all duration-150 animate-in fade-in zoom-in-95 ${placementClasses[placement]}`}
        >
          {title}
          <span
            style={{ color: color }}
            className={`absolute w-0 h-0 pointer-events-none ${arrowClasses[placement]}`}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;
