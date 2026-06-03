import React, { useRef, useEffect } from "react";
import splashVideo from "../assets/download.mp4";
import SplashScreen from "./SpalashScreen";

interface SplashVideoProps {
  onComplete?: () => void;
  className?: string;
}

const SplashVideo: React.FC<SplashVideoProps> = ({ onComplete, className = "" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    const playbackRate = 1.4;
    
    // Force completion at adjusted duration if video hasn't ended naturally
    const timer = setTimeout(() => {
      onComplete?.();
    }, 5000);

    if (video) {
      video.playbackRate = playbackRate;
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
    <div className={`fixed inset-0 z-100 flex items-center justify-center bg-[#e0e0e0] pointer-events-none ${className}`}>
      <div className="w-full h-full flex items-center justify-center overflow-hidden">
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
      <div className="absolute inset-0 bg-linear-to-t from-[#006CF1]/5 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
};

export default SplashVideo;
