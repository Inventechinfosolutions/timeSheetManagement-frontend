import { useRef, useEffect } from "react";
import loaderVideoMp4 from "../assets/User_s_Animation_GIF_Request_Fulfilled.mp4";
import "./LoginLoader.css";

const LoginLoader = () => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    video.play().catch(() => {});
  }, []);

  return (
    <div className="login-loader">
      <div className="login-loader__backdrop" />
      <div className="login-loader__content">
        <div className="login-loader__video-wrap">
          <video
            ref={videoRef}
            className="login-loader__video"
            muted
            loop
            playsInline
            autoPlay
          >
            <source
              src="/User_s_Animation_GIF_Request_Fulfilled.webm"
              type="video/webm"
            />
            <source src={loaderVideoMp4} type="video/mp4" />
          </video>
        </div>
        <p className="login-loader__text">Loading...</p>
      </div>
    </div>
  );
};

export default LoginLoader;
