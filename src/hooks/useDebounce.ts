import { useCallback, useEffect, useRef, useState } from "react";

export function useDebounce<T>(value: T, delay = 400): [T, (immediateValue: T) => void] {
  const [debounced, setDebounced] = useState<T>(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => setDebounced(value), delay);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [value, delay]);

  /** Immediately apply `immediateValue` and cancel any pending debounce timer. */
  const flush = useCallback((immediateValue: T) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    setDebounced(immediateValue);
  }, []);

  return [debounced, flush];
}

export default useDebounce;
