import React from 'react';
import { Form, Input, Card, Button } from 'antd';
import { AlertCircle, Plus, Trash2 } from 'lucide-react';

interface StepProps {
  disabled?: boolean;
}

export const ChallengesStep: React.FC<StepProps> = ({ disabled }) => {
  return (
    <Card
      className="shadow-md border border-slate-100 rounded-2xl p-4 bg-white/80 backdrop-blur-sm"
      title={
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
          <AlertCircle className="w-5 h-5 text-amber-500" />
          <span>3. Challenges Faced & Blockers</span>
        </div>
      }
    >
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        Describe any roadblocks, bottlenecks, skill gaps, or external factors that affected your capacity
        to meet your goals this quarter.
      </p>

      <Form.List
        name="challenges"
        rules={[
          {
            validator: async (_, names) => {
              if (!names || names.length === 0) {
                return Promise.reject(new Error('At least one challenge / blocker is required.'));
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
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      Challenge Title<span className="text-rose-500">*</span>
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
                    name={[name, 'title']}
                    rules={[{ required: true, message: 'Please provide a challenge title.' }]}
                    className="mb-4"
                  >
                    <Input
                      disabled={disabled}
                      placeholder="e.g. Database replication delay"
                      className="rounded-xl border-slate-200 hover:border-amber-400 focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.1)] transition-all duration-200 h-10 px-3"
                      styles={{
                        input: {
                          color: "#000",
                        },
                      }}
                    />
                  </Form.Item>

                  <div className="mb-2">
                    <span className="font-semibold text-slate-700 text-sm flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-amber-500" />
                      What difficulties did you encounter?<span className="text-rose-500">*</span>
                    </span>
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, 'details']}
                    rules={[
                      { required: true, message: 'Please provide details of your challenge.' },
                      { min: 10, message: 'Challenge details must be at least 10 characters long.' },
                    ]}
                    className="mb-0"
                  >
                    <Input.TextArea
                      rows={4}
                      disabled={disabled}
                      placeholder="Mention technical roadblocks, delay dependencies, resource constraints, or areas where you faced difficulties..."
                      className="rounded-xl border-slate-200 hover:border-amber-400 focus:border-amber-500 focus:shadow-[0_0_0_2px_rgba(245,158,11,0.1)] transition-all duration-200 p-3"
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

