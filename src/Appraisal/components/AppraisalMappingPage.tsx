import React, { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, Building2, Check, Eye, Pencil, RefreshCw, Trash2, Users, UserRound } from "lucide-react";
import { message } from "antd";
import { useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "../../hooks";
import { fetchDepartments } from "../../reducers/masterDepartment.reducer";
import { getEntitiesSelect } from "../../reducers/employeeDetails.reducer";
import { Dropdown, Pagination, SearchBox, Tooltip } from "../../components/ui";
import {
  AppraisalAssignerListItem,
  AppraisalAssignerType,
  AppraisalMappingRecord,
  createAppraisalMappingsBulk,
  deactivateAppraisalMapping,
  fetchAppraisalMappings,
} from "../reducers/appraisalMapping.reducer";

interface AssignerHistoryGroup {
  key: string;
  assignerId: string;
  assignerName: string;
  assignerType: AppraisalAssignerType;
  department: string | null;
  status: string;
  mappedCount: number;
  mappedEmployeeIds: string[];
}

interface Person {
  id: string;
  employeeId: string;
  fullName: string;
  department: string;
  role: string;
  mapped?: boolean;
  isAssigner?: boolean;
  assignerId?: string | null;
  /** appraisal_mapping row id when mapped (edit/unmap) */
  mappingId?: number | null;
}

const APPRAISAL_ROLES = "MANAGER,EMPLOYEE";
const HISTORY_PAGE_SIZE = 10;

const DROPDOWN_BTN =
  "w-full min-h-[48px] rounded-xl px-4 py-3 text-sm font-semibold bg-white border border-[#E2E8F0] text-[#2B3674] shadow-[0_10px_30px_rgba(112,144,176,0.18)] hover:border-[#4318FF]/40 hover:bg-white";

const resolveAssignerType = (role?: string): AppraisalAssignerType => {
  const normalized = String(role || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_");
  if (
    normalized === "MANAGER" ||
    normalized === "GENERAL_MANAGER" ||
    normalized === "CEO"
  ) {
    return "MANAGER";
  }
  return "EMPLOYEE";
};

const initials = (name?: string) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

const PersonTile: React.FC<{
  person: Person;
  selected?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}> = ({ person, selected, onClick, onRemove }) => (
  <button
    type="button"
    onClick={onClick}
    className={`group relative w-full text-left rounded-2xl border px-3.5 py-3 transition-all ${
      selected
        ? "border-[#4318FF] bg-[#EEF2FF] shadow-[0_8px_24px_rgba(67,24,255,0.12)]"
        : "border-[#E8EEF7] bg-white hover:border-[#C7D2FE] hover:shadow-[0_10px_28px_rgba(112,144,176,0.12)]"
    } ${onClick ? "cursor-pointer" : "cursor-default"}`}
  >
    <div className="flex items-center gap-3 min-w-0">
      <div
        className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${
          selected ? "bg-[#4318FF] text-white" : "bg-[#EEF2FF] text-[#4318FF]"
        }`}
      >
        {initials(person.fullName)}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-[#2B3674] truncate">{person.fullName}</p>
        <p className="text-[11px] text-[#A3AED0] truncate">
          {person.role} · {person.employeeId}
        </p>
      </div>
      {selected && (
        <span className="shrink-0 h-6 w-6 rounded-full bg-[#4318FF] text-white flex items-center justify-center">
          <Check size={12} />
        </span>
      )}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              e.stopPropagation();
              onRemove();
            }
          }}
          className="shrink-0 p-1.5 rounded-lg text-[#A3AED0] hover:text-red-500 hover:bg-red-50"
        >
          <Trash2 size={14} />
        </span>
      )}
    </div>
  </button>
);

/** Admin/CEO/GM: map Assigner → people for dual appraisal flow. Unmapped keeps old manager-only path. */
const AppraisalMappingPage: React.FC = () => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { departments } = useAppSelector((s) => s.masterDepartments);
  const { items, total, loading } = useAppSelector((s) => s.appraisalMapping);

  const [selectedDepartment, setSelectedDepartment] = useState("");
  const [selectedAssignerId, setSelectedAssignerId] = useState("");
  const [assignerPeople, setAssignerPeople] = useState<Person[]>([]);
  const [availablePeople, setAvailablePeople] = useState<Person[]>([]);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
  const [selectedStagedIds, setSelectedStagedIds] = useState<string[]>([]);
  const [stagedEmployees, setStagedEmployees] = useState<Person[]>([]);
  const [searchText, setSearchText] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");
  const [debouncedHistorySearch, setDebouncedHistorySearch] = useState("");
  const [historyDepartment, setHistoryDepartment] = useState("");
  const [historyPage, setHistoryPage] = useState(1);
  /** Bumps on Edit so list-select re-runs even if same assigner is already selected. */
  const [editLoadNonce, setEditLoadNonce] = useState(0);
  const [saving, setSaving] = useState(false);
  const [loadingAssigners, setLoadingAssigners] = useState(false);
  const [loadingAvailable, setLoadingAvailable] = useState(false);
  const [editBaseline, setEditBaseline] = useState<AppraisalMappingRecord[]>([]);
  /** Seed staged from mappedToAssigner once per assigner select (not on every search). */
  const lastSeededAssignerRef = useRef("");
  /** Skip department assigner list-select once when Edit seeds the assigner locally. */
  const skipDeptAssignerFetchRef = useRef(false);
  /** When set, available list-select response also builds editBaseline (single Edit API call). */
  const pendingEditGroupRef = useRef<AssignerHistoryGroup | null>(null);
  /** Latest assigner list for baseline name/type without re-fetching available on list change. */
  const assignerPeopleRef = useRef<Person[]>([]);
  assignerPeopleRef.current = assignerPeople;

  const isEditing = editBaseline.length > 0;
  const editBaselineIds = useMemo(
    () => editBaseline.map((p) => p.employeeId),
    [editBaseline],
  );

  const assignableDepartments = useMemo(
    () =>
      (departments || []).filter(
        (d) =>
          d.departmentName !== "CEO" && d.departmentName !== "General Manager",
      ),
    [departments],
  );

  const departmentOptions = useMemo(
    () =>
      assignableDepartments.map((d) => ({
        value: d.departmentName,
        label: d.departmentName,
      })),
    [assignableDepartments],
  );

  const historyDepartmentOptions = useMemo(
    () => [
      { value: "", label: "All Departments" },
      ...departmentOptions,
    ],
    [departmentOptions],
  );

  const groupedHistory = useMemo(
    (): AssignerHistoryGroup[] =>
      (items as AppraisalAssignerListItem[]).map((row) => ({
        key: `${row.assignerId}::${row.department || ""}`,
        assignerId: row.assignerId,
        assignerName: row.assignerName,
        assignerType: row.assignerType,
        department: row.department || null,
        status: row.status,
        mappedCount: row.mappedCount ?? 0,
        mappedEmployeeIds: row.mappedEmployeeIds || [],
      })),
    [items],
  );

  const selectedAssigner = useMemo(
    () => assignerPeople.find((p) => p.employeeId === selectedAssignerId) || null,
    [assignerPeople, selectedAssignerId],
  );

  const assignerOptions = useMemo(
    () =>
      assignerPeople.map((p) => {
        const bits: string[] = [resolveAssignerType(p.role)];
        if (p.isAssigner) bits.push("Assigner");
        if (p.mapped) bits.push("Mapped");
        return {
          value: p.employeeId,
          label: `${p.fullName} (${p.employeeId})`,
          badgeText: bits.join(" · "),
          badgeClass: p.mapped
            ? "bg-amber-50 text-amber-700 border border-amber-200"
            : p.isAssigner
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-[#EEF2FF] text-[#4318FF] border border-[#C7D2FE]",
        };
      }),
    [assignerPeople],
  );

  const mapPeople = (list: Person[]) =>
    list.map((p) => ({
      ...p,
      id: String(p.id || p.employeeId),
    }));

  /** Reload full Assigner dropdown for a department (after Edit/Save leaves a 1-person list). */
  const reloadDepartmentAssigners = (department: string) => {
    if (!department) {
      setAssignerPeople([]);
      return Promise.resolve();
    }
    skipDeptAssignerFetchRef.current = false;
    setLoadingAssigners(true);
    return dispatch(
      getEntitiesSelect({
        department,
        role: APPRAISAL_ROLES,
      }),
    )
      .then((action: any) => {
        const list = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.data || [];
        setAssignerPeople(mapPeople(list as Person[]));
      })
      .finally(() => {
        setLoadingAssigners(false);
      });
  };

  useEffect(() => {
    dispatch(fetchDepartments());
  }, [dispatch]);

  useEffect(() => {
    setHistoryPage(1);
  }, [debouncedHistorySearch, historyDepartment]);

  useEffect(() => {
    dispatch(
      fetchAppraisalMappings({
        page: historyPage,
        limit: HISTORY_PAGE_SIZE,
        status: "ACTIVE",
        search: debouncedHistorySearch || undefined,
        department: historyDepartment || undefined,
      }),
    );
  }, [dispatch, debouncedHistorySearch, historyDepartment, historyPage]);

  // Assigner dropdown: full active dept list (skipped on Edit — only by-assigner + employeeId list-select)
  useEffect(() => {
    if (!selectedDepartment) {
      setAssignerPeople([]);
      return;
    }
    if (skipDeptAssignerFetchRef.current) {
      skipDeptAssignerFetchRef.current = false;
      return;
    }
    let cancelled = false;
    setLoadingAssigners(true);
    void dispatch(
      getEntitiesSelect({
        department: selectedDepartment,
        role: APPRAISAL_ROLES,
      }),
    )
      .then((action: any) => {
        if (cancelled) return;
        const list = Array.isArray(action.payload)
          ? action.payload
          : action.payload?.data || [];
        setAssignerPeople(mapPeople(list as Person[]));
      })
      .finally(() => {
        if (!cancelled) setLoadingAssigners(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedDepartment]);

  // Available / already-mapped: assigner-scoped list-select (two groups) — single call path
  useEffect(() => {
    if (!selectedAssignerId || !selectedDepartment) {
      setAvailablePeople([]);
      lastSeededAssignerRef.current = "";
      return;
    }
    let cancelled = false;
    setLoadingAvailable(true);
    void dispatch(
      getEntitiesSelect({
        department: selectedDepartment,
        role: APPRAISAL_ROLES,
        search: debouncedSearch || undefined,
        employeeId: selectedAssignerId,
      }),
    )
      .then((action: any) => {
        if (cancelled) return;
        const payload = action.payload;
        const unmapped = Array.isArray(payload?.unmappedInDepartment)
          ? payload.unmappedInDepartment
          : Array.isArray(payload)
            ? payload
            : [];
        const mapped = Array.isArray(payload?.mappedToAssigner)
          ? payload.mappedToAssigner
          : [];
        const mappedPeople = mapPeople(mapped as Person[]);
        setAvailablePeople(mapPeople(unmapped as Person[]));

        const editGroup = pendingEditGroupRef.current;
        const shouldSeedStaged =
          Boolean(editGroup) || lastSeededAssignerRef.current !== selectedAssignerId;

        if (shouldSeedStaged) {
          lastSeededAssignerRef.current = selectedAssignerId;
          setStagedEmployees(mappedPeople);

          // Baseline already-mapped rows so Save only creates new / unmaps removed
          // (not a full re-create of people already under this assigner).
          const assignerPerson = assignerPeopleRef.current.find(
            (p) => p.employeeId === selectedAssignerId,
          );
          const baselineMeta =
            editGroup && editGroup.assignerId === selectedAssignerId
              ? editGroup
              : {
                  assignerId: selectedAssignerId,
                  assignerName: assignerPerson?.fullName || selectedAssignerId,
                  assignerType: resolveAssignerType(assignerPerson?.role),
                };

          if (editGroup && editGroup.assignerId === selectedAssignerId) {
            pendingEditGroupRef.current = null;
          }

          setEditBaseline(
            mappedPeople
              .filter((p) => p.mappingId != null)
              .map((p) => ({
                id: Number(p.mappingId),
                department: p.department || selectedDepartment,
                assignerId: baselineMeta.assignerId,
                assignerName: baselineMeta.assignerName,
                assignerType: baselineMeta.assignerType,
                employeeId: p.employeeId,
                employeeName: p.fullName,
                status: "ACTIVE" as const,
              })),
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAvailable(false);
      });
    return () => {
      cancelled = true;
    };
  }, [dispatch, selectedDepartment, selectedAssignerId, debouncedSearch, editLoadNonce]);

  const availableEmployees = useMemo(() => {
    return availablePeople.filter((emp) => {
      const empId = emp.employeeId;
      if (!empId) return false;
      if (selectedAssignerId && empId === selectedAssignerId) return false;
      if (stagedEmployees.some((s) => s.employeeId === empId)) return false;
      return true;
    });
  }, [availablePeople, stagedEmployees, selectedAssignerId]);

  const handleDepartmentChange = (name: string) => {
    skipDeptAssignerFetchRef.current = false;
    pendingEditGroupRef.current = null;
    setSelectedDepartment(name);
    setSelectedAssignerId("");
    setStagedEmployees([]);
    setSelectedEmployeeIds([]);
    setSelectedStagedIds([]);
    setSearchText("");
    setDebouncedSearch("");
    setAvailablePeople([]);
    setEditBaseline([]);
    lastSeededAssignerRef.current = "";
  };

  const handleAssignerChange = (employeeId: string) => {
    pendingEditGroupRef.current = null;
    setSelectedAssignerId(employeeId);
    setStagedEmployees([]);
    setSelectedEmployeeIds([]);
    setSelectedStagedIds([]);
    setSearchText("");
    setDebouncedSearch("");
    setEditBaseline([]);
    lastSeededAssignerRef.current = "";
  };

  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployeeIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const toggleStaged = (employeeId: string) => {
    setSelectedStagedIds((prev) =>
      prev.includes(employeeId)
        ? prev.filter((id) => id !== employeeId)
        : [...prev, employeeId],
    );
  };

  const handleStageSelected = () => {
    const moving = availableEmployees.filter((e) =>
      selectedEmployeeIds.includes(e.employeeId),
    );
    setStagedEmployees((prev) => [...prev, ...moving]);
    setSelectedEmployeeIds([]);
  };

  const handleUnmapSelected = () => {
    if (selectedStagedIds.length === 0) return;
    setStagedEmployees((prev) => {
      const movingBack = prev.filter((p) =>
        selectedStagedIds.includes(p.employeeId),
      );
      setAvailablePeople((avail) => {
        const existing = new Set(avail.map((a) => a.employeeId));
        const toAdd = movingBack.filter((p) => !existing.has(p.employeeId));
        return toAdd.length ? [...avail, ...toAdd] : avail;
      });
      return prev.filter((p) => !selectedStagedIds.includes(p.employeeId));
    });
    setSelectedStagedIds([]);
  };

  const handleSave = async () => {
    if (!selectedAssigner || !selectedDepartment) {
      message.warning("Select department and assigner.");
      return;
    }
    if (!isEditing && stagedEmployees.length === 0) {
      message.warning("Select at least one person to map.");
      return;
    }

    setSaving(true);
    try {
      const assignerType = resolveAssignerType(selectedAssigner.role);
      const stagedIds = stagedEmployees.map((e) => e.employeeId);

      if (isEditing) {
        const toRemove = editBaseline.filter((p) => !stagedIds.includes(p.employeeId));
        const toAdd = stagedEmployees.filter((e) => !editBaselineIds.includes(e.employeeId));

        for (const row of toRemove) {
          await dispatch(deactivateAppraisalMapping(row.id)).unwrap();
        }
        if (toAdd.length > 0) {
          await dispatch(
            createAppraisalMappingsBulk(
              toAdd.map((emp) => ({
                department: selectedDepartment,
                assignerId: selectedAssigner.employeeId,
                assignerName: selectedAssigner.fullName,
                assignerType,
                employeeId: emp.employeeId,
                employeeName: emp.fullName,
              })),
            ),
          ).unwrap();
        }
        message.success("Appraisal mapping updated.");
      } else {
        // Never re-create rows that already have a mapping id
        const toCreate = stagedEmployees.filter((emp) => emp.mappingId == null);
        if (toCreate.length === 0) {
          message.info("No new people to map.");
        } else {
          await dispatch(
            createAppraisalMappingsBulk(
              toCreate.map((emp) => ({
                department: selectedDepartment,
                assignerId: selectedAssigner.employeeId,
                assignerName: selectedAssigner.fullName,
                assignerType,
                employeeId: emp.employeeId,
                employeeName: emp.fullName,
              })),
            ),
          ).unwrap();
          message.success("Appraisal mapping saved.");
        }
      }

      const deptToReload = selectedDepartment;
      setStagedEmployees([]);
      setSelectedEmployeeIds([]);
      setSelectedStagedIds([]);
      setEditBaseline([]);
      setSelectedAssignerId("");
      setAvailablePeople([]);
      setSearchText("");
      setDebouncedSearch("");
      lastSeededAssignerRef.current = "";
      pendingEditGroupRef.current = null;
      setHistoryPage(1);
      // Re-load full assigner list — Edit replaces dropdown with a single person
      await reloadDepartmentAssigners(deptToReload);
      dispatch(
        fetchAppraisalMappings({
          page: 1,
          limit: HISTORY_PAGE_SIZE,
          status: "ACTIVE",
          search: debouncedHistorySearch || undefined,
          department: historyDepartment || undefined,
        }),
      );
    } catch (error) {
      message.error(typeof error === "string" ? error : "Failed to save mapping.");
    } finally {
      setSaving(false);
    }
  };

  const openAssignerPeople = (group: AssignerHistoryGroup) => {
    const base = window.location.pathname.includes("/manager-dashboard")
      ? "/manager-dashboard"
      : "/admin-dashboard";
    navigate(`${base}/appraisal-assigner-employees/${encodeURIComponent(group.assignerId)}`, {
      state: {
        assignerName: group.assignerName,
        department: group.department || undefined,
        assignerType: group.assignerType,
      },
    });
  };

  const handleEditMapping = (group: AssignerHistoryGroup) => {
    const dept = group.department || "";
    if (!dept) {
      message.warning("This mapping has no department to edit.");
      return;
    }

    // Edit: one list-select?employeeId= via the available effect (mapped + unmapped).
    skipDeptAssignerFetchRef.current = selectedDepartment !== dept;
    pendingEditGroupRef.current = group;
    setAssignerPeople([
      {
        id: group.assignerId,
        employeeId: group.assignerId,
        fullName: group.assignerName,
        department: dept,
        role: group.assignerType,
        isAssigner: true,
      },
    ]);
    setSelectedEmployeeIds([]);
    setSelectedStagedIds([]);
    setSearchText("");
    setDebouncedSearch("");
    setEditBaseline([]);
    setStagedEmployees([]);
    setAvailablePeople([]);
    // Force effect to re-seed even if same assigner was already selected
    lastSeededAssignerRef.current = "";
    setSelectedDepartment(dept);
    setSelectedAssignerId(group.assignerId);
    setEditLoadNonce((n) => n + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen p-4 md:p-8 bg-[#F4F7FE] font-['DM_Sans',sans-serif]">
      <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-6 mb-6">
        <h1 className="text-2xl font-bold text-[#2B3674] mb-1">Appraisal Mapping</h1>
        <p className="text-sm text-[#A3AED0] font-medium mb-6">
          Select department and assigner, then map people. Unmapped people keep the old manager-only appraisal flow.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="block text-sm font-bold text-[#2B3674] mb-2">Department</label>
            <Dropdown
              className="w-full"
              placeholder="Select Department"
              allowClear
              defaultValue=""
              prefixIcon={<Building2 size={16} />}
              options={departmentOptions}
              value={selectedDepartment}
              onChange={handleDepartmentChange}
              maxLabelWidth="max-w-none"
              buttonClassName={DROPDOWN_BTN}
              menuClassName="shadow-[0_20px_50px_rgba(112,144,176,0.28)]"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-[#2B3674] mb-2">Assigner</label>
            <Dropdown
              className="w-full"
              placeholder={
                !selectedDepartment
                  ? "Select department first"
                  : loadingAssigners
                    ? "Loading..."
                    : "Select Assigner"
              }
              allowClear
              defaultValue=""
              disabled={!selectedDepartment || loadingAssigners}
              loading={loadingAssigners}
              emptyMessage="No Data"
              prefixIcon={<UserRound size={16} />}
              options={assignerOptions}
              value={selectedAssignerId}
              onChange={handleAssignerChange}
              maxLabelWidth="max-w-none"
              buttonClassName={DROPDOWN_BTN}
              menuClassName="shadow-[0_20px_50px_rgba(112,144,176,0.28)]"
            />
          </div>
        </div>
      </div>

      {selectedAssigner && (
        <section className="grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 mb-6 items-stretch">
          <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-5 md:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h2 className="text-base font-bold text-[#2B3674]">Available to map</h2>
                <p className="text-xs text-[#A3AED0] mt-0.5">
                  Employees and managers · {availableEmployees.length} available
                </p>
              </div>
              <SearchBox
                placeholder="Search by name or ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onDebounce={setDebouncedSearch}
                onClear={() => {
                  setSearchText("");
                  setDebouncedSearch("");
                }}
                containerClassName="w-full sm:w-72 rounded-full"
              />
            </div>

            {loadingAvailable ? (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] py-12 text-center text-[#A3AED0]">
                <p className="text-sm font-medium">Searching…</p>
              </div>
            ) : availableEmployees.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#CBD5E1] py-12 text-center text-[#A3AED0]">
                <Users className="mx-auto mb-2 opacity-40" size={40} />
                <p className="text-sm font-medium">No people available to map</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[380px] overflow-y-auto pr-1 custom-scrollbar">
                {availableEmployees.map((emp) => (
                  <PersonTile
                    key={emp.employeeId}
                    person={emp}
                    selected={selectedEmployeeIds.includes(emp.employeeId)}
                    onClick={() => toggleEmployee(emp.employeeId)}
                  />
                ))}
              </div>
            )}
          </div>

          <div className="flex lg:flex-col items-center justify-center gap-3 py-2">
            <Tooltip
              title={selectedEmployeeIds.length > 0 ? "Map" : undefined}
              placement="top"
              disabled={selectedEmployeeIds.length === 0}
            >
              <button
                type="button"
                onClick={handleStageSelected}
                disabled={selectedEmployeeIds.length === 0}
                className={`h-12 w-12 rounded-full text-white flex items-center justify-center transition-all ${
                  selectedEmployeeIds.length > 0
                    ? "bg-[#4318FF] shadow-[0_10px_24px_rgba(67,24,255,0.45)] hover:bg-[#3311DD] scale-105"
                    : "bg-[#868CFF]/70 opacity-40 cursor-not-allowed shadow-none"
                }`}
              >
                <ArrowRight size={22} strokeWidth={selectedEmployeeIds.length > 0 ? 2.75 : 2} />
              </button>
            </Tooltip>

            <Tooltip
              title={selectedStagedIds.length > 0 ? "Unmap" : undefined}
              placement="bottom"
              disabled={selectedStagedIds.length === 0}
            >
              <button
                type="button"
                onClick={handleUnmapSelected}
                disabled={selectedStagedIds.length === 0}
                className={`h-12 w-12 rounded-full text-white flex items-center justify-center transition-all ${
                  selectedStagedIds.length > 0
                    ? "bg-[#4318FF] shadow-[0_10px_24px_rgba(67,24,255,0.45)] hover:bg-[#3311DD] scale-105"
                    : "bg-[#868CFF]/70 opacity-40 cursor-not-allowed shadow-none"
                }`}
              >
                <ArrowLeft size={22} strokeWidth={selectedStagedIds.length > 0 ? 2.75 : 2} />
              </button>
            </Tooltip>
          </div>

          <div className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] border border-[#EEF2FF] p-5 md:p-6 flex flex-col">
            <div className="mb-4">
              <h2 className="text-base font-bold text-[#2B3674]">Under assigner</h2>
              <p className="text-xs text-[#A3AED0] mt-0.5 truncate">
                {selectedAssigner.fullName} · {resolveAssignerType(selectedAssigner.role)}
              </p>
            </div>

            <div className="flex-1 space-y-2 max-h-[320px] overflow-y-auto mb-4">
              {stagedEmployees.map((emp) => (
                <PersonTile
                  key={emp.employeeId}
                  person={emp}
                  selected={selectedStagedIds.includes(emp.employeeId)}
                  onClick={() => toggleStaged(emp.employeeId)}
                  onRemove={() => {
                    setStagedEmployees((prev) =>
                      prev.filter((p) => p.employeeId !== emp.employeeId),
                    );
                    setSelectedStagedIds((prev) =>
                      prev.filter((id) => id !== emp.employeeId),
                    );
                  }}
                />
              ))}
              {stagedEmployees.length === 0 && (
                <div className="rounded-2xl border border-dashed border-[#C7D2FE] bg-[#F8FAFF] py-10 text-center text-[#A3AED0]">
                  <p className="text-sm font-medium">Stage people here, then save</p>
                </div>
              )}
            </div>

            <button
              type="button"
              disabled={saving || (!isEditing && stagedEmployees.length === 0)}
              onClick={() => void handleSave()}
              className="w-full py-3 rounded-xl bg-[#4318FF] text-white text-sm font-bold disabled:opacity-40 hover:bg-[#3311DD] transition-colors flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(67,24,255,0.25)]"
            >
              <Check size={16} />
              {saving
                ? isEditing
                  ? "Updating…"
                  : "Saving…"
                : isEditing
                  ? `Update mapping (${stagedEmployees.length})`
                  : `Save mapping (${stagedEmployees.length})`}
            </button>
          </div>
        </section>
      )}

      <section className="bg-white rounded-[24px] shadow-[0px_18px_40px_rgba(112,144,176,0.12)] p-5 md:p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div>
            <h2 className="text-lg font-bold text-[#2B3674]">Mapping history</h2>
            <p className="text-xs text-[#A3AED0] mt-0.5">Active appraisal assigner links</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
            <Dropdown
              className="w-full sm:w-[220px]"
              placeholder="Department"
              allowClear
              defaultValue=""
              prefixIcon={<Building2 size={14} />}
              options={historyDepartmentOptions}
              value={historyDepartment}
              onChange={setHistoryDepartment}
              maxLabelWidth="max-w-[160px]"
              buttonClassName="w-full h-[36px] rounded-xl px-3 py-1.5 text-xs font-semibold bg-[#F4F7FE] border border-transparent text-[#2B3674] hover:bg-gray-100"
              menuClassName="shadow-[0_20px_50px_rgba(112,144,176,0.28)]"
            />
            <SearchBox
              placeholder="Search history..."
              value={historySearch}
              onChange={(e) => setHistorySearch(e.target.value)}
              onDebounce={setDebouncedHistorySearch}
              onClear={() => {
                setHistorySearch("");
                setDebouncedHistorySearch("");
              }}
              containerClassName="w-full sm:w-72 rounded-full"
            />
            {Boolean(historyDepartment && (historySearch || debouncedHistorySearch)) && (
              <button
                type="button"
                onClick={() => {
                  setHistoryDepartment("");
                  setHistorySearch("");
                  setDebouncedHistorySearch("");
                }}
                className="inline-flex items-center justify-center shrink-0 h-9 w-9 rounded-full bg-[#5B4FFF] text-white border border-[#4318FF]/50 hover:bg-[#4318FF] active:scale-95 transition-all"
                title="Clear all filters"
              >
                <RefreshCw size={14} />
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-[#E8EEF7]">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-[#4318FF] text-white text-[11px] uppercase tracking-wider">
                <th className="py-3.5 pl-6 pr-2 font-bold text-center w-16">Sl No</th>
                <th className="py-3.5 px-4 font-bold text-left">Department</th>
                <th className="py-3.5 px-4 font-bold text-left">Assigner</th>
                <th className="py-3.5 px-4 font-bold text-center">Assigner ID</th>
                <th className="py-3.5 px-4 font-bold text-center">Assigner Type</th>
                <th className="py-3.5 px-4 font-bold text-center">Mapped</th>
                <th className="py-3.5 px-4 font-bold text-center">Status</th>
                <th className="py-3.5 px-4 font-bold text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {groupedHistory.map((group, index) => (
                <tr
                  key={group.key}
                  className={`border-t border-[#F1F4FF] hover:bg-[#F8FAFF] ${
                    index % 2 === 0 ? "bg-white" : "bg-[#F8F9FC]"
                  }`}
                >
                  <td className="py-3.5 pl-6 pr-2 text-center text-[#475569] font-semibold">
                    {(historyPage - 1) * HISTORY_PAGE_SIZE + index + 1}
                  </td>
                  <td className="py-3.5 px-4 text-[#475569] font-semibold">
                    {group.department || "—"}
                  </td>
                  <td className="py-3.5 px-4 font-bold text-[#2B3674]">{group.assignerName}</td>
                  <td className="py-3.5 px-4 text-center text-[#475569] font-semibold">
                    {group.assignerId}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#EEF2FF] text-[#4318FF]">
                      {group.assignerType}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-[#2B3674]">
                    {group.mappedCount}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                      {group.status}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="inline-flex items-center justify-center gap-1">
                      <Tooltip title="View mapped people" placement="top">
                        <button
                          type="button"
                          onClick={() => openAssignerPeople(group)}
                          className="inline-flex p-2 rounded-lg text-[#4318FF] hover:bg-[#EEF2FF] transition-all hover:scale-105"
                        >
                          <Eye size={16} />
                        </button>
                      </Tooltip>
                      <Tooltip title="Edit mapping" placement="top">
                        <button
                          type="button"
                          onClick={() => handleEditMapping(group)}
                          className="inline-flex p-2 rounded-lg text-[#4318FF] hover:bg-[#EEF2FF] transition-all hover:scale-105"
                        >
                          <Pencil size={16} />
                        </button>
                      </Tooltip>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && groupedHistory.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#A3AED0] text-sm">
                    No appraisal mappings yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {total > 0 && (
          <Pagination
            className="mt-5"
            currentPage={historyPage}
            totalItems={total}
            pageSize={HISTORY_PAGE_SIZE}
            onPageChange={setHistoryPage}
          />
        )}
      </section>
    </div>
  );
};

export default AppraisalMappingPage;
