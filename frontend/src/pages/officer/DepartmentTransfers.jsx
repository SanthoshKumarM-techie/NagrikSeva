import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRightLeft,
  Search,
  Building2,
  Calendar,
  AlertCircle,
  Eye,
  PlusCircle,
  Clock,
  ArrowRight,
  RefreshCw
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Select from '../../components/common/Select';
import Input from '../../components/common/Input';
import { formatDateTime, formatDate } from '../../utils/statusHelpers';
import transfersApi from '../../api/transfers.api';

export const DepartmentTransfers = () => {
  const { complaints, departments, transferDepartment } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const officerDept = currentUser?.department || currentUser?.departmentName || 'Roads & Infrastructure';
  const officerDeptId = currentUser?.departmentId || '11111111-1111-1111-1111-111111111101';
  const isSuperAdmin = (currentUser?.role || '').toLowerCase().includes('admin');

  const normalizeDept = (val) => String(val || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  const matchesOfficerDept = (trDeptId, trDeptName) => {
    if (isSuperAdmin) return true;
    if (officerDeptId && trDeptId && String(trDeptId).toLowerCase() === String(officerDeptId).toLowerCase()) return true;
    if (currentUser?.departmentId && trDeptId && String(trDeptId).toLowerCase() === String(currentUser.departmentId).toLowerCase()) return true;
    
    const nTr = normalizeDept(trDeptName);
    const nOff = normalizeDept(officerDept);
    const nCurr = normalizeDept(currentUser?.departmentName || currentUser?.department);
    
    if (nTr && nOff && (nTr === nOff || nTr.includes(nOff) || nOff.includes(nTr))) return true;
    if (nTr && nCurr && (nTr === nCurr || nTr.includes(nCurr) || nCurr.includes(nTr))) return true;
    return false;
  };

  const [tab, setTab] = useState('outgoing'); // 'outgoing' | 'incoming' | 'all'
  const [search, setSearch] = useState('');
  const [backendTransfers, setBackendTransfers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Transfer modal
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState('');
  const [targetDeptId, setTargetDeptId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const fetchTransfers = async () => {
    setLoading(true);
    try {
      const res = await transfersApi.getAllTransfers();
      if (Array.isArray(res)) {
        setBackendTransfers(res);
      }
    } catch (err) {
      console.warn('Could not fetch transfers from API, relying on local records:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  // Collect all transfer records (combining backend + local context)
  const allTransfers = [];
  const seenIds = new Set();

  if (backendTransfers.length > 0) {
    backendTransfers.forEach((tr) => {
      seenIds.add(tr.id);
      allTransfers.push({
        id: tr.id,
        complaintId: tr.ticket_number || tr.complaint_id,
        complaintDbId: tr.complaint_id,
        complaintTitle: tr.complaint_title || 'Civic Grievance',
        category: tr.category_name,
        status: tr.status || tr.receiving_decision || 'PENDING',
        priority: tr.priority,
        fromDepartmentId: tr.from_department_id,
        fromDepartmentName: tr.from_department_name || 'Origin Wing',
        toDepartmentId: tr.to_department_id,
        toDepartmentName: tr.to_department_name || 'Pending Supervisor Assignment',
        reason: tr.reason || '',
        timestamp: tr.transferred_at || tr.created_at,
        transferredBy: tr.transferred_by_name || tr.initiated_by_name || 'Department Officer',
        adminNotes: tr.admin_notes
      });
    });
  }

  // Also include any local memory transfers from complaint context
  complaints.forEach((c) => {
    if (c.transfers && c.transfers.length > 0) {
      c.transfers.forEach((tr) => {
        if (!seenIds.has(tr.id)) {
          allTransfers.push({
            ...tr,
            complaintId: c.ticketNumber || c.id,
            complaintDbId: c.id,
            complaintTitle: c.title,
            category: c.category,
            status: tr.status || c.status,
            priority: c.priority,
            currentDepartment: c.department,
            fromDepartmentName: tr.fromDepartmentName || c.department,
            toDepartmentName: tr.toDepartmentName || 'Pending Supervisor Assignment',
            timestamp: tr.timestamp || new Date().toISOString()
          });
        }
      });
    }
  });

  const incomingTransfers = allTransfers.filter(tr => matchesOfficerDept(tr.toDepartmentId, tr.toDepartmentName));
  const outgoingTransfers = allTransfers.filter(tr => matchesOfficerDept(tr.fromDepartmentId, tr.fromDepartmentName));

  const activeList = tab === 'incoming' ? incomingTransfers : tab === 'outgoing' ? outgoingTransfers : allTransfers;

  const filteredTransfers = activeList.filter((tr) => {
    return (
      !search ||
      (tr.complaintId && tr.complaintId.toLowerCase().includes(search.toLowerCase())) ||
      (tr.complaintTitle && tr.complaintTitle.toLowerCase().includes(search.toLowerCase())) ||
      (tr.reason && tr.reason.toLowerCase().includes(search.toLowerCase())) ||
      (tr.transferredBy && tr.transferredBy.toLowerCase().includes(search.toLowerCase())) ||
      (tr.fromDepartmentName && tr.fromDepartmentName.toLowerCase().includes(search.toLowerCase())) ||
      (tr.toDepartmentName && tr.toDepartmentName.toLowerCase().includes(search.toLowerCase()))
    );
  });

  const handleCreateTransfer = async () => {
    if (!selectedComplaintId || !transferReason.trim()) {
      alert('Please select a complaint and provide a justification reason.');
      return;
    }
    try {
      await transferDepartment(selectedComplaintId, targetDeptId || null, transferReason, currentUser);
      alert('Transfer request submitted to Supervisor Admin successfully.');
      setTransferModalOpen(false);
      setSelectedComplaintId('');
      setTargetDeptId('');
      setTransferReason('');
      fetchTransfers();
    } catch (err) {
      alert('Failed to submit transfer request: ' + (err.message || 'Error'));
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
      accessor: 'complaintTitle',
      sortable: true,
      render: (row) => (
        <span className="font-semibold text-slate-900 dark:text-slate-100 line-clamp-1">
          {row.complaintTitle}
        </span>
      ),
    },
    {
      header: 'Transfer Route',
      render: (row) => (
        <div className="flex items-center gap-1.5 text-xs whitespace-nowrap">
          <span className="font-medium text-slate-600 dark:text-slate-400">{row.fromDepartmentName}</span>
          <ArrowRight className="w-3.5 h-3.5 text-purple-600" />
          <span className="font-bold text-purple-700 dark:text-purple-300">{row.toDepartmentName}</span>
        </div>
      ),
    },
    {
      header: 'Mandatory Justification',
      accessor: 'reason',
      render: (row) => (
        <p className="text-xs text-slate-700 dark:text-slate-300 line-clamp-2 italic">
          "{row.reason}"
        </p>
      ),
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => {
        if (row.status === 'PENDING') {
          return (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
              Pending Supervisor
            </span>
          );
        }
        if (row.status === 'ACCEPTED') {
          return (
            <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              Approved
            </span>
          );
        }
        return (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
            Rejected
          </span>
        );
      }
    },
    {
      header: 'Date & Time',
      accessor: 'timestamp',
      sortable: true,
      render: (row) => (
        <span className="text-xs text-slate-500 whitespace-nowrap">
          {formatDateTime(row.timestamp)}
        </span>
      ),
    },
    {
      header: 'Authorized By',
      accessor: 'transferredBy',
      className: 'text-xs whitespace-nowrap',
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
            navigate(`/officer/complaints/${row.complaintDbId || row.complaintId}`);
          }}
        >
          Review
        </Button>
      ),
    },
  ];

  // Candidates for transfer (currently assigned to this dept)
  const transferCandidates = complaints.filter(
    (c) => c.departmentId === officerDeptId || c.department === officerDept
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Inter-Department Grievance Transfers"
        description="Monitor jurisdictional reassignments. Transfer incorrectly routed complaints with mandatory technical reasoning."
        tag="Cross-Department Routing"
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              icon={RefreshCw}
              onClick={fetchTransfers}
              disabled={loading}
            >
              Refresh
            </Button>
            <Button
              variant="primary"
              icon={ArrowRightLeft}
              onClick={() => {
                setSelectedComplaintId(transferCandidates[0]?.id || '');
                setTargetDeptId(departments.find((d) => d.name !== officerDept && d.id !== officerDeptId)?.id || '');
                setTransferReason('');
                setTransferModalOpen(true);
              }}
            >
              Initiate Transfer
            </Button>
          </div>
        }
      />

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setTab('outgoing')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'outgoing'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Transferred Out by Us ({outgoingTransfers.length})
        </button>
        <button
          onClick={() => setTab('incoming')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'incoming'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Incoming to Us ({incomingTransfers.length})
        </button>
        <button
          onClick={() => setTab('all')}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
            tab === 'all'
              ? 'bg-blue-600 text-white'
              : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          Municipal All ({allTransfers.length})
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="gov-card p-4">
        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search transfer reasons, complaint IDs, officers..."
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTransfers}
        onRowClick={(row) => navigate(`/officer/complaints/${row.complaintId}`)}
        emptyTitle="No transfer records found"
        emptyDescription="There are no departmental transfer events matching your selection."
      />

      {/* Modal: Initiate Transfer Request */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Request Department Transfer"
        description="Submit a transfer request to the Supervisor Admin. The supervisor will review the grievance and assign the appropriate municipal department."
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={ArrowRightLeft}
              onClick={handleCreateTransfer}
              disabled={!selectedComplaintId || !transferReason.trim()}
            >
              Send Request to Supervisor
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300">
            <strong>Supervisor Routing Policy:</strong> Department transfers require approval from the Supervisor Admin, who will evaluate and assign the complaint to the correct department.
          </div>

          <Select
            label="Select Complaint to Transfer"
            value={selectedComplaintId}
            onChange={(e) => setSelectedComplaintId(e.target.value)}
            options={transferCandidates.map((c) => ({
              value: c.id,
              label: `${c.id} — ${c.title}`,
            }))}
            required
          />

          <Select
            label="Suggested Destination Department (Optional)"
            value={targetDeptId}
            onChange={(e) => setTargetDeptId(e.target.value)}
            options={[
              { value: '', label: '-- Recommend to Supervisor or Leave for Admin Decision --' },
              ...departments
                .filter((d) => d.name !== officerDept)
                .map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))
            ]}
          />

          <Input
            label="Mandatory Technical Reason / Justification"
            type="textarea"
            rows={4}
            placeholder="Explain why this grievance falls outside this wing's purview (e.g. trenching damage belongs to roads, water leak belongs to BWSSB)..."
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            required
          />
        </div>
      </Modal>
    </div>
  );
};

export default DepartmentTransfers;

