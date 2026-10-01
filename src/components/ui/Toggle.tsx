import React from "react";

export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  activeColor?: string; // defaults to brand blue #4318FF
  inactiveColor?: string;
}

export const Toggle: React.FC<ToggleProps> = ({
  checked,
  onChange,
  label,
  disabled = false,
  size = "md",
  className = "",
  activeColor = "#4318FF",
  inactiveColor,
}) => {
  const sizeMap = {
    sm: {
      track: "w-8 h-4",
      knob: "w-3 h-3",
      translate: "translate-x-4",
    },
    md: {
      track: "w-11 h-6",
      knob: "w-5 h-5",
      translate: "translate-x-5",
    },
    lg: {
      track: "w-14 h-7",
      knob: "w-6 h-6",
      translate: "translate-x-7",
    },
  };

  const currentSize = sizeMap[size];

  return (
    <label
      className={`inline-flex items-center gap-2 select-none ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${className}`}
    >
      <div className="relative inline-flex items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => !disabled && onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div
          style={{ backgroundColor: checked ? activeColor : (inactiveColor || "#E2E8F0") }}
          className={`${currentSize.track} rounded-full transition-colors duration-200 ease-in-out p-0.5`}
        >
          <div
            className={`${currentSize.knob} bg-white rounded-full shadow-md transform transition-transform duration-200 ease-in-out ${
              checked ? currentSize.translate : "translate-x-0"
            }`}
          />
        </div>
      </div>
      {label && (
        <span className="text-xs font-semibold text-[#2B3674]">{label}</span>
      )}
    </label>
  );
};

export default Toggle;
