import { createPortal } from "react-dom";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

interface ApiLoadingSpinnerProps {
  /** When true, spinner is positioned to cover only content area (exclude header/footer/sidebar). */
  contained?: boolean;
  /** Ref to the main content element. When provided with contained, loader is portaled and positioned over this area (above modals). */
  contentAreaRef?: React.RefObject<HTMLElement | null>;
}

/** z-index above Ant Design Modal (1000) so loader appears above modals */
const GLOBAL_LOADER_Z_INDEX = 99999;
const CONTENT_LOADER_Z_INDEX = 10001;

function getContentAreaBounds(el: HTMLElement | null): DOMRect | null {
  if (!el) return null;
  return el.getBoundingClientRect();
}

/**
 * 12-Blade Radial Notch Spinner (Application Blue by default)
 * Seamless smooth rotation with decaying opacity trail.
 */
export function RadialSpinner({
  size = "md",
  color = "#2563EB",
  className = "",
}: {
  size?: "sm" | "md" | "lg" | number;
  color?: string;
  className?: string;
}) {
  const pixelSize =
    typeof size === "number"
      ? size
      : size === "sm"
      ? 24
      : size === "lg"
      ? 44
      : 32;

  // 12 blades spaced every 30 deg with decaying opacity
  const blades = [
    { deg: 0, opacity: 1.0 },
    { deg: 30, opacity: 0.88 },
    { deg: 60, opacity: 0.76 },
    { deg: 90, opacity: 0.65 },
    { deg: 120, opacity: 0.54 },
    { deg: 150, opacity: 0.44 },
    { deg: 180, opacity: 0.35 },
    { deg: 210, opacity: 0.26 },
    { deg: 240, opacity: 0.18 },
    { deg: 270, opacity: 0.12 },
    { deg: 300, opacity: 0.07 },
    { deg: 330, opacity: 0.03 },
  ];

  return (
    <svg
      width={pixelSize}
      height={pixelSize}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`animate-spin ${className}`}
      style={{ animationDuration: "0.85s" }}
      role="status"
      aria-label="Loading"
    >
      {blades.map((b) => (
        <rect
          key={b.deg}
          x="22.25"
          y="3.5"
          width="3.5"
          height="10"
          rx="1.75"
          fill={color}
          opacity={b.opacity}
          transform={`rotate(${b.deg} 24 24)`}
        />
      ))}
    </svg>
  );
}

// Backward-compatible alias
export const RadialWhiteSpinner = RadialSpinner;

/**
 * Worksphere Loading Spinner:
 * Small white card with application-blue radial spinner inside.
 * Drop-in replacement for all existing imports.
 */
export function WorksphereLogoLoader({
  className = "",
  showText = false,
  size = "md",
  color = "#2563EB",
}: {
  className?: string;
  showText?: boolean;
  size?: "sm" | "md" | "lg" | number;
  color?: string;
}) {
  return (
    <div
      className={`inline-flex flex-col items-center justify-center ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="bg-white p-3 sm:p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center">
        <RadialSpinner size={size} color={color} />
      </div>
      {showText && (
        <span className="text-xs font-semibold text-[#2563EB] mt-2.5 tracking-wide">
          Loading...
        </span>
      )}
    </div>
  );
}

/**
 * Global and Contained API Loading Spinner:
 * Small white card with the blue radial spinner inside, centered on the backdrop.
 * Spins only while active API requests are in progress (activeCount > 0), then stops.
 */
export default function ApiLoadingSpinner({
  contained = false,
  contentAreaRef,
}: ApiLoadingSpinnerProps) {
  const activeCount = useSelector(
    (state: RootState) => state.apiLoading?.activeCount ?? 0
  );
  const show = activeCount > 0;
  const [bounds, setBounds] = useState<DOMRect | null>(null);

  // When contained + contentAreaRef, keep bounds in sync so loader covers only content area
  useEffect(() => {
    if (!show || !contained || !contentAreaRef) return;
    const el = contentAreaRef.current;
    const update = () => setBounds(getContentAreaBounds(el));
    update();
    const t = setTimeout(update, 50);
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      clearTimeout(t);
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [show, contained, contentAreaRef]);

  if (!show) return null;

  // Contained with ref: portal to body, fixed position over content area only
  if (contained && contentAreaRef && typeof document !== "undefined" && document.body) {
    const style: React.CSSProperties = bounds
      ? {
          position: "fixed",
          top: bounds.top,
          left: bounds.left,
          width: bounds.width,
          height: bounds.height,
          zIndex: CONTENT_LOADER_Z_INDEX,
        }
      : { display: "none" };

    const contentAreaLoader = (
      <div
        className="flex items-center justify-center bg-slate-900/15 backdrop-blur-[2px] transition-opacity"
        style={style}
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center">
          <RadialSpinner size="lg" color="#2563EB" />
        </div>
      </div>
    );
    return createPortal(contentAreaLoader, document.body);
  }

  // Contained without ref: absolute inside parent
  if (contained) {
    return (
      <div
        className="absolute inset-0 min-h-[160px] z-[9999] flex items-center justify-center bg-slate-900/15 backdrop-blur-[2px]"
        aria-busy="true"
        aria-label="Loading"
      >
        <div className="bg-white p-3.5 rounded-2xl shadow-xl border border-slate-100 flex items-center justify-center">
          <RadialSpinner size="md" color="#2563EB" />
        </div>
      </div>
    );
  }

  // Full-screen global loader: portal to body
  const fullScreenLoader = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-[3px]"
      style={{ zIndex: GLOBAL_LOADER_Z_INDEX }}
      aria-busy="true"
      aria-label="Loading"
    >
      <div className="bg-white p-4 rounded-2xl shadow-2xl border border-slate-100 flex items-center justify-center">
        <RadialSpinner size="lg" color="#2563EB" />
      </div>
    </div>
  );

  return typeof document !== "undefined" && document.body
    ? createPortal(fullScreenLoader, document.body)
    : fullScreenLoader;
}
