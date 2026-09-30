import React, { useId } from "react";
import {
  INVENT_LOGO_VIEWBOX,
  INVENT_LOGO_PATH_BASE,
  INVENT_LOGO_PATH_CIRCLE,
} from "../../assets/invent-logo-symbol";

export type InventechIconSize = "xs" | "sm" | "md" | "lg" | "xl";

export interface InventechIconLoaderProps {
  /** Size of the spinner */
  size?: InventechIconSize | number;
  /** Whether spinner ring and logo pulse are animated */
  animated?: boolean;
  /** Optional text displayed below the spinner */
  text?: string;
  /** Additional container classes */
  className?: string;
  /** Custom colors override */
  circleColor?: string;
  baseColor?: string;
  ringColor?: string;
}

const SIZE_CONFIG: Record<
  InventechIconSize,
  {
    ringSize: number;
    logoWidth: number;
    logoHeight: number;
    strokeWidth: number;
    fontSize: string;
  }
> = {
  xs: {
    ringSize: 36,
    logoWidth: 16,
    logoHeight: 20,
    strokeWidth: 4,
    fontSize: "text-[11px]",
  },
  sm: {
    ringSize: 52,
    logoWidth: 24,
    logoHeight: 30,
    strokeWidth: 4.5,
    fontSize: "text-xs",
  },
  md: {
    ringSize: 84,
    logoWidth: 38,
    logoHeight: 48,
    strokeWidth: 5,
    fontSize: "text-sm",
  },
  lg: {
    ringSize: 116,
    logoWidth: 54,
    logoHeight: 68,
    strokeWidth: 5.5,
    fontSize: "text-base",
  },
  xl: {
    ringSize: 152,
    logoWidth: 72,
    logoHeight: 90,
    strokeWidth: 6,
    fontSize: "text-lg",
  },
};

export const InventechIconLoader: React.FC<InventechIconLoaderProps> = ({
  size = "md",
  animated = true,
  text,
  className = "",
  circleColor = "#0da0b2",
  baseColor = "#1e46a1",
  ringColor = "#4318FF",
}) => {
  const uniqueId = useId().replace(/:/g, "-");

  const config =
    typeof size === "number"
      ? {
          ringSize: size,
          logoWidth: Math.round(size * 0.46),
          logoHeight: Math.round(size * 0.58),
          strokeWidth: Math.max(3, Math.round(size * 0.05)),
          fontSize: size > 80 ? "text-sm" : "text-xs",
        }
      : SIZE_CONFIG[size] || SIZE_CONFIG.md;

  return (
    <div
      className={`inline-flex flex-col items-center justify-center select-none ${className}`}
      role="status"
      aria-label={text || "Loading"}
    >
        {/* Outer Spinner Container */}
      <div
        className="relative flex items-center justify-center"
        style={{
          width: config.ringSize,
          height: config.ringSize,
        }}
      >
        {/* Ambient Radial Aura */}
        <div
          className="absolute inset-0 -m-2 rounded-full pointer-events-none"
          style={{
            background:
              "radial-gradient(circle, rgba(13,160,178,0.18) 0%, rgba(67,24,255,0.08) 55%, transparent 72%)",
            filter: "blur(6px)",
          }}
          aria-hidden="true"
        />

        {/* Dynamic Rotating Circular Arc Spinner */}
        <svg
          className={`absolute inset-0 w-full h-full ${
            animated ? "animate-invent-rotate" : ""
          }`}
          viewBox="0 0 100 100"
          aria-hidden="true"
        >
          <defs>
            <linearGradient
              id={`invent-spin-${uniqueId}`}
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop offset="0%" stopColor={circleColor} stopOpacity="1" />
              <stop offset="65%" stopColor={ringColor} stopOpacity="0.95" />
              <stop offset="100%" stopColor="#1e46a1" stopOpacity="0.3" />
            </linearGradient>
            <filter id={`invent-glow-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={circleColor} floodOpacity="0.35" />
            </filter>
          </defs>

          {/* Background Track with Subtle Glass Ring */}
          <circle
            cx="50"
            cy="50"
            r="43"
            stroke="#E8EDFB"
            strokeWidth={config.strokeWidth}
            fill="none"
            opacity="0.75"
          />

          {/* Active Gradient Morphing Spinner Arc */}
          <circle
            cx="50"
            cy="50"
            r="43"
            stroke={`url(#invent-spin-${uniqueId})`}
            strokeWidth={config.strokeWidth + 0.6}
            strokeLinecap="round"
            fill="none"
            filter={`url(#invent-glow-${uniqueId})`}
            className={animated ? "animate-invent-arc" : ""}
            style={{
              strokeDasharray: "160, 270",
              strokeDashoffset: "0",
            }}
          />
        </svg>

        {/* Centered Inventech Logo with Subtle Premium Breathing */}
        <div
          className={`relative z-10 flex items-center justify-center ${
            animated ? "animate-invent-logo-breathe" : ""
          }`}
          style={{
            width: config.logoWidth,
            height: config.logoHeight,
          }}
        >
          <svg
            viewBox={INVENT_LOGO_VIEWBOX}
            className="w-full h-full drop-shadow-[0_2px_8px_rgba(30,70,161,0.18)]"
            style={{ overflow: "visible" }}
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            {/* Dark Blue Base */}
            <path
              fillRule="evenodd"
              fill={baseColor}
              d={INVENT_LOGO_PATH_BASE}
            />
            {/* Teal Circle */}
            <path
              fillRule="evenodd"
              fill={circleColor}
              d={INVENT_LOGO_PATH_CIRCLE}
            />
          </svg>
        </div>
      </div>

      {/* Optional Executive Loading Typography */}
      {text && (
        <div className="mt-4 flex flex-col items-center gap-1">
          <div className="flex items-center gap-2">
            <span
              className={`${config.fontSize} font-extrabold text-[#2B3674] tracking-tight antialiased`}
            >
              {text}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0da0b2] animate-bounce [animation-delay:-0.32s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#4318FF] animate-bounce [animation-delay:-0.16s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-[#1e46a1] animate-bounce" />
            </span>
          </div>
          <span className="text-[10px] font-semibold text-gray-400 tracking-wider uppercase">
            Inventech Workspace
          </span>
        </div>
      )}

      <style>{`
        @keyframes inventRotate {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
        @keyframes inventArc {
          0% {
            stroke-dasharray: 25, 270;
            stroke-dashoffset: 0;
          }
          50% {
            stroke-dasharray: 190, 270;
            stroke-dashoffset: -55;
          }
          100% {
            stroke-dasharray: 25, 270;
            stroke-dashoffset: -270;
          }
        }
        @keyframes inventLogoBreathe {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.04);
          }
        }
        .animate-invent-rotate {
          animation: inventRotate 1.8s linear infinite;
        }
        .animate-invent-arc {
          animation: inventArc 1.6s ease-in-out infinite;
          transform-origin: center;
        }
        .animate-invent-logo-breathe {
          animation: inventLogoBreathe 2.4s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default InventechIconLoader;

