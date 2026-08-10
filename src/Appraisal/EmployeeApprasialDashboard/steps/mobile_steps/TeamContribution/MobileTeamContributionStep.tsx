import React, { useMemo } from 'react';
import { Card, Form, Rate } from 'antd';
import {
  Star,
  MessageCircle,
  UserCircle2,
  Users,
  Lightbulb,
  Award,
  type LucideIcon,
} from 'lucide-react';
import './MobileTeamContributionStep.css';

interface StepProps {
  disabled?: boolean;
}

const CATEGORIES = [
  'Communication',
  'Ownership',
  'Collaboration',
  'Problem Solving',
  'Leadership',
];

// Icon per category (falls back to a generic star icon if a category isn't mapped)
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Communication: MessageCircle,
  Ownership: UserCircle2,
  Collaboration: Users,
  'Problem Solving': Lightbulb,
  Leadership: Award,
};

export const MobileTeamContributionStep: React.FC<StepProps> = ({ disabled }) => {
  const form = Form.useFormInstance();
  const teamContribution = Form.useWatch('teamContribution', form) || [];

  // Calculate live average rating
  const averageRating = useMemo(() => {
    if (!Array.isArray(teamContribution) || teamContribution.length === 0) return 0;
    const validRatings = teamContribution.map((item: any) => Number(item?.rating) || 0).filter((r: number) => r > 0);
    if (validRatings.length === 0) return 0;
    return Math.round((validRatings.reduce((acc: number, curr: number) => acc + curr, 0) / validRatings.length) * 10) / 10;
  }, [teamContribution]);

  return (
    <Card
      className="mobile-tcs-card-wrapper"
      styles={{
        body: {
          padding: '10px',
          textAlign: 'left',
        },
      }}
    >
      <div className="mobile-info-width">
        <div className="mobile-tcs-header">
          <div>
            <h1 className="mobile-tcs-header__title">4. Team Contribution</h1>
            <p className="mobile-tcs-header__subtitle">
              Rate your workplace competencies for this quarter.
            </p>
          </div>

          {/* Live Average Rating Badge */}
          <div key={averageRating} className="mobile-tcs-badge-pop mobile-tcs-badge">
            <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
            <div className="mobile-tcs-badge__text">
              <span className="mobile-tcs-badge__label">Average Rating</span>
              <span className="mobile-tcs-badge__value">
                {averageRating > 0 ? averageRating.toFixed(1) : '0.0'} <span className="mobile-tcs-badge__max">/ 5.0</span>
              </span>
            </div>
          </div>
        </div>

        <div>

          <div className="mobile-tcs-section-header">
            <span className="mobile-tcs-card__required">*</span>
            <h2 className="mobile-tcs-section-title">Team Contribution Self-Rating</h2>
          </div>

          <Form.List name="teamContribution">
            {(fields) => (
              <div className="mobile-tcs-list">
                {fields.map(({ key, name, ...restField }, index) => {
                  const categoryName = form.getFieldValue(['teamContribution', name, 'category']) || CATEGORIES[index];
                  const Icon = CATEGORY_ICON_MAP[categoryName] || Star;
                  const currentRating = Number(teamContribution?.[name]?.rating) || 0;

                  return (
                    <div
                      key={key}
                      className="mobile-tcs-row mobile-tcs-row-enter"
                      style={{ ['--tcs-delay' as any]: `${index * 110}ms` }}
                    >
                      <div className="mobile-tcs-row__icon-circle">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>

                      <div className="mobile-tcs-row__body">
                        <span className="mobile-tcs-row__label">{categoryName}</span>

                        {/* Form Item for hidden category field */}
                        <Form.Item
                          {...restField}
                          name={[name, 'category']}
                          hidden
                          initialValue={categoryName}
                        />

                        {/* Star Rating Control */}
                        <Form.Item
                          {...restField}
                          name={[name, 'rating']}
                          className="mb-0"
                          rules={[{ required: true, message: 'Please select a rating' }]}
                        >
                          <Rate
                            key={currentRating}
                            disabled={disabled}
                            allowClear={false}
                            className="mobile-tcs-row__rate mobile-tcs-rate-pop"
                          />
                        </Form.Item>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Form.List>
        </div>
      </div>
    </Card>
  );
};