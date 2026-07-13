import { useCallback, useEffect, useState } from 'react';
import { Button, Modal, Spin, message } from 'antd';
import { LogIn, LogOut, ScanFace, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppSelector } from '../hooks';
import FaceScanner from './faceScanner';
import FaceEnroller from './faceEnroller';
import {
  checkin,
  checkout,
  getApiErrorMessage,
  getFaceAttendanceStatus,
  type FaceAttendanceStatus,
} from './service/faceApi';

type ScanAction = 'checkin' | 'checkout';

const defaultStatus: FaceAttendanceStatus = {
  isFaceEnrolled: false,
  hasCheckedIn: false,
  hasCheckedOut: false,
  canCheckin: false,
  canCheckout: false,
};

const CheckinCheckoutPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useAppSelector((state) => state.user);
  const employeeId = currentUser?.employeeId || currentUser?.loginId || '';

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [faceStatus, setFaceStatus] = useState<FaceAttendanceStatus>(defaultStatus);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [scanAction, setScanAction] = useState<ScanAction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchFaceStatus = useCallback(async () => {
    if (!employeeId) {
      setLoadingStatus(false);
      return;
    }
    setLoadingStatus(true);
    setStatusError(null);
    try {
      const status = await getFaceAttendanceStatus(employeeId);
      setFaceStatus(status);
    } catch (error) {
      const msg = getApiErrorMessage(error);
      setStatusError(msg);
      message.error(msg);
      setFaceStatus(defaultStatus);
    } finally {
      setLoadingStatus(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchFaceStatus();
  }, [fetchFaceStatus]);

  const handleEnrollClick = () => {
    if (faceStatus.isFaceEnrolled) {
      Modal.confirm({
        title: 'Re-enroll face?',
        content: 'This will replace your existing face enrollment. Are you sure?',
        okText: 'Re-enroll',
        cancelText: 'Cancel',
        centered: true,
        onOk: () => setEnrollOpen(true),
      });
      return;
    }
    setEnrollOpen(true);
  };

  const openVerifyModal = (action: ScanAction) => {
    if (!faceStatus.isFaceEnrolled) {
      message.warning('Please enroll your face first');
      return;
    }
    if (action === 'checkin' && !faceStatus.canCheckin) {
      message.warning('You have already checked in today');
      return;
    }
    if (action === 'checkout' && !faceStatus.canCheckout) {
      message.warning('Please check in first before checking out');
      return;
    }
    setScanAction(action);
    setVerifyOpen(true);
  };

  const handleVerifyComplete = async (images: string[]) => {
    if (!scanAction || !employeeId) return;

    setSubmitting(true);
    try {
      const result =
        scanAction === 'checkin'
          ? await checkin(employeeId, images)
          : await checkout(employeeId, images);

      let successMessage = result.message || `${scanAction === 'checkin' ? 'Check-in' : 'Check-out'} successful`;
      if (scanAction === 'checkout' && result.attendance) {
        const { totalHours, status } = result.attendance;
        if (totalHours != null && status) {
          successMessage = `${successMessage} — ${totalHours}h logged (${status})`;
        } else if (totalHours != null) {
          successMessage = `${successMessage} — ${totalHours}h logged`;
        }
      }

      message.success(successMessage);
      setVerifyOpen(false);
      setScanAction(null);
      await fetchFaceStatus();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyError = (errorMessage: string) => {
    message.error(errorMessage);
  };

  const closeVerifyModal = () => {
    if (submitting) return;
    setVerifyOpen(false);
    setScanAction(null);
  };

  if (!employeeId) {
    return (
      <div className="flex items-center justify-center min-h-[400px] p-6">
        <p className="text-slate-600 text-center">Unable to load employee ID. Please sign in again.</p>
      </div>
    );
  }

  if (statusError) {
    return (
      <div className="p-6 max-w-2xl mx-auto text-center">
        <h1 className="text-xl font-bold text-slate-800 mb-2">Face Attendance</h1>
        <p className="text-red-600 mb-4">{statusError}</p>
        <Button type="primary" onClick={fetchFaceStatus}>
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Face Attendance</h1>
        <p className="text-slate-500 text-sm">Enroll your face and use check-in / check-out verification.</p>
      </div>

      {loadingStatus ? (
        <div className="flex justify-center py-16">
          <Spin size="large" tip="Loading attendance status..." />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap gap-2">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                faceStatus.isFaceEnrolled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {faceStatus.isFaceEnrolled ? 'Face enrolled' : 'Not enrolled'}
            </span>
            {faceStatus.hasCheckedIn && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                Checked in
              </span>
            )}
            {faceStatus.hasCheckedOut && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700">
                Checked out
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3">
            <Button
              type="primary"
              size="large"
              icon={<ScanFace size={18} />}
              onClick={handleEnrollClick}
              disabled={submitting}
              className="flex items-center justify-center h-12"
            >
              {faceStatus.isFaceEnrolled ? 'Re-enroll' : 'Enroll'}
            </Button>

            <Button
              size="large"
              icon={<LogIn size={18} />}
              onClick={() => openVerifyModal('checkin')}
              disabled={submitting || !faceStatus.canCheckin}
              className="flex items-center justify-center h-12"
            >
              Check-in
            </Button>

            <Button
              size="large"
              icon={<LogOut size={18} />}
              onClick={() => openVerifyModal('checkout')}
              disabled={submitting || !faceStatus.canCheckout}
              className="flex items-center justify-center h-12"
            >
              {faceStatus.hasCheckedOut ? 'Re check-out' : 'Check-out'}
            </Button>

            <Button
              size="large"
              icon={<Clock size={18} />}
              onClick={() => navigate('/employee-dashboard/my-timesheet')}
              className="flex items-center justify-center h-12"
            >
              Request Change (past dates)
            </Button>
          </div>
        </>
      )}

      <FaceEnroller
        open={enrollOpen}
        employeeId={employeeId}
        onClose={() => setEnrollOpen(false)}
        onSuccess={() => {
          fetchFaceStatus();
        }}
      />

      <Modal
        open={verifyOpen}
        onCancel={closeVerifyModal}
        footer={null}
        centered
        width={720}
        destroyOnClose
        title={scanAction === 'checkin' ? 'Check-in' : 'Check-out'}
        maskClosable={!submitting}
      >
        <div className="relative">
          {submitting && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 rounded-2xl">
              <Spin size="large" tip="Verifying face..." />
            </div>
          )}
          <FaceScanner mode="verify" onComplete={handleVerifyComplete} onError={handleVerifyError} />
        </div>
      </Modal>
    </div>
  );
};

export default CheckinCheckoutPage;
