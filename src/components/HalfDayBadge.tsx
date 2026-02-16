import React from 'react';

interface HalfDayBadgeProps {
  firstHalf: string | null | undefined;
  secondHalf: string | null | undefined;
  className?: string;
}

export const HalfDayBadge: React.FC<HalfDayBadgeProps> = ({ 
  firstHalf, 
  secondHalf, 
  className = '' 
}) => {
  const normalize = (val: string | null | undefined): string | null => {
    if (!val) return null;
    const lower = val.toLowerCase();
    if (lower.includes('wfh') || lower.includes('work from home')) return 'WFH';
    if (lower.includes('client') || lower.includes('visit')) return 'CV';
    if (lower.includes('leave')) return 'Leave';
    if (lower.includes('office')) return 'Office';
    return val;
  };

  const h1 = normalize(firstHalf);
  const h2 = normalize(secondHalf);

  // If both are the same, show once without division
  if (h1 === h2 && h1) {
    return <span className={className}>{h1}</span>;
  }

  // If both are null or empty, show nothing
  if (!h1 && !h2) {
    return <span className={className}>—</span>;
  }

  // Horizontal division for different values
  return (
    <span className={`inline-flex items-center gap-1 ${className}`}>
      <span>{h1 || '—'}</span>
      <span className="text-gray-400">|</span>
      <span>{h2 || '—'}</span>
    </span>
  );
};
