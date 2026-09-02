import { WorkLocation } from "../enums";
import type { WorkTrendData } from "../reducers/employeeAttendance.reducer";

export enum WorkTrendBarColor {
  LEAVE = "#F43F5E",
  LEAVE_ACTIVE = "#FB7185",
  WFH = "#06B6D4",
  WFH_ACTIVE = "#22D3EE",
  CLIENT_VISIT = "#8B5CF6",
  CLIENT_VISIT_ACTIVE = "#A78BFA",
  OFFICE = "#10B981",
  OFFICE_ACTIVE = "#34D399",
}

export enum WorkTrendLabel {
  TAKEN_LEAVE = "Taken Leave",
}

export interface WorkTrendBarConfig {
  dataKey: keyof Pick<
    WorkTrendData,
    "totalLeaves" | "workFromHome" | "clientVisits" | "office"
  >;
  name: string;
  fill: WorkTrendBarColor;
  activeFill: WorkTrendBarColor;
}

export const WORK_TREND_BARS: WorkTrendBarConfig[] = [
  {
    dataKey: "totalLeaves",
    name: WorkTrendLabel.TAKEN_LEAVE,
    fill: WorkTrendBarColor.LEAVE,
    activeFill: WorkTrendBarColor.LEAVE_ACTIVE,
  },
  {
    dataKey: "workFromHome",
    name: WorkLocation.WFH,
    fill: WorkTrendBarColor.WFH,
    activeFill: WorkTrendBarColor.WFH_ACTIVE,
  },
  {
    dataKey: "clientVisits",
    name: WorkLocation.CLIENT_VISIT,
    fill: WorkTrendBarColor.CLIENT_VISIT,
    activeFill: WorkTrendBarColor.CLIENT_VISIT_ACTIVE,
  },
  {
    dataKey: "office",
    name: WorkLocation.OFFICE,
    fill: WorkTrendBarColor.OFFICE,
    activeFill: WorkTrendBarColor.OFFICE_ACTIVE,
  },
];

export const WORK_TRENDS_EMPTY_TEXT = {
  title: "No activity recorded for this period",
  subtitle: "Try navigating to a different month",
} as const;
