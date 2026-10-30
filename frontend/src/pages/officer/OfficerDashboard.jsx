import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  AlertOctagon,
  ArrowRightLeft,
  Users,
  TrendingUp,
  Building2,
  ArrowRight,
  FileCheck2
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatDate, timeAgo } from '../../utils/statusHelpers';
import complaintsApi from '../../api/complaints.api';
import transfersApi from '../../api/transfers.api';

export const OfficerDashboard = () => {
  const { complaints, workers, departments } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [deptStats, setDeptStats] = useState(null);
  const [pendingTransfersCount, setPendingTransfersCount] = useState(0);

  useEffect(() => {
    let isMounted = true;
    complaintsApi.getDepartmentStats().then(stats => {
      if (isMounted && stats) setDeptStats(stats);
    }).catch(() => {});

    transfersApi.getIncomingTransfers({ status: 'PENDING' }).then(transfers => {
      if (isMounted && transfers) setPendingTransfersCount(transfers.length);
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [currentUser]);

  // Filter complaints for officer's department
  const officerDeptId = currentUser?.departmentId;
  const officerDept = currentUser?.department || 'Roads & Infrastructure';
  const deptComplaints = complaints.filter(
    (c) => !officerDeptId || c.departmentId === officerDeptId || c.department === officerDept || (c.department && c.department.toLowerCase().includes('road'))
  );

  const newSubmitted = deptComplaints.filter(
    (c) => c.status === COMPLAINT_STATUS.SUBMITTED || c.status === COMPLAINT_STATUS.TRANSFERRED
  );
  const awaitingReview = deptComplaints.filter(
    (c) => c.status === COMPLAINT_STATUS.DEPARTMENT_REVIEW || c.status === COMPLAINT_STATUS.ACKNOWLEDGED
  );
  const inProgress = deptComplaints.filter(
    (c) => c.status === COMPLAINT_STATUS.WORK_IN_PROGRESS || c.status === COMPLAINT_STATUS.WORKER_ASSIGNED || c.status === COMPLAINT_STATUS.INSPECTION
  );
  const pendingVerification = deptComplaints.filter(
    (c) => c.status === COMPLAINT_STATUS.VERIFICATION || c.status === 'VERIFICATION' || c.current_status === 'VERIFICATION'
  );
  const resolved = deptComplaints.filter(
    (c) => c.status === COMPLAINT_STATUS.RESOLVED || c.status === COMPLAINT_STATUS.CLOSED
  );
  const overdueEscalated = deptComplaints.filter(
    (c) => c.escalation !== null || c.status === COMPLAINT_STATUS.DISPUTED
  );

  // Status breakdown for Bar Chart
  const barChartData = [
    { name: 'New/Transferred', count: newSubmitted.length, fill: '#3B82F6' },
    { name: 'Acknowledged', count: awaitingReview.length, fill: '#06B6D4' },
    { name: 'In Field Work', count: inProgress.length, fill: '#F59E0B' },
    { name: 'Verification Pending', count: pendingVerification.length, fill: '#8B5CF6' },
    { name: 'Resolved', count: resolved.length, fill: '#10B981' },
    { name: 'Overdue/Disputed', count: overdueEscalated.length, fill: '#EF4444' },
  ];

  // Actionable complaints prioritized with Verification on top
  const actionRequiredComplaints = [...deptComplaints]
    .sort((a, b) => {
      const isVerifA = a.status === COMPLAINT_STATUS.VERIFICATION || a.status === 'VERIFICATION' || a.current_status === 'VERIFICATION';
      const isVerifB = b.status === COMPLAINT_STATUS.VERIFICATION || b.status === 'VERIFICATION' || b.current_status === 'VERIFICATION';
      if (isVerifA && !isVerifB) return -1;
      if (!isVerifA && isVerifB) return 1;
      return new Date(b.submittedAt) - new Date(a.submittedAt);
    })
    .slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Officer Console &mdash; ${officerDept}`}
        description="Monitor department intake, assign field crews, review remediations, and execute inter-departmental transfers."
        tag="Department Officer"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={ArrowRightLeft}
              onClick={() => navigate('/officer/transfers')}
            >
              Transfers
            </Button>
            <Button
              variant="primary"
              icon={Users}
              onClick={() => navigate('/officer/assignments')}
            >
              Assign Field Crew
            </Button>
          </div>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard
          title="Total Dept Tickets"
          value={deptComplaints.length}
          subtext="Assigned to your wing"
          icon={Building2}
          color="blue"
          onClick={() => navigate('/officer/complaints')}
        />
        <StatCard
          title="New / Incoming"
          value={newSubmitted.length}
          subtext="Requires immediate triage"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/officer/complaints?status=Submitted')}
        />
        <StatCard
          title="Active Field Tasks"
          value={inProgress.length}
          subtext="Crew deployed on ground"
          icon={Wrench}
          color="orange"
          onClick={() => navigate('/officer/assignments')}
        />
        <StatCard
          title="Pending Verification"
          value={pendingVerification.length}
          subtext="Completed work orders"
          icon={FileCheck2}
          color="purple"
          onClick={() => navigate('/officer/complaints?status=Verification')}
        />
        <StatCard
          title="Resolved"
          value={resolved.length}
          subtext="Completed & verified"
          icon={CheckCircle2}
          color="green"
          onClick={() => navigate('/officer/complaints?status=Resolved')}
        />
        <StatCard
          title="Overdue / Disputed"
          value={overdueEscalated.length}
          subtext="Escalation risk"
          icon={AlertOctagon}
          color="red"
          onClick={() => navigate('/officer/complaints')}
        />
      </div>

      {/* Chart & SLA Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bar Chart */}
        <div className="lg:col-span-2">
          <ChartCard
            title="Department Grievance Pipeline"
            subtitle="Current operational queue by processing lifecycle"
            minHeight="280px"
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderColor: '#334155',
                    borderRadius: '8px',
                    color: '#F8FAFC',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {barChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>
        </div>

        {/* SLA Performance Card */}
        <div className="gov-card p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
              SLA Compliance Summary
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Citizen service timeline benchmarks
            </p>

            <div className="space-y-4 text-xs">
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Acknowledgement (&lt; 6 hrs)</span>
                  <span className="font-bold text-emerald-600">96%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full rounded-full" style={{ width: '96%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Crew Assignment (&lt; 12 hrs)</span>
                  <span className="font-bold text-blue-600">88%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full rounded-full" style={{ width: '88%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-slate-600 dark:text-slate-400">Resolution SLA (&lt; 72 hrs)</span>
                  <span className="font-bold text-amber-600">82%</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full" style={{ width: '82%' }} />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4">
            <Button
              variant="outline"
              size="sm"
              icon={TrendingUp}
              onClick={() => navigate('/officer/analytics')}
              className="w-full"
            >
              View Detailed Analytics
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Department Complaints Queue */}
      <div className="gov-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Action Required Queue
            </h3>
            <p className="text-xs text-slate-500">
              Grievances requiring acknowledgement, crew assignment, or verification
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            icon={ArrowRight}
            iconPosition="right"
            onClick={() => navigate('/officer/complaints')}
          >
            View all department tickets
          </Button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {actionRequiredComplaints.map((item) => {
            const isVerif = item.status === COMPLAINT_STATUS.VERIFICATION || item.status === 'VERIFICATION' || item.current_status === 'VERIFICATION';
            return (
              <div
                key={item.id}
                onClick={() => navigate(`/officer/complaints/${item.id}`)}
                className={`py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 -mx-2 px-3 rounded-lg cursor-pointer transition-colors ${isVerif ? 'bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/60' : 'hover:bg-slate-50/60 dark:hover:bg-slate-800/40'}`}
              >
                <div className="flex items-start gap-3">
                  <span className="font-mono text-xs font-bold text-blue-600 shrink-0 mt-0.5">
                    {item.ticketNumber || item.id}
                  </span>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1 flex items-center gap-2">
                      {item.title}
                      {isVerif && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-600 text-white tracking-wide">
                          NEEDS VERIFICATION
                        </span>
                      )}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500 flex-wrap">
                      <span>{item.location}</span>
                      <span>&bull;</span>
                      <span>Submitted by {item.citizenName} ({timeAgo(item.submittedAt)})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 sm:self-center">
                  <Badge priority={item.priority} size="sm" />
                  <Badge status={item.status} size="sm" />
                  <Button
                    size="sm"
                    variant={isVerif ? "success" : "secondary"}
                    icon={isVerif ? FileCheck2 : undefined}
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/officer/complaints/${item.id}`);
                    }}
                  >
                    {isVerif ? "Verify Work" : "Review"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default OfficerDashboard;

