import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, Clock, Star, Shield, ArrowRight, X } from "lucide-react";
import { useAppSelector } from "../../../hooks";
import {
  animateRevealedModalEntrance,
  animateRevealedModalExit,
} from "../../animations/revealedRatingAnimations";

export interface RevealedRatingData {
  reviewId: number;
  rowId: string;
  quarter: string;
  financialYear: string;
  finalRating: number;
  expiresAt: number;
}

interface RevealedRatingModalProps {
  data: RevealedRatingData | null;
  onClose: () => void;
}

const getRatingTier = (score: number) => {
  if (score >= 4.8) {
    return {
      headline: "Exceptional Performance! 🌟",
      badge: "EXCEPTIONAL • TOP TIER",
      message: "Fantastic achievements! You have consistently delivered high-quality results, shown great initiative, and exceeded performance benchmarks. Keep pushing boundaries!",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(16,185,129,0.2)]",
    };
  }
  if (score >= 4.0) {
    return {
      headline: "Exceeds Expectations!",
      badge: "VERY GOOD - HIGH PERFORMER",
      message: "Fantastic achievements! You have consistently delivered high-quality results, shown great initiative, and exceeded performance benchmarks. Keep pushing boundaries!",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(37,99,235,0.2)]",
    };
  }
  if (score >= 3.0) {
    return {
      headline: "Meets Expectations!",
      badge: "GOOD - MEETS EXPECTATIONS",
      message: "Solid work! You have accomplished your core quarterly objectives and contributed positively to team milestones. Keep striving for even higher impact in the next cycle!",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(59,130,246,0.18)]",
    };
  }
  if (score >= 2.0) {
    return {
      headline: "Developing & Growing",
      badge: "FAIR - DEVELOPING",
      message: "You have shown potential, but certain deliverables require closer attention. Review detailed feedback with your manager to target high-priority skills.",
      cardGlow: "shadow-[0_20px_50px_-10px_rgba(245,158,11,0.18)]",
    };
  }
  return {
    headline: "Action Plan Required",
    badge: "ACTION PLAN REQUIRED",
    message: "Your performance this quarter was below expected standards. Please schedule a dedicated 1-on-1 sync with your manager to establish a coaching plan.",
    cardGlow: "shadow-[0_20px_50px_-10px_rgba(244,63,94,0.18)]",
  };
};

export const RevealedRatingModal: React.FC<RevealedRatingModalProps> = ({ data, onClose }) => {
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [animatedScore, setAnimatedScore] = useState(0);

  const cardRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const trophyRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  const { currentUser } = useAppSelector((state) => state.user);
  const { entity } = useAppSelector((state) => state.employeeDetails);
  const recipientName =
    entity?.firstName ||
    currentUser?.aliasLoginName?.split(" ")[0] ||
    currentUser?.loginId ||
    "Team Member";

  // Score Count-Up
  useEffect(() => {
    if (!data) return;
    const target = Number(data.finalRating) || 0;
    const startTime = performance.now();
    const update = (now: number) => {
      const progress = Math.min(1, (now - startTime) / 400);
      setAnimatedScore(target * (1 - Math.pow(1 - progress, 3)));
      if (progress < 1) requestAnimationFrame(update);
      else setAnimatedScore(target);
    };
    requestAnimationFrame(update);
  }, [data]);

  // Security Countdown Timer
  useEffect(() => {
    if (!data) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((data.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
      if (remaining <= 0) handleAnimatedClose();
    };
    tick();
    const timer = setInterval(tick, 1000);
    return () => clearInterval(timer);
  }, [data]);

  // Scroll lock & background blur
  useEffect(() => {
    if (data) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open-active");
    }
    return () => {
      document.body.style.overflow = "unset";
      document.body.classList.remove("modal-open-active");
    };
  }, [data]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && data) handleAnimatedClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [data]);

  // GSAP Entrance
  useEffect(() => {
    if (!data || !cardRef.current) return;
    isClosingRef.current = false;
    return animateRevealedModalEntrance({
      card: cardRef.current,
      backdrop: backdropRef.current,
      trophyIcon: trophyRef.current,
      starsContainer: starsRef.current,
      quoteCard: quoteRef.current,
      bottomBar: bottomRef.current,
    });
  }, [data]);

  const handleAnimatedClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    animateRevealedModalExit(cardRef.current, backdropRef.current, onClose);
  };

  if (!data || typeof document === "undefined") return null;

  const score = Number(data.finalRating) || 0;
  const tier = getRatingTier(score);
  const m = Math.floor(secondsRemaining / 60);
  const s = secondsRemaining % 60;
  const formattedTime = `${m}:${s < 10 ? "0" : ""}${s}`;

  return createPortal(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Playfair+Display:wght@700;800&display=swap');
        .revealed-font-script { font-family: 'Caveat', cursive, sans-serif; }
        .revealed-font-serif { font-family: 'Playfair Display', Georgia, serif; }

        header,
        .header,
        aside,
        footer,
        .footer,
        .sidebar-footer {
          transition: filter 0.3s ease, opacity 0.3s ease !important;
        }
        body.modal-open-active header,
        body.modal-open-active .header,
        body.modal-open-active aside,
        body.modal-open-active footer,
        body.modal-open-active .footer,
        body.modal-open-active .sidebar-footer {
          filter: blur(2.5px) !important;
          -webkit-filter: blur(2.5px) !important;
          pointer-events: none !important;
          user-select: none !important;
        }
      `}</style>

      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 overflow-y-auto no-scrollbar">
        <div
          ref={backdropRef}
          className="fixed inset-0 z-0 cursor-pointer"
          style={{
            backgroundColor: "rgba(30, 58, 138, 0.35)",
            backdropFilter: "blur(2.5px)",
            WebkitBackdropFilter: "blur(2.5px)",
          }}
          onClick={handleAnimatedClose}
        />

        {/* Modal Card - 2-Column Exact Layout from Reference Image */}
        <div
          ref={cardRef}
          className={`relative z-10 w-full max-w-[640px] rounded-3xl bg-white text-[#0F172A] overflow-hidden ${tier.cardGlow} border border-blue-100/90 shadow-[0_24px_70px_-15px_rgba(15,23,42,0.22)] p-6 sm:p-7`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close 'X' Button at Top Right - Large & Prominent */}
          <button
            type="button"
            onClick={handleAnimatedClose}
            className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 active:scale-90 transition-all cursor-pointer"
            title="Close dialog"
          >
            <X className="w-6 h-6 stroke-[2.4]" />
          </button>

          {/* Curved Sky-Blue Swoosh Background across Right Half */}
          <div className="absolute top-0 right-0 w-[55%] h-full bg-gradient-to-l from-sky-100/60 via-blue-50/40 to-transparent pointer-events-none rounded-r-3xl" />
          <div className="absolute -top-16 -right-16 w-80 h-80 rounded-full bg-sky-200/35 blur-3xl pointer-events-none" />

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
            {/* Left Column (7 cols): Greeting, Name, Badges, Score, Stars, Headline, Quote */}
            <div className="md:col-span-7 flex flex-col items-start text-left">
              {/* Handwritten Greeting with Festive Ray Accents */}
              <div className="flex items-center gap-1.5 text-emerald-600 font-bold mb-0.5">
                <svg className="w-3.5 h-3.5 text-emerald-500 overflow-visible shrink-0" viewBox="0 0 16 16" fill="none">
                  <path className="gsap-burst-ray" d="M 5 12 L 2 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path className="gsap-burst-ray" d="M 12 14 L 8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="revealed-font-script text-2xl text-emerald-700 font-bold leading-none">
                  Great Work,
                </span>
                <svg className="w-3.5 h-3.5 text-emerald-500 overflow-visible shrink-0" viewBox="0 0 16 16" fill="none">
                  <path className="gsap-burst-ray" d="M 11 12 L 14 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path className="gsap-burst-ray" d="M 4 14 L 8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Recipient Name in Elegant Serif Font */}
              <h2 className="revealed-font-serif text-3xl sm:text-4xl font-extrabold text-[#0B2568] tracking-tight leading-none mb-3">
                {recipientName}
              </h2>

              {/* Quarter & Tier Pills */}
              <div className="flex items-center gap-2 mb-3 flex-wrap">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#EFF6FF] border border-[#DBEAFE] text-xs font-bold text-[#1E40AF]">
                  <Calendar className="w-3.5 h-3.5 text-[#3B82F6]" />
                  <span>{data.quarter} • FY {data.financialYear}</span>
                </div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#DCFCE7] text-[#15803D] border border-[#BBF7D0]">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{tier.badge}</span>
                </div>
              </div>

              {/* Rating Score (4.00 / 5.00) */}
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-4xl sm:text-5xl font-black text-[#0B2568] tracking-tight leading-none">
                  {Number(animatedScore.toFixed(2))}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-400">/ 5</span>
              </div>

              {/* Five Gold Stars */}
              <div ref={starsRef} className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((idx) => (
                  <Star
                    key={idx}
                    className={`w-5 h-5 drop-shadow-xs ${
                      score >= idx
                        ? "text-amber-400 fill-amber-400"
                        : score >= idx - 0.5
                        ? "text-amber-400 fill-amber-200"
                        : "text-slate-200 fill-slate-100"
                    }`}
                  />
                ))}
              </div>

              {/* Headline with Live-Drawn Smile Underline */}
              <div className="relative inline-block mb-3.5">
                <h3 className="text-base sm:text-[17px] font-black text-[#0B2568] tracking-tight">
                  {tier.headline}
                </h3>
                <svg className="gsap-curve-underline absolute -bottom-1 left-0 w-full h-1.5 text-emerald-500 overflow-visible" viewBox="0 0 100 6" fill="none">
                  <path d="M2 4 Q 50 1, 98 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Feedback Quote Box with Green Bar */}
              <div
                ref={quoteRef}
                className="gsap-quote-card w-full flex items-start gap-2.5 p-3 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] text-left shadow-2xs"
              >
                <div className="gsap-quote-bar w-1 self-stretch rounded-full bg-[#10B981] shrink-0" />
                <span className="text-emerald-600 font-serif text-2xl font-black leading-none shrink-0 select-none -mt-1">“</span>
                <p className="text-[11.5px] font-medium text-slate-700 leading-relaxed italic">
                  "{tier.message}"
                </p>
              </div>
            </div>

            {/* Right Column (5 cols): 3D Trophy on Stepped Podium & Motivation Note */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center relative pt-2 md:pt-0">
              <div ref={trophyRef} className="relative">
                <svg viewBox="0 0 220 200" className="w-40 h-36 sm:w-48 sm:h-44 drop-shadow-md overflow-visible">
                  <defs>
                    <radialGradient id="cupGoldRef" cx="36%" cy="36%" r="68%">
                      <stop offset="0%" stopColor="#FFFDF0" />
                      <stop offset="25%" stopColor="#FEF08A" />
                      <stop offset="60%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#B45309" />
                    </radialGradient>
                    <linearGradient id="rimGoldRef" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#FEF08A" />
                      <stop offset="50%" stopColor="#F59E0B" />
                      <stop offset="100%" stopColor="#92400E" />
                    </linearGradient>
                    <linearGradient id="podiumWallRef" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#BFDBFE" />
                      <stop offset="100%" stopColor="#93C5FD" />
                    </linearGradient>
                    <linearGradient id="leafGradRef" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#34D399" />
                      <stop offset="100%" stopColor="#059669" />
                    </linearGradient>
                  </defs>

                  {/* Ground Shadow & Stepped Circular Podium */}
                  <ellipse cx="110" cy="180" rx="72" ry="11" fill="#94A3B8" opacity="0.3" />
                  <path d="M 38 158 C 38 170 182 170 182 158 L 182 166 C 182 178 38 178 38 166 Z" fill="url(#podiumWallRef)" />
                  <ellipse cx="110" cy="158" rx="72" ry="13" fill="#DBEAFE" stroke="#BFDBFE" strokeWidth="0.8" />
                  <path d="M 52 144 C 52 155 168 155 168 144 L 168 150 C 168 161 52 161 52 150 Z" fill="#E2E8F0" />
                  <ellipse cx="110" cy="144" rx="58" ry="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />
                  <ellipse cx="110" cy="143" rx="24" ry="5.5" fill="#1E293B" opacity="0.35" className="gsap-trophy-contact-shadow" />

                  {/* Smooth 3D Leaves */}
                  <g className="gsap-leaf-left">
                    <path d="M 40 152 C 18 140 14 114 28 100 C 34 116 42 134 40 152 Z" fill="url(#leafGradRef)" />
                    <path d="M 48 154 C 36 138 38 118 52 108 C 54 122 56 140 48 154 Z" fill="#34D399" />
                  </g>
                  <g className="gsap-leaf-right">
                    <path d="M 180 152 C 202 140 206 114 192 100 C 186 116 178 134 180 152 Z" fill="url(#leafGradRef)" />
                    <path d="M 172 154 C 184 138 182 118 168 108 C 166 122 164 140 172 154 Z" fill="#34D399" />
                  </g>

                  {/* Floating 3D Trophy Chalice Assembly */}
                  <g className="gsap-trophy-body">
                    <path d="M 90 120 L 130 120 L 134 140 L 86 140 Z" fill="#1E293B" rx="2" />
                    <rect x="94" y="126" width="32" height="8" rx="2" fill="#FDE047" stroke="#B45309" strokeWidth="0.6" />
                    <ellipse cx="110" cy="119" rx="14" ry="3" fill="url(#rimGoldRef)" />
                    <path d="M 103 103 C 103 114 100 118 101 119 L 119 119 C 120 118 117 114 117 103 Z" fill="url(#cupGoldRef)" />
                    <ellipse cx="110" cy="103" rx="12" ry="2.5" fill="url(#rimGoldRef)" />
                    <path d="M 86 56 C 58 56 56 86 86 92" stroke="url(#cupGoldRef)" strokeWidth="6.5" strokeLinecap="round" fill="none" />
                    <path d="M 86 56 C 60 56 58 84 86 90" stroke="#FFFBEB" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
                    <path d="M 134 56 C 162 56 164 86 134 92" stroke="url(#cupGoldRef)" strokeWidth="6.5" strokeLinecap="round" fill="none" />
                    <path d="M 134 56 C 160 56 162 84 134 90" stroke="#FFFBEB" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.8" />
                    <path d="M 82 48 C 82 90 95 102 110 102 C 125 102 138 90 138 48 Z" fill="url(#cupGoldRef)" />
                    <path d="M 86 51 C 86 84 95 94 105 97 C 101 94 93 85 93 51 Z" fill="#FFFFFF" opacity="0.45" />
                    <ellipse cx="110" cy="48" rx="28" ry="6.5" fill="url(#rimGoldRef)" stroke="#FFFBEB" strokeWidth="0.8" />
                    <ellipse cx="110" cy="48" rx="24" ry="4.5" fill="#92400E" />

                    {/* Prominent Chunky 3D Star on Cup */}
                    <g className="gsap-trophy-star" transform="translate(110, 74)">
                      <circle cx="0" cy="0" r="16" fill="#FEF08A" opacity="0.4" />
                      <polygon points="0,-15 4.5,-4.5 15,-4.5 6.8,2.6 9.8,13 0,6.8 -9.8,13 -6.8,2.6 -15,-4.5 -4.5,-4.5" fill="#FEF08A" stroke="#D97706" strokeWidth="1" />
                      <polygon points="0,-15 0,0 -4.5,-4.5" fill="#FFFBEB" />
                      <polygon points="15,-4.5 0,0 6.8,2.6" fill="#FDE047" />
                      <polygon points="9.8,13 0,0 0,6.8" fill="#F59E0B" />
                      <polygon points="-9.8,13 0,0 0,6.8" fill="#D97706" />
                      <polygon points="-15,-4.5 0,0 -6.8,2.6" fill="#B45309" />
                      <g className="gsap-trophy-flare" transform="translate(-9, -9)">
                        <polygon points="0,-6 1.8,-1.8 6,0 1.8,1.8 0,6 -1.8,1.8 -6,0 -1.8,-1.8" fill="#FFFFFF" />
                      </g>
                    </g>
                  </g>

                  {/* Confetti & Sparkles */}
                  <path className="gsap-confetti" d="M 174 36 Q 184 46 178 58" stroke="#0284C7" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path className="gsap-confetti" d="M 190 50 Q 198 60 192 72" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path className="gsap-confetti" d="M 44 40 Q 52 50 46 62" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <path className="gsap-confetti" d="M 32 76 Q 40 86 34 96" stroke="#F43F5E" strokeWidth="3" strokeLinecap="round" fill="none" />
                  <circle className="gsap-confetti" cx="168" cy="26" r="2.5" fill="#3B82F6" />
                  <circle className="gsap-confetti" cx="54" cy="32" r="2.5" fill="#FBBF24" />
                  <circle className="gsap-confetti" cx="184" cy="92" r="2.5" fill="#10B981" />
                  <g className="gsap-sparkle-star" transform="translate(176, 76)">
                    <polygon points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2" fill="#FDE047" />
                  </g>
                  <g className="gsap-sparkle-star" transform="translate(48, 82)">
                    <polygon points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2" fill="#38BDF8" />
                  </g>
                </svg>
              </div>

              {/* Stacked Handwritten Motivation Note from Reference Design */}
              <div className="gsap-success-badge flex items-center justify-center text-left mt-1 select-none">
                <div className="flex items-end gap-1 rotate-[-4deg]">
                  <p className="revealed-font-script text-xl sm:text-2xl font-bold text-[#1E3A8A] tracking-wide leading-[1.05]">
                    Small steps<br />create big<br />success!
                  </p>
                  <svg className="w-4 h-4 text-amber-500 overflow-visible shrink-0 mb-1" viewBox="0 0 16 16" fill="none">
                    <path d="M 4 12 L 10 3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 9 14 L 15 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Row: Security View Active (Full Width) */}
          <div ref={bottomRef} className="gsap-bottom-bar mt-5 pt-1 relative z-10 w-full">
            <div className="w-full bg-[#F8FAFC] border border-blue-100/90 rounded-2xl p-2.5 sm:p-3 flex items-center justify-between shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="gsap-shield-badge w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                  <Shield className="w-4 h-4 fill-white/20" />
                </div>
                <div>
                  <p className="text-xs font-bold text-[#0D2562] leading-tight">Security View Active</p>
                  <p className="text-[10px] text-slate-500 leading-tight">For security, this window automatically closes when the countdown reaches 0:00.</p>
                </div>
              </div>

              {/* Countdown Pill */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white border border-blue-200/80 text-xs font-mono font-bold text-blue-700 shadow-2xs shrink-0 ml-2">
                <Clock className="w-3.5 h-3.5 text-blue-600" />
                <span>Auto-closes in {formattedTime}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default RevealedRatingModal;
