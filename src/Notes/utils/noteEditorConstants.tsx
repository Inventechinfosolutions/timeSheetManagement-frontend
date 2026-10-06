import React from "react";

export const WordOrientationIcon: React.FC = () => (
  <svg
    className="w-5 h-5 shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    {/* Portrait sheet in background */}
    <path
      d="M3.5 2H9.5L12.5 5V13H3.5V2Z"
      fill="#F8FAFC"
      stroke="#64748B"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M9.5 2V5H12.5"
      fill="#CBD5E1"
      stroke="#64748B"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />

    {/* Curved Blue Arrow in top-right */}
    <path
      d="M14.5 2.5C17.5 2.8 19.5 4.5 19.5 7V7.5"
      stroke="#2563EB"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M17.5 5.5L19.5 7.5L21.5 5.5"
      stroke="#2563EB"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />

    {/* Landscape sheet in foreground */}
    <path
      d="M6.5 9H15.5L18.5 12V18H6.5V9Z"
      fill="#FFFFFF"
      stroke="#334155"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <path
      d="M15.5 9V12H18.5"
      fill="#E2E8F0"
      stroke="#334155"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
  </svg>
);

export const FONT_SIZES = [
  "8",
  "9",
  "10",
  "11",
  "12",
  "14",
  "16",
  "18",
  "20",
  "22",
  "24",
  "26",
  "28",
  "36",
  "48",
  "72",
];

export const BOLD_DARK_COLORS = [
  { color: "var(--tbl-black)", className: "bg-tbl-black", label: "Black" },
  { color: "var(--tbl-dark-slate)", className: "bg-tbl-dark-slate", label: "Dark Slate" },
  { color: "var(--tbl-slate-gray)", className: "bg-tbl-slate-gray", label: "Slate Gray" },
  { color: "var(--tbl-deep-blue)", className: "bg-tbl-deep-blue", label: "Deep Blue" },
  { color: "var(--tbl-electric-blue)", className: "bg-tbl-electric-blue", label: "Royal Blue" },
  { color: "var(--tbl-teal)", className: "bg-tbl-teal", label: "Dark Cyan" },
  { color: "var(--tbl-dark-green)", className: "bg-tbl-dark-green", label: "Forest Green" },
  { color: "var(--tbl-bold-green)", className: "bg-tbl-bold-green", label: "Emerald Green" },
  { color: "var(--tbl-bold-amber)", className: "bg-tbl-bold-amber", label: "Bold Amber" },
  { color: "var(--tbl-bold-orange)", className: "bg-tbl-bold-orange", label: "Bold Orange" },
  { color: "var(--tbl-crimson-red)", className: "bg-tbl-crimson-red", label: "Crimson Red" },
  { color: "var(--tbl-deep-red)", className: "bg-tbl-deep-red", label: "Deep Red" },
  { color: "var(--tbl-bold-pink)", className: "bg-tbl-bold-pink", label: "Bold Pink" },
  { color: "var(--tbl-vibrant-purple)", className: "bg-tbl-vibrant-purple", label: "Vibrant Purple" },
  { color: "var(--tbl-deep-purple)", className: "bg-tbl-deep-purple", label: "Deep Purple" },
];

export const LIGHT_SHADING_COLORS = [
  { color: "var(--tbl-white)", className: "bg-tbl-white", label: "White" },
  { color: "var(--tbl-gray)", className: "bg-tbl-gray", label: "Light Gray" },
  { color: "var(--tbl-blue)", className: "bg-tbl-blue", label: "Soft Blue" },
  { color: "var(--tbl-cyan)", className: "bg-tbl-cyan", label: "Soft Cyan" },
  { color: "var(--tbl-green)", className: "bg-tbl-green", label: "Soft Green" },
  { color: "var(--tbl-lime)", className: "bg-tbl-lime", label: "Lime" },
  { color: "var(--tbl-yellow)", className: "bg-tbl-yellow", label: "Soft Yellow" },
  { color: "var(--tbl-orange)", className: "bg-tbl-orange", label: "Peach" },
  { color: "var(--tbl-light-red)", className: "bg-tbl-light-red", label: "Light Red" },
  { color: "var(--tbl-purple)", className: "bg-tbl-purple", label: "Lavender" },
];
