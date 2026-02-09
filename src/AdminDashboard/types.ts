import { EmploymentType } from "../types";
import { SortDirection } from "./enums";

export interface Employee {
  id: string;
  name: string;
  department: string;
  rawId: string;
  resetRequired: boolean;
  isActive: boolean;
  createdAt: string;
  lastLoggedIn?: string | null;
  isAdmin: boolean;
}

export interface EmployeeListMobileCardProps {
  employees: Employee[];
  onViewDetails: (empId: string) => void;
  onViewDashboard: (empId: string) => void;
  onResendActivation: (empId: string) => void;
  onToggleStatus: (empId: string) => void;
  isAdmin: boolean;
}

export interface SortConfig {
  key: string | null;
  direction: SortDirection;
}

export interface GlobalStatsCache {
  entities: any[];
  totalItems: number;
}

export interface ActivationData {
  link: string;
  message: string;
  loginId?: string;
  password?: string;
}

export interface EmployeeFormData {
  fullName: string;
  employeeId: string;
  department: string;
  designation: string;
  email: string;
  role?: string;
  employmentType: "" | EmploymentType;
  joiningDate?: string;
}

export interface FieldErrors {
  fullName: string;
  employeeId: string;
  department: string;
  designation: string;
  email: string;
  role: string;
  employmentType: string;
  joiningDate: string;
}
