import gsap from "gsap";

export interface RevealedModalAnimationElements {
  card: HTMLElement | null;
  backdrop: HTMLElement | null;
  trophyIcon?: HTMLElement | null;
  starsContainer?: HTMLElement | null;
  quoteCard?: HTMLElement | null;
  bottomBar?: HTMLElement | null;
}

/**
 * Snappy entrance and fluid micro-animations for Revealed Rating Modal
 */
export const animateRevealedModalEntrance = (
  elements: RevealedModalAnimationElements
): (() => void) => {
  if (!elements.card) return () => {};

  const ctx = gsap.context(() => {
    // 1. Snappy backdrop & card entrance
    if (elements.backdrop) {
      gsap.fromTo(elements.backdrop, { opacity: 0 }, { opacity: 1, duration: 0.18, ease: "power2.out" });
    }
    gsap.fromTo(
      elements.card,
      { scale: 0.94, opacity: 0, y: 10 },
      { scale: 1, opacity: 1, y: 0, duration: 0.22, ease: "back.out(1.2)" }
    );

    // 2. 3D Trophy hover & contact shadow physics
    gsap.to(".gsap-trophy-body", { y: -6, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".gsap-trophy-contact-shadow", {
      scale: 0.82,
      opacity: 0.18,
      transformOrigin: "center",
      duration: 2.2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });

    // 3. Star gleam, flare, and foliage breeze
    gsap.fromTo(".gsap-trophy-star", { scale: 0, rotation: -90 }, { scale: 1, rotation: 0, duration: 0.4, ease: "back.out(2)", delay: 0.1 });
    gsap.to(".gsap-trophy-star", { scale: 1.12, duration: 1.5, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5 });
    gsap.to(".gsap-trophy-flare", { rotation: 180, scale: 1.3, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".gsap-leaf-left", { rotation: -6, transformOrigin: "bottom right", duration: 2.4, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".gsap-leaf-right", { rotation: 6, transformOrigin: "bottom left", duration: 2.6, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.2 });

    // 4. Confetti ribbons float & sparkles
    gsap.to(".gsap-confetti", { y: -6, rotation: "random(-15, 15)", stagger: 0.15, duration: 2, repeat: -1, yoyo: true, ease: "sine.inOut" });
    gsap.to(".gsap-sparkle-star", { scale: 1.4, opacity: 0.9, stagger: 0.2, duration: 1.2, repeat: -1, yoyo: true, ease: "sine.inOut" });

    // 5. Floating Motivation Badge & festive bursts
    const badge = elements.card?.querySelector(".gsap-success-badge");
    if (badge) {
      gsap.fromTo(badge, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: "back.out(1.8)", delay: 0.12 });
      gsap.to(badge, { y: -3, duration: 2.2, repeat: -1, yoyo: true, ease: "sine.inOut", delay: 0.5 });
    }
    gsap.fromTo(".gsap-burst-ray", { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.04, duration: 0.25, ease: "back.out(2)", delay: 0.08 });

    // 6. Rating stars wave pop
    if (elements.starsContainer?.children.length) {
      gsap.fromTo(
        elements.starsContainer.children,
        { scale: 0.4, opacity: 0.3, rotation: -20 },
        { scale: 1, opacity: 1, rotation: 0, stagger: 0.04, duration: 0.26, ease: "back.out(2)", delay: 0.06 }
      );
    }

    // 7. Live smile curve stroke draw
    const curve = elements.card?.querySelector(".gsap-curve-underline path");
    if (curve) {
      gsap.fromTo(curve, { strokeDasharray: 100, strokeDashoffset: 100 }, { strokeDashoffset: 0, duration: 0.45, ease: "power2.out", delay: 0.1 });
    }

    // 8. Feedback quote card smooth fade-in
    const quote = elements.quoteCard || elements.card?.querySelector(".gsap-quote-card");
    if (quote) {
      gsap.fromTo(quote, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.32, ease: "power2.out", delay: 0.08 });
    }
    const quoteBar = elements.card?.querySelector(".gsap-quote-bar");
    if (quoteBar) {
      gsap.fromTo(quoteBar, { scaleY: 0 }, { scaleY: 1, transformOrigin: "top", duration: 0.3, ease: "power2.out", delay: 0.1 });
    }

    // 9. Bottom security bar fade & shield pulse
    const bottom = elements.bottomBar || elements.card?.querySelector(".gsap-bottom-bar");
    if (bottom) {
      gsap.fromTo(bottom, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.3, ease: "power2.out", delay: 0.12 });
    }
    const shield = elements.card?.querySelector(".gsap-shield-badge");
    if (shield) {
      gsap.to(shield, { scale: 1.06, duration: 1.8, repeat: -1, yoyo: true, ease: "sine.inOut" });
    }
  }, elements.card);

  return () => ctx.revert();
};

/**
 * Fast exit animation for Revealed Rating Modal
 */
export const animateRevealedModalExit = (
  card: HTMLElement | null,
  backdrop: HTMLElement | null,
  onComplete: () => void
): void => {
  if (!card) {
    onComplete();
    return;
  }
  const tl = gsap.timeline({ onComplete, defaults: { ease: "power2.in" } });
  tl.to(card, { scale: 0.95, opacity: 0, y: 8, duration: 0.14 });
  if (backdrop) tl.to(backdrop, { opacity: 0, duration: 0.12 }, "<");
};
