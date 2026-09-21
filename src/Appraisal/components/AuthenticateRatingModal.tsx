import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Modal, Form, Input, Button, Alert } from 'antd';
import { Lock, Mail, Clock } from 'lucide-react';
import { useRevealedRatings } from '../hooks/useRevealedRatings';

export const AuthenticateRatingModal: React.FC = () => {
  const { modalState, closeAuthModal, revealRating } = useRevealedRatings();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (modalState.isOpen) {
      setErrorMsg(null);
      form.resetFields();
      if (modalState.initialEmail) {
        form.setFieldsValue({ email: modalState.initialEmail });
      }
    }
  }, [modalState.isOpen, modalState.initialEmail, form]);

  const handleSubmit = async (values: { email: string; password: string }) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const success = await revealRating({
        reviewId: modalState.reviewId,
        quarter: modalState.quarter,
        employeeId: modalState.employeeId,
        email: values.email.trim(),
        password: values.password,
      });
      if (success) {
        form.resetFields();
        closeAuthModal();

        if (modalState.onSuccess) {
          modalState.onSuccess();
        } else if (modalState.navigateOnSuccess) {
          // Navigate to the new 4 quarters ratings page only when explicitly requested (e.g. Current Year Rating card)
          const isDashboardAdmin = location.pathname.startsWith('/admin-dashboard');
          const isDashboardManager = location.pathname.startsWith('/manager-dashboard');
          const prefix = isDashboardAdmin
            ? '/admin-dashboard'
            : isDashboardManager
              ? '/manager-dashboard'
              : '/employee-dashboard';

          const targetFY = modalState.quarter || '';
          const fyParam = targetFY ? `?financialYear=${encodeURIComponent(targetFY)}` : '';
          const empParam = modalState.employeeId ? `&employeeId=${encodeURIComponent(modalState.employeeId)}` : '';
          navigate(`${prefix}/quarterly-ratings${fyParam}${empParam}`);
        }
      }
    } catch (err: any) {
      const serverMsg =
        err?.response?.data?.message ||
        err?.message ||
        'Incorrect password. Please try again.';
      setErrorMsg(serverMsg);
      form.setFieldsValue({ password: '' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={modalState.isOpen}
      onCancel={() => {
        if (!loading) {
          setErrorMsg(null);
          closeAuthModal();
        }
      }}
      footer={null}
      destroyOnClose
      centered
      width={460}
      title={
        <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">Verify Identity to View Rating</h3>
            <p className="text-xs text-slate-500 font-normal mt-0.5">
              Enter your registered credentials to unlock the Final Rating
            </p>
          </div>
        </div>
      }
    >
      <div className="pt-3 pb-1 space-y-4">
        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
          <Clock className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            For security, the Final Rating will remain visible for <strong>exactly 2 minutes</strong> after verification and then automatically hide again.
          </p>
        </div>

        {errorMsg && (
          <Alert
            type="error"
            showIcon
            message="Verification Failed"
            description={errorMsg}
            className="rounded-xl text-xs"
          />
        )}

        <Form form={form} layout="vertical" onFinish={handleSubmit} requiredMark={false}>
          <Form.Item
            name="email"
            label={<span className="text-xs font-bold text-slate-700 uppercase">Registered Email or Employee ID</span>}
            rules={[
              { required: true, message: 'Please enter your registered email or Employee ID' },
            ]}
          >
            <Input
              prefix={<Mail className="w-4 h-4 text-slate-400 mr-1.5" />}
              placeholder="e.g. employee@company.com or ABC-01"
              className="h-10 rounded-lg text-sm"
              disabled={loading}
              autoComplete="username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span className="text-xs font-bold text-slate-700 uppercase">Password</span>}
            rules={[{ required: true, message: 'Please enter your account password' }]}
          >
            <Input.Password
              prefix={<Lock className="w-4 h-4 text-slate-400 mr-1.5" />}
              placeholder="Enter your account password"
              className="h-10 rounded-lg text-sm"
              disabled={loading}
              autoComplete="current-password"
            />
          </Form.Item>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100 mt-5">
            <Button
              onClick={closeAuthModal}
              disabled={loading}
              className="h-9 px-4 rounded-lg text-xs font-medium"
            >
              Cancel
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              className="h-9 px-5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-xs"
            >
              Verify & Reveal Rating
            </Button>
          </div>
        </Form>
      </div>
    </Modal>
  );
};
