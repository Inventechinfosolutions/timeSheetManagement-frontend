import { Edit, Eye } from "lucide-react";
import { MonthStatus } from "../enums";

interface Employee {
  id: string;
  name: string;
  department: string;
  status: string;
}

interface EmployeeTimeSheetMobileCardProps {
  employees: Employee[];
  onViewTimesheet: (empId: string) => void;
  onViewWorkingDetails: (empId: string) => void;
  showEditButton?: boolean;
}

const EmployeeTimeSheetMobileCard = ({
  employees,
  onViewTimesheet,
  onViewWorkingDetails,
  showEditButton = true,
}: EmployeeTimeSheetMobileCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {employees.map((emp) => (
        <div
          key={emp.id}
          className="bg-white rounded-2xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border border-gray-100 flex flex-col hover:shadow-md transition-all"
        >
          {/* 1. EMPLOYEE */}
          <div className="pb-3">
            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-1">
              EMPLOYEE
            </p>
            <h3 className="text-base font-bold text-[#2B3674] tracking-tight">
              {emp.name}{" "}
              <span className="font-semibold text-[#64748B]">
                ({emp.id})
              </span>
            </h3>
          </div>

          {/* 2. DEPARTMENT */}
          <div className="py-3 border-t border-gray-100">
            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-1.5">
              DEPARTMENT
            </p>
            <span className="inline-block px-3 py-1 rounded-md bg-gray-100/60 text-[#475569] text-xs font-bold border border-gray-200/50">
              {emp.department || "General"}
            </span>
          </div>

          {/* 3. STATUS & ACTIONS */}
          <div className="pt-3 border-t border-gray-100">
            <p className="text-[#94A3B8] text-[10px] font-black uppercase tracking-wider mb-2">
              STATUS
            </p>
            <div className="flex items-center justify-between gap-3">
              {/* Status Badge on Left */}
              <div>
                <span
                  className={`inline-flex px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wider ${
                    (emp.status || "").toLowerCase() === "submitted"
                      ? "bg-green-50 text-green-600 border-green-200"
                      : "bg-amber-50 text-amber-600 border-amber-200"
                  }`}
                >
                  {emp.status}
                </span>
              </div>

              {/* Action Buttons on Right */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onViewWorkingDetails(emp.id)}
                  className="p-2 text-blue-600 bg-blue-50/70 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-blue-200 active:scale-90"
                  title="View Working Details"
                >
                  <Eye size={18} />
                </button>
                {showEditButton && (
                  <button
                    onClick={() => onViewTimesheet(emp.id)}
                    className="p-2 text-blue-600 bg-blue-50/70 hover:bg-blue-600 hover:text-white rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-blue-200 active:scale-90"
                    title="Edit Timesheet"
                  >
                    <Edit size={18} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeTimeSheetMobileCard;
