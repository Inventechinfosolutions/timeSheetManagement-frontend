export interface MasterDepartment {
    id: number;
    departmentName: string;
    departmentCode: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface CreateDepartmentPayload {
    departmentName: string;
    departmentCode: string;
}

export interface UpdateDepartmentPayload {
    departmentName?: string;
    departmentCode?: string;
}

export interface MasterDepartmentState {
    departments: MasterDepartment[];
    department: MasterDepartment | null;
    loading: boolean;
    error: string | null;
}
