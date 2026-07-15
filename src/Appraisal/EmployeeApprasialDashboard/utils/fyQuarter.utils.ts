/**
 * Quarter utility helpers for India Financial Year (April–March)
 * Quarter format: "Q2 FY2026-27"
 */

export interface ParsedQuarter {
  quarterNum: number;   // 1–4
  fyStartYear: number;  // e.g. 2026 for FY2026-27
}

/** Parse "Q2 FY2026-27" → { quarterNum: 2, fyStartYear: 2026 } */
export function parseQuarter(q: string): ParsedQuarter | null {
  const match = q?.match(/^Q(\d) FY(\d{4})-\d{2}$/);
  if (!match) return null;
  return { quarterNum: parseInt(match[1]), fyStartYear: parseInt(match[2]) };
}

/** Returns the last moment of the quarter's final day */
export function getQuarterEndDate(q: string): Date | null {
  const parsed = parseQuarter(q);
  if (!parsed) return null;
  const { quarterNum, fyStartYear } = parsed;
  switch (quarterNum) {
    case 1: return new Date(fyStartYear, 5, 30, 23, 59, 59);       // Jun 30
    case 2: return new Date(fyStartYear, 8, 30, 23, 59, 59);       // Sep 30
    case 3: return new Date(fyStartYear, 11, 31, 23, 59, 59);      // Dec 31
    case 4: return new Date(fyStartYear + 1, 2, 31, 23, 59, 59);   // Mar 31
    default: return null;
  }
}

/** Returns the first day of the quarter */
export function getQuarterStartDate(q: string): Date | null {
  const parsed = parseQuarter(q);
  if (!parsed) return null;
  const { quarterNum, fyStartYear } = parsed;
  switch (quarterNum) {
    case 1: return new Date(fyStartYear, 3, 1);       // Apr 1
    case 2: return new Date(fyStartYear, 6, 1);       // Jul 1
    case 3: return new Date(fyStartYear, 9, 1);       // Oct 1
    case 4: return new Date(fyStartYear + 1, 0, 1);   // Jan 1
    default: return null;
  }
}

/** True if today is strictly after the quarter's last day */
export function isQuarterOver(q: string): boolean {
  const end = getQuarterEndDate(q);
  if (!end) return false;
  return new Date() > end;
}

/** "Jul 2026 – Sep 2026" */
export function formatQuarterRange(q: string): string {
  const parsed = parseQuarter(q);
  if (!parsed) return q;
  const { quarterNum, fyStartYear } = parsed;
  const ranges: Record<number, string> = {
    1: `Apr ${fyStartYear} – Jun ${fyStartYear}`,
    2: `Jul ${fyStartYear} – Sep ${fyStartYear}`,
    3: `Oct ${fyStartYear} – Dec ${fyStartYear}`,
    4: `Jan ${fyStartYear + 1} – Mar ${fyStartYear + 1}`,
  };
  return ranges[quarterNum] ?? q;
}

/** "30 Sep 2026" */
export function formatQuarterEndDate(q: string): string {
  const end = getQuarterEndDate(q);
  if (!end) return '—';
  return end.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Financial year label "FY 2026-27" */
export function getFinancialYear(q: string): string {
  const parsed = parseQuarter(q);
  if (!parsed) return '—';
  const { fyStartYear } = parsed;
  return `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`;
}
