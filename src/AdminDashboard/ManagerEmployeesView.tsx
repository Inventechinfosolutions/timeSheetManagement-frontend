import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Users,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  User,
} from "lucide-react";
import { useAppDispatch, useAppSelector } from "../hooks";
import { RootState } from "../store";
import { getAllManagerMappings } from "../reducers/managerMapping.reducer";
import { UserStatus } from "../enums";

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

  const [unfilteredTotal, setUnfilteredTotal] = useState<number>(0);

  useEffect(() => {
    if (!debouncedSearch && !loading && totalItems > 0) {
      setUnfilteredTotal(totalItems);
    }
  }, [debouncedSearch, loading, totalItems]);

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
          status: UserStatus.ACTIVE,
        }),
      );
    }
  }, [dispatch, managerId, teamPage, debouncedSearch]);

  const managerName = mappings[0]?.managerName || managerId;

  return (
    <div className="p-4 md:p-8 bg-[#F4F7FE] font-['DM_Sans',sans-serif]">
      {/* Navigation Back */}
      <div className="flex items-center mb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-gray-400 hover:text-[#4318FF] transition-colors group"
        >
          <ArrowLeft
            size={14}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <span className="text-xs font-bold tracking-wider uppercase text-[#A3AED0] group-hover:text-[#4318FF]">
            Back
          </span>
        </button>
      </div>

      {/* Top Header & Stats Section */}
      <div className="flex flex-wrap items-center gap-4 mb-8 justify-start">

        {/* Team Details Card */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-3 w-full sm:w-auto min-w-[240px] shrink-0 border border-gray-50">
          <div className="w-10 h-10 bg-[#4318FF]/10 rounded-xl flex items-center justify-center text-[#4318FF] shrink-0">
            <User size={20} />
          </div>
          <div>
            <p className="text-xs text-[#A3AED0] font-medium">Team Details</p>
            <h3 className="text-base font-bold text-[#2B3674] leading-tight">
              {managerName}
            </h3>
          </div>
        </div>

        {/* Stats Card */}
        <div className="bg-white rounded-[20px] p-4 shadow-[0px_18px_40px_rgba(112,144,176,0.12)] flex items-center gap-3 w-full sm:w-[220px] shrink-0 border border-gray-50">
          <div className="w-10 h-10 bg-[#4318FF]/10 rounded-xl flex items-center justify-center text-[#4318FF] shrink-0">
            <div className="metric-icon">
              <Users size={20} />
            </div>
          </div>
          <div>
            <p className="text-xs text-[#A3AED0] font-medium">Total Managed</p>
            <h3 className="text-base font-bold text-[#2B3674] leading-tight">
              {unfilteredTotal || totalItems} Employees
            </h3>
          </div>
        </div>

        {/* Search Bar next to Card */}
        <div className="flex items-center bg-white rounded-full px-5 py-2.5 border border-gray-200 focus-within:border-[#4318FF]/40 transition-all w-full sm:max-w-xs h-[52px]">
          <Search size={18} className="text-[#A3AED0] mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search employees..."
            value={teamSearch}
            onChange={(e) => setTeamSearch(e.target.value)}
            className="border-none outline-none bg-transparent text-[#2B3674] w-full text-sm font-semibold placeholder:text-[#A3AED0]/60"
          />
          {teamSearch && (
            <button
              onClick={() => setTeamSearch("")}
              className="text-[#A3AED0] hover:text-[#4318FF] transition-colors focus:outline-none ml-2 flex items-center justify-center shrink-0"
              type="button"
            >
              <X size={18} />
            </button>
          )}
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
                              m.status === UserStatus.ACTIVE
                                ? "bg-green-50 text-green-500 border-green-100"
                                : m.status === UserStatus.INACTIVE
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
