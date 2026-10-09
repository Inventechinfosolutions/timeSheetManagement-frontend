import React, { useEffect, useState, useRef } from "react";
import {
  Award,
  Clock,
  Sparkles,
  Star,
  Trophy,
  Zap,
} from "lucide-react";

export interface RevealedRatingData {
  reviewId: number;
  rowId: string;
  quarter: string;
  financialYear: string;
  finalRating: number;
  expiresAt: number; // timestamp in ms
}

interface RevealedRatingModalProps {
  data: RevealedRatingData | null;
  onClose: () => void;
}

interface RatingTier {
  title: string;
  badge: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;
  message: string;
  accentGradient: string;
  iconBg: string;
  starFilledColor: string;
  cardGlow: string;
  isCelebratory: boolean;
  particles: Array<{ symbol: string; size: string; delay: number; duration: number; top: number; left: number }>;
}

const getRatingTier = (score: number): RatingTier => {
  if (score >= 4.8) {
    return {
      title: "Outstanding Achievement! 🚀🌟",
      badge: "Exceptional • Top Tier",
      badgeBg: "bg-gradient-to-r from-amber-500 via-amber-400 to-emerald-500",
      badgeBorder: "border-amber-300/40 shadow-sm shadow-amber-500/20",
      badgeText: "text-white",
      message:
        "Keep rocking! This appraisal celebrates your outstanding dedication, exceptional leadership, and top-tier work! You have set an exemplary benchmark for the entire team.",
      accentGradient: "from-amber-400 via-orange-400 to-emerald-500",
      iconBg: "bg-gradient-to-tr from-amber-500 via-yellow-400 to-amber-300 text-amber-950",
      starFilledColor: "text-amber-400 fill-amber-400 drop-shadow-[0_2px_8px_rgba(251,191,36,0.65)]",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(245,158,11,0.25)] ring-1 ring-amber-300/40",
      isCelebratory: true,
      particles: [
        { symbol: "✨", size: "text-base", delay: 0.1, duration: 3.2, top: 12, left: 14 },
        { symbol: "⭐", size: "text-xs", delay: 0.4, duration: 4.1, top: 22, left: 82 },
        { symbol: "🎉", size: "text-sm", delay: 0.7, duration: 3.6, top: 38, left: 10 },
        { symbol: "🌟", size: "text-base", delay: 0.2, duration: 3.8, top: 48, left: 88 },
        { symbol: "✨", size: "text-xs", delay: 0.9, duration: 4.5, top: 68, left: 16 },
        { symbol: "💎", size: "text-xs", delay: 0.5, duration: 3.4, top: 74, left: 84 },
      ],
    };
  }

  if (score >= 4.0) {
    return {
      title: "Exceeds Expectations! 🎯✨",
      badge: "Very Good • High Performer",
      badgeBg: "bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500",
      badgeBorder: "border-blue-400/30 shadow-sm shadow-blue-500/20",
      badgeText: "text-white",
      message:
        "Fantastic achievements! You have consistently delivered high-quality results, shown great initiative, and exceeded performance benchmarks. Keep pushing boundaries!",
      accentGradient: "from-blue-600 via-indigo-600 to-sky-500",
      iconBg: "bg-gradient-to-tr from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] text-white",
      starFilledColor: "text-blue-500 fill-blue-500 drop-shadow-[0_2px_8px_rgba(59,130,246,0.6)]",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(37,99,235,0.25)] ring-1 ring-blue-300/40",
      isCelebratory: true,
      particles: [
        { symbol: "✨", size: "text-sm", delay: 0.2, duration: 3.5, top: 16, left: 18 },
        { symbol: "🎯", size: "text-xs", delay: 0.6, duration: 4.0, top: 24, left: 80 },
        { symbol: "⭐", size: "text-sm", delay: 0.3, duration: 3.7, top: 45, left: 86 },
        { symbol: "✨", size: "text-xs", delay: 0.8, duration: 4.2, top: 62, left: 14 },
      ],
    };
  }

  if (score >= 3.0) {
    return {
      title: "Solid & Dependable Performance! 👍💼",
      badge: "Good • Meets Expectations",
      badgeBg: "bg-gradient-to-r from-teal-600 to-emerald-600",
      badgeBorder: "border-teal-400/30 shadow-sm shadow-teal-500/20",
      badgeText: "text-white",
      message:
        "Solid work! You have accomplished your core quarterly objectives and contributed positively to team milestones. Keep striving for even higher impact in the next cycle!",
      accentGradient: "from-teal-600 via-emerald-600 to-cyan-600",
      iconBg: "bg-gradient-to-tr from-teal-600 to-emerald-500 text-white",
      starFilledColor: "text-teal-500 fill-teal-500 drop-shadow-[0_2px_6px_rgba(20,184,166,0.5)]",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(20,184,166,0.2)] ring-1 ring-teal-300/40",
      isCelebratory: false,
      particles: [
        { symbol: "✨", size: "text-xs", delay: 0.3, duration: 4.5, top: 20, left: 80 },
        { symbol: "📈", size: "text-xs", delay: 0.7, duration: 4.2, top: 55, left: 16 },
      ],
    };
  }

  if (score >= 2.0) {
    return {
      title: "Room for Growth & Focus 🌱📈",
      badge: "Fair • Developing",
      badgeBg: "bg-gradient-to-r from-amber-600 to-orange-500",
      badgeBorder: "border-amber-400/30 shadow-sm shadow-amber-500/20",
      badgeText: "text-white",
      message:
        "You have shown potential, but certain deliverables require closer attention. Review detailed feedback with your manager to target high-priority skills and accelerate your progress.",
      accentGradient: "from-amber-600 to-orange-500",
      iconBg: "bg-gradient-to-tr from-amber-600 to-orange-500 text-white",
      starFilledColor: "text-amber-500 fill-amber-500 drop-shadow-[0_2px_6px_rgba(245,158,11,0.5)]",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(245,158,11,0.18)] ring-1 ring-amber-300/30",
      isCelebratory: false,
      particles: [],
    };
  }

  return {
    title: "Needs Immediate Improvement ⚠️🛠️",
    badge: "Action Plan Required",
    badgeBg: "bg-gradient-to-r from-rose-600 to-red-600",
    badgeBorder: "border-rose-400/30 shadow-sm shadow-rose-500/20",
    badgeText: "text-white",
    message:
      "Your performance this quarter was below expected standards. Please schedule a dedicated 1-on-1 sync with your manager to establish a clear action and coaching plan for improvement.",
    accentGradient: "from-rose-600 to-red-600",
    iconBg: "bg-gradient-to-tr from-rose-600 to-red-500 text-white",
    starFilledColor: "text-rose-500 fill-rose-500 drop-shadow-[0_2px_6px_rgba(244,63,94,0.5)]",
    cardGlow: "shadow-[0_20px_50px_-10px_rgba(244,63,94,0.2)] ring-1 ring-rose-300/30",
    isCelebratory: false,
    particles: [],
  };
};

export const RevealedRatingModal: React.FC<RevealedRatingModalProps> = ({
  data,
  onClose,
}) => {
  const [secondsRemaining, setSecondsRemaining] = useState<number>(0);
  const [animatedScore, setAnimatedScore] = useState<number>(0);
  const animRef = useRef<number | null>(null);

  // Smooth Count-Up Animation
  useEffect(() => {
    if (!data) {
      setAnimatedScore(0);
      return;
    }

    const targetScore = Number(data.finalRating) || 0;
    const duration = 1200; // 1.2s count up
    const startTime = performance.now();

    const updateCount = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic curve: 1 - (1 - t)^3
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      setAnimatedScore(targetScore * easedProgress);

      if (progress < 1) {
        animRef.current = requestAnimationFrame(updateCount);
      } else {
        setAnimatedScore(targetScore);
      }
    };

    animRef.current = requestAnimationFrame(updateCount);

    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [data]);

  // 2-Minute Security Auto-Close Timer
  useEffect(() => {
    if (!data) return;

    const updateTimer = () => {
      const remainingMs = Math.max(0, data.expiresAt - Date.now());
      const secs = Math.ceil(remainingMs / 1000);
      setSecondsRemaining(secs);
      if (secs <= 0) {
        onClose();
      }
    };

    updateTimer();
    const intervalId = window.setInterval(updateTimer, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [data, onClose]);

  if (!data) return null;

  const score = Number(data.finalRating) || 0;
  const tier = getRatingTier(score);
  const totalDuration = 120; // 2 minutes
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / totalDuration) * 100));

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  return (
    <>
      <style>{`
        @keyframes modalEnterFade {
          0% {
            opacity: 0;
            transform: scale(0.92) translateY(12px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes starPopScale {
          0% {
            opacity: 0;
            transform: scale(0) rotate(-25deg);
          }
          65% {
            transform: scale(1.22) rotate(4deg);
          }
          100% {
            opacity: 1;
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes floatSlow {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-6px) rotate(4deg);
          }
        }
        @keyframes iconTrophyBounce {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-4px) scale(1.04);
          }
        }
        .animate-modal-enter {
          animation: modalEnterFade 0.32s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        .animate-star-pop {
          animation: starPopScale 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .animate-float-slow {
          animation: floatSlow 4s ease-in-out infinite;
        }
        .animate-trophy-bounce {
          animation: iconTrophyBounce 2.5s ease-in-out infinite;
        }
      `}</style>

      {/* Backdrop with soft blur and gentle fade-in */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      >
        {/* Modal Window Container - Compact Height */}
        <div
          className={`relative w-full max-w-md rounded-2xl bg-white p-5 sm:p-6 text-[#0F172A] overflow-hidden ${tier.cardGlow} animate-modal-enter border border-slate-100 shadow-xl`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Subtle Ambient Background Glows */}
          <div
            className={`absolute -top-20 -right-20 w-60 h-60 rounded-full bg-gradient-to-br ${tier.accentGradient} opacity-15 blur-3xl pointer-events-none`}
          />
          <div
            className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-blue-500/10 blur-3xl pointer-events-none"
          />

          {/* Restrained Celebratory Particles for high ratings */}
          {tier.isCelebratory && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
              {tier.particles.map((p, i) => (
                <span
                  key={i}
                  className={`absolute ${p.size} animate-float-slow select-none`}
                  style={{
                    top: `${p.top}%`,
                    left: `${p.left}%`,
                    animationDelay: `${p.delay}s`,
                    animationDuration: `${p.duration}s`,
                    opacity: 0.6,
                  }}
                >
                  {p.symbol}
                </span>
              ))}
            </div>
          )}

          {/* Main Visual Content */}
          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Compact Floating Trophy / Icon Badge */}
            <div className="relative mb-2">
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${tier.iconBg} flex items-center justify-center shadow-md shadow-blue-500/20 ring-4 ring-white ${
                  tier.isCelebratory ? "animate-trophy-bounce" : ""
                }`}
              >
                {score >= 4.0 ? (
                  <Trophy className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-sm" />
                ) : score >= 3.0 ? (
                  <Award className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-sm" />
                ) : (
                  <Zap className="w-7 h-7 sm:w-8 sm:h-8 drop-shadow-sm" />
                )}
              </div>
              {/* Sparkle Pin for Top Performers */}
              {tier.isCelebratory && (
                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-white shadow-sm flex items-center justify-center text-amber-500 border border-amber-100">
                  <Sparkles className="w-3 h-3" />
                </span>
              )}
            </div>

            {/* Quarter & Financial Year Pill */}
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-blue-50/80 text-blue-700 text-[11px] font-bold border border-blue-200/60 mb-1.5">
              <span className="font-extrabold">{data.quarter}</span>
              <span className="text-blue-300">•</span>
              <span className="text-blue-600">FY {data.financialYear}</span>
            </div>

            {/* Tier Badge Placed Below */}
            <span
              className={`inline-block px-3 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
            >
              {tier.badge}
            </span>

            {/* Smooth Count-up Score Display */}
            <div className="flex items-baseline justify-center gap-1.5 mb-1 select-none">
              <span
                className={`text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r ${tier.accentGradient} bg-clip-text text-transparent`}
              >
                {animatedScore.toFixed(2)}
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-300">
                / 5.00
              </span>
            </div>

            {/* Sequential Star Reveals with Subtle Scaling */}
            <div className="flex items-center gap-1 mb-2">
              {[1, 2, 3, 4, 5].map((starIdx) => {
                const isFilled = score >= starIdx;
                const isHalf = !isFilled && score >= starIdx - 0.5;
                const delaySec = (starIdx - 1) * 0.1;

                return (
                  <div
                    key={starIdx}
                    className="relative animate-star-pop"
                    style={{ animationDelay: `${delaySec}s` }}
                  >
                    <Star
                      className={`w-5 h-5 sm:w-6 sm:h-6 transition-all ${
                        isFilled
                          ? tier.starFilledColor
                          : isHalf
                          ? "text-amber-400 fill-amber-200"
                          : "text-slate-200 fill-slate-100"
                      }`}
                    />
                  </div>
                );
              })}
            </div>

            {/* Title Header */}
            <h3 className="text-base sm:text-lg font-extrabold text-[#0F172A] tracking-tight mb-1.5">
              {tier.title}
            </h3>

            {/* Dynamic Feedback Message Card */}
            <div className="w-full p-3 sm:p-3.5 rounded-xl bg-slate-50/90 border border-slate-200/70 mb-3 text-left">
              <p className="text-xs font-medium text-slate-700 leading-relaxed">
                "{tier.message}"
              </p>
            </div>

            {/* Compact 2-Minute Security Auto-Close Timer */}
            <div className="w-full bg-[#EFF6FF]/70 rounded-xl p-2.5 sm:p-3 border border-blue-200/60">
              <div className="flex items-center justify-between text-xs font-semibold text-blue-900 mb-1">
                <span className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span className="text-[11px]">Security View Active</span>
                </span>
                <span className="font-mono font-bold text-[11px] text-[#1D4ED8] bg-white px-2 py-0.5 rounded-md border border-blue-200/50 shadow-2xs">
                  Auto-closes in {formatTime(secondsRemaining)}
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1 bg-blue-200/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#3B82F6] to-[#1D4ED8] transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-[9.5px] text-blue-600/80 mt-1 text-left font-normal leading-normal">
                For security, this window automatically closes when the countdown reaches 0:00.
              </p>
            </div>

            {/* Right-Aligned Close Button */}
            <div className="flex justify-end w-full mt-3">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-[#3B82F6] via-[#2563EB] to-[#1D4ED8] hover:from-[#2563EB] hover:to-[#1E40AF] text-white text-xs font-bold shadow-md shadow-blue-500/25 transition-all duration-200 active:scale-[0.98] hover:-translate-y-0.5 cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
