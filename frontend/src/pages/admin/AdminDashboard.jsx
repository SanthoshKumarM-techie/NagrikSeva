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
  Activity,
  ArrowRight,
  AlertTriangle,
  XCircle,
  Eye,
  Check
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
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import StatCard from '../../components/dashboard/StatCard';
import ChartCard from '../../components/dashboard/ChartCard';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import { timeAgo, formatDate, formatDateTime } from '../../utils/statusHelpers';

import analyticsApi from '../../api/analytics.api';
import transfersApi from '../../api/transfers.api';

export const AdminDashboard = () => {
  const {
    complaints,
    departments,
    workers,
    users,
    approveTransferRequest,
    rejectTransferRequest
  } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [cityStats, setCityStats] = useState(null);
  const [backendTransfers, setBackendTransfers] = useState(null);
  const [loadingTransfers, setLoadingTransfers] = useState(false);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchTransfers = () => {
    setLoadingTransfers(true);
    transfersApi.getAllTransfers()
      .then((res) => {
        if (res) {
          setBackendTransfers(res);
        }
      })
      .catch((err) => {
        console.warn('Error fetching all transfers in AdminDashboard:', err.message);
      })
      .finally(() => {
        setLoadingTransfers(false);
      });
  };

  useEffect(() => {
    let isMounted = true;
    analyticsApi.getCityAnalytics().then((res) => {
      const data = res?.analytics || res?.data?.analytics || res?.data || res;
      if (isMounted && data) {
        setCityStats(data);
      }
    }).catch((err) => {
      console.warn('Admin city analytics fetch note:', err?.message || err);
    });

    fetchTransfers();

    return () => { isMounted = false; };
  }, []);

  // Aggregation of pending transfer requests from backend & local context
  const pendingTransfers = [];
  const seenTransferIds = new Set();

  if (backendTransfers && Array.isArray(backendTransfers)) {
    backendTransfers.forEach((tr) => {
      const decision = tr.status || tr.receiving_decision;
      if (decision === 'PENDING') {
        seenTransferIds.add(tr.id);
        pendingTransfers.push({
          id: tr.id,
          complaintDbId: tr.complaint_id,
          complaintId: tr.ticket_number || tr.complaint_id,
          title: tr.complaint_title || 'Civic Grievance',
          fromDepartmentId: tr.from_department_id,
          fromDepartmentName: tr.from_department_name || 'Origin Department',
          toDepartmentId: tr.to_department_id,
          toDepartmentName: tr.to_department_name || 'Unassigned (Supervisor to Allocate)',
          reason: tr.reason || 'Jurisdictional transfer requested by officer',
          status: 'PENDING',
          timestamp: tr.transferred_at || tr.created_at,
          transferredBy: tr.transferred_by_name || tr.initiated_by_name || 'Department Officer',
          transferNumber: tr.transfer_number || 1,
          adminNotes: tr.admin_notes
        });
      }
    });
  }

  // Also include in-memory transfers from complaint context if not already added
  complaints.forEach((c) => {
    if (c.transfers && Array.isArray(c.transfers)) {
      c.transfers.forEach((tr, idx) => {
        if (tr.status === 'PENDING' && !seenTransferIds.has(tr.id)) {
          seenTransferIds.add(tr.id);
          pendingTransfers.push({
            id: tr.id || `tr-${idx}`,
            complaintDbId: c.id,
            complaintId: c.ticketNumber || c.id,
            title: c.title,
            fromDepartmentId: tr.fromDepartmentId || c.departmentId,
            fromDepartmentName: tr.fromDepartmentName || c.department,
            toDepartmentId: tr.toDepartmentId,
            toDepartmentName: tr.toDepartmentName || 'Unassigned (Supervisor to Allocate)',
            reason: tr.reason || 'Jurisdictional transfer requested',
            status: 'PENDING',
            timestamp: tr.timestamp || c.submittedAt,
            transferredBy: tr.transferredBy || 'Department Officer',
            transferNumber: c.transfers.length,
            adminNotes: tr.adminNotes
          });
        }
      });
    } else if (c.status === COMPLAINT_STATUS.TRANSFERRED || c.status === 'TRANSFERRED') {
      const alreadyPresent = pendingTransfers.some(p => p.complaintDbId === c.id || p.complaintId === c.id);
      if (!alreadyPresent) {
        pendingTransfers.push({
          id: `tr-${c.id}`,
          complaintDbId: c.id,
          complaintId: c.ticketNumber || c.id,
          title: c.title,
          fromDepartmentId: c.departmentId,
          fromDepartmentName: c.department,
          toDepartmentId: null,
          toDepartmentName: 'Unassigned (Supervisor to Allocate)',
          reason: 'Inter-department transfer requested by officer',
          status: 'PENDING',
          timestamp: c.submittedAt || new Date().toISOString(),
          transferredBy: 'Department Officer',
          transferNumber: 1,
          adminNotes: ''
        });
      }
    }
  });

  const handleOpenReview = (record, action = 'APPROVE') => {
    setSelectedTransfer(record);
    setActionType(action);
    setTargetDeptId(record.toDepartmentId || '');
    setReviewNotes('');
    setReviewModalOpen(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedTransfer) return;
    if (actionType === 'APPROVE' && !targetDeptId) {
      alert('Please select the department to assign this complaint to.');
      return;
    }

    setIsSubmittingReview(true);
    try {
      if (actionType === 'APPROVE') {
        await approveTransferRequest(
          selectedTransfer.id,
          selectedTransfer.complaintDbId || selectedTransfer.complaintId,
          targetDeptId,
          reviewNotes,
          currentUser
        );
        alert('Transfer request approved and assigned successfully.');
      } else {
        await rejectTransferRequest(
          selectedTransfer.id,
          selectedTransfer.complaintDbId || selectedTransfer.complaintId,
          reviewNotes,
          currentUser
        );
        alert('Transfer request rejected and returned to originating department.');
      }
      setReviewModalOpen(false);
      fetchTransfers();
    } catch (err) {
      alert('Error reviewing transfer: ' + (err.message || 'Operation failed'));
    } finally {
      setIsSubmittingReview(false);
    }
  };

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
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={pendingTransfers.length > 0 ? "primary" : "secondary"}
              icon={ArrowRightLeft}
              onClick={() => navigate('/admin/transfers')}
              className={pendingTransfers.length > 0 ? "relative" : ""}
            >
              Transfer Requests ({pendingTransfers.length})
              {pendingTransfers.length > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-[10px] bg-amber-500 text-white rounded-full font-bold">
                  PENDING
                </span>
              )}
            </Button>
            <Button
              variant="secondary"
              icon={AlertOctagon}
              onClick={() => navigate('/admin/escalations')}
            >
              Escalations ({overdue.length})
            </Button>
            <Button
              variant="secondary"
              icon={Building2}
              onClick={() => navigate('/admin/departments')}
            >
              Manage Departments
            </Button>
          </div>
        }
      />

      {/* Row 1: Core Metrics Grid (Now includes Transfer Requests) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
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
          subtext="Under department review"
          icon={Clock}
          color="amber"
          onClick={() => navigate('/admin/complaints')}
        />
        <StatCard
          title="Transfer Requests"
          value={pendingTransfers.length}
          subtext={pendingTransfers.length > 0 ? "Awaiting admin reassignment" : "All transfers resolved"}
          icon={ArrowRightLeft}
          color="indigo"
          onClick={() => {
            const el = document.getElementById('transfer-requests-section');
            if (el) el.scrollIntoView({ behavior: 'smooth' });
            else navigate('/admin/transfers');
          }}
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
          subtext="Requires executive action"
          icon={AlertOctagon}
          color="red"
          onClick={() => navigate('/admin/escalations')}
        />
      </div>

      {/* High-Priority Transfer Action Banner */}
      {pendingTransfers.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-100">
                  {pendingTransfers.length} Department Transfer {pendingTransfers.length === 1 ? 'Request' : 'Requests'} Require Supervisor Action
                </span>
                <span className="px-2 py-0.5 text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-900/60 dark:text-amber-200 rounded-full">
                  Action Required
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Department officers have flagged these grievances as outside their jurisdiction and requested administrative reassignment.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              size="sm"
              variant="primary"
              onClick={() => {
                const el = document.getElementById('transfer-requests-section');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
                else navigate('/admin/transfers');
              }}
            >
              Review Requests
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => navigate('/admin/transfers')}
            >
              Full Console &rarr;
            </Button>
          </div>
        </div>
      )}

      {/* DEDICATED SECTION: Department Transfer Requests Awaiting Supervisor Reassignment */}
      <div id="transfer-requests-section" className="gov-card p-5 border-l-4 border-l-indigo-600">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Department Transfer Requests Awaiting Review
                </h3>
                {pendingTransfers.length > 0 ? (
                  <Badge variant="warning" size="sm">
                    {pendingTransfers.length} Pending
                  </Badge>
                ) : (
                  <Badge variant="success" size="sm">
                    All Clear
                  </Badge>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Grievances forwarded by department officers for municipal reassignment and jurisdictional routing.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/admin/transfers')}
            >
              Transfer Management Console &rarr;
            </Button>
          </div>
        </div>

        {pendingTransfers.length === 0 ? (
          <div className="text-center py-8 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50/50 dark:bg-slate-900/30">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2 opacity-80" />
            <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
              No Pending Department Transfers
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              All complaints are currently assigned to their proper departments. Transferred grievances will appear here for supervisor review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-900/40 text-slate-600 dark:text-slate-400 font-semibold">
                  <th className="py-2.5 px-3">Ticket ID & Title</th>
                  <th className="py-2.5 px-3">Transfer Route</th>
                  <th className="py-2.5 px-3">Officer &amp; Time</th>
                  <th className="py-2.5 px-3">Justification Reason</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {pendingTransfers.map((tr) => (
                  <tr
                    key={tr.id}
                    className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="py-3 px-3 align-top max-w-[220px]">
                      <div className="font-mono font-bold text-blue-600 dark:text-blue-400">
                        {tr.complaintId}
                      </div>
                      <div className="font-medium text-slate-900 dark:text-slate-100 line-clamp-1 mt-0.5">
                        {tr.title}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300 border border-red-200 dark:border-red-900/40">
                          {tr.fromDepartmentName}
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-900/40">
                          {tr.toDepartmentName}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top whitespace-nowrap">
                      <div className="font-medium text-slate-800 dark:text-slate-200">
                        {tr.transferredBy}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {timeAgo(tr.timestamp)}
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top">
                      <div className="bg-slate-100 dark:bg-slate-800/60 p-2 rounded text-[11px] text-slate-700 dark:text-slate-300 italic line-clamp-2 max-w-xs">
                        &ldquo;{tr.reason}&rdquo;
                      </div>
                    </td>
                    <td className="py-3 px-3 align-top text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          size="sm"
                          variant="primary"
                          onClick={() => handleOpenReview(tr, 'APPROVE')}
                        >
                          Review &amp; Reassign
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleOpenReview(tr, 'REJECT')}
                        >
                          Reject
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

      {/* Reassign / Review Modal */}
      {reviewModalOpen && selectedTransfer && (
        <Modal
          isOpen={reviewModalOpen}
          onClose={() => setReviewModalOpen(false)}
          title={actionType === 'APPROVE' ? 'Approve & Reassign Department' : 'Reject Transfer Request'}
          footer={
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                onClick={() => setReviewModalOpen(false)}
                disabled={isSubmittingReview}
              >
                Cancel
              </Button>
              <Button
                variant={actionType === 'APPROVE' ? 'primary' : 'danger'}
                onClick={handleSubmitReview}
                loading={isSubmittingReview}
              >
                {actionType === 'APPROVE' ? 'Confirm Reassignment' : 'Reject Transfer'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Complaint:</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                  {selectedTransfer.complaintId}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Issue:</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  {selectedTransfer.title}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Originating Dept:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedTransfer.fromDepartmentName}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Initiating Officer:</span>
                <span className="text-slate-800 dark:text-slate-200">
                  {selectedTransfer.transferredBy}
                </span>
              </div>
              <div className="pt-1.5 border-t border-slate-200 dark:border-slate-800">
                <span className="text-slate-500 block mb-0.5">Officer Reason:</span>
                <p className="text-slate-700 dark:text-slate-300 italic">
                  &ldquo;{selectedTransfer.reason}&rdquo;
                </p>
              </div>
            </div>

            {actionType === 'APPROVE' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Assign to Department <span className="text-red-500">*</span>
                </label>
                <Select
                  value={targetDeptId}
                  onChange={(e) => setTargetDeptId(e.target.value)}
                  options={[
                    { value: '', label: '-- Select Target Department --' },
                    ...departments
                      .filter((d) => d.id !== selectedTransfer.fromDepartmentId)
                      .map((d) => ({
                        value: d.id,
                        label: `${d.name} (${d.code})`
                      }))
                  ]}
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  The grievance will be routed to the selected department for active SLA review and field worker dispatch.
                </p>
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Supervisor Decision Notes (Optional)
              </label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder={
                  actionType === 'APPROVE'
                    ? 'Explain routing decision or instructions for receiving department...'
                    : 'Explain reason for rejecting this transfer and returning to originating department...'
                }
                rows={3}
                className="w-full text-xs p-2.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AdminDashboard;
