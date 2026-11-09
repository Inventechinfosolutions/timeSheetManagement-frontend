import { ReactNode } from "react";
import { Calendar as CalendarIcon, Coffee, Laptop, Sprout, Edit } from "lucide-react";

interface Props {
  name: string;
  title: string;
  today: Date;
  onLogHours?: () => void;
  rightSlot?: ReactNode;
}

const DashboardHero = ({ name, title, today, onLogHours, rightSlot }: Props) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-[#1E1B6B] via-[#3B2BC9] to-[#7C5CFF] text-white shadow-[0_20px_45px_-15px_rgba(67,24,255,0.55)]">
      <div className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 right-1/3 h-80 w-80 rounded-full bg-fuchsia-400/20 blur-3xl" />
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
        viewBox="0 0 800 200"
        preserveAspectRatio="none"
      >
        <path d="M0 140 C 200 60 400 220 800 90 L 800 200 L 0 200 Z" fill="white" />
        <path d="M0 170 C 250 110 500 230 800 140 L 800 200 L 0 200 Z" fill="white" />
      </svg>

      <div className="relative z-10 flex flex-col gap-4 p-5 md:px-7 md:py-6 lg:flex-row lg:items-stretch lg:justify-between">
        <div className="min-w-0">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-white/90 ring-1 ring-white/20 backdrop-blur-sm">
            {title}
          </span>
          <p className="mt-3 text-sm font-medium text-white/75">Welcome back,</p>
          <h1 className="mt-0.5 truncate text-2xl font-extrabold tracking-tight md:text-3xl">
            {name} <span className="inline-block origin-bottom-right animate-[wave_2.4s_ease-in-out_infinite]">👋</span>
          </h1>
          <p className="mt-1.5 text-sm text-white/70">Here's your productivity overview for today</p>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-3.5 py-2 ring-1 ring-white/20 backdrop-blur-sm">
              <CalendarIcon size={15} className="shrink-0" />
              <span className="text-sm font-semibold">
                {today.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
            {onLogHours && (
              <button
                type="button"
                onClick={onLogHours}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-bold text-[#4318FF] shadow-lg shadow-black/10 transition-all hover:-translate-y-0.5 hover:shadow-xl active:scale-95"
              >
                <Edit size={15} />
                Log Today's Hours
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 lg:items-end">
          {rightSlot && (
            <div className="rounded-2xl bg-white/15 p-1 ring-1 ring-white/25 backdrop-blur-sm">{rightSlot}</div>
          )}
          <div className="relative hidden h-24 w-80 md:block">
            <p className="absolute left-0 top-0 max-w-[150px] text-base font-semibold italic leading-snug text-white/90">
              <span className="mr-1 text-2xl leading-none text-white/60">"</span>
              Great work, keep going!
            </p>
            <div className="absolute bottom-0 right-0 h-2.5 w-56 rounded-full bg-white/25" />
            <div className="absolute bottom-2.5 right-24 flex items-end justify-center">
              <Laptop size={56} strokeWidth={1.4} className="text-white drop-shadow-lg" />
            </div>
            <div className="absolute bottom-2.5 right-4 flex flex-col items-center">
              <Sprout size={32} strokeWidth={1.6} className="text-emerald-300 drop-shadow" />
              <div className="-mt-1 h-6 w-7 rounded-b-xl rounded-t-sm bg-violet-300/90" />
            </div>
            <div className="absolute bottom-2.5 right-48">
              <Coffee size={24} strokeWidth={1.6} className="text-white/90" />
            </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes wave {
          0%, 60%, 100% { transform: rotate(0deg); }
          10%, 30% { transform: rotate(14deg); }
          20% { transform: rotate(-8deg); }
          40% { transform: rotate(-4deg); }
          50% { transform: rotate(10deg); }
        }
      `}</style>
    </div>
  );
};

export default DashboardHero;
