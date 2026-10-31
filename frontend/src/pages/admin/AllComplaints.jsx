import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Eye,
  AlertOctagon,
  ArrowRightLeft,
  Building2,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { COMPLAINT_STATUS, PRIORITIES, CATEGORIES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import ComplaintTimeline from '../../components/dashboard/ComplaintTimeline';
import { formatDate, formatDateTime } from '../../utils/statusHelpers';

export const AllComplaints = () => {
  const { complaints, departments } = useComplaints();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedComplaint, setSelectedComplaint] = useState(null);

  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const searchLower = search.toLowerCase();
      const matchSearch =
        !search ||
        (c.id && c.id.toLowerCase().includes(searchLower)) ||
        (c.ticketNumber && c.ticketNumber.toLowerCase().includes(searchLower)) ||
        (c.title && c.title.toLowerCase().includes(searchLower)) ||
        (c.location && c.location.toLowerCase().includes(searchLower)) ||
        (c.citizenName && c.citizenName.toLowerCase().includes(searchLower));

      const matchDept = !deptFilter || c.department === deptFilter;
      const matchCategory = !categoryFilter || c.category === categoryFilter;
      const matchStatus = !statusFilter || c.status === statusFilter;
      const matchPriority = !priorityFilter || c.priority === priorityFilter;

      return matchSearch && matchDept && matchCategory && matchStatus && matchPriority;
    });
  }, [complaints, search, deptFilter, categoryFilter, statusFilter, priorityFilter]);

  const totalPages = Math.ceil(filtered.length / pageSize) || 1;
  const paginatedData = filtered.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const columns = [
    {
      header: 'Complaint ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap',
    },
    {
      header: 'Title & Location',
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
      header: 'Citizen',
      accessor: 'citizenName',
      sortable: true,
      render: (row) => (
        <span className="text-xs whitespace-nowrap">{row.citizenName}</span>
      ),
    },
    {
      header: 'SLA Deadline',
      accessor: 'slaDeadline',
      sortable: true,
      render: (row) => {
        const isOverdue = new Date(row.slaDeadline) < new Date();
        return (
          <span className={`text-xs whitespace-nowrap ${isOverdue ? 'text-rose-600 font-bold' : 'text-slate-500'}`}>
            {formatDate(row.slaDeadline)}
          </span>
        );
      },
    },
    {
      header: 'Escalation',
      render: (row) => (
        row.escalation ? (
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            L{row.escalation.level} ({row.escalation.title})
          </span>
        ) : (
          <span className="text-[11px] text-slate-400">Normal</span>
        )
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
            setSelectedComplaint(row);
          }}
        >
          Audit
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Municipal Grievance Master Ledger"
        description="Comprehensive audit of all citizen complaints across all municipal departments."
        tag={`${filtered.length} Total Registered`}
      />

      {/* Filter Toolbar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <SearchBar
            value={search}
            onChange={(val) => {
              setSearch(val);
              setCurrentPage(1);
            }}
            placeholder="Search by ID, citizen, road..."
          />

          <Select
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={departments.map((d) => d.name)}
            placeholder="All Departments"
          />

          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={CATEGORIES}
            placeholder="All Categories"
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
        </div>
      </div>

      {/* Table & Pagination */}
      <div className="space-y-2">
        <DataTable
          columns={columns}
          data={paginatedData}
          onRowClick={(row) => setSelectedComplaint(row)}
          emptyTitle="No records found"
          emptyDescription="No civic complaints match the configured filters."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={filtered.length}
          pageSize={pageSize}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Admin Audit Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Audit Dossier: ${selectedComplaint.id}`}
          size="lg"
          footer={
            <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>
              Close
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Badge status={selectedComplaint.status} />
                <Badge priority={selectedComplaint.priority} />
              </div>
              <span className="text-xs text-slate-500">
                Logged: {formatDateTime(selectedComplaint.submittedAt)}
              </span>
            </div>

            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                {selectedComplaint.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {selectedComplaint.description}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-slate-400 block">Department:</span>
                <strong>{selectedComplaint.department}</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Location:</span>
                <span>{selectedComplaint.location} ({selectedComplaint.ward})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Complainant:</span>
                <span>{selectedComplaint.citizenName} ({selectedComplaint.citizenPhone})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Assigned Crew:</span>
                <span>{selectedComplaint.assignedWorkerName || 'None'}</span>
              </div>
            </div>

            {selectedComplaint.transfers?.length > 0 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900/40 text-xs">
                <strong className="text-purple-700 dark:text-purple-300 block mb-1">
                  Transfer History ({selectedComplaint.transfers.length} events):
                </strong>
                {selectedComplaint.transfers.map((tr) => (
                  <p key={tr.id} className="text-[11px] text-slate-600 dark:text-slate-300">
                    {tr.fromDepartmentName} &rarr; {tr.toDepartmentName} ({formatDate(tr.timestamp)}): "{tr.reason}"
                  </p>
                ))}
              </div>
            )}

            <div>
              <h5 className="text-xs font-bold text-slate-900 dark:text-slate-100 mb-2">
                Audit Timeline
              </h5>
              <ComplaintTimeline timeline={selectedComplaint.timeline} />
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default AllComplaints;

