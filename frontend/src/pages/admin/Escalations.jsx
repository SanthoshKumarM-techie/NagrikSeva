import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  AlertTriangle,
  Clock,
  Shield,
  Eye,
  CheckCircle2,
  Building2,
  ArrowRight,
  Filter,
  RefreshCw,
  UserCheck,
  CheckCircle,
  FileCheck2
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import { formatDate, formatDateTime } from '../../utils/statusHelpers';

import escalationsApi from '../../api/escalations.api';
import usersApi from '../../api/users.api';

export const Escalations = () => {
  const { complaints, workers, assignWorker } = useComplaints();
  const navigate = useNavigate();

  const [backendEscalations, setBackendEscalations] = useState(null);
  const [liveWorkers, setLiveWorkers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewTab, setViewTab] = useState('ACTIVE'); // 'ACTIVE' | 'RESOLVED'
  const [levelFilter, setLevelFilter] = useState('');
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [interventionWorkerId, setInterventionWorkerId] = useState('');
  const [interventionNotes, setInterventionNotes] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchError, setDispatchError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const loadEscalations = useCallback(async () => {
    try {
      const res = await escalationsApi.listEscalations();
      if (res) {
        setBackendEscalations(res);
      }
    } catch (err) {
      console.warn('Failed to fetch backend escalations:', err?.message || err);
    }
  }, []);

  const loadWorkers = useCallback(async () => {
    try {
      const wList = await usersApi.getDepartmentWorkers();
      if (wList && Array.isArray(wList) && wList.length > 0) {
        setLiveWorkers(wList);
      }
    } catch (err) {
      console.warn('Failed to fetch live workers for escalations:', err?.message || err);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEscalations(), loadWorkers()]).finally(() => {
      setLoading(false);
    });
  }, [loadEscalations, loadWorkers]);

  // Combined available workers list prioritizing live DB records
  const availableWorkers = liveWorkers.length > 0
    ? liveWorkers.map(w => ({
        id: w.id,
        name: w.full_name || w.name,
        department: w.department_name || w.department || 'Municipal Maintenance',
        departmentId: w.department_id,
        rating: w.rating || 4.8
      }))
    : workers;

  // Active complaints that have open escalation
  const activeEscalatedComplaints = backendEscalations && backendEscalations.length > 0
    ? backendEscalations
        .filter(e => e.status !== 'RESOLVED' && e.status !== 'CLOSED')
        .map(e => ({
          id: e.complaint_id || e.id,
          complaintId: e.complaint_id || e.id,
          escalationId: e.id,
          ticketNumber: e.ticket_number || `BLR-${(e.complaint_id || e.id)?.slice(0, 8)}`,
          title: e.complaint_title || 'Civic Issue Under Escalation',
          location: e.complaint_address || e.street_location || 'Ward Location',
          department: e.department_name || 'Municipal Department',
          departmentId: e.department_id,
          escalationLevel: e.level === 'LEVEL_3' ? 3 : e.level === 'LEVEL_2' ? 2 : 1,
          escalationTitle: e.level === 'LEVEL_3' ? 'Municipal Administrator' : e.level === 'LEVEL_2' ? 'Department Supervisor' : 'Department Officer',
          overdueHours: 24,
          escalatedAt: e.created_at || new Date().toISOString(),
          responsibleOfficer: e.assigned_to_name || 'Designated Zonal Lead',
          priority: e.complaint_priority || e.priority || 'HIGH',
          status: e.status || 'Escalated'
        }))
    : complaints
        .filter((c) => (c.isEscalated || c.status === 'Disputed' || c.status === 'DISPUTED') && c.status !== 'RESOLVED' && c.status !== 'Closed')
        .map((c) => ({
          ...c,
          id: c.id,
          complaintId: c.id,
          escalationId: c.escalationId || null,
          escalationLevel: c.escalationLevel || 2,
          escalationTitle: c.escalationLevel === 3 ? 'Municipal Administrator' : 'Department Supervisor',
          overdueHours: 32,
          escalatedAt: c.submittedAt,
          responsibleOfficer: c.assignedWorkerName || 'Designated Zonal Lead',
        }));

  // Dispatched & resolved escalations archive
  const resolvedEscalations = backendEscalations && backendEscalations.length > 0
    ? backendEscalations
        .filter(e => e.status === 'RESOLVED' || e.status === 'CLOSED')
        .map(e => ({
          id: e.complaint_id || e.id,
          complaintId: e.complaint_id || e.id,
          escalationId: e.id,
          ticketNumber: e.ticket_number || `BLR-${(e.complaint_id || e.id)?.slice(0, 8)}`,
          title: e.complaint_title || 'Civic Grievance Under Remediation',
          location: e.complaint_address || e.street_location || 'Ward Location',
          department: e.department_name || 'Municipal Department',
          escalationLevel: e.level === 'LEVEL_3' ? 3 : e.level === 'LEVEL_2' ? 2 : 1,
          resolvedAt: e.resolved_at || e.updated_at || new Date().toISOString(),
          resolutionNotes: e.resolution_notes || 'Executive intervention mandate issued by Administrator. Dedicated emergency specialist deployed.',
          resolvedBy: e.resolved_by_name || 'Super Admin',
          status: 'RESOLVED'
        }))
    : [];

  const filteredActive = activeEscalatedComplaints.filter((item) => {
    if (!levelFilter) return true;
    return String(item.escalationLevel) === String(levelFilter);
  });

  const handleOpenIntervene = (row) => {
    setSelectedEscalation(row);
    const sameDeptWorker = availableWorkers.find(w => w.departmentId && row.departmentId && w.departmentId === row.departmentId);
    const defaultWorker = sameDeptWorker || availableWorkers[0];
    setInterventionWorkerId(defaultWorker?.id || '');
    setInterventionNotes('');
    setDispatchError('');
    setInterventionModalOpen(true);
  };

  const handleInterventionSubmit = async () => {
    if (!selectedEscalation) return;
    if (!interventionWorkerId) {
      alert('Please select an emergency crew.');
      return;
    }

    setIsDispatching(true);
    setDispatchError('');

    try {
      const complaintId = selectedEscalation.complaintId || selectedEscalation.id;
      const notes = interventionNotes?.trim() || 'ADMINISTRATIVE DIRECTIVE: Immediate site remediation dispatched by Super Admin.';

      // 1. Dispatch worker assignment via Context & Backend API
      await assignWorker(
        complaintId,
        interventionWorkerId,
        `ADMINISTRATIVE EMERGENCY DISPATCH: ${notes}`,
        { name: 'Municipal Administrator', role: 'SUPER_ADMIN' },
        selectedEscalation.ticketNumber || complaintId
      );

      // 2. Resolve escalation record on backend if escalationId is available
      const escId = selectedEscalation.escalationId;
      if (escId) {
        try {
          await escalationsApi.resolveEscalation(escId, `Emergency crew dispatched by Super Admin. Directive: ${notes}`);
        } catch (escErr) {
          console.warn('Backend resolve escalation note:', escErr);
        }
      }

      // 3. Immediately mark as resolved in local state
      setBackendEscalations(prev => (prev || []).map(e => {
        if (e.id === escId || e.complaint_id === complaintId) {
          return {
            ...e,
            status: 'RESOLVED',
            resolved_at: new Date().toISOString(),
            resolution_notes: `ADMINISTRATIVE DIRECTIVE: ${notes}`
          };
        }
        return e;
      }));

      // 4. Refresh escalations list from server
      await loadEscalations();

      // 5. Close modal and show feedback
      setInterventionModalOpen(false);
      setSuccessToast(`Emergency mandate dispatched successfully for ticket ${selectedEscalation.ticketNumber || complaintId}. Case moved to Resolved Mandates.`);
      setTimeout(() => setSuccessToast(''), 7000);
    } catch (err) {
      console.error('Intervention dispatch failed:', err);
      setDispatchError(err?.message || 'Failed to dispatch emergency order. Please try again.');
    } finally {
      setIsDispatching(false);
    }
  };

  const activeColumns = [
    {
      header: 'Complaint ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-rose-600 dark:text-rose-400">
            {row.ticketNumber || row.id?.slice(0, 8)}
          </span>
          <span className="block text-[10px] text-slate-400 font-normal font-mono truncate max-w-[120px]">
            {row.id}
          </span>
        </div>
      )
    },
    {
      header: 'Grievance & Location',
      accessor: 'title',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {row.title}
          </span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{row.location}</span>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true,
      className: 'whitespace-nowrap',
    },
    {
      header: 'Escalation Level',
      accessor: 'escalationLevel',
      sortable: true,
      render: (row) => {
        let badgeColor = 'bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-300';
        if (row.escalationLevel === 2) badgeColor = 'bg-orange-100 text-orange-900 dark:bg-orange-950 dark:text-orange-300';
        if (row.escalationLevel === 3) badgeColor = 'bg-rose-100 text-rose-900 dark:bg-rose-950 dark:text-rose-300 animate-pulse';

        return (
          <span className={`px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 ${badgeColor}`}>
            <AlertOctagon className="w-3.5 h-3.5" />
            Level {row.escalationLevel} &bull; {row.escalationTitle}
          </span>
        );
      },
    },
    {
      header: 'Overdue By',
      accessor: 'overdueHours',
      sortable: true,
      render: (row) => (
        <span className="text-xs font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap">
          +{row.overdueHours} hrs past SLA
        </span>
      ),
    },
    {
      header: 'Responsible Officer',
      accessor: 'responsibleOfficer',
      className: 'text-xs whitespace-nowrap',
    },
    {
      header: 'Action',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="danger"
            icon={AlertOctagon}
            onClick={() => handleOpenIntervene(row)}
          >
            Intervene
          </Button>
        </div>
      ),
    },
  ];

  const resolvedColumns = [
    {
      header: 'Complaint ID',
      accessor: 'ticketNumber',
      sortable: true,
      className: 'font-mono font-bold text-emerald-600 dark:text-emerald-400 whitespace-nowrap',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {row.ticketNumber || row.id?.slice(0, 8)}
          </span>
          <span className="block text-[10px] text-slate-400 font-normal font-mono truncate max-w-[120px]">
            {row.id}
          </span>
        </div>
      )
    },
    {
      header: 'Grievance & Location',
      accessor: 'title',
      sortable: true,
      render: (row) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
            {row.title}
          </span>
          <span className="text-[11px] text-slate-500 line-clamp-1">{row.location}</span>
        </div>
      ),
    },
    {
      header: 'Department',
      accessor: 'department',
      sortable: true,
      className: 'whitespace-nowrap',
    },
    {
      header: 'Status',
      accessor: 'status',
      render: () => (
        <span className="px-2.5 py-1 rounded-full text-xs font-bold inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 dark:bg-emerald-950 dark:text-emerald-300">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          Mandate Dispatched
        </span>
      )
    },
    {
      header: 'Executive Directive',
      accessor: 'resolutionNotes',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 max-w-[280px]">
          {row.resolutionNotes}
        </span>
      )
    },
    {
      header: 'Dispatched Date',
      accessor: 'resolvedAt',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {formatDateTime(row.resolvedAt)}
        </span>
      )
    },
    {
      header: 'Audit',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          icon={Eye}
          onClick={() => navigate('/admin/complaints')}
        >
          View Ticket
        </Button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal SLA Escalation Command"
        description="Monitor grievances exceeding statutory turnaround times or contested by citizen disputes."
        tag={`${activeEscalatedComplaints.length} Escalated Cases`}
        action={
          <Button
            variant="outline"
            size="sm"
            icon={RefreshCw}
            onClick={() => {
              setLoading(true);
              Promise.all([loadEscalations(), loadWorkers()]).finally(() => setLoading(false));
            }}
            disabled={loading}
          >
            Refresh
          </Button>
        }
      />

      {/* Success Notification Toast */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-200 flex items-center justify-between gap-3 animate-fade-in shadow-sm">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span className="font-semibold">{successToast}</span>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setViewTab('RESOLVED')}
            className="border-emerald-400 text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100"
          >
            View in Resolved Archive &rarr;
          </Button>
        </div>
      )}

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => {
            setViewTab('ACTIVE');
            setLevelFilter(levelFilter === '1' ? '' : '1');
          }}
          className={`gov-card p-4 cursor-pointer transition-all border-l-4 border-l-amber-500 ${
            viewTab === 'ACTIVE' && levelFilter === '1' ? 'ring-2 ring-amber-500' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">
              Level 1 Escalation
            </span>
            <span className="text-xl font-bold">
              {activeEscalatedComplaints.filter((c) => c.escalationLevel === 1).length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Department Officer Direct Review</span>
        </div>

        <div
          onClick={() => {
            setViewTab('ACTIVE');
            setLevelFilter(levelFilter === '2' ? '' : '2');
          }}
          className={`gov-card p-4 cursor-pointer transition-all border-l-4 border-l-orange-500 ${
            viewTab === 'ACTIVE' && levelFilter === '2' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase">
              Level 2 Escalation
            </span>
            <span className="text-xl font-bold">
              {activeEscalatedComplaints.filter((c) => c.escalationLevel === 2).length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Department Supervisor Intervention</span>
        </div>

        <div
          onClick={() => {
            setViewTab('ACTIVE');
            setLevelFilter(levelFilter === '3' ? '' : '3');
          }}
          className={`gov-card p-4 cursor-pointer transition-all border-l-4 border-l-rose-500 ${
            viewTab === 'ACTIVE' && levelFilter === '3' ? 'ring-2 ring-rose-500' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">
              Level 3 Critical
            </span>
            <span className="text-xl font-bold text-rose-600">
              {activeEscalatedComplaints.filter((c) => c.escalationLevel === 3).length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Municipal Administrator Mandate</span>
        </div>
      </div>

      {/* View Mode Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setViewTab('ACTIVE')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            viewTab === 'ACTIVE'
              ? 'bg-rose-500 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <AlertOctagon className="w-3.5 h-3.5" />
          Active Critical Escalations ({activeEscalatedComplaints.length})
        </button>

        <button
          onClick={() => setViewTab('RESOLVED')}
          className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors flex items-center gap-2 ${
            viewTab === 'RESOLVED'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
          }`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          Resolved Mandates Archive ({resolvedEscalations.length})
        </button>
      </div>

      {/* Table view based on tab */}
      {viewTab === 'ACTIVE' ? (
        <DataTable
          columns={activeColumns}
          data={filteredActive}
          emptyTitle="No active escalated complaints"
          emptyDescription="All civic complaints are currently progressing within acceptable statutory SLA deadlines."
        />
      ) : (
        <DataTable
          columns={resolvedColumns}
          data={resolvedEscalations}
          emptyTitle="No resolved mandates yet"
          emptyDescription="Resolved executive orders and emergency interventions will appear in this audit archive."
        />
      )}

      {/* Admin Executive Intervention Modal */}
      <Modal
        isOpen={interventionModalOpen}
        onClose={() => !isDispatching && setInterventionModalOpen(false)}
        title={`Executive Intervention: ${selectedEscalation?.ticketNumber || selectedEscalation?.id}`}
        description="Override department queues to deploy dedicated emergency contractors or reassign task force."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setInterventionModalOpen(false)}
              disabled={isDispatching}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={AlertOctagon}
              onClick={handleInterventionSubmit}
              disabled={isDispatching}
            >
              {isDispatching ? 'Dispatching Emergency Order...' : 'Dispatch Emergency Order'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {dispatchError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{dispatchError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
            <strong>Critical Alert:</strong> Complaint has exceeded SLA thresholds by +{selectedEscalation?.overdueHours} hours.
          </div>

          <Select
            label="Reassign Dedicated Specialist"
            value={interventionWorkerId}
            onChange={(e) => setInterventionWorkerId(e.target.value)}
            options={availableWorkers.map((w) => ({
              value: w.id,
              label: `${w.name} (${w.department}) — Rating: ${w.rating}`,
            }))}
            disabled={isDispatching}
            required
          />

          <Input
            label="Executive Directive & Remediation Instructions"
            type="textarea"
            rows={3}
            placeholder="Issue direct mandate to resolve within 12 hours with photographic proof..."
            value={interventionNotes}
            onChange={(e) => setInterventionNotes(e.target.value)}
            disabled={isDispatching}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Escalations;
