import { Menu } from "lucide-react";
import { MobileHeaderSlot } from "./enums";
import { MobileHeaderProps } from "./types";
import { isDesktopPointerViewport } from "../../utils/responsiveViewport";
import "./MobileHeader.css";

export const isMobileHeaderViewport = () =>
  typeof window !== "undefined" && !isDesktopPointerViewport();

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
