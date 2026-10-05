import React, { useState, useEffect, useCallback } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ScrollNavigatorProps {
  targetRef?: React.RefObject<HTMLElement | null>;
}

export const ScrollNavigator: React.FC<ScrollNavigatorProps> = ({ targetRef }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Helper to get active scroll element
  const getScrollElement = useCallback((): HTMLElement | Window => {
    if (targetRef?.current) return targetRef.current;
    const mainEl =
      (document.querySelector("main.custom-scrollbar") as HTMLElement) ||
      (document.querySelector("main") as HTMLElement);
    if (mainEl && mainEl.scrollHeight > mainEl.clientHeight) {
      return mainEl;
    }
    return window;
  }, [targetRef]);

  const updateScrollState = useCallback(() => {
    const el = getScrollElement();

    let scrollTop = 0;
    let scrollHeight = 0;
    let clientHeight = 0;

    if (el instanceof Window) {
      scrollTop = window.scrollY || document.documentElement.scrollTop;
      scrollHeight = document.documentElement.scrollHeight;
      clientHeight = window.innerHeight;
    } else {
      scrollTop = el.scrollTop;
      scrollHeight = el.scrollHeight;
      clientHeight = el.clientHeight;
    }

    const maxScroll = scrollHeight - clientHeight;
    const isScrollable = maxScroll > 60;

    setIsVisible(isScrollable);
    setCanScrollUp(scrollTop > 40);
    setCanScrollDown(scrollTop < maxScroll - 40);

    const progress = maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100))) : 0;
    setScrollProgress(progress);
  }, [getScrollElement]);

  useEffect(() => {
    const el = getScrollElement();

    updateScrollState();

    if (el instanceof Window) {
      window.addEventListener("scroll", updateScrollState, { passive: true });
      window.addEventListener("resize", updateScrollState);
      return () => {
        window.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      };
    } else {
      el.addEventListener("scroll", updateScrollState, { passive: true });
      window.addEventListener("resize", updateScrollState);

      // Observe content size changes (e.g. dynamic loading of notes)
      let observer: ResizeObserver | null = null;
      if (typeof ResizeObserver !== "undefined") {
        observer = new ResizeObserver(() => {
          updateScrollState();
        });
        observer.observe(el);
      }

      return () => {
        el.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
        if (observer) {
          observer.disconnect();
        }
      };
    }
  }, [getScrollElement, updateScrollState]);

  const scrollToTop = () => {
    const el = getScrollElement();
    if (el instanceof Window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    const el = getScrollElement();
    if (el instanceof Window) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed bottom-7 right-7 z-40 flex flex-col items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md border border-indigo-100/90 rounded-2xl shadow-[0_8px_30px_rgba(67,24,255,0.18)] hover:shadow-[0_12px_36px_rgba(67,24,255,0.25)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 select-none"
      role="navigation"
      aria-label="Scroll Navigator"
    >
      {/* Scroll to Top Button */}
      <button
        type="button"
        onClick={scrollToTop}
        disabled={!canScrollUp}
        title="Scroll to top"
        aria-label="Scroll to top"
        className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer ${
          canScrollUp
            ? "bg-[#4318FF] hover:bg-[#320fe0] text-white shadow-[0_4px_12px_rgba(67,24,255,0.3)] hover:scale-105 active:scale-95"
            : "bg-slate-100 text-slate-300 cursor-not-allowed"
        }`}
      >
        <ChevronUp
          className="w-5 h-5 transition-transform duration-300 group-hover:-translate-y-1 group-active:-translate-y-1.5"
          strokeWidth={2.5}
        />
      </button>

      {/* Progress Indicator */}
      <div
        className="text-[10px] font-bold text-slate-400 tracking-tighter px-1 py-0.5 select-none"
        title={`Page scroll: ${scrollProgress}%`}
      >
        {scrollProgress}%
      </div>

      {/* Scroll to Bottom Button */}
      <button
        type="button"
        onClick={scrollToBottom}
        disabled={!canScrollDown}
        title="Scroll to bottom"
        aria-label="Scroll to bottom"
        className={`group relative flex items-center justify-center w-10 h-10 rounded-xl transition-all duration-300 cursor-pointer ${
          canScrollDown
            ? "bg-[#4318FF] hover:bg-[#320fe0] text-white shadow-[0_4px_12px_rgba(67,24,255,0.3)] hover:scale-105 active:scale-95"
            : "bg-slate-100 text-slate-300 cursor-not-allowed"
        }`}
      >
        <ChevronDown
          className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-1 group-active:translate-y-1.5"
          strokeWidth={2.5}
        />
      </button>
    </div>
  );
};

export default ScrollNavigator;
