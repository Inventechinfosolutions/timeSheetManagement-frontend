import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Keyboard } from "lucide-react";

type Period = "AM" | "PM";
type Face = "hour" | "minute";
type Mode = "clock" | "keyboard";

const ACCENT = "#4318FF";
const SIZE = 256;
const CENTER = SIZE / 2;
const RADIUS = 98;

interface ClockTimePickerProps {
  value: string;
  onChange: (value: string) => void;
  ariaLabel: string;
}

const parseTime = (value: string) => {
  const [hStr, mStr] = (value || "09:00").split(":");
  let hour24 = Number(hStr);
  let minute = Number(mStr);
  if (Number.isNaN(hour24)) hour24 = 9;
  if (Number.isNaN(minute)) minute = 0;
  hour24 = ((hour24 % 24) + 24) % 24;
  minute = Math.min(59, Math.max(0, minute));
  const period: Period = hour24 >= 12 ? "PM" : "AM";
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  return { hour12, minute, period };
};

const to24h = (hour12: number, minute: number, period: Period) => {
  let hour24 = hour12 % 12;
  if (period === "PM") hour24 += 12;
  return `${String(hour24).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
};

const formatLabel = (value: string) => {
  const { hour12, minute, period } = parseTime(value);
  return `${String(hour12).padStart(2, "0")}:${String(minute).padStart(2, "0")} ${period}`;
};

const ClockTimePicker: React.FC<ClockTimePickerProps> = ({
  value,
  onChange,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const [hour12, setHour12] = useState(9);
  const [minute, setMinute] = useState(0);
  const [period, setPeriod] = useState<Period>("AM");
  const [face, setFace] = useState<Face>("hour");
  const [mode, setMode] = useState<Mode>("clock");
  const [hourText, setHourText] = useState("09");
  const [minuteText, setMinuteText] = useState("00");
  const clockRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);
  const faceRef = useRef<Face>("hour");

  useEffect(() => {
    faceRef.current = face;
  }, [face]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openPicker = () => {
    const parsed = parseTime(value);
    setHour12(parsed.hour12);
    setMinute(parsed.minute);
    setPeriod(parsed.period);
    setHourText(String(parsed.hour12).padStart(2, "0"));
    setMinuteText(String(parsed.minute).padStart(2, "0"));
    setFace("hour");
    setMode("clock");
    setOpen(true);
  };

  const commit = () => {
    let nextHour = hour12;
    let nextMinute = minute;
    if (mode === "keyboard") {
      const typedHour = Number(hourText);
      const typedMinute = Number(minuteText);
      if (typedHour >= 1 && typedHour <= 12) nextHour = typedHour;
      if (typedMinute >= 0 && typedMinute <= 59) nextMinute = typedMinute;
    }
    onChange(to24h(nextHour, nextMinute, period));
    setOpen(false);
  };

  const applyPointer = (clientX: number, clientY: number) => {
    const rect = clockRef.current?.getBoundingClientRect();
    if (!rect) return;
    const dx = clientX - (rect.left + rect.width / 2);
    const dy = clientY - (rect.top + rect.height / 2);
    const clock = (Math.atan2(dx, -dy) * 180) / Math.PI;
    const degrees = (clock + 360) % 360;
    if (faceRef.current === "hour") {
      const index = Math.round(degrees / 30) % 12;
      setHour12(index === 0 ? 12 : index);
    } else {
      setMinute(Math.round(degrees / 6) % 60);
    }
  };

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    applyPointer(event.clientX, event.clientY);
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    applyPointer(event.clientX, event.clientY);
  };

  const onPointerUp = () => {
    if (!dragging.current) return;
    dragging.current = false;
    if (faceRef.current === "hour") setFace("minute");
  };

  const angle = face === "hour" ? (hour12 % 12) * 30 : minute * 6;
  const knobX = CENTER + Math.sin((angle * Math.PI) / 180) * RADIUS;
  const knobY = CENTER - Math.cos((angle * Math.PI) / 180) * RADIUS;
  const dial =
    face === "hour"
      ? [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]
      : [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const selectedValue = face === "hour" ? hour12 : minute;

  const dialog = open
    ? createPortal(
        <div
          className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/45 p-4"
          onMouseDown={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={ariaLabel}
            className="w-full max-w-[360px] rounded-[28px] bg-white p-5 shadow-[0_24px_60px_rgba(27,37,89,0.28)]"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <h2 className="text-[22px] font-semibold tracking-tight text-[#1B2559]">
              Select Time
            </h2>

            <div className="mt-4 flex items-center gap-2">
              <button
                type="button"
                onClick={() => setFace("hour")}
                className={`min-w-[88px] rounded-2xl px-3 py-3 text-center text-[42px] font-medium leading-none transition ${
                  face === "hour"
                    ? "bg-[#4318FF] text-white shadow-md shadow-indigo-500/30"
                    : "text-[#4318FF]"
                }`}
              >
                {String(hour12).padStart(2, "0")}
              </button>
              <span className="text-[40px] font-medium leading-none text-[#4318FF]">:</span>
              <button
                type="button"
                onClick={() => setFace("minute")}
                className={`min-w-[88px] rounded-2xl px-3 py-3 text-center text-[42px] font-medium leading-none transition ${
                  face === "minute"
                    ? "bg-[#4318FF] text-white shadow-md shadow-indigo-500/30"
                    : "text-[#4318FF]"
                }`}
              >
                {String(minute).padStart(2, "0")}
              </button>
              <div className="ml-auto flex w-[58px] flex-col overflow-hidden rounded-xl border-2 border-[#4318FF]">
                {(["AM", "PM"] as Period[]).map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => setPeriod(item)}
                    className={`h-9 text-sm font-bold transition ${
                      period === item
                        ? "bg-[#4318FF] text-white"
                        : "bg-white text-[#4318FF] hover:bg-indigo-50"
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

            {mode === "clock" ? (
              <div className="mt-5 flex justify-center">
                <div
                  ref={clockRef}
                  className="relative cursor-pointer touch-none select-none rounded-full bg-[#EEF2FF]"
                  style={{ width: SIZE, height: SIZE }}
                  onPointerDown={onPointerDown}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                  onPointerCancel={onPointerUp}
                >
                  <svg
                    className="absolute inset-0"
                    width={SIZE}
                    height={SIZE}
                    viewBox={`0 0 ${SIZE} ${SIZE}`}
                  >
                    <line
                      x1={CENTER}
                      y1={CENTER}
                      x2={knobX}
                      y2={knobY}
                      stroke={ACCENT}
                      strokeWidth="2"
                    />
                    <circle cx={CENTER} cy={CENTER} r="4" fill={ACCENT} />
                    <circle cx={knobX} cy={knobY} r="18" fill={ACCENT} />
                  </svg>
                  {dial.map((item, index) => {
                    const itemAngle = index * 30;
                    const x =
                      CENTER + Math.sin((itemAngle * Math.PI) / 180) * RADIUS;
                    const y =
                      CENTER - Math.cos((itemAngle * Math.PI) / 180) * RADIUS;
                    const selected = item === selectedValue;
                    return (
                      <span
                        key={item}
                        className={`pointer-events-none absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-sm font-semibold ${
                          selected ? "text-white" : "text-[#1B2559]"
                        }`}
                        style={{ left: x, top: y }}
                      >
                        {face === "minute" ? String(item).padStart(2, "0") : item}
                      </span>
                    );
                  })}
                  {face === "minute" && minute % 5 !== 0 && (
                    <span
                      className="pointer-events-none absolute flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center text-xs font-bold text-white"
                      style={{ left: knobX, top: knobY }}
                    >
                      {String(minute).padStart(2, "0")}
                    </span>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4 rounded-3xl bg-[#EEF2FF] px-5 py-8">
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Hour
                  </span>
                  <input
                    inputMode="numeric"
                    maxLength={2}
                    value={hourText}
                    onChange={(event) => {
                      const next = event.target.value.replace(/\D/g, "").slice(0, 2);
                      setHourText(next);
                      const typed = Number(next);
                      if (typed >= 1 && typed <= 12) setHour12(typed);
                    }}
                    className="w-full rounded-xl border border-transparent bg-white px-3 py-3 text-center text-3xl font-semibold text-[#1B2559] outline-none focus:border-[#4318FF]"
                  />
                </label>
                <label className="block">
                  <span className="mb-1 block text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Minute
                  </span>
                  <input
                    inputMode="numeric"
                    maxLength={2}
                    value={minuteText}
                    onChange={(event) => {
                      const next = event.target.value.replace(/\D/g, "").slice(0, 2);
                      setMinuteText(next);
                      const typed = Number(next);
                      if (typed >= 0 && typed <= 59) setMinute(typed);
                    }}
                    className="w-full rounded-xl border border-transparent bg-white px-3 py-3 text-center text-3xl font-semibold text-[#1B2559] outline-none focus:border-[#4318FF]"
                  />
                </label>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (mode === "clock") {
                    setHourText(String(hour12).padStart(2, "0"));
                    setMinuteText(String(minute).padStart(2, "0"));
                    setMode("keyboard");
                  } else {
                    setMode("clock");
                  }
                }}
                className="rounded-full p-2 text-slate-500 transition hover:bg-slate-100 hover:text-[#4318FF]"
                aria-label={mode === "clock" ? "Type time" : "Use clock"}
              >
                <Keyboard size={20} />
              </button>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-full px-4 py-2 text-sm font-bold tracking-wide text-[#4318FF] hover:bg-indigo-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={commit}
                  className="rounded-full px-4 py-2 text-sm font-bold tracking-wide text-[#4318FF] hover:bg-indigo-50"
                >
                  OK
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )
    : null;

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        className="w-full cursor-pointer rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-left text-sm font-semibold text-[#1B2559] transition hover:border-[#4318FF] focus:border-[#4318FF] focus:outline-none focus:ring-2 focus:ring-[#4318FF]/15"
      >
        {formatLabel(value)}
      </button>
      {dialog}
    </>
  );
};

export default ClockTimePicker;
