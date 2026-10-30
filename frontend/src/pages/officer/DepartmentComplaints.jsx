import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { FileText, Eye, ArrowRightLeft, Users, Filter, CheckCircle2, Clock, FileCheck2, Wrench } from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS, PRIORITIES, CATEGORIES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Pagination from '../../components/common/Pagination';
import { formatDate, timeAgo } from '../../utils/statusHelpers';

export const DepartmentComplaints = () => {
  const { complaints, departments } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const officerDept = currentUser?.department || 'Roads & Infrastructure';

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(() => searchParams.get('status') || '');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const departmentOptions = useMemo(() => {
    const list = departments && departments.length > 0
      ? departments.map(d => d.name)
      : ['Road Infrastructure & Maintenance', 'Water Supply & Sewerage Board', 'Solid Waste Management', 'Street Lighting & Electrical'];
    return ['All Departments', ...list];
  }, [departments]);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => {
      const matchDept =
        !deptFilter ||
        deptFilter === 'All Departments' ||
        c.department === deptFilter ||
        (c.department && c.department.toLowerCase().includes(deptFilter.toLowerCase())) ||
        (deptFilter.toLowerCase().includes('road') && c.department && c.department.toLowerCase().includes('road'));

      const matchSearch =
        !search ||
        (c.id && c.id.toLowerCase().includes(search.toLowerCase())) ||
        (c.ticketNumber && c.ticketNumber.toLowerCase().includes(search.toLowerCase())) ||
        (c.title && c.title.toLowerCase().includes(search.toLowerCase())) ||
        (c.location && c.location.toLowerCase().includes(search.toLowerCase())) ||
        (c.citizenName && c.citizenName.toLowerCase().includes(search.toLowerCase()));

      const matchStatus =
        !statusFilter ||
        c.status === statusFilter ||
        (statusFilter === COMPLAINT_STATUS.VERIFICATION && (c.status === 'VERIFICATION' || c.status === 'Verification' || c.current_status === 'VERIFICATION')) ||
        (statusFilter === 'Verification' && (c.status === 'VERIFICATION' || c.status === COMPLAINT_STATUS.VERIFICATION || c.current_status === 'VERIFICATION')) ||
        (statusFilter === 'Submitted' && (c.status === 'SUBMITTED' || c.status === COMPLAINT_STATUS.SUBMITTED));

      const matchPriority = !priorityFilter || c.priority === priorityFilter;

      return matchDept && matchSearch && matchStatus && matchPriority;
    });
  }, [complaints, deptFilter, search, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filteredComplaints.length / pageSize) || 1;
  const paginatedData = filteredComplaints.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: 'Complaint ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap',
    },
    {
      header: 'Grievance Title & Location',
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
      header: 'Priority',
      accessor: 'priority',
      sortable: true,
      render: (row) => <Badge priority={row.priority} size="sm" />,
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => <Badge status={row.status} size="sm" />,
    },
    {
      header: 'Submitted',
      accessor: 'submittedAt',
      sortable: true,
      render: (row) => (
        <span className="text-xs whitespace-nowrap" title={row.submittedAt}>
          {formatDate(row.submittedAt)}
        </span>
      ),
    },
    {
      header: 'SLA Deadline',
      accessor: 'slaDeadline',
      sortable: true,
      render: (row) => {
        const isOverdue = new Date(row.slaDeadline) < new Date();
        return (
          <span className={`text-xs whitespace-nowrap font-medium ${isOverdue ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-slate-600 dark:text-slate-400'}`}>
            {formatDate(row.slaDeadline)} {isOverdue && '(!)'}
          </span>
        );
      },
    },
    {
      header: 'Assigned Worker',
      accessor: 'assignedWorkerName',
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300">
          {row.assignedWorkerName || <span className="text-slate-400 italic">Unassigned</span>}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="secondary"
            icon={Eye}
            onClick={() => navigate(`/officer/complaints/${row.id}`)}
          >
            Review
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Department Grievances Ledger"
        description={`Manage active civic complaints assigned to ${officerDept}.`}
        tag={`${filteredComplaints.length} Records`}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={ArrowRightLeft}
              onClick={() => navigate('/officer/transfers')}
            >
              Transfers Desk
            </Button>
            <Button
              variant="primary"
              icon={Users}
              onClick={() => navigate('/officer/assignments')}
            >
              Worker Allocations
            </Button>
          </div>
        }
      />

      {/* Quick Status Tabs */}
      <div className="flex items-center gap-2 flex-wrap text-xs">
        <button
          type="button"
          onClick={() => { setStatusFilter(''); setCurrentPage(1); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${!statusFilter ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          All Complaints ({complaints.length})
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter(COMPLAINT_STATUS.VERIFICATION); setCurrentPage(1); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors flex items-center gap-1.5 ${statusFilter === COMPLAINT_STATUS.VERIFICATION ? 'bg-purple-600 text-white' : 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border border-purple-200 dark:border-purple-800 hover:bg-purple-100'}`}
        >
          <FileCheck2 className="w-3.5 h-3.5" />
          Awaiting Verification ({complaints.filter(c => c.status === COMPLAINT_STATUS.VERIFICATION || c.status === 'VERIFICATION' || c.current_status === 'VERIFICATION').length})
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter(COMPLAINT_STATUS.SUBMITTED); setCurrentPage(1); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === COMPLAINT_STATUS.SUBMITTED ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          New Intake ({complaints.filter(c => c.status === COMPLAINT_STATUS.SUBMITTED || c.status === 'SUBMITTED').length})
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter(COMPLAINT_STATUS.WORK_IN_PROGRESS); setCurrentPage(1); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === COMPLAINT_STATUS.WORK_IN_PROGRESS ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          In Field Work ({complaints.filter(c => c.status === COMPLAINT_STATUS.WORK_IN_PROGRESS || c.status === COMPLAINT_STATUS.WORKER_ASSIGNED || c.status === 'WORK_IN_PROGRESS').length})
        </button>
        <button
          type="button"
          onClick={() => { setStatusFilter(COMPLAINT_STATUS.RESOLVED); setCurrentPage(1); }}
          className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${statusFilter === COMPLAINT_STATUS.RESOLVED ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200'}`}
        >
          Resolved ({complaints.filter(c => c.status === COMPLAINT_STATUS.RESOLVED || c.status === COMPLAINT_STATUS.CLOSED).length})
        </button>
      </div>

      {/* Filter Toolbar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search ID, title, citizen, road..."
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={Object.values(COMPLAINT_STATUS)}
            placeholder="All Statuses"
          />

          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={Object.values(PRIORITIES)}
            placeholder="All Priorities"
          />

          <Select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={departmentOptions}
            placeholder="All Departments"
          />
        </div>
      </div>

      {/* Table & Pagination */}
      <div className="space-y-2">
        <DataTable
          columns={columns}
          data={paginatedData}
          onRowClick={(row) => navigate(`/officer/complaints/${row.id}`)}
          emptyTitle="No complaints found"
          emptyDescription="There are no grievances matching your current departmental filter criteria."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filteredComplaints.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default DepartmentComplaints;

