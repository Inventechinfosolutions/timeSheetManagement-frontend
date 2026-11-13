import { useMemo, useRef, type ReactNode } from "react";
import {
  Play,
  ArrowRight,
  Trophy,
  Sparkles,
  Clock3,
  CheckCircle2,
  Send,
  Eye,
  Quote,
  ClipboardCheck,
  Lock,
  AlertTriangle,
  KeyRound,
} from "lucide-react";
import {
  BronzeShieldIllustration,
  StepsIllustration,
} from "../Appraisal/components/employee/RevealedRatingModal";
import AppraisalLockedLockIcon from "./AppraisalLockedLockIcon";
import {
  APPRAISAL_DASH_STEPS,
  getAppraisalDashPhaseConfig,
  type AppraisalDashAlertIcon,
  type AppraisalDashCtaIcon,
  type AppraisalDashHero,
  type AppraisalDashPhase,
  type AppraisalDashPhaseIcon,
} from "./appraisalDashboardCardConfig";
import "./AppraisalDashboardCard.css";

export type { AppraisalDashPhase } from "./appraisalDashboardCardConfig";
export {
  resolveAppraisalDashPhase as resolveAppraisalPhase,
} from "./appraisalDashboardCardConfig";

export interface AppraisalDashboardCardProps {
  phase: AppraisalDashPhase;
  quarter?: string;
  financialYear?: string;
  deadline?: string;
  onOpen: () => void;
}

/** 3D clipboard badge — assigned / in-progress */
const ClipboardHero3D = () => (
  <div className="appr-dash-scene relative h-[88px] w-[88px]">
    <span className="appr-dash-orb absolute inset-2 rounded-3xl bg-violet-300/30 blur-xl" />
    <svg
      className="appr-dash-hero absolute inset-0 h-full w-full"
      viewBox="0 0 96 96"
      fill="none"
      aria-hidden
    >
      <defs>
        <linearGradient id="clipBoard" x1="20" y1="12" x2="76" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#DDD6FE" />
        </linearGradient>
        <linearGradient id="clipTop" x1="34" y1="8" x2="62" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#A78BFA" />
          <stop offset="1" stopColor="#6366F1" />
        </linearGradient>
        <filter id="softShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#1E1B4B" floodOpacity="0.35" />
        </filter>
      </defs>
      <g filter="url(#softShadow)">
        <rect x="22" y="18" width="52" height="62" rx="12" fill="url(#clipBoard)" />
        <rect x="30" y="34" width="36" height="5" rx="2.5" fill="#C4B5FD" />
        <rect x="30" y="44" width="28" height="5" rx="2.5" fill="#DDD6FE" />
        <rect x="30" y="54" width="32" height="5" rx="2.5" fill="#EDE9FE" />
        <rect x="34" y="10" width="28" height="16" rx="8" fill="url(#clipTop)" />
        <circle cx="48" cy="18" r="4" fill="#FDE68A" stroke="#F59E0B" strokeWidth="1.5" />
      </g>
      <circle cx="70" cy="70" r="12" fill="#FDE047" stroke="#FFFFFF" strokeWidth="3" />
      <path d="M65 70.5 L68.5 74 L76 66.5" stroke="#1E1B4B" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
    <span className="appr-dash-spark absolute right-1 top-2 text-amber-200">✦</span>
    <span className="appr-dash-spark appr-dash-spark-delay absolute bottom-3 left-1 text-violet-200">✦</span>
  </div>
);

/** 3D medal on podium — completed */
const MedalHero3D = () => (
  <div className="appr-dash-scene relative mx-auto h-[120px] w-[120px]">
    <span className="appr-dash-orb absolute left-1/2 top-8 h-16 w-16 -translate-x-1/2 rounded-full bg-sky-300/35 blur-2xl" />
    <svg className="appr-dash-medal absolute inset-0 h-full w-full" viewBox="0 0 160 160" fill="none" aria-hidden>
      <defs>
        <linearGradient id="medalFace" x1="40" y1="30" x2="120" y2="130" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="0.55" stopColor="#E2E8F0" />
          <stop offset="1" stopColor="#94A3B8" />
        </linearGradient>
        <linearGradient id="ribbonGrad" x1="70" y1="8" x2="95" y2="55" gradientUnits="userSpaceOnUse">
          <stop stopColor="#1E3A8A" />
          <stop offset="1" stopColor="#3B82F6" />
        </linearGradient>
        <linearGradient id="podiumGrad" x1="40" y1="110" x2="120" y2="150" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFFFF" />
          <stop offset="1" stopColor="#CBD5E1" />
        </linearGradient>
        <filter id="medalShadow" x="-30%" y="-30%" width="160%" height="160%">
          <feDropShadow dx="0" dy="10" stdDeviation="8" floodColor="#0F172A" floodOpacity="0.28" />
        </filter>
      </defs>
      <path d="M28 118 C18 100 28 78 48 88 C40 98 36 108 38 120 Z" fill="#93C5FD" opacity="0.85" />
      <path d="M132 118 C142 100 132 78 112 88 C120 98 124 108 122 120 Z" fill="#64748B" opacity="0.75" />
      <ellipse cx="80" cy="138" rx="46" ry="10" fill="#94A3B8" opacity="0.35" />
      <ellipse cx="80" cy="128" rx="40" ry="12" fill="url(#podiumGrad)" />
      <ellipse cx="80" cy="120" rx="28" ry="9" fill="#F8FAFC" stroke="#E2E8F0" />
      <g className="appr-dash-ribbon" filter="url(#medalShadow)">
        <path d="M68 18 L78 58 L88 18 Z" fill="url(#ribbonGrad)" />
        <path d="M78 18 L88 58 L98 18 Z" fill="#1D4ED8" opacity="0.9" />
      </g>
      <circle cx="80" cy="78" r="34" fill="url(#medalFace)" stroke="#CBD5E1" strokeWidth="2" filter="url(#medalShadow)" />
      <circle cx="80" cy="78" r="27" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3 3" opacity="0.7" />
      <path
        d="M80 58 L85.5 70.5 L99 72 L89 81.5 L91.5 95 L80 88 L68.5 95 L71 81.5 L61 72 L74.5 70.5 Z"
        fill="#1E3A8A"
      />
      <path
        d="M80 62 L84 71.5 L94 72.5 L86.5 79.5 L88.5 90 L80 84.5 L71.5 90 L73.5 79.5 L66 72.5 L76 71.5 Z"
        fill="#60A5FA"
        opacity="0.95"
      />
      <path d="M118 48 L120 54 L126 56 L120 58 L118 64 L116 58 L110 56 L116 54 Z" fill="#38BDF8" />
      <path d="M42 52 L43.5 56 L47.5 57.5 L43.5 59 L42 63 L40.5 59 L36.5 57.5 L40.5 56 Z" fill="#93C5FD" />
      <path d="M112 96 L113 99 L116 100 L113 101 L112 104 L111 101 L108 100 L111 99 Z" fill="#38BDF8" />
    </svg>
  </div>
);

/** Compact doc badge for submitted / under review */
const ReviewHero3D = () => (
  <div className="appr-dash-scene relative h-[88px] w-[88px]">
    <span className="appr-dash-orb absolute inset-3 rounded-full bg-amber-300/25 blur-xl" />
    <svg className="appr-dash-hero absolute inset-0 h-full w-full" viewBox="0 0 96 96" fill="none" aria-hidden>
      <defs>
        <linearGradient id="docGrad" x1="24" y1="16" x2="72" y2="84" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFFBEB" />
          <stop offset="1" stopColor="#FDE68A" />
        </linearGradient>
        <filter id="docShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.35" />
        </filter>
      </defs>
      <rect x="24" y="18" width="48" height="60" rx="10" fill="url(#docGrad)" filter="url(#docShadow)" />
      <rect x="32" y="32" width="32" height="4" rx="2" fill="#F59E0B" opacity="0.55" />
      <rect x="32" y="42" width="24" height="4" rx="2" fill="#FBBF24" opacity="0.45" />
      <rect x="32" y="52" width="28" height="4" rx="2" fill="#FCD34D" opacity="0.4" />
      <circle cx="68" cy="68" r="14" fill="#1E293B" stroke="#FDE68A" strokeWidth="3" />
      <path d="M62 68 L66.5 72.5 L75 63" stroke="#FDE68A" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  </div>
);

const PhaseIcon = ({ kind }: { kind: AppraisalDashPhaseIcon }) => {
  if (kind === "trophy") return <Trophy size={14} className="text-amber-200" />;
  if (kind === "send") return <Send size={13} className="text-amber-200" />;
  if (kind === "key") return <KeyRound size={13} className="text-amber-200" />;
  if (kind === "clock") return <Clock3 size={13} className="text-sky-200" />;
  if (kind === "lock") return <Lock size={13} className="text-rose-100" />;
  return <Play size={13} className="text-violet-200" />;
};

const HeroArt = ({ kind }: { kind: AppraisalDashHero }) => {
  if (kind === "shield") {
    return (
      <div className="appr-dash-scene relative mx-auto flex h-[140px] w-[160px] items-center justify-center overflow-visible">
        <span className="appr-dash-orb absolute left-1/2 top-10 h-20 w-20 -translate-x-1/2 rounded-full bg-amber-300/30 blur-2xl" />
        <div className="appr-dash-medal relative scale-[0.92] origin-center [&_svg]:!h-[132px] [&_svg]:!w-[148px]">
          <BronzeShieldIllustration />
        </div>
      </div>
    );
  }
  if (kind === "medal") return <MedalHero3D />;
  if (kind === "review") return <ReviewHero3D />;
  return <ClipboardHero3D />;
};

const CtaIcon = ({ kind }: { kind: AppraisalDashCtaIcon }) => {
  if (kind === "eye") return <Eye size={13} />;
  if (kind === "play") return <Play size={13} />;
  return <ArrowRight size={13} />;
};

const AlertGlyph = ({ kind }: { kind: AppraisalDashAlertIcon }) => {
  if (kind === "key") return <KeyRound size={14} className="mb-1.5 text-amber-200" />;
  return <AlertTriangle size={14} className="mb-1.5 text-amber-200" />;
};

const SideArt = ({ kind }: { kind: "steps" | "lock" | "none" }) => {
  if (kind === "lock") return <AppraisalLockedLockIcon />;
  if (kind === "steps") {
    return (
      <div className="appr-dash-steps-grow relative flex h-[120px] w-[130px] shrink-0 items-center justify-center overflow-visible">
        <div className="appr-dash-steps-scale pointer-events-none origin-center">
          <StepsIllustration />
        </div>
      </div>
    );
  }
  return null;
};

const StatusBar = ({ stepIndex }: { stepIndex: number }) => {
  const progress = ((stepIndex + 1) / APPRAISAL_DASH_STEPS.length) * 100;

  return (
    <div className="mt-auto w-full pt-3">
      <div className="mb-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/15">
        <div className="appr-dash-progress-fill h-full rounded-full" style={{ width: `${progress}%` }} />
      </div>
      <div className="flex items-center justify-between gap-1">
        {APPRAISAL_DASH_STEPS.map((label, index) => {
          const done = index <= stepIndex;
          const isActive = index === stepIndex;
          return (
            <div key={label} className="flex min-w-0 flex-1 flex-col items-center gap-1">
              <span
                className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-extrabold ${
                  done ? "bg-white text-[#1E293B]" : "bg-white/15 text-white/55"
                } ${isActive ? "appr-dash-step-active" : ""}`}
              >
                {done ? <CheckCircle2 size={12} strokeWidth={2.5} /> : index + 1}
              </span>
              <span className={`truncate text-[9px] font-bold uppercase tracking-wide ${done ? "text-white" : "text-white/40"}`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const BodyPanel = ({
  children,
  sideArt,
}: {
  children: ReactNode;
  sideArt: "steps" | "lock" | "none";
}) => (
  <div className="mt-3 flex flex-1 items-center gap-2.5">
    <div className="relative min-w-0 flex-1 rounded-2xl bg-white/12 p-3 ring-1 ring-white/20 backdrop-blur-md">
      {children}
    </div>
    <SideArt kind={sideArt} />
  </div>
);

const AppraisalDashboardCard = ({
  phase,
  quarter,
  financialYear,
  deadline,
  onOpen,
}: AppraisalDashboardCardProps) => {
  const meta = getAppraisalDashPhaseConfig(phase);
  const bodyRef = useRef<HTMLDivElement>(null);
  const period = useMemo(
    () => [quarter, financialYear ? `FY ${financialYear}` : ""].filter(Boolean).join(" · "),
    [quarter, financialYear],
  );
  const isRose = meta.theme === "rose";

  const handleMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = bodyRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 16;
    const rotateX = (0.5 - py) * 12;
    el.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(0)`;
  };

  const handleLeave = () => {
    const el = bodyRef.current;
    if (!el) return;
    el.style.transform = "rotateX(0deg) rotateY(0deg) translateZ(0)";
  };

  return (
    <button
      type="button"
      onClick={onOpen}
      onMouseMove={handleMove}
      onMouseLeave={handleLeave}
      className={`appr-dash-card group relative flex h-full w-full cursor-pointer flex-col overflow-visible rounded-3xl text-left text-white outline-none focus-visible:ring-2 ${
        isRose ? "focus-visible:ring-rose-400/50" : "focus-visible:ring-[#4318FF]/50"
      }`}
      aria-label={`${meta.title}. ${meta.cta}`}
    >
      <div
        ref={bodyRef}
        className={`appr-dash-card__body relative flex flex-1 flex-col overflow-hidden rounded-3xl bg-linear-to-br p-5 ${meta.shadow} ${meta.gradient}`}
        style={{ transition: "transform 0.12s ease-out" }}
      >
        <div className="pointer-events-none absolute -right-10 -top-12 h-44 w-44 rounded-full bg-white/15 blur-3xl" />
        <div
          className={`pointer-events-none absolute -bottom-16 -left-10 h-40 w-40 rounded-full blur-3xl ${
            isRose ? "bg-rose-300/25" : "bg-fuchsia-400/20"
          }`}
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-linear-to-t from-black/20 to-transparent" />
        <Sparkles size={12} className="appr-dash-spark absolute left-5 top-5 text-white/55" />
        <Sparkles size={10} className="appr-dash-spark appr-dash-spark-delay absolute right-16 top-8 text-white/40" />

        <div className="relative flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-1 flex-col items-start gap-1.5">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/12 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/95 shadow-sm ring-1 ring-white/20 backdrop-blur-md">
              <PhaseIcon kind={meta.phaseIcon} />
              {meta.eyebrow}
            </div>
            {period ? (
              <span className="appr-dash-period-badge inline-flex max-w-full items-center truncate rounded-full px-2.5 py-1 text-[11px] font-extrabold tracking-wide text-white">
                {period}
              </span>
            ) : null}
          </div>
          {meta.layout !== "completed" ? <HeroArt kind={meta.hero} /> : null}
        </div>

        {meta.layout === "completed" ? (
          <div className="relative mt-1 flex flex-1 flex-col items-center justify-center text-center">
            <HeroArt kind={meta.hero} />
            <h4 className="mt-0.5 text-lg font-extrabold tracking-tight">{meta.title}</h4>
            <p className="mt-1 max-w-[240px] text-xs font-medium leading-relaxed text-white/75">{meta.subtitle}</p>
          </div>
        ) : (
          <div className="relative mt-3 flex flex-1 flex-col">
            <h4 className="text-lg font-extrabold tracking-tight">{meta.title}</h4>
            <p className="mt-1 text-xs font-medium leading-relaxed text-white/75">{meta.subtitle}</p>
            {meta.showDeadline && deadline ? (
              <p className="mt-2 text-[10px] font-bold uppercase tracking-wide text-white/55">
                Deadline · {deadline}
              </p>
            ) : null}

            {meta.bodyKind === "quote" && meta.quote ? (
              <BodyPanel sideArt={meta.sideArt}>
                <Quote size={14} className="mb-1.5 text-violet-200/90" />
                <p className="text-[11px] font-semibold leading-relaxed text-white/95">{meta.quote}</p>
              </BodyPanel>
            ) : null}

            {meta.bodyKind === "alert" && meta.alertText ? (
              <BodyPanel sideArt={meta.sideArt}>
                {meta.alertIcon ? <AlertGlyph kind={meta.alertIcon} /> : null}
                <p className="text-[11px] font-semibold leading-relaxed text-white/95">{meta.alertText}</p>
              </BodyPanel>
            ) : null}

            {meta.showStatusBar ? <StatusBar stepIndex={meta.stepIndex} /> : null}
          </div>
        )}

        <div className="relative mt-4 flex items-center justify-between gap-2">
          <span
            className={`appr-dash-cta inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-bold shadow-lg ${
              isRose ? "text-[#9F1239]" : "text-[#1E1B4B]"
            }`}
          >
            <CtaIcon kind={meta.ctaIcon} />
            {meta.cta}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1.5 text-[12px] font-extrabold uppercase tracking-[0.14em] text-white ring-1 ring-white/35 backdrop-blur-sm shadow-md">
            {isRose ? (
              <Lock size={14} className="text-rose-100" strokeWidth={2.5} />
            ) : (
              <ClipboardCheck size={14} className="text-amber-200" strokeWidth={2.5} />
            )}
            Appraisal
          </span>
        </div>
      </div>
    </button>
  );
};

export default AppraisalDashboardCard;
