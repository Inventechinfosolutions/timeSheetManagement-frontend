import { ReactNode } from "react";
import { Zap } from "lucide-react";

export interface QuickAction {
  label: string;
  icon: ReactNode;
  color: string;
  tint: string;
  onClick: () => void;
}

const QuickActions = ({ actions }: { actions: QuickAction[] }) => (
  <div className="flex h-full flex-col rounded-3xl border border-gray-100/80 bg-white p-5 shadow-[0_10px_30px_-12px_rgba(67,24,255,0.15)]">
    <div className="mb-4 flex items-center gap-2">
      <Zap size={18} className="fill-[#4318FF]/15 text-[#4318FF]" />
      <h4 className="text-base font-bold tracking-tight text-[#1B2559]">Quick Actions</h4>
    </div>
    <div className="grid flex-1 grid-cols-2 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          type="button"
          onClick={action.onClick}
          className="group flex flex-col items-center justify-center gap-2 rounded-2xl p-3 text-center ring-1 ring-black/[0.03] transition-all hover:-translate-y-0.5 hover:shadow-lg active:scale-95"
          style={{ backgroundColor: action.tint }}
        >
          <span
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition-transform group-hover:scale-110"
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
