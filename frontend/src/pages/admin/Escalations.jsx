import React, { useState, useEffect } from 'react';
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
  Filter
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
import { INITIAL_WORKERS } from '../../data/mockWorkers';

export const Escalations = () => {
  const { complaints, workers, assignWorker } = useComplaints();
  const navigate = useNavigate();

  const [backendEscalations, setBackendEscalations] = useState(null);
  const [levelFilter, setLevelFilter] = useState('');
  const [selectedEscalation, setSelectedEscalation] = useState(null);
  const [interventionModalOpen, setInterventionModalOpen] = useState(false);
  const [interventionWorkerId, setInterventionWorkerId] = useState('');
  const [interventionNotes, setInterventionNotes] = useState('');

  useEffect(() => {
    let isMounted = true;
    escalationsApi.listEscalations().then((res) => {
      if (isMounted && res) {
        setBackendEscalations(res);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  // Collect complaints that have active escalation or disputed status
  const escalatedComplaints = backendEscalations && backendEscalations.length > 0
    ? backendEscalations.map(e => ({
        id: e.complaint_id || e.id,
        ticketNumber: e.ticket_number || `BLR-${e.id?.slice(0, 8)}`,
        title: e.complaint_title || 'Civic Issue Under Escalation',
        location: e.street_location || 'Ward Location',
        department: e.department_name || 'Municipal Department',
        escalationLevel: e.level === 'LEVEL_3' ? 3 : e.level === 'LEVEL_2' ? 2 : 1,
        escalationTitle: e.level === 'LEVEL_3' ? 'Municipal Administrator' : e.level === 'LEVEL_2' ? 'Department Supervisor' : 'Department Officer',
        overdueHours: 24,
        escalatedAt: e.created_at || new Date().toISOString(),
        responsibleOfficer: e.assigned_to_name || 'Designated Zonal Lead',
        priority: e.priority || 'HIGH',
        status: e.status || 'Escalated'
      }))
    : complaints
        .filter((c) => c.isEscalated || c.status === 'Disputed' || c.status === 'DISPUTED')
        .map((c) => {
          return {
            ...c,
            escalationLevel: c.escalationLevel || 2,
            escalationTitle: c.escalationLevel === 3 ? 'Municipal Administrator' : 'Department Supervisor',
            overdueHours: 32,
            escalatedAt: c.submittedAt,
            responsibleOfficer: c.assignedWorkerName || 'Designated Zonal Lead',
          };
        });

  const filtered = escalatedComplaints.filter((item) => {
    if (!levelFilter) return true;
    return String(item.escalationLevel) === String(levelFilter);
  });

  const handleInterventionSubmit = () => {
    if (!selectedEscalation || !interventionWorkerId) {
      alert('Please select an emergency crew.');
      return;
    }
    assignWorker(
      selectedEscalation.id,
      interventionWorkerId,
      `ADMINISTRATIVE EMERGENCY DISPATCH: ${interventionNotes}`,
      { name: 'Municipal Administrator', role: 'Super Admin' }
    );
    setInterventionModalOpen(false);
  };

  const columns = [
    {
      header: 'Complaint ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-rose-600 dark:text-rose-400 whitespace-nowrap',
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
            onClick={() => {
              setSelectedEscalation(row);
              setInterventionWorkerId(workers[0]?.id || '');
              setInterventionNotes('');
              setInterventionModalOpen(true);
            }}
          >
            Intervene
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal SLA Escalation Command"
        description="Monitor grievances exceeding statutory turnaround times or contested by citizen disputes."
        tag={`${escalatedComplaints.length} Escalated Cases`}
      />

      {/* Tier Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div
          onClick={() => setLevelFilter(levelFilter === '1' ? '' : '1')}
          className={`gov-card p-4 cursor-pointer transition-all border-l-4 border-l-amber-500 ${
            levelFilter === '1' ? 'ring-2 ring-amber-500' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase">
              Level 1 Escalation
            </span>
            <span className="text-xl font-bold">
              {escalatedComplaints.filter((c) => c.escalationLevel === 1).length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Department Officer Direct Review</span>
        </div>

        <div
          onClick={() => setLevelFilter(levelFilter === '2' ? '' : '2')}
          className={`gov-card p-4 cursor-pointer transition-all border-l-4 border-l-orange-500 ${
            levelFilter === '2' ? 'ring-2 ring-orange-500' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-orange-700 dark:text-orange-400 uppercase">
              Level 2 Escalation
            </span>
            <span className="text-xl font-bold">
              {escalatedComplaints.filter((c) => c.escalationLevel === 2).length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Department Supervisor Intervention</span>
        </div>

        <div
          onClick={() => setLevelFilter(levelFilter === '3' ? '' : '3')}
          className={`gov-card p-4 cursor-pointer transition-all border-l-4 border-l-rose-500 ${
            levelFilter === '3' ? 'ring-2 ring-rose-500' : ''
          }`}
        >
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-rose-700 dark:text-rose-400 uppercase">
              Level 3 Critical
            </span>
            <span className="text-xl font-bold text-rose-600">
              {escalatedComplaints.filter((c) => c.escalationLevel === 3).length}
            </span>
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">Municipal Administrator Mandate</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No escalated complaints"
        emptyDescription="All civic complaints are currently progressing within acceptable statutory SLA deadlines."
      />

      {/* Admin Executive Intervention Modal */}
      <Modal
        isOpen={interventionModalOpen}
        onClose={() => setInterventionModalOpen(false)}
        title={`Executive Intervention: ${selectedEscalation?.id}`}
        description="Override department queues to deploy dedicated emergency contractors or reassign task force."
        footer={
          <>
            <Button variant="secondary" onClick={() => setInterventionModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" icon={AlertOctagon} onClick={handleInterventionSubmit}>
              Dispatch Emergency Order
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
            <strong>Critical Alert:</strong> Complaint has exceeded SLA thresholds by +{selectedEscalation?.overdueHours} hours.
          </div>

          <Select
            label="Reassign Dedicated Specialist"
            value={interventionWorkerId}
            onChange={(e) => setInterventionWorkerId(e.target.value)}
            options={workers.map((w) => ({
              value: w.id,
              label: `${w.name} (${w.department}) &mdash; Rating: ${w.rating}`,
            }))}
            required
          />

          <Input
            label="Executive Directive &amp; Remediation Instructions"
            type="textarea"
            rows={3}
            placeholder="Issue direct mandate to resolve within 12 hours with photographic proof..."
            value={interventionNotes}
            onChange={(e) => setInterventionNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Escalations;

