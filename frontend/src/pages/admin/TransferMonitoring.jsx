import React, { useState, useEffect } from 'react';
import {
  ArrowRightLeft,
  Search,
  Building2,
  Calendar,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Eye,
  FileCheck2
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import { formatDateTime } from '../../utils/statusHelpers';
import transfersApi from '../../api/transfers.api';

export const TransferMonitoring = () => {
  const { complaints, departments, approveTransferRequest, rejectTransferRequest } = useComplaints();
  const { currentUser } = useAuth();
  const [search, setSearch] = useState('');
  const [multiOnly, setMultiOnly] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'ACCEPTED' | 'REJECTED'
  const [backendTransfers, setBackendTransfers] = useState(null);
  const [loading, setLoading] = useState(false);

  // Review Modal state
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');
  const [actionType, setActionType] = useState('APPROVE'); // 'APPROVE' | 'REJECT'
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchTransfers = () => {
    setLoading(true);
    transfersApi.getAllTransfers()
      .then((res) => {
        if (res) {
          setBackendTransfers(res);
        }
      })
      .catch((err) => {
        console.warn('Error fetching all transfers:', err.message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Collect transferred complaints
  const transferredComplaints = complaints.filter(
    (c) => c.transfers && c.transfers.length > 0
  );

  // Flattened transfer events with complaint metadata
  const transferRecords = [];
  const seenIds = new Set();

  if (backendTransfers && backendTransfers.length > 0) {
    backendTransfers.forEach(tr => {
      seenIds.add(tr.id);
      transferRecords.push({
        id: tr.id,
        complaintDbId: tr.complaint_id,
        complaintId: tr.ticket_number || tr.complaint_id,
        title: tr.complaint_title || 'Civic Grievance',
        fromDepartmentId: tr.from_department_id,
        fromDepartmentName: tr.from_department_name || 'Origin Wing',
        toDepartmentId: tr.to_department_id,
        toDepartmentName: tr.to_department_name || 'Pending Supervisor Assignment',
        reason: tr.reason || 'Jurisdictional boundary realignment',
        status: tr.status || tr.receiving_decision || 'PENDING',
        timestamp: tr.transferred_at || tr.created_at,
        transferredBy: tr.transferred_by_name || tr.initiated_by_name || 'Department Officer',
        totalTransferCount: tr.transfer_number || 1,
        adminNotes: tr.admin_notes
      });
    });
  }

  // Also include any in-memory transfers from complaint context if not already added
  transferredComplaints.forEach((c) => {
    (c.transfers || []).forEach((tr, idx) => {
      if (!seenIds.has(tr.id)) {
        transferRecords.push({
          ...tr,
          id: tr.id || `tr-${idx}`,
          complaintDbId: c.id,
          complaintId: c.ticketNumber || c.id,
          title: c.title,
          status: tr.status || c.status,
          priority: c.priority,
          currentDept: c.department,
          fromDepartmentName: tr.fromDepartmentName || c.department,
          toDepartmentName: tr.toDepartmentName || 'Pending Supervisor Assignment',
          totalTransferCount: c.transfers.length,
          isLatest: idx === c.transfers.length - 1,
        });
      }
    });
  });

  const filtered = transferRecords.filter((rec) => {
    const matchSearch =
      !search ||
      rec.complaintId.toLowerCase().includes(search.toLowerCase()) ||
      rec.title.toLowerCase().includes(search.toLowerCase()) ||
      rec.reason.toLowerCase().includes(search.toLowerCase()) ||
      rec.fromDepartmentName.toLowerCase().includes(search.toLowerCase()) ||
      (rec.toDepartmentName && rec.toDepartmentName.toLowerCase().includes(search.toLowerCase()));

    const matchMulti = !multiOnly || rec.totalTransferCount > 1;
    const matchStatus = statusFilter === 'ALL' || rec.status === statusFilter;

    return matchSearch && matchMulti && matchStatus;
  });

  const pendingRequestsCount = transferRecords.filter(r => r.status === 'PENDING').length;
  const multiTransferCount = transferredComplaints.filter((c) => c.transfers?.length > 1).length;

  const handleOpenReview = (record, action) => {
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

    setIsSubmitting(true);
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
      alert('Error updating transfer: ' + (err.message || 'Operation failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'Complaint ID',
      accessor: 'complaintId',
      sortable: true,
      className: 'font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap',
    },
    {
      header: 'Issue Headline',
      accessor: 'title',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
          {row.title}
        </span>
      ),
    },
    {
      header: 'Transfer Route & Assignment',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <span className="font-medium text-slate-600 dark:text-slate-400">{row.fromDepartmentName}</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
          <span className={`font-bold ${row.toDepartmentName?.includes('Pending') ? 'text-amber-600 dark:text-amber-400 italic' : 'text-purple-700 dark:text-purple-300'}`}>
            {row.toDepartmentName}
          </span>
        </div>
      ),
    },
    {
      header: 'Reason from Officer',
      accessor: 'reason',
      render: (row) => (
        <span className="text-xs text-slate-700 dark:text-slate-300 italic line-clamp-2">
          "{row.reason}"
        </span>
      ),
    },
    {
      header: 'Request Status',
      accessor: 'status',
      sortable: true,
      render: (row) => {
        if (row.status === 'PENDING') {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 ring-1 ring-amber-400">
              Pending Supervisor Review
            </span>
          );
        }
        if (row.status === 'ACCEPTED') {
          return (
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Approved & Reassigned
            </span>
          );
        }
        return (
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            Rejected
          </span>
        );
      },
    },
    {
      header: 'Timestamp',
      accessor: 'timestamp',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },
    {
      header: 'Supervisor Action',
      render: (row) => {
        if (row.status === 'PENDING') {
          return (
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="primary"
                icon={CheckCircle2}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenReview(row, 'APPROVE');
                }}
              >
                Assign Dept
              </Button>
              <Button
                size="sm"
                variant="danger"
                icon={XCircle}
                onClick={(e) => {
                  e.stopPropagation();
                  handleOpenReview(row, 'REJECT');
                }}
              >
                Reject
              </Button>
            </div>
          );
        }
        return (
          <span className="text-xs text-slate-400 italic">
            Completed
          </span>
        );
      }
    }
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Supervisor Inter-Department Transfer Management"
        description="Review departmental transfer requests submitted by officers. Evaluate justifications and reassign complaints to the correct municipal department."
        tag="Supervisor Control Panel"
        actions={
          <Button
            variant="secondary"
            icon={RefreshCw}
            onClick={fetchTransfers}
            disabled={loading}
          >
            Refresh Queue
          </Button>
        }
      />

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="gov-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Total Transfer Requests
          </span>
          <strong className="text-2xl font-bold mt-1 block">
            {transferRecords.length}
          </strong>
          <span className="text-[11px] text-slate-400">All-time transfer tickets</span>
        </div>

        <div
          onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
          className={`gov-card p-4 cursor-pointer transition-all ${statusFilter === 'PENDING' ? 'ring-2 ring-amber-500 bg-amber-50/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider block">
              Pending Supervisor Review
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <strong className="text-2xl font-bold text-amber-600 mt-1 block">
            {pendingRequestsCount}
          </strong>
          <span className="text-[11px] text-slate-400">Click to filter pending action</span>
        </div>

        <div className="gov-card p-4">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
            Approved & Reassigned
          </span>
          <strong className="text-2xl font-bold text-emerald-600 mt-1 block">
            {transferRecords.filter(r => r.status === 'ACCEPTED').length}
          </strong>
          <span className="text-[11px] text-slate-400">Assigned to new department</span>
        </div>

        <div
          onClick={() => setMultiOnly(!multiOnly)}
          className={`gov-card p-4 cursor-pointer transition-all ${multiOnly ? 'ring-2 ring-rose-500 bg-rose-50/20' : ''}`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider block">
              Multi-Transfer Warning
            </span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <strong className="text-2xl font-bold text-rose-600 mt-1 block">
            {multiTransferCount}
          </strong>
          <span className="text-[11px] text-slate-400">Click to filter multi-transferred</span>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="gov-card p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search by ID, department, or reason..."
        />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatusFilter(statusFilter === 'PENDING' ? 'ALL' : 'PENDING')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${statusFilter === 'PENDING'
                ? 'bg-amber-600 text-white border-amber-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
          >
            {statusFilter === 'PENDING' ? 'Showing Pending Only' : 'Show Pending Only'}
          </button>
          <button
            onClick={() => setMultiOnly(!multiOnly)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${multiOnly
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700'
              }`}
          >
            {multiOnly ? 'Showing Multi-Transferred Only' : 'Show Multi-Transferred Only'}
          </button>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No transfer events"
        emptyDescription="No departmental transfers meet your criteria."
      />

      {/* Modal: Supervisor Review Transfer */}
      <Modal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        title={actionType === 'APPROVE' ? "Assign New Department & Approve Transfer" : "Reject Department Transfer Request"}
        description={actionType === 'APPROVE' 
          ? `Review request from ${selectedTransfer?.fromDepartmentName} and designate the correct department responsible for this issue.` 
          : `Return this complaint to ${selectedTransfer?.fromDepartmentName} with administrative instructions.`
        }
        footer={
          <>
            <Button variant="secondary" onClick={() => setReviewModalOpen(false)} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              variant={actionType === 'APPROVE' ? "primary" : "danger"}
              icon={actionType === 'APPROVE' ? CheckCircle2 : XCircle}
              onClick={handleSubmitReview}
              disabled={isSubmitting || (actionType === 'APPROVE' && !targetDeptId)}
            >
              {isSubmitting ? 'Processing...' : actionType === 'APPROVE' ? 'Assign & Transfer Complaint' : 'Reject Request'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
            <div><strong>Complaint ID:</strong> <span className="font-mono text-blue-600 dark:text-blue-400">{selectedTransfer?.complaintId}</span></div>
            <div><strong>Issue:</strong> {selectedTransfer?.title}</div>
            <div><strong>Requesting Department:</strong> {selectedTransfer?.fromDepartmentName}</div>
            <div><strong>Officer Justification:</strong> <span className="italic text-slate-600 dark:text-slate-300">"{selectedTransfer?.reason}"</span></div>
          </div>

          {actionType === 'APPROVE' && (
            <Select
              label="Select Responsible Department to Assign"
              value={targetDeptId}
              onChange={(e) => setTargetDeptId(e.target.value)}
              options={[
                { value: '', label: '-- Choose Correct Department --' },
                ...departments
                  .filter(d => d.id !== selectedTransfer?.fromDepartmentId && d.name !== selectedTransfer?.fromDepartmentName)
                  .map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))
              ]}
              required
            />
          )}

          <Input
            label={actionType === 'APPROVE' ? "Supervisor Directives / Allocation Notes" : "Reason for Rejection"}
            type="textarea"
            rows={3}
            placeholder={actionType === 'APPROVE' ? "Add any administrative remarks or directives for the new department..." : "Explain why this request is rejected and why the current department remains responsible..."}
            value={reviewNotes}
            onChange={(e) => setReviewNotes(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default TransferMonitoring;


