export interface LeaveManagementEmailConfig {
  assignedManagerEmail: string | null;
  hrEmail: string | null;
}

export interface CancellableLeaveDate {
  date: string;
  isCancellable: boolean;
  reason: string;
}

export interface LeaveManagementFormData {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  duration: number;
}

export interface LeaveManagementFieldErrors {
  title: string;
  description: string;
  startDate: string;
  endDate: string;
}

export interface ModifyLeaveFormData {
  title: string;
  description: string;
  firstHalf: string;
  secondHalf: string;
  ccEmails: string[];
}

export interface ModifyLeaveErrors {
  title: string;
  description: string;
}

export interface RequestIdModalState {
  isOpen: boolean;
  id: number | null;
}

export interface RequestModalState<TRequest = any> {
  isOpen: boolean;
  request: TRequest | null;
}

export interface ModifyRequestModalState<TRequest = any>
  extends RequestModalState<TRequest> {
  datesToModify?: string[];
}
