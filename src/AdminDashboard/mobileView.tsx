import { UserOutlined } from "@ant-design/icons";
import { Eye, Clock } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  dept: string;
  login: string;
  logout: string;
  hours: string;
  status: string;
  avatar: string;
}

interface MobileViewProps {
  employees: Employee[];
  onViewTimesheet: (empId: string) => void;
  onSelectEmployee: (empId: string) => void;
}

const MobileView = ({
  employees,
  onViewTimesheet,
  onSelectEmployee,
}: MobileViewProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {employees.map((emp) => (
        <div
          key={emp.id}
          onClick={() => onSelectEmployee(emp.id)}
          className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex flex-col gap-4 cursor-pointer hover:shadow-md transition-all"
        >
          {/* Header: Avatar, Name, ID, Status */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-[#F4F7FE] flex items-center justify-center text-[#4318FF] border-2 border-white shadow-sm shrink-0">
                <UserOutlined style={{ fontSize: "24px" }} />
              </div>
              <div>
                <h3 className="font-bold text-[#2B3674]">{emp.name}</h3>
                <p className="text-xs text-[#A3AED0] font-mono">{emp.id}</p>
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider
                ${
                  emp.status === "Present"
                    ? "bg-[#E6FFFA] text-[#01B574]"
                    : emp.status === "Incomplete"
                    ? "bg-[#FFF9E5] text-[#FFB547]"
                    : "bg-[#FFF5F5] text-[#EE5D50]"
                }
              `}
            >
              {emp.status}
            </span>
          </div>

          <div className="h-px bg-gray-50" />

          {/* Details: Dept, Hours */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-[#A3AED0] text-xs mb-1">Department</p>
              <p className="font-medium text-[#2B3674]">{emp.dept}</p>
            </div>
            <div>
              <p className="text-[#A3AED0] text-xs mb-1">Total Hours</p>
              <p className="font-bold text-[#1B254B]">{emp.hours}</p>
            </div>
          </div>

          {/* Times: Login, Logout */}
          <div className="bg-[#F4F7FE] rounded-lg p-3 grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 text-[#A3AED0] text-xs mb-1">
                <Clock size={12} />
                <span>Login</span>
              </div>
              <p className="font-mono text-sm font-medium text-[#2B3674]">
                {emp.login}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-[#A3AED0] text-xs mb-1">
                <Clock size={12} />
                <span>Logout</span>
              </div>
              {emp.logout === "Not logged out" ? (
                <span className="text-xs font-bold text-[#FFB547]">
                  Not logged out
                </span>
              ) : (
                <p className="font-mono text-sm font-medium text-[#2B3674]">
                  {emp.logout}
                </p>
              )}
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onViewTimesheet(emp.id);
            }}
            className="w-full mt-1 flex items-center justify-center gap-2 py-2.5 rounded-lg border border-[#00A3C4] text-[#00A3C4] font-bold text-sm hover:bg-[#E0F7FA] transition-colors"
          >
            <Eye size={16} />
            View Timesheet
          </button>
        </div>
      ))}
    </div>
  );
};

export default MobileView;
