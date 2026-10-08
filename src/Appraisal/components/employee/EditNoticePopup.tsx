import React, { useCallback, useEffect, useState } from "react";
import { Button, Modal } from "../../../components/ui";
import { useAppSelector } from "../../../hooks";
import { AppraisalCopy, editGrantedBody } from "../../constants/appraisal.constants";
import { EmployeePerformanceStatus } from "../../enums/appraisal.enums";
import {
  AppraisalApi,
  EditRequestRecord,
  readApiError,
} from "../../services/appraisal.api";

export const EditNoticePopup: React.FC = () => {
  const currentUser = useAppSelector((state) => state.user.currentUser);
  const employeeId = currentUser?.employeeId || currentUser?.loginId || "";
  const [notice, setNotice] = useState<EditRequestRecord | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const loadNotice = useCallback(async () => {
    if (!employeeId) {
      return;
    }
    try {
      const records = await AppraisalApi.getEditRequests({ employeeId });
      setNotice(
        records.find(
          (record) =>
            record.status === EmployeePerformanceStatus.APPROVED_FOR_EDITING ||
            record.status === EmployeePerformanceStatus.ALLOWED_TO_EDIT ||
            record.status === EmployeePerformanceStatus.EDIT_GRANTED,
        ) ?? null,
      );
    } catch (requestError) {
      setError(readApiError(requestError));
    }
  }, [employeeId]);

  useEffect(() => {
    void loadNotice();
  }, [loadNotice]);

  const handleNext = async () => {
    if (!notice || !employeeId) {
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      setNotice(null);
    } catch (requestError) {
      setError(readApiError(requestError));
    } finally {
      setSubmitting(false);
    }
  };

  if (!notice) {
    return null;
  }

  const title =
    notice.status === EmployeePerformanceStatus.EDIT_GRANTED
      ? AppraisalCopy.editGrantedTitle
      : AppraisalCopy.editRequestedTitle;

  const body =
    notice.status === EmployeePerformanceStatus.EDIT_GRANTED && notice.editAllowedUntil
      ? editGrantedBody(new Date(notice.editAllowedUntil).toLocaleString())
      : AppraisalCopy.editRequestedBody;

  return (
    <Modal
      open
      onClose={() => undefined}
      title={title}
      maxWidth="sm"
      closeOnBackdrop={false}
      closeOnEsc={false}
      closeBtnClassName="hidden"
      footer={
        <Button type="button" onClick={handleNext} disabled={submitting}>
          {AppraisalCopy.nextAction}
        </Button>
      }
    >
      <p>{body}</p>
      {error ? <p>{error}</p> : null}
    </Modal>
  );
};

export default EditNoticePopup;
