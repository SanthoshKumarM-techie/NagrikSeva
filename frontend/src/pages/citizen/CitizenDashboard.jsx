import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  PlusCircle,
  Compass,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend
} from 'recharts';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import ComplaintCard from '../../components/dashboard/ComplaintCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { timeAgo } from '../../utils/statusHelpers';

import complaintsApi from '../../api/complaints.api';

export const CitizenDashboard = () => {
  const { complaints } = useComplaints();
  const { currentUser } = useAuth();
  const { notifications } = useNotifications();
  const navigate = useNavigate();

  const [liveStats, setLiveStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    complaintsApi.getCitizenStats().then(stats => {
      if (isMounted && stats) setLiveStats(stats);
    }).catch(() => {});
    return () => { isMounted = false; };
  }, [currentUser]);

  // Citizen's complaints
  const myComplaints = complaints.filter(
    (c) => c.citizenId === currentUser?.id || c.citizenId === currentUser?.userCode || c.submitted_by === currentUser?.id || (c.supporters && (c.supporters.includes(currentUser?.id) || c.supporters.includes(currentUser?.userCode)))
  );

  const pendingComplaints = myComplaints.filter(
    (c) => c.status === COMPLAINT_STATUS.SUBMITTED || c.status === COMPLAINT_STATUS.DEPARTMENT_REVIEW || c.status === COMPLAINT_STATUS.ACKNOWLEDGED
  );
  const inProgressComplaints = myComplaints.filter(
    (c) => c.status === COMPLAINT_STATUS.WORK_IN_PROGRESS || c.status === COMPLAINT_STATUS.INSPECTION || c.status === COMPLAINT_STATUS.WORKER_ASSIGNED || c.status === COMPLAINT_STATUS.VERIFICATION
  );
  const resolvedComplaints = myComplaints.filter(
    (c) => c.status === COMPLAINT_STATUS.RESOLVED || c.status === COMPLAINT_STATUS.CLOSED
  );

  const statTotal = liveStats?.totalComplaints !== undefined ? liveStats.totalComplaints : myComplaints.length;
  const statPending = liveStats?.pendingCount !== undefined ? liveStats.pendingCount : pendingComplaints.length;
  const statInProgress = liveStats?.inProgressCount !== undefined ? liveStats.inProgressCount : inProgressComplaints.length;
  const statResolved = liveStats?.resolvedCount !== undefined ? liveStats.resolvedCount : resolvedComplaints.length;

  // Status distribution for Chart
  const statusCounts = {
    [COMPLAINT_STATUS.SUBMITTED]: 0,
    [COMPLAINT_STATUS.WORK_IN_PROGRESS]: 0,
    [COMPLAINT_STATUS.VERIFICATION]: 0,
    [COMPLAINT_STATUS.RESOLVED]: 0,
    [COMPLAINT_STATUS.DISPUTED]: 0,
  };

  myComplaints.forEach((c) => {
    if (c.status === COMPLAINT_STATUS.CLOSED || c.status === COMPLAINT_STATUS.RESOLVED) {
      statusCounts[COMPLAINT_STATUS.RESOLVED] = (statusCounts[COMPLAINT_STATUS.RESOLVED] || 0) + 1;
    } else if (c.status === COMPLAINT_STATUS.WORK_IN_PROGRESS || c.status === COMPLAINT_STATUS.WORKER_ASSIGNED || c.status === COMPLAINT_STATUS.INSPECTION) {
      statusCounts[COMPLAINT_STATUS.WORK_IN_PROGRESS] = (statusCounts[COMPLAINT_STATUS.WORK_IN_PROGRESS] || 0) + 1;
    } else if (c.status === COMPLAINT_STATUS.DISPUTED) {
      statusCounts[COMPLAINT_STATUS.DISPUTED] = (statusCounts[COMPLAINT_STATUS.DISPUTED] || 0) + 1;
    } else {
      statusCounts[COMPLAINT_STATUS.SUBMITTED] = (statusCounts[COMPLAINT_STATUS.SUBMITTED] || 0) + 1;
    }
  });

  const chartData = [
    { name: 'Pending / Review', value: statusCounts[COMPLAINT_STATUS.SUBMITTED], color: '#3B82F6' },
    { name: 'In Progress', value: statusCounts[COMPLAINT_STATUS.WORK_IN_PROGRESS], color: '#F59E0B' },
    { name: 'Resolved / Closed', value: statusCounts[COMPLAINT_STATUS.RESOLVED], color: '#10B981' },
    { name: 'Disputed', value: statusCounts[COMPLAINT_STATUS.DISPUTED], color: '#EF4444' },
  ].filter(d => d.value > 0);

  const citizenNotifs = notifications
    .filter(n => n.userId === currentUser?.id || n.role === 'Citizen')
    .slice(0, 4);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${currentUser?.name || 'Citizen'}`}
        description="Track your reported civic complaints, monitor resolution milestones, and report new issues."
        tag="Citizen Portal"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={Compass}
              onClick={() => navigate('/citizen/explore')}
            >
              Explore Nearby
            </Button>
            <Button
              variant="primary"
              icon={PlusCircle}
              onClick={() => navigate('/citizen/create')}
            >
              Register Grievance
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Reported"
          value={statTotal}
          subtext="Your submitted & endorsed issues"
          icon={FileText}
          color="blue"
          onClick={() => navigate('/citizen/my-complaints')}
        />
        <StatCard
          title="Awaiting Review"
          value={statPending}
          subtext="Under department processing"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/citizen/my-complaints')}
        />
        <StatCard
          title="Active Remediation"
          value={statInProgress}
          subtext="Workers actively on ground"
          icon={Wrench}
          color="purple"
          onClick={() => navigate('/citizen/my-complaints')}
        />
        <StatCard
          title="Resolved Cases"
          value={statResolved}
          subtext="Restored and confirmed"
          icon={CheckCircle2}
          color="green"
          onClick={() => navigate('/citizen/my-complaints')}
        />
      </div>

      {/* Chart & Notification Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="My Grievance Status Overview"
            subtitle="Current progression across all reported issues"
            minHeight="280px"
          >
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={65}
                    outerRadius={95}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#334155',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px'
                    }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="text-center text-xs text-slate-400 py-8">
                No complaint data to chart yet. Register your first grievance.
              </div>
            )}
          </ChartCard>
        </div>

        {/* Recent Notifications */}
        <div className="gov-card p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Status Alerts
              </h3>
              <button
                onClick={() => navigate('/citizen/notifications')}
                className="text-xs text-blue-600 dark:text-blue-400 hover:underline font-medium"
              >
                View all
              </button>
            </div>

            <div className="space-y-3">
              {citizenNotifs.length > 0 ? (
                citizenNotifs.map((n) => (
                  <div
                    key={n.id}
                    onClick={() => n.complaintId && navigate(`/citizen/complaints/${n.complaintId}`)}
                    className="p-3 rounded-lg border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1">
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {timeAgo(n.timestamp)}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                      {n.message}
                    </p>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-slate-400">
                  No alerts right now.
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              icon={PlusCircle}
              onClick={() => navigate('/citizen/create')}
              className="w-full"
            >
              Report New Issue
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Complaints Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Recent Complaints
            </h2>
            <p className="text-xs text-slate-500">
              Issues submitted by you and neighborhood civic reports
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate('/citizen/my-complaints')}
          >
            View all my complaints
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {myComplaints.length > 0 ? (
            myComplaints.slice(0, 3).map((complaint) => (
              <ComplaintCard
                key={complaint.id}
                complaint={complaint}
                onClick={(c) => navigate(`/citizen/complaints/${c.id}`)}
              />
            ))
          ) : (
            <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-200 dark:border-slate-800">
              <FileText className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">No grievances submitted yet</p>
              <p className="text-xs text-slate-400 mt-1 mb-4">Spot a civic issue in your ward? Report it directly to municipal officers.</p>
              <Button size="sm" icon={PlusCircle} onClick={() => navigate('/citizen/create')}>Report Grievance</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CitizenDashboard;

