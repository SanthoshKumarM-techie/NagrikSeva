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
  X,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS, PRIORITIES, CATEGORIES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Pagination from '../../components/common/Pagination';
import ComplaintTimeline from '../../components/dashboard/ComplaintTimeline';
import { formatDate, formatDateTime } from '../../utils/statusHelpers';

export const AllComplaints = () => {
  const { complaints, departments, transferDepartment } = useComplaints();
  const { currentUser } = useAuth();

  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [transferTargetDept, setTransferTargetDept] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferError, setTransferError] = useState('');
  const [successToast, setSuccessToast] = useState('');

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

  const handleOpenTransfer = (complaint) => {
    setSelectedComplaint(complaint);
    // Suggest first department that is different from current
    const otherDept = departments.find(d => d.id !== complaint.departmentId && d.name !== complaint.department);
    setTransferTargetDept(otherDept?.id || '');
    setTransferReason('');
    setTransferError('');
    setTransferModalOpen(true);
  };

  const handleTransferSubmit = async () => {
    if (!selectedComplaint) return;
    if (!transferTargetDept) {
      setTransferError('Please select a destination department.');
      return;
    }
    if (!transferReason || transferReason.trim().length < 3) {
      setTransferError('Please provide a specific transfer reason (min 3 characters).');
      return;
    }

    setIsTransferring(true);
    setTransferError('');

    try {
      const targetDeptObj = departments.find(d => d.id === transferTargetDept);
      await transferDepartment(
        selectedComplaint.id,
        transferTargetDept,
        `SUPERVISOR DIRECT TRANSFER: ${transferReason.trim()}`,
        currentUser || { name: 'Super Admin', role: 'SUPER_ADMIN' }
      );

      setSuccessToast(`Ticket ${selectedComplaint.ticketNumber || selectedComplaint.id} successfully reallocated to ${targetDeptObj?.name || 'new department'}.`);
      setTimeout(() => setSuccessToast(''), 6000);
      setTransferModalOpen(false);
      setSelectedComplaint(null);
    } catch (err) {
      console.error('Transfer error:', err);
      setTransferError(err?.message || 'Failed to transfer complaint. Please try again.');
    } finally {
      setIsTransferring(false);
    }
  };

  const columns = [
    {
      header: 'Complaint ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap',
      render: (row) => (
        <div>
          <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
            {row.ticketNumber || row.id?.slice(0, 8)}
          </span>
          <span className="block text-[10px] text-slate-400 font-normal font-mono truncate max-w-[120px]">
            {row.id}
          </span>
        </div>
      )
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
      header: 'Assigned Crew',
      accessor: 'assignedWorkerName',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300 whitespace-nowrap">
          {row.assignedWorkerName || 'Unassigned'}
        </span>
      )
    },
    {
      header: 'Logged Date',
      accessor: 'submittedAt',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {formatDate(row.submittedAt)}
        </span>
      ),
    },
    {
      header: 'Action',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="secondary"
            icon={Eye}
            onClick={() => setSelectedComplaint(row)}
          >
            Audit
          </Button>
          <Button
            size="sm"
            variant="outline"
            icon={ArrowRightLeft}
            onClick={() => handleOpenTransfer(row)}
            title="Reassign or transfer to another department"
          >
            Transfer
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central Grievance Audit & Registry"
        description="Comprehensive master ledger of all citizen grievances, jurisdictional allocations, and resolution lifecycles."
        tag={`${complaints.length} Total Registered`}
      />

      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-sm text-emerald-800 dark:text-emerald-200 flex items-center gap-3 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          <span className="font-semibold">{successToast}</span>
        </div>
      )}

      {/* Search & Multi-Filter Control Strip */}
      <div className="gov-card p-4 space-y-3">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setCurrentPage(1);
          }}
          placeholder="Search by ID, ticket number, grievance keyword, citizen name or location..."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          <Select
            label="Department"
            value={deptFilter}
            onChange={(e) => {
              setDeptFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={departments.map((d) => ({ value: d.name, label: d.name }))}
            placeholder="All Departments"
          />

          <Select
            label="Category"
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={CATEGORIES.map((c) => ({ value: c.name, label: c.name }))}
            placeholder="All Categories"
          />

          <Select
            label="Status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={Object.values(COMPLAINT_STATUS).map((s) => ({ value: s, label: s }))}
            placeholder="All Statuses"
          />

          <Select
            label="Priority"
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
            options={Object.values(PRIORITIES).map((p) => ({ value: p, label: p }))}
            placeholder="All Priorities"
          />
        </div>
      </div>

      {/* Complaints Ledger Table */}
      <div className="space-y-4">
        <DataTable
          columns={columns}
          data={paginatedData}
          emptyTitle="No records found"
          emptyDescription="No civic complaints match the selected filter criteria."
        />

        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          totalItems={filtered.length}
        />
      </div>

      {/* Admin Audit Dossier Modal */}
      {selectedComplaint && (
        <Modal
          isOpen={!!selectedComplaint}
          onClose={() => setSelectedComplaint(null)}
          title={`Audit Dossier: ${selectedComplaint.ticketNumber || selectedComplaint.id}`}
          size="lg"
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="outline"
                icon={ArrowRightLeft}
                onClick={() => {
                  const comp = selectedComplaint;
                  handleOpenTransfer(comp);
                }}
              >
                Reassign Department
              </Button>
              <Button variant="secondary" onClick={() => setSelectedComplaint(null)}>
                Close
              </Button>
            </div>
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
                <span>{selectedComplaint.location} ({selectedComplaint.ward || 'Central Ward'})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Complainant:</span>
                <span>{selectedComplaint.citizenName || 'Registered Citizen'} ({selectedComplaint.citizenPhone || 'Contact on file'})</span>
              </div>
              <div>
                <span className="text-slate-400 block">Assigned Crew:</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">
                  {selectedComplaint.assignedWorkerName || 'Unassigned'}
                </span>
              </div>
            </div>

            {selectedComplaint.transfers?.length > 0 && (
              <div className="p-3 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-100 dark:border-purple-900/40 text-xs">
                <strong className="text-purple-700 dark:text-purple-300 block mb-1">
                  Transfer History ({selectedComplaint.transfers.length} events):
                </strong>
                {selectedComplaint.transfers.map((tr, idx) => (
                  <p key={tr.id || idx} className="text-[11px] text-slate-600 dark:text-slate-300">
                    {tr.fromDepartmentName || 'Origin'} &rarr; {tr.toDepartmentName || 'Destination'} ({formatDate(tr.timestamp)}): "{tr.reason}"
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

      {/* Admin Department Transfer / Reallocation Modal */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => !isTransferring && setTransferModalOpen(false)}
        title={`Reallocate Department: ${selectedComplaint?.ticketNumber || selectedComplaint?.id}`}
        description="Reassign this civic complaint to another municipal wing with statutory reason and timeline recording."
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => setTransferModalOpen(false)}
              disabled={isTransferring}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={ArrowRightLeft}
              onClick={handleTransferSubmit}
              disabled={isTransferring}
            >
              {isTransferring ? 'Reallocating...' : 'Confirm Transfer'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {transferError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{transferError}</span>
            </div>
          )}

          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300">
            <strong>Current Department:</strong> {selectedComplaint?.department}
          </div>

          <Select
            label="Destination Municipal Department"
            value={transferTargetDept}
            onChange={(e) => setTransferTargetDept(e.target.value)}
            options={departments
              .filter(d => d.id !== selectedComplaint?.departmentId && d.name !== selectedComplaint?.department)
              .map(d => ({ value: d.id, label: `${d.name} (${d.code || 'WING'})` }))}
            disabled={isTransferring}
            required
          />

          <Input
            label="Administrative Justification & Reassignment Directives"
            type="textarea"
            rows={3}
            placeholder="Explain jurisdictional reallocation reason (e.g., issue falls under BWSSB water authority scope)..."
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            disabled={isTransferring}
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default AllComplaints;
