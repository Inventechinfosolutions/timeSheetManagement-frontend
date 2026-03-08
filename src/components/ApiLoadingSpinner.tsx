import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import { Spin } from "antd";
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

export default function ApiLoadingSpinner({ contained = false, contentAreaRef }: ApiLoadingSpinnerProps) {
  const activeCount = useSelector(
    (state: RootState) => state.apiLoading?.activeCount ?? 0
  );
  const show = activeCount > 0;
  const [bounds, setBounds] = useState<DOMRect | null>(null);

  // When contained + contentAreaRef, keep bounds in sync so loader covers only content area (header/footer/sidebar excluded)
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

  // Contained with ref: portal to body, fixed position over content area only (above modals)
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
        className="flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
        style={style}
        aria-busy="true"
        aria-label="Loading"
      >
        <Spin size="large" tip="Loading..." />
      </div>
    );
    return createPortal(contentAreaLoader, document.body);
  }

  // Contained without ref: absolute inside parent (legacy)
  if (contained) {
    return (
      <div
        className="absolute inset-0 min-h-[200px] z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
        aria-busy="true"
        aria-label="Loading"
      >
        <Spin size="large" tip="Loading..." />
      </div>
    );
  }

  // Full-screen: portal to body
  const fullScreenLoader = (
    <div
      className="fixed inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
      style={{ zIndex: GLOBAL_LOADER_Z_INDEX }}
      aria-busy="true"
      aria-label="Loading"
    >
      <Spin size="large" tip="Loading..." />
    </div>
  );
  return typeof document !== "undefined" && document.body
    ? createPortal(fullScreenLoader, document.body)
    : fullScreenLoader;
}
