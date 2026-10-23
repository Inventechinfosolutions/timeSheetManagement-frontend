import { Round_logo, Tree_logo, W_logo } from "../assets/Images/Image";
import "./ApiLoadingSpingnner.css";

/**
 * Animated Worksphere Logo Loader (Preserved for future use):
 * - Outer circular dot-dot-dot loader completes one rotation
 * - Once rotation completes, the round comes into position at the center dip of Tree and W
 * - 3 lines of W attach one by one
 * - Tree wings glide in from left and right
 * - All animations run simultaneously, assembling into the complete logo
 */
export function WorksphereAnimatedLogoLoader({
  className = "",
  showText = false,
}: {
  className?: string;
  showText?: boolean;
}) {
  return (
    <div
      className={`worksphere-loader-container ${className}`}
      role="status"
      aria-label="Loading"
    >
      <div className="worksphere-logo-stage">
        {/* Soft background ambient glow */}
        <div className="worksphere-orbital-glow" />

        {/* Outer Circular Dots (dot dot dot) Spinner around the logos */}
        <svg
          className="worksphere-dots-spinner-svg"
          viewBox="0 0 110 110"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g className="worksphere-dots-spinner-group">
            <image href={Round_logo} x="51.25" y="5.25" width="7.5" height="7.5" opacity="1.0" />
            <image href={Round_logo} x="34.3" y="8.8" width="7.0" height="7.0" opacity="0.85" />
            <image href={Round_logo} x="19.8" y="18.6" width="6.5" height="6.5" opacity="0.70" />
            <image href={Round_logo} x="10.0" y="33.3" width="6.0" height="6.0" opacity="0.55" />
            <image href={Round_logo} x="6.3" y="50.6" width="5.5" height="5.5" opacity="0.40" />
            <image href={Round_logo} x="9.3" y="68.2" width="5.0" height="5.0" opacity="0.28" />
            <image href={Round_logo} x="18.6" y="83.5" width="4.5" height="4.5" opacity="0.18" />
            <image href={Round_logo} x="32.8" y="94.3" width="4.0" height="4.0" opacity="0.10" />
          </g>
        </svg>

        {/* Docked Round Logo: once rotation completes, comes into position in the center of Tree and W */}
        <div className="worksphere-docked-round-wrap">
          <img
            src={Round_logo}
            alt="Worksphere Orb"
            className="worksphere-docked-round-img"
          />
        </div>

        {/* Inner Logos: Tree + W */}
        <div className="worksphere-inner-logos">
          {/* Tree Logo - wings fly in from left and right */}
          <div className="worksphere-tree-wrap">
            <img
              src={Tree_logo}
              alt="Worksphere Tree Left Wing"
              className="worksphere-tree-wing worksphere-tree-left"
            />
            <img
              src={Tree_logo}
              alt="Worksphere Tree Right Wing"
              className="worksphere-tree-wing worksphere-tree-right"
            />
          </div>

          {/* W Logo - 3 lines attach one by one */}
          <div className="worksphere-w-wrap">
            <img
              src={W_logo}
              alt="Worksphere W Line 1"
              className="worksphere-w-line worksphere-w-line-1"
            />
            <img
              src={W_logo}
              alt="Worksphere W Line 2"
              className="worksphere-w-line worksphere-w-line-2"
            />
            <img
              src={W_logo}
              alt="Worksphere W Line 3"
              className="worksphere-w-line worksphere-w-line-3"
            />
          </div>
        </div>
      </div>

      {showText && (
        <div className="worksphere-loader-text">
          <span>Loading</span>
          <span className="worksphere-loader-dots">
            <span>.</span>
            <span>.</span>
            <span>.</span>
          </span>
        </div>
      )}
    </div>
  );
}

export default WorksphereAnimatedLogoLoader;
