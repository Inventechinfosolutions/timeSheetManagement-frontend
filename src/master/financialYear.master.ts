import axios from 'axios';

export interface FinancialYearItem {
  id: string;
  label: string;
  code: string;
  financialYear: string;
  startYear: number;
  endYear: number;
  isCurrent: boolean;
}

export const YEARS_BEFORE_CURRENT = 5;
export const YEARS_AFTER_CURRENT = 2;

/**
 * Calculates current Financial Year for India fiscal year (April 1 – March 31).
 */
export function getCurrentFinancialYearData(): {
  financialYear: string;
  code: string;
  startYear: number;
  endYear: number;
  label: string;
} {
  const now = new Date();
  const month = now.getMonth(); // 0 = Jan, 3 = Apr
  const calendarYear = now.getFullYear();

  const startYear = month >= 3 ? calendarYear : calendarYear - 1;
  const endYear = startYear + 1;
  const code = `${startYear}-${String(endYear).slice(2)}`;
  const financialYear = `FY ${code}`;

  return {
    financialYear,
    code,
    startYear,
    endYear,
    label: financialYear,
  };
}

/** Returns "FY 2026-27" */
export function getCurrentAcademicYear(): string {
  return getCurrentFinancialYearData().financialYear;
}

/** Alias for getCurrentAcademicYear */
export const getCurrentFinancialYear = getCurrentAcademicYear;

/** Returns "2026-27" */
export function getCurrentAcademicYearCode(): string {
  return getCurrentFinancialYearData().code;
}

/**
 * Returns master list of Financial Year items around current fiscal year.
 */
export function getMasterFinancialYearItems(
  yearsBefore = YEARS_BEFORE_CURRENT,
  yearsAfter = YEARS_AFTER_CURRENT
): FinancialYearItem[] {
  const current = getCurrentFinancialYearData();
  const items: FinancialYearItem[] = [];

  const maxStartYear = current.startYear + yearsAfter;
  const minStartYear = current.startYear - yearsBefore;

  for (let yr = maxStartYear; yr >= minStartYear; yr--) {
    const nextYr = yr + 1;
    const code = `${yr}-${String(nextYr).slice(2)}`;
    const fyLabel = `FY ${code}`;
    items.push({
      id: fyLabel,
      label: fyLabel,
      code,
      financialYear: fyLabel,
      startYear: yr,
      endYear: nextYr,
      isCurrent: yr === current.startYear,
    });
  }

  return items;
}

/**
 * Returns list of master financial year labels:
 * ['FY 2028-29', 'FY 2027-28', 'FY 2026-27', 'FY 2025-26', 'FY 2024-25', 'FY 2023-24', 'FY 2022-23']
 */
export function getMasterFinancialYears(
  yearsBefore = YEARS_BEFORE_CURRENT,
  yearsAfter = YEARS_AFTER_CURRENT
): string[] {
  return getMasterFinancialYearItems(yearsBefore, yearsAfter).map((item) => item.financialYear);
}

/**
 * Returns list of master financial year codes:
 * ['2028-29', '2027-28', '2026-27', '2025-26', '2024-25', '2023-24', '2022-23']
 */
export function getMasterFinancialYearCodes(
  yearsBefore = YEARS_BEFORE_CURRENT,
  yearsAfter = YEARS_AFTER_CURRENT
): string[] {
  return getMasterFinancialYearItems(yearsBefore, yearsAfter).map((item) => item.code);
}

/**
 * Formats select options for Financial Year filters.
 * e.g. [{ label: 'All Years', value: 'ALL' }, { label: 'FY 2028-29', value: 'FY 2028-29' }, ...]
 */
export function getMasterFinancialYearOptions(
  includeAll = false,
  useCodeAsValue = false
): Array<{ label: string; value: string }> {
  const items = getMasterFinancialYearItems();
  const options: Array<{ label: string; value: string }> = [];

  if (includeAll) {
    options.push({ label: 'All Years', value: 'ALL' });
  }

  for (const item of items) {
    options.push({
      label: item.financialYear,
      value: useCodeAsValue ? item.code : item.financialYear,
    });
  }

  return options;
}

// In-memory cache for API-fetched master data
let cachedMasterFYs: FinancialYearItem[] | null = null;

export async function fetchMasterFinancialYears(): Promise<FinancialYearItem[]> {
  if (cachedMasterFYs && cachedMasterFYs.length > 0) {
    return cachedMasterFYs;
  }

  try {
    const response = await axios.get('/api/master/financial-years');
    if (response.data?.success && Array.isArray(response.data.data?.financialYears)) {
      cachedMasterFYs = response.data.data.financialYears;
      return cachedMasterFYs!;
    }
  } catch {
    // Fall back smoothly to generated master items
  }

  cachedMasterFYs = getMasterFinancialYearItems();
  return cachedMasterFYs;
}

export interface QuarterDropdownOption {
  code: string;
  name: string;
  label: string;
  fullLabel: string;
  shortDateRange: string;
  fullDateRange: string;
  startDate: string;
  endDate: string;
  financialYear: string;
  financialYearCode: string;
}

/**
 * Computes the 4 quarters with month ranges for a financial year.
 */
export function computeQuarterDropdownOptions(financialYearInput?: string): QuarterDropdownOption[] {
  let startYear: number;
  let endYear: number;
  const match = (financialYearInput || '').match(/(\d{4})/);
  if (match) {
    startYear = parseInt(match[1], 10);
    endYear = startYear + 1;
  } else {
    const currentFY = getCurrentFinancialYearData();
    startYear = currentFY.startYear;
    endYear = currentFY.endYear;
  }
  const fyCode = `${startYear}-${String(endYear).slice(2)}`;
  const fyLabel = `FY ${fyCode}`;

  return [
    {
      code: 'Q1',
      name: 'Q1',
      label: 'Q1  01 Apr - 30 Jun',
      shortDateRange: '01 Apr - 30 Jun',
      fullDateRange: `01 Apr ${startYear} - 30 Jun ${startYear}`,
      fullLabel: `Q1  01 Apr ${startYear} - 30 Jun ${startYear}`,
      startDate: `${startYear}-04-01`,
      endDate: `${startYear}-06-30`,
      financialYear: fyLabel,
      financialYearCode: fyCode,
    },
    {
      code: 'Q2',
      name: 'Q2',
      label: 'Q2  01 Jul - 30 Sep',
      shortDateRange: '01 Jul - 30 Sep',
      fullDateRange: `01 Jul ${startYear} - 30 Sep ${startYear}`,
      fullLabel: `Q2  01 Jul ${startYear} - 30 Sep ${startYear}`,
      startDate: `${startYear}-07-01`,
      endDate: `${startYear}-09-30`,
      financialYear: fyLabel,
      financialYearCode: fyCode,
    },
    {
      code: 'Q3',
      name: 'Q3',
      label: 'Q3  01 Oct - 31 Dec',
      shortDateRange: '01 Oct - 31 Dec',
      fullDateRange: `01 Oct ${startYear} - 31 Dec ${startYear}`,
      fullLabel: `Q3  01 Oct ${startYear} - 31 Dec ${startYear}`,
      startDate: `${startYear}-10-01`,
      endDate: `${startYear}-12-31`,
      financialYear: fyLabel,
      financialYearCode: fyCode,
    },
    {
      code: 'Q4',
      name: 'Q4',
      label: 'Q4  01 Jan - 31 Mar',
      shortDateRange: '01 Jan - 31 Mar',
      fullDateRange: `01 Jan ${endYear} - 31 Mar ${endYear}`,
      fullLabel: `Q4  01 Jan ${endYear} - 31 Mar ${endYear}`,
      startDate: `${endYear}-01-01`,
      endDate: `${endYear}-03-31`,
      financialYear: fyLabel,
      financialYearCode: fyCode,
    },
  ];
}

/**
 * Returns the quarter dropdown options computed for the given financial year.
 */
export function getQuarterDropdownOptions(financialYear?: string): QuarterDropdownOption[] {
  return computeQuarterDropdownOptions(financialYear);
}

/**
 * Formats a quarter code (e.g. "Q2" or "Q2 FY2026-27") into "Q2  01 Jul - 30 Sep"
 * for table displays and overviews.
 */
export function formatQuarterWithDateRange(quarterString?: string | null, financialYear?: string | null): string {
  if (!quarterString) return '';
  const rawQ = String(quarterString).trim();
  const qMatch = rawQ.match(/Q[1-4]/i);
  if (!qMatch) return rawQ;
  const qCode = qMatch[0].toUpperCase();
  const fy = financialYear || rawQ;
  const options = computeQuarterDropdownOptions(fy);
  const found = options.find((o) => o.code === qCode);
  if (found) {
    return `${qCode}  ${found.shortDateRange}`;
  }
  return qCode;
}

