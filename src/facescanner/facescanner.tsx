import { useEffect, useRef, useState } from 'react';
import { FaceLandmarker, FilesetResolver } from '@mediapipe/tasks-vision';

export type FaceScannerMode = 'enroll' | 'verify';

export interface FaceScannerProgress {
  overall: number;
  phase: number;
  phaseIndex?: number;
  hold?: number;
}

interface FaceScannerProps {
  mode: FaceScannerMode;
  onComplete: (images: string[]) => void;
  onError: (message: string) => void;
  onProgress?: (progress: FaceScannerProgress) => void;
}

const PHASES = ['center', 'left', 'right', 'up', 'down'] as const;
const PROMPTS: Record<(typeof PHASES)[number], string> = {
  center: 'Look straight at the camera',
  left: 'Turn your head to the left',
  right: 'Turn your head to the right',
  up: 'Look up',
  down: 'Look down',
};
const PHASE_LABELS: Record<(typeof PHASES)[number], string> = {
  center: 'Center',
  left: 'Left',
  right: 'Right',
  up: 'Up',
  down: 'Down',
};

const JAW_LINE = [234, 127, 162, 21, 54, 103, 67, 109, 10, 338, 297, 332, 284, 251, 389, 356, 454];
const LEFT_EYE = [33, 160, 158, 133, 153, 144];
const RIGHT_EYE = [362, 385, 387, 263, 373, 380];

const HOLD_FRAMES = 10;
const HOLD_GRACE = 3;
const YAW = 0.12;
const YAW_CENTER = 0.22;
const P = 0.12;
const P_CENTER = 0.25;
const JPEG_QUALITY = 0.95;
const MIN_FACE_SIZE = 0.18;
const MIN_BRIGHTNESS = 40;
const MAX_BRIGHTNESS = 220;
const VERIFY_FRAME_COUNT = 3;
const VERIFY_HOLD_FRAMES = 30;
const VERIFY_BUFFER_SIZE = 10;

type Landmark = { x: number; y: number; z: number };

function estimatePose(lm: Landmark[]) {
  const nose = lm[1];
  const forehead = lm[10];
  const chin = lm[152];
  const le = lm[234];
  const re = lm[454];
  const fw = Math.abs(re.x - le.x) || 0.001;
  const cx = (le.x + re.x) / 2;
  const yaw = (nose.x - cx) / fw;
  const faceMidY = (forehead.y + chin.y) / 2;
  const fh = Math.abs(chin.y - forehead.y) || 0.001;
  const pitch = (nose.y - faceMidY) / fh;
  return { yaw, pitch };
}

function checkPhase(phase: (typeof PHASES)[number], lm: Landmark[]) {
  const { yaw, pitch } = estimatePose(lm);
  if (phase === 'center') return Math.abs(yaw) < YAW_CENTER && Math.abs(pitch) < P_CENTER;
  if (phase === 'left') return yaw > YAW;
  if (phase === 'right') return yaw < -YAW;
  if (phase === 'up') return pitch < -P;
  if (phase === 'down') return pitch > P;
  return false;
}

function faceSize(lm: Landmark[]) {
  const le = lm[234];
  const re = lm[454];
  return Math.abs(re.x - le.x);
}

function scorePoseFrame(phase: (typeof PHASES)[number], lm: Landmark[]) {
  const { yaw, pitch } = estimatePose(lm);
  const size = faceSize(lm);
  if (phase === 'center') return size - (Math.abs(yaw) + Math.abs(pitch)) * 3;
  if (phase === 'left') return size + yaw * 4 - Math.abs(pitch) * 2;
  if (phase === 'right') return size - yaw * 4 - Math.abs(pitch) * 2;
  if (phase === 'up') return size - pitch * 4 - Math.abs(yaw) * 2;
  if (phase === 'down') return size + pitch * 4 - Math.abs(yaw) * 2;
  return size;
}

function drawContour(ctx: CanvasRenderingContext2D, lm: Landmark[], indices: number[], w: number, h: number) {
  if (indices.length < 2) return;
  ctx.beginPath();
  const first = lm[indices[0]];
  ctx.moveTo(first.x * w, first.y * h);
  for (let i = 1; i < indices.length; i++) {
    const p = lm[indices[i]];
    ctx.lineTo(p.x * w, p.y * h);
  }
  ctx.stroke();
}

const FaceScanner = ({ mode, onComplete, onError, onProgress }: FaceScannerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const rafRef = useRef<number>(0);

  const phaseIndexRef = useRef(0);
  const phaseHoldRef = useRef(0);
  const missCountRef = useRef(0);
  const poseCapturesRef = useRef<string[]>([]);
  const bestHoldFrameRef = useRef<string | null>(null);
  const bestHoldScoreRef = useRef(Number.NEGATIVE_INFINITY);
  const verifyHoldRef = useRef(0);
  const verifyBufferRef = useRef<{ image: string; score: number }[]>([]);
  const verifySubmittedRef = useRef(false);

  const [prompt, setPrompt] = useState('Initializing camera...');
  const [overallPct, setOverallPct] = useState(0);
  const [phasePct, setPhasePct] = useState(0);
  const [verifyPct, setVerifyPct] = useState(0);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [faceDetected, setFaceDetected] = useState(false);
  const [qualityOk, setQualityOk] = useState(false);
  const [poseValid, setPoseValid] = useState(false);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);
  const onProgressRef = useRef(onProgress);

  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
    onProgressRef.current = onProgress;
  }, [onComplete, onError, onProgress]);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let cancelled = false;

    const estimateBrightness = (video: HTMLVideoElement) => {
      const c = document.createElement('canvas');
      c.width = 32;
      c.height = 32;
      const g = c.getContext('2d');
      if (!g) return 0;
      g.drawImage(video, 0, 0, 32, 32);
      const data = g.getImageData(0, 0, 32, 32).data;
      let sum = 0;
      for (let i = 0; i < data.length; i += 4) {
        sum += (data[i] + data[i + 1] + data[i + 2]) / 3;
      }
      return sum / (data.length / 4);
    };

    const passesQualityGate = (lm: Landmark[], video: HTMLVideoElement) => {
      if (faceSize(lm) < MIN_FACE_SIZE) return false;
      const brightness = estimateBrightness(video);
      return brightness >= MIN_BRIGHTNESS && brightness <= MAX_BRIGHTNESS;
    };

    const captureFrame = (video: HTMLVideoElement) => {
      const c = document.createElement('canvas');
      c.width = video.videoWidth;
      c.height = video.videoHeight;
      c.getContext('2d')?.drawImage(video, 0, 0);
      return c.toDataURL('image/jpeg', JPEG_QUALITY);
    };

    const pushScoredFrame = (buffer: { image: string; score: number }[], frame: { image: string; score: number }) => {
      const next = [...buffer, frame];
      if (next.length <= VERIFY_BUFFER_SIZE) return next;
      return next.sort((a, b) => b.score - a.score).slice(0, VERIFY_BUFFER_SIZE);
    };

    const pickTopVerifyFrames = (buffer: { image: string; score: number }[], count: number) =>
      [...buffer].sort((a, b) => b.score - a.score).slice(0, count).map((f) => f.image);

    const updateEnrollProgress = () => {
      const phasePctValue = Math.min(phaseHoldRef.current / HOLD_FRAMES, 1);
      const overallPctValue = Math.min((phaseIndexRef.current + phasePctValue) / PHASES.length, 1);
      setOverallPct(overallPctValue);
      setPhasePct(phasePctValue);
      setPhaseIndex(phaseIndexRef.current);
      onProgressRef.current?.({
        overall: overallPctValue,
        phase: phasePctValue,
        phaseIndex: phaseIndexRef.current,
        hold: phaseHoldRef.current,
      });
    };

    const updateVerifyProgress = () => {
      const pct = Math.min(verifyHoldRef.current / VERIFY_HOLD_FRAMES, 1);
      setVerifyPct(pct);
      onProgressRef.current?.({ overall: pct, phase: pct, hold: verifyHoldRef.current });
    };

    const resetHold = () => {
      phaseHoldRef.current = 0;
      missCountRef.current = 0;
      bestHoldFrameRef.current = null;
      bestHoldScoreRef.current = Number.NEGATIVE_INFINITY;
      updateEnrollProgress();
    };

    const resetVerifyCapture = () => {
      verifyHoldRef.current = 0;
      verifyBufferRef.current = [];
      updateVerifyProgress();
    };

    const drawLandmarks = (lm: Landmark[], w: number, h: number, validPose: boolean) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);

      const accent = validPose ? '#34d399' : '#4318FF';
      ctx.strokeStyle = validPose ? 'rgba(52, 211, 153, 0.35)' : 'rgba(67, 24, 255, 0.25)';
      ctx.lineWidth = 1;
      drawContour(ctx, lm, JAW_LINE, w, h);
      drawContour(ctx, lm, LEFT_EYE, w, h);
      drawContour(ctx, lm, RIGHT_EYE, w, h);

      for (const p of lm) {
        ctx.beginPath();
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.arc(p.x * w, p.y * h, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = validPose ? 'rgba(52, 211, 153, 0.6)' : 'rgba(67, 24, 255, 0.5)';
        ctx.arc(p.x * w, p.y * h, 0.6, 0, Math.PI * 2);
        ctx.fill();
      }

      const nose = lm[1];
      ctx.beginPath();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 2;
      ctx.arc(nose.x * w, nose.y * h, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.arc(nose.x * w, nose.y * h, 2, 0, Math.PI * 2);
      ctx.fill();
    };

    const loop = () => {
      if (cancelled) return;
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const landmarker = landmarkerRef.current;
      if (!video || !canvas || !landmarker || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(loop);
        return;
      }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const result = landmarker.detectForVideo(video, performance.now());
      const faces = result.faceLandmarks || [];

      if (faces.length === 1) {
        const qualityOk = passesQualityGate(faces[0], video);
        let currentPoseValid = false;

        if (mode === 'verify' && !verifySubmittedRef.current) {
          currentPoseValid = checkPhase('center', faces[0]) && qualityOk;
        } else if (mode === 'enroll' && phaseIndexRef.current < PHASES.length) {
          const current = PHASES[phaseIndexRef.current];
          currentPoseValid = checkPhase(current, faces[0]) && qualityOk;
        }

        drawLandmarks(faces[0], canvas.width, canvas.height, currentPoseValid);
        setFaceDetected(true);
        setQualityOk(qualityOk);
        setPoseValid(currentPoseValid);

        if (mode === 'verify' && !verifySubmittedRef.current) {
          if (currentPoseValid) {
            verifyHoldRef.current++;
            updateVerifyProgress();
            setPrompt(`Hold still… ${Math.round((verifyHoldRef.current / VERIFY_HOLD_FRAMES) * 100)}%`);

            const frame = captureFrame(video);
            const score = scorePoseFrame('center', faces[0]);
            verifyBufferRef.current = pushScoredFrame(verifyBufferRef.current, { image: frame, score });

            if (verifyHoldRef.current >= VERIFY_HOLD_FRAMES) {
              const images = pickTopVerifyFrames(verifyBufferRef.current, VERIFY_FRAME_COUNT);
              if (images.length < VERIFY_FRAME_COUNT) {
                onErrorRef.current('Could not capture enough frames. Please try again.');
                resetVerifyCapture();
              } else {
                verifySubmittedRef.current = true;
                setPrompt('Verifying...');
                onCompleteRef.current(images);
              }
            }
          } else {
            resetVerifyCapture();
            setPrompt(
              qualityOk ? 'Look straight at the camera and hold still' : 'Move closer and improve lighting',
            );
          }
        }

        if (mode === 'enroll' && phaseIndexRef.current < PHASES.length) {
          const current = PHASES[phaseIndexRef.current];
          if (currentPoseValid) {
            missCountRef.current = 0;
            phaseHoldRef.current++;
            updateEnrollProgress();

            const frame = captureFrame(video);
            const score = scorePoseFrame(current, faces[0]);
            if (score > bestHoldScoreRef.current) {
              bestHoldScoreRef.current = score;
              bestHoldFrameRef.current = frame;
            }

            if (phaseHoldRef.current >= HOLD_FRAMES) {
              if (!bestHoldFrameRef.current) {
                rafRef.current = requestAnimationFrame(loop);
                return;
              }
              poseCapturesRef.current.push(bestHoldFrameRef.current);
              bestHoldFrameRef.current = null;
              bestHoldScoreRef.current = Number.NEGATIVE_INFINITY;
              phaseIndexRef.current++;
              phaseHoldRef.current = 0;
              missCountRef.current = 0;
              updateEnrollProgress();

              if (phaseIndexRef.current < PHASES.length) {
                setPrompt(PROMPTS[PHASES[phaseIndexRef.current]]);
              } else if (poseCapturesRef.current.length === PHASES.length) {
                setPrompt('Enrollment complete!');
                onCompleteRef.current([...poseCapturesRef.current]);
              } else {
                onErrorRef.current('Enrollment capture incomplete. Please try again.');
              }
            }
          } else {
            missCountRef.current++;
            if (missCountRef.current >= HOLD_GRACE) {
              resetHold();
              if (!qualityOk) {
                setPrompt('Move closer and improve lighting');
              }
            }
          }
        }
      } else {
        const ctx = canvas.getContext('2d');
        ctx?.clearRect(0, 0, canvas.width, canvas.height);
        setFaceDetected(false);
        setQualityOk(false);
        setPoseValid(false);
        if (mode === 'enroll') {
          resetHold();
        } else {
          resetVerifyCapture();
          setPrompt('Exactly one face required');
        }
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    const init = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'user', width: 640, height: 480 },
        });
        if (cancelled) return;

        const video = videoRef.current;
        if (!video) return;
        video.srcObject = stream;
        await video.play();

        const vision = await FilesetResolver.forVisionTasks(
          'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm',
        );
        landmarkerRef.current = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath:
              'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
            delegate: 'GPU',
          },
          runningMode: 'VIDEO',
          numFaces: 1,
        });

        if (mode === 'verify') {
          setPrompt('Look at the camera and hold still');
        } else {
          setPrompt(PROMPTS[PHASES[0]]);
        }

        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        onErrorRef.current(e instanceof Error ? e.message : 'Failed to start camera');
      }
    };

    init();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      stream?.getTracks().forEach((t) => t.stop());
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
    };
  }, [mode]);

  const guideActive = faceDetected && qualityOk;
  const scanning =
    mode === 'enroll'
      ? overallPct > 0 && overallPct < 1
      : verifyPct > 0 && verifyPct < 1;

  return (
    <div className="relative w-full max-w-2xl mx-auto aspect-video rounded-2xl overflow-hidden bg-black shadow-lg ring-1 ring-slate-200/80">
      <video
        ref={videoRef}
        playsInline
        autoPlay
        muted
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1]"
      />
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full object-cover scale-x-[-1] pointer-events-none"
      />

      <div
        className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]"
        aria-hidden
      />

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          className={`w-[42%] h-[68%] rounded-[50%] border-2 transition-all duration-300 ${
            guideActive
              ? 'border-emerald-400/70 shadow-[0_0_24px_rgba(52,211,153,0.25)]'
              : 'border-white/30'
          } ${scanning ? 'animate-pulse' : ''}`}
        />
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10">
        <div className="backdrop-blur-md bg-black/50 border border-white/10 text-white px-5 py-2 rounded-full text-sm font-medium shadow-lg">
          {prompt}
        </div>
      </div>

      <div className="absolute bottom-4 left-4 right-4 z-10">
        <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-xl px-4 py-3 shadow-lg">
          {mode === 'enroll' ? (
            <>
              <div className="flex flex-wrap gap-1.5 mb-3">
                {PHASES.map((phase, i) => {
                  const completed = i < phaseIndex;
                  const active = i === phaseIndex;
                  return (
                    <span
                      key={phase}
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide transition-colors ${
                        completed
                          ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-400/40'
                          : active
                            ? 'bg-white/15 text-white border border-white/30'
                            : 'bg-white/5 text-white/40 border border-white/10'
                      }`}
                    >
                      {PHASE_LABELS[phase]}
                    </span>
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/60 mb-1.5">
                <span>Overall progress</span>
                <span>{Math.round(overallPct * 100)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden mb-2.5">
                <div
                  className="h-full bg-gradient-to-r from-[#4318FF] to-emerald-400 transition-all duration-150 rounded-full"
                  style={{ width: `${overallPct * 100}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-white/60 mb-1.5">
                <span>Current pose</span>
                <span>{Math.round(phasePct * 100)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 rounded-full ${
                    poseValid ? 'bg-emerald-400' : 'bg-[#4318FF]/70'
                  }`}
                  style={{ width: `${phasePct * 100}%` }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between text-[10px] text-white/60 mb-1.5">
                <span>Capture progress</span>
                <span>{Math.round(verifyPct * 100)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-150 rounded-full ${
                    poseValid ? 'bg-emerald-400' : 'bg-[#4318FF]/70'
                  }`}
                  style={{ width: `${verifyPct * 100}%` }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default FaceScanner;
