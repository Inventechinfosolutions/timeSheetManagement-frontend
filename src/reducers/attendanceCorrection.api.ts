import { createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import dayjs from 'dayjs';

const apiUrl = '/api/attendance-corrections';

export interface AttendanceCorrectionRequest {
  id: number;
  employeeId: string;
  workingDate: string;
  requestedCheckInTime: string;
  requestedCheckOutTime: string;
  reason: string;
  status: string;
  reviewedBy?: string | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

export interface SubmitCorrectionPayload {
  employeeId: string;
  workingDate: Date;
  requestedCheckInTime: Date;
  requestedCheckOutTime: Date;
  reason: string;
}

export const submitAttendanceCorrection = createAsyncThunk(
  'attendanceCorrection/submit',
  async (payload: SubmitCorrectionPayload) => {
    const response = await axios.post(`${apiUrl}/${payload.employeeId}`, payload);
    return response.data as AttendanceCorrectionRequest;
  },
);

export const fetchPendingCorrections = createAsyncThunk(
  'attendanceCorrection/fetchPending',
  async () => {
    const response = await axios.get<AttendanceCorrectionRequest[]>(`${apiUrl}/pending`);
    return response.data;
  },
);

export const fetchEmployeeCorrections = createAsyncThunk(
  'attendanceCorrection/fetchEmployee',
  async ({
    employeeId,
    month,
    year,
    from,
    to,
  }: {
    employeeId: string;
    month?: string;
    year?: string;
    from?: string;
    to?: string;
  }) => {
    const response = await axios.get<AttendanceCorrectionRequest[]>(
      `${apiUrl}/employee/${employeeId}`,
      { params: { month, year, from, to } },
    );
    return response.data;
  },
);

export const fetchCorrectionHistory = createAsyncThunk(
  'attendanceCorrection/fetchHistory',
  async ({ from, to }: { from: string; to: string }) => {
    const response = await axios.get<AttendanceCorrectionRequest[]>(
      `${apiUrl}/history`,
      { params: { from, to } },
    );
    return response.data;
  },
);

export const updateCorrectionStatus = createAsyncThunk(
  'attendanceCorrection/updateStatus',
  async ({
    id,
    status,
    rejectionReason,
  }: {
    id: number;
    status: 'Approved' | 'Rejected';
    rejectionReason?: string;
  }) => {
    const response = await axios.post(`${apiUrl}/${id}/update-status`, {
      status,
      rejectionReason,
    });
    return response.data as AttendanceCorrectionRequest;
  },
);

export function formatClockTime(value?: string | null): string {
  if (!value) return '—';
  if (typeof value === 'string') {
    return value.length >= 5 ? value.slice(0, 5) : value;
  }
  return '—';
}

export function combineDateAndTimeString(date: Date, time: dayjs.Dayjs): Date {
  const d = new Date(date);
  d.setHours(time.hour(), time.minute(), 0, 0);
  return d;
}

export const HALF_DAY_MAX_HOURS = 6;
export const DAY_HALF_SPLIT_HOUR = 13;

export type DayLeaveKind = 'none' | 'full' | 'first' | 'second';

export function isLeaveHalf(value?: string | null): boolean {
  if (!value) return false;
  const v = String(value).toLowerCase();
  return v.includes('leave') || v === 'on leave';
}

export function classifyDayLeave(
  firstHalf?: string | null,
  secondHalf?: string | null,
  status?: string | null,
  sourceRequestId?: number | null,
): DayLeaveKind {
  const firstLeave = isLeaveHalf(firstHalf);
  const secondLeave = isLeaveHalf(secondHalf);
  if (firstLeave && secondLeave) return 'full';
  if (firstLeave) return 'first';
  if (secondLeave) return 'second';
  if (
    sourceRequestId &&
    (String(status || '').toLowerCase() === 'leave' ||
      String(status || '').toLowerCase().includes('leave'))
  ) {
    return 'full';
  }
  return 'none';
}

/** True when Request Change is allowed for this day (not full-day leave). */
export function canRequestCorrectionForDay(entry: {
  firstHalf?: string | null;
  secondHalf?: string | null;
  status?: string | null;
  sourceRequestId?: number | null;
}): boolean {
  return classifyDayLeave(
    entry.firstHalf,
    entry.secondHalf,
    entry.status,
    entry.sourceRequestId,
  ) !== 'full';
}

