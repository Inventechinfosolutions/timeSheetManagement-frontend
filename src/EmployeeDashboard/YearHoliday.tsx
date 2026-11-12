
import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import dayjs from "dayjs";
import { CalendarDays, Loader2 } from "lucide-react";

import { useAppDispatch, useAppSelector } from "../hooks";

import { fetchHolidays } from "../reducers/masterHoliday.reducer";
import { MasterHoliday } from "../types/masterHoliday.types";

const YEAR_OPTIONS = [2025, 2026, 2027, 2028, 2029, 2030];

const dateKey = (value?: string) => {
  const raw = String(value || "");
  const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : "";
};

const YearHoliday = () => {
  const dispatch = useAppDispatch();
  const currentYear = dayjs().year();

  const { holidays, loading } = useAppSelector(
    (state) =>
      state.masterHolidays || {
        holidays: [],
        loading: false,
      }
  );

  const [year, setYear] = useState(
    YEAR_OPTIONS.includes(currentYear)
      ? currentYear
      : YEAR_OPTIONS[0]
  );

  useEffect(() => {
    dispatch(fetchHolidays());
  }, [dispatch]);

  const rows = useMemo(() => {
    return (holidays || [])
      .map((holiday: MasterHoliday) => ({
        ...holiday,
        dateValue: dateKey(holiday.date),
      }))
      .filter((holiday) =>
        holiday.dateValue.startsWith(String(year))
      )
      .sort((a, b) =>
        a.dateValue.localeCompare(b.dateValue)
      );
  }, [holidays, year]);

  return (
    <div className="p-4 md:p-6 space-y-5">

      {/* Heading and Year Filter */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">

        <h1 className="text-2xl font-bold text-[#2B3674]">
          Holidays
        </h1>

        <div className="flex items-center gap-2">
          <label
            className="text-sm font-medium text-[#2B3674]"
            htmlFor="holiday-year"
          >
            Year
          </label>

          <Select
            id="holiday-year"
            value={year}
            onChange={(value) => setYear(value)}
            className="h-9 w-[110px]"
            popupMatchSelectWidth={120}
            options={YEAR_OPTIONS.map((option) => ({
              value: option,
              label: String(option),
            }))}
          />
        </div>
      </div>

      {/* Holidays Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

        <div className="overflow-x-auto">

          <table className="w-full table-fixed text-base">

            {/* Fixed Column Widths */}
            <colgroup>
              <col style={{ width: "10%" }} />
              <col style={{ width: "25%" }} />
              <col style={{ width: "65%" }} />
            </colgroup>

            <thead className="bg-[#4318FF] text-white">
              <tr className="text-left">

                <th className="px-5 py-4 font-semibold">
                  SL No
                </th>

                <th className="px-5 py-4 font-semibold">
                  Date
                </th>

                <th className="px-5 py-4 font-semibold">
                  Holiday
                </th>

              </tr>
            </thead>

            <tbody>

              {loading && rows.length === 0 ? (

                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-[#A3AED0]"
                  >
                    <Loader2
                      className="inline animate-spin mr-2"
                      size={16}
                    />
                    Loading holidays...
                  </td>
                </tr>

              ) : rows.length === 0 ? (

                <tr>
                  <td
                    colSpan={3}
                    className="px-5 py-10 text-center text-[#A3AED0]"
                  >
                    <CalendarDays
                      size={22}
                      className="inline mr-2 text-[#4318FF]"
                    />
                    No holidays found for {year}.
                  </td>
                </tr>

              ) : (

                rows.map((holiday, index) => (

                  <tr
                    key={holiday.id}
                    className="border-b border-gray-50 last:border-0 hover:bg-[#F4F7FE]/50"
                  >

                    <td className="px-5 py-4 align-middle font-semibold text-[#2B3674]">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4 align-middle font-semibold text-[#2B3674]">
                      {holiday.dateValue
                        ? dayjs(holiday.dateValue).format("DD MMM YYYY")
                        : "—"}
                    </td>

                    <td className="px-5 py-4 align-middle font-medium text-[#2B3674]">
                      {holiday.name}
                    </td>

                  </tr>

                ))

              )}

            </tbody>

          </table>

        </div>
      </div>

    </div>
  );
};

export default YearHoliday;
