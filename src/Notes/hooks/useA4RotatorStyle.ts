import { useEffect, useState, type CSSProperties, type RefObject } from "react";

/**
 * transform: rotate() does not change layout size, so a 90° or 270° sheet
 * still reserves portrait height and the page drops down the workspace.
 * Measure the untransformed page and size the rotator to the visual box.
 */
export function useA4RotatorStyle(
  pageRef: RefObject<HTMLDivElement | null>,
  rotation: number
): CSSProperties | undefined {
  const [box, setBox] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return;

    const measure = () => {
      const width = page.offsetWidth;
      const height = page.offsetHeight;
      setBox((prev) =>
        prev.width === width && prev.height === height ? prev : { width, height }
      );
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(page);
    return () => observer.disconnect();
  }, [pageRef]);

  if ((rotation !== 90 && rotation !== 270) || box.width === 0 || box.height === 0) {
    return undefined;
  }

  return {
    width: box.height,
    height: box.width,
    minWidth: box.height,
    minHeight: box.width,
  };
}
