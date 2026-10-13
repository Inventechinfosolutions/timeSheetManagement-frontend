import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, Clock, Star, Shield, X } from "lucide-react";
import { useAppSelector } from "../../../hooks";
import {
  animateRevealedModalEntrance,
  animateRevealedModalExit,
} from "../../animations/revealedRatingAnimations";
import {
  getRatingTierConfig,
} from "../../utils/appraisalHelpers";

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

/**
 * 1.0–1.9: Sprout & Growth Path (Needs Improvement - Red/Coral)
 */
const SproutIllustration: React.FC = () => (
  <svg viewBox="0 0 220 200" className="w-40 h-36 sm:w-48 sm:h-44 drop-shadow-md overflow-visible">
    <defs>
      <linearGradient id="podiumSprout" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#EF4444" />
        <stop offset="100%" stopColor="#B91C1C" />
      </linearGradient>
      <linearGradient id="stemGrad" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#10B981" />
      </linearGradient>
      <linearGradient id="leafGradSprout" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#6EE7B7" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
      <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFF5F5" />
        <stop offset="60%" stopColor="#FEE2E2" stopOpacity="0.4" />
        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Ground Shadow & Stepped Terraced Podium */}
    <ellipse cx="110" cy="180" rx="72" ry="11" fill="#94A3B8" opacity="0.3" />
    <path d="M 38 158 C 38 170 182 170 182 158 L 182 166 C 182 178 38 178 38 166 Z" fill="url(#podiumSprout)" />
    <ellipse cx="110" cy="158" rx="72" ry="13" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1.2" />
    <path d="M 52 144 C 52 155 168 155 168 144 L 168 150 C 168 161 52 161 52 150 Z" fill="#F1F5F9" />
    <ellipse cx="110" cy="144" rx="58" ry="11" fill="#FFFFFF" stroke="#DC2626" strokeWidth="1" />

    {/* Stepping Stones / Growth Trail */}
    <g className="gsap-trophy-body">
      <ellipse cx="88" cy="148" rx="9" ry="3.5" fill="#CBD5E1" />
      <ellipse cx="106" cy="143" rx="10" ry="4" fill="#94A3B8" />
      <ellipse cx="128" cy="138" rx="11" ry="4.5" fill="#CBD5E1" />

      {/* Sun / Aura of Opportunity */}
      <circle cx="110" cy="72" r="42" fill="url(#sunGlow)" />

      {/* Curving Upward Sprout Stem */}
      <path
        d="M 110 142 C 108 116 114 96 110 68"
        stroke="url(#stemGrad)"
        strokeWidth="6.5"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 110 142 C 109 116 113 96 110 68"
        stroke="#A7F3D0"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        opacity="0.6"
      />

      {/* Left Fresh Leaf */}
      <g className="gsap-leaf-left">
        <path d="M 108 102 C 84 94 72 74 88 58 C 96 74 104 90 108 102 Z" fill="url(#leafGradSprout)" />
        <path d="M 106 100 C 94 88 88 78 92 68" stroke="#D1FAE5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      {/* Right Budding Leaf */}
      <g className="gsap-leaf-right">
        <path d="M 111 88 C 135 80 146 62 130 46 C 122 62 115 76 111 88 Z" fill="url(#leafGradSprout)" />
        <path d="M 113 86 C 125 76 130 66 126 56" stroke="#D1FAE5" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      </g>

      {/* Top New Shoot Sprout Leaf */}
      <g className="gsap-trophy-star" transform="translate(110, 64)">
        <path d="M 0 0 C -6 -14 0 -22 0 -24 C 0 -22 6 -14 0 0 Z" fill="#34D399" />
        <circle cx="0" cy="-24" r="2.5" fill="#DC2626" />
      </g>
    </g>

    {/* Gentle Floating Spores & Rising Accents */}
    <circle className="gsap-confetti" cx="68" cy="88" r="3" fill="#DC2626" />
    <circle className="gsap-confetti" cx="152" cy="76" r="2.5" fill="#10B981" />
    <circle className="gsap-confetti" cx="164" cy="112" r="3" fill="#EF4444" />
    <path className="gsap-confetti" d="M 60 120 Q 66 110 62 100" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path className="gsap-confetti" d="M 158 50 Q 164 42 160 34" stroke="#DC2626" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * 2.0–2.9: Ascending Steps & Progress Arrow (Developing - Vibrant Orange)
 */
const StepsIllustration: React.FC = () => (
  <svg viewBox="0 0 220 200" className="w-40 h-36 sm:w-48 sm:h-44 drop-shadow-md overflow-visible">
    <defs>
      <linearGradient id="podiumOrange" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="100%" stopColor="#FDBA74" />
      </linearGradient>
      <linearGradient id="arrowGrad" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#EA580C" />
        <stop offset="50%" stopColor="#F97316" />
        <stop offset="100%" stopColor="#FDBA74" />
      </linearGradient>
      <linearGradient id="stepTop1" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FFEDD5" />
        <stop offset="100%" stopColor="#FED7AA" />
      </linearGradient>
      <linearGradient id="stepTop2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FED7AA" />
        <stop offset="100%" stopColor="#FDBA74" />
      </linearGradient>
      <linearGradient id="stepTop3" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#FDBA74" />
        <stop offset="100%" stopColor="#FB923C" />
      </linearGradient>
    </defs>

    {/* Ground Shadow & Stepped Circular Base */}
    <ellipse cx="110" cy="180" rx="72" ry="11" fill="#94A3B8" opacity="0.3" />
    <path d="M 38 158 C 38 170 182 170 182 158 L 182 166 C 182 178 38 178 38 166 Z" fill="url(#podiumOrange)" />
    <ellipse cx="110" cy="158" rx="72" ry="13" fill="#FFEDD5" stroke="#FED7AA" strokeWidth="0.8" />

    {/* 3D Ascending Stair Steps */}
    <g className="gsap-trophy-body">
      {/* Step 1 (Low) */}
      <path d="M 58 136 L 86 122 L 86 142 L 58 154 Z" fill="#EA580C" />
      <path d="M 86 122 L 102 130 L 102 150 L 86 142 Z" fill="#C2410C" />
      <polygon points="58,136 86,122 102,130 74,144" fill="url(#stepTop1)" stroke="#FED7AA" strokeWidth="0.8" />

      {/* Step 2 (Mid) */}
      <path d="M 82 116 L 110 102 L 110 126 L 82 138 Z" fill="#EA580C" />
      <path d="M 110 102 L 126 110 L 126 134 L 110 126 Z" fill="#C2410C" />
      <polygon points="82,116 110,102 126,110 98,124" fill="url(#stepTop2)" stroke="#FDBA74" strokeWidth="0.8" />

      {/* Step 3 (High Goal) */}
      <path d="M 106 94 L 134 80 L 134 108 L 106 120 Z" fill="#EA580C" />
      <path d="M 134 80 L 150 88 L 150 116 L 134 108 Z" fill="#9A3412" />
      <polygon points="106,94 134,80 150,88 122,102" fill="url(#stepTop3)" stroke="#F97316" strokeWidth="0.8" />

      {/* Upward Curved 3D Progress Arrow */}
      <path
        d="M 52 134 C 68 116 104 88 144 54"
        stroke="url(#arrowGrad)"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M 52 134 C 68 116 104 88 144 54"
        stroke="#FFFBEB"
        strokeWidth="2.5"
        strokeLinecap="round"
        fill="none"
        opacity="0.8"
      />

      {/* Arrow Head at Top */}
      <polygon points="142,42 162,54 138,64" fill="#F97316" stroke="#EA580C" strokeWidth="1" />

      {/* Goal Star on Peak Step */}
      <g className="gsap-trophy-star" transform="translate(136, 74)">
        <polygon points="0,-12 3.6,-3.6 12,-3.6 5.4,2.1 7.8,10.4 0,5.4 -7.8,10.4 -5.4,2.1 -12,-3.6 -3.6,-3.6" fill="#FDBA74" stroke="#EA580C" strokeWidth="1" />
        <g className="gsap-trophy-flare" transform="translate(-6, -6)">
          <polygon points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5" fill="#FFFFFF" />
        </g>
      </g>
    </g>

    {/* Sparkles & Momentum Indicators */}
    <circle className="gsap-confetti" cx="168" cy="46" r="3" fill="#F97316" />
    <circle className="gsap-confetti" cx="48" cy="98" r="2.5" fill="#FB923C" />
    <g className="gsap-sparkle-star" transform="translate(162, 86)">
      <polygon points="0,-4 1.2,-1.2 4,0 1.2,1.2 0,4 -1.2,1.2 -4,0 -1.2,-1.2" fill="#FED7AA" />
    </g>
    <path className="gsap-confetti" d="M 172 104 Q 180 114 174 124" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * 3.0–3.9: Classic 3D Trophy on Stepped Podium (Meets Expectations - Mint/Green)
 */
const TrophyIllustration: React.FC = () => (
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
);

/**
 * 4.0–4.5: Award Medal with Laurel Leaves (Exceeds Expectations - Emerald/Teal)
 */
const MedalIllustration: React.FC = () => (
  <svg viewBox="0 0 220 200" className="w-40 h-36 sm:w-48 sm:h-44 drop-shadow-md overflow-visible">
    <defs>
      <linearGradient id="podiumTeal" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#99F6E4" />
        <stop offset="100%" stopColor="#5EEAD4" />
      </linearGradient>
      <radialGradient id="medalGold" cx="35%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#FFFBEB" />
        <stop offset="30%" stopColor="#FDE047" />
        <stop offset="70%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#B45309" />
      </radialGradient>
      <linearGradient id="ribbonTeal" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0D9488" />
        <stop offset="100%" stopColor="#042F2E" />
      </linearGradient>
      <linearGradient id="laurelGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#34D399" />
        <stop offset="100%" stopColor="#059669" />
      </linearGradient>
    </defs>

    {/* Ground Shadow & Stepped Circular Podium */}
    <ellipse cx="110" cy="180" rx="72" ry="11" fill="#94A3B8" opacity="0.3" />
    <path d="M 38 158 C 38 170 182 170 182 158 L 182 166 C 182 178 38 178 38 166 Z" fill="url(#podiumTeal)" />
    <ellipse cx="110" cy="158" rx="72" ry="13" fill="#CCFBF1" stroke="#99F6E4" strokeWidth="0.8" />
    <path d="M 52 144 C 52 155 168 155 168 144 L 168 150 C 168 161 52 161 52 150 Z" fill="#E2E8F0" />
    <ellipse cx="110" cy="144" rx="58" ry="11" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.8" />

    {/* Laurel Leaves Wreath Framing */}
    <g className="gsap-leaf-left">
      <path d="M 38 148 C 22 134 20 106 36 82 C 40 98 48 126 46 148 Z" fill="url(#laurelGrad)" />
      <path d="M 46 128 C 34 116 34 96 48 84 C 52 98 52 116 46 128 Z" fill="#34D399" />
      <circle cx="34" cy="88" r="3" fill="#FDE047" />
    </g>
    <g className="gsap-leaf-right">
      <path d="M 182 148 C 198 134 200 106 184 82 C 180 98 172 126 174 148 Z" fill="url(#laurelGrad)" />
      <path d="M 174 128 C 186 116 186 96 172 84 C 168 98 168 116 174 128 Z" fill="#34D399" />
      <circle cx="186" cy="88" r="3" fill="#FDE047" />
    </g>

    {/* Hanging Neck Ribbon */}
    <g className="gsap-trophy-body">
      <polygon points="92,34 104,80 110,80 100,34" fill="url(#ribbonTeal)" />
      <polygon points="128,34 116,80 110,80 120,34" fill="url(#ribbonTeal)" />

      {/* Gold Medal Disc Assembly */}
      <circle cx="110" cy="98" r="36" fill="url(#medalGold)" stroke="#FFFBEB" strokeWidth="2.5" />
      <circle cx="110" cy="98" r="30" fill="none" stroke="#B45309" strokeWidth="1.5" strokeDasharray="3 2" />

      {/* Embossed 3D Star on Medal with Gentle Star-Fill Glow */}
      <g className="gsap-trophy-star" transform="translate(110, 98)">
        <circle cx="0" cy="0" r="18" fill="#FEF08A" opacity="0.3" />
        <polygon points="0,-16 4.8,-4.8 16,-4.8 7.2,2.8 10.4,14 0,7.2 -10.4,14 -7.2,2.8 -16,-4.8 -4.8,-4.8" fill="#FFFBEB" stroke="#D97706" strokeWidth="1" />
        <polygon points="0,-16 0,0 -4.8,-4.8" fill="#FFFFFF" />
        <polygon points="16,-4.8 0,0 7.2,2.8" fill="#FDE047" />
        <polygon points="10.4,14 0,0 0,7.2" fill="#F59E0B" />
        <polygon points="-10.4,14 0,0 0,7.2" fill="#D97706" />
        <polygon points="-16,-4.8 0,0 -7.2,2.8" fill="#B45309" />
        <g className="gsap-trophy-flare" transform="translate(-8, -8)">
          <polygon points="0,-6 1.8,-1.8 6,0 1.8,1.8 0,6 -1.8,1.8 -6,0 -1.8,-1.8" fill="#FFFFFF" />
        </g>
      </g>
    </g>

    {/* Confetti & Sparkles */}
    <circle className="gsap-confetti" cx="166" cy="38" r="3" fill="#0D9488" />
    <circle className="gsap-confetti" cx="54" cy="46" r="3" fill="#F59E0B" />
    <circle className="gsap-confetti" cx="178" cy="98" r="2.5" fill="#10B981" />
    <path className="gsap-confetti" d="M 186 52 Q 192 64 186 76" stroke="#0D9488" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    <path className="gsap-confetti" d="M 34 68 Q 42 78 36 88" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
  </svg>
);

/**
 * 4.6–5.0: Premium Golden Champion Trophy (Outstanding - Gold)
 */
const ChampionTrophyIllustration: React.FC = () => (
  <svg viewBox="0 0 220 200" className="w-40 h-36 sm:w-48 sm:h-44 drop-shadow-lg overflow-visible">
    <defs>
      <radialGradient id="cupGoldGrand" cx="36%" cy="36%" r="68%">
        <stop offset="0%" stopColor="#FFFFFF" />
        <stop offset="20%" stopColor="#FEF08A" />
        <stop offset="55%" stopColor="#F59E0B" />
        <stop offset="100%" stopColor="#92400E" />
      </radialGradient>
      <linearGradient id="podiumGoldGrand" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#FEF08A" />
        <stop offset="100%" stopColor="#F59E0B" />
      </linearGradient>
      <radialGradient id="spotlightGlow" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#F59E0B" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
      </radialGradient>
    </defs>

    {/* Bright Golden Spotlight Aura */}
    <circle cx="110" cy="85" r="75" fill="url(#spotlightGlow)" />

    {/* Ground Shadow & Stepped Circular Gold Podium */}
    <ellipse cx="110" cy="180" rx="74" ry="12" fill="#78350F" opacity="0.3" />
    <path d="M 36 156 C 36 170 184 170 184 156 L 184 166 C 184 180 36 180 36 166 Z" fill="url(#podiumGoldGrand)" />
    <ellipse cx="110" cy="156" rx="74" ry="14" fill="#FEF9C3" stroke="#FDE047" strokeWidth="1" />
    <path d="M 50 142 C 50 154 170 154 170 142 L 170 148 C 170 160 50 160 50 148 Z" fill="#FDE047" />
    <ellipse cx="110" cy="142" rx="60" ry="12" fill="#FFFFFF" stroke="#FEF08A" strokeWidth="1" />

    {/* Trophy Chalice Assembly */}
    <g className="gsap-trophy-body">
      {/* Base Pedestal */}
      <path d="M 86 118 L 134 118 L 138 140 L 82 140 Z" fill="#78350F" rx="3" />
      <rect x="92" y="124" width="36" height="10" rx="2" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />

      {/* Stem & Gold Bands */}
      <path d="M 102 98 C 102 112 98 116 100 118 L 120 118 C 122 116 118 112 118 98 Z" fill="url(#cupGoldGrand)" />

      {/* Dual Royal Scrolled Handles */}
      <path d="M 82 50 C 46 50 44 88 82 96" stroke="url(#cupGoldGrand)" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M 82 50 C 48 50 46 86 82 94" stroke="#FFFBEB" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />
      <path d="M 138 50 C 174 50 176 88 138 96" stroke="url(#cupGoldGrand)" strokeWidth="8" strokeLinecap="round" fill="none" />
      <path d="M 138 50 C 172 50 174 86 138 94" stroke="#FFFBEB" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.9" />

      {/* Grand Cup Body */}
      <path d="M 78 42 C 78 88 94 100 110 100 C 126 100 142 88 142 42 Z" fill="url(#cupGoldGrand)" />
      <ellipse cx="110" cy="42" rx="32" ry="7.5" fill="url(#cupGoldGrand)" stroke="#FFFBEB" strokeWidth="1" />

      {/* Royal Crown Crest on Rim */}
      <polygon points="100,40 105,32 110,38 115,32 120,40" fill="#FEF08A" stroke="#D97706" strokeWidth="0.8" />
      <circle cx="105" cy="31" r="1.5" fill="#EF4444" />
      <circle cx="110" cy="37" r="1.5" fill="#3B82F6" />
      <circle cx="115" cy="31" r="1.5" fill="#10B981" />

      {/* Diamond Star with Sparkle Flares */}
      <g className="gsap-trophy-star" transform="translate(110, 70)">
        <circle cx="0" cy="0" r="18" fill="#FEF08A" opacity="0.5" />
        <polygon points="0,-16 4.8,-4.8 16,-4.8 7.2,2.8 10.4,14 0,7.2 -10.4,14 -7.2,2.8 -16,-4.8 -4.8,-4.8" fill="#FFFBEB" stroke="#B45309" strokeWidth="1.2" />
        <polygon points="0,-16 0,0 -4.8,-4.8" fill="#FFFFFF" />
        <polygon points="16,-4.8 0,0 7.2,2.8" fill="#FDE047" />
        <polygon points="10.4,14 0,0 0,7.2" fill="#F59E0B" />
        <polygon points="-10.4,14 0,0 0,7.2" fill="#D97706" />
        <polygon points="-16,-4.8 0,0 -7.2,2.8" fill="#92400E" />
        <g className="gsap-trophy-flare" transform="translate(-9, -9)">
          <polygon points="0,-7 2,-2 7,0 2,2 0,7 -2,2 -7,0 -2,-2" fill="#FFFFFF" />
        </g>
        <g className="gsap-trophy-flare" transform="translate(9, -9)">
          <polygon points="0,-6 1.8,-1.8 6,0 1.8,1.8 0,6 -1.8,1.8 -6,0 -1.8,-1.8" fill="#FFFFFF" />
        </g>
      </g>
    </g>

    {/* Celebratory Sparkles & Streamers */}
    <path className="gsap-confetti" d="M 180 34 Q 190 44 184 56" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path className="gsap-confetti" d="M 194 54 Q 202 66 196 78" stroke="#EAB308" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path className="gsap-confetti" d="M 38 38 Q 46 48 40 60" stroke="#F59E0B" strokeWidth="3" strokeLinecap="round" fill="none" />
    <path className="gsap-confetti" d="M 28 72 Q 36 82 30 92" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" fill="none" />
    <circle className="gsap-confetti" cx="174" cy="22" r="3" fill="#F59E0B" />
    <circle className="gsap-confetti" cx="46" cy="28" r="3" fill="#EAB308" />
    <circle className="gsap-confetti" cx="192" cy="98" r="3" fill="#10B981" />
    <g className="gsap-sparkle-star" transform="translate(182, 70)">
      <polygon points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5" fill="#FDE047" />
    </g>
    <g className="gsap-sparkle-star" transform="translate(40, 80)">
      <polygon points="0,-5 1.5,-1.5 5,0 1.5,1.5 0,5 -1.5,1.5 -5,0 -1.5,-1.5" fill="#FDE047" />
    </g>
  </svg>
);

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
  const tier = getRatingTierConfig(score);
  const m = Math.floor(secondsRemaining / 60);
  const s = secondsRemaining % 60;
  const formattedTime = `${m}:${s < 10 ? "0" : ""}${s}`;

  const renderIllustration = () => {
    switch (tier.illustrationType) {
      case "sprout":
        return <SproutIllustration />;
      case "steps":
        return <StepsIllustration />;
      case "medal":
        return <MedalIllustration />;
      case "champion_trophy":
        return <ChampionTrophyIllustration />;
      case "trophy":
      default:
        return <TrophyIllustration />;
    }
  };

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
        body.modal-open-active .aside,
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

        {/* Modal Card - Dynamic 2-Column Exact Layout based on employee rating out of 5 */}
        <div
          ref={cardRef}
          className={`relative z-10 w-full max-w-[640px] rounded-3xl bg-white text-[#0F172A] overflow-hidden ${tier.cardGlow} border border-slate-100 shadow-[0_24px_70px_-15px_rgba(15,23,42,0.22)] p-6 sm:p-7`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close 'X' Button at Top Right */}
          <button
            type="button"
            onClick={handleAnimatedClose}
            className="absolute top-3.5 right-3.5 z-30 w-10 h-10 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-100/80 active:scale-90 transition-all cursor-pointer"
            title="Close dialog"
          >
            <X className="w-6 h-6 stroke-[2.4]" />
          </button>

          {/* Dynamic Curved Swoosh Background across Right Half */}
          <div className={`absolute top-0 right-0 w-[55%] h-full bg-gradient-to-l ${tier.bgSwoosh} pointer-events-none rounded-r-3xl`} />
          <div className={`absolute -top-16 -right-16 w-80 h-80 rounded-full ${tier.bgAura} blur-3xl pointer-events-none`} />

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center relative z-10">
            {/* Left Column (7 cols): Greeting, Name, Badges, Score, Stars, Headline, Quote */}
            <div className="md:col-span-7 flex flex-col items-start text-left">
              {/* Handwritten Greeting with Festive Ray Accents */}
              <div className={`flex items-center gap-1.5 font-bold mb-0.5 ${tier.greetingColor}`}>
                <svg className="w-3.5 h-3.5 overflow-visible shrink-0" viewBox="0 0 16 16" fill="none">
                  <path className="gsap-burst-ray" d="M 5 12 L 2 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path className="gsap-burst-ray" d="M 12 14 L 8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="revealed-font-script text-2xl font-bold leading-none">
                  {tier.greetingText}
                </span>
                <svg className="w-3.5 h-3.5 overflow-visible shrink-0" viewBox="0 0 16 16" fill="none">
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
                <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${tier.badgeBg} ${tier.badgeText} border ${tier.badgeBorder}`}>
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span>{tier.badge}</span>
                </div>
              </div>

              {/* Rating Score */}
              <div className="flex items-baseline gap-1.5 mb-1.5">
                <span className="text-4xl sm:text-5xl font-black text-[#0B2568] tracking-tight leading-none">
                  {Number(animatedScore.toFixed(2))}
                </span>
                <span className="text-base sm:text-lg font-bold text-slate-400">/ 5</span>
              </div>

              {/* Five Rating Stars */}
              <div ref={starsRef} className={`flex items-center gap-1 mb-2 ${tier.starAnimation === "gentle-fill" ? "animate-pulse" : ""}`}>
                {[1, 2, 3, 4, 5].map((idx) => (
                  <Star
                    key={idx}
                    className={`w-5 h-5 drop-shadow-xs transition-all duration-300 ${
                      score >= idx
                        ? tier.starFilledClass
                        : score >= idx - 0.5
                        ? `${tier.starFilledClass} opacity-70`
                        : tier.starEmptyClass
                    }`}
                  />
                ))}
              </div>

              {/* Headline with Live-Drawn Smile Underline */}
              <div className="relative inline-block mb-3.5">
                <h3 className="text-base sm:text-[17px] font-black text-[#0B2568] tracking-tight">
                  {tier.headline}
                </h3>
                <svg className={`gsap-curve-underline absolute -bottom-1 left-0 w-full h-1.5 ${tier.underlineColor} overflow-visible`} viewBox="0 0 100 6" fill="none">
                  <path d="M2 4 Q 50 1, 98 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>

              {/* Feedback Quote Box */}
              <div
                ref={quoteRef}
                className={`gsap-quote-card w-full flex items-start gap-2.5 p-3 rounded-2xl ${tier.quoteBg} border ${tier.quoteBorder} text-left shadow-2xs`}
              >
                <div className={`gsap-quote-bar w-1 self-stretch rounded-full ${tier.quoteBar} shrink-0`} />
                <span className={`${tier.greetingColor} font-serif text-2xl font-black leading-none shrink-0 select-none -mt-1`}>“</span>
                <p className="text-[11.5px] font-medium text-slate-700 leading-relaxed italic">
                  "{tier.quoteMessage}"
                </p>
              </div>
            </div>

            {/* Right Column (5 cols): Dynamic 3D Illustration & Hand-Lettered Motivation Note */}
            <div className="md:col-span-5 flex flex-col items-center justify-center text-center relative pt-2 md:pt-0">
              <div ref={trophyRef} className="relative">
                {renderIllustration()}
              </div>

              {/* Stacked Handwritten Motivation Note */}
              <div className="gsap-success-badge flex items-center justify-center text-left mt-1 select-none">
                <div className="flex items-end gap-1 rotate-[-4deg]">
                  <p className="revealed-font-script text-xl sm:text-2xl font-bold tracking-wide leading-[1.05]" style={{
                    color: tier.theme === "coral" ? "#BE123C" : tier.theme === "amber" ? "#B45309" : tier.theme === "mint" ? "#15803D" : tier.theme === "emerald" ? "#0F766E" : "#854D0E"
                  }}>
                    {tier.motivationalLines.map((line, idx) => (
                      <React.Fragment key={idx}>
                        {line}
                        {idx < tier.motivationalLines.length - 1 && <br />}
                      </React.Fragment>
                    ))}
                  </p>
                  <svg className="w-4 h-4 overflow-visible shrink-0 mb-1" style={{
                    color: tier.theme === "coral" ? "#F43F5E" : tier.theme === "amber" ? "#F59E0B" : tier.theme === "mint" ? "#10B981" : tier.theme === "emerald" ? "#0D9488" : "#EAB308"
                  }} viewBox="0 0 16 16" fill="none">
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
