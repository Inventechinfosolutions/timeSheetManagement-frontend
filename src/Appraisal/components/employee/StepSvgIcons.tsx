import React from "react";

interface StepSvgIconProps {
  isActive: boolean;
  className?: string;
}

/**
 * 1. Overview Step: Compass with progressive path-drawn ring, cardinal ticks & needle
 */
export const StepOverviewIcon: React.FC<StepSvgIconProps> = ({ isActive, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`stepper-build-svg ${className}`}
  >
    {/* 1. Compass dial ring builds 360deg */}
    <circle
      cx="12"
      cy="12"
      r="9"
      className={isActive ? "anim-build-circle-outer" : ""}
      style={{ strokeDasharray: 58, strokeDashoffset: 0 }}
    />
    {/* 2. Cardinal tick marks appear */}
    <path
      d="M12 3v1.5M12 19.5v1.5M3 12h1.5M19.5 12h1.5"
      className={isActive ? "anim-build-fade-fast" : ""}
      strokeWidth="1.6"
    />
    {/* 3. Compass diamond needle draws in & swings */}
    <polygon
      points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"
      className={isActive ? "anim-build-compass-needle" : ""}
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? 0.25 : 0}
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * 2. Achievements Step: Trophy built piece-by-piece from base, stem, bowl, handles to star
 */
export const StepAchievementsIcon: React.FC<StepSvgIconProps> = ({ isActive, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`stepper-build-svg ${className}`}
  >
    {/* 1. Base pedestal draws */}
    <path
      d="M7 21h10M10 17v4M14 17v4"
      className={isActive ? "anim-build-trophy-base" : ""}
      strokeWidth="2"
    />
    {/* 2. Main Trophy Cup body draws */}
    <path
      d="M6 4h12v4a6 6 0 0 1-12 0V4z"
      className={isActive ? "anim-build-trophy-body" : ""}
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? 0.2 : 0}
    />
    {/* 3. Left & Right Handles curve in */}
    <path
      d="M6 6H4a2 2 0 0 0-2 2v1a4 4 0 0 0 4 4M18 6h2a2 2 0 0 1 2 2v1a4 4 0 0 1-4 4"
      className={isActive ? "anim-build-trophy-handles" : ""}
    />
  </svg>
);

/**
 * 3. Teamwork Step: Users built one by one (Lead, Left peer, Right peer)
 */
export const StepTeamworkIcon: React.FC<StepSvgIconProps> = ({ isActive, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`stepper-build-svg ${className}`}
  >
    {/* 1. Center Lead User */}
    <circle
      cx="12"
      cy="7"
      r="3.5"
      className={isActive ? "anim-build-user-center" : ""}
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? 0.22 : 0}
    />
    <path
      d="M6 19v-1a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v1"
      className={isActive ? "anim-build-user-center-body" : ""}
    />
    {/* 2. Left and Right Peers build in sequence */}
    <path
      d="M17 11a3 3 0 0 0 0-6M7 11a3 3 0 0 1 0-6"
      className={isActive ? "anim-build-user-peers-head" : ""}
      strokeWidth="1.8"
    />
    <path
      d="M21 19v-1a3 3 0 0 0-2.5-2.95M3 19v-1a3 3 0 0 1 2.5-2.95"
      className={isActive ? "anim-build-user-peers-body" : ""}
      strokeWidth="1.8"
    />
  </svg>
);

/**
 * 4. Learning Goals Step: Target built circle-by-circle (Outer, Middle, Bullseye)
 */
export const StepGoalsIcon: React.FC<StepSvgIconProps> = ({ isActive, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`stepper-build-svg ${className}`}
  >
    {/* 1. Outer circle built first */}
    <circle
      cx="12"
      cy="12"
      r="9"
      className={isActive ? "anim-build-target-outer" : ""}
      style={{ strokeDasharray: 58, strokeDashoffset: 0 }}
    />
    {/* 2. Middle circle built second */}
    <circle
      cx="12"
      cy="12"
      r="5.5"
      className={isActive ? "anim-build-target-middle" : ""}
      style={{ strokeDasharray: 36, strokeDashoffset: 0 }}
    />
    {/* 3. Bullseye center built third */}
    <circle
      cx="12"
      cy="12"
      r="2.2"
      fill="currentColor"
      className={isActive ? "anim-build-target-bullseye" : ""}
    />
    {/* 4. Crosshairs tick in */}
    <path
      d="M12 2v2M12 20v2M2 12h2M20 12h2"
      className={isActive ? "anim-build-target-crosshairs" : ""}
      strokeWidth="1.7"
    />
  </svg>
);

/**
 * 5. Environment Step: Building built from foundation, walls to illuminated windows
 */
export const StepEnvironmentIcon: React.FC<StepSvgIconProps> = ({ isActive, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`stepper-build-svg ${className}`}
  >
    {/* 1. Foundation line */}
    <path d="M2 21h20" className={isActive ? "anim-build-env-base" : ""} />
    {/* 2. Main office building outline */}
    <path
      d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"
      className={isActive ? "anim-build-env-walls" : ""}
      fill={isActive ? "currentColor" : "none"}
      fillOpacity={isActive ? 0.15 : 0}
    />
    {/* 3. Window panes lighting up */}
    <path
      d="M9 7h1M14 7h1M9 11h1M14 11h1M9 15h1M14 15h1"
      className={isActive ? "anim-build-env-windows" : ""}
      strokeWidth="2.5"
    />
  </svg>
);

/**
 * 6. Final Review Step: Arrow flying forward through the steps to complete review
 */
export const StepFinalReviewIcon: React.FC<StepSvgIconProps> = ({ isActive, className = "" }) => (
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`stepper-build-svg ${className}`}
  >
    {/* 1. Launch trajectory flight trail */}
    <path
      d="M3 12h11"
      className={isActive ? "anim-build-send-trail" : ""}
      strokeWidth="2.2"
      strokeDasharray="14"
    />
    {/* 2. Arrowhead and wings advancing forward */}
    <path
      d="M11 6l6 6-6 6"
      className={isActive ? "anim-build-send-arrow" : ""}
      strokeWidth="2.4"
    />
    {/* 3. Final target ring / seal ahead */}
    <circle
      cx="19"
      cy="12"
      r="2"
      fill={isActive ? "currentColor" : "none"}
      className={isActive ? "anim-build-send-target" : ""}
    />
  </svg>
);
