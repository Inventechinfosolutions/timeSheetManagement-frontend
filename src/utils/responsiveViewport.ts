export const DESKTOP_POINTER_QUERY = "(min-width: 1280px)";

export const isDesktopPointerViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia(DESKTOP_POINTER_QUERY).matches;

export const isMobileHeaderViewport = () =>
  typeof window !== "undefined" && !isDesktopPointerViewport();
