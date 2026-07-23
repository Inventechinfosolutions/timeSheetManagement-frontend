import React from 'react';
import { Form, Input, Card, Button } from 'antd';
import { Award, Plus, Trash2 } from 'lucide-react';

interface StepProps {
  disabled?: boolean;
}

export const AchievementsStep: React.FC<StepProps> = ({ disabled }) => {
  return (
    <Card
      className="shadow-md border border-slate-100 rounded-2xl p-4 bg-white/80 backdrop-blur-sm"
      title={
        <div className="flex items-center gap-2 text-slate-800 font-semibold text-lg">
          <span>2. Key Achievements</span>
        </div>
      }
    >
      <p className="text-slate-500 text-sm mb-6 leading-relaxed">
        Highlight your major successes, goals met, problems solved, and instances where you went above and beyond
        your standard objectives.
      </p>

      <Form.List name="achievements">
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
                      <h3 className="text-base font-bold text-slate-800">
                        Project: {String(idx + 1).padStart(2, "0")}
                      </h3>

                      <span className="font-semibold text-slate-700 text-sm flex items-center gap-1 mt-2">
                        <span className="text-rose-500">*</span>
                        Project Title
                      </span>
                    </div>

                    {!disabled && (
                      <Button
                        type="text"
                        danger
                        onClick={() => remove(name)}
                        icon={<Trash2 className="w-4 h-4 text-rose-500" />}
                        className="flex items-center gap-1.5 px-2 py-1 h-auto"
                      >
                        Remove
                      </Button>
                    )}
                  </div>

                  <Form.Item
                    {...restField}
                    name={[name, 'title']}
                    className="mb-4"
                  >
                    <Input
                      disabled={disabled}
                      placeholder="e.g. CRM Dashboard Migration"
                      className="rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all duration-200 h-10 px-3"
                      styles={{
                        input: {
                          color: "#000",
                        },
                      }}
                    />
                  </Form.Item>

                  <div className="mb-2">
                    <span className="font-semibold text-slate-700 text-sm flex items-center gap-1">
                      <span className="text-rose-500">*</span>
                      <span>What did you accomplish?</span>
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
                      placeholder="List accomplishments, processes optimized, or key targets you achieved..."
                      className="rounded-xl border-slate-200 hover:border-emerald-400 focus:border-emerald-500 focus:shadow-[0_0_0_2px_rgba(16,185,129,0.1)] transition-all duration-200 p-3"
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
                  Add Project
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

