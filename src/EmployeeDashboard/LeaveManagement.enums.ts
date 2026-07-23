import { Calendar, Clock, Home, MapPin } from "lucide-react";
import { AttendanceStatus, LeaveRequestStatus, LeaveRequestType, WorkLocation } from "../enums";

export const LEAVE_DATE_PICKER_THEME = {
  token: {
    borderRadius: 16,
    controlHeight: 48,
    colorBgContainer: "#F4F7FE",
    colorBorder: "transparent",
    colorPrimary: "#4318FF",
  },
  components: { DatePicker: { cellHeight: 28, cellWidth: 28 } },
};

export const LEAVE_MONTH_OPTIONS = [
  { label: "January", value: "1" },
  { label: "February", value: "2" },
  { label: "March", value: "3" },
  { label: "April", value: "4" },
  { label: "May", value: "5" },
  { label: "June", value: "6" },
  { label: "July", value: "7" },
  { label: "August", value: "8" },
  { label: "September", value: "9" },
  { label: "October", value: "10" },
  { label: "November", value: "11" },
  { label: "December", value: "12" },
] as const;

export const buildLeaveYearOptions = (currentYear: number) => [
  "All",
  ...Array.from({ length: 36 }, (_, i) => (currentYear - 2 + i).toString()),
];

export const LEAVE_STATS_CARD_CONFIG = [
  {
    label: LeaveRequestType.LEAVE,
    key: "leave",
    color: "bg-linear-to-r from-[#4318FF] to-[#868CFF]",
    icon: Calendar,
  },
  {
    label: WorkLocation.WORK_FROM_HOME,
    key: "wfh",
    color: "bg-linear-to-r from-[#38A169] to-[#68D391]",
    icon: Home,
  },
  {
    label: WorkLocation.CLIENT_VISIT,
    key: "clientVisit",
    color: "bg-linear-to-r from-[#FFB547] to-[#FCCD75]",
    icon: MapPin,
  },
  {
    label: "Half Day Leave",
    key: "halfDay",
    color: "bg-linear-to-r from-[#E31C79] to-[#F78FAD]",
    icon: Clock,
  },
] as const;

export const LEAVE_FILTER_STATUS_OPTIONS = [
  "All",
  LeaveRequestStatus.PENDING,
  LeaveRequestStatus.APPROVED,
  LeaveRequestStatus.REJECTED,
  LeaveRequestStatus.REQUESTING_FOR_CANCELLATION,
  LeaveRequestStatus.CANCELLATION_APPROVED,
  LeaveRequestStatus.CANCELLATION_REJECTED,
  LeaveRequestStatus.REQUESTING_FOR_MODIFICATION,
  LeaveRequestStatus.REQUEST_MODIFIED,
  LeaveRequestStatus.MODIFICATION_APPROVED,
  LeaveRequestStatus.MODIFICATION_CANCELLED,
  LeaveRequestStatus.MODIFICATION_REJECTED,
  LeaveRequestStatus.CANCELLATION_REVERTED,
  LeaveRequestStatus.CANCELLED,
] as const;

export const LEAVE_APPLY_OPTIONS = [
  {
    label: LeaveRequestType.LEAVE,
    icon: Calendar,
    color: "#4318FF",
    cardBg: "from-[#EEF0FF] to-[#E4E9FF]",
    border: "border-[#4318FF]/15",
    iconBg: "bg-linear-to-br from-[#4318FF] to-[#868CFF]",
  },
  {
    label: WorkLocation.WORK_FROM_HOME,
    icon: Home,
    color: "#38A169",
    cardBg: "from-[#EDFAF3] to-[#DFF5E8]",
    border: "border-[#38A169]/15",
    iconBg: "bg-linear-to-br from-[#38A169] to-[#68D391]",
  },
  {
    label: WorkLocation.CLIENT_VISIT,
    icon: MapPin,
    color: "#FFB547",
    cardBg: "from-[#FFF8ED] to-[#FFF0D6]",
    border: "border-[#FFB547]/20",
    iconBg: "bg-linear-to-br from-[#FFB547] to-[#FCCD75]",
  },
] as const;

export const FULL_DAY_LABEL = AttendanceStatus.FULL_DAY;
