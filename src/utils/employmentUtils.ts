import dayjs from "dayjs";

export interface EmploymentProfile {
  employmentType?: string | null;
  designation?: string | null;
  conversionDate?: string | Date | null;
  joiningDate?: string | Date | null;
}

/**
 * Mirrors backend leave balance rules for intern vs full-timer by month.
 * FULL_TIMER employment type takes precedence over designation (e.g. "Trainee Intern").
 */
export function isInternForPeriod(
  employee: EmploymentProfile | null | undefined,
  year: number,
  month: number,
): boolean {
  if (!employee) return false;

  const employmentType = (employee.employmentType ?? "")
    .toString()
    .toUpperCase();
  const designation = (employee.designation ?? "").toString().toLowerCase();
  const convDate = employee.conversionDate
    ? dayjs(employee.conversionDate)
    : null;

  let isInternThisMonth =
    employmentType === "INTERN" ||
    (employmentType !== "FULL_TIMER" && designation.includes("intern"));

  if (convDate?.isValid()) {
    const convYear = convDate.year();
    const convMonth = convDate.month() + 1;

    if (year > convYear || (year === convYear && month >= convMonth)) {
      isInternThisMonth = false;
      if (year === convYear && month === convMonth && convDate.date() > 10) {
        isInternThisMonth = true;
      }
    } else {
      isInternThisMonth = true;
    }
  }

  return isInternThisMonth;
}

export function getEmploymentProfile(
  entity?: EmploymentProfile | null,
  currentUser?: EmploymentProfile | null,
): EmploymentProfile {
  return {
    employmentType: entity?.employmentType ?? currentUser?.employmentType,
    designation: entity?.designation ?? currentUser?.designation,
    conversionDate: entity?.conversionDate ?? currentUser?.conversionDate,
    joiningDate: entity?.joiningDate ?? currentUser?.joiningDate,
  };
}
