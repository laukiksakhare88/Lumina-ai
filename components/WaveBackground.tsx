
import React from 'react';

export const WaveBackground: React.FC = () => {
  return (
    <div className="fixed bottom-0 left-0 w-full h-32 pointer-events-none opacity-40 z-0">
      <svg className="w-full h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
        <defs>
          <linearGradient id="wave-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(0, 210, 255, 0.2)" />
            <stop offset="50%" stopColor="rgba(124, 58, 237, 0.2)" />
            <stop offset="100%" stopColor="rgba(255, 255, 255, 0.1)" />
          </linearGradient>
        </defs>
        <path
          fill="url(#wave-gradient)"
          d="M0,160 C320,300 420,10 640,160 C880,310 1080,20 1440,160 L1440,320 L0,320 Z"
        >
          <animate
            attributeName="d"
            dur="20s"
            repeatCount="indefinite"
            values="
              M0,160 C320,300 420,10 640,160 C880,310 1080,20 1440,160 L1440,320 L0,320 Z;
              M0,160 C320,10 420,300 640,160 C880,20 1080,310 1440,160 L1440,320 L0,320 Z;
              M0,160 C320,300 420,10 640,160 C880,310 1080,20 1440,160 L1440,320 L0,320 Z
            "
          />
        </path>
      </svg>
    </div>
  );
};
