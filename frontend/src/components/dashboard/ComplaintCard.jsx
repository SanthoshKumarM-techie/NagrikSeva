import React from 'react';
import { MapPin, Users, Calendar, ArrowRight, Image as ImageIcon } from 'lucide-react';
import Badge from '../common/Badge';
import { formatDate } from '../../utils/statusHelpers';

export const ComplaintCard = ({
  complaint,
  onClick,
  showSupporters = true,
  className = '',
}) => {
  const {
    id,
    title,
    category,
    location,
    status,
    priority,
    submittedAt,
    supporterCount = 0,
    evidence = [],
  } = complaint;

  const thumbnail = evidence && evidence.length > 0 ? evidence[0] : null;

  return (
    <div
      onClick={() => onClick && onClick(complaint)}
      className={`gov-card overflow-hidden flex flex-col justify-between cursor-pointer group hover:border-blue-400 dark:hover:border-blue-600 transition-all ${className}`}
    >
      <div>
        {/* Optional Thumbnail Banner */}
        {thumbnail && (
          <div className="relative h-40 w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            <img
              src={thumbnail}
              alt={title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-black/70 text-white backdrop-blur-sm">
                {id}
              </span>
            </div>
            {evidence.length > 1 && (
              <div className="absolute bottom-2 right-2 flex items-center gap-1 text-[10px] font-semibold bg-black/60 text-white px-1.5 py-0.5 rounded backdrop-blur-sm">
                <ImageIcon className="w-3 h-3" />
                +{evidence.length - 1}
              </div>
            )}
          </div>
        )}

        {/* Content */}
        <div className="p-4 sm:p-5">
          {!thumbnail && (
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">
                {id}
              </span>
              <span className="text-[11px] text-slate-500 font-medium">
                {category}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2 mb-2.5 flex-wrap">
            <Badge status={status} size="sm" />
            <Badge priority={priority} size="sm" />
          </div>

          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
            {title}
          </h3>

          <div className="mt-3 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="px-4 py-3 bg-slate-50/60 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {formatDate(submittedAt)}
          </span>
          {showSupporters && (
            <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
              <Users className="w-3.5 h-3.5 text-blue-500" />
              {supporterCount} supporters
            </span>
          )}
        </div>
        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 group-hover:text-blue-600 transition-all" />
      </div>
    </div>
  );
};

export default ComplaintCard;

