import { useLocation } from 'react-router-dom';
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { message } from 'antd';

export interface RevealedRatingData {
  reviewId: string | number;
  finalRating: string | number;
  ratings?: any;
  expiresAt: number;
  remainingSeconds: number;
  revealToken?: string;
}

interface RevealPayload {
  reviewId?: string | number;
  quarter?: string;
  employeeId?: string;
  email: string;
  password: string;
}

interface RevealedRatingsContextType {
  revealedRatings: Record<string | number, RevealedRatingData>;
  activeRevealToken: string | null;
  maxRemainingSeconds: number;
  isRevealed: (reviewId?: string | number | null, quarter?: string | null) => boolean;
  getRevealedData: (reviewId?: string | number | null, quarter?: string | null) => RevealedRatingData | null;
  revealRating: (payload: RevealPayload) => Promise<boolean>;
  lockAllRatings: () => void;
  modalState: {
    isOpen: boolean;
    reviewId?: string | number;
    quarter?: string;
    employeeId?: string;
    initialEmail?: string;
    onSuccess?: () => void;
    navigateOnSuccess?: boolean;
  };
  openAuthModal: (params: {
    reviewId?: string | number;
    quarter?: string;
    employeeId?: string;
    initialEmail?: string;
    onSuccess?: () => void;
    navigateOnSuccess?: boolean;
  }) => void;
  closeAuthModal: () => void;
}

const RevealedRatingsContext = createContext<RevealedRatingsContextType | null>(null);

export const RevealedRatingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const prevPathnameRef = React.useRef(location.pathname);

  const [activeRevealToken, setActiveRevealToken] = useState<string | null>(() => {
    // Only restore token if currently on the quarterly-ratings page
    if (typeof window !== 'undefined' && window.location.pathname.includes('quarterly-ratings')) {
      return sessionStorage.getItem('worksphere_reveal_token') || null;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('worksphere_reveal_token');
      sessionStorage.removeItem('worksphere_reveal_expires_at');
    }
    return null;
  });

  const [revealedRatings, setRevealedRatings] = useState<Record<string | number, RevealedRatingData>>(() => {
    if (typeof window !== 'undefined' && window.location.pathname.includes('quarterly-ratings')) {
      try {
        const storedExp = sessionStorage.getItem('worksphere_reveal_expires_at');
        const token = sessionStorage.getItem('worksphere_reveal_token');
        if (storedExp && token) {
          const expNum = parseInt(storedExp, 10);
          const now = Date.now();
          if (expNum > now) {
            const remaining = Math.max(0, Math.ceil((expNum - now) / 1000));
            return {
              ALL: {
                reviewId: 'ALL',
                finalRating: '',
                expiresAt: expNum,
                remainingSeconds: remaining,
                revealToken: token,
              },
            };
          }
        }
      } catch {}
    }
    return {};
  });

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    reviewId?: string | number;
    quarter?: string;
    employeeId?: string;
    initialEmail?: string;
    onSuccess?: () => void;
    navigateOnSuccess?: boolean;
  }>({ isOpen: false });

  // Whenever the user navigates away from quarterly-ratings to another page, immediately hide all ratings
  useEffect(() => {
    if (prevPathnameRef.current !== location.pathname) {
      const isNavigatingToRatings = location.pathname.includes('quarterly-ratings');
      if (!isNavigatingToRatings) {
        setRevealedRatings({});
        setActiveRevealToken(null);
        sessionStorage.removeItem('worksphere_reveal_token');
        sessionStorage.removeItem('worksphere_reveal_expires_at');
      }
      prevPathnameRef.current = location.pathname;
    }
  }, [location.pathname]);

  // Ticker to decrement seconds and clean up expired entries
  useEffect(() => {
    const interval = setInterval(() => {
      setRevealedRatings((prev) => {
        const now = Date.now();
        let changed = false;
        const next: Record<string | number, RevealedRatingData> = {};

        Object.entries(prev).forEach(([key, val]) => {
          if (val.expiresAt > now) {
            const remaining = Math.max(0, Math.ceil((val.expiresAt - now) / 1000));
            next[key] = { ...val, remainingSeconds: remaining };
            if (remaining !== val.remainingSeconds) changed = true;
          } else {
            // Expired! Automatically hides rating
            changed = true;
          }
        });

        if (Object.keys(next).length === 0 && activeRevealToken) {
          setActiveRevealToken(null);
          sessionStorage.removeItem('worksphere_reveal_token');
          sessionStorage.removeItem('worksphere_reveal_expires_at');
        }

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeRevealToken]);

  const normalizeQ = (q?: string | null) => (q || '').toUpperCase().replace(/[\s_-]/g, '');

  const isRevealed = useCallback(
    (reviewId?: string | number | null, quarter?: string | null) => {
      const now = Date.now();

      // 1. If a specific reviewId is being queried (e.g. single row in Quarterly Review History table)
      if (reviewId != null) {
        if (revealedRatings[reviewId] && revealedRatings[reviewId].expiresAt > now) {
          return true;
        }
        if (revealedRatings[String(reviewId)] && revealedRatings[String(reviewId)].expiresAt > now) {
          return true;
        }
        // Only if on the 4 quarters overview page and the full year was revealed
        if (location.pathname.includes('quarterly-ratings') && revealedRatings['ALL'] && revealedRatings['ALL'].expiresAt > now) {
          return true;
        }
        return false;
      }

      // 2. If a specific quarter is being queried without reviewId
      if (quarter) {
        const normQ = normalizeQ(quarter);
        if (revealedRatings[normQ] && revealedRatings[normQ].expiresAt > now) {
          return true;
        }
        if (location.pathname.includes('quarterly-ratings') && revealedRatings['ALL'] && revealedRatings['ALL'].expiresAt > now) {
          return true;
        }
        return false;
      }

      // 3. Overall reveal (e.g. called without parameters on quarterly-ratings page)
      if (revealedRatings['ALL'] && revealedRatings['ALL'].expiresAt > now) {
        return true;
      }

      return false;
    },
    [revealedRatings, location.pathname],
  );

  const getRevealedData = useCallback(
    (reviewId?: string | number | null, quarter?: string | null) => {
      const now = Date.now();

      if (reviewId != null) {
        if (revealedRatings[reviewId] && revealedRatings[reviewId].expiresAt > now) {
          return revealedRatings[reviewId];
        }
        if (revealedRatings[String(reviewId)] && revealedRatings[String(reviewId)].expiresAt > now) {
          return revealedRatings[String(reviewId)];
        }
        if (location.pathname.includes('quarterly-ratings') && revealedRatings['ALL'] && revealedRatings['ALL'].expiresAt > now) {
          return revealedRatings['ALL'];
        }
        return null;
      }

      if (quarter) {
        const normQ = normalizeQ(quarter);
        if (revealedRatings[normQ] && revealedRatings[normQ].expiresAt > now) {
          return revealedRatings[normQ];
        }
        if (location.pathname.includes('quarterly-ratings') && revealedRatings['ALL'] && revealedRatings['ALL'].expiresAt > now) {
          return revealedRatings['ALL'];
        }
        return null;
      }

      if (revealedRatings['ALL'] && revealedRatings['ALL'].expiresAt > now) {
        return revealedRatings['ALL'];
      }

      return null;
    },
    [revealedRatings, location.pathname],
  );

  const maxRemainingSeconds = Object.values(revealedRatings).reduce((max, item) => {
    return Math.max(max, item.remainingSeconds || 0);
  }, 0);

  const lockAllRatings = useCallback(() => {
    setRevealedRatings({});
    setActiveRevealToken(null);
    sessionStorage.removeItem('worksphere_reveal_token');
    sessionStorage.removeItem('worksphere_reveal_expires_at');
    message.info('Ratings locked and hidden.');
  }, []);

  const revealRating = useCallback(async (payload: RevealPayload): Promise<boolean> => {
    const res = await axios.post('/api/quarterly-review/reveal-rating', payload);
    if (res.data?.success && res.data?.data) {
      const { reviewId, quarter, finalRating, ratings, expiresAt, revealToken } = res.data.data;
      const remainingSeconds = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
      const item: RevealedRatingData = {
        reviewId,
        finalRating,
        ratings,
        expiresAt,
        remainingSeconds,
        revealToken,
      };

      if (revealToken) {
        setActiveRevealToken(revealToken);
        sessionStorage.setItem('worksphere_reveal_token', revealToken);
        sessionStorage.setItem('worksphere_reveal_expires_at', String(expiresAt));
      }

      const isYearLevel =
        (typeof payload.reviewId === 'string' && payload.reviewId.startsWith('year-')) ||
        (typeof reviewId === 'string' && reviewId.startsWith('year-'));

      setRevealedRatings((prev) => {
        const updated = { ...prev };
        if (reviewId != null) {
          updated[reviewId] = item;
          updated[String(reviewId)] = item;
        }
        if (payload.reviewId != null) {
          updated[payload.reviewId] = item;
          updated[String(payload.reviewId)] = item;
        }

        // Only reveal ALL or quarter-wide when unlocking the full year or explicitly navigating to overview
        if (isYearLevel || modalState.navigateOnSuccess) {
          updated['ALL'] = item;
          if (quarter) updated[normalizeQ(quarter)] = item;
          if (payload.quarter) updated[normalizeQ(payload.quarter)] = item;
        }
        return updated;
      });

      message.success('Identity verified. Rating unlocked for 2 minutes.');
      return true;
    }
    return false;
  }, [modalState.navigateOnSuccess]);

  const openAuthModal = useCallback(
    (params: {
      reviewId?: string | number;
      quarter?: string;
      employeeId?: string;
      initialEmail?: string;
      onSuccess?: () => void;
      navigateOnSuccess?: boolean;
    }) => {
      setModalState({
        isOpen: true,
        ...params,
      });
    },
    [],
  );

  const closeAuthModal = useCallback(() => {
    setModalState((previousState) => ({ ...previousState, isOpen: false }));
  }, []);

  return (
    <RevealedRatingsContext.Provider
      value={{
        revealedRatings,
        activeRevealToken,
        maxRemainingSeconds,
        isRevealed,
        getRevealedData,
        revealRating,
        lockAllRatings,
        modalState,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </RevealedRatingsContext.Provider>
  );
};

export const useRevealedRatings = () => {
  const context = useContext(RevealedRatingsContext);
  if (!context) {
    return {
      revealedRatings: {},
      activeRevealToken: null,
      maxRemainingSeconds: 0,
      isRevealed: () => false,
      getRevealedData: () => null,
      revealRating: async () => false,
      lockAllRatings: () => { },
      modalState: { isOpen: false },
      openAuthModal: () => { },
      closeAuthModal: () => { },
    };
  }
  return context;
};
