import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, Trash2, Users } from "lucide-react";
import { message } from "antd";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { SearchBox, Tooltip } from "../../components/ui";
import {
  AppraisalMappingRecord,
  deactivateAppraisalMapping,
  fetchAppraisalMappingsByAssigner,
} from "../reducers/appraisalMapping.reducer";

const AppraisalAssignerEmployeesView: React.FC = () => {
  const { assignerId } = useParams<{ assignerId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { assignerPeople, assignerLoading } = useAppSelector((s) => s.appraisalMapping);

  const locationState = (location.state || {}) as {
    assignerName?: string;
    department?: string;
    assignerType?: string;
  };

  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;

  const reload = () => {
    if (!assignerId) return;
    void dispatch(
      fetchAppraisalMappingsByAssigner({
        assignerId,
        department: locationState.department || undefined,
        status: "ACTIVE",
      }),
    );
  };

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, assignerId, locationState.department]);

  const filteredPeople = useMemo(() => {
    const term = debouncedSearch.trim().toLowerCase();
    if (!term) return assignerPeople;
    return assignerPeople.filter(
      (row) =>
        row.employeeName.toLowerCase().includes(term) ||
        row.employeeId.toLowerCase().includes(term),
    );
  }, [assignerPeople, debouncedSearch]);

  const total = filteredPeople.length;
  const pageCount = Math.max(1, Math.ceil(total / itemsPerPage));
  const pageSafe = Math.min(page, pageCount);
  const people = filteredPeople.slice(
    (pageSafe - 1) * itemsPerPage,
    pageSafe * itemsPerPage,
  );

  const assignerName = useMemo(() => {
    if (locationState.assignerName) return locationState.assignerName;
    return assignerPeople[0]?.assignerName || assignerId || "Assigner";
  }, [locationState.assignerName, assignerPeople, assignerId]);

  const departmentLabel = useMemo(() => {
    if (locationState.department) return locationState.department;
    return assignerPeople[0]?.department || "—";
  }, [locationState.department, assignerPeople]);

  const assignerType = useMemo(() => {
    if (locationState.assignerType) return locationState.assignerType;
    return assignerPeople[0]?.assignerType || "—";
  }, [locationState.assignerType, assignerPeople]);

  const backPath = location.pathname.includes("/manager-dashboard")
    ? "/manager-dashboard/appraisal-mapping"
    : "/admin-dashboard/appraisal-mapping";

  const handleUnmap = async (id: number) => {
    try {
      await dispatch(deactivateAppraisalMapping(id)).unwrap();
      message.success("Person unmapped.");
      reload();
    } catch (error) {
      message.error(typeof error === "string" ? error : "Failed to unmap.");
    }
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#F4F7FE] font-['DM_Sans',sans-serif]">
      <button
        type="button"
        onClick={() => navigate(backPath)}
        className="mb-4 inline-flex items-center gap-1.5 text-[#A3AED0] hover:text-[#4318FF] transition-colors group"
      >
        <ArrowLeft
          size={14}
          className="group-hover:-translate-x-1 transition-transform"
        />
        <span className="text-xs font-bold tracking-wider uppercase">Back</span>
      </button>

      <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-6 mb-6">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-[#2B3674]">
              {assignerName}{" "}
              <span className="text-base font-semibold text-[#A3AED0]">
                ({assignerId}) · {assignerType}
              </span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#E2E8F0] shadow-[0_6px_18px_rgba(112,144,176,0.12)] shrink-0">
              <Building2 size={15} className="text-[#4318FF] shrink-0" />
              <span className="text-xs text-[#64748B]">
                Department:{" "}
                <span className="font-bold text-[#0F172A]">{departmentLabel}</span>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-white border border-[#E2E8F0] shadow-[0_6px_18px_rgba(112,144,176,0.12)] shrink-0">
              <Users size={15} className="text-[#4318FF] shrink-0" />
              <span className="text-xs text-[#64748B]">
                Total mapped:{" "}
                <span className="font-bold text-[#0F172A]">{assignerPeople.length}</span>
              </span>
            </div>
            <SearchBox
              placeholder="Search by name or ID..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onDebounce={(val) => {
                setDebouncedSearch(val);
                setPage(1);
              }}
              onClear={() => {
                setSearchText("");
                setDebouncedSearch("");
                setPage(1);
              }}
              containerClassName="w-full sm:w-72 rounded-full"
            />
          </div>
        </div>
      </div>

      <section className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-5 md:p-6">
        <div className="overflow-x-auto rounded-2xl border border-[#E8EEF7]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#4318FF] text-white text-[11px] uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-2 font-bold text-center w-16">Sl No</th>
                <th className="py-3.5 px-4 font-bold text-left">Employee Name</th>
                <th className="py-3.5 px-4 font-bold text-center">Employee ID</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {!assignerLoading && people.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-[#A3AED0]">
                    <Users size={40} className="mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">No employees found for this assigner</p>
                  </td>
                </tr>
              )}
              {people.map((row: AppraisalMappingRecord, index) => (
                <tr
                  key={row.id}
                  className={`border-t border-[#F1F4FF] hover:bg-[#F8FAFF] ${
                    index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                  }`}
                >
                  <td className="py-3.5 pl-6 pr-2 text-center text-[#475569] font-semibold">
                    {(pageSafe - 1) * itemsPerPage + index + 1}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-full bg-[#EEF2FF] text-[#4318FF] text-xs font-bold flex items-center justify-center shrink-0">
                        {String(row.employeeName || "?").charAt(0)}
                      </div>
                      <span className="font-bold text-[#2B3674] truncate">{row.employeeName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center text-[#475569] font-semibold">
                    {row.employeeId}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <Tooltip title="Unmap" placement="top">
                      <button
                        type="button"
                        onClick={() => void handleUnmap(row.id)}
                        className="inline-flex p-2 rounded-lg text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={14} />
                      </button>
                    </Tooltip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <div className="flex flex-col sm:flex-row justify-between items-center mt-5 gap-4">
            <div className="text-sm font-bold text-[#A3AED0]">
              Showing{" "}
              <span className="text-[#2B3674]">{(pageSafe - 1) * itemsPerPage + 1}</span> to{" "}
              <span className="text-[#2B3674]">
                {Math.min(pageSafe * itemsPerPage, total)}
              </span>{" "}
              of <span className="text-[#2B3674]">{total}</span> entries
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pageSafe === 1}
                className="p-2 rounded-xl border border-gray-100 bg-white text-[#4318FF] hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronLeft size={18} />
              </button>
              <div className="bg-[#F4F7FE] px-4 py-1.5 rounded-xl">
                <span className="text-xs font-black text-[#2B3674] tracking-widest">
                  {pageSafe} / {pageCount}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                disabled={pageSafe === pageCount}
                className="p-2 rounded-xl border border-gray-100 bg-white text-[#4318FF] hover:bg-gray-50 disabled:opacity-30 transition-all shadow-sm"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default AppraisalAssignerEmployeesView;
