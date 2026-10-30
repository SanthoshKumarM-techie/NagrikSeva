import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  Clock,
  Wrench,
  CheckCircle2,
  AlertOctagon,
  Building2,
  Users,
  Shield,
  ArrowRightLeft,
  TrendingUp,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';
import { useComplaints } from '../../context/ComplaintContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { timeAgo, formatDate } from '../../utils/statusHelpers';

import analyticsApi from '../../api/analytics.api';

export const AdminDashboard = () => {
  const { complaints, departments, workers, users } = useComplaints();
  const navigate = useNavigate();

  const [cityStats, setCityStats] = useState(null);

  useEffect(() => {
    let isMounted = true;
    analyticsApi.getCityAnalytics().then((res) => {
      if (isMounted && res?.data) {
        setCityStats(res.data);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const totalComplaintsCount = cityStats?.summary?.total_complaints !== undefined
    ? cityStats.summary.total_complaints
    : complaints.length;

  const resolvedCount = cityStats?.summary?.resolved_complaints !== undefined
    ? cityStats.summary.resolved_complaints
    : complaints.filter((c) => c.status === COMPLAINT_STATUS.RESOLVED || c.status === COMPLAINT_STATUS.CLOSED).length;

  const activeCount = cityStats?.summary?.active_complaints !== undefined
    ? cityStats.summary.active_complaints
    : complaints.filter((c) => c.status !== COMPLAINT_STATUS.RESOLVED && c.status !== COMPLAINT_STATUS.CLOSED).length;

  const escalatedCount = cityStats?.summary?.escalated_complaints !== undefined
    ? cityStats.summary.escalated_complaints
    : complaints.filter((c) => c.isEscalated || (new Date(c.slaDeadline) < new Date() && c.status !== COMPLAINT_STATUS.RESOLVED && c.status !== COMPLAINT_STATUS.CLOSED)).length;

  const pending = complaints.filter(
    (c) => c.status === COMPLAINT_STATUS.SUBMITTED || c.status === COMPLAINT_STATUS.DEPARTMENT_REVIEW || c.status === COMPLAINT_STATUS.ACKNOWLEDGED
  );
  const inProgress = complaints.filter(
    (c) => c.status === COMPLAINT_STATUS.WORK_IN_PROGRESS || c.status === COMPLAINT_STATUS.INSPECTION || c.status === COMPLAINT_STATUS.WORKER_ASSIGNED || c.status === COMPLAINT_STATUS.VERIFICATION
  );
  const resolved = complaints.filter(
    (c) => c.status === COMPLAINT_STATUS.RESOLVED || c.status === COMPLAINT_STATUS.CLOSED
  );
  const overdue = complaints.filter(
    (c) => c.isEscalated || (new Date(c.slaDeadline) < new Date() && c.status !== COMPLAINT_STATUS.RESOLVED && c.status !== COMPLAINT_STATUS.CLOSED)
  );

  const officersCount = users.filter((u) => u.role === 'Department Officer').length;
  const workersCount = workers.length;

  // Trend data
  const trendData = [
    { day: 'Mon', intake: 14, resolved: 11 },
    { day: 'Tue', intake: 18, resolved: 15 },
    { day: 'Wed', intake: 12, resolved: 16 },
    { day: 'Thu', intake: 22, resolved: 19 },
    { day: 'Fri', intake: 19, resolved: 18 },
    { day: 'Sat', intake: 11, resolved: 13 },
    { day: 'Sun', intake: 8, resolved: 10 },
  ];

  // Department comparative workload
  const deptData = departments.map((d) => {
    const active = complaints.filter((c) => c.departmentId === d.id && c.status !== COMPLAINT_STATUS.RESOLVED && c.status !== COMPLAINT_STATUS.CLOSED).length;
    return {
      code: d.code,
      name: d.name,
      activeComplaints: active,
      slaTarget: d.slaTargetPct || 90,
    };
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Central Command"
        description="Municipal-wide grievance oversight, department SLA auditing, escalations monitor, and user management."
        tag="Central Administration"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={AlertOctagon}
              onClick={() => navigate('/admin/escalations')}
            >
              Escalations ({overdue.length})
            </Button>
            <Button
              variant="primary"
              icon={Building2}
              onClick={() => navigate('/admin/departments')}
            >
              Manage Departments
            </Button>
          </div>
        }
      />

      {/* Row 1: Complaint Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Complaints"
          value={totalComplaintsCount}
          subtext="Lifetime municipal tickets"
          icon={FileText}
          color="blue"
          onClick={() => navigate('/admin/complaints')}
        />
        <StatCard
          title="Pending Review"
          value={pending.length}
          subtext="Under department processing"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/admin/complaints')}
        />
        <StatCard
          title="Active Remediation"
          value={activeCount}
          subtext="Crews dispatched on-site"
          icon={Wrench}
          color="purple"
          onClick={() => navigate('/admin/complaints')}
        />
        <StatCard
          title="Resolved"
          value={resolvedCount}
          subtext="Closed with verification"
          icon={CheckCircle2}
          color="green"
          onClick={() => navigate('/admin/complaints')}
        />
        <StatCard
          title="Overdue / Escalated"
          value={escalatedCount}
          subtext="Requires executive intervention"
          icon={AlertOctagon}
          color="red"
          onClick={() => navigate('/admin/escalations')}
        />
      </div>

      {/* Row 2: Municipal Infrastructure Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="gov-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Active Municipal Departments</span>
              <strong className="text-xl font-bold">{departments.length} Units</strong>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/admin/departments')}>
            View
          </Button>
        </div>

        <div className="gov-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Department Officers</span>
              <strong className="text-xl font-bold">{officersCount} Executive Staff</strong>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/admin/users')}>
            Manage
          </Button>
        </div>

        <div className="gov-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-slate-500 block">Deployed Field Specialists</span>
              <strong className="text-xl font-bold">{workersCount} Crew Leads</strong>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => navigate('/admin/users')}>
            Manage
          </Button>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trend Area Chart */}
        <ChartCard
          title="Weekly Grievance Velocity"
          subtitle="Incoming citizen complaints vs closed resolutions"
          minHeight="280px"
        >
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="day" tick={{ fontSize: 11 }} />
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
              <Legend />
              <Line type="monotone" dataKey="intake" name="New Complaints" stroke="#3B82F6" strokeWidth={2.5} dot={{ r: 4 }} />
              <Line type="monotone" dataKey="resolved" name="Resolved" stroke="#10B981" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Department Active Workload Bar Chart */}
        <ChartCard
          title="Department Workload &amp; Intake"
          subtitle="Currently active grievances by department"
          minHeight="280px"
        >
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={deptData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis dataKey="code" tick={{ fontSize: 11 }} />
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
              <Bar dataKey="activeComplaints" name="Active Complaints" fill="#2563EB" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Activity Ledger */}
      <div className="gov-card p-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              City-Wide Live Grievance Feed
            </h3>
            <p className="text-xs text-slate-500">
              Cross-departmental submissions, transfers, and escalations
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/admin/complaints')}
          >
            All records &rarr;
          </Button>
        </div>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {complaints.slice(0, 5).map((c) => (
            <div
              key={c.id}
              onClick={() => navigate('/admin/complaints')}
              className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 -mx-2 px-2 rounded-lg cursor-pointer transition-colors"
            >
              <div className="flex items-start gap-3">
                <span className="font-mono text-xs font-bold text-blue-600 shrink-0 mt-0.5">
                  {c.id}
                </span>
                <div>
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
                    {c.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                    <span>{c.department}</span>
                    <span>&bull;</span>
                    <span>{c.location}</span>
                    <span>&bull;</span>
                    <span>{timeAgo(c.submittedAt)}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge priority={c.priority} size="sm" />
                <Badge status={c.status} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;

