import React from 'react';

interface StatusBadgeProps {
  status: string | boolean;
  trueLabel?: string;
  falseLabel?: string;
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  trueLabel = 'Active',
  falseLabel = 'Inactive',
  size = 'sm',
}) => {
  const label = typeof status === 'boolean' ? (status ? trueLabel : falseLabel) : String(status || 'Unknown');
  const normalized = label.toLowerCase();

  let tone = 'bg-slate-100 text-slate-700 ring-slate-300';
  let dot = 'bg-slate-400';

  if (
    ['active', 'approved', 'posted', 'balanced', 'valid', 'true', 'casa'].includes(normalized) ||
    normalized === 'base'
  ) {
    tone = 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
    dot = 'bg-emerald-500';
  } else if (
    ['pendingapproval', 'pending', 'pending approval', 'validated', 'partiallyinvalid', 'warning'].includes(normalized)
  ) {
    tone = 'bg-amber-50 text-amber-800 ring-amber-600/25';
    dot = 'bg-amber-500';
  } else if (
    ['rejected', 'inactive', 'frozen', 'reversed', 'unbalanced', 'invalid', 'pnd', 'pnc', 'closed'].includes(normalized)
  ) {
    tone = 'bg-rose-50 text-rose-700 ring-rose-600/20';
    dot = 'bg-rose-500';
  } else if (['gl', 'single', 'multiple', 'bulkupload', 'financeadmin', 'supervisorchecker'].includes(normalized)) {
    tone = 'bg-indigo-50 text-indigo-700 ring-indigo-600/20';
    dot = 'bg-indigo-500';
  } else if (['tellermaker', 'auditor'].includes(normalized)) {
    tone = 'bg-sky-50 text-sky-700 ring-sky-600/20';
    dot = 'bg-sky-500';
  }

  const formattedLabel = label.replace(/([a-z])([A-Z])/g, '$1 $2');
  const padding = size === 'md' ? 'px-2.5 py-1 text-xs' : 'px-2 py-0.5 text-[11px]';

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-medium ring-1 ring-inset whitespace-nowrap ${padding} ${tone}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {formattedLabel}
    </span>
  );
};
