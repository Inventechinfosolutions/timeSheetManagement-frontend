import { AttendanceStatus } from "../enums";

export enum AttendancePieChartColor {
  PRESENT = "#05CD99",
  ABSENT = "#EE5D50",
  LEAVE = "#FF708B",
  HOLIDAY = "#4318FF",
  WEEKEND = "#00B8FF",
  NOT_UPDATED = "#FFB547",
}

export const ATTENDANCE_PIE_CHART_ITEMS = [
  {
    name: AttendanceStatus.PRESENT,
    color: AttendancePieChartColor.PRESENT,
  },
  {
    name: AttendanceStatus.ABSENT,
    color: AttendancePieChartColor.ABSENT,
  },
  {
    name: AttendanceStatus.LEAVE,
    color: AttendancePieChartColor.LEAVE,
  },
  {
    name: AttendanceStatus.HOLIDAY,
    color: AttendancePieChartColor.HOLIDAY,
  },
  {
    name: AttendanceStatus.WEEKEND,
    color: AttendancePieChartColor.WEEKEND,
  },
  {
    name: AttendanceStatus.NOT_UPDATED,
    color: AttendancePieChartColor.NOT_UPDATED,
  },
] as const;
