export interface EmployeeEntity {
    id?: number;
    employeeId?: string;
    fullName?: string;
    full_name?: string;
    name?: string;
    department?: string;
    department_name?: string;
    designation?: string;
    designation_name?: string;
    email?: string;
    email_address?: string;
    role?: string;
    user_role?: string;
    userRole?: string;
    joiningDate?: string;
    joining_date?: string;
    employmentType?: string;
    employment_type?: string;
    gender?: string;
    gender_type?: string;
}

export interface ManagerMappingEntity {
    managerName?: string;
}

export type UploadStatus = "idle" | "success" | "error" | "deleted";