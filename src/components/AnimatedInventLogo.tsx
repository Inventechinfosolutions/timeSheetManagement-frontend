import React, { useEffect, useState } from "react";
import {
  INVENT_LOGO_VIEWBOX,
  INVENT_LOGO_PATH_BASE,
  INVENT_LOGO_PATH_CIRCLE,
} from "../assets/invent-logo-symbol";

const TEAL_CIRCLE = "#0da0b2";
const DARK_BLUE = "#1e46a1";

const WORD_DELAY_MS = 320;
const LOGO_BLOOM_DURATION_MS = 1100;
const LOGO_CIRCLE_RISE_MS = 650;
const LOGO_PAUSE_BEFORE_TEXT_MS = 350;

const WORDS = ["Welcome", "to", "Inventech"];

/**
 * Loader logo: exact Inventech symbol (teal circle + dark blue base from invent-logo.svg).
 * Bloom + circle rise, then "Welcome to Inventech" word by word.
 */
const AnimatedInventLogo: React.FC<{
  className?: string;
  onComplete?: () => void;
  enterFromBottom?: boolean;
}> = ({ className = "", onComplete, enterFromBottom = false }) => {
  const [phase, setPhase] = useState<"logo" | "text">("logo");
  const [visibleWordIndex, setVisibleWordIndex] = useState(-1);

  useEffect(() => {
    const t1 = LOGO_BLOOM_DURATION_MS + LOGO_PAUSE_BEFORE_TEXT_MS;
    const timer1 = setTimeout(() => setPhase("text"), t1);
    return () => clearTimeout(timer1);
  }, []);

  useEffect(() => {
    if (phase !== "text") return;
    if (visibleWordIndex < 0) {
      const t = setTimeout(() => setVisibleWordIndex(0), 80);
      return () => clearTimeout(t);
    }
    if (visibleWordIndex >= WORDS.length - 1) {
      const t = setTimeout(() => onComplete?.(), 700);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setVisibleWordIndex((i) => i + 1),
      WORD_DELAY_MS
    );
    return () => clearTimeout(t);
  }, [phase, visibleWordIndex, onComplete]);

  const content = (
    <>
      <div className="flex-shrink-0 pb-4" aria-hidden="true">
        <svg
          viewBox={INVENT_LOGO_VIEWBOX}
          className="w-28 h-[4.5rem] sm:w-36 sm:h-24 block"
          style={{ overflow: "visible" }}
          preserveAspectRatio="xMidYMid meet"
        >
        {/* Dark blue base (exact path from invent-logo.svg) */}
        <path
          fillRule="evenodd"
          fill={DARK_BLUE}
          d={INVENT_LOGO_PATH_BASE}
          className="logo-base"
        />
        {/* Teal circle (exact path from invent-logo.svg) */}
        <path
          fillRule="evenodd"
          fill={TEAL_CIRCLE}
          d={INVENT_LOGO_PATH_CIRCLE}
          className="logo-circle"
        />
        </svg>
      </div>

      <div className="flex flex-wrap justify-center gap-x-2 gap-y-1 mt-12 min-h-[2rem] items-baseline">
        {WORDS.map((word, i) => (
          <span
            key={word}
            className="text-lg sm:text-xl font-bold text-[#2B3674] tracking-tight select-none"
            style={{
              opacity: visibleWordIndex >= i ? 1 : 0,
              transform: visibleWordIndex >= i ? "translateY(0)" : "translateY(4px)",
              transition: "opacity 0.35s ease-out, transform 0.35s ease-out",
            }}
          >
            {word}
          </span>
        ))}
      </div>

      <style>{`
        @keyframes baseBloom {
          0% {
            opacity: 0;
            transform: scale(0.92);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes circleRise {
          0% {
            opacity: 0;
            transform: translateY(8px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .logo-base {
          transform-origin: 920px 585px;
          animation: baseBloom ${LOGO_BLOOM_DURATION_MS}ms ease-out forwards;
          opacity: 0;
        }
        .logo-circle {
          animation: circleRise ${LOGO_CIRCLE_RISE_MS}ms ease-out 200ms forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );

  return (
    <div
      className={`flex flex-col items-center justify-center px-6 py-8 max-w-sm mx-auto ${className}`}
      role="status"
      aria-live="polite"
      aria-label="Loading, please wait"
      style={
        enterFromBottom
          ? {
              animation: "splashEnterUp 0.6s ease-out forwards",
              opacity: 0,
            }
          : undefined
      }
    >
      {enterFromBottom && (
        <style>{`
          @keyframes splashEnterUp {
            0% { opacity: 0; transform: translateY(40px); }
            100% { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      )}
      {content}
    </div>
  );
};

export default AnimatedInventLogo;
