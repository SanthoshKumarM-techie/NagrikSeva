import React from 'react';
import { getStatusBadgeVariant, getPriorityBadgeVariant } from '../../utils/statusHelpers';

export const Badge = ({
  children,
  variant = 'default',
  status = null,
  priority = null,
  size = 'md',
  showDot = true,
  className = '',
  onClick
}) => {
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
  let dotColor = 'bg-slate-400';

  if (status) {
    const s = getStatusBadgeVariant(status);
    styleClasses = `${s.bg} ${s.text} ${s.border}`;
    dotColor = s.dot;
  } else if (priority) {
    const p = getPriorityBadgeVariant(priority);
    styleClasses = `${p.bg} ${p.text} ${p.border}`;
    dotColor = p.icon ? p.icon.replace('text-', 'bg-') : 'bg-slate-400';
  } else {
    switch (variant) {
      case 'primary':
      case 'info':
        styleClasses = 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
        dotColor = 'bg-blue-500';
        break;
      case 'success':
        styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
        dotColor = 'bg-emerald-500';
        break;
      case 'warning':
        styleClasses = 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800';
        dotColor = 'bg-amber-500';
        break;
      case 'danger':
        styleClasses = 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800';
        dotColor = 'bg-rose-500';
        break;
      case 'purple':
        styleClasses = 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800';
        dotColor = 'bg-purple-500';
        break;
      default:
        break;
    }
  }

  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 font-medium rounded-full border ${sizeClass} ${styleClasses} ${className} ${
        onClick ? 'cursor-pointer hover:opacity-80' : ''
      }`}
    >
      {showDot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />}
      {children || status || priority}
    </span>
  );
};

export default Badge;

