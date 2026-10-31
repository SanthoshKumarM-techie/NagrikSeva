import React from 'react';

export const ChartCard = ({
  title,
  subtitle,
  action,
  children,
  className = '',
  minHeight = '300px',
}) => {
  return (
    <div className={`gov-card p-5 flex flex-col justify-between ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            {title}
          </h3>
          {subtitle && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {action && <div>{action}</div>}
      </div>

      <div className="w-full min-w-0 flex-1 flex items-center justify-center relative" style={{ minHeight }}>
        {children}
      </div>
    </div>
  );
};

export default ChartCard;

