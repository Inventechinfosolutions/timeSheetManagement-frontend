import { useMemo, useState } from "react";
import { Loader2, Lock, Search } from "lucide-react";

export type LockTypeValue = "Weekly" | "Monthly";

interface DepartmentLockRow {
  id: number;
  departmentName: string;
  departmentCode?: string;
}

interface Props {
  departments: DepartmentLockRow[];
  lockTypes: Record<string, LockTypeValue>;
  updatingDepartment: string | null;
  onChange: (departmentName: string, lockType: LockTypeValue) => void;
}

/** Row height ~60px; 5 rows visible before scrolling. */
const LIST_MAX_HEIGHT = "max-h-[300px]";

const DepartmentLockTypeCard = ({ departments, lockTypes, updatingDepartment, onChange }: Props) => {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return departments;
    return departments.filter(
      (d) =>
        d.departmentName.toLowerCase().includes(term) ||
        (d.departmentCode || "").toLowerCase().includes(term),
    );
  }, [departments, search]);

  const monthlyCount = departments.filter((d) => lockTypes[d.departmentName] === "Monthly").length;

  return (
    <div className="bg-white rounded-2xl shadow-[0px_8px_24px_rgba(112,144,176,0.1)] border border-gray-100/80 overflow-hidden h-full flex flex-col">
      <div className="px-5 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-9 h-9 rounded-xl bg-[#EEF2FF] text-[#1055E8] flex items-center justify-center">
            <Lock size={18} strokeWidth={2.2} />
          </span>
          <div>
            <h3 className="text-lg font-bold text-[#2B3674] leading-tight">Attendance Lock Type</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              {departments.length - monthlyCount} weekly · {monthlyCount} monthly
            </p>
          </div>
        </div>
        <div className="relative w-full sm:w-52">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A3AED0]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search department"
            className="h-9 w-full rounded-full border border-gray-200 pl-8 pr-3 text-xs text-[#2B3674] focus:outline-none focus:ring-2 focus:ring-[#1055E8]/20"
          />
        </div>
      </div>

      <div className={`${LIST_MAX_HEIGHT} overflow-y-auto custom-scrollbar divide-y divide-gray-50`}>
        {filtered.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-gray-400">No departments found</div>
        ) : (
          filtered.map((dept) => {
            const current = lockTypes[dept.departmentName] || "Weekly";
            const updating = updatingDepartment === dept.departmentName;
            return (
              <div
                key={dept.id}
                className="px-5 py-3 flex items-center justify-between gap-3 hover:bg-[#F4F7FE]/60 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#2B3674] truncate">{dept.departmentName}</div>
                  {dept.departmentCode && (
                    <div className="text-[11px] text-[#A3AED0] truncate">{dept.departmentCode}</div>
                  )}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {updating && <Loader2 size={14} className="animate-spin text-[#A3AED0]" />}
                  <div className="bg-[#F4F7FE] rounded-full p-1 flex items-center">
                    {(["Weekly", "Monthly"] as LockTypeValue[]).map((type) => {
                      const active = current === type;
                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={updating || active}
                          onClick={() => onChange(dept.departmentName, type)}
                          className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all ${
                            active
                              ? "bg-[#1055E8] text-white shadow-[0px_2px_8px_rgba(16,85,232,0.3)]"
                              : "text-[#1B2559] hover:text-[#1055E8] disabled:opacity-50"
                          }`}
                        >
                          {type}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="px-5 py-2.5 bg-[#EEF2FF] text-[11px] font-semibold text-[#1E40AF]">
        Attendance is locked for each department after the chosen period (Weekly / Monthly).
      </div>
    </div>
  );
};

export default DepartmentLockTypeCard;
