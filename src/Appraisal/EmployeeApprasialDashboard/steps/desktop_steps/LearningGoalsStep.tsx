import React, { useEffect, useState } from 'react';
import { Form, Input, Button } from 'antd';
import { Plus, Trash2, GraduationCap } from 'lucide-react';
import { MobileLearningGoalsStep } from '../mobile_steps/LearningGoals/MobileLearningGoalsStep';
import { ReviewStepCard } from '../../desktop/ReviewStepCard';

interface StepProps {
  disabled?: boolean;
}

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

export const LearningGoalsStep: React.FC<StepProps> = ({ disabled }) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);
    const updateMatch = () => setIsMobile(mql.matches);

    updateMatch();
    mql.addEventListener('change', updateMatch);

    return () => mql.removeEventListener('change', updateMatch);
  }, []);

  if (isMobile) {
    return <MobileLearningGoalsStep disabled={disabled} />;
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
`}</style>
    <ReviewStepCard
      icon={GraduationCap}
      stepNumber={3}
      title="Learning & Goals"
      description={
        disabled
          ? undefined
          : 'Describe the skills you gained this quarter and your goals for the next.'
      }
    >

      <Form.List name="learningGoals">
        {(fields, { add, remove }, { errors }) => (
          <>
            <div className="flex flex-col gap-4">
              {fields.map(({ key, name, ...restField }) => (
                <div
                  key={key}
                  className="qr-field-shell rounded-2xl p-4 relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700 text-sm flex items-center">
                      <span className="text-rose-500 mr-1">*</span>
                      What are your learning goals?
                    </span>
                    {!disabled && (
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                        className="flex items-center gap-1.5 px-2 py-1 h-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-semibold hover:-translate-y-0.5"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, 'details']}
                    className="mb-0"
                  >
                    <Input.TextArea
                      rows={4}
                      disabled={disabled}
                      placeholder={disabled ? undefined : "List skills to develop, certifications to pursue, and goals for next quarter."}
                      className="rounded-xl transition-all duration-200 p-3 hide-scrollbar hover:-translate-y-0.5"
                      style={{
                        borderRadius: '12px',
                        backgroundColor: '#fff',
                        borderColor: '#94a3b8',
                      }}
                      styles={{
                        textarea: {
                          color: "#000",
                          resize: "none",
                          backgroundColor: '#fff',
                          borderRadius: '12px',
                        },
                      }}
                      showCount
                      maxLength={2000}
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
                  Add Goal
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