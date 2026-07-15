import React from 'react';
import { Form, Input, Card, Button } from 'antd';
import { Compass, Plus, Trash2 } from 'lucide-react';

interface StepProps {
  disabled?: boolean;
}

export const LearningGoalsStep: React.FC<StepProps> = ({ disabled }) => {
  return (
    <Card
      className="shadow-md border border-slate-100 rounded-2xl p-4 bg-white/80 backdrop-blur-sm"
      title={
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
          <Compass className="w-5 h-5 text-indigo-500" />
          <span>4. Learning & Future Goals</span>
        </div>
      }
    >
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        Describe what new skills or knowledge you acquired this quarter, and outline your plans, learning
        objectives, and targets for the next quarter.
      </p>

      <Form.List
        name="learningGoals"
        rules={[
          {
            validator: async (_, names) => {
              if (!names || names.length === 0) {
                return Promise.reject(new Error('At least one learning objective / goal is required.'));
              }
            },
          },
        ]}
      >
        {(fields, { add, remove }, { errors }) => (
          <>
            <div className="flex flex-col gap-4">
              {fields.map(({ key, name, ...restField }, idx) => (
                <div
                  key={key}
                  className="border border-slate-100 rounded-2xl p-6 bg-slate-50/50 relative"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <Compass className="w-4 h-4 text-indigo-500" />
                      What are your learning objectives and goals?<span className="text-rose-500">*</span>
                    </span>
                    {!disabled && (
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                        className="flex items-center gap-1.5 px-2 py-1 h-auto text-rose-500 hover:text-rose-600 hover:bg-rose-50 font-semibold"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, 'details']}
                    rules={[
                      { required: true, message: 'Please provide details of your learning objectives and goals.' },
                      { min: 10, message: 'Goal details must be at least 10 characters long.' },
                    ]}
                    className="mb-0"
                  >
                    <Input.TextArea
                      rows={4}
                      disabled={disabled}
                      placeholder="Outline skills to learn, certificates to acquire, targets for current projects, or professional milestones..."
                      className="rounded-xl border-slate-200 hover:border-indigo-400 focus:border-indigo-500 focus:shadow-[0_0_0_2px_rgba(99,102,241,0.1)] transition-all duration-200 p-3"
                      styles={{
                        textarea: {
                          color: "#000",
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
                  Add Goal
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