import { Menu } from "lucide-react";
import { MobileHeaderSlot } from "./enums";
import { MobileHeaderProps } from "./types";
import "./MobileHeader.css";

// FIXED: Changed from 1024px to 1279px (or < 1280px) to match the layout's xl breakpoint threshold.
// This ensures that when zoomed into 110% or 125%, this evaluates to true and shows the hamburger!
export const isMobileHeaderViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(max-width: 1279px)").matches;

const MobileHeader = ({
  logoSrc,
  logoAlt = "WorkSphere Logo",
  onLogoClick,
  onMenuClick,
  children,
}: MobileHeaderProps) => {
  return (
    <div className="mobile-header" aria-label="Mobile header">
      <button
        type="button"
        className="mobile-header__menu"
        aria-label="Open menu"
        data-slot={MobileHeaderSlot.Menu}
        onClick={onMenuClick}
        style={{ visibility: onMenuClick ? "visible" : "hidden" }}
      >
        <Menu size={21} strokeWidth={2.6} />
      </button>

      <button
        type="button"
        className="mobile-header__logo"
        aria-label="Go to dashboard"
        data-slot={MobileHeaderSlot.Logo}
        onClick={onLogoClick}
      >
        <span className="mobile-header__logo-inner">
          <img src={logoSrc} alt={logoAlt} className="mobile-header__logo-img" />
        </span>
      </button>

      <div className="mobile-header__actions">{children}</div>
    </div>
  );
};

export default MobileHeader;