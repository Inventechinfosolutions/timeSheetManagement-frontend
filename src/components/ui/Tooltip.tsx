import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

export interface TooltipProps {
  title?: React.ReactNode;
  children: React.ReactNode;
  placement?: "top" | "bottom" | "left" | "right";
  color?: string;
  mouseEnterDelay?: number;
  className?: string;
  disabled?: boolean;
}

interface TipPosition {
  top: number;
  left: number;
  arrowOffset: number;
}

const GAP = 8;
const VIEWPORT_MARGIN = 8;

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
  const [position, setPosition] = useState<TipPosition | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const triggerRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);

  const place = useCallback(() => {
    const trigger = triggerRef.current?.getBoundingClientRect();
    const tip = tipRef.current?.getBoundingClientRect();
    if (!trigger || !tip) return;

    let top = trigger.bottom + GAP;
    let left = trigger.left + trigger.width / 2 - tip.width / 2;
    if (placement === "top") {
      top = trigger.top - tip.height - GAP;
    } else if (placement === "left") {
      top = trigger.top + trigger.height / 2 - tip.height / 2;
      left = trigger.left - tip.width - GAP;
    } else if (placement === "right") {
      top = trigger.top + trigger.height / 2 - tip.height / 2;
      left = trigger.right + GAP;
    }

    const maxLeft = Math.max(VIEWPORT_MARGIN, window.innerWidth - tip.width - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, window.innerHeight - tip.height - VIEWPORT_MARGIN);
    const clampedLeft = Math.min(Math.max(left, VIEWPORT_MARGIN), maxLeft);
    const clampedTop = Math.min(Math.max(top, VIEWPORT_MARGIN), maxTop);
    const anchor =
      placement === "left" || placement === "right"
        ? trigger.top + trigger.height / 2 - clampedTop
        : trigger.left + trigger.width / 2 - clampedLeft;
    const limit = (placement === "left" || placement === "right" ? tip.height : tip.width) - 12;

    setPosition({
      top: clampedTop,
      left: clampedLeft,
      arrowOffset: Math.min(Math.max(anchor, 12), Math.max(12, limit)),
    });
  }, [placement]);

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
    setPosition(null);
  };

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  useLayoutEffect(() => {
    if (!isVisible) return;
    place();
  }, [isVisible, place, title]);

  useEffect(() => {
    if (!isVisible) return;
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [isVisible, place]);

  if (!title || disabled) {
    return <>{children}</>;
  }

  const arrowClasses = {
    top: "top-full -translate-x-1/2 border-t-current border-r-transparent border-b-transparent border-l-transparent border-4",
    bottom: "bottom-full -translate-x-1/2 border-b-current border-r-transparent border-t-transparent border-l-transparent border-4",
    left: "left-full -translate-y-1/2 border-l-current border-t-transparent border-b-transparent border-r-transparent border-4",
    right: "right-full -translate-y-1/2 border-r-current border-t-transparent border-b-transparent border-l-transparent border-4",
  };
  const arrowStyle =
    placement === "left" || placement === "right"
      ? { top: position?.arrowOffset ?? 0 }
      : { left: position?.arrowOffset ?? 0 };

  return (
    <div
      ref={triggerRef}
      className={`relative inline-flex items-center ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}
      {isVisible &&
        createPortal(
          <div
            ref={tipRef}
            role="tooltip"
            style={{
              backgroundColor: color,
              color: "#FFFFFF",
              position: "fixed",
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              zIndex: 10060,
              width: "max-content",
              maxWidth: "calc(100vw - 16px)",
              visibility: position ? "visible" : "hidden",
            }}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg shadow-xl pointer-events-none whitespace-normal text-left leading-snug"
          >
            {title}
            <span
              style={{ color, ...arrowStyle }}
              className={`absolute w-0 h-0 pointer-events-none ${arrowClasses[placement]}`}
            />
          </div>,
          document.body,
        )}
    </div>
  );
};

export default Tooltip;
