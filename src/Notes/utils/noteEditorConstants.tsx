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
  { color: "#000000", label: "Black" },
  { color: "#1e293b", label: "Dark Slate" },
  { color: "#475569", label: "Slate Gray" },
  { color: "#1d4ed8", label: "Deep Blue" },
  { color: "#2563eb", label: "Royal Blue" },
  { color: "#0891b2", label: "Dark Cyan" },
  { color: "#15803d", label: "Forest Green" },
  { color: "#16a34a", label: "Emerald Green" },
  { color: "#d97706", label: "Bold Amber" },
  { color: "#ea580c", label: "Bold Orange" },
  { color: "#dc2626", label: "Crimson Red" },
  { color: "#b91c1c", label: "Deep Red" },
  { color: "#db2777", label: "Bold Pink" },
  { color: "#7c3aed", label: "Vibrant Purple" },
  { color: "#581c87", label: "Deep Purple" },
];

export const LIGHT_SHADING_COLORS = [
  { color: "#ffffff", label: "White" },
  { color: "#f1f5f9", label: "Light Gray" },
  { color: "#dbeafe", label: "Soft Blue" },
  { color: "#cffafe", label: "Soft Cyan" },
  { color: "#dcfce7", label: "Soft Green" },
  { color: "#ecfccb", label: "Lime" },
  { color: "#fef9c3", label: "Soft Yellow" },
  { color: "#ffedd5", label: "Peach" },
  { color: "#fee2e2", label: "Light Red" },
  { color: "#f3e8ff", label: "Lavender" },
];
