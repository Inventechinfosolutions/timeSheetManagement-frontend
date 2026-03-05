import { Spin } from "antd";
import { useSelector } from "react-redux";
import type { RootState } from "../store";

export default function ApiLoadingSpinner() {
  const activeCount = useSelector(
    (state: RootState) => state.apiLoading?.activeCount ?? 0
  );
  const show = activeCount > 0;

  if (!show) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-white/60 backdrop-blur-[2px]"
      aria-busy="true"
      aria-label="Loading"
    >
      <Spin size="large" tip="Loading..." />
    </div>
  );
}
