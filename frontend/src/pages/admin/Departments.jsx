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
  AlertCircle,
  Copy,
  Check,
  Key,
  Send,
  ExternalLink
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import PageHeader from '../../components/layout/PageHeader';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import { sendDepartmentCredentialsEmail } from '../../services/email/emailService';

export const Departments = () => {
  const { departments, complaints, addDepartment, updateDepartment } = useComplaints();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successToast, setSuccessToast] = useState('');

  // Credentials Modal for newly provisioned Nodal Officer
  const [credentialsModalOpen, setCredentialsModalOpen] = useState(false);
  const [createdOfficer, setCreatedOfficer] = useState(null);
  const [copied, setCopied] = useState(false);

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
    initialPassword: '',
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
      initialPassword: '',
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
      initialPassword: '',
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
        setModalOpen(false);
        setTimeout(() => setSuccessToast(''), 4000);
      } else {
        const res = await addDepartment({
          ...formData,
          code: cleanCode
        });
        setModalOpen(false);
        const officer = res?.officerAccount || res?.data?.officerAccount || res?.department?.officerAccount;
        if (officer) {
          setCreatedOfficer({
            ...officer,
            departmentName: formData.name,
            departmentCode: cleanCode
          });
          setCredentialsModalOpen(true);

          // Dispatch official credentials to the given email
          const targetEmail = officer.email || formData.email;
          if (targetEmail) {
            sendDepartmentCredentialsEmail({
              toEmail: targetEmail,
              fullName: officer.fullName || formData.headOfficer,
              userCode: officer.userCode,
              temporaryPassword: officer.temporaryPassword || formData.initialPassword,
              departmentName: formData.name,
              departmentCode: cleanCode
            }).catch(err => console.warn('[EmailJS] Department credentials dispatch note:', err));
          }
        } else {
          setSuccessToast(`Department "${formData.name}" registered successfully.`);
          setTimeout(() => setSuccessToast(''), 4000);
        }
      }
    } catch (err) {
      setFormError(err.message || 'Failed to save department. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopyCredentials = () => {
    if (!createdOfficer) return;
    const text = `🏛️ NagrikSeva Municipal Department Credentials
Department: ${createdOfficer.departmentName} (${createdOfficer.departmentCode})
Nodal Officer: ${createdOfficer.fullName}
Official User ID: ${createdOfficer.userCode}
Official Email: ${createdOfficer.email}
Temporary Password: ${createdOfficer.temporaryPassword}
Portal Login: ${window.location.origin}/login?portal=officer`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
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

          return (
            <div
              key={dept.id}
              className="gov-card p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
            >
              <div>
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                      <Building2 className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                          {dept.name}
                        </h3>
                        <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {dept.code}
                        </span>
                      </div>
                      <span className="text-xs text-slate-500">
                        Nodal Lead: {dept.headOfficer || 'Designated Nodal Officer'}
                      </span>
                    </div>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      dept.isActive !== false
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
                    }`}
                  >
                    {dept.isActive !== false ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mb-4">
                  {dept.description || 'Civic infrastructure, grievance remediation, and specialized municipal operations.'}
                </p>

                {/* Contact Info */}
                <div className="space-y-1.5 text-xs text-slate-500 dark:text-slate-400 mb-4 bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-lg border border-slate-100 dark:border-slate-800">
                  {emailVal && (
                    <div className="flex items-center gap-2 truncate">
                      <Mail className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span className="truncate">{emailVal}</span>
                    </div>
                  )}
                  {phoneVal && (
                    <div className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>{phoneVal}</span>
                    </div>
                  )}
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 gap-2 text-center py-2 border-y border-slate-100 dark:border-slate-800 text-xs mb-4">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Active Cases</span>
                    <strong className="text-base text-blue-600 dark:text-blue-400 font-bold">
                      {activeCount}
                    </strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Resolved Cases</span>
                    <strong className="text-base text-emerald-600 dark:text-emerald-400 font-bold">
                      {resolvedCount}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-500 font-medium">
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
              label="Nodal Head Officer Name"
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
            placeholder="forestry.grievance@bbmp.gov.in"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required={!editingDept}
          />

          {!editingDept && (
            <div>
              <Input
                label="Custom Initial Password (Optional)"
                type="text"
                placeholder="Leave blank to auto-generate (Officer@[CODE]123)"
                value={formData.initialPassword}
                onChange={(e) => setFormData({ ...formData, initialPassword: e.target.value })}
              />
              <p className="text-[11px] text-slate-500 mt-1">
                An official user account (e.g. OFF003) will be automatically provisioned and credentials sent to the registered email address.
              </p>
            </div>
          )}

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

      {/* Credential Confirmation Modal */}
      {credentialsModalOpen && createdOfficer && (
        <Modal
          isOpen={credentialsModalOpen}
          onClose={() => setCredentialsModalOpen(false)}
          title="Department & Officer Account Created"
          description="Official credentials have been automatically provisioned for the nodal officer."
          footer={
            <div className="flex items-center justify-between w-full">
              <Button
                variant="secondary"
                icon={copied ? Check : Copy}
                onClick={handleCopyCredentials}
              >
                {copied ? 'Copied to Clipboard!' : 'Copy Credentials'}
              </Button>
              <Button
                variant="primary"
                onClick={() => setCredentialsModalOpen(false)}
              >
                Done &amp; Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                  Municipal Department Registered Successfully
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-0.5">
                  A dedicated Department Officer account has been created and linked to <strong>{createdOfficer.departmentName}</strong>.
                </p>
              </div>
            </div>

            {/* Credentials Card */}
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden bg-slate-50/70 dark:bg-slate-900/50">
              <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-blue-600" />
                  Nodal Officer Access Credentials
                </span>
                <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                  DEPARTMENT_OFFICER
                </span>
              </div>

              <div className="p-4 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {createdOfficer.departmentName} ({createdOfficer.departmentCode})
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Designated Officer:</span>
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {createdOfficer.fullName}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Official User ID:</span>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-900/40">
                    {createdOfficer.userCode}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-500">Registered Email:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {createdOfficer.email}
                  </span>
                </div>

                <div className="flex items-center justify-between bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/40">
                  <span className="text-amber-800 dark:text-amber-300 font-semibold">Initial Password:</span>
                  <code className="font-mono font-bold text-amber-900 dark:text-amber-200 text-sm">
                    {createdOfficer.temporaryPassword}
                  </code>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-500">Login Portal Gate:</span>
                  <a
                    href="/login?portal=officer"
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 font-medium hover:underline flex items-center gap-1"
                  >
                    Officer Sign In &rarr;
                  </a>
                </div>
              </div>
            </div>

            {/* Email Dispatch Notice */}
            <div className="p-3 rounded-lg bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 flex items-start gap-2.5 text-xs text-blue-800 dark:text-blue-300">
              <Send className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
              <span>
                {createdOfficer.emailDispatched
                  ? `An official onboarding email containing these credentials and security instructions has been automatically dispatched to ${createdOfficer.email} via Brevo SMTP.`
                  : `Credentials generated. Please share these credentials with ${createdOfficer.fullName} (${createdOfficer.email}). They can reset their password anytime using the Mail OTP recovery flow.`}
              </span>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Departments;
