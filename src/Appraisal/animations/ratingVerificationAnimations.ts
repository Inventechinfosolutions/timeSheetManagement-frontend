import gsap from "gsap";

export interface RatingVerificationAnimationElements {
  card: HTMLElement | null;
  backdrop: HTMLElement | null;
  vaultGroup?: SVGElement | null;
  keyGroup?: SVGElement | null;
  dialWheel?: SVGElement | null;
  orbitRing?: SVGElement | null;
  scanBeam?: SVGElement | null;
  sparkles?: SVGElement[] | null;
  formWrap?: HTMLElement | null;
}

export interface SummaryAnimationElements {
  container: HTMLElement | null;
  badge?: SVGElement | null;
  cards?: HTMLElement[] | null;
  annualCard?: HTMLElement | null;
}

/**
 * Snappy entrance and continuous GSAP micro-animations for RatingVerificationModal
 */
export const animateRatingVerificationEntrance = (
  elements: RatingVerificationAnimationElements
): (() => void) => {
  if (!elements.card) return () => {};

  const ctx = gsap.context(() => {
    // 1. Backdrop fade in
    if (elements.backdrop) {
      gsap.fromTo(
        elements.backdrop,
        { opacity: 0 },
        { opacity: 1, duration: 0.22, ease: "power2.out" }
      );
    }

    // 2. Card spring entrance
    gsap.fromTo(
      elements.card,
      { opacity: 0, scale: 0.92, y: 16 },
      { opacity: 1, scale: 1, y: 0, duration: 0.38, ease: "back.out(1.5)" }
    );

    // 3. Vault scene spring entrance
    if (elements.vaultGroup) {
      gsap.fromTo(
        elements.vaultGroup,
        { scale: 0.65, opacity: 0, y: -10 },
        { scale: 1, opacity: 1, y: 0, duration: 0.48, ease: "back.out(1.8)" }
      );

      // Subtle ambient hover bob
      gsap.to(elements.vaultGroup, {
        y: -4,
        duration: 2.4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.5,
      });
    }

    // 4. Floating Key bob & tilt
    if (elements.keyGroup) {
      gsap.fromTo(
        elements.keyGroup,
        { scale: 0, rotation: -25, opacity: 0 },
        { scale: 1, rotation: 12, opacity: 1, duration: 0.55, delay: 0.15, ease: "back.out(2)" }
      );

      gsap.to(elements.keyGroup, {
        y: -5,
        rotation: 18,
        duration: 1.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: 0.7,
      });
    }

    // 5. Dial combination wheel rotation
    if (elements.dialWheel) {
      gsap.fromTo(
        elements.dialWheel,
        { rotation: -90, transformOrigin: "50% 50%" },
        { rotation: 45, transformOrigin: "50% 50%", duration: 0.9, delay: 0.25, ease: "elastic.out(1, 0.5)" }
      );
    }

    // 6. Continuous Orbit Ring rotation
    if (elements.orbitRing) {
      gsap.to(elements.orbitRing, {
        rotation: 360,
        transformOrigin: "50% 50%",
        duration: 14,
        repeat: -1,
        ease: "none",
      });
    }

    // 7. Cyber Laser Scan Beam sweep
    if (elements.scanBeam) {
      gsap.fromTo(
        elements.scanBeam,
        { y: -18, opacity: 0 },
        {
          y: 20,
          opacity: 0.9,
          duration: 1.8,
          repeat: -1,
          repeatDelay: 0.8,
          ease: "power1.inOut",
        }
      );
    }

    // 8. Sparkles twinkle
    if (elements.sparkles && elements.sparkles.length > 0) {
      gsap.fromTo(
        elements.sparkles,
        { scale: 0.5, opacity: 0.3 },
        {
          scale: 1.25,
          opacity: 1,
          duration: 1.1,
          repeat: -1,
          yoyo: true,
          stagger: 0.25,
          ease: "sine.inOut",
        }
      );
    }

    // 9. Stagger form elements in
    if (elements.formWrap) {
      gsap.fromTo(
        elements.formWrap.children,
        { opacity: 0, y: 12 },
        { opacity: 1, y: 0, duration: 0.32, stagger: 0.06, delay: 0.1, ease: "power2.out" }
      );
    }
  });

  return () => ctx.revert();
};

/**
 * Celebratory entrance animation for the summary results screen
 */
export const animateSummaryEntrance = (
  elements: SummaryAnimationElements
): (() => void) => {
  if (!elements.container) return () => {};

  const ctx = gsap.context(() => {
    // 1. Success badge pop
    if (elements.badge) {
      gsap.fromTo(
        elements.badge,
        { scale: 0.5, rotation: -15, opacity: 0 },
        { scale: 1, rotation: 0, opacity: 1, duration: 0.48, ease: "back.out(2)" }
      );
    }

    // 2. Quarterly review cards staggered cascade
    if (elements.cards && elements.cards.length > 0) {
      gsap.fromTo(
        elements.cards,
        { opacity: 0, y: 16, scale: 0.94 },
        { opacity: 1, y: 0, scale: 1, duration: 0.36, stagger: 0.06, delay: 0.1, ease: "power2.out" }
      );
    }

    // 3. Highlighted Annual Average Card slide up & glow
    if (elements.annualCard) {
      gsap.fromTo(
        elements.annualCard,
        { opacity: 0, y: 18, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.42, delay: 0.24, ease: "back.out(1.4)" }
      );
    }
  });

  return () => ctx.revert();
};

/**
 * Snappy exit transition
 */
export const animateRatingVerificationExit = (
  card: HTMLElement | null,
  backdrop: HTMLElement | null,
  onComplete?: () => void
): void => {
  if (!card) {
    onComplete?.();
    return;
  }

  const tl = gsap.timeline({ onComplete });
  tl.to(card, {
    scale: 0.93,
    opacity: 0,
    y: 12,
    duration: 0.18,
    ease: "power2.in",
  });
  if (backdrop) {
    tl.to(backdrop, { opacity: 0, duration: 0.15, ease: "power2.in" }, "<");
  }
};
