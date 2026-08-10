import React, { useEffect, useMemo, useState } from 'react';
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

// Icon per category (falls back to a generic star icon if a category isn't mapped)
const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Communication: MessageCircle,
  Ownership: UserCircle2,
  Collaboration: Users,
  'Problem Solving': Lightbulb,
  Leadership: Award,
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
    if (!Array.isArray(teamContribution) || teamContribution.length === 0) return 0;
    const validRatings = teamContribution.map((item: any) => Number(item?.rating) || 0).filter((r: number) => r > 0);
    if (validRatings.length === 0) return 0;
    return Math.round((validRatings.reduce((acc: number, curr: number) => acc + curr, 0) / validRatings.length) * 10) / 10;
  }, [teamContribution]);

  if (isMobile) {
    return <MobileTeamContributionStep disabled={disabled} />;
  }

  return (
    <Card
      className="shadow-md border border-slate-100 rounded-2xl p-4 bg-white/80 backdrop-blur-sm"
      styles={{
        body: {
          padding: '10px',
          textAlign: 'left',
        },
      }}
    >
      {/* Local keyframes for card entrance + badge pop */}
      <style>{`
        @keyframes tcs-fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes tcs-badgePop {
          0% { transform: scale(1); }
          30% { transform: scale(1.08); }
          100% { transform: scale(1); }
        }
        .tcs-card-enter {
          animation: tcs-fadeInUp 0.4s ease-out both;
        }
        .tcs-badge-pop {
          animation: tcs-badgePop 0.35s ease-out;
        }
        .tcs-icon-circle {
          transition: transform 0.25s ease, background-color 0.25s ease;
        }
        .tcs-card:hover .tcs-icon-circle {
          transform: scale(1.1) rotate(-4deg);
          background-color: rgb(219 234 254); /* blue-100 */
        }
      `}</style>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
        <div>
          <h1 className="text-xl font-semibold mb-1 text-slate-800">4. Team Contribution</h1>
          <p className="text-slate-500 text-sm mb-0 leading-relaxed">
            Provide a self-assessment of your core competencies and team contribution.
          </p>
        </div>

        {/* Live Average Rating Badge */}
        <div
          key={averageRating}
          className="tcs-badge-pop flex items-center gap-2 bg-amber-50 border border-amber-200/80 rounded-2xl px-4 py-2 shrink-0 self-start sm:self-center transition-colors duration-300"
        >
          <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">Average Rating</span>
            <span className="text-lg font-bold text-amber-900 leading-none">
              {averageRating > 0 ? averageRating.toFixed(1) : '0.0'} <span className="text-xs font-normal text-amber-700">/ 5.0</span>
            </span>
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-base font-bold text-slate-800 mb-4">Team Contribution Self-Rating</h2>

        <Form.List name="teamContribution">
          {(fields) => (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {fields.map(({ key, name, ...restField }, index) => {
                const categoryName = form.getFieldValue(['teamContribution', name, 'category']) || CATEGORIES[index];
                const Icon = CATEGORY_ICON_MAP[categoryName] || Star;

                return (
                  <div
                    key={key}
                    className="tcs-card tcs-card-enter flex flex-col rounded-xl bg-white border border-slate-200 border-b-[3px] border-b-blue-500 p-4 gap-3 transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
                    style={{ animationDelay: `${index * 80}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="tcs-icon-circle w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Icon className="w-5 h-5 text-blue-600" />
                      </div>
                      <span className="font-semibold text-slate-800 text-sm">
                        {categoryName}
                      </span>
                    </div>

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
                        disabled={disabled}
                        allowClear={false}
                        className="text-amber-400 text-lg"
                      />
                    </Form.Item>
                  </div>
                );
              })}
            </div>
          )}
        </Form.List>
      </div>
    </Card>
  );
};