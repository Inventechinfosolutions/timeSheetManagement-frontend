import React, { useState } from 'react';
import { Form, Input, Card, Button } from 'antd';
import { Plus } from 'lucide-react';
import AnimatedTrash from '../../../Trash/AnimatedTrash';
import './MobileLearningGoalsStep.css';

interface StepProps {
  disabled?: boolean;
}

export const MobileLearningGoalsStep: React.FC<StepProps> = ({ disabled }) => {
  const [removingIndex, setRemovingIndex] = useState<number | null>(null);
  return (
    <Card
      className="mobile-learning-goals-card"
      styles={{
        body: {
          padding: '10px',
          textAlign: 'justify',
        },
      }}
    >
      <div className="mobile-info-width">
        <h1 className="mobile-learning-goals-card__title">3. Learning & Future Goals</h1>
        <p className="mobile-learning-goals-card__subtitle">
          Share your learnings and next-quarter goals
        </p>

        <Form.List name="learningGoals">
          {(fields, { add, remove }, { errors }) => (
            <>
              <div className="mobile-learning-goals-card__list">
                {fields.map(({ key, name, ...restField }, idx) => (
                  <div key={key} className="mobile-learning-goals-item">
                    <div className="mobile-learning-goals-item__header">
                      <span className="mobile-learning-goals-item__label">
                        <span className="mobile-learning-goals-item__required">*</span>
                        What are your learning goals?
                      </span>
                      {!disabled && (
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
                          className="mobile-learning-goals-item__remove-btn"
                        />
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
                        placeholder="Describe your learning goals and career objectives...."
                        className="mobile-learning-goals-item__textarea"
                        styles={{
                          textarea: {
                            color: '#000',
                            resize: 'none',
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
                <div className="mobile-learning-goals-card__add-wrap">
                  <Button
                    type="dashed"
                    onClick={() => add()}
                    icon={<Plus className="w-4 h-4 text-blue-600" />}
                    className="mobile-learning-goals-card__add-btn"
                  >
                    Add Goal
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