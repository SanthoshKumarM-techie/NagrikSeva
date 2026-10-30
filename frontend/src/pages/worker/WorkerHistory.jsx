import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircle2, History, MapPin, Calendar, Eye, Star } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import { formatDate } from '../../utils/statusHelpers';

export const WorkerHistory = () => {
  const { complaints } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');

  // Resolved or Closed tasks completed by worker
  const completedTasks = complaints.filter(
    (c) =>
      (c.assignedWorkerId === currentUser?.id || c.assignedWorkerId === currentUser?.userCode || c.assignedWorkerId === 'WRK001') &&
      (c.status === COMPLAINT_STATUS.RESOLVED || c.status === COMPLAINT_STATUS.CLOSED)
  );

  const filtered = completedTasks.filter((t) => {
    return (
      !search ||
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.location.toLowerCase().includes(search.toLowerCase())
    );
  });

  const columns = [
    {
      header: 'Complaint ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap',
    },
    {
      header: 'Issue Remediated',
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
      header: 'Category',
      accessor: 'category',
      sortable: true,
      className: 'whitespace-nowrap',
    },
    {
      header: 'Completion Date',
      render: (row) => {
        const completedAt = row.resolutionEvidence?.completedAt || row.submittedAt;
        return <span className="text-xs whitespace-nowrap">{formatDate(completedAt)}</span>;
      },
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Remediation Notes',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1 italic">
          {row.resolutionEvidence?.completionNotes || 'Remediated & verified.'}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <Button
          size="sm"
          variant="secondary"
          icon={Eye}
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/worker/tasks/${row.id}`);
          }}
        >
          View Record
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Completed Task Archive"
        description="Historical log of civic works executed and certified by municipal officers."
        tag={`${completedTasks.length} Completed`}
      />

      <div className="gov-card p-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search completed jobs by ID, road..."
        />
      </div>

      <DataTable
        columns={columns}
        data={filtered}
        onRowClick={(row) => navigate(`/worker/tasks/${row.id}`)}
        emptyTitle="No completed jobs found"
        emptyDescription="Completed tasks will appear here after department officer verification."
      />
    </div>
  );
};

export default WorkerHistory;

