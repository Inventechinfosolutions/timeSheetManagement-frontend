import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronUp, ChevronDown } from "lucide-react";

interface ScrollNavigatorProps {
  targetRef?: React.RefObject<HTMLElement | null>;
  /** When false, never show (e.g. force-off from parent) */
  enabled?: boolean;
}

export const ScrollNavigator: React.FC<ScrollNavigatorProps> = ({
  targetRef,
  enabled = true,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [canScrollUp, setCanScrollUp] = useState(false);
  const [canScrollDown, setCanScrollDown] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const boundElRef = useRef<HTMLElement | Window | null>(null);

  /** Prefer nested note workspace if it still scrolls; otherwise use main / window. */
  const getScrollElement = useCallback((): HTMLElement | Window => {
    const main =
      targetRef?.current ||
      (document.querySelector("main.custom-scrollbar") as HTMLElement | null) ||
      (document.querySelector("main") as HTMLElement | null);

    if (main) {
      const nested = main.querySelector(".a4-page-workspace") as HTMLElement | null;
      if (nested && nested.scrollHeight > nested.clientHeight + 40) {
        return nested;
      }
      if (main.scrollHeight > main.clientHeight + 40) {
        return main;
      }
      return main;
    }
    return window;
  }, [targetRef]);

  const updateScrollState = useCallback(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    const el = getScrollElement();
    boundElRef.current = el;

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

    const progress =
      maxScroll > 0 ? Math.min(100, Math.max(0, Math.round((scrollTop / maxScroll) * 100))) : 0;
    setScrollProgress(progress);
  }, [getScrollElement, enabled]);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    let scrollEl: HTMLElement | Window = getScrollElement();
    let observer: ResizeObserver | null = null;
    let mutationObserver: MutationObserver | null = null;

    const detach = () => {
      if (scrollEl instanceof Window) {
        window.removeEventListener("scroll", updateScrollState);
      } else {
        scrollEl.removeEventListener("scroll", updateScrollState);
      }
      window.removeEventListener("resize", updateScrollState);
      observer?.disconnect();
      observer = null;
    };

    const attach = (el: HTMLElement | Window) => {
      detach();
      scrollEl = el;
      boundElRef.current = el;
      if (el instanceof Window) {
        window.addEventListener("scroll", updateScrollState, { passive: true });
      } else {
        el.addEventListener("scroll", updateScrollState, { passive: true });
        if (typeof ResizeObserver !== "undefined") {
          observer = new ResizeObserver(() => updateScrollState());
          observer.observe(el);
        }
      }
      window.addEventListener("resize", updateScrollState);
      updateScrollState();
    };

    attach(scrollEl);

    mutationObserver = new MutationObserver(() => {
      const next = getScrollElement();
      if (next !== scrollEl) {
        attach(next);
      } else {
        updateScrollState();
      }
    });
    const root =
      targetRef?.current ||
      document.querySelector("main.custom-scrollbar") ||
      document.body;
    if (root) {
      mutationObserver.observe(root, { childList: true, subtree: true, characterData: true });
    }

    const poll = window.setInterval(() => {
      const next = getScrollElement();
      if (next !== scrollEl) attach(next);
      else updateScrollState();
    }, 800);

    return () => {
      detach();
      mutationObserver?.disconnect();
      window.clearInterval(poll);
    };
  }, [getScrollElement, updateScrollState, targetRef, enabled]);

  const scrollToTop = () => {
    const el = boundElRef.current || getScrollElement();
    if (el instanceof Window) {
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const scrollToBottom = () => {
    const el = boundElRef.current || getScrollElement();
    if (el instanceof Window) {
      window.scrollTo({
        top: document.documentElement.scrollHeight,
        behavior: "smooth",
      });
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  };

  if (!enabled || !isVisible) return null;

  return (
    <div
      className="fixed bottom-7 right-7 z-40 flex flex-col items-center gap-1.5 p-1.5 bg-white/90 backdrop-blur-md border border-indigo-100/90 rounded-2xl shadow-[0_8px_30px_rgba(67,24,255,0.18)] hover:shadow-[0_12px_36px_rgba(67,24,255,0.25)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-3 select-none"
      role="navigation"
      aria-label="Scroll Navigator"
    >
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

      <div
        className="text-[10px] font-bold text-slate-400 tracking-tighter px-1 py-0.5 select-none"
        title={`Page scroll: ${scrollProgress}%`}
      >
        {scrollProgress}%
      </div>

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
