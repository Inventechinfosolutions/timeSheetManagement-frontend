import { useDispatch } from 'react-redux';
import React, { useRef, useState, useEffect } from 'react';
import { Form, Input, Button } from 'antd';
import { Plus, Trash2, Trophy } from 'lucide-react';
import { ReviewStepCard } from '../../desktop/ReviewStepCard';
import CommonMultipleUploader, {
  CommonMultipleUploaderRef,
} from '../../../../EmployeeDashboard/CommonMultipleUploader';
import {
  uploadQuarterlyReviewFile,
  downloadQuarterlyReviewFile,
  previewQuarterlyReviewFile,
  deleteQuarterlyReviewFile,
  getQuarterlyReviewFiles,
} from '../../../../reducers/quarterlyReview.reducer';
import { MobileAchievementsAndChallengesStep } from '../mobile_steps/AchieveAndChallenge/MobileAchievementsAndChallengesStep';

interface StepProps {
  disabled?: boolean;
  onDataChange?: () => void;
  reviewId?: number;
}

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

export const AchievementsAndChallengesStep: React.FC<StepProps> = ({
  disabled,
  reviewId,
  onDataChange,
}) => {
  const form = Form.useFormInstance();
  const dispatch = useDispatch();
  const uploaderRefs = useRef<{ [key: number]: CommonMultipleUploaderRef | null }>({});
  const [fileCounts, setFileCounts] = useState<{ [key: number]: number }>({});
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateMatch = () => setIsMobile(mql.matches);

    updateMatch();
    mql.addEventListener('change', updateMatch);

    return () => mql.removeEventListener('change', updateMatch);
  }, []);

  const handleRemoveProject = async (name: number, idx: number, removeFn: (i: number) => void) => {
    try {
      const projectData = form?.getFieldValue(['projects', name]);
      const attachments = projectData?.attachment;

      if (reviewId && reviewId > 0) {
        if (Array.isArray(attachments)) {
          for (const att of attachments) {
            const fileKey = att?.key || att?.id || att?.s3Key;
            if (fileKey) {
              dispatch(deleteQuarterlyReviewFile({
                entityId: reviewId,
                refId: idx + 1,
                refType: 'QUARTERLY_REVIEW_DOCUMENT',
                entityType: 'QUARTERLY_REVIEW',
                key: fileKey,
              }) as any);
            }
          }
        } else if (attachments && typeof attachments === 'object') {
          const fileKey = (attachments as any).key || (attachments as any).id || (attachments as any).s3Key;
          if (fileKey) {
            dispatch(deleteQuarterlyReviewFile({
              entityId: reviewId,
              refId: idx + 1,
              refType: 'QUARTERLY_REVIEW_DOCUMENT',
              entityType: 'QUARTERLY_REVIEW',
              key: fileKey,
            }) as any);
          }
        }

        dispatch(deleteQuarterlyReviewFile({
          entityId: reviewId,
          refId: idx + 1,
          refType: 'QUARTERLY_REVIEW_DOCUMENT',
          entityType: 'QUARTERLY_REVIEW',
          key: 'all',
        }) as any);
      }
    } catch (err) {
      console.error('Failed to cleanup files for removed project:', err);
    }

    removeFn(name);
    setFileCounts((prev) => {
      const next = { ...prev };
      delete next[idx];
      return next;
    });

    if (onDataChange) {
      onDataChange();
    }
  };

  if (isMobile) {
    return (
      <MobileAchievementsAndChallengesStep
        disabled={disabled}
        onDataChange={onDataChange}
        reviewId={reviewId}
      />
    );
  }

  return (
    <>
      <style>{`
        .hide-scrollbar textarea {
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .hide-scrollbar textarea::-webkit-scrollbar {
          width: 0;
          height: 0;
          display: none;
        }

        .hide-scrollbar textarea::-webkit-scrollbar-thumb {
          background: transparent;
        }

        .hide-scrollbar textarea::-webkit-scrollbar-track {
          background: transparent;
        }

        .ant-input-disabled,
        .ant-input[disabled],
        textarea.ant-input-disabled,
        textarea.ant-input[disabled] {
          background-color: #ffffff !important;
          color: #0f172a !important;
          border-color: #e2e8f0 !important;
        }

        .ant-input,
        textarea.ant-input {
          border-radius: 12px !important;
        }
      `}</style>
      <ReviewStepCard
        icon={Trophy}
        stepNumber={2}
        title="Accomplishments & Challenges"
        description={
          disabled
            ? undefined
            : 'Highlight your key achievements, challenges, and performance impacts this quarter.'
        }
      >

        <Form.List name="projects">
          {(fields, { add, remove }, { errors }) => (
            <>
              <div className="flex flex-col gap-6">
                {fields.map(({ key, name, ...restField }, idx) => (
                  <div
                    key={key}
                    className="qr-field-shell p-6 rounded-2xl relative transition-all"
                  >
                    {/* Item Header */}
                    <div className="flex justify-between items-center mb-1">
                      <h3 className="text-base font-bold text-slate-800 mb-0">
                        Project {idx + 1}
                      </h3>

                      {!disabled && (
                        <Button
                          type="text"
                          danger
                          onClick={() => handleRemoveProject(name, idx, remove)}
                          icon={<Trash2 className="w-4 h-4 text-red-500" />}
                          className="flex items-center gap-1.5 px-2 py-1 h-auto text-xs font-semibold text-red-500 hover:text-red-600 hover:bg-red-50 cursor-pointer hover:-translate-y-0.5"
                        >
                          Remove
                        </Button>
                      )}
                    </div>

                    {/* Row 1: Project Title full width */}
                    <div className="mb-4">
                      <span className="font-semibold text-slate-800 text-sm flex items-center gap-1 mb-1.5">
                        <span className="text-red-500">*</span>
                        Project title
                      </span>
                      <Form.Item
                        {...restField}
                        name={[name, 'projectTitle']}
                        className="mb-0"
                        rules={[{ required: true, message: 'Please enter project title' }]}
                      >
                        <Input
                          disabled={disabled}
                          placeholder={disabled ? undefined : "Enter project title"}
                          className="rounded-xl h-10 px-3 text-slate-900 bg-white hover:-translate-y-0.5"
                          style={{
                            backgroundColor: '#ffffff',
                            borderRadius: '12px',
                            borderColor: '#94a3b8',
                          }}
                          styles={{
                            input: {
                              color: "#000",
                              backgroundColor: '#ffffff',
                              borderRadius: '12px',
                            },
                          }}
                        />
                      </Form.Item>
                    </div>

                    {/* Row 2: Two-Column TextAreas for Accomplishment & Challenge */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-1.5">
                      {/* Col 1: Accomplishment */}
                      <div>
                        <span className="font-semibold text-slate-800 text-sm flex items-center gap-1 mb-1.5">
                          <span className="text-red-500">*</span>
                          What did you accomplish?
                        </span>
                        <Form.Item
                          {...restField}
                          name={[name, 'achievement']}
                          className="mb-0"
                          rules={[{ required: true, message: 'Please enter your accomplishments' }]}
                        >
                          <Input.TextArea
                            rows={4}
                            disabled={disabled}
                            placeholder={disabled ? undefined : "List your key accomplishments..."}
                            className="rounded-xl p-3 text-slate-900 hide-scrollbar bg-white hover:-translate-y-0.5"
                            style={{
                              borderRadius: '12px',
                              backgroundColor: '#fff',
                              borderColor: '#94a3b8',
                            }}
                            showCount
                            maxLength={2000}
                            styles={{
                              textarea: {
                                color: "#000",
                                resize: 'none',
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                              },
                            }}
                          />
                        </Form.Item>
                      </div>

                      {/* Col 2: Challenge */}
                      <div>
                        <span className="font-semibold text-slate-800 text-sm flex items-center gap-1 mb-1.5">
                          <span className="text-red-500">*</span>
                          What challenges did you face?
                        </span>
                        <Form.Item
                          {...restField}
                          name={[name, 'challenge']}
                          className="mb-0"
                          rules={[{ required: true, message: 'Please enter challenges faced' }]}
                        >
                          <Input.TextArea
                            rows={4}
                            disabled={disabled}
                            placeholder={disabled ? undefined : "Describe any challenges faced..."}
                            className="rounded-xl p-3 text-slate-900 hide-scrollbar bg-white hover:-translate-y-0.5"
                            style={{
                              borderRadius: '12px',
                              backgroundColor: '#fff',
                              borderColor: '#94a3b8',
                            }}
                            showCount
                            maxLength={2000}
                            styles={{
                              textarea: {
                                color: "#000",
                                resize: 'none',
                                backgroundColor: '#fff',
                                borderRadius: '12px',
                              },
                            }}
                          />
                        </Form.Item>
                      </div>
                    </div>

                    {/* Row 3: Attachments */}
                    <div>
                      {(!disabled || (fileCounts[idx] !== undefined && fileCounts[idx] > 0)) && (
                        <div className="text-sm font-semibold text-slate-800 mb-2">Attachments</div>
                      )}
                      <CommonMultipleUploader
                        ref={(el) => {
                          uploaderRefs.current[idx] = el;
                        }}
                        variant="chip"
                        entityType="QUARTERLY_REVIEW"
                        entityId={reviewId || 0}
                        refId={idx + 1}
                        refType="QUARTERLY_REVIEW_DOCUMENT"
                        uploadFile={uploadQuarterlyReviewFile}
                        downloadFile={downloadQuarterlyReviewFile}
                        previewFile={previewQuarterlyReviewFile}
                        deleteFile={deleteQuarterlyReviewFile}
                        getFiles={getQuarterlyReviewFiles}
                        disabled={disabled}
                        maxFiles={3}
                        allowedTypes={["images", "pdf", "docs"]}
                        hideUploadButton={disabled}
                        hideEmptyState={true}
                        fetchOnMount={Boolean(reviewId && reviewId > 0)}
                        onFilesChange={(files) => {
                          const newCount = files ? files.length : 0;
                          setFileCounts((prev) => {
                            if (prev[idx] === newCount) return prev;
                            return { ...prev, [idx]: newCount };
                          });

                          if (form) {
                            const attachmentVal = files && files.length > 0 ? files : null;
                            form.setFieldValue(['projects', idx, 'attachment'], attachmentVal);
                            if (onDataChange) {
                              onDataChange();
                            }
                          }
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              {!disabled && (
                <div className="mt-4">
                  <Button
                    type="dashed"
                    onClick={() => add({ projectTitle: '', achievement: '', challenge: '', attachment: null })}
                    icon={<Plus className="w-4 h-4 text-slate-600" />}
                    className="flex items-center gap-1.5 h-10 px-4 rounded-xl border-dashed border-2 border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/60 text-blue-600 hover:text-blue-700 font-semibold"
                  >
                    Add project
                  </Button>
                </div>
              )}

              {errors && <Form.ErrorList errors={errors} className="mt-2 text-rose-500" />}
            </>
          )}
        </Form.List>
      </ReviewStepCard>
    </>
  );
};