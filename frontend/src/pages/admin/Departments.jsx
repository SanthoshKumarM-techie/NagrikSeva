import React, { useState } from 'react';
import {
  Building2,
  PlusCircle,
  Edit,
  Users,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  TrendingUp,
  Shield,
  AlertCircle
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';

export const Departments = () => {
  const { departments, complaints, addDepartment, updateDepartment } = useComplaints();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    headOfficer: '',
    email: '',
    phone: '',
    address: '',
    description: '',
    staffCount: 20,
    slaTargetPct: 90,
  });

  const handleOpenAdd = () => {
    setEditingDept(null);
    setFormError('');
    setFormData({
      name: '',
      code: '',
      headOfficer: '',
      email: '',
      phone: '',
      address: '',
      description: '',
      staffCount: 20,
      slaTargetPct: 90,
    });
    setModalOpen(true);
  };

  const handleOpenEdit = (dept) => {
    setEditingDept(dept);
    setFormError('');
    setFormData({
      name: dept.name || '',
      code: dept.code || '',
      headOfficer: dept.headOfficer || dept.nodal_officer_name || '',
      email: dept.email || dept.contactEmail || '',
      phone: dept.phone || dept.contactPhone || '',
      address: dept.address || '',
      description: dept.description || '',
      staffCount: dept.staffCount || 20,
      slaTargetPct: dept.slaTargetPct || 90,
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Please enter a valid Department Name.');
      return;
    }

    const cleanCode = (formData.code || formData.name.slice(0, 4)).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (!cleanCode) {
      setFormError('Please provide a valid Department Code (e.g. SAN, ELEC).');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDept) {
        await updateDepartment(editingDept.id, {
          ...formData,
          code: cleanCode
        });
        setSuccessToast(`Department "${formData.name}" updated successfully.`);
      } else {
        await addDepartment({
          ...formData,
          code: cleanCode
        });
        setSuccessToast(`Department "${formData.name}" registered successfully.`);
      }
      setModalOpen(false);
      setTimeout(() => setSuccessToast(''), 4000);
    } catch (err) {
      setFormError(err.message || 'Failed to save department. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

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
        title="Municipal Departments Directory"
        description="Configure civic operating wings, designate nodal executive officers, and establish SLA benchmarks."
        tag={`${departments.length} Municipal Wings`}
        actions={
          <Button variant="primary" icon={PlusCircle} onClick={handleOpenAdd}>
            Add Department
          </Button>
        }
      />

      {/* Departments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {departments.map((dept) => {
          const deptComplaints = complaints.filter((c) => c.departmentId === dept.id || c.department === dept.name);
          const activeCount = deptComplaints.filter(
            (c) => c.status !== 'Resolved' && c.status !== 'Closed'
          ).length;
          const resolvedCount = deptComplaints.filter(
            (c) => c.status === 'Resolved' || c.status === 'Closed'
          ).length;

          const emailVal = dept.email || dept.contactEmail;
          const phoneVal = dept.phone || dept.contactPhone;
          const officerVal = dept.headOfficer || dept.nodal_officer_name || 'Nodal Officer Pending Assignment';

          return (
            <div key={dept.id} className="gov-card p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="font-mono text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
                      {dept.code} &bull; {dept.id}
                    </span>
                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                      {dept.name}
                    </h3>
                  </div>
                  <button
                    onClick={() => handleOpenEdit(dept)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="Edit configuration"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 mb-4 line-clamp-2">
                  {dept.description || 'Specialized municipal engineering wing.'}
                </p>

                {/* Metrics Pill Grid */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-lg bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 text-center text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Active</span>
                    <strong className="font-bold text-amber-600 text-sm">
                      {activeCount}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Resolved</span>
                    <strong className="font-bold text-emerald-600 text-sm">
                      {resolvedCount}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">SLA Target</span>
                    <strong className="font-bold text-blue-600 text-sm">
                      {dept.slaTargetPct || 90}%
                    </strong>
                  </div>
                </div>

                {/* Head Officer & Contacts */}
                <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                  <div className="flex items-center gap-2">
                    <Shield className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Nodal Officer: <strong>{officerVal}</strong></span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{emailVal || 'Contact email not set'}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{phoneVal || 'Official hotline not set'}</span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 dark:border-slate-800 mt-4 flex items-center justify-between text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-slate-400" />
                  {dept.staffCount || 20} Staff Deployed
                </span>
                <Button size="sm" variant="ghost" onClick={() => handleOpenEdit(dept)}>
                  Configure &rarr;
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingDept ? `Edit Department: ${editingDept.name}` : 'Register New Municipal Department'}
        description="Update contact information, officer assignments, and SLA benchmarks."
        footer={
          <>
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={submitting}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSubmit} loading={submitting}>
              {editingDept ? 'Save Changes' : 'Create Department'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Department Name"
              placeholder="e.g. Urban Forestry & Parks"
              value={formData.name}
              onChange={(e) => {
                const newName = e.target.value;
                setFormData(prev => ({
                  ...prev,
                  name: newName,
                  code: editingDept ? prev.code : (prev.code || newName.slice(0, 4).toUpperCase())
                }));
              }}
              required
            />
            <Input
              label="Department Code"
              placeholder="e.g. FOR"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nodal Head Officer (Optional)"
              placeholder="e.g. Dr. Ramesh Rao"
              value={formData.headOfficer}
              onChange={(e) => setFormData({ ...formData, headOfficer: e.target.value })}
            />
            <Input
              label="Official Contact Phone"
              placeholder="+91 80 2266 0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>

          <Input
            label="Department Grievance Email"
            type="email"
            placeholder="grievance@bbmp.gov.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />

          <Input
            label="Department Mandate & Description"
            type="textarea"
            rows={2}
            placeholder="Scope of municipal services handled by this department..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Total Field Staff Count"
              type="number"
              value={formData.staffCount}
              onChange={(e) => setFormData({ ...formData, staffCount: Number(e.target.value) })}
            />
            <Input
              label="SLA Compliance Target (%)"
              type="number"
              value={formData.slaTargetPct}
              onChange={(e) => setFormData({ ...formData, slaTargetPct: Number(e.target.value) })}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Departments;

