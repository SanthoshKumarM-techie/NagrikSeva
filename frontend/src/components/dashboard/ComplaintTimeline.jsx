import React, { useState } from 'react';
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
  Search,
  Calendar,
  X,
  RotateCcw,
  ImageIcon
} from 'lucide-react';
import Badge from '../common/Badge';
import { formatDateTime, timeAgo, formatDate } from '../../utils/statusHelpers';
import { COMPLAINT_STATUS } from '../../utils/constants';

export const ComplaintTimeline = ({ timeline = [], transfers = [], className = '' }) => {
  const [previewImage, setPreviewImage] = useState(null);

  if (!timeline || timeline.length === 0) {
    return (
      <div className="p-4 text-center text-xs text-slate-500 dark:text-slate-400">
        No activity history recorded yet.
      </div>
    );
  }

  // 1. Sort events chronologically (oldest to newest)
  const sortedEvents = [...timeline].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );

  // 2. Clean deduplication: filter out consecutive identical entries to prevent clutter
  const dedupedEvents = [];
  for (let i = 0; i < sortedEvents.length; i++) {
    const curr = sortedEvents[i];
    const prev = dedupedEvents[dedupedEvents.length - 1];
    if (
      prev &&
      prev.status === curr.status &&
      prev.title === curr.title &&
      prev.description === curr.description &&
      Math.abs(new Date(curr.timestamp) - new Date(prev.timestamp)) < 24 * 3600 * 1000
    ) {
      continue;
    }
    dedupedEvents.push(curr);
  }

  const getEventIcon = (evt) => {
    if (evt.isDelay || evt.status === 'DELAY') {
      return <Clock className="w-4 h-4 text-amber-500" />;
    }
    const isRework =
      evt.status === COMPLAINT_STATUS.DISPUTED ||
      evt.title?.toLowerCase().includes('rework') ||
      evt.description?.toLowerCase().includes('rework') ||
      evt.description?.toLowerCase().includes('rejected');
    if (isRework) {
      return <RotateCcw className="w-4 h-4 text-rose-500" />;
    }

    switch (evt.status) {
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

  return (
    <div className={`relative pl-6 space-y-4 ${className}`}>
      {/* Continuous Timeline Vertical Spine */}
      <div className="absolute left-2.5 top-2.5 bottom-2.5 w-0.5 bg-slate-200 dark:bg-slate-800" />

      {dedupedEvents.map((evt, idx) => {
        const isLatest = idx === dedupedEvents.length - 1;
        const isDelay = evt.isDelay || evt.status === 'DELAY';
        const isRework =
          evt.status === COMPLAINT_STATUS.DISPUTED ||
          evt.title?.toLowerCase().includes('rework') ||
          evt.description?.toLowerCase().includes('rework') ||
          evt.description?.toLowerCase().includes('rejected');
        const photos = evt.evidenceUrls || (evt.photos ? evt.photos : []);

        return (
          <div key={evt.id || idx} className="relative flex items-start gap-3">
            {/* Timeline Node Icon */}
            <div
              className={`absolute -left-6 mt-0.5 flex items-center justify-center w-5 h-5 rounded-full ring-4 ring-white dark:ring-slate-900 ${
                isDelay
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-600'
                  : isRework
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-600'
                  : isLatest
                  ? 'bg-blue-100 dark:bg-blue-950 text-blue-600'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {getEventIcon(evt)}
            </div>

            {/* Event Content Box */}
            <div
              className={`flex-1 p-3.5 rounded-xl border transition-all ${
                isDelay
                  ? 'border-amber-200/90 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20'
                  : isRework
                  ? 'border-rose-200/90 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
              } shadow-xs`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    {evt.title}
                  </h4>
                  {isDelay ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Work Delayed
                    </span>
                  ) : isRework ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
                      Rework Ordered
                    </span>
                  ) : (
                    evt.status && <Badge status={evt.status} size="sm" showDot={false} />
                  )}
                </div>
                <span className="text-[11px] text-slate-400 dark:text-slate-500" title={formatDateTime(evt.timestamp)}>
                  {timeAgo(evt.timestamp)}
                </span>
              </div>

              {/* Event Description */}
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-2">
                {evt.description}
              </p>

              {/* Delay Metadata & Photos if available */}
              {isDelay && (
                <div className="mt-2 pt-2 border-t border-amber-200/60 dark:border-amber-900/40 space-y-2">
                  {evt.estimatedCompletionDate && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-amber-100/70 dark:bg-amber-950/50 text-amber-900 dark:text-amber-200 border border-amber-200 dark:border-amber-800">
                      <Calendar className="w-3.5 h-3.5 text-amber-600" />
                      <span>Revised Target: {formatDate(evt.estimatedCompletionDate)}</span>
                    </div>
                  )}

                  {Array.isArray(photos) && photos.length > 0 && (
                    <div className="pt-1">
                      <span className="text-[10px] font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider block mb-1">
                        Delay Photographic Evidence:
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {photos.map((url, pIdx) => (
                          <button
                            key={pIdx}
                            type="button"
                            onClick={() => setPreviewImage(url)}
                            className="group relative w-16 h-12 rounded-lg overflow-hidden border border-amber-300 dark:border-amber-800 shadow-xs hover:ring-2 hover:ring-amber-500 transition-all cursor-pointer"
                          >
                            <img
                              src={url}
                              alt="Delay proof"
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Search className="w-3.5 h-3.5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Author & Timestamp Footer */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500 border-t border-slate-100 dark:border-slate-800/60 pt-2 mt-2">
                <span className="font-medium text-slate-600 dark:text-slate-400 truncate max-w-[200px]">
                  By {evt.author || 'System'} ({evt.role || 'Staff'})
                </span>
                <span className="shrink-0">{formatDateTime(evt.timestamp)}</span>
              </div>
            </div>
          </div>
        );
      })}

      {/* Image Preview Lightbox Modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-amber-400" />
                Work Site Delay Photo Evidence
              </span>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-2 flex items-center justify-center bg-black/40">
              <img
                src={previewImage}
                alt="Enlarged Delay Proof"
                className="max-h-[70vh] w-auto rounded-lg object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintTimeline;
