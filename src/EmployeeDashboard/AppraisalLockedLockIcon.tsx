import "./AppraisalLockedLockIcon.css";

/** Standalone lock art for locked / deadline-missed appraisal dashboard card. */
const AppraisalLockedLockIcon = () => (
  <div className="appr-locked-lock" aria-hidden>
    <span className="appr-locked-lock__glow" />
    <svg
      className="appr-locked-lock__svg"
      viewBox="0 0 96 96"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="apprLockBody" x1="24" y1="40" x2="72" y2="88" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FFF1F2" />
          <stop offset="1" stopColor="#FECDD3" />
        </linearGradient>
        <linearGradient id="apprLockShackle" x1="34" y1="14" x2="62" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDA4AF" />
          <stop offset="1" stopColor="#E11D48" />
        </linearGradient>
        <filter id="apprLockShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#7F1D1D" floodOpacity="0.4" />
        </filter>
      </defs>

      {/* soft pedestal */}
      <ellipse cx="48" cy="82" rx="28" ry="6" fill="#9F1239" opacity="0.28" />

      {/* shackle */}
      <path
        d="M34 44V34c0-7.732 6.268-14 14-14s14 6.268 14 14v10"
        stroke="url(#apprLockShackle)"
        strokeWidth="8"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d="M34 44V34c0-7.732 6.268-14 14-14s14 6.268 14 14v10"
        stroke="#FFF1F2"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
        opacity="0.55"
      />

      {/* body */}
      <rect
        x="26"
        y="42"
        width="44"
        height="36"
        rx="10"
        fill="url(#apprLockBody)"
        filter="url(#apprLockShadow)"
      />
      <rect x="30" y="46" width="36" height="10" rx="5" fill="#FFFFFF" opacity="0.55" />

      {/* keyhole */}
      <circle cx="48" cy="62" r="5" fill="#BE123C" />
      <rect x="45.5" y="62" width="5" height="10" rx="2.5" fill="#BE123C" />
    </svg>
  </div>
);

export default AppraisalLockedLockIcon;
