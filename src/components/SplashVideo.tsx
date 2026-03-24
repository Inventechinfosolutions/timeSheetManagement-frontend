import React, { useRef, useEffect } from "react";
import splashVideo from "../assets/SplashVedio_7sec.mp4";

interface SplashVideoProps {
  onComplete?: () => void;
  className?: string;
}

const SplashVideo: React.FC<SplashVideoProps> = ({ onComplete, className = "" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    
    // Force completion at exactly 7 seconds if video hasn't ended naturally
    const timer = setTimeout(() => {
      onComplete?.();
    }, 7200);

    if (video) {
      video.play().catch((error) => {
        console.error("Error playing splash video:", error);
        onComplete?.();
      });
    }

    return () => clearTimeout(timer);
  }, [onComplete]);

  const handleEnded = () => {
    onComplete?.();
  };

  return (
    <div className={`fixed inset-0 z-100 flex items-center justify-center bg-white pointer-events-none ${className}`}>
      <div className="w-[70%] h-[70%] flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={splashVideo}
          className="w-full h-full object-contain"
          muted
          playsInline
          onEnded={handleEnded}
        />
      </div>
      {/* Subtle overlay if needed to match design */}
      <div className="absolute inset-0 bg-linear-to-t from-[#6C63FF]/5 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
};

export default SplashVideo;
