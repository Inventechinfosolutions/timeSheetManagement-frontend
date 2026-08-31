import React, { useEffect, useState } from 'react';
import ManagerReviewBoardDesktop from './QuarterlyReview';
import ManagerReviewBoardMobile from '../ManagerQuaterlyReviewmobileresponse/QuarterlyReviewmobile';

// Anything below this is "tab view" — phone or tablet width — and renders
// the responsive mobile/tablet board. At or above it, the true desktop
// board (no internal responsive fallback) takes over. Must match
// QUARTERLY_REVIEW_MOBILE_BREAKPOINT in ManagerLayout.tsx so the sidebar
// hides/shows in lockstep with this switch.
const MOBILE_BREAKPOINT = 1024;

type ViewMode = 'mobile' | 'desktop';

const QuarterlyReviewResponsive: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return 'desktop';
    return window.innerWidth < MOBILE_BREAKPOINT ? 'mobile' : 'desktop';
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleChange = () => {
      setViewMode(window.innerWidth < MOBILE_BREAKPOINT ? 'mobile' : 'desktop');
    };

    handleChange();

    const mediaQuery = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  if (viewMode === 'mobile') {
    return <ManagerReviewBoardMobile onBack={onBack} />;
  }

  return <ManagerReviewBoardDesktop onBack={onBack} />;
};

export default QuarterlyReviewResponsive;