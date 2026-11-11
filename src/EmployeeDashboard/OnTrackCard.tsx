import { Trophy, AlertTriangle, Sparkles } from "lucide-react";

interface Props {
  pendingDays: number;
  onFix?: () => void;
}

const OnTrackCard = ({ pendingDays, onFix }: Props) => {
  const onTrack = pendingDays === 0;

  return (
    <div
      className={`relative flex h-full min-h-[220px] flex-col items-center justify-center overflow-hidden rounded-3xl p-6 text-center text-white shadow-[0_18px_40px_-14px_rgba(30,27,107,0.6)] ${
        onTrack
          ? "bg-linear-to-br from-[#1E1B6B] via-[#2A2391] to-[#4C1D95]"
          : "bg-linear-to-br from-[#7C2D12] via-[#C2410C] to-[#F97316]"
      }`}
    >
      <div className="pointer-events-none absolute -top-10 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-white/10 blur-2xl" />
      <svg
        className="pointer-events-none absolute bottom-0 left-0 h-16 w-full opacity-25"
        viewBox="0 0 200 50"
        preserveAspectRatio="none"
      >
        <path d="M0 30 C 50 10 100 45 150 25 S 190 15 200 20 L 200 50 L 0 50 Z" fill="white" />
      </svg>
      <Sparkles size={14} className="absolute left-6 top-6 text-amber-200/70" />
      <Sparkles size={10} className="absolute right-8 top-10 text-amber-200/60" />

      <div className="relative mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
        {onTrack ? (
          <Trophy size={34} className="text-amber-300 drop-shadow-[0_4px_12px_rgba(252,211,77,0.6)]" />
        ) : (
          <AlertTriangle size={30} className="text-amber-100" />
        )}
      </div>
      <h4 className="relative text-lg font-extrabold">{onTrack ? "You're on track!" : "Action needed"}</h4>
      <p className="relative mt-1 max-w-[200px] text-xs font-medium leading-relaxed text-white/75">
        {onTrack
          ? "Keep up the great work this month."
          : `${pendingDays} ${pendingDays === 1 ? "day is" : "days are"} not updated this month.`}
      </p>
      {!onTrack && onFix && (
        <button
          type="button"
          onClick={onFix}
          className="relative mt-4 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#C2410C] shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95"
        >
          Update Timesheet
        </button>
      )}
    </div>
  );
};

export default OnTrackCard;
