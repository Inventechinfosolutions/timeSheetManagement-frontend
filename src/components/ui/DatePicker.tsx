import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";

const DISPLAY_FORMAT = /^(\d{2})-(\d{2})-(\d{4})$/;
const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const YEAR_START = 1970;
const YEAR_END = new Date().getFullYear() + 20;

type PickerPane = "days" | "monthYear";

const pad = (value: number) => String(value).padStart(2, "0");

const toDisplay = (date: Date) =>
  `${pad(date.getDate())}-${pad(date.getMonth() + 1)}-${date.getFullYear()}`;

const parseDisplay = (value: string): Date | null => {
  const match = DISPLAY_FORMAT.exec(value.trim());
  if (!match) return null;
  const day = Number(match[1]);
  const month = Number(match[2]) - 1;
  const year = Number(match[3]);
  const date = new Date(year, month, day);
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null;
  }
  return date;
};

export interface DatePickerProps {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export const DatePicker: React.FC<DatePickerProps> = ({
  value = "",
  onChange,
  placeholder = "dd-mm-yyyy",
  className = "",
  disabled = false,
}) => {
  const selected = parseDisplay(value);
  const [open, setOpen] = useState(false);
  const [pane, setPane] = useState<PickerPane>("days");
  const [view, setView] = useState(() => selected ?? new Date());
  const [panelStyle, setPanelStyle] = useState<React.CSSProperties>({});
  const fieldRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const yearListRef = useRef<HTMLDivElement>(null);

  const placePanel = () => {
    const rect = fieldRef.current?.getBoundingClientRect();
    if (!rect) return;
    const panelHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      spaceBelow < panelHeight && rect.top > panelHeight
        ? rect.top - panelHeight - 8
        : rect.bottom + 8;
    setPanelStyle({
      position: "fixed",
      top,
      left: rect.left,
      width: Math.max(rect.width, 280),
      zIndex: 10050,
    });
  };

  useEffect(() => {
    if (!open) return;
    placePanel();
    const onScroll = () => placePanel();
    window.addEventListener("resize", onScroll);
    window.addEventListener("scroll", onScroll, true);
    return () => {
      window.removeEventListener("resize", onScroll);
      window.removeEventListener("scroll", onScroll, true);
    };
  }, [open, view, pane]);

  useEffect(() => {
    if (pane !== "monthYear") return;
    const active = yearListRef.current?.querySelector<HTMLButtonElement>("[data-active='true']");
    active?.scrollIntoView({ block: "center" });
  }, [pane, view]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (fieldRef.current?.contains(target) || panelRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [open]);

  const days = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstWeekday = new Date(year, month, 1).getDay();
    const count = new Date(year, month + 1, 0).getDate();
    const cells: Array<Date | null> = Array.from({ length: firstWeekday }, () => null);
    for (let day = 1; day <= count; day += 1) {
      cells.push(new Date(year, month, day));
    }
    return cells;
  }, [view]);

  const openPicker = () => {
    if (disabled) return;
    setView(selected ?? new Date());
    setPane("days");
    setOpen(true);
  };

  const years = useMemo(
    () => Array.from({ length: YEAR_END - YEAR_START + 1 }, (_, index) => YEAR_START + index),
    [],
  );
  const monthName = MONTHS[view.getMonth()];
  const year = view.getFullYear();

  return (
    <>
      <button
        ref={fieldRef}
        type="button"
        disabled={disabled}
        aria-expanded={open}
        onClick={openPicker}
        className={`ui-date-field flex w-full items-center justify-between rounded-xl border border-blue-200/70 bg-white px-3.5 py-2.5 text-left text-sm shadow-none hover:border-blue-400 ${className}`}
      >
        <span className={`font-mono ${selected ? "text-[#0F172A]" : "text-[#64748B]"}`}>
          {selected ? value : placeholder}
        </span>
        <Calendar className="h-4 w-4 shrink-0 text-[#2563EB]" />
      </button>

      {open &&
        createPortal(
          <div
            ref={panelRef}
            style={panelStyle}
            className="rounded-2xl border border-blue-100 bg-white p-3 shadow-xl"
          >
            <div className="mb-2 flex items-center justify-between">
              <button
                type="button"
                className="rounded-lg p-1.5 text-[#2563EB] hover:bg-blue-50"
                onClick={() =>
                  pane === "days"
                    ? setView(new Date(year, view.getMonth() - 1, 1))
                    : setView(new Date(year - 1, view.getMonth(), 1))
                }
                aria-label={pane === "days" ? "Previous month" : "Previous year"}
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                type="button"
                className="rounded-lg px-2 py-1 text-sm font-bold text-[#0F172A] hover:bg-blue-50"
                onClick={() => setPane(pane === "days" ? "monthYear" : "days")}
              >
                {pane === "days" ? `${monthName} ${year}` : `${year}`}
              </button>
              <button
                type="button"
                className="rounded-lg p-1.5 text-[#2563EB] hover:bg-blue-50"
                onClick={() =>
                  pane === "days"
                    ? setView(new Date(year, view.getMonth() + 1, 1))
                    : setView(new Date(year + 1, view.getMonth(), 1))
                }
                aria-label={pane === "days" ? "Next month" : "Next year"}
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
            {pane === "monthYear" ? (
              <div className="space-y-3">
                <div
                  ref={yearListRef}
                  className="grid max-h-28 grid-cols-4 gap-1 overflow-y-auto"
                >
                  {years.map((item) => {
                    const active = item === year;
                    return (
                      <button
                        key={item}
                        type="button"
                        data-active={active ? "true" : "false"}
                        onClick={() => setView(new Date(item, view.getMonth(), 1))}
                        className={`rounded-lg py-1.5 text-xs font-semibold ${
                          active ? "bg-[#2563EB] text-white" : "text-[#0F172A] hover:bg-blue-50"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {MONTHS.map((item, index) => {
                    const active = index === view.getMonth();
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setView(new Date(year, index, 1));
                          setPane("days");
                        }}
                        className={`rounded-lg py-2 text-xs font-semibold ${
                          active ? "bg-[#2563EB] text-white" : "text-[#0F172A] hover:bg-blue-50"
                        }`}
                      >
                        {item}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
            <div className="grid grid-cols-7 gap-1 text-center">
              {WEEKDAYS.map((day) => (
                <span key={day} className="py-1 text-[10px] font-bold uppercase text-[#94A3B8]">
                  {day}
                </span>
              ))}
              {days.map((day, index) => {
                if (!day) return <span key={`empty-${index}`} />;
                const isSelected = selected?.toDateString() === day.toDateString();
                return (
                  <button
                    key={day.toISOString()}
                    type="button"
                    onClick={() => {
                      onChange(toDisplay(day));
                      setOpen(false);
                    }}
                    className={`h-8 rounded-lg text-xs font-semibold ${
                      isSelected
                        ? "bg-[#2563EB] text-white"
                        : "text-[#0F172A] hover:bg-blue-50"
                    }`}
                  >
                    {day.getDate()}
                  </button>
                );
              })}
            </div>
            )}
          </div>,
          document.body,
        )}
    </>
  );
};

export default DatePicker;
