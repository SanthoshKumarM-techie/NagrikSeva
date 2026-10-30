import React from 'react';
import { ArrowRight, Clock } from 'lucide-react';
import { timeAgo } from '../../utils/statusHelpers';
import Badge from '../common/Badge';

export const ActivityFeed = ({ items = [], onItemClick, title = 'Recent Activity', className = '' }) => {
  return (
    <div className={`gov-card p-5 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
          {title}
        </h3>
        <span className="text-xs text-slate-400">Live feed</span>
      </div>

      <div className="divide-y divide-slate-100 dark:divide-slate-800">
        {items.length === 0 ? (
          <div className="py-6 text-center text-xs text-slate-400">
            No recent activity to display.
          </div>
        ) : (
          items.map((item, idx) => (
            <div
              key={item.id || idx}
              onClick={() => onItemClick && onItemClick(item)}
              className={`py-3 flex items-start justify-between gap-3 ${
                onItemClick ? 'cursor-pointer hover:bg-slate-50/60 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-lg transition-colors' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-semibold text-xs shrink-0">
                  {item.author ? item.author.charAt(0) : 'S'}
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {item.title}
                    </span>
                    {item.status && <Badge status={item.status} size="sm" showDot={false} />}
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                    <span>{item.author || 'Citizen'}</span>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(item.timestamp)}
                    </span>
                  </div>
                </div>
              </div>

              {onItemClick && (
                <ArrowRight className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ActivityFeed;

