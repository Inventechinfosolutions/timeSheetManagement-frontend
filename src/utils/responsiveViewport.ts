export const DESKTOP_POINTER_QUERY =
  "(min-width: 1024px) and (hover: hover) and (pointer: fine), (width: 1280px) and (height: 800px)";

export const isDesktopPointerViewport = () =>
  typeof window !== "undefined" &&
  window.matchMedia(DESKTOP_POINTER_QUERY).matches;
