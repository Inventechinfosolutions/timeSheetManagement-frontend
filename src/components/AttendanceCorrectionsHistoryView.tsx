import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  DatePicker,
  Space,
  Table,
  Tag,
  message,
  type TableColumnsType,
  type TableProps,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import {
  AttendanceCorrectionRequest,
  fetchCorrectionHistory,
  fetchEmployeeCorrections,
  formatClockTime,
  updateCorrectionStatus,
} from '../reducers/attendanceCorrection.api';
import { useAppDispatch, useAppSelector } from '../hooks';

const { RangePicker } = DatePicker;

const statusColor = (status: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'pending') return 'processing';
  if (s === 'approved') return 'success';
  if (s === 'rejected') return 'error';
  return 'default';
};

export type AttendanceCorrectionsHistoryMode = 'manager' | 'employee';

interface AttendanceCorrectionsHistoryViewProps {
  mode: AttendanceCorrectionsHistoryMode;
}

const AttendanceCorrectionsHistoryView = ({
  mode,
}: AttendanceCorrectionsHistoryViewProps) => {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { currentUser } = useAppSelector((state) => state.user);
  const employeeId = currentUser?.employeeId || currentUser?.loginId || '';
  const isManager = mode === 'manager';

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<AttendanceCorrectionRequest[]>([]);
  const [actingId, setActingId] = useState<number | null>(null);
  const [bulkActing, setBulkActing] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>(() => [
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const from = dateRange[0].format('YYYY-MM-DD');
      const to = dateRange[1].format('YYYY-MM-DD');
      const data = isManager
        ? await dispatch(fetchCorrectionHistory({ from, to })).unwrap()
        : await dispatch(
            fetchEmployeeCorrections({ employeeId, from, to }),
          ).unwrap();
      setItems(data);
      setSelectedIds((prev) =>
        prev.filter((id) =>
          data.some((item) => item.id === id && item.status === 'Pending'),
        ),
      );
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      message.error(
        err?.response?.data?.message ||
          err?.message ||
          'Failed to load corrections',
      );
      setItems([]);
      setSelectedIds([]);
    } finally {
      setLoading(false);
    }
  }, [dispatch, dateRange, employeeId, isManager]);

  useEffect(() => {
    if (!isManager && !employeeId) {
      setLoading(false);
      return;
    }
    load();
  }, [load, isManager, employeeId]);

  const pendingSelectedCount = useMemo(
    () =>
      selectedIds.filter((id) =>
        items.some((item) => item.id === id && item.status === 'Pending'),
      ).length,
    [items, selectedIds],
  );

  const handleAction = async (id: number, status: 'Approved' | 'Rejected') => {
    setActingId(id);
    try {
      await dispatch(
        updateCorrectionStatus({
          id,
          status,
          rejectionReason:
            status === 'Rejected' ? 'Rejected by manager' : undefined,
        }),
      ).unwrap();
      message.success(
        status === 'Approved' ? 'Correction approved' : 'Correction rejected',
      );
      await load();
    } catch (error: unknown) {
      const err = error as {
        message?: string;
        response?: { data?: { message?: string } };
      };
      message.error(
        err?.response?.data?.message || err?.message || 'Action failed',
      );
    } finally {
      setActingId(null);
    }
  };

  const handleBulkAction = async (status: 'Approved' | 'Rejected') => {
    const pendingIds = selectedIds.filter((id) =>
      items.some((item) => item.id === id && item.status === 'Pending'),
    );
    if (pendingIds.length === 0) {
      message.warning('Select at least one pending request');
      return;
    }

    setBulkActing(true);
    let successCount = 0;
    const errors: string[] = [];

    for (const id of pendingIds) {
      try {
        await dispatch(
          updateCorrectionStatus({
            id,
            status,
            rejectionReason:
              status === 'Rejected' ? 'Rejected by manager' : undefined,
          }),
        ).unwrap();
        successCount += 1;
      } catch (error: unknown) {
        const err = error as {
          message?: string;
          response?: { data?: { message?: string } };
        };
        const item = items.find((entry) => entry.id === id);
        const label = item
          ? `${item.employeeId} — ${dayjs(item.workingDate).format('DD MMM YYYY')}`
          : `Request #${id}`;
        errors.push(
          `${label}: ${err?.response?.data?.message || err?.message || 'Failed'}`,
        );
      }
    }

    if (successCount > 0) {
      message.success(
        `${successCount} correction${successCount > 1 ? 's' : ''} ${status.toLowerCase()}`,
      );
    }
    if (errors.length > 0) {
      message.error(errors.slice(0, 3).join('; '));
    }

    setSelectedIds([]);
    await load();
    setBulkActing(false);
  };

  const columns: TableColumnsType<AttendanceCorrectionRequest> = [
    ...(isManager
      ? [
          {
            title: 'Employee',
            dataIndex: 'employeeId',
            key: 'employeeId',
            fixed: 'left' as const,
            width: 120,
          },
        ]
      : []),
    {
      title: 'Working date',
      dataIndex: 'workingDate',
      key: 'workingDate',
      width: 130,
      render: (value: string) => dayjs(value).format('DD MMM YYYY'),
      sorter: (a, b) =>
        dayjs(a.workingDate).valueOf() - dayjs(b.workingDate).valueOf(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Check-in',
      dataIndex: 'requestedCheckInTime',
      key: 'requestedCheckInTime',
      width: 90,
      render: (value: string) => formatClockTime(value),
    },
    {
      title: 'Check-out',
      dataIndex: 'requestedCheckOutTime',
      key: 'requestedCheckOutTime',
      width: 90,
      render: (value: string) => formatClockTime(value),
    },
    {
      title: 'Reason',
      dataIndex: 'reason',
      key: 'reason',
      ellipsis: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      width: 110,
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Approved', value: 'Approved' },
        { text: 'Rejected', value: 'Rejected' },
      ],
      onFilter: (value, record) => record.status === value,
      render: (status: string) => (
        <Tag color={statusColor(status)}>{status}</Tag>
      ),
    },
    {
      title: 'Reviewed by',
      dataIndex: 'reviewedBy',
      key: 'reviewedBy',
      width: 140,
      render: (value?: string | null, record?: AttendanceCorrectionRequest) => {
        if (!value) return '—';
        const when = record?.reviewedAt
          ? dayjs(record.reviewedAt).format('DD MMM')
          : '';
        return when ? `${value} (${when})` : value;
      },
    },
    ...(isManager
      ? [
          {
            title: 'Actions',
            key: 'actions',
            fixed: 'right' as const,
            width: 180,
            render: (_: unknown, record: AttendanceCorrectionRequest) => {
              if (record.status !== 'Pending') {
                return record.status === 'Rejected' && record.rejectionReason ? (
                  <span className="text-xs text-red-500">
                    {record.rejectionReason}
                  </span>
                ) : (
                  <span className="text-xs text-slate-400">—</span>
                );
              }
              return (
                <Space size="small">
                  <Button
                    type="primary"
                    size="small"
                    loading={actingId === record.id}
                    disabled={bulkActing}
                    onClick={() => handleAction(record.id, 'Approved')}
                  >
                    Approve
                  </Button>
                  <Button
                    danger
                    size="small"
                    loading={actingId === record.id}
                    disabled={bulkActing}
                    onClick={() => handleAction(record.id, 'Rejected')}
                  >
                    Reject
                  </Button>
                </Space>
              );
            },
          },
        ]
      : [
          {
            title: 'Notes',
            key: 'notes',
            width: 160,
            render: (_: unknown, record: AttendanceCorrectionRequest) => {
              if (record.status === 'Rejected' && record.rejectionReason) {
                return (
                  <span className="text-xs text-red-500">
                    {record.rejectionReason}
                  </span>
                );
              }
              return <span className="text-xs text-slate-400">—</span>;
            },
          },
        ]),
  ];

  const rowSelection: TableProps<AttendanceCorrectionRequest>['rowSelection'] =
    isManager
      ? {
          selectedRowKeys: selectedIds,
          onChange: (keys) => setSelectedIds(keys as number[]),
          getCheckboxProps: (record) => ({
            disabled: record.status !== 'Pending',
          }),
        }
      : undefined;

  return (
    <div className="p-4 md:px-8 md:pt-4 md:pb-0 bg-[#F4F7FE] h-full max-h-full overflow-auto font-sans text-[#2B3674]">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-end lg:justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#2B3674]">
            Correction Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isManager
              ? 'Review pending requests and browse correction history'
              : 'View the status of your time correction requests'}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <RangePicker
            value={dateRange}
            onChange={(values) => {
              if (values?.[0] && values?.[1]) {
                setDateRange([values[0], values[1]]);
              }
            }}
            allowClear={false}
            format="DD MMM YYYY"
          />
          {isManager ? (
            <Space wrap>
              <Button
                type="primary"
                disabled={pendingSelectedCount === 0}
                loading={bulkActing}
                onClick={() => handleBulkAction('Approved')}
              >
                Approve selected
              </Button>
              <Button
                danger
                disabled={pendingSelectedCount === 0}
                loading={bulkActing}
                onClick={() => handleBulkAction('Rejected')}
              >
                Reject selected
              </Button>
            </Space>
          ) : (
            <Button
              type="primary"
              onClick={() => navigate('/employee-dashboard/my-timesheet')}
            >
              Request Change
            </Button>
          )}
        </div>
      </div>

      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={items}
        rowSelection={rowSelection}
        scroll={{ x: isManager ? 1100 : 900 }}
        pagination={{ pageSize: 20, showSizeChanger: true }}
        locale={{ emptyText: 'No correction requests in this date range.' }}
      />
    </div>
  );
};

export default AttendanceCorrectionsHistoryView;
