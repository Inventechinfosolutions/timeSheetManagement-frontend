import React, { useRef, useEffect, useState } from "react";
import splashVideo from "../assets/download.mp4";

interface SplashVideoProps {
  onComplete?: () => void;
  className?: string;
}

const SplashVideo: React.FC<SplashVideoProps> = ({ onComplete, className = "" }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    const playbackRate = 1.4;
    
    // Force completion at adjusted duration if video hasn't ended naturally
    const timer = setTimeout(() => {
      onComplete?.();
    }, 5000);

    if (video) {
      video.playbackRate = playbackRate;
      if (video.readyState >= 3) {
        setIsVideoReady(true);
      }
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

  const handlePlay = () => {
    setIsVideoReady(true);
  };

  return (
    <div className={`fixed inset-0 z-100 flex items-center justify-center bg-[#DDDEDD] pointer-events-none ${className}`}>
      <div className="w-[80%] md:w-[50%] aspect-video flex items-center justify-center overflow-hidden relative">
        <video
          ref={videoRef}
          src={splashVideo}
          className="w-full h-full object-cover"
          muted
          playsInline
          onEnded={handleEnded}
          onPlay={handlePlay}
          onLoadedData={handlePlay}
          style={{ 
            opacity: isVideoReady ? 1 : 0,
            transition: 'opacity 0.3s ease-in',
            backgroundColor: 'transparent', 
            outline: 'none', 
            border: 'none' 
          }}
        />
        {/* Edge-blending overlays to match the video frame with the page background */}
        <div className="absolute inset-y-0 left-0 w-16 pointer-events-none bg-gradient-to-r from-[#DDDEDD] to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-16 pointer-events-none bg-gradient-to-l from-[#DDDEDD] to-transparent z-10" />
        <div className="absolute inset-x-0 top-0 h-16 pointer-events-none bg-gradient-to-b from-[#DDDEDD] to-transparent z-10" />
        {/* Extremely thin bottom overlay to blend the very bottom edge without touching the text */}
        <div className="absolute inset-x-0 bottom-0 h-1 pointer-events-none bg-gradient-to-t from-[#DDDEDD] to-transparent z-10" />
      </div>
      {/* Subtle overlay if needed to match design */}
      <div className="absolute inset-0 bg-linear-to-t from-[#006CF1]/5 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
};

export default SplashVideo;
