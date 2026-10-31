import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, Clock, ExternalLink, Filter } from 'lucide-react';
import { useNotifications } from '../../context/NotificationContext';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import EmptyState from '../../components/common/EmptyState';
import { timeAgo, formatDateTime } from '../../utils/statusHelpers';

export const Notifications = () => {
  const { notifications, markAsRead, markAllAsRead } = useNotifications();
  const { currentUser, role } = useAuth();
  const navigate = useNavigate();

  const [filter, setFilter] = useState('all'); // all, unread

  const userNotifs = notifications.filter((n) => {
    if (!currentUser?.id && !role) return true;
    if (n.userId && (n.userId === currentUser?.id || n.userId === currentUser?.userCode)) return true;
    if (n.role && (n.role === role || n.role?.toLowerCase() === role?.toLowerCase())) return true;
    return !n.userId && !n.role;
  });

  const filteredNotifs = userNotifs.filter((n) => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  const handleNotificationClick = (n) => {
    markAsRead(n.id);
    if (n.complaintId) {
      if (role === 'Department Officer' || role === 'DEPARTMENT_OFFICER') {
        navigate(`/officer/complaints/${n.complaintId}`);
      } else if (role === 'Contractor & Crew Operations' || role === 'FIELD_WORKER') {
        navigate(`/worker/tasks/${n.complaintId}`);
      } else if (role === 'Super Admin' || role === 'SUPER_ADMIN') {
        navigate(`/admin/complaints`);
      } else {
        navigate(`/citizen/complaints/${n.complaintId}`);
      }
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <PageHeader
        title="Notifications &amp; Activity Alerts"
        description="Real-time timeline changes, department transfers, worker dispatches, and verification notices."
        tag="Alerts"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              icon={CheckCheck}
              onClick={() => markAllAsRead(currentUser?.id)}
            >
              Mark all as read
            </Button>
          </div>
        }
      />

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          All Notifications ({userNotifs.length})
        </button>
        <button
          onClick={() => setFilter('unread')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${filter === 'unread'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
        >
          Unread ({userNotifs.filter((n) => !n.read).length})
        </button>
      </div>

      {/* Notifications List */}
      <div className="space-y-3">
        {filteredNotifs.length > 0 ? (
          filteredNotifs.map((n) => (
            <div
              key={n.id}
              onClick={() => handleNotificationClick(n)}
              className={`p-4 rounded-xl border transition-all cursor-pointer ${!n.read
                  ? 'border-blue-300 dark:border-blue-900 bg-blue-50/40 dark:bg-blue-950/20 hover:border-blue-400'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50/60 dark:hover:bg-slate-800/40'
                }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${!n.read
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                  >
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                        {n.title}
                      </h4>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                      {n.message}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-400">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {timeAgo(n.timestamp)}
                      </span>
                      {n.complaintId && (
                        <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          ID: {n.complaintId}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {n.complaintId && (
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0 mt-1" />
                )}
              </div>
            </div>
          ))
        ) : (
          <EmptyState
            icon={Bell}
            title="No notifications"
            description={filter === 'unread' ? 'You have caught up with all alerts.' : 'No alerts have been recorded yet.'}
          />
        )}
      </div>
    </div>
  );
};

export default Notifications;

