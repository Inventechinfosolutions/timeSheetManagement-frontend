import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  LayoutGrid,
  Calendar,
  Eye,
  CalendarCheck,
  FileText,
} from "lucide-react";
import "./MobileBottomNav.css";

export interface MobileNavItem {
  name: string;
  label: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
}

export interface NavGroup {
  title: string;
  icon: React.ComponentType<{ className?: string; size?: number; strokeWidth?: number }>;
  items: MobileNavItem[];
}

export interface MobileBottomNavProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
  items?: MobileNavItem[];
  groups?: NavGroup[];
}

const DEFAULT_NAV_ITEMS: MobileNavItem[] = [
  { name: "Dashboard", label: "Dashboard", icon: LayoutGrid },
  { name: "My Timesheet", label: "Timesheet", icon: Calendar },
  { name: "Timesheet History", label: "History", icon: Eye },
  { name: "Request Management", label: "Requests", icon: CalendarCheck },
  { name: "Employee Notes", label: "Notes", icon: FileText },
];

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab = "Dashboard",
  onTabChange,
  items = DEFAULT_NAV_ITEMS,
  groups,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(360);

  // If groups are provided, effective bottom bar items are the groups
  const effectiveItems = useMemo(() => {
    if (groups && groups.length > 0) {
      return groups.map((g) => ({
        name: g.title,
        label: g.title,
        icon: g.icon,
      }));
    }
    return items;
  }, [groups, items]);

  // Find index in groups
  const findGroupIndexFromTab = useCallback(
    (tabName: string) => {
      if (!groups || groups.length === 0) return 0;
      // Exact match first (handles "Request Management " vs "Request Management")
      const exactIdx = groups.findIndex((g) =>
        g.items.some((it) => it.name === tabName)
      );
      if (exactIdx >= 0) return exactIdx;

      const idx = groups.findIndex((g) =>
        g.items.some((it) => it.name.toLowerCase() === tabName.toLowerCase())
      );
      return idx >= 0 ? idx : 0;
    },
    [groups]
  );

  // Helper to find index from activeTab
  const getIndexFromTab = useCallback(
    (tabName: string) => {
      const idx = effectiveItems.findIndex((it) => it.name.toLowerCase() === tabName.toLowerCase());
      return idx >= 0 ? idx : 0;
    },
    [effectiveItems]
  );

  const initialIndex = groups && groups.length > 0 ? findGroupIndexFromTab(activeTab) : getIndexFromTab(activeTab);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [displayIndex, setDisplayIndex] = useState(initialIndex);
  const [openGroupIndex, setOpenGroupIndex] = useState<number | null>(null);

  // Close dropdown when activeTab changes externally
  useEffect(() => {
    setOpenGroupIndex(null);
  }, [activeTab]);

  // Notch position X state
  const [notchX, setNotchX] = useState<number>(0);
  const [bubbleYOffset, setBubbleYOffset] = useState<number>(0);
  const [bubbleScale, setBubbleScale] = useState<number>(1);

  const animRef = useRef<number | null>(null);
  const currentXRef = useRef<number>(0);

  // Calculate center X of any item index based on width
  const calcItemCenterX = useCallback(
    (idx: number, width: number) => {
      if (effectiveItems.length === 0) return 0;
      const slotWidth = width / effectiveItems.length;
      return (idx + 0.5) * slotWidth;
    },
    [effectiveItems.length]
  );

  // Measure container width
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        const w = containerRef.current.clientWidth;
        if (w > 0) {
          setContainerWidth(w);
          const targetX = calcItemCenterX(activeIndex, w);
          currentXRef.current = targetX;
          setNotchX(targetX);
        }
      }
    };

    updateSize();
    window.addEventListener("resize", updateSize);
    return () => window.removeEventListener("resize", updateSize);
  }, [activeIndex, calcItemCenterX]);

  // Synchronize when activeTab changes externally
  useEffect(() => {
    if (groups && groups.length > 0) {
      const gIdx = findGroupIndexFromTab(activeTab);
      if (gIdx !== activeIndex) {
        animateToTab(gIdx);
      }
    } else {
      const newIdx = getIndexFromTab(activeTab);
      if (newIdx !== activeIndex) {
        animateToTab(newIdx);
      }
    }
  }, [activeTab, groups, findGroupIndexFromTab, getIndexFromTab, activeIndex]);

  // Fluid Spring Animation to glide the curved notch & floating bubble
  const animateToTab = (toIdx: number) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);

    const fromX = currentXRef.current;
    const toX = calcItemCenterX(toIdx, containerWidth);
    const startTime = performance.now();
    const duration = 440; // ms

    setActiveIndex(toIdx);

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);

      // Spring easing with smooth overshoot
      // Formula: 1 - exp(-6t) * cos(4t)
      const t = progress;
      const ease =
        t === 1
          ? 1
          : 1 - Math.exp(-5.5 * t) * Math.cos(3.8 * t);

      const curX = fromX + (toX - fromX) * ease;
      currentXRef.current = curX;
      setNotchX(curX);

      // Bubble vertical trajectory: dips slightly into the scoop, then pops up
      const midLift = Math.sin(progress * Math.PI);
      const verticalOffset = -midLift * 6; // lifts 6px during flight
      const scale = 1 + midLift * 0.12;

      setBubbleYOffset(verticalOffset);
      setBubbleScale(scale);

      // Switch active icon midway through the flight for seamless transition
      if (progress > 0.45 && displayIndex !== toIdx) {
        setDisplayIndex(toIdx);
      }

      if (progress < 1) {
        animRef.current = requestAnimationFrame(step);
      } else {
        currentXRef.current = toX;
        setNotchX(toX);
        setBubbleYOffset(0);
        setBubbleScale(1);
        setDisplayIndex(toIdx);
        animRef.current = null;
      }
    };

    animRef.current = requestAnimationFrame(step);
  };

  const handleTabClick = (idx: number, itemName: string) => {
    if (groups && groups.length > 0) {
      if (idx !== activeIndex) {
        animateToTab(idx);
        // Automatically switch to the first item in that group
        const firstItem = groups[idx]?.items[0];
        if (firstItem) {
          onTabChange?.(firstItem.name);
        }
      }
    } else {
      if (idx === activeIndex) return;
      animateToTab(idx);
      onTabChange?.(itemName);
    }
  };

  // SVG curved notch path calculation
  const barHeight = 62;
  const isCompact = !groups && effectiveItems.length > 5;
  const notchRadius = isCompact ? 32 : 38;
  const notchDepth = isCompact ? 23 : 26;
  const bubbleSize = isCompact ? 42 : 48;

  // Path with smooth cubic bezier U-scoop
  const notchPath = `
    M 0, 0
    L ${Math.max(0, notchX - notchRadius - 8)}, 0
    C ${notchX - notchRadius + 3}, 0 
      ${notchX - (isCompact ? 18 : 22)}, ${notchDepth} 
      ${notchX}, ${notchDepth}
    C ${notchX + (isCompact ? 18 : 22)}, ${notchDepth} 
      ${notchX + notchRadius - 3}, 0 
      ${notchX + notchRadius + 8}, 0
    L ${containerWidth}, 0
    L ${containerWidth}, ${barHeight}
    L 0, ${barHeight}
    Z
  `;

  const ActiveIcon = effectiveItems[displayIndex]?.icon || LayoutGrid;

  // If groups are provided (Manager mode: dual menu with floating horizontal dropdown popover)
  if (groups && groups.length > 0) {
    const activeGroupIdx = findGroupIndexFromTab(activeTab);
    const isDropdownOpen = openGroupIndex !== null;
    const displayedGroup = isDropdownOpen ? groups[openGroupIndex] : null;

    return (
      <>
        {/* Full-screen backdrop to close dropdown on tap outside */}
        {isDropdownOpen && (
          <div
            className="manager-dropdown-overlay"
            onClick={() => setOpenGroupIndex(null)}
            aria-label="Close menu overlay"
          />
        )}

        <div className="manager-bottom-nav-container">
          {/* Floating Horizontal Dropdown Menu */}
          {isDropdownOpen && displayedGroup && (
            <div className="manager-floating-dropdown">
              {/* Caret arrow pointing to active group button */}
              <div
                className="manager-dropdown-arrow"
                style={{
                  left: openGroupIndex === 0 ? "25%" : "75%",
                }}
              />

              <div className="manager-horizontal-dropdown-row">
                {displayedGroup.items.map((subItem) => {
                  const isSubActive =
                    activeTab === subItem.name ||
                    activeTab?.toLowerCase() === subItem.name.toLowerCase();
                  const SubIcon = subItem.icon;
                  return (
                    <button
                      key={subItem.name}
                      type="button"
                      onClick={() => {
                        onTabChange?.(subItem.name);
                        setOpenGroupIndex(null);
                      }}
                      className={`manager-subitem-pill ${
                        isSubActive ? "is-active" : "is-inactive"
                      }`}
                      aria-label={subItem.label}
                    >
                      <SubIcon size={13} strokeWidth={isSubActive ? 2.4 : 2} />
                      <span>{subItem.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* The Main Menu Tabs Bar */}
          <div className="manager-menu-tabs-row">
            {groups.map((group, gIdx) => {
              const isGroupActive = activeGroupIdx === gIdx;
              const isGroupOpen = openGroupIndex === gIdx;
              const GroupIcon = group.icon;

              return (
                <button
                  key={group.title}
                  type="button"
                  onClick={() => {
                    if (openGroupIndex === gIdx) {
                      setOpenGroupIndex(null);
                    } else {
                      setOpenGroupIndex(gIdx);
                    }
                  }}
                  className={`manager-menu-tab-btn ${
                    isGroupActive ? "is-active" : "is-inactive"
                  } ${isGroupOpen ? "dropdown-open" : ""}`}
                >
                  <GroupIcon size={15} strokeWidth={isGroupActive ? 2.5 : 2} />
                  <span>{group.title}</span>
                  <span className={`manager-chevron ${isGroupOpen ? "open" : ""}`}>
                    ▾
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  }

  return (
    <div className="mobile-curved-nav-wrapper">
      <div className={`mobile-curved-nav-container ${isCompact ? "is-compact" : ""}`} ref={containerRef}>
        {/* SVG Background Bar with Smooth Dynamic Notch */}
        <svg
          className="mobile-curved-nav-svg"
          width={containerWidth}
          height={barHeight}
          viewBox={`0 0 ${containerWidth} ${barHeight}`}
        >
          <defs>
            <filter id="navCurvedShadow" x="-5%" y="-20%" width="110%" height="150%">
              <feDropShadow
                dx="0"
                dy="-4"
                stdDeviation="8"
                floodColor="rgba(0, 0, 0, 0.08)"
              />
            </filter>
          </defs>

          {/* White Bar with Cutout Scoop */}
          <path
            d={notchPath}
            fill="#ffffff"
            filter="url(#navCurvedShadow)"
          />
        </svg>

        {/* Floating Active Circular Bubble */}
        <div
          className="mobile-curved-active-bubble"
          style={{
            width: `${bubbleSize}px`,
            height: `${bubbleSize}px`,
            marginLeft: `-${bubbleSize / 2}px`,
            transform: `translate3d(${notchX}px, calc(-50% + ${isCompact ? 12 : 14}px + ${bubbleYOffset}px), 0) scale(${bubbleScale})`,
          }}
        >
          <div className="mobile-curved-bubble-content">
            <ActiveIcon size={isCompact ? 19 : 22} strokeWidth={2.4} className="mobile-curved-bubble-icon" />
          </div>

          {/* 3D Specular Highlight Arc */}
          <div className="mobile-curved-bubble-specular" />
        </div>

        {/* Navigation Items (Icons positioned across the bar) */}
        <div className="mobile-curved-items-row">
          {effectiveItems.map((item, idx) => {
            const Icon = item.icon;
            const isSelected = activeIndex === idx;

            return (
              <button
                key={item.name}
                type="button"
                onClick={() => handleTabClick(idx, item.name)}
                className={`mobile-curved-item-btn ${isSelected ? "item-selected" : ""}`}
                aria-label={item.label}
              >
                <div
                  className="mobile-curved-icon-box"
                  style={{
                    opacity: isSelected ? 0 : 1,
                    transform: isSelected ? "scale(0.5) translateY(10px)" : "scale(1) translateY(0)",
                  }}
                >
                  <Icon size={isCompact ? 18 : 21} strokeWidth={2} className="mobile-curved-neutral-icon" />
                  <span className="mobile-curved-item-text">{item.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default MobileBottomNav;
