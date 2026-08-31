import React, { useMemo } from 'react';
import { Card, Form, Rate, Tooltip } from 'antd';
import {
  Star,
  MessageCircle,
  UserCircle2,
  Users,
  Lightbulb,
  Award,
  CircleHelp,
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

// Icon per category
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Communication: MessageCircle,
  Ownership: UserCircle2,
  Collaboration: Users,
  'Problem Solving': Lightbulb,
  Leadership: Award,
};

// Tooltip content for each category
const CATEGORY_TOOLTIP_MAP: Record<string, string> = {
  Communication:
    'Ability to communicate clearly and effectively with team members and stakeholders.',
  Ownership:
    'Takes responsibility for assigned tasks, commitments, and outcomes.',
  Collaboration:
    'Works effectively with team members and contributes to a positive team environment.',
  'Problem Solving':
    'Identifies problems, analyzes situations, and finds effective solutions.',
  Leadership:
    'Guides, supports, and motivates team members when leadership is required.',
};

export const MobileTeamContributionStep: React.FC<StepProps> = ({
  disabled,
}) => {
  const form = Form.useFormInstance();
  const teamContribution = Form.useWatch('teamContribution', form) || [];

  // Calculate live average rating
  const averageRating = useMemo(() => {
    if (
      !Array.isArray(teamContribution) ||
      teamContribution.length === 0
    ) {
      return 0;
    }

    const validRatings = teamContribution
      .map((item: any) => Number(item?.rating) || 0)
      .filter((rating: number) => rating > 0);

    if (validRatings.length === 0) {
      return 0;
    }

    return (
      Math.round(
        (validRatings.reduce(
          (acc: number, curr: number) => acc + curr,
          0
        ) /
          validRatings.length) *
        10
      ) / 10
    );
  }, [teamContribution]);

  return (
    <Card
      className="mobile-tcs-card-wrapper"
      styles={{
        body: {
          padding: '8px',
          textAlign: 'left',
        },
      }}
    >
      {/* Header */}
      <div className="mobile-tcs-header">
        <div>
          <h1 className="mobile-tcs-header__title">
            4. Team Contribution
          </h1>

          <p className="mobile-tcs-header__subtitle">
            Provide a self-assessment of your core competencies and team
            contribution.
          </p>
        </div>

        {/* Average Rating */}
        <div
          key={averageRating}
          className="mobile-tcs-badge-pop mobile-tcs-badge"
        >
          <Star className="mobile-tcs-badge__star" />

          <div className="mobile-tcs-badge__text">
            <span className="mobile-tcs-badge__label">
              Average Rating
            </span>

            <span className="mobile-tcs-badge__value">
              {averageRating > 0
                ? averageRating.toFixed(1)
                : '0.0'}{' '}
              <span className="mobile-tcs-badge__max">
                / 5.0
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* Section */}
      <div>
        <h2 className="mobile-tcs-section-title">
          Team Contribution Self-Rating
        </h2>

        {/* Expanded Gray Container */}
        <div className="mobile-tcs-list-container">
          <Form.List name="teamContribution">
            {(fields) => (
              <div className="mobile-tcs-list">
                {fields.map(
                  ({ key, name, ...restField }, index) => {
                    const categoryName =
                      form.getFieldValue([
                        'teamContribution',
                        name,
                        'category',
                      ]) || CATEGORIES[index];

                    const Icon =
                      CATEGORY_ICON_MAP[categoryName] || Star;

                    const tooltipText =
                      CATEGORY_TOOLTIP_MAP[categoryName] ||
                      'Rate your contribution in this area.';

                    return (
                      <div
                        key={key}
                        className="mobile-tcs-row mobile-tcs-row-enter"
                        style={{
                          ['--tcs-delay' as any]: `${index * 80}ms`,
                        }}
                      >
                        {/* Left side */}
                        <div className="mobile-tcs-row__left">
                          {/* Category Icon */}
                          <div className="mobile-tcs-row__icon-circle">
                            <Icon className="mobile-tcs-row__icon" />
                          </div>

                          {/* Category Name + Tooltip */}
                          <div className="mobile-tcs-row__category">
                            <span className="mobile-tcs-row__label">
                              {categoryName}
                            </span>

                            <Tooltip
                              title={tooltipText}
                              placement="top"
                            >
                              <CircleHelp
                                className="mobile-tcs-tooltip-icon"
                                strokeWidth={2}
                              />
                            </Tooltip>
                          </div>
                        </div>

                        {/* Hidden category field */}
                        <Form.Item
                          {...restField}
                          name={[name, 'category']}
                          hidden
                          initialValue={categoryName}
                        />

                        {/* Star Rating */}
                        <Form.Item
                          {...restField}
                          name={[name, 'rating']}
                          className="mobile-tcs-rating-form-item"
                          rules={[
                            {
                              required: true,
                              message: 'Please select a rating',
                            },
                          ]}
                        >
                          <Rate
                            disabled={disabled}
                            allowClear={false}
                            className="mobile-tcs-row__rate"
                          />
                        </Form.Item>
                      </div>
                    );
                  }
                )}
              </div>
            )}
          </Form.List>
        </div>
      </div>
    </Card>
  );
};