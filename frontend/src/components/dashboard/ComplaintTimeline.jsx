import React from 'react';
import {
  CheckCircle2,
  Clock,
  ArrowRightLeft,
  UserCheck,
  Wrench,
  AlertTriangle,
  FileCheck2,
  MessageSquare,
  ShieldCheck,
  XCircle,
  Search
} from 'lucide-react';
import Badge from '../common/Badge';
import { formatDateTime, timeAgo } from '../../utils/statusHelpers';
import { COMPLAINT_STATUS } from '../../utils/constants';

export const ComplaintTimeline = ({ timeline = [], transfers = [], className = '' }) => {
  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500">
        No timeline activity recorded yet.
      </div>
    );
  }

  const getEventIcon = (status) => {
    switch (status) {
      case COMPLAINT_STATUS.SUBMITTED:
        return <Clock className="w-4 h-4 text-blue-500" />;
      case COMPLAINT_STATUS.ACKNOWLEDGED:
        return <CheckCircle2 className="w-4 h-4 text-cyan-500" />;
      case COMPLAINT_STATUS.TRANSFERRED:
        return <ArrowRightLeft className="w-4 h-4 text-purple-500" />;
      case COMPLAINT_STATUS.WORKER_ASSIGNED:
        return <UserCheck className="w-4 h-4 text-indigo-500" />;
      case COMPLAINT_STATUS.INSPECTION:
        return <Search className="w-4 h-4 text-amber-500" />;
      case COMPLAINT_STATUS.WORK_IN_PROGRESS:
        return <Wrench className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />;
      case COMPLAINT_STATUS.VERIFICATION:
        return <FileCheck2 className="w-4 h-4 text-orange-500" />;
      case COMPLAINT_STATUS.RESOLVED:
      case COMPLAINT_STATUS.CLOSED:
        return <ShieldCheck className="w-4 h-4 text-emerald-500" />;
      case COMPLAINT_STATUS.DISPUTED:
        return <AlertTriangle className="w-4 h-4 text-rose-500" />;
      case COMPLAINT_STATUS.REJECTED:
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <MessageSquare className="w-4 h-4 text-slate-400" />;
    }
  };

  // Sort events chronologically (oldest to newest for natural workflow progression)
  const sortedEvents = [...timeline].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  return (
    <div className={`relative pl-6 space-y-6 ${className}`}>
      {/* Vertical connection track */}
      <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-slate-200 dark:bg-slate-800" />

      {sortedEvents.map((evt, idx) => {
        const isLatest = idx === sortedEvents.length - 1;

        return (
          <div key={evt.id || idx} className="relative flex items-start gap-4">
            {/* Timeline Node Icon */}
            <div
              className={`absolute -left-6 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                isLatest ? 'bg-blue-100 dark:bg-blue-950 text-blue-600' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {getEventIcon(evt.status)}
            </div>

            {/* Event Box */}
            <div className="flex-1 p-3.5 rounded-lg border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {evt.title}
                  </h4>
                  {evt.status && <Badge status={evt.status} size="sm" showDot={false} />}
                </div>
                <span className="text-[11px] text-slate-400" title={formatDateTime(evt.timestamp)}>
                  {timeAgo(evt.timestamp)}
                </span>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                {evt.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-2">
                <span className="font-medium text-slate-500 dark:text-slate-400">
                  By {evt.author || 'System'} ({evt.role || 'Staff'})
                </span>
                <span>{formatDateTime(evt.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ComplaintTimeline;

