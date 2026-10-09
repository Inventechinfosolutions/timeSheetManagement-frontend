import React, { useCallback, useEffect, useState } from "react";
import { Button, Input, Modal, SearchDropdown, SearchDropdownOption } from "../../../components/ui";
import { useAppSelector } from "../../../hooks";
import { AppraisalCopy } from "../../constants/appraisal.constants";
import { EmployeePerformanceStatus } from "../../enums/appraisal.enums";
import {
  AppraisalApi,
  EditRequestRecord,
  readApiError,
} from "../../reducers/appraisal.reducer";

interface GrantEditModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GrantEditModal: React.FC<GrantEditModalProps> = ({ isOpen, onClose }) => {
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const managerId = currentUser?.employeeId || currentUser?.loginId || "";

  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<SearchDropdownOption<string>[]>([]);
  const [records, setRecords] = useState<EditRequestRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [deadline, setDeadline] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSearch = useCallback((nextQuery: string) => {
    setQuery(nextQuery);
  }, []);

  useEffect(() => {
    if (!isOpen || !managerId) {
      return;
    }

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const nextRecords = await AppraisalApi.getEditRequests({
          managerId,
          q: query,
          employeeId: undefined,
        });
        if (cancelled) {
          return;
        }
        const pending = nextRecords.filter(
          (record) => record.status === EmployeePerformanceStatus.REQUESTED_FOR_EDIT,
        );
        setRecords(pending);
        setOptions(
          pending.map((record) => ({
            value: String(record.id),
            label: record.employeeName || record.employeeId,
            subLabel: `${record.quarter} ${record.financialYear}`,
          })),
        );
      } catch (requestError) {
        if (!cancelled) {
          setError(readApiError(requestError));
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, managerId, query]);

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setSelectedId("");
      setDeadline("");
      setNote("");
      setError("");
      setRecords([]);
      setOptions([]);
    }
  }, [isOpen]);

  const submit = async (approved: boolean) => {
    if (!selectedId || !managerId) {
      setError(AppraisalCopy.missingEmployee);
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      await AppraisalApi.respondEdit({
        performanceId: Number(selectedId),
        managerId,
        approved,
        responseNote: note.trim() || undefined,
        editAllowedUntil:
          approved && deadline ? new Date(deadline).toISOString() : undefined,
      });
      onClose();
    } catch (requestError) {
      setError(readApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  const selected = records.find((record) => String(record.id) === selectedId);

  return (
    <Modal
      open={isOpen}
      onClose={onClose}
      title={AppraisalCopy.grantTitle}
      maxWidth="md"
      footer={
        <>
          <Button type="button" onClick={() => submit(false)} disabled={submitting || !selectedId}>
            {AppraisalCopy.rejectAction}
          </Button>
          <Button type="button" onClick={() => submit(true)} disabled={submitting || !selectedId}>
            {AppraisalCopy.grantAction}
          </Button>
        </>
      }
    >
      <SearchDropdown
        serverSearch
        options={options}
        value={selectedId}
        onChange={setSelectedId}
        onSearchChange={handleSearch}
        searchPlaceholder={AppraisalCopy.grantSearchPlaceholder}
        placeholder={AppraisalCopy.grantTitle}
        loading={loading}
        emptyMessage={AppraisalCopy.emptyEditRequests}
      />
      {selected?.editRequestReason ? <p>{selected.editRequestReason}</p> : null}
      <Input
        type="datetime-local"
        value={deadline}
        onChange={(event) => setDeadline(event.target.value)}
        placeholder={AppraisalCopy.deadlineLabel}
      />
      <Input
        value={note}
        onChange={(event) => setNote(event.target.value)}
        placeholder={AppraisalCopy.responseNoteLabel}
        error={error}
      />
    </Modal>
  );
};

export default GrantEditModal;
