import { Spin } from "antd";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

interface ApiLoadingSpinnerProps {
  /** When true, spinner is positioned absolute and only covers its parent (exclude header/footer/sidebar). */
  contained?: boolean;
}

export default function ApiLoadingSpinner({ contained = false }: ApiLoadingSpinnerProps) {
  const activeCount = useSelector(
    (state: RootState) => state.apiLoading?.activeCount ?? 0
  );
  const show = activeCount > 0;

  if (!show) return null;

  return (
    <div
      className={`z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-[2px] ${
        contained ? "absolute inset-0 min-h-[200px]" : "fixed inset-0"
      }`}
      aria-busy="true"
      aria-label="Loading"
    >
      <Spin size="large" tip="Loading..." />
    </div>
  );
}
