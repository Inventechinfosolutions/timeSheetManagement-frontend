import { useLocation } from 'react-router-dom';
﻿import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  isRevealed: (reviewId?: string | number | null, quarter?: string | null) => boolean;
  getRevealedData: (reviewId?: string | number | null, quarter?: string | null) => RevealedRatingData | null;
  revealRating: (payload: RevealPayload) => Promise<boolean>;
  modalState: {
    isOpen: boolean;
    reviewId?: string | number;
    quarter?: string;
    employeeId?: string;
    initialEmail?: string;
  };
  openAuthModal: (params: {
    reviewId?: string | number;
    quarter?: string;
    employeeId?: string;
    initialEmail?: string;
  }) => void;
  closeAuthModal: () => void;
}

const RevealedRatingsContext = createContext<RevealedRatingsContextType | null>(null);

export const RevealedRatingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [revealedRatings, setRevealedRatings] = useState<Record<string | number, RevealedRatingData>>({});
    const location = useLocation();

  // Reset and hide all revealed ratings immediately if the user navigates to another page
  useEffect(() => {
    setRevealedRatings({});
    setModalState({ isOpen: false });
  }, [location.pathname]);

  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    reviewId?: string | number;
    quarter?: string;
    employeeId?: string;
    initialEmail?: string;
  }>({ isOpen: false });

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

        return changed ? next : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const normalizeQ = (q?: string | null) => (q || '').toUpperCase().replace(/[\s_-]/g, '');

  const isRevealed = useCallback(
    (reviewId?: string | number | null, quarter?: string | null) => {
      const now = Date.now();
      if (reviewId != null && revealedRatings[reviewId] && revealedRatings[reviewId].expiresAt > now) {
        return true;
      }
      if (quarter) {
        const normQ = normalizeQ(quarter);
        if (revealedRatings[normQ] && revealedRatings[normQ].expiresAt > now) return true;
      }
      return false;
    },
    [revealedRatings],
  );

  const getRevealedData = useCallback(
    (reviewId?: string | number | null, quarter?: string | null) => {
      const now = Date.now();
      if (reviewId != null && revealedRatings[reviewId] && revealedRatings[reviewId].expiresAt > now) {
        return revealedRatings[reviewId];
      }
      if (quarter) {
        const normQ = normalizeQ(quarter);
        if (revealedRatings[normQ] && revealedRatings[normQ].expiresAt > now) {
          return revealedRatings[normQ];
        }
      }
      return null;
    },
    [revealedRatings],
  );

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

      setRevealedRatings((prev) => {
        const updated = { ...prev };
        if (reviewId != null) updated[reviewId] = item;
        if (quarter) updated[normalizeQ(quarter)] = item;
        if (payload.reviewId != null) updated[payload.reviewId] = item;
        if (payload.quarter) updated[normalizeQ(payload.quarter)] = item;
        return updated;
      });

      message.success('Identity verified. Final Rating is revealed for 2 minutes.');
      setModalState((previousState) => ({ ...previousState, isOpen: false }));
      return true;
    }
    return false;
  }, []);

  const openAuthModal = useCallback(
    (params: {
      reviewId?: string | number;
      quarter?: string;
      employeeId?: string;
      initialEmail?: string;
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
        isRevealed,
        getRevealedData,
        revealRating,
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
      isRevealed: () => false,
      getRevealedData: () => null,
      revealRating: async () => false,
      modalState: { isOpen: false },
      openAuthModal: () => {},
      closeAuthModal: () => {},
    };
  }
  return context;
};
