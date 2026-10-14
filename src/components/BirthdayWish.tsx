import { CSSProperties, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import dayjs from "dayjs";
import { Cake, Gift, Heart, PartyPopper, X } from "lucide-react";
import { useAppSelector } from "../hooks";
import { isBirthdayWishSeen, markBirthdayWishSeen } from "../utils/birthdayWish";

const CONFETTI_COLORS = ["#4318FF", "#868CFF", "#E312DC", "#FFB547", "#01B574", "#6AD2FF", "#EE5D50"];
const CONFETTI_COUNT = 90;
const FALLBACK_FETCH_DELAY_MS = 2000;

const BALLOONS = [
  { left: "6%", color: "#E312DC", size: 46, delay: "0s" },
  { left: "16%", color: "#FFB547", size: 38, delay: "0.8s" },
  { left: "80%", color: "#6AD2FF", size: 42, delay: "0.4s" },
  { left: "90%", color: "#01B574", size: 36, delay: "1.2s" },
];

/** True when the date of birth falls on today (Feb 29 birthdays are celebrated on Feb 28 in non-leap years). */
const isBirthdayToday = (dateOfBirth: string | null | undefined) => {
  if (!dateOfBirth) return false;
  const dob = dayjs(String(dateOfBirth).slice(0, 10));
  if (!dob.isValid()) return false;
  const today = dayjs();
  if (dob.month() !== today.month()) return false;
  if (dob.date() === today.date()) return true;
  const isLeapYear = dayjs(`${today.year()}-02-29`).month() === 1;
  return dob.month() === 1 && dob.date() === 29 && today.date() === 28 && !isLeapYear;
};

const Confetti = () => {
  const pieces = useMemo(
    () =>
      Array.from({ length: CONFETTI_COUNT }, (_, i) => {
        const isCircle = i % 3 === 0;
        const size = 6 + Math.random() * 8;
        return {
          left: `${Math.random() * 100}%`,
          width: isCircle ? size : size * 0.6,
          height: isCircle ? size : size * 1.6,
          borderRadius: isCircle ? "9999px" : "2px",
          backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
          animationDuration: `${4 + Math.random() * 4}s`,
          animationDelay: `${-Math.random() * 8}s`,
          drift: `${(Math.random() - 0.5) * 160}px`,
          spin: `${(Math.random() > 0.5 ? 1 : -1) * (360 + Math.random() * 720)}deg`,
        };
      }),
    [],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 overflow-hidden">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="birthday-confetti-piece"
          style={
            {
              left: p.left,
              width: p.width,
              height: p.height,
              borderRadius: p.borderRadius,
              backgroundColor: p.backgroundColor,
              animationDuration: p.animationDuration,
              animationDelay: p.animationDelay,
              "--confetti-drift": p.drift,
              "--confetti-spin": p.spin,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
};

const Balloon = ({ color, size }: { color: string; size: number }) => (
  <svg width={size} height={size * 1.9} viewBox="0 0 40 76" fill="none" aria-hidden>
    <ellipse cx="20" cy="20" rx="17" ry="20" fill={color} />
    <ellipse cx="14" cy="13" rx="4" ry="6" fill="white" fillOpacity="0.35" />
    <path d="M17 39.5h6l-3 4z" fill={color} />
    <path d="M20 43c-3 8 3 14 0 22s2 10 0 11" stroke={color} strokeOpacity="0.6" strokeWidth="1.2" fill="none" />
  </svg>
);

const BirthdayWish = () => {
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const entity = useAppSelector((state) => state.employeeDetails.entity);

  const myEmployeeId = currentUser?.employeeId || currentUser?.loginId || "";
  const todayStr = dayjs().format("YYYY-MM-DD");

  const [fetchedProfile, setFetchedProfile] = useState<any>(null);
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const entityIsMine = !!entity?.employeeId && entity.employeeId === myEmployeeId;
  const profile = entityIsMine ? entity : fetchedProfile;
  const birthdayToday = isBirthdayToday(profile?.dateOfBirth);

  const close = () => {
    markBirthdayWishSeen(myEmployeeId, todayStr);
    setOpen(false);
    setDismissed(true);
  };

  useEffect(() => {
    if (!myEmployeeId || entityIsMine || fetchedProfile) return;
    const timer = window.setTimeout(() => {
      axios
        .get(`/api/employee-details/${myEmployeeId}`)
        .then((res) => setFetchedProfile(res.data))
        .catch(() => undefined);
    }, FALLBACK_FETCH_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [myEmployeeId, entityIsMine, fetchedProfile]);

  useEffect(() => {
    if (!birthdayToday || !myEmployeeId) return;
    if (isBirthdayWishSeen(myEmployeeId, todayStr)) {
      setDismissed(true);
    } else {
      setOpen(true);
    }
  }, [birthdayToday, myEmployeeId, todayStr]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  if (!birthdayToday) return null;

  const firstName = String(profile?.fullName || currentUser?.aliasLoginName || "").trim().split(/\s+/)[0];

  return createPortal(
    <>
      {dismissed && !open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-90 flex items-center gap-2 pl-2 pr-4 py-2 rounded-full bg-white shadow-[0px_10px_30px_rgba(67,24,255,0.25)] border border-[#4318FF]/10 hover:-translate-y-0.5 transition-transform"
          aria-label="Open birthday wishes"
        >
          <span className="w-8 h-8 rounded-full bg-linear-to-br from-[#E312DC] to-[#4318FF] text-white flex items-center justify-center">
            <Cake size={16} />
          </span>
          <span className="text-xs font-bold text-[#2B3674]">Happy Birthday!</span>
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-200 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="birthday-wish-title"
        >
          <div className="absolute inset-0 bg-[#1B2559]/50 backdrop-blur-sm" onClick={close} />
          <Confetti />

          <div className="birthday-card-enter relative w-full max-w-md bg-white rounded-[28px] shadow-2xl overflow-hidden">
            <button
              onClick={close}
              className="absolute top-4 right-4 z-10 p-1.5 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="relative h-52 bg-linear-to-br from-[#4318FF] via-[#7551FF] to-[#E312DC] overflow-hidden">
              <div className="absolute -top-16 -left-10 w-48 h-48 rounded-full bg-white/10" />
              <div className="absolute -bottom-20 -right-10 w-56 h-56 rounded-full bg-white/10" />
              <div className="absolute top-8 right-24 w-3 h-3 rounded-full bg-[#FFB547]" />
              <div className="absolute top-20 left-24 w-2 h-2 rounded-full bg-white/80" />
              <div className="absolute bottom-10 left-10 w-2.5 h-2.5 rounded-full bg-[#6AD2FF]" />

              {BALLOONS.map((b) => (
                <div
                  key={b.left}
                  className="birthday-balloon absolute top-6"
                  style={{ left: b.left, animationDelay: b.delay }}
                >
                  <Balloon color={b.color} size={b.size} />
                </div>
              ))}

              <div className="absolute inset-x-0 bottom-0 flex justify-center translate-y-1/2">
                <div className="birthday-cake w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center ring-8 ring-white/40">
                  <div className="w-18 h-18 rounded-full bg-linear-to-br from-[#FFF4E5] to-[#FFE3F7] flex items-center justify-center">
                    <Cake size={38} className="text-[#E312DC]" strokeWidth={1.8} />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-16 pb-7 px-7 text-center">
              <p className="flex items-center justify-center gap-1.5 text-[11px] font-black uppercase tracking-[0.2em] text-[#A3AED0]">
                <PartyPopper size={14} className="text-[#FFB547]" /> It's your special day
              </p>
              <h2 id="birthday-wish-title" className="mt-2 text-3xl font-black leading-tight">
                <span className="birthday-shimmer-text">Happy Birthday</span>
                {firstName && <span className="block text-[#2B3674] text-2xl mt-1">{firstName}!</span>}
              </h2>
              <p className="mt-4 text-sm text-gray-500 leading-relaxed">
                Wishing you a wonderful year ahead, full of happiness, good health and great success.
                Thank you for everything you bring to the team. Enjoy your day!
              </p>

              <div className="mt-5 flex items-center justify-center gap-2 text-xs font-semibold text-[#4318FF]">
                <Heart size={14} className="fill-[#EE5D50] text-[#EE5D50]" />
                With warm wishes from everyone at InvenTech Info Solutions
              </div>

              <button
                onClick={close}
                className="mt-6 w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-linear-to-r from-[#4318FF] to-[#E312DC] text-white font-black text-sm shadow-lg shadow-[#4318FF]/25 hover:shadow-xl hover:brightness-110 transition-all"
              >
                <Gift size={18} /> Thank you!
              </button>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};

export default BirthdayWish;
