import React, { useEffect, useRef } from "react";
import gsap from "gsap";

import heroCelebration from "../../assets/appraisal-hero-celebration.png";
import confettiBurst from "../../assets/appraisal-confetti-burst.jpg";
import fireworkSpark from "../../assets/appraisal-firework-spark.jpg";
import growthBurst from "../../assets/appraisal-growth-burst.jpg";

const BLASTS = [
  // Corners
  { src: confettiBurst, className: "left-0 top-2 w-28 sm:w-40 md:w-48", zone: "corner" },
  { src: fireworkSpark, className: "right-0 top-0 w-32 sm:w-48 md:w-56", zone: "corner" },
  { src: confettiBurst, className: "bottom-4 left-0 w-24 sm:w-36 md:w-44", zone: "corner" },
  { src: fireworkSpark, className: "bottom-6 right-0 w-28 sm:w-40 md:w-48", zone: "corner" },
  // Middle fill — so the center isn’t empty while blasts play
  { src: fireworkSpark, className: "left-1/2 top-1/2 w-44 -translate-x-1/2 -translate-y-1/2 sm:w-56 md:w-64", zone: "center" },
  { src: confettiBurst, className: "left-[28%] top-[32%] w-28 sm:w-36 md:w-40", zone: "center" },
  { src: growthBurst, className: "right-[26%] top-[30%] w-24 sm:w-32 md:w-36", zone: "center" },
  { src: confettiBurst, className: "left-[30%] bottom-[28%] w-28 sm:w-32 md:w-36", zone: "center" },
  { src: fireworkSpark, className: "right-[28%] bottom-[26%] w-28 sm:w-36 md:w-40", zone: "center" },
  { src: growthBurst, className: "left-1/2 top-[18%] w-20 -translate-x-1/2 sm:w-28", zone: "center" },
  { src: confettiBurst, className: "left-1/2 bottom-[16%] w-24 -translate-x-1/2 sm:w-28", zone: "center" },
];

/**
 * Full-page Appraisal celebration — blasts fill corners + center, then hero PNG.
 */
export const AppraisalComingSoon: React.FC = () => {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const ctx = gsap.context(() => {
      gsap.set("[data-anim='blast']", { scale: 0.2, opacity: 0 });
      gsap.set("[data-anim='hero']", { opacity: 0, scale: 0.94, y: 16 });

      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      // Corners first, then middle fills in
      tl.to("[data-zone='corner']", {
        scale: 1,
        opacity: 0.85,
        duration: 0.85,
        stagger: 0.14,
        ease: "back.out(1.7)",
      })
        .to(
          "[data-zone='center']",
          {
            scale: 1,
            opacity: 0.9,
            duration: 0.9,
            stagger: 0.1,
            ease: "back.out(1.6)",
          },
          "-=0.35"
        )
        // Hold so the full blast field is visible
        .to({}, { duration: 1.0 })
        // Soften center blasts under the PNG, then fade hero in
        .to(
          "[data-zone='center']",
          { opacity: 0.35, scale: 0.92, duration: 0.7, ease: "power1.out" },
          "+=0.05"
        )
        .to(
          "[data-anim='hero']",
          {
            opacity: 1,
            scale: 1,
            y: 0,
            duration: 1.35,
            ease: "power2.out",
          },
          "-=0.45"
        );

      gsap.to("[data-anim='blast']", {
        scale: "random(0.88, 1.14)",
        rotate: "random(-14, 14)",
        duration: "random(1.2, 2.2)",
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: { amount: 1.2, from: "random" },
      });

      gsap.to("[data-anim='hero']", {
        y: -6,
        duration: 2.6,
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        delay: 4,
      });

      gsap.to("[data-anim='dot']", {
        y: "random(-18, 18)",
        x: "random(-14, 14)",
        opacity: "random(0.35, 1)",
        duration: "random(1.0, 2.1)",
        yoyo: true,
        repeat: -1,
        ease: "sine.inOut",
        stagger: { amount: 1, from: "random" },
      });
    }, root);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={rootRef}
      className="relative flex h-full min-h-[calc(100vh-7rem)] w-full items-center justify-center overflow-hidden bg-gradient-to-b from-[#DCEBFF] via-[#F4F7FE] to-[#EEF2FF]"
    >
      {/* Blasts — corners + middle */}
      {BLASTS.map((blast, i) => (
        <img
          key={`${blast.zone}-${i}`}
          src={blast.src}
          alt=""
          aria-hidden
          data-anim="blast"
          data-zone={blast.zone}
          className={`pointer-events-none absolute z-[1] select-none rounded-2xl mix-blend-darken ${blast.className}`}
        />
      ))}

      {/* Dense floating particles across the page */}
      <div className="pointer-events-none absolute inset-0 z-[1]" aria-hidden>
        {Array.from({ length: 48 }).map((_, i) => (
          <span
            key={i}
            data-anim="dot"
            className="absolute rounded-full"
            style={{
              left: `${(i * 29) % 98}%`,
              top: `${(i * 47) % 96}%`,
              width: i % 4 === 0 ? 8 : i % 3 === 0 ? 5 : 3,
              height: i % 4 === 0 ? 8 : i % 3 === 0 ? 5 : 3,
              background:
                i % 5 === 0
                  ? "#FACC15"
                  : i % 5 === 1
                    ? "#4318FF"
                    : i % 5 === 2
                      ? "#38BDF8"
                      : i % 5 === 3
                        ? "#F472B6"
                        : "#A78BFA",
            }}
          />
        ))}
      </div>

      {/* Hero PNG (delayed after blasts fill the page) */}
      <img
        data-anim="hero"
        src={heroCelebration}
        alt="Appraisal — Your growth, celebrated. Arriving soon."
        className="relative z-10 h-full max-h-[calc(100vh-7rem)] w-full object-contain object-center p-2 sm:p-3"
      />
    </div>
  );
};

export default AppraisalComingSoon;
