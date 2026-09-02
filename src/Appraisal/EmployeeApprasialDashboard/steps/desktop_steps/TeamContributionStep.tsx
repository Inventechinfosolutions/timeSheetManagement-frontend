import React, { useEffect, useMemo, useState } from 'react';
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
import { MobileTeamContributionStep } from '../mobile_steps/TeamContribution/MobileTeamContributionStep';

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

export const DEFAULT_TEAM_CONTRIBUTION = CATEGORIES.map((cat) => ({
  category: cat,
  rating: 0,
}));

const MOBILE_BREAKPOINT_QUERY = '(max-width: 1023px)';

export const TeamContributionStep: React.FC<StepProps> = ({ disabled }) => {
  const form = Form.useFormInstance();
  const teamContribution = Form.useWatch('teamContribution', form) || [];
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(MOBILE_BREAKPOINT_QUERY);

    const updateMatch = () => setIsMobile(mql.matches);

    updateMatch();
    mql.addEventListener('change', updateMatch);

    return () => mql.removeEventListener('change', updateMatch);
  }, []);

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

  if (isMobile) {
    return <MobileTeamContributionStep disabled={disabled} />;
  }

  return (
    <Card
      className="shadow-md border border-slate-100 rounded-2xl p-3 bg-white/80 backdrop-blur-sm"
      styles={{
        body: {
          padding: '8px',
          textAlign: 'left',
        },
      }}
    >
      {/* Local animations */}
      <style>{`
        @keyframes tcs-fadeInUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes tcs-badgePop {
          0% {
            transform: scale(1);
          }

          30% {
            transform: scale(1.08);
          }

          100% {
            transform: scale(1);
          }
        }

        .tcs-card-enter {
          animation: tcs-fadeInUp 0.4s ease-out both;
        }

        .tcs-badge-pop {
          animation: tcs-badgePop 0.35s ease-out;
        }

        .tcs-icon {
          transition:
            color 0.25s ease,
            transform 0.25s ease;
        }

        .tcs-card:hover .tcs-icon {
          transform: scale(1.08);
          color: rgb(37 99 235);
        }

        .tcs-tooltip-icon {
          transition:
            color 0.2s ease,
            transform 0.2s ease;
        }

        .tcs-tooltip-icon:hover {
          transform: scale(1.1);
        }

        /* Keep Ant Design rating perfectly centered */
        .tcs-card .ant-form-item {
          margin-bottom: 0 !important;
          display: flex !important;
          align-items: center !important;
        }

        .tcs-card .ant-form-item-control {
          display: flex !important;
          align-items: center !important;
        }

        .tcs-card .ant-form-item-control-input {
          min-height: auto !important;
          display: flex !important;
          align-items: center !important;
        }

        .tcs-card .ant-form-item-control-input-content {
          display: flex !important;
          align-items: center !important;
        }

        .tcs-card .ant-rate {
          display: flex !important;
          align-items: center !important;
          line-height: 1 !important;
          height: 20px !important;
        }

        .tcs-card .ant-rate-star {
          display: flex !important;
          align-items: center !important;
          margin-inline-end: 4px !important;
          line-height: 1 !important;
        }

        .tcs-card .ant-rate-star-first,
        .tcs-card .ant-rate-star-second {
          display: flex !important;
          align-items: center !important;
        }
      `}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
        <div>
          <h1 className="text-base font-semibold mb-1 text-slate-800">
            4. Team Contribution
          </h1>

          {!disabled && (
            <p className="text-slate-500 text-sm mb-0 leading-relaxed">
              Provide a self-assessment of your core competencies and team
              contribution.
            </p>
          )}
        </div>

        {/* Average Rating */}
        <div
          key={averageRating}
          className="rounded-md tcs-badge-pop flex items-center gap-2 bg-amber-50 border border-amber-200/80 px-3 py-1.5 shrink-0 self-start sm:self-center transition-colors duration-300"
        >
          <Star className="w-4 h-4 text-amber-500 fill-amber-500" />

          <div className="flex flex-col">
            <span className="text-[9px] font-bold text-amber-700 uppercase tracking-wider">
              Average Rating
            </span>

            <span className="text-base font-bold text-amber-900 leading-none">
              {averageRating > 0 ? averageRating.toFixed(1) : '0.0'}{' '}
              <span className="text-[11px] font-normal text-amber-700">
                / 5.0
              </span>
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-sm font-bold text-slate-800 mb-3">
          Team Contribution Self-Rating
        </h2>

        <div className="border border-slate-100 rounded-2xl py-3 px-2 bg-slate-50/50 relative">
          <Form.List name="teamContribution">
            {(fields) => (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {fields.map(({ key, name, ...restField }, index) => {
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
                      className="tcs-card tcs-card-enter flex items-center justify-between rounded-xl bg-white border border-slate-200 px-3 py-2.5 transition-all duration-300 hover:shadow-md hover:border-slate-300"
                      style={{
                        animationDelay: `${index * 80}ms`,
                      }}
                    >
                      {/* Left side: Icon + Category Name + Tooltip */}
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        {/* Category Icon - no background */}
                        <Icon className="tcs-icon w-4 h-4 text-blue-600 shrink-0" />

                        {/* Category Name + Tooltip */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="font-semibold text-slate-700 text-sm truncate leading-none">
                            {categoryName}
                          </span>

                          <Tooltip
                            title={tooltipText}
                            placement="top"
                          >
                            <CircleHelp
                              className="tcs-tooltip-icon w-3.5 h-3.5 text-slate-400 hover:text-blue-500 cursor-help shrink-0"
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
                        className="ml-3 shrink-0"
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
                          className="text-yellow-400 text-base"
                        />
                      </Form.Item>
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