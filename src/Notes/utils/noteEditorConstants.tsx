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

/** Microsoft Word–style Theme Colors (Office default–inspired, 10 cols × 6 shade rows). */
export const WORD_THEME_COLOR_MATRIX: { color: string; label: string }[][] = [
  [
    { color: "#FFFFFF", label: "White" },
    { color: "#000000", label: "Black" },
    { color: "#E7E6E6", label: "Gray 25%" },
    { color: "#44546A", label: "Blue-Gray" },
    { color: "#5B9BD5", label: "Blue" },
    { color: "#ED7D31", label: "Orange" },
    { color: "#A5A5A5", label: "Gray 50%" },
    { color: "#FFC000", label: "Gold" },
    { color: "#4472C4", label: "Blue Accent" },
    { color: "#70AD47", label: "Green" },
  ],
  [
    { color: "#F2F2F2", label: "White, Darker 5%" },
    { color: "#7F7F7F", label: "Black, Lighter 50%" },
    { color: "#D0CECE", label: "Gray 25%, Darker 10%" },
    { color: "#D6DCE4", label: "Blue-Gray, Lighter 80%" },
    { color: "#DEEBF6", label: "Blue, Lighter 80%" },
    { color: "#FCE4D6", label: "Orange, Lighter 80%" },
    { color: "#EDEDED", label: "Gray 50%, Lighter 80%" },
    { color: "#FFF2CC", label: "Gold, Lighter 80%" },
    { color: "#D6DCE4", label: "Blue Accent, Lighter 80%" },
    { color: "#E2EFDA", label: "Green, Lighter 80%" },
  ],
  [
    { color: "#D9D9D9", label: "White, Darker 15%" },
    { color: "#595959", label: "Black, Lighter 35%" },
    { color: "#AEAAAA", label: "Gray 25%, Darker 25%" },
    { color: "#ADB9CA", label: "Blue-Gray, Lighter 60%" },
    { color: "#BDD7EE", label: "Blue, Lighter 60%" },
    { color: "#F8CBAD", label: "Orange, Lighter 60%" },
    { color: "#DBDBDB", label: "Gray 50%, Lighter 60%" },
    { color: "#FFE699", label: "Gold, Lighter 60%" },
    { color: "#B4C6E7", label: "Blue Accent, Lighter 60%" },
    { color: "#C6E0B4", label: "Green, Lighter 60%" },
  ],
  [
    { color: "#BFBFBF", label: "White, Darker 25%" },
    { color: "#3F3F3F", label: "Black, Lighter 25%" },
    { color: "#757070", label: "Gray 25%, Darker 50%" },
    { color: "#8496B0", label: "Blue-Gray, Lighter 40%" },
    { color: "#9BC2E6", label: "Blue, Lighter 40%" },
    { color: "#F4B183", label: "Orange, Lighter 40%" },
    { color: "#C9C9C9", label: "Gray 50%, Lighter 40%" },
    { color: "#FFD966", label: "Gold, Lighter 40%" },
    { color: "#8FAADC", label: "Blue Accent, Lighter 40%" },
    { color: "#A9D08E", label: "Green, Lighter 40%" },
  ],
  [
    { color: "#A6A6A6", label: "White, Darker 35%" },
    { color: "#262626", label: "Black, Lighter 15%" },
    { color: "#3A3838", label: "Gray 25%, Darker 75%" },
    { color: "#323F4F", label: "Blue-Gray, Darker 25%" },
    { color: "#2E75B6", label: "Blue, Darker 25%" },
    { color: "#C55A11", label: "Orange, Darker 25%" },
    { color: "#7B7B7B", label: "Gray 50%, Darker 25%" },
    { color: "#BF8F00", label: "Gold, Darker 25%" },
    { color: "#2F5496", label: "Blue Accent, Darker 25%" },
    { color: "#548235", label: "Green, Darker 25%" },
  ],
  [
    { color: "#7F7F7F", label: "White, Darker 50%" },
    { color: "#0D0D0D", label: "Black, Darker 5%" },
    { color: "#171616", label: "Gray 25%, Darker 90%" },
    { color: "#222A35", label: "Blue-Gray, Darker 50%" },
    { color: "#1F4E79", label: "Blue, Darker 50%" },
    { color: "#833C0C", label: "Orange, Darker 50%" },
    { color: "#525252", label: "Gray 50%, Darker 50%" },
    { color: "#806000", label: "Gold, Darker 50%" },
    { color: "#203864", label: "Blue Accent, Darker 50%" },
    { color: "#385723", label: "Green, Darker 50%" },
  ],
];

/** Word Standard Colors row */
export const WORD_STANDARD_COLORS = [
  { color: "#C00000", label: "Dark Red" },
  { color: "#FF0000", label: "Red" },
  { color: "#FFC000", label: "Orange" },
  { color: "#FFFF00", label: "Yellow" },
  { color: "#92D050", label: "Light Green" },
  { color: "#00B050", label: "Green" },
  { color: "#00B0F0", label: "Light Blue" },
  { color: "#0070C0", label: "Blue" },
  { color: "#002060", label: "Dark Blue" },
  { color: "#7030A0", label: "Purple" },
];

/** Expanded highlighter set (Word-like + soft tints). */
export const WORD_HIGHLIGHT_COLORS = [
  { color: "transparent", label: "No Color" },
  { color: "#FFFF00", label: "Yellow" },
  { color: "#00FF00", label: "Bright Green" },
  { color: "#00FFFF", label: "Turquoise" },
  { color: "#FF00FF", label: "Pink" },
  { color: "#0000FF", label: "Blue" },
  { color: "#FF0000", label: "Red" },
  { color: "#000080", label: "Dark Blue" },
  { color: "#008080", label: "Teal" },
  { color: "#008000", label: "Green" },
  { color: "#800000", label: "Dark Red" },
  { color: "#800080", label: "Purple" },
  { color: "#808000", label: "Dark Yellow" },
  { color: "#808080", label: "Gray 50%" },
  { color: "#C0C0C0", label: "Gray 25%" },
  { color: "#000000", label: "Black" },
  { color: "#FEF08A", label: "Soft Yellow" },
  { color: "#BBF7D0", label: "Soft Green" },
  { color: "#BFDBFE", label: "Soft Blue" },
  { color: "#FECDD3", label: "Soft Pink" },
  { color: "#E9D5FF", label: "Soft Purple" },
  { color: "#FED7AA", label: "Soft Orange" },
  { color: "#FDE68A", label: "Amber" },
  { color: "#A5F3FC", label: "Cyan" },
  { color: "#DDD6FE", label: "Violet" },
];
