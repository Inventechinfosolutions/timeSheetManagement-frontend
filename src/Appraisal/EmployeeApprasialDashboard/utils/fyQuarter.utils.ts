/**
 * Quarter utility helpers for India Financial Year (April–March)
 * Quarter format: "Q2 FY2026-27"
 */

// ── Financial Year & Quarter Constants ──────────────────────────────────────
const QUARTER_REGEX_PATTERN = /^Q(\d) FY(\d{4})-\d{2}$/;
const SLUG_REGEX_PATTERN = /^Q\d-FY\d{4}-\d{2}$/i;
const SLUG_CAPTURE_REGEX_PATTERN = /^(Q\d)-(FY\d{4}-\d{2})$/i;
const MULTIPLE_WHITESPACE_REGEX = /\s+/g;

const QUARTER_NUMBER_ONE = 1;
const QUARTER_NUMBER_TWO = 2;
const QUARTER_NUMBER_THREE = 3;
const QUARTER_NUMBER_FOUR = 4;

const JANUARY_MONTH_INDEX = 0;
const MARCH_MONTH_INDEX = 2;
const APRIL_MONTH_INDEX = 3;
const JUNE_MONTH_INDEX = 5;
const JULY_MONTH_INDEX = 6;
const SEPTEMBER_MONTH_INDEX = 8;
const OCTOBER_MONTH_INDEX = 9;
const DECEMBER_MONTH_INDEX = 11;

const FIRST_DAY_OF_MONTH = 1;
const END_DAY_OF_JUNE = 30;
const END_DAY_OF_SEPTEMBER = 30;
const END_DAY_OF_DECEMBER = 31;
const END_DAY_OF_MARCH = 31;

const END_OF_DAY_HOUR = 23;
const END_OF_DAY_MINUTE = 59;
const END_OF_DAY_SECOND = 59;

const EMPTY_FALLBACK_STRING = '—';
const SLUG_DELIMITER_HYPHEN = '-';
const NEXT_YEAR_OFFSET = 1;

export interface ParsedQuarter {
  quarterNum: number;   // 1–4
  fyStartYear: number;  // e.g. 2026 for FY2026-27
}

/** Parse "Q2 FY2026-27" → { quarterNum: 2, fyStartYear: 2026 } */
export function parseQuarter(quarterString: string): ParsedQuarter | null {
  const matchResult = quarterString?.match(QUARTER_REGEX_PATTERN);
  if (!matchResult) return null;
  return { 
    quarterNum: parseInt(matchResult[1], 10), 
    fyStartYear: parseInt(matchResult[2], 10) 
  };
}

/** Returns the last moment of the quarter's final day */
export function getQuarterEndDate(quarterString: string): Date | null {
  const parsedQuarterData = parseQuarter(quarterString);
  if (!parsedQuarterData) return null;
  const { quarterNum, fyStartYear } = parsedQuarterData;
  switch (quarterNum) {
    case QUARTER_NUMBER_ONE: 
      return new Date(fyStartYear, JUNE_MONTH_INDEX, END_DAY_OF_JUNE, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND);
    case QUARTER_NUMBER_TWO: 
      return new Date(fyStartYear, SEPTEMBER_MONTH_INDEX, END_DAY_OF_SEPTEMBER, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND);
    case QUARTER_NUMBER_THREE: 
      return new Date(fyStartYear, DECEMBER_MONTH_INDEX, END_DAY_OF_DECEMBER, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND);
    case QUARTER_NUMBER_FOUR: 
      return new Date(fyStartYear + NEXT_YEAR_OFFSET, MARCH_MONTH_INDEX, END_DAY_OF_MARCH, END_OF_DAY_HOUR, END_OF_DAY_MINUTE, END_OF_DAY_SECOND);
    default: 
      return null;
  }
}

/** Returns the first day of the quarter */
export function getQuarterStartDate(quarterString: string): Date | null {
  const parsedQuarterData = parseQuarter(quarterString);
  if (!parsedQuarterData) return null;
  const { quarterNum, fyStartYear } = parsedQuarterData;
  switch (quarterNum) {
    case QUARTER_NUMBER_ONE: 
      return new Date(fyStartYear, APRIL_MONTH_INDEX, FIRST_DAY_OF_MONTH);
    case QUARTER_NUMBER_TWO: 
      return new Date(fyStartYear, JULY_MONTH_INDEX, FIRST_DAY_OF_MONTH);
    case QUARTER_NUMBER_THREE: 
      return new Date(fyStartYear, OCTOBER_MONTH_INDEX, FIRST_DAY_OF_MONTH);
    case QUARTER_NUMBER_FOUR: 
      return new Date(fyStartYear + NEXT_YEAR_OFFSET, JANUARY_MONTH_INDEX, FIRST_DAY_OF_MONTH);
    default: 
      return null;
  }
}

/** True if today is strictly after the quarter's last day */
export function isQuarterOver(quarterString: string): boolean {
  const quarterEndDate = getQuarterEndDate(quarterString);
  if (!quarterEndDate) return false;
  return new Date() > quarterEndDate;
}

/** "Jul 2026 – Sep 2026" */
export function formatQuarterRange(quarterString: string): string {
  const parsedQuarterData = parseQuarter(quarterString);
  if (!parsedQuarterData) return quarterString;
  const { quarterNum, fyStartYear } = parsedQuarterData;
  const nextFinancialYear = fyStartYear + NEXT_YEAR_OFFSET;
  const quarterDateRanges: Record<number, string> = {
    [QUARTER_NUMBER_ONE]: `Apr ${fyStartYear} – Jun ${fyStartYear}`,
    [QUARTER_NUMBER_TWO]: `Jul ${fyStartYear} – Sep ${fyStartYear}`,
    [QUARTER_NUMBER_THREE]: `Oct ${fyStartYear} – Dec ${fyStartYear}`,
    [QUARTER_NUMBER_FOUR]: `Jan ${nextFinancialYear} – Mar ${nextFinancialYear}`,
  };
  return quarterDateRanges[quarterNum] ?? quarterString;
}

/** "30 Sep 2026" */
export function formatQuarterEndDate(quarterString: string): string {
  const quarterEndDate = getQuarterEndDate(quarterString);
  if (!quarterEndDate) return EMPTY_FALLBACK_STRING;
  return quarterEndDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Financial year label "FY 2026-27" */
export function getFinancialYear(quarterString: string): string {
  const parsedQuarterData = parseQuarter(quarterString);
  if (!parsedQuarterData) return EMPTY_FALLBACK_STRING;
  const { fyStartYear } = parsedQuarterData;
  const nextYearTwoDigits = String(fyStartYear + NEXT_YEAR_OFFSET).slice(2);
  return `FY ${fyStartYear}-${nextYearTwoDigits}`;
}

/** "Q2 FY2026-27" → "Q2-FY2026-27" */
export function convertQuarterNameToUrlSlug(quarterString: string): string {
  if (!quarterString) return '';
  return quarterString.trim().replace(MULTIPLE_WHITESPACE_REGEX, SLUG_DELIMITER_HYPHEN);
}

/** Alias for backward compatibility */
export const quarterToSlug = convertQuarterNameToUrlSlug;

/** "Q2-FY2026-27" → "Q2 FY2026-27" */
export function convertUrlSlugToQuarterName(quarterSlug: string): string {
  if (!quarterSlug) return '';
  // Convert "Q2-FY2026-27" back to "Q2 FY2026-27"
  if (SLUG_REGEX_PATTERN.test(quarterSlug)) {
    return quarterSlug.replace(SLUG_CAPTURE_REGEX_PATTERN, '$1 $2');
  }
  return quarterSlug;
}

/** Descriptive name requested by user, plus backward compatible alias */
export const convertSlugToQuarter = convertUrlSlugToQuarterName;
export const slugToQuarter = convertUrlSlugToQuarterName;
