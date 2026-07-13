import { useEffect, useState } from 'react';
import { Modal, Form, DatePicker, TimePicker, Input, message } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { useAppDispatch } from '../hooks';
import {
  combineDateAndTimeString,
  formatClockTime,
  HALF_DAY_MAX_HOURS,
  submitAttendanceCorrection,
} from '../reducers/attendanceCorrection.api';

export interface AttendanceCorrectionModalProps {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  defaultDates?: Date[];
  defaultCheckIn?: string | null;
  defaultCheckOut?: string | null;
  onSuccess?: () => void;
}

const isPastDate = (date: Dayjs) => date.startOf('day').isBefore(dayjs().startOf('day'));

const disableNonPastDates = (current: Dayjs) =>
  !current || !current.isBefore(dayjs().startOf('day'));

const AttendanceCorrectionModal = ({
  open,
  onClose,
  employeeId,
  defaultDates,
  defaultCheckIn,
  defaultCheckOut,
  onSuccess,
}: AttendanceCorrectionModalProps) => {
  const dispatch = useAppDispatch();
  const [form] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;

    const initialDates = (defaultDates?.length ? defaultDates : [])
      .map((d) => dayjs(d))
      .filter(isPastDate);

    const checkIn = defaultCheckIn
      ? dayjs(`1970-01-01T${formatClockTime(defaultCheckIn)}`)
      : dayjs().hour(9).minute(30);
    const checkOut = defaultCheckOut
      ? dayjs(`1970-01-01T${formatClockTime(defaultCheckOut)}`)
      : dayjs().hour(18).minute(30);

    form.setFieldsValue({
      workingDates: initialDates,
      checkInTime: checkIn,
      checkOutTime: checkOut,
      reason: '',
    });
  }, [open, defaultDates, defaultCheckIn, defaultCheckOut, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      const dates: Dayjs[] = values.workingDates || [];
      const pastDates = dates.filter(isPastDate);

      if (pastDates.length === 0) {
        message.warning('Select at least one past date');
        return;
      }

      const checkIn: Dayjs = values.checkInTime;
      const checkOut: Dayjs = values.checkOutTime;
      if (!checkOut.isAfter(checkIn)) {
        message.error('Check-out time must be after check-in time');
        return;
      }

      setSubmitting(true);
      let successCount = 0;
      const errors: string[] = [];

      for (const date of pastDates) {
        try {
          const workingDate = date.toDate();
          await dispatch(
            submitAttendanceCorrection({
              employeeId,
              workingDate,
              requestedCheckInTime: combineDateAndTimeString(
                workingDate,
                values.checkInTime,
              ),
              requestedCheckOutTime: combineDateAndTimeString(
                workingDate,
                values.checkOutTime,
              ),
              reason: values.reason.trim(),
            }),
          ).unwrap();
          successCount += 1;
        } catch (error: unknown) {
          const err = error as {
            message?: string;
            response?: { data?: { message?: string } };
          };
          errors.push(
            `${date.format('DD MMM YYYY')}: ${
              err?.response?.data?.message || err?.message || 'Failed'
            }`,
          );
        }
      }

      if (successCount > 0) {
        message.success(
          `Submitted ${successCount} Request Change${successCount > 1 ? 's' : ''} for approval`,
        );
        onClose();
        onSuccess?.();
      }
      if (errors.length > 0) {
        message.error(errors.slice(0, 3).join('; '));
      }
    } catch {
      message.error('Please complete all required fields');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      title="Request Change"
      onCancel={onClose}
      onOk={handleSubmit}
      okText="Submit for approval"
      confirmLoading={submitting}
      destroyOnClose
      width={520}
    >
      <p className="text-sm text-slate-500 mb-4">
        Request clock time corrections for <strong>past dates only</strong>. Select one or
        more days — the same check-in/out times and reason apply to each. Manager approval
        required.
      </p>
      <p className="text-xs text-amber-700 mb-4 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
        Full-day leave cannot be corrected. On first/second half leave days, the span must
        be ≤ {HALF_DAY_MAX_HOURS} hours and stay in the worked half (after/before 1:00 PM).
      </p>
      <Form form={form} layout="vertical">
        <Form.Item
          name="workingDates"
          label="Dates (past only)"
          rules={[
            { required: true, message: 'Select at least one past date' },
            {
              validator: (_, value: Dayjs[]) => {
                if (!value?.length) return Promise.resolve();
                const invalid = value.filter((d) => !isPastDate(d));
                if (invalid.length) {
                  return Promise.reject(
                    new Error('Request Change is only for past dates'),
                  );
                }
                return Promise.resolve();
              },
            },
          ]}
        >
          <DatePicker
            multiple
            className="w-full"
            disabledDate={disableNonPastDates}
            format="DD MMM YYYY"
            placeholder="Select one or more dates"
            maxTagCount="responsive"
          />
        </Form.Item>
        <Form.Item
          name="checkInTime"
          label="Check-in time"
          rules={[{ required: true, message: 'Select check-in time' }]}
        >
          <TimePicker className="w-full" format="HH:mm" needConfirm={false} />
        </Form.Item>
        <Form.Item
          name="checkOutTime"
          label="Check-out time"
          dependencies={['checkInTime']}
          rules={[
            { required: true, message: 'Select check-out time' },
            ({ getFieldValue }) => ({
              validator(_, value: Dayjs) {
                const checkIn = getFieldValue('checkInTime') as Dayjs | undefined;
                if (!value || !checkIn) return Promise.resolve();
                if (!value.isAfter(checkIn)) {
                  return Promise.reject(
                    new Error('Check-out must be after check-in'),
                  );
                }
                return Promise.resolve();
              },
            }),
          ]}
        >
          <TimePicker className="w-full" format="HH:mm" needConfirm={false} />
        </Form.Item>
        <Form.Item
          name="reason"
          label="Reason"
          rules={[{ required: true, message: 'Please provide a reason' }]}
        >
          <Input.TextArea rows={3} placeholder="Why do you need this change?" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default AttendanceCorrectionModal;
