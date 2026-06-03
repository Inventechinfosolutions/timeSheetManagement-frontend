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
      <div className="w-[80%] h-[80%] md:w-[50%] md:h-[50%] flex items-center justify-center overflow-hidden relative">
        <video
          ref={videoRef}
          src={splashVideo}
          className="w-full h-full object-contain"
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
        {/* Radial mask overlay to blend the video edges seamlessly into the background */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle, transparent 40%, #DDDEDD 75%)'
          }}
        />
      </div>
      {/* Subtle overlay if needed to match design */}
      <div className="absolute inset-0 bg-linear-to-t from-[#006CF1]/5 via-transparent to-transparent pointer-events-none"></div>
    </div>
  );
};

export default SplashVideo;
