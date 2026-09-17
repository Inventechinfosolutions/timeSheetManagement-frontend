import React from 'react';
import { Tooltip } from 'antd';
import { EyeClosed, Clock, Star } from 'lucide-react';
import { useRevealedRatings } from '../hooks/useRevealedRatings';

const RATING_LABEL_TO_SCORE: Record<string, string> = {
  outstanding: '5.0',
  'exceeds expectations': '4.0',
  'meets expectations': '3.0',
  'needs improvement': '2.0',
  unsatisfactory: '1.0',
};

export const formatToAverageScore = (rating: any, ratings?: any): string => {
  if (!rating && !ratings) return '—';

  // 1. Prioritize explicit numeric rating or label from backend (e.g. 1.2, "1.2")
  if (rating != null && rating !== '') {
    const rawStr = String(rating).trim();
    const num = parseFloat(rawStr);
    if (!isNaN(num) && /^\s*[\d.]+\s*$/.test(rawStr)) {
      return num.toFixed(1);
    }
    // If label like 'Outstanding', 'Exceeds Expectations'
    const lower = rawStr.toLowerCase();
    if (RATING_LABEL_TO_SCORE[lower]) {
      return RATING_LABEL_TO_SCORE[lower];
    }
    // Extract first decimal match (e.g. "Outstanding (5.0)")
    const match = rawStr.match(/\d+(\.\d+)?/);
    if (match) {
      return parseFloat(match[0]).toFixed(1);
    }
  }

  // 2. If category ratings object exists, compute average score across all 6 dimensions
  if (ratings) {
    let parsed: any = ratings;
    if (typeof parsed === 'string') {
      try {
        parsed = JSON.parse(parsed);
      } catch { }
    }
    if (parsed && typeof parsed === 'object') {
      const values = Object.values(parsed).map(Number).filter((scoreValue) => !isNaN(scoreValue));
      if (values.length > 0) {
        const sum = values.reduce((runningSum, scoreValue) => runningSum + scoreValue, 0);
        return (sum / Math.max(values.length, 6)).toFixed(1);
      }
    }
  }

  return '—';
};

export interface HiddenRatingBadgeProps {
  reviewId?: number | string | null;
  quarter?: string | null;
  employeeId?: string | null;
  initialEmail?: string | null;
  finalRating?: number | string | null;
  ratings?: any;
  isFinalRatingHidden?: boolean;
  hasFinalRating?: boolean;
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  emptyPlaceholder?: React.ReactNode;
  navigateOnSuccess?: boolean;
}

export const HiddenRatingBadge: React.FC<HiddenRatingBadgeProps> = ({
  reviewId,
  quarter,
  employeeId,
  initialEmail,
  finalRating,
  ratings,
  isFinalRatingHidden = false,
  hasFinalRating = false,
  label,
  className = '',
  emptyPlaceholder = <span className="text-slate-400 font-medium text-sm">—</span>,
  navigateOnSuccess = false,
}) => {
  const { isRevealed, getRevealedData, openAuthModal } = useRevealedRatings();

  const revealed = isRevealed(reviewId, quarter);
  const revealedData = revealed ? getRevealedData(reviewId, quarter) : null;
  const remainingSec = revealedData?.remainingSeconds ?? 0;

  // 1. If currently revealed via active 2-minute token
  if (revealed) {
    const rawRating = revealedData?.finalRating ?? finalRating;
    const rawRatings = revealedData?.ratings ?? ratings;
    const displayScore = formatToAverageScore(rawRating, rawRatings);

    const mins = Math.floor(remainingSec / 60);
    const secs = remainingSec % 60;
    const countdownText = `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
    const showTimer = remainingSec > 0;

    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-xs border border-emerald-200">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />
          <span>{displayScore}</span>
        </span>
        {showTimer && (
          <Tooltip title="This rating will automatically hide when the 2-minute verification timer expires.">
            {/* <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-bold">
              <Clock className="w-3 h-3 text-amber-600 animate-spin" style={{ animationDuration: '3s' }} />
              <span>{countdownText}</span>
            </span> */}
          </Tooltip>
        )}
      </div>
    );
  }

  // 2. If finalRating is available directly (e.g. for the evaluator who gave it)
  if (finalRating != null && finalRating !== '' && !isFinalRatingHidden) {
    const displayScore = formatToAverageScore(finalRating, ratings);

    return (
      <div className={`inline-flex items-center ${className}`}>
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100 shadow-2xs">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span>{displayScore}</span>
        </span>
      </div>
    );
  }

  // 3. If rating is hidden / requires identity verification
  if (isFinalRatingHidden || hasFinalRating) {
    const buttonText = label || 'Final Rating';
    return (
      <Tooltip title={`${buttonText} is hidden for confidentiality. Click to verify your registered email & password to view for 2 minutes.`}>
        <button
          type="button"
          onClick={(mouseEvent) => {
            mouseEvent.stopPropagation();
            openAuthModal({
              reviewId: reviewId ?? undefined,
              quarter: quarter ?? undefined,
              employeeId: employeeId ?? undefined,
              initialEmail: initialEmail ?? undefined,
              navigateOnSuccess,
            });
          }}
          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-50/90 hover:bg-indigo-100 border border-indigo-200/90 hover:border-indigo-300 text-indigo-700 hover:text-indigo-900 transition-all text-xs font-medium cursor-pointer shadow-2xs group ${className}`}
        >
          <EyeClosed className="w-3.5 h-3.5 text-indigo-600 group-hover:scale-110 transition-transform" />
          <span className="leading-tight">
            {buttonText}
          </span>
        </button>
      </Tooltip>
    );
  }

  // 4. Otherwise not yet evaluated / no rating
  return <>{emptyPlaceholder}</>;
};
