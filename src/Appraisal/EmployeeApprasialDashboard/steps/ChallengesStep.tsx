import React, { useEffect, useRef } from 'react';
import { Form, Input, Card, Button, Select } from 'antd';
import { Plus, Trash2 } from 'lucide-react';

interface StepProps {
  disabled?: boolean;
  achievements?: {
    title: string;
    details: string;
  }[];
  onDataChange?: () => void;
}

export const ChallengesStep: React.FC<StepProps> = ({
  disabled,
  achievements = [],
  onDataChange,
}) => {
  const form = Form.useFormInstance();
  const challenges = Form.useWatch('challenges', form) || [];

  // Store details per project title: { "Project 01": "difficulties", ... }
  const savedChallengesRef = useRef<Record<string, string>>({});

  // Track which title is currently active at which card index: { 0: "Project 01", 1: "Project 02" }
  const cardTitlesRef = useRef<Record<number, string>>({});

  // Synchronize saved challenges cache and card titles map with form state changes
  useEffect(() => {
    if (Array.isArray(challenges)) {
      challenges.forEach((item: any, idx: number) => {
        const title = item?.title?.trim();
        if (title) {
          const currentTrackedTitle = cardTitlesRef.current[idx];
          if (currentTrackedTitle === undefined) {
            // Initial load for this card index
            cardTitlesRef.current[idx] = title;
            if (item.details !== undefined && savedChallengesRef.current[title] === undefined) {
              savedChallengesRef.current[title] = item.details;
            }
          } else if (currentTrackedTitle === title) {
            // Typing/editing details for the currently active title of this card
            if (item.details !== undefined) {
              savedChallengesRef.current[title] = item.details;
            }
          }
        }
      });
    }
  }, [challenges]);

  const validTitles = achievements
    .map((item: any) => item?.title?.trim())
    .filter(Boolean);

  const handleProjectChange = (newTitle: string, fieldIndex: number) => {
    const cleanNewTitle = newTitle?.trim() || '';
    const currentChallenges = form.getFieldValue('challenges') || [];

    const oldTitle = cardTitlesRef.current[fieldIndex] || currentChallenges[fieldIndex]?.title?.trim();
    const currentDetails = currentChallenges[fieldIndex]?.details || '';

    // 1. Save whatever text was typed for the previous project title
    if (oldTitle) {
      savedChallengesRef.current[oldTitle] = currentDetails;
    }

    // 2. Fetch saved details for new project (or fallback to empty string '')
    const loadedDetails = savedChallengesRef.current[cleanNewTitle] ?? '';

    // 3. Update active card index tracking
    cardTitlesRef.current[fieldIndex] = cleanNewTitle;

    // 4. Force atomic form state update after current event tick completes
    setTimeout(() => {
      const latestChallenges = form.getFieldValue('challenges') || [];
      const updatedChallenges = Array.isArray(latestChallenges) ? [...latestChallenges] : [];

      if (updatedChallenges[fieldIndex]) {
        updatedChallenges[fieldIndex] = {
          ...updatedChallenges[fieldIndex],
          title: cleanNewTitle,
          details: loadedDetails,
        };
      } else {
        updatedChallenges[fieldIndex] = {
          title: cleanNewTitle,
          details: loadedDetails,
        };
      }

      form.setFieldsValue({
        challenges: updatedChallenges,
      });
      console.log(
        "After switch:",
        form.getFieldsValue(true)
      );
      form.validateFields([['challenges', fieldIndex, 'details']]).catch(() => { });
    }, 0);
  };

  const getProjectOptionsForField = (fieldIndex: number) => {
    const selectedInOtherCards = (challenges || [])
      .filter((_: any, idx: number) => idx !== fieldIndex)
      .map((item: any) => item?.title?.trim())
      .filter(Boolean);

    return achievements
      .filter((item: any) => {
        const title = item?.title?.trim();
        return title && !selectedInOtherCards.includes(title);
      })
      .map((item: any) => ({
        label: item.title,
        value: item.title,
      }));
  };

  return (
    <Card
      className="shadow-md border border-slate-100 rounded-2xl p-4 bg-white/80 backdrop-blur-sm"
      title={
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
          <span>3. Challenges Faced & Blockers</span>
        </div>
      }
    >
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        Describe any roadblocks, bottlenecks, skill gaps, or external factors that affected your capacity
        to meet your goals this quarter.
      </p>

      <Form.List name="challenges">
        {(fields, { add, remove }, { errors }) => (
          <>
            <div className="flex flex-col gap-4">
              {fields.map(({ key, name, ...restField }, idx) => (
                <div
                  key={key}
                  className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 relative"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-slate-800">
                        Challenge: {String(idx + 1).padStart(2, '0')}
                      </h3>

                      <div className="mt-3">
                        <span className="font-semibold text-slate-700 text-sm flex items-center gap-1">
                          <span className="text-rose-500">*</span>
                          <span>Project Title</span>
                        </span>
                      </div>
                    </div>

                    {!disabled && (
                      <Button
                        type="text"
                        danger
                        onClick={() => {
                          // Clean ref cache for removed index
                          delete cardTitlesRef.current[name];
                          remove(name);
                        }}
                        icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                        className="flex items-center gap-1.5 px-2 py-1 h-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-semibold"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, 'title']}
                    rules={[
                      {
                        validator(_, value) {
                          if (!value) {
                            return Promise.resolve();
                          }

                          if (validTitles.includes(value)) {
                            return Promise.resolve();
                          }

                          return Promise.reject(
                            new Error('Selected project is no longer available. Please select a project again.')
                          );
                        },
                      },
                    ]}
                  >
                    <Select
                      placeholder="Select Project"
                      options={getProjectOptionsForField(name)}
                      onChange={(val) => handleProjectChange(val, name)}
                      disabled={disabled}
                      className="text-black"
                      style={{ color: '#000' }}
                    />
                  </Form.Item>

                  <div className="mb-2">
                    <span className="font-semibold text-slate-700 text-sm flex items-center">
                      <span className="text-rose-500 mr-1">*</span>
                      What difficulties did you encounter?
                    </span>
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, 'details']}
                    className="mb-0"
                  >
                    <Input.TextArea
                      rows={4}
                      disabled={disabled}
                      placeholder="Mention technical roadblocks, delay dependencies, resource constraints, or areas where you faced difficulties..."
                      className="rounded-xl border-slate-200 hover:border-amber-400 focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.1)] transition-all duration-200 p-3"
                      styles={{
                        textarea: {
                          color: '#000',
                        },
                      }}
                      showCount
                      maxLength={1000}
                    />
                  </Form.Item>
                </div>
              ))}
            </div>

            {!disabled && (
              <div className="mt-4">
                <Button
                  type="dashed"
                  onClick={() => add()}
                  icon={<Plus className="w-4 h-4 text-blue-600" />}
                  className="flex items-center gap-1.5 h-10 px-4 rounded-xl border-dashed border-2 border-blue-200 hover:border-blue-400 bg-blue-50/40 hover:bg-blue-50/60 text-blue-600 hover:text-blue-700 font-semibold"
                >
                  Add Challenge
                </Button>
              </div>
            )}

            {errors && <Form.ErrorList errors={errors} className="mt-2 text-rose-500" />}
          </>
        )}
      </Form.List>
    </Card>
  );
};