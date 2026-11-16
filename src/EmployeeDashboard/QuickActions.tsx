import { ReactNode } from "react";
import { Zap } from "lucide-react";

export interface QuickAction {
  label: string;
  icon: ReactNode;
  color: string;
  tint: string;
  onClick: () => void;
}

const QuickActions = ({
  actions,
  landscape = false,
}: {
  actions: QuickAction[];
  landscape?: boolean;
}) => (
  <div
    className={`flex rounded-3xl border border-gray-100/80 bg-white shadow-[0_10px_30px_-12px_rgba(67,24,255,0.15)] ${
      landscape
        ? "flex-col gap-4 p-4 sm:flex-row sm:items-center sm:gap-5 sm:p-5"
        : "h-full flex-col p-5"
    }`}
  >
    <div className={`flex shrink-0 items-center gap-2 ${landscape ? "sm:pr-2" : "mb-4"}`}>
      <Zap size={18} className="fill-[#4318FF]/15 text-[#4318FF]" />
      <h4 className="text-base font-bold tracking-tight text-[#1B2559]">Quick Actions</h4>
    </div>
    <div
      className={
        landscape
          ? "grid flex-1 grid-cols-2 gap-3 sm:grid-cols-4"
          : "grid flex-1 grid-cols-2 gap-3"
      }
    >
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className={`group flex items-center rounded-2xl ring-1 ring-black/[0.03] transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95 ${
            landscape
              ? "flex-row gap-3 px-4 py-3 text-left"
              : "flex-col justify-center gap-2 p-3 text-center"
          }`}
          style={{ backgroundColor: action.tint }}
        >
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110"
            style={{ color: action.color }}
          >
            {action.icon}
          </span>
          <span className="text-xs font-bold text-[#2B3674]">{action.label}</span>
        </button>
      ))}
    </div>
  </div>
);

export default QuickActions;
