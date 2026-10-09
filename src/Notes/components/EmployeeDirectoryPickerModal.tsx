import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Modal, message } from "antd";
import { Search, X, Check, Copy, UserCheck, Users } from "lucide-react";
import { searchEmployeeDirectory, DirectoryEmployee } from "../utils/notesHelpers";
import { WorksphereLogoLoader } from "../../components/ApiLoadingSpinner";
import { SearchBox } from "../../components/ui";

interface EmployeeDirectoryPickerModalProps {
  open: boolean;
  onClose: () => void;
  existingEmails: string[];
  onAddRecipients: (emails: string[]) => void;
}

export const EmployeeDirectoryPickerModal: React.FC<EmployeeDirectoryPickerModalProps> = ({
  open,
  onClose,
  existingEmails,
  onAddRecipients,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<DirectoryEmployee[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);

  // Normalize existing emails to lowercase for comparison
  const existingSet = useMemo(() => {
    return new Set(existingEmails.map((e) => e.trim().toLowerCase()));
  }, [existingEmails]);

  // Fetch employees based on search term
  const fetchEmployees = useCallback(async (term: string) => {
    setLoading(true);
    setHasSearched(true);
    try {
      const data = await searchEmployeeDirectory(term);
      setEmployees(data || []);
    } catch (err) {
      console.error("Failed to load employees:", err);
      message.error("Failed to fetch employee directory");
    } finally {
      setLoading(false);
    }
  }, []);

  // Reset state when modal opens - DO NOT fetch automatically on open!
  useEffect(() => {
    if (open) {
      setSearchTerm("");
      setEmployees([]);
      setHasSearched(false);
      setSelectedEmails(new Set());
      setCopiedEmail(null);
      setLoading(false);
    }
  }, [open]);

  // Fetch when SearchBox debounce settles (via useDebounce).
  // Empty value does not wipe the list — Get All / Select All keep results;
  // explicit clear is handled by onClear.
  const handleSearchDebounce = useCallback(
    (val: string) => {
      if (!open) return;
      const trimmed = val.trim();
      if (!trimmed) return;
      setLoading(true);
      fetchEmployees(trimmed);
    },
    [open, fetchEmployees]
  );

  // Toggle selection for an employee email
  const toggleSelect = (email: string) => {
    const normalized = email.trim().toLowerCase();
    if (existingSet.has(normalized)) return; // Already in recipient list

    setSelectedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) {
        next.delete(email);
      } else {
        next.add(email);
      }
      return next;
    });
  };

  /** Load entire directory (empty search) then select every selectable email */
  const handleSelectAll = async () => {
    let list = employees;
    if (list.length === 0) {
      setLoading(true);
      setHasSearched(true);
      try {
        list = (await searchEmployeeDirectory("")) || [];
        setEmployees(list);
        setSearchTerm("");
      } catch (err) {
        console.error("Failed to load all employees:", err);
        message.error("Failed to fetch employee directory");
        setLoading(false);
        return;
      } finally {
        setLoading(false);
      }
    }

    const selectable = list.filter(
      (emp) => emp.email && !existingSet.has(emp.email.trim().toLowerCase())
    );

    const allSelected =
      selectable.length > 0 && selectable.every((emp) => selectedEmails.has(emp.email));

    if (allSelected) {
      setSelectedEmails((prev) => {
        const next = new Set(prev);
        selectable.forEach((emp) => next.delete(emp.email));
        return next;
      });
    } else {
      setSelectedEmails((prev) => {
        const next = new Set(prev);
        selectable.forEach((emp) => next.add(emp.email));
        return next;
      });
    }
  };

  /** Get All — fetch every active employee without a search term */
  const handleGetAll = async () => {
    setSearchTerm("");
    await fetchEmployees("");
  };

  // Copy email to clipboard
  const handleCopy = (e: React.MouseEvent, email: string) => {
    e.stopPropagation();
    if (!email) return;
    navigator.clipboard.writeText(email);
    setCopiedEmail(email);
    message.success(`Copied: ${email}`);
    setTimeout(() => {
      setCopiedEmail(null);
    }, 2000);
  };

  // Apply selected emails
  const handleApply = () => {
    if (selectedEmails.size === 0) {
      onClose();
      return;
    }
    onAddRecipients(Array.from(selectedEmails));
    message.success(`Added ${selectedEmails.size} recipient(s)`);
    onClose();
  };

  // Get Initials for Avatar
  const getInitials = (name?: string) => {
    if (!name) return "E";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const selectableEmployees = employees.filter(
    (emp) => emp.email && !existingSet.has(emp.email.trim().toLowerCase())
  );
  const isAllSelectableChecked =
    selectableEmployees.length > 0 &&
    selectableEmployees.every((emp) => selectedEmails.has(emp.email));

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={null}
      closeIcon={null}
      width={520}
      centered
      zIndex={1150}
      destroyOnClose
      styles={{
        content: { padding: 0, borderRadius: "16px", overflow: "hidden" },
        body: { padding: 0 },
      } as any}
    >
      <div className="flex flex-col max-h-[80vh] bg-white text-slate-800">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-white">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#4318FF]/10 text-[#4318FF] flex items-center justify-center font-bold">
              <Users className="w-3.5 h-3.5 text-[#4318FF]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#1B2559]">Employee Directory</h3>
              <p className="text-[11px] text-slate-400">Search by name or ID to add recipients</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Input Bar — shared SearchBox + useDebounce */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/50">
          <SearchBox
            placeholder="Search by name, employee ID, or designation..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onDebounce={handleSearchDebounce}
            onClear={() => {
              setSearchTerm("");
              setEmployees([]);
              setHasSearched(false);
              setLoading(false);
            }}
            autoFocus
            inputSize="sm"
            variant="outlined"
            containerClassName="w-full"
          />

          {/* Quick Bar: Select All / Get All always available */}
          <div className="flex items-center justify-between mt-2 px-1 text-[11px]">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium text-slate-600">
              <input
                type="checkbox"
                checked={isAllSelectableChecked}
                onChange={() => {
                  void handleSelectAll();
                }}
                disabled={loading}
                className="w-3 h-3 rounded text-[#4318FF] focus:ring-[#4318FF] cursor-pointer"
              />
              <span>Select All</span>
            </label>
            <div className="flex items-center gap-2">
              {/* <button
                type="button"
                onClick={() => {
                  void handleGetAll();
                }}
                disabled={loading}
                className="font-semibold text-[#4318FF] hover:underline cursor-pointer bg-transparent border-none p-0 disabled:opacity-50"
                title="Load all active employees"
              >
                Get All
              </button> */}
              {employees.length > 0 && (
                <span className="text-slate-400 font-medium">
                  {employees.length} found
                  {selectedEmails.size > 0 && ` • ${selectedEmails.size} selected`}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Compact Employee List */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-1 max-h-[340px] custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-5">
              <div className="scale-75 origin-center">
                <WorksphereLogoLoader />
              </div>
              <span className="text-[11px] text-slate-400 font-medium -mt-1">
                Searching directory...
              </span>
            </div>
          ) : !hasSearched ? (
            /* Initial prompt before typing */
            <div className="text-center py-10 px-4">
              <Search className="w-7 h-7 mx-auto text-slate-300 mb-1.5" />
              <p className="text-xs font-semibold text-slate-600">Type to search employees</p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Enter a name, ID, or designation — or use Get All / Select All
              </p>
            </div>
          ) : employees.length === 0 ? (
            /* No results state */
            <div className="text-center py-8 px-4">
              <Users className="w-6 h-6 mx-auto text-slate-300 mb-1" />
              <p className="text-xs font-semibold text-slate-600">No employees found for "{searchTerm}"</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Try searching with a different keyword</p>
            </div>
          ) : (
            /* Very compact cards */
            employees.map((emp) => {
              const isAlreadyAdded = existingSet.has(emp.email.trim().toLowerCase());
              const isSelected = selectedEmails.has(emp.email);

              return (
                <div
                  key={emp.id || emp.employeeId}
                  onClick={() => toggleSelect(emp.email)}
                  className={`flex items-center justify-between py-1.5 px-2.5 rounded-lg border transition cursor-pointer select-none ${
                    isAlreadyAdded
                      ? "bg-slate-50/70 border-slate-200/60 opacity-65 cursor-not-allowed"
                      : isSelected
                      ? "bg-indigo-50/70 border-indigo-200 shadow-2xs"
                      : "bg-white border-slate-100 hover:border-slate-200 hover:bg-slate-50/60"
                  }`}
                >
                  {/* Left: Checkbox + Avatar + Info */}
                  <div className="flex items-center gap-2 min-w-0">
                    <input
                      type="checkbox"
                      checked={isAlreadyAdded || isSelected}
                      disabled={isAlreadyAdded}
                      onChange={() => toggleSelect(emp.email)}
                      onClick={(e) => e.stopPropagation()}
                      className="w-3.5 h-3.5 rounded text-[#4318FF] focus:ring-[#4318FF] cursor-pointer"
                    />

                    {/* Compact Initials Avatar */}
                    <div className="w-6 h-6 rounded-md bg-gradient-to-br from-[#4318FF] to-[#6366F1] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                      {getInitials(emp.fullName)}
                    </div>

                    {/* Info */}
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 leading-tight">
                        <span className="text-xs font-bold text-[#1B2559] truncate">
                          {emp.fullName}
                        </span>
                        <span className="px-1 py-0.2 rounded bg-indigo-50 text-[#4318FF] text-[9px] font-semibold tracking-wide shrink-0">
                          {emp.employeeId}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 truncate leading-tight mt-0.5">
                        <span className="text-slate-600 font-medium">{emp.email}</span>
                        {emp.designation && (
                          <>
                            <span className="mx-1 text-slate-300">•</span>
                            <span className="text-slate-400">{emp.designation}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions (Copy + Already Added badge) */}
                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isAlreadyAdded ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[9px] font-bold">
                        <UserCheck className="w-2.5 h-2.5" />
                        <span>Added</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={(e) => handleCopy(e, emp.email)}
                        className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium transition cursor-pointer ${
                          copiedEmail === emp.email
                            ? "bg-emerald-50 text-emerald-600 font-bold"
                            : "bg-slate-100 hover:bg-slate-200 text-slate-600"
                        }`}
                        title="Copy Email"
                      >
                        {copiedEmail === emp.email ? (
                          <>
                            <Check className="w-2.5 h-2.5 text-emerald-600" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-2.5 h-2.5" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2.5 border-t border-slate-100 bg-slate-50/60">
          <div className="text-[11px] text-slate-500 font-medium">
            {selectedEmails.size > 0 ? (
              <span className="text-[#4318FF] font-semibold">
                {selectedEmails.size} {selectedEmails.size === 1 ? "recipient" : "recipients"} selected
              </span>
            ) : (
              <span>Select employees to add</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-white transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleApply}
              disabled={selectedEmails.size === 0}
              className={`px-3.5 py-1 rounded-lg text-xs font-semibold text-white shadow-xs transition cursor-pointer ${
                selectedEmails.size > 0
                  ? "bg-[#4318FF] hover:bg-[#320fe0]"
                  : "bg-slate-300 opacity-60 cursor-not-allowed"
              }`}
            >
              Add Selected {selectedEmails.size > 0 ? `(${selectedEmails.size})` : ""}
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
};

export default EmployeeDirectoryPickerModal;
