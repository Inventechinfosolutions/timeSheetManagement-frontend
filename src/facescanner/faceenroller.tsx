import { useState } from 'react';
import { Modal, Spin, message } from 'antd';
import FaceScanner from './faceScanner';
import { enrollFace, getApiErrorMessage } from './service/faceApi';

interface FaceEnrollerProps {
  open: boolean;
  employeeId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const FaceEnroller = ({ open, employeeId, onClose, onSuccess }: FaceEnrollerProps) => {
  const [submitting, setSubmitting] = useState(false);

  const handleComplete = async (images: string[]) => {
    setSubmitting(true);
    try {
      const result = await enrollFace(employeeId, images);
      message.success(result.message || 'Face enrolled successfully');
      onSuccess();
      onClose();
    } catch (error) {
      message.error(getApiErrorMessage(error));
    } finally {
      setSubmitting(false);
    }
  };

  const handleError = (errorMessage: string) => {
    message.error(errorMessage);
  };

  return (
    <Modal
      open={open}
      onCancel={submitting ? undefined : onClose}
      footer={null}
      centered
      width={720}
      destroyOnClose
      title="Face Enrollment"
      maskClosable={!submitting}
    >
      <div className="relative">
        {submitting && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/70 rounded-2xl">
            <Spin size="large" tip="Enrolling face..." />
          </div>
        )}
        <FaceScanner mode="enroll" onComplete={handleComplete} onError={handleError} />
      </div>
    </Modal>
  );
};

export default FaceEnroller;
