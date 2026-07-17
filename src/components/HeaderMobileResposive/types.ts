import { ReactNode } from "react";

export interface MobileHeaderProps {
  logoSrc: string;
  logoAlt?: string;
  onLogoClick: () => void;
  onMenuClick?: () => void;
  children?: ReactNode;
}
