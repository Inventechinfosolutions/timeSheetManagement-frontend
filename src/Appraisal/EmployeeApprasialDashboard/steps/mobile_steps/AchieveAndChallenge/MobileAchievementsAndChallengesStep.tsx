import React, { useRef, useState } from 'react';
import { Form, Input, Card, Button } from 'antd';
import { Plus } from 'lucide-react';
import AnimatedTrash from '../../../Trash/AnimatedTrash';
import CommonMultipleUploader, {
  CommonMultipleUploaderRef,
} from '../../../../../EmployeeDashboard/CommonMultipleUploader';
import {
  uploadQuarterlyReviewFile,
  downloadQuarterlyReviewFile,
  previewQuarterlyReviewFile,
  deleteQuarterlyReviewFile,
  getQuarterlyReviewFiles,
} from '../../../../../reducers/quarterlyReview.reducer';
import './MobileAchievementsAndChallengesStep.css';

interface StepProps {
  disabled?: boolean;
  onDataChange?: () => void;
  reviewId?: number;
}

export const MobileAchievementsAndChallengesStep: React.FC<StepProps> = ({
  disabled,
  reviewId,
  onDataChange,
}) => {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  const form = Form.useFormInstance();
  const uploaderRefs = useRef<{ [key: number]: CommonMultipleUploaderRef | null }>({});
  const [, setFileCounts] = useState<{ [key: number]: number }>({});

  return (
    <Card
      className="mobile-achievements-card"
      styles={{
        body: {
          padding: '10px',
          textAlign: 'justify',
        },
      }}
    >
      <div className="mobile-info-width">
        <h1 className="mobile-achievements-card__title">2. Accomplishments & Challenges</h1>
        <p className="mobile-achievements-card__subtitle">
          Highlight your key achievements, challenges, and performance impacts this quarter.
        </p>

        <Form.List name="projects">
          {(fields, { add, remove }, { errors }) => (
            <>
              <div className="mobile-achievements-card__list">
                {fields.map(({ key, name, ...restField }, idx) => (
                  <div key={key} className="border border-slate-100 rounded-2xl py-3 px-2 bg-slate-50/50 relative">
                    {/* Item Header */}
                    <div className="mobile-achievements-item__header">
                      <h3 className="mobile-achievements-item__title">
                        Project {idx + 1}
                      </h3>

                      {!disabled && (
                        <div className="mobile-achievements-item__actions">
                          <Button
                            type="text"
                            danger
                            onClick={() => {
                              setRemovingIndex(idx);

                              setTimeout(() => {
                                remove(name);
                                setRemovingIndex(null);
                              }, 450);
                            }}
                            icon={<AnimatedTrash animate={removingIndex === idx} />}
                            className="mobile-achievements-item__remove-btn"
                          >
                          </Button>
                        </div>
                      )}
                    </div>

                    {/* Stacked single-column fields */}
                    <div className="mobile-achievements-item__fields">
                      <div>
                        <span className="mobile-achievements-item__label">
                          <span className="mobile-achievements-item__required">*</span>
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
                            placeholder="Enter project title"
                            className="mobile-achievements-item__input"
                            style={{
                              backgroundColor: '#ffffff',
                              borderRadius: '12px',
                              borderColor: '#e2e8f0',
                            }}
                            styles={{
                              input: {
                                color: '#000',
                                backgroundColor: '#ffffff',
                                borderRadius: '12px',
                              },
                            }}
                          />
                        </Form.Item>
                      </div>

                      <div>
                        <span className="mobile-achievements-item__label">
                          <span className="mobile-achievements-item__required">*</span>
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
                            placeholder="List your key accomplishments..."
                            className="mobile-achievements-item__textarea mobile-achievements-item__scrollbar-hide"
                            showCount
                            maxLength={2000}
                            styles={{
                              textarea: {
                                resize: 'none',
                                backgroundColor: '#fff',
                                color: '#000',
                              },
                            }}
                          />
                        </Form.Item>
                      </div>

                      <div>
                        <span className="mobile-achievements-item__label">
                          <span className="mobile-achievements-item__required">*</span>
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
                            placeholder="Describe any challenges faced..."
                            className="mobile-achievements-item__textarea mobile-achievements-item__textarea--challenge mobile-achievements-item__scrollbar-hide"
                            showCount
                            maxLength={2000}
                            styles={{
                              textarea: {
                                resize: 'none',
                                backgroundColor: '#fff',
                                color: '#000',
                              },
                            }}
                          />
                        </Form.Item>
                      </div>

                      {/* Attachments Section */}
                      <div className="mobile-achievements-item__uploader">
                        <span className="mobile-achievements-item__label mb-2">
                          Attachments
                        </span>
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
                          maxFiles={5}
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
                  </div>
                ))}
              </div>

              {!disabled && (
                <div className="mobile-achievements-card__add-wrap">
                  <Button
                    type="dashed"
                    onClick={() => add({ projectTitle: '', achievement: '', challenge: '', attachment: null })}
                    icon={<Plus className="w-4 h-4 text-slate-600" />}
                    className="mobile-achievements-card__add-btn"
                  >
                    Add project
                  </Button>
                </div>
              )}

              {errors && <Form.ErrorList errors={errors} className="mt-2 text-rose-500" />}
            </>
          )}
        </Form.List>
      </div>
    </Card>
  );
};