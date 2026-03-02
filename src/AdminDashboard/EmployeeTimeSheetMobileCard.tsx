import { Edit, Eye } from "lucide-react";

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
}

const EmployeeTimeSheetMobileCard = ({
  employees,
  onViewTimesheet,
  onViewWorkingDetails,
}: EmployeeTimeSheetMobileCardProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {employees.map((emp) => (
        <div
          key={emp.id}
          className="bg-white rounded-2xl p-5 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-gray-100 flex flex-col gap-4 hover:shadow-md transition-all group"
        >
          <div className="flex justify-between items-start">
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-[#2B3674] text-lg lg:text-xl group-hover:text-[#4318FF] transition-colors">
                {emp.name}
              </h3>
              <p className="text-sm font-bold text-[#A3AED0] tracking-wider uppercase">
                ID: <span className="text-[#475569]">{emp.id}</span>
              </p>
            </div>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                emp.status === "Submitted"
                  ? "bg-green-50 text-green-500 border-green-100"
                  : "bg-amber-50 text-amber-500 border-amber-100"
              }`}
            >
              {emp.status === "Submitted" ? "Submitted" : "Pending"}
            </span>
          </div>

          <div className="h-px bg-gray-50 -mx-5" />

          <div className="flex justify-between items-center">
            <div>
              <p className="text-[#A3AED0] text-xs font-bold uppercase tracking-widest mb-1">
                Department
              </p>
              <div className="inline-flex px-3 py-1 rounded-full bg-[#F4F7FE] text-[#4318FF] text-xs font-bold border border-[#4318FF]/10">
                {emp.department || "General"}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewWorkingDetails(emp.id)}
                className="flex items-center justify-center p-2 rounded-xl bg-[#4318FF]/5 text-[#4318FF] hover:bg-[#4318FF] hover:text-white transition-all active:scale-95 shadow-sm"
                title="View Working Details"
              >
                <Eye size={16} />
              </button>
              <button
                onClick={() => onViewTimesheet(emp.id)}
                className="flex items-center justify-center p-2 rounded-xl bg-[#4318FF]/5 text-[#4318FF] hover:bg-[#4318FF] hover:text-white transition-all active:scale-95 shadow-sm"
                title="Edit Timesheet"
              >
                <Edit size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EmployeeTimeSheetMobileCard;
