import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Calendar, Star, X } from "lucide-react";
import { getRatingTierConfig } from "../../utils/appraisalHelpers";
import {
  animateRevealedModalEntrance,
  animateRevealedModalExit,
} from "../../animations/revealedRatingAnimations";
import {
  BronzeShieldIllustration,
  ChampionTrophyIllustration,
  MedalIllustration,
  SproutIllustration,
  StepsIllustration,
} from "../employee/RevealedRatingModal";

export type AppraisalMomentKind = "assigned" | "submitted" | "evaluated" | "forwarded";

interface AppraisalMomentCardProps {
  kind: AppraisalMomentKind;
  name: string;
  quarter?: string;
  financialYear?: string;
  /** Manager evaluation score — drives the 5 rating tiers on the evaluated card. */
  score?: number;
  /**
   * Who receives the employee submission for review.
   * EMPLOYEE assigner (appraisal mapping) → "Team Lead"; otherwise "manager".
   */
  reviewerLabel?: "manager" | "Team Lead";
  onClose: () => void;
}

const MOMENTS: Record<
  AppraisalMomentKind,
  {
    score: number;
    greeting: string;
    headline: string;
    badge: string;
    quote: string;
    lines: string[];
  }
> = {
  assigned: {
    score: 4.2,
    greeting: "All set,",
    headline: "Review assigned",
    badge: "ASSIGNED",
    quote:
      "Employees will receive the assignment email. They can fill their self-review and you'll be notified when they submit their review.",
    lines: ["The review", "is open", "for your team"],
  },
  submitted: {
    score: 3.2,
    greeting: "Well done,",
    headline: "Appraisal submitted",
    badge: "SUBMITTED",
    quote:
      "Your self-assessment has been submitted successfully and sent to your Team Lead for review.",
    lines: ["Sent to", "your Team Lead", "for review"],
  },
  evaluated: {
    score: 5,
    greeting: "Finalized,",
    headline: "Evaluation submitted",
    badge: "COMPLETED",
    quote: "The appraisal is finalized and shared with the employee.",
    lines: ["Final review", "submitted", "successfully"],
  },
  /** Employee-assigner submitted scores → waiting for manager final comment */
  forwarded: {
    score: 4.2,
    greeting: "Forwarded,",
    headline: "Sent for manager final review",
    badge: "AWAITING MANAGER",
    quote:
      "The evaluation has been reviewed and forwarded to the Reporting Manager for final comments and appraisal completion.",
    lines: ["Forwarded for", "manager final", "comment & review"],
  },
};

/** Manager-only copy for the evaluation success card — not the employee rating messages. */
const MANAGER_EVALUATED_COPY: Record<
  ReturnType<typeof getRatingTierConfig>["key"],
  { quote: string; lines: string[] }
> = {
  needs_improvement: {
    quote:
      "Evaluation submitted. Needs Improvement is finalized and shared with the employee.",
    lines: ["Final review", "submitted", "successfully"],
  },
  developing: {
    quote:
      "Evaluation submitted. Developing is finalized and shared with the employee.",
    lines: ["Final review", "submitted", "successfully"],
  },
  meets_expectations: {
    quote:
      "Evaluation submitted. Meets Expectations is finalized and shared with the employee.",
    lines: ["Final review", "submitted", "successfully"],
  },
  exceeds_expectations: {
    quote:
      "Evaluation submitted. Exceeds Expectations is finalized and shared with the employee.",
    lines: ["Final review", "submitted", "successfully"],
  },
  outstanding: {
    quote:
      "Evaluation submitted. Outstanding rating is finalized and shared with the employee.",
    lines: ["Final review", "submitted", "successfully"],
  },
};

const Art = ({ score }: { score: number }) => {
  const type = getRatingTierConfig(score).illustrationType;
  if (type === "champion_trophy") return <ChampionTrophyIllustration />;
  if (type === "medal") return <MedalIllustration />;
  if (type === "sprout") return <SproutIllustration />;
  if (type === "steps") return <StepsIllustration />;
  return <BronzeShieldIllustration />;
};

/** Same card as the rating reveal, used for the three success moments. */
const AppraisalMomentCard: React.FC<AppraisalMomentCardProps> = ({
  kind,
  name,
  quarter,
  financialYear,
  score: scoreProp,
  reviewerLabel = "manager",
  onClose,
}) => {
  const moment = MOMENTS[kind];
  const useRatingTier = kind === "evaluated" && scoreProp != null && Number.isFinite(scoreProp);
  const score = useRatingTier ? Number(scoreProp) : moment.score;
  const tier = getRatingTierConfig(score);
  const managerCopy = useRatingTier ? MANAGER_EVALUATED_COPY[tier.key] : null;
  const greeting = moment.greeting;
  const headline = moment.headline;
  const badge = useRatingTier ? tier.badge : moment.badge;
  const submittedQuote = `Your self-assessment has been submitted successfully and sent to your ${reviewerLabel} for review.`;
  const submittedLines = ["Sent to", `your ${reviewerLabel}`, "for review"];
  const quote =
    managerCopy?.quote ??
    (kind === "submitted" ? submittedQuote : moment.quote);
  const lines =
    managerCopy?.lines ??
    (kind === "submitted" ? submittedLines : moment.lines);
  const period = [quarter, financialYear ? `FY ${financialYear}` : ""].filter(Boolean).join(" • ");

  const cardRef = useRef<HTMLDivElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const quoteRef = useRef<HTMLDivElement>(null);
  const trophyRef = useRef<HTMLDivElement>(null);
  const isClosingRef = useRef(false);

  useEffect(() => {
    if (!cardRef.current) return;
    isClosingRef.current = false;
    return animateRevealedModalEntrance({
      card: cardRef.current,
      backdrop: backdropRef.current,
      trophyIcon: trophyRef.current,
      starsContainer: starsRef.current,
      quoteCard: quoteRef.current,
      bottomBar: null,
    });
  }, [kind, score, name]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;
    animateRevealedModalExit(cardRef.current, backdropRef.current, onClose);
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Playfair+Display:wght@700;800&display=swap');
        .revealed-font-script { font-family: 'Caveat', cursive, sans-serif; }
        .revealed-font-serif { font-family: 'Playfair Display', Georgia, serif; }
      `}</style>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
        <div
          ref={backdropRef}
          className="fixed inset-0 cursor-pointer"
          style={{
            backgroundColor: "rgba(30, 58, 138, 0.35)",
            backdropFilter: "blur(2.5px)",
            WebkitBackdropFilter: "blur(2.5px)",
          }}
          onClick={handleClose}
        />
        <div
          ref={cardRef}
          className={`relative z-10 w-full max-w-[640px] rounded-3xl bg-white text-[#0F172A] overflow-hidden ${tier.cardGlow} border border-slate-100 shadow-[0_24px_70px_-15px_rgba(15,23,42,0.22)] p-6 sm:p-7`}
          onClick={(event) => event.stopPropagation()}
        >
          <button
            type="button"
            onClick={handleClose}
            className="absolute top-3.5 right-3.5 z-30 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100/80 hover:text-slate-800"
            title="Close"
          >
            <X className="h-6 w-6 stroke-[2.4]" />
          </button>
          <div className={`pointer-events-none absolute top-0 right-0 h-full w-[55%] rounded-r-3xl bg-gradient-to-l ${tier.bgSwoosh}`} />
          <div className={`pointer-events-none absolute -top-16 -right-16 h-80 w-80 rounded-full blur-3xl ${tier.bgAura}`} />

          <div className="relative z-10 grid grid-cols-1 items-center gap-5 md:grid-cols-12">
            <div className="flex flex-col items-start text-left md:col-span-7">
              <div className={`mb-0.5 flex items-center gap-1.5 font-bold ${tier.greetingColor}`}>
                <svg className="h-3.5 w-3.5 shrink-0 overflow-visible" viewBox="0 0 16 16" fill="none">
                  <path className="gsap-burst-ray" d="M 5 12 L 2 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path className="gsap-burst-ray" d="M 12 14 L 8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <span className="revealed-font-script text-2xl font-bold leading-none">{greeting}</span>
                <svg className="h-3.5 w-3.5 shrink-0 overflow-visible" viewBox="0 0 16 16" fill="none">
                  <path className="gsap-burst-ray" d="M 11 12 L 14 7" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                  <path className="gsap-burst-ray" d="M 4 14 L 8 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="revealed-font-serif mb-3 text-3xl font-extrabold leading-none tracking-tight text-[#0B2568] sm:text-4xl">
                {name}
              </h2>
              <div className="mb-3 flex flex-wrap items-center gap-2">
                {period ? (
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#DBEAFE] bg-[#EFF6FF] px-3 py-1 text-xs font-bold text-[#1E40AF]">
                    <Calendar className="h-3.5 w-3.5 text-[#3B82F6]" />
                    <span>{period}</span>
                  </div>
                ) : null}
                <div
                  className={`gsap-tier-badge inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${tier.badgeBg} ${tier.badgeText} ${tier.badgeBorder}`}
                >
                  <Star className="h-3.5 w-3.5 fill-current" />
                  <span>{badge}</span>
                </div>
              </div>

              {useRatingTier ? (
                <>
                  <div className="mb-1.5 flex items-baseline gap-1.5">
                    <span className="text-4xl font-black leading-none tracking-tight text-[#0B2568] sm:text-5xl">
                      {Number(score.toFixed(2))}
                    </span>
                    <span className="text-base font-bold text-slate-400 sm:text-lg">/ 5</span>
                  </div>
                  <div
                    ref={starsRef}
                    className={`mb-2 flex items-center gap-1 ${
                      tier.starAnimation === "gentle-fill" ? "animate-pulse" : ""
                    }`}
                  >
                    {[1, 2, 3, 4, 5].map((idx) => {
                      const filled = score >= idx;
                      const half = !filled && score >= idx - 0.5;
                      return (
                        <Star
                          key={idx}
                          className={`h-5 w-5 drop-shadow-xs transition-all duration-300 ${
                            filled
                              ? tier.starFilledClass
                              : half
                                ? `${tier.starFilledClass} opacity-70`
                                : tier.starEmptyClass
                          }`}
                          fill="currentColor"
                        />
                      );
                    })}
                  </div>
                </>
              ) : null}

              <div className="relative mb-3.5 inline-block">
                <h3 className="text-base font-black tracking-tight text-[#0B2568] sm:text-[17px]">{headline}</h3>
                <svg
                  className={`gsap-curve-underline absolute -bottom-1 left-0 h-1.5 w-full overflow-visible ${tier.underlineColor}`}
                  viewBox="0 0 100 6"
                  fill="none"
                >
                  <path d="M2 4 Q 50 1, 98 5" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
              </div>
              <div
                ref={quoteRef}
                className={`gsap-quote-card flex w-full items-start gap-2.5 rounded-2xl border p-3 text-left ${tier.quoteBg} ${tier.quoteBorder}`}
              >
                <div className={`gsap-quote-bar w-1 self-stretch rounded-full ${tier.quoteBar}`} />
                <p className="text-[11.5px] font-medium italic leading-relaxed text-slate-700">"{quote}"</p>
              </div>
            </div>
            <div className="relative flex flex-col items-center justify-center pt-2 text-center md:col-span-5 md:pt-0">
              <div ref={trophyRef} className="relative">
                <Art score={score} />
              </div>
              <div className="gsap-success-badge mt-1 flex select-none items-center justify-center text-left">
                <p
                  className="revealed-font-script rotate-[-4deg] text-xl font-bold leading-[1.05] sm:text-2xl"
                  style={{ color: tier.accentHex }}
                >
                  {lines.map((line) => (
                    <React.Fragment key={line}>
                      {line}
                      <br />
                    </React.Fragment>
                  ))}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default AppraisalMomentCard;
