import { QuaterlyEnum } from "../enums/appraisal.enums";
import {
  AppraisalApi,
  MasterFinancialYearOption,
  MasterQuarterRecord,
} from "../services/appraisal.api";

export interface CurrentMasterYearAndQuarter {
  financialYear: string;
  fromYear: number;
  toYear: number;
  yearStartDate: string;
  yearEndDate: string;
  quarter: QuaterlyEnum;
  quarterStartDate: string;
  quarterEndDate: string;
}

const toLocalIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const datePart = (value?: string | null): string => (value ? value.slice(0, 10) : "");

const coversDate = (start: string | undefined, end: string | undefined, day: string): boolean => {
  const startDay = datePart(start);
  const endDay = datePart(end);
  if (!startDay || !endDay) return false;
  return startDay <= day && day <= endDay;
};

const findCurrentYear = (
  years: MasterFinancialYearOption[],
  day: string,
): MasterFinancialYearOption | undefined =>
  years.find((item) => coversDate(item.startDate, item.endDate, day));

const findCurrentQuarter = (
  quarters: MasterQuarterRecord[],
  day: string,
): MasterQuarterRecord | undefined =>
  quarters.find((item) => coversDate(item.startDate, item.endDate, day) && Boolean(item.quaterLabel));

export interface AppraisalPeriodLoad {
  years: MasterFinancialYearOption[];
  quarters: MasterQuarterRecord[];
  current: CurrentMasterYearAndQuarter | null;
}

export async function loadAppraisalPeriod(
  today: Date = new Date(),
): Promise<AppraisalPeriodLoad> {
  const day = toLocalIsoDate(today);
  const years = await AppraisalApi.getMasterFinancialYears();
  const year = findCurrentYear(years, day);
  if (!year) {
    return { years, quarters: [], current: null };
  }

  const quarters = await AppraisalApi.getMasterQuarters(year.fromYear);
  const quarter = findCurrentQuarter(quarters, day);
  if (!quarter?.quaterLabel || !quarter.startDate || !quarter.endDate) {
    return { years, quarters, current: null };
  }

  return {
    years,
    quarters,
    current: {
      financialYear: year.financialYear,
      fromYear: year.fromYear,
      toYear: year.toYear,
      yearStartDate: datePart(year.startDate),
      yearEndDate: datePart(year.endDate),
      quarter: quarter.quaterLabel,
      quarterStartDate: datePart(quarter.startDate),
      quarterEndDate: datePart(quarter.endDate),
    },
  };
}

export async function getCurrentMasterYearAndQuarter(
  today: Date = new Date(),
): Promise<CurrentMasterYearAndQuarter | null> {
  const period = await loadAppraisalPeriod(today);
  return period.current;
}
