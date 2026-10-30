import React, { useState } from 'react';
import {
  Users,
  PlusCircle,
  Edit,
  Shield,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  UserCheck,
  UserX,
  Phone,
  Mail,
  AlertCircle
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { ROLES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import DataTable from '../../components/common/DataTable';
import SearchBar from '../../components/common/SearchBar';
import Select from '../../components/common/Select';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { formatDate } from '../../utils/statusHelpers';

export const UsersManagement = () => {
  const { users, addUser, updateUser, toggleUserStatus, departments } = useComplaints();

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    email: '',
    phone: '',
    password: 'officer123',
    role: ROLES.OFFICER,
    department: '',
    address: '',
  });

  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.id?.toLowerCase().includes(search.toLowerCase()) ||
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());

    const matchRole = !roleFilter || u.role === roleFilter;

    return matchSearch && matchRole;
  });

  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormError('');
    setFormData({
      id: `OFF${Math.floor(Math.random() * 900) + 100}`,
      name: '',
      email: '',
      phone: '',
      password: 'officer123',
      role: ROLES.OFFICER,
      department: departments[0]?.name || '',
      address: '',
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setEditingUser(user);
    setFormError('');
    setFormData({
      id: user.id || user.userCode,
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      password: '',
      role: user.role,
      department: user.department || '',
      address: user.address || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!formData.name?.trim() || !formData.email?.trim()) {
      setFormError('Please enter both Full Legal Name and Email Address.');
      return;
    }

    const emailLower = formData.email.trim().toLowerCase();

    // Check if email already in use locally
    const localMatch = users.find(
      (u) => (u.email || '').toLowerCase() === emailLower && (!editingUser || u.id !== editingUser.id)
    );
    if (localMatch) {
      setFormError(`The email "${formData.email}" is already registered in the system (assigned to ${localMatch.name} - ${localMatch.id}). Please enter a unique email address.`);
      return;
    }

    if ((formData.role === ROLES.OFFICER || formData.role === ROLES.WORKER) && !formData.department) {
      setFormError('Please select a Department Association for this municipal role.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingUser) {
        await updateUser(editingUser.id, formData);
        setSuccessToast(`User "${formData.name}" updated successfully.`);
      } else {
        await addUser(formData);
        setSuccessToast(`Official "${formData.name}" provisioned successfully with email ${formData.email}.`);
      }
      setModalOpen(false);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to provision user. Please verify user details.');
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      header: 'User ID',
      accessor: 'id',
      sortable: true,
      className: 'font-mono font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap',
    },
    {
      header: 'Name & Contact',
      accessor: 'name',
      sortable: true,
      render: (row) => (
        <div className="flex items-center gap-2.5">
          <img
            src={row.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80'}
            alt={row.name}
            className="w-7 h-7 rounded-full object-cover shrink-0"
          />
          <div>
            <span className="font-semibold text-slate-900 dark:text-slate-100 block">
              {row.name}
            </span>
            <span className="text-[11px] text-slate-500">{row.email}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessor: 'role',
      sortable: true,
      render: (row) => {
        let variant = 'primary';
        if (row.role === ROLES.ADMIN) variant = 'danger';
        if (row.role === ROLES.OFFICER) variant = 'purple';
        if (row.role === ROLES.WORKER) variant = 'warning';
        return <Badge variant={variant} size="sm">{row.role}</Badge>;
      },
    },
    {
      header: 'Department',
      accessor: 'department',
      render: (row) => (
        <span className="text-xs text-slate-600 dark:text-slate-300">
          {row.department || <span className="text-slate-400 italic">None</span>}
        </span>
      ),
    },
    {
      header: 'Phone',
      accessor: 'phone',
      className: 'text-xs whitespace-nowrap',
    },
    {
      header: 'Status',
      accessor: 'status',
      sortable: true,
      render: (row) => (
        <span
          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Active'
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
            }`}
        >
          {row.status}
        </span>
      ),
    },
    {
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="ghost"
            icon={Edit}
            onClick={() => handleOpenEdit(row)}
            title="Edit user"
          />
          <Button
            size="sm"
            variant={row.status === 'Active' ? 'ghost' : 'outline'}
            onClick={() => toggleUserStatus(row.id)}
            title={row.status === 'Active' ? 'Deactivate' : 'Activate'}
            className={row.status === 'Active' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600'}
          >
            {row.status === 'Active' ? 'Deactivate' : 'Activate'}
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successToast && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
            {successToast}
          </p>
        </div>
      )}

      <PageHeader
        title="Municipal Identity & Access Governance"
        description="Provision accounts, assign administrative roles, and audit access credentials."
        tag={`${users.length} Authorized Identities`}
        actions={
          <Button variant="primary" icon={PlusCircle} onClick={handleOpenAdd}>
            Create User Account
          </Button>
        }
      />

      {/* Filter Bar */}
      <div className="gov-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <SearchBar
            value={search}
            onChange={setSearch}
            placeholder="Search by ID, name, email..."
          />

          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={Object.values(ROLES)}
            placeholder="All Roles"
          />
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filtered}
        emptyTitle="No accounts found"
        emptyDescription="There are no identities matching your criteria."
      />

      {/* Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingUser ? `Edit Account: ${editingUser.name}` : 'Provision New Municipal Official'}
        description="Set identity parameters, unique email credentials, and department association."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {editingUser ? 'Save Changes' : 'Provision User'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-start gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="User ID"
              value={formData.id}
              onChange={(e) => setFormData({ ...formData, id: e.target.value })}
              required
            />
            <Select
              label="Assigned System Role"
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              options={Object.values(ROLES)}
              required
            />
          </div>

          <Input
            label="Full Legal Name"
            placeholder="e.g. Rajesh Kulkarni"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />

          <div>
            <Input
              label="Official Email Address"
              type="email"
              placeholder="e.g. officer.roads@bbmp.gov.in"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Must be a unique email. (Note: <code className="text-blue-600 font-mono">officer@bbmp.gov.in</code> is already assigned to OFF001).
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Initial Password"
              type="password"
              placeholder="e.g. officer123"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <Input
              label="Phone Number"
              placeholder="+91 98450 12345"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          {(formData.role === ROLES.OFFICER || formData.role === ROLES.WORKER) && (
            <Select
              label="Department Association"
              value={formData.department}
              onChange={(e) => setFormData({ ...formData, department: e.target.value })}
              options={departments.map((d) => d.name)}
              placeholder="Select Department"
              required
            />
          )}

          <Input
            label="Address / Station Location"
            placeholder="Municipal Division / Ward Office..."
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />
        </form>
      </Modal>
    </div>
  );
};

export default UsersManagement;

