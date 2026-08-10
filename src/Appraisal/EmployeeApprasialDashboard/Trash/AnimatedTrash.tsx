import React from 'react';
import './AnimatedTrash.css';

interface Props {
  animate: boolean;
}

const AnimatedTrash: React.FC<Props> = ({ animate }) => {
  return (
    <svg
      className={`animated-trash ${animate ? 'animate' : ''}`}
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
    >
      {/* Lid */}
      <g className="trash-lid">
        <path
          d="M8 5H16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M5 7H19"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>

      {/* Bin */}
      <g className="trash-body">
        <path
          d="M7 7L8 20H16L17 7"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        <path
          d="M10 11V17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />

        <path
          d="M14 11V17"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
};

export default AnimatedTrash;