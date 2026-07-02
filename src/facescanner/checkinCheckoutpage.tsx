import { useCallback, useEffect, useState } from 'react';
import { Button, Modal, Spin, message } from 'antd';
import { LogIn, LogOut, ScanFace } from 'lucide-react';
import { useAppSelector } from '../hooks';
import FaceScanner from './faceScanner';
import FaceEnroller from './faceEnroller';
import {
  checkin,
  checkout,
  getApiErrorMessage,
  isFaceEnrolled,
} from './service/faceApi';

type ScanAction = 'checkin' | 'checkout';

const CheckinCheckoutPage = () => {
  const { currentUser } = useAppSelector((state) => state.user);
  const employeeId = currentUser?.employeeId || currentUser?.loginId || '';

  const [loadingStatus, setLoadingStatus] = useState(true);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [scanAction, setScanAction] = useState<ScanAction | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchEnrolledStatus = useCallback(async () => {
    if (!employeeId) {
      setLoadingStatus(false);
      return;
    }
    setLoadingStatus(true);
    try {
      const enrolled = await isFaceEnrolled(employeeId);
      setIsEnrolled(enrolled);
    } catch (error) {
      message.error(getApiErrorMessage(error));
      setIsEnrolled(false);
    } finally {
      setLoadingStatus(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEnrolledStatus();
  }, [fetchEnrolledStatus]);

  const handleEnrollClick = () => {
    if (isEnrolled) {
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
    if (!isEnrolled) {
      message.warning('Please enroll your face first');
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
      message.success(result.message || `${scanAction === 'checkin' ? 'Check-in' : 'Check-out'} successful`);
      setVerifyOpen(false);
      setScanAction(null);
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

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Face Attendance</h1>
        <p className="text-slate-500 text-sm">Enroll your face and use check-in / check-out verification.</p>
      </div>

      {loadingStatus ? (
        <div className="flex justify-center py-16">
          <Spin size="large" tip="Checking enrollment status..." />
        </div>
      ) : (
        <>
          <div className="mb-6">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                isEnrolled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {isEnrolled ? 'Face enrolled' : 'Not enrolled'}
            </span>
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
              {isEnrolled ? 'Re-enroll' : 'Enroll'}
            </Button>

            <Button
              size="large"
              icon={<LogIn size={18} />}
              onClick={() => openVerifyModal('checkin')}
              disabled={submitting}
              className="flex items-center justify-center h-12"
            >
              Check-in
            </Button>

            <Button
              size="large"
              icon={<LogOut size={18} />}
              onClick={() => openVerifyModal('checkout')}
              disabled={submitting}
              className="flex items-center justify-center h-12"
            >
              Check-out
            </Button>
          </div>
        </>
      )}

      <FaceEnroller
        open={enrollOpen}
        employeeId={employeeId}
        onClose={() => setEnrollOpen(false)}
        onSuccess={() => setIsEnrolled(true)}
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
