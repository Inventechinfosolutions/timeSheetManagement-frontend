import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { getAllManagerMappings } from "../reducers/managerMapping.reducer";

const ManagerEmployeesView: React.FC = () => {
  const { managerId } = useParams<{ managerId: string }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const {
    entities: mappings,
    loading,
    totalItems,
  } = useAppSelector((state: RootState) => state.managerMapping);

  // Pagination and Search State
  const [teamSearch, setTeamSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [teamPage, setTeamPage] = useState(1);
  const itemsPerPage = 10;

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(teamSearch);
      setTeamPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [teamSearch]);

  useEffect(() => {
    if (managerId) {
      dispatch(
        getAllManagerMappings({
          managerName: managerId,
          page: teamPage,
          limit: itemsPerPage,
          search: debouncedSearch,
          status: "ACTIVE",
        }),
      );
    }
  }, [dispatch, managerId, teamPage, debouncedSearch]);

  const managerName = mappings[0]?.managerName || managerId;

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] min-h-screen font-['DM_Sans',sans-serif]">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-white rounded-xl shadow-sm text-[#2B3674] hover:text-[#4318FF] transition-all"
        >
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-[#2B3674]">
            Team Details: {managerName}
          </h1>
          <p className="text-sm text-[#A3AED0] font-medium">
            List of employees assigned to the manager
          </p>
        </div>
      </div>

      {/* Top Section: Stats */}
      <div className="mb-6">
        {/* Stats Card */}
        <div className="bg-white rounded-[24px] p-6 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-4 max-w-sm">
          <div className="w-12 h-12 bg-[#4318FF]/10 rounded-xl flex items-center justify-center text-[#4318FF]">
            <metric-icon>
              <Users size={24} />
            </metric-icon>
          </div>
          <div>
            <p className="text-sm text-[#A3AED0] font-medium">Total Managed</p>
            <h3 className="text-xl font-bold text-[#2B3674]">
              {totalItems} Employees
            </h3>
          </div>
        </div>
      </div>

      {/* Search Bar Section */}
      <div className="mb-8">
        <div className="flex items-center bg-white rounded-[24px] px-6 py-4 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] w-full md:max-w-md border border-transparent focus-within:border-[#4318FF]/20 transition-all">
          <Search size={20} className="text-[#A3AED0] mr-3" />
          <input
            type="text"
            placeholder="Search employees..."
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            className="border-none outline-none bg-transparent text-[#2B3674] w-full text-base font-medium placeholder:text-[#A3AED0]/60"
          />
        </div>
      </div>

      {/* Employee List Table */}
      <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-6">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#4318FF]"></div>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr className="bg-[#4318FF] text-white">
                    <th className="text-left py-4 pl-10 pr-4 text-[13px] font-bold uppercase tracking-wider rounded-tl-[16px]">
                      Employee Name
                    </th>
                    <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                      Employee ID
                    </th>
                    <th className="text-center py-4 px-4 text-[13px] font-bold uppercase tracking-wider">
                      Department
                    </th>
                    <th className="py-4 pl-4 pr-10 text-[13px] font-bold uppercase tracking-wider text-center rounded-tr-[16px]">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mappings.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-12 text-[#A3AED0]"
                      >
                        <Users size={48} className="mx-auto mb-2 opacity-30" />
                        <p className="text-sm font-medium">
                          No employees found for this manager
                        </p>
                      </td>
                    </tr>
                  ) : (
                    mappings.map((m, index) => (
                      <tr
                        key={m.id}
                        className={`group transition-all duration-200 ${index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"} hover:bg-[#F1F4FF] cursor-pointer`}
                      >
                        <td className="py-4 pl-10 pr-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#4318FF]/10 flex items-center justify-center text-[#4318FF] text-xs font-bold">
                              {m.employeeName.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-[#2B3674]">
                              {m.employeeName}
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                          {m.employeeId}
                        </td>
                        <td className="py-4 px-4 text-center text-[#475569] text-sm font-semibold">
                          {m.department}
                        </td>
                        <td className="py-4 pl-4 pr-10 text-center">
                          <span
                            className={`inline-flex px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${
                              m.status === "ACTIVE"
                                ? "bg-green-50 text-green-500 border-green-100"
                                : m.status === "INACTIVE"
                                  ? "bg-red-50 text-red-500 border-red-100"
                                  : "bg-gray-50 text-gray-500 border-gray-100"
                            }`}
                          >
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalItems > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center mt-6 p-4 gap-4">
                <div className="text-sm font-bold text-[#A3AED0]">
                  Showing{" "}
                  <span className="text-[#2B3674]">
                    {(teamPage - 1) * itemsPerPage + 1}
                  </span>{" "}
                  to{" "}
                  <span className="text-[#2B3674]">
                    {Math.min(teamPage * itemsPerPage, totalItems)}
                  </span>{" "}
                  of <span className="text-[#2B3674]">{totalItems}</span>{" "}
                  entries
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setTeamPage((p) => Math.max(1, p - 1))}
                    disabled={teamPage === 1}
                    className="p-2 rounded-xl border border-gray-100 bg-white text-[#4318FF] hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <div className="bg-[#F4F7FE] px-4 py-1.5 rounded-xl border border-transparent">
                    <span className="text-xs font-black text-[#2B3674] tracking-widest">
                      {teamPage} / {Math.ceil(totalItems / itemsPerPage) || 1}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setTeamPage((p) =>
                        Math.min(Math.ceil(totalItems / itemsPerPage), p + 1),
                      )
                    }
                    disabled={teamPage === Math.ceil(totalItems / itemsPerPage)}
                    className="p-2 rounded-xl border border-gray-100 bg-white text-[#4318FF] hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ManagerEmployeesView;
