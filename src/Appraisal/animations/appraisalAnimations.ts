import gsap from "gsap";

/**
 * ============================================================================
 * Appraisal UI GSAP Animation System
 * Centralized GSAP timelines, tweens, and React-safe animations for Appraisal.
 * ============================================================================
 */

// ----------------------------------------------------------------------------
// 1. Step 3: Default Average Star & Sparkles Animations
// ----------------------------------------------------------------------------

export interface DefaultStarElements {
  svg?: HTMLElement | null;
  container?: HTMLElement | null;
  aura?: HTMLElement | null;
  body?: HTMLElement | null;
  sparkle1?: HTMLElement | null;
  sparkle2?: HTMLElement | null;
}

export const initDefaultStarAnimation = (elements: DefaultStarElements) => {
  const target = elements.container || elements.svg;
  const ctx = gsap.context(() => {
    if (target) {
      gsap.to(target, {
        y: -2.5,
        rotation: 3,
        duration: 1.3,
        yoyo: true,
        repeat: -1,
        transformOrigin: "center",
        ease: "sine.inOut",
      });
    }

    if (elements.aura) {
      gsap.to(elements.aura, {
        scale: 1.25,
        opacity: 0.9,
        duration: 1,
        yoyo: true,
        repeat: -1,
        transformOrigin: "center",
        ease: "sine.inOut",
      });
    }

    if (elements.body) {
      gsap.to(elements.body, {
        scale: 1.08,
        duration: 1,
        yoyo: true,
        repeat: -1,
        transformOrigin: "center",
        ease: "sine.inOut",
      });
    }

    if (elements.sparkle1) {
      gsap.to(elements.sparkle1, {
        rotation: 180,
        scale: 1.3,
        duration: 0.9,
        yoyo: true,
        repeat: -1,
        transformOrigin: "center",
        ease: "sine.inOut",
      });
    }

    if (elements.sparkle2) {
      gsap.to(elements.sparkle2, {
        rotation: -180,
        scale: 0.5,
        duration: 1.1,
        yoyo: true,
        repeat: -1,
        transformOrigin: "center",
        ease: "sine.inOut",
      });
    }
  });

  return () => ctx.revert();
};

export const animateDefaultStarAbsorb = (element: HTMLElement | null) => {
  if (!element) return;
  return gsap.timeline().to(
    element,
    {
      scale: 1.45,
      filter: "drop-shadow(0 0 16px rgba(251, 191, 36, 1)) drop-shadow(0 0 24px rgba(245, 158, 11, 0.9))",
      duration: 0.25,
      yoyo: true,
      repeat: 1,
      ease: "power2.out",
    },
    1.4
  );
};

// ----------------------------------------------------------------------------
// 2. Step 3: Star Rating Increase & Decrease 2-Second Transfer Timelines
// ----------------------------------------------------------------------------

export const animateTransferIncrease = (container: HTMLElement) => {
  const ctx = gsap.context(() => {
    const particles = container.querySelectorAll(".star-transfer-particle");

    const tl = gsap.timeline();
    tl.fromTo(
      container,
      { x: 28, y: -12, scale: 0.2, rotation: 40, opacity: 0 },
      { x: 20, y: -9, scale: 1.2, rotation: 18, opacity: 1, duration: 0.4, ease: "power1.out" }
    )
      .to(container, { x: 10, y: -4, scale: 1.3, rotation: -8, duration: 0.6, ease: "sine.inOut" })
      .to(container, { x: 2, y: -1, scale: 1.15, rotation: 4, duration: 0.5, ease: "sine.out" })
      .to(container, { x: 0, y: 0, scale: 1.4, rotation: 0, opacity: 0.85, duration: 0.3, ease: "power1.in" })
      .to(container, { scale: 0, opacity: 0, duration: 0.2, ease: "power2.in" });

    if (particles.length) {
      gsap.to(particles, {
        scale: 1.4,
        opacity: 1,
        yoyo: true,
        repeat: -1,
        duration: 0.35,
        ease: "sine.inOut",
      });
    }
  }, container);

  return () => ctx.revert();
};

export const animateTransferDecrease = (container: HTMLElement) => {
  const ctx = gsap.context(() => {
    const crackLeft = container.querySelector(".star-crack-left-el");
    const crackRight = container.querySelector(".star-crack-right-el");
    const flash = container.querySelector(".star-crack-flash-el");
    const shards = container.querySelectorAll(".star-shard-el");

    const tl = gsap.timeline();
    tl.fromTo(
      container,
      { x: 0, y: 0, scale: 0.85, opacity: 1, rotation: 0 },
      {
        keyframes: [
          { x: 14, y: -6, scale: 1.22, rotation: 10, opacity: 1, duration: 0.5 },
          { x: 22, y: -10, scale: 1.08, rotation: 18, opacity: 0.95, duration: 0.6 },
          { x: 28, y: -14, scale: 0.65, rotation: 26, opacity: 0.6, duration: 0.6 },
          { x: 32, y: -16, scale: 0, rotation: 35, opacity: 0, duration: 0.3 },
        ],
        ease: "power1.out",
      }
    );

    if (crackLeft) {
      gsap.to(crackLeft, {
        keyframes: [
          { scale: 0.82, x: 0, y: 0, rotation: -2, duration: 0.1 },
          { scale: 1.04, x: -2, y: -1, rotation: -6, opacity: 0.95, duration: 0.15 },
          { scale: 0.68, x: -6, y: -4, rotation: -16, opacity: 0.55, duration: 0.25 },
          { scale: 0.25, x: -11, y: -7, rotation: -26, opacity: 0, duration: 0.25 },
        ],
        ease: "power1.out",
      });
    }

    if (crackRight) {
      gsap.to(crackRight, {
        keyframes: [
          { scale: 0.82, x: 0, y: 0, rotation: 2, duration: 0.1 },
          { scale: 1.04, x: 2, y: 1, rotation: 6, opacity: 0.95, duration: 0.15 },
          { scale: 0.68, x: 6, y: 4, rotation: 16, opacity: 0.55, duration: 0.25 },
          { scale: 0.25, x: 11, y: 7, rotation: 26, opacity: 0, duration: 0.25 },
        ],
        ease: "power1.out",
      });
    }

    if (flash) {
      gsap.fromTo(
        flash,
        { opacity: 0, scale: 0.8 },
        {
          keyframes: [
            { opacity: 1, scale: 1.08, duration: 0.12 },
            { opacity: 0.75, scale: 1, duration: 0.12 },
            { opacity: 0, scale: 1, duration: 0.14 },
          ],
          ease: "power1.out",
        }
      );
    }

    const targets = [
      { x: 16, y: -11, r: 45 },
      { x: 14, y: 12, r: -35 },
      { x: -3, y: 18, r: 60 },
      { x: -17, y: 7, r: -45 },
      { x: -13, y: -12, r: 30 },
      { x: 2, y: -18, r: -60 },
      { x: 18, y: -2, r: 50 },
    ];
    shards.forEach((shard, idx) => {
      const tgt = targets[idx % targets.length];
      gsap.fromTo(
        shard,
        { x: 0, y: 0, scale: 0, opacity: 0 },
        {
          keyframes: [
            { scale: 1.25, opacity: 1, duration: 0.1 },
            { x: tgt.x, y: tgt.y, scale: 0.2, rotation: tgt.r, opacity: 0, duration: 0.35 },
          ],
          ease: "power2.out",
        }
      );
    });
  }, container);

  return () => ctx.revert();
};

// ----------------------------------------------------------------------------
// 3. Step 3: Individual Criterion Star Pop, Hover & Shatter
// ----------------------------------------------------------------------------

export const animateStarPop = (button: HTMLElement) => {
  return gsap.fromTo(
    button,
    { scale: 0.4, rotation: -120, filter: "drop-shadow(0 0 24px rgba(255, 181, 71, 1)) brightness(1.8)" },
    {
      scale: 1,
      rotation: 360,
      filter: "drop-shadow(0 2px 10px rgba(255, 181, 71, 0.65)) brightness(1)",
      duration: 0.55,
      ease: "back.out(1.8)",
    }
  );
};

export const animateStarHover = (button: HTMLElement) => {
  return gsap.to(button, {
    scale: 1.28,
    y: -3,
    duration: 0.25,
    ease: "back.out(2)",
  });
};

export const animateStarHoverLeave = (button: HTMLElement) => {
  return gsap.to(button, {
    scale: 1,
    y: 0,
    duration: 0.2,
    ease: "power2.out",
  });
};

export const animateShatteringStar = (container: HTMLElement) => {
  const ctx = gsap.context(() => {
    const left = container.querySelector(".star-crack-left-el");
    const right = container.querySelector(".star-crack-right-el");
    const flash = container.querySelector(".star-crack-flash-el");
    const shards = container.querySelectorAll(".star-shard-el");

    if (left) {
      gsap.fromTo(
        left,
        { scale: 1, x: 0, y: 0, rotation: 0, opacity: 1 },
        {
          keyframes: [
            { scale: 0.82, x: 0, y: 0, rotation: -2, duration: 0.08 },
            { scale: 1.04, x: -2, y: -1, rotation: -6, opacity: 0.95, duration: 0.12 },
            { scale: 0.68, x: -6, y: -4, rotation: -16, opacity: 0.55, duration: 0.14 },
            { scale: 0.25, x: -11, y: -7, rotation: -26, opacity: 0, duration: 0.14 },
          ],
          ease: "power1.out",
        }
      );
    }

    if (right) {
      gsap.fromTo(
        right,
        { scale: 1, x: 0, y: 0, rotation: 0, opacity: 1 },
        {
          keyframes: [
            { scale: 0.82, x: 0, y: 0, rotation: 2, duration: 0.08 },
            { scale: 1.04, x: 2, y: 1, rotation: 6, opacity: 0.95, duration: 0.12 },
            { scale: 0.68, x: 6, y: 4, rotation: 16, opacity: 0.55, duration: 0.14 },
            { scale: 0.25, x: 11, y: 7, rotation: 26, opacity: 0, duration: 0.14 },
          ],
          ease: "power1.out",
        }
      );
    }

    if (flash) {
      gsap.fromTo(
        flash,
        { opacity: 0, scale: 0.8 },
        {
          keyframes: [
            { opacity: 1, scale: 1.08, duration: 0.1 },
            { opacity: 0.75, scale: 1, duration: 0.1 },
            { opacity: 0, scale: 1, duration: 0.18 },
          ],
          ease: "power1.out",
        }
      );
    }

    const targets = [
      { x: 16, y: -11, r: 45 },
      { x: 14, y: 12, r: -35 },
      { x: -3, y: 18, r: 60 },
      { x: -17, y: 7, r: -45 },
      { x: -13, y: -12, r: 30 },
      { x: 2, y: -18, r: -60 },
      { x: 18, y: -2, r: 50 },
    ];
    shards.forEach((shard, idx) => {
      const tgt = targets[idx % targets.length];
      gsap.fromTo(
        shard,
        { x: 0, y: 0, scale: 0, opacity: 0 },
        {
          keyframes: [
            { scale: 1.25, opacity: 1, duration: 0.09 },
            { x: tgt.x, y: tgt.y, scale: 0.2, rotation: tgt.r, opacity: 0, duration: 0.35 },
          ],
          ease: "power2.out",
        }
      );
    });
  }, container);

  return () => ctx.revert();
};

// ----------------------------------------------------------------------------
// 4. Step 5: Living Interactive Animated Emoji SVG (IDs 1 to 5)
// ----------------------------------------------------------------------------

export const initEmojiAnimation = (id: number, container: HTMLElement | null) => {
  if (!container) return () => {};

  const ctx = gsap.context(() => {
    switch (id) {
      case 1: {
        // Very Bad (Angry)
        const head = container.querySelector(".anim-target-head");
        if (head) {
          gsap.to(head, {
            keyframes: [
              { x: 0, y: 0, rotation: 0, duration: 0 },
              { x: -1.5, y: -0.5, rotation: -4, duration: 0.2 },
              { x: 1.5, y: 0.5, rotation: 4, duration: 0.2 },
              { x: -1, y: 0.5, rotation: -3, duration: 0.2 },
              { x: 1, y: -0.5, rotation: 3, duration: 0.2 },
              { x: 0, y: 0, rotation: 0, duration: 0.2 },
            ],
            repeat: -1,
            transformOrigin: "center bottom",
            ease: "sine.inOut",
          });
        }
        const steamL = container.querySelector(".anim-target-steam-l");
        if (steamL) {
          gsap.fromTo(
            steamL,
            { x: 0, y: 0, scale: 0.4, opacity: 0 },
            {
              x: -6,
              y: -7,
              scale: 1.3,
              opacity: 0,
              duration: 1.2,
              repeat: -1,
              transformOrigin: "8px 14px",
              ease: "power1.out",
              keyframes: [
                { opacity: 0.9, duration: 0.36 },
                { opacity: 0, duration: 0.84 },
              ],
            }
          );
        }
        const steamR = container.querySelector(".anim-target-steam-r");
        if (steamR) {
          gsap.fromTo(
            steamR,
            { x: 0, y: 0, scale: 0.4, opacity: 0 },
            {
              x: 6,
              y: -7,
              scale: 1.3,
              opacity: 0,
              duration: 1.2,
              delay: 0.2,
              repeat: -1,
              transformOrigin: "36px 14px",
              ease: "power1.out",
              keyframes: [
                { opacity: 0.9, duration: 0.36 },
                { opacity: 0, duration: 0.84 },
              ],
            }
          );
        }
        const vein = container.querySelector(".anim-target-vein");
        if (vein) {
          gsap.to(vein, {
            scale: 1.35,
            opacity: 1,
            filter: "drop-shadow(0 0 3px #EF4444)",
            duration: 0.45,
            yoyo: true,
            repeat: -1,
            transformOrigin: "29px 10.5px",
            ease: "sine.inOut",
          });
        }
        break;
      }

      case 2: {
        // Bad (Sad)
        const head = container.querySelector(".anim-target-head");
        if (head) {
          gsap.to(head, {
            keyframes: [
              { y: 0, rotation: 0, duration: 0 },
              { y: 2.5, rotation: -4, duration: 0.77 },
              { y: 1.5, rotation: 3, duration: 0.77 },
              { y: 0, rotation: 0, duration: 0.66 },
            ],
            repeat: -1,
            transformOrigin: "center bottom",
            ease: "sine.inOut",
          });
        }
        const tear = container.querySelector(".anim-target-tear");
        if (tear) {
          gsap.fromTo(
            tear,
            { y: 0, scale: 0.6, opacity: 0 },
            {
              keyframes: [
                { y: 2, scale: 1, opacity: 1, duration: 0.45 },
                { y: 11, scale: 1.1, opacity: 0.9, duration: 0.99 },
                { y: 15, scale: 0.4, opacity: 0, duration: 0.36 },
              ],
              repeat: -1,
              transformOrigin: "center top",
              ease: "power1.in",
            }
          );
        }
        break;
      }

      case 3: {
        // Neutral
        const head = container.querySelector(".anim-target-head");
        if (head) {
          gsap.to(head, {
            y: -3,
            duration: 1.2,
            yoyo: true,
            repeat: -1,
            transformOrigin: "center",
            ease: "sine.inOut",
          });
        }
        const eyes = container.querySelector(".anim-target-eyes");
        if (eyes) {
          gsap
            .timeline({ repeat: -1, repeatDelay: 2.8 })
            .to(eyes, { scaleY: 0.08, transformOrigin: "22px 20.5px", duration: 0.12, ease: "power1.inOut" })
            .to(eyes, { scaleY: 1, transformOrigin: "22px 20.5px", duration: 0.12, ease: "power1.inOut" });
        }
        break;
      }

      case 4: {
        // Good (Happy)
        const head = container.querySelector(".anim-target-head");
        if (head) {
          gsap.to(head, {
            keyframes: [
              { y: 0, rotation: 0, duration: 0 },
              { y: -5, rotation: 3, duration: 0.51 },
              { y: 1, rotation: -2, duration: 0.51 },
              { y: -2, rotation: 1, duration: 0.34 },
              { y: 0, rotation: 0, duration: 0.34 },
            ],
            repeat: -1,
            transformOrigin: "center bottom",
            ease: "sine.inOut",
          });
        }
        const blush = container.querySelectorAll(".anim-target-blush");
        if (blush && blush.length) {
          gsap.to(blush, {
            scale: 1.15,
            opacity: 1,
            duration: 0.9,
            yoyo: true,
            repeat: -1,
            transformOrigin: "center",
            ease: "sine.inOut",
          });
        }
        const sparkle = container.querySelector(".anim-target-sparkle");
        if (sparkle) {
          gsap.to(sparkle, {
            rotation: 360,
            transformOrigin: "36px 13.5px",
            duration: 2,
            repeat: -1,
            ease: "none",
          });
          gsap.to(sparkle, {
            scale: 1.2,
            opacity: 1,
            duration: 1,
            yoyo: true,
            repeat: -1,
            transformOrigin: "36px 13.5px",
            ease: "sine.inOut",
          });
        }
        break;
      }

      case 5:
      default: {
        // Excellent
        const head = container.querySelector(".anim-target-head");
        if (head) {
          gsap.to(head, {
            keyframes: [
              { y: 0, rotation: 0, scale: 1, duration: 0 },
              { y: -4, rotation: -6, scale: 1.04, duration: 0.4 },
              { y: 0, rotation: 0, scale: 1, duration: 0.4 },
              { y: -4, rotation: 6, scale: 1.04, duration: 0.4 },
              { y: 0, rotation: 0, scale: 1, duration: 0.4 },
            ],
            repeat: -1,
            transformOrigin: "center bottom",
            ease: "sine.inOut",
          });
        }
        const starL = container.querySelector(".anim-target-star-l");
        if (starL) {
          gsap.to(starL, {
            rotation: 35,
            scale: 1.28,
            duration: 0.75,
            yoyo: true,
            repeat: -1,
            transformOrigin: "16px 18.5px",
            ease: "sine.inOut",
          });
        }
        const starR = container.querySelector(".anim-target-star-r");
        if (starR) {
          gsap.to(starR, {
            rotation: -35,
            scale: 1.28,
            duration: 0.75,
            delay: 0.15,
            yoyo: true,
            repeat: -1,
            transformOrigin: "28px 18.5px",
            ease: "sine.inOut",
          });
        }
        const tw1 = container.querySelector(".anim-target-twinkle-1");
        if (tw1) {
          gsap.to(tw1, {
            rotation: 90,
            scale: 1.25,
            opacity: 1,
            duration: 0.7,
            yoyo: true,
            repeat: -1,
            transformOrigin: "6px 14.5px",
            ease: "sine.inOut",
          });
        }
        const tw2 = container.querySelector(".anim-target-twinkle-2");
        if (tw2) {
          gsap.to(tw2, {
            rotation: -90,
            scale: 1.25,
            opacity: 1,
            duration: 0.7,
            delay: 0.25,
            yoyo: true,
            repeat: -1,
            transformOrigin: "38px 12.5px",
            ease: "sine.inOut",
          });
        }
        break;
      }
    }
  }, container);

  return () => ctx.revert();
};

export const animateEmojiClickPop = (element: HTMLElement | null) => {
  if (!element) return;
  return gsap.fromTo(
    element,
    { scale: 0.8 },
    {
      keyframes: [
        { scale: 1.25, duration: 0.16, ease: "power2.out" },
        { scale: 1.05, duration: 0.12, ease: "power1.inOut" },
        { scale: 1.1, duration: 0.1, ease: "back.out(2)" },
      ],
    }
  );
};

// ----------------------------------------------------------------------------
// 5. Step 2: Animated Attach Document Icon
// ----------------------------------------------------------------------------

export interface AttachIconElements {
  svg?: HTMLElement | null;
  aura?: HTMLElement | null;
  clip?: HTMLElement | null;
  sparkle1?: HTMLElement | null;
  sparkle2?: HTMLElement | null;
}

export const initAttachIconAnimation = (_elements?: AttachIconElements) => {
  return () => {};
};

// ----------------------------------------------------------------------------
// 6. Stepper: Step Slide Transitions, Active Circle Pulse & Error Shake
// ----------------------------------------------------------------------------

export const animateStepSlide = (
  enterEl: HTMLElement | null,
  exitEl: HTMLElement | null,
  direction: "forward" | "backward"
) => {
  const isForward = direction === "forward";

  if (exitEl) {
    gsap.to(exitEl, {
      y: isForward ? -30 : 30,
      opacity: 0,
      duration: 0.45,
      ease: "power2.inOut",
    });
  }

  if (enterEl) {
    gsap.fromTo(
      enterEl,
      { y: isForward ? 30 : -30, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.45, ease: "power2.out" }
    );
  }
};

export const initActiveStepperCircle = (circleElement: HTMLElement | null) => {
  if (!circleElement) return () => {};
  const tween = gsap.to(circleElement, {
    boxShadow: "0 0 0 6px rgba(37, 99, 235, 0.15), 0 6px 18px rgba(37, 99, 235, 0.32)",
    duration: 1.2,
    repeat: -1,
    yoyo: true,
    ease: "sine.inOut",
  });
  return () => {
    tween.kill();
  };
};

export const animateFieldError = (element: HTMLElement | null) => {
  if (!element) return;
  gsap
    .timeline()
    .to(element, { x: -5, duration: 0.08, ease: "power1.inOut" })
    .to(element, { x: 5, duration: 0.08, ease: "power1.inOut" })
    .to(element, { x: -4, duration: 0.08, ease: "power1.inOut" })
    .to(element, { x: 4, duration: 0.08, ease: "power1.inOut" })
    .to(element, { x: 0, duration: 0.08, ease: "power1.out" });

  gsap.fromTo(
    element,
    { boxShadow: "0 0 0 6px rgba(239, 68, 68, 0.25)", borderColor: "#EF4444" },
    { boxShadow: "0 0 0 0px rgba(239, 68, 68, 0)", duration: 1.2, ease: "power2.out" }
  );
};

// ----------------------------------------------------------------------------
// 7. Scroll Reveal Card System (ReviewStep & View Pages)
// ----------------------------------------------------------------------------

export const initScrollRevealCards = (container: HTMLElement | null) => {
  if (!container) return () => {};

  const ctx = gsap.context(() => {
    const cards = container.querySelectorAll(".eval-reveal-card");
    if (!cards || !cards.length) return;

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      gsap.set(cards, { opacity: 1, y: 0, scale: 1 });
      return;
    }

    gsap.set(cards, { opacity: 0, y: 35, scale: 0.98 });

    if (!("IntersectionObserver" in window)) {
      gsap.to(cards, { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: "power2.out" });
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const target = entry.target as HTMLElement;
          if (entry.intersectionRatio >= 0.12) {
            gsap.to(target, {
              opacity: 1,
              y: 0,
              scale: 1,
              duration: 0.6,
              ease: "power2.out",
              overwrite: "auto",
            });
            const staggers = target.querySelectorAll(".eval-stagger-item");
            if (staggers.length) {
              gsap.fromTo(
                staggers,
                { opacity: 0, y: 12 },
                { opacity: 1, y: 0, stagger: 0.06, duration: 0.45, ease: "power2.out", overwrite: "auto" }
              );
            }
          } else if (entry.intersectionRatio === 0 || !entry.isIntersecting) {
            gsap.to(target, {
              opacity: 0,
              y: 35,
              scale: 0.98,
              duration: 0.4,
              ease: "power2.in",
              overwrite: "auto",
            });
          }
        });
      },
      { root: null, threshold: [0, 0.12] }
    );

    cards.forEach((card) => observer.observe(card));

    return () => {
      observer.disconnect();
    };
  }, container);

  return () => ctx.revert();
};

// ----------------------------------------------------------------------------
// 8. Empty State & Action Button GSAP Animations
// ----------------------------------------------------------------------------

export const initEmptyIllustrationAnimation = (container: HTMLElement | null) => {
  if (!container) return () => {};

  const ctx = gsap.context(() => {
    const glow = container.querySelector(".appraisal-empty-glow");
    const illustration = container.querySelector(".appraisal-empty-illustration");

    if (glow) {
      gsap.to(glow, {
        scale: 1.08,
        opacity: 0.8,
        duration: 1.75,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }

    if (illustration) {
      gsap.to(illustration, {
        y: -8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }
  }, container);

  return () => ctx.revert();
};

export const animateKeyIconBounce = (iconElement: SVGElement | HTMLElement | null) => {
  if (!iconElement) return;
  return gsap
    .timeline()
    .to(iconElement, { rotation: -15, scale: 1.2, duration: 0.15, ease: "power1.out" })
    .to(iconElement, { rotation: 10, scale: 1.1, duration: 0.15, ease: "power1.out" })
    .to(iconElement, { rotation: 0, scale: 1, duration: 0.12, ease: "power1.out" });
};

export { gsap };
export default gsap;
