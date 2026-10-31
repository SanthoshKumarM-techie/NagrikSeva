import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Building2,
  User,
  Users,
  CheckCircle2,
  AlertTriangle,
  ArrowRightLeft,
  Wrench,
  Clock,
  ShieldCheck,
  Send,
  UserPlus,
  XCircle,
  FileCheck2,
  Check,
  Navigation
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS, PRIORITIES } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import Input from '../../components/common/Input';
import Select from '../../components/common/Select';
import ComplaintTimeline from '../../components/dashboard/ComplaintTimeline';
import ComplaintProgressTracker from '../../components/dashboard/ComplaintProgressTracker';
import { formatDate, formatDateTime } from '../../utils/statusHelpers';
import { getImageUrl } from '../../utils/imageHelpers';

import complaintsApi from '../../api/complaints.api';
import { mapBackendComplaint } from '../../context/ComplaintContext';

export const ComplaintReview = () => {
  const { id } = useParams();
  const {
    complaints,
    departments,
    workers,
    acknowledgeComplaint,
    transferDepartment,
    assignWorker,
    verifyResolution,
  } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [backendComplaint, setBackendComplaint] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    complaintsApi.getComplaintById(id)
      .then((data) => {
        if (isMounted && data) {
          setBackendComplaint(mapBackendComplaint(data));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch complaint details from server:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [id]);

  const complaint = backendComplaint || complaints.find((c) => c.id === id || c.ticketNumber === id);

  const isPendingVerification =
    complaint?.status === COMPLAINT_STATUS.VERIFICATION ||
    complaint?.status === 'VERIFICATION' ||
    complaint?.status === 'Verification' ||
    complaint?.current_status === 'VERIFICATION';

  // Modals state
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [targetDeptId, setTargetDeptId] = useState('');
  const [transferReason, setTransferReason] = useState('');

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [assignmentNotes, setAssignmentNotes] = useState('');

  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [verifyDecision, setVerifyDecision] = useState(true);
  const [verifyNotes, setVerifyNotes] = useState('');

  const [photoModalUrl, setPhotoModalUrl] = useState(null);
  const [ackPriority, setAckPriority] = useState(complaint?.priority || PRIORITIES.HIGH);

  if (!complaint) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Complaint Not Found
        </h2>
        <Button variant="secondary" onClick={() => navigate('/officer/complaints')} className="mt-4">
          Return to Department Queue
        </Button>
      </div>
    );
  }

  // Handle Acknowledgement
  const handleAcknowledge = () => {
    acknowledgeComplaint(complaint.id, currentUser, ackPriority);
  };

  // Handle Inter-Department Transfer Request to Supervisor Admin
  const handleTransferSubmit = async () => {
    if (!transferReason.trim()) {
      alert('Mandatory transfer justification required.');
      return;
    }

    try {
      await transferDepartment(complaint.id, targetDeptId || null, transferReason, currentUser);
      alert('Transfer request sent to Supervisor Admin successfully. The supervisor will review and assign the responsible department.');
      setTransferModalOpen(false);
      navigate('/officer/transfers');
    } catch (err) {
      alert('Failed to submit transfer request: ' + (err.message || 'Error'));
    }
  };

  // Handle Worker Assignment
  const handleAssignSubmit = async () => {
    if (!selectedWorkerId) {
      alert('Please select a contractor or crew member.');
      return;
    }
    const worker = workers.find(w => w.id === selectedWorkerId);
    setBackendComplaint(prev => prev ? {
      ...prev,
      assignedWorkerId: selectedWorkerId,
      assignedWorkerName: worker?.name || 'Field Specialist',
      status: COMPLAINT_STATUS.WORKER_ASSIGNED,
      current_status: 'WORKER_ASSIGNED',
      timeline: [
        ...(prev.timeline || []),
        {
          id: `tl-${Date.now()}`,
          status: COMPLAINT_STATUS.WORKER_ASSIGNED,
          title: `Contractor & Crew Assigned: ${worker?.name || 'Contractor Crew'}`,
          description: assignmentNotes || `Assigned to ${worker?.name || 'specialist'}.`,
          timestamp: new Date().toISOString(),
          author: currentUser?.name || 'Department Officer',
          role: 'Department Officer'
        }
      ]
    } : null);

    try {
      await assignWorker(complaint.id, selectedWorkerId, assignmentNotes, currentUser, complaint.ticketNumber || complaint.id);
    } catch (err) {
      console.warn('Assign worker notice:', err.message);
    }
    setAssignModalOpen(false);
  };

  // Handle Resolution Verification (Approval or Rejection / Order Rework)
  const handleVerifySubmit = async () => {
    const targetStatus = verifyDecision ? COMPLAINT_STATUS.RESOLVED : COMPLAINT_STATUS.WORK_IN_PROGRESS;
    const rawTarget = verifyDecision ? 'RESOLVED' : 'WORK_IN_PROGRESS';

    setBackendComplaint(prev => prev ? {
      ...prev,
      status: targetStatus,
      current_status: rawTarget,
      timeline: [
        ...(prev.timeline || []),
        {
          id: `tl-${Date.now()}`,
          status: targetStatus,
          title: verifyDecision ? 'Resolution Verified & Approved' : 'Resolution Rejected — Re-work Required',
          description: verifyNotes || (verifyDecision ? 'Officer confirmed work meets municipal standards.' : 'Defects found during inspection. Remediation rework ordered.'),
          timestamp: new Date().toISOString(),
          author: currentUser?.name || 'Department Officer',
          role: 'Department Officer'
        }
      ]
    } : null);

    try {
      await verifyResolution(complaint.id, verifyDecision, verifyNotes, currentUser, complaint.ticketNumber || complaint.id);
    } catch (err) {
      console.warn('Verify resolution error:', err?.message);
    }
    setVerifyModalOpen(false);
  };

  // Available workers in department or matching specialty
  const availableWorkers = workers.filter(
    (w) => w.departmentId === complaint.departmentId || w.department === complaint.department
  );

  // Other departments for transfer
  const otherDepartments = departments.filter((d) => d.id !== complaint.departmentId);

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Grievance Review: ${complaint.id}`}
        description={`${complaint.title} &bull; Citizen: ${complaint.citizenName}`}
        tag={complaint.department}
        backUrl="/officer/complaints"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="secondary"
              icon={ArrowRightLeft}
              onClick={() => {
                setTargetDeptId(otherDepartments[0]?.id || '');
                setTransferReason('');
                setTransferModalOpen(true);
              }}
            >
              Transfer Department
            </Button>

            {complaint.status === COMPLAINT_STATUS.SUBMITTED || complaint.status === COMPLAINT_STATUS.TRANSFERRED ? (
              <Button
                variant="primary"
                icon={CheckCircle2}
                onClick={handleAcknowledge}
              >
                Acknowledge Ticket
              </Button>
            ) : null}

            {complaint.status !== COMPLAINT_STATUS.RESOLVED && complaint.status !== COMPLAINT_STATUS.CLOSED ? (
              <Button
                variant="primary"
                icon={UserPlus}
                onClick={() => {
                  setSelectedWorkerId(availableWorkers[0]?.id || workers[0]?.id || '');
                  setAssignmentNotes('');
                  setAssignModalOpen(true);
                }}
              >
                {complaint.assignedWorkerId ? 'Reassign Crew' : 'Assign Field Crew'}
              </Button>
            ) : null}

            {isPendingVerification && (
              <Button
                variant="success"
                icon={FileCheck2}
                onClick={() => {
                  setVerifyDecision(true);
                  setVerifyNotes('');
                  setVerifyModalOpen(true);
                }}
              >
                Verify Remediation
              </Button>
            )}
          </div>
        }
      />

      {/* Verification Notice Banner */}
      {isPendingVerification && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileCheck2 className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-200 block">
                Remediation Submitted for Officer Verification
              </span>
              <span className="text-amber-800 dark:text-amber-300">
                Worker {complaint.assignedWorkerName} has completed on-site work and submitted before/after photo evidence.
              </span>
            </div>
          </div>
          <Button
            size="sm"
            variant="success"
            onClick={() => {
              setVerifyDecision(true);
              setVerifyNotes('');
              setVerifyModalOpen(true);
            }}
          >
            Review &amp; Verify
          </Button>
        </div>
      )}

      {/* Visual Resolution Lifecycle Tracker */}
      <ComplaintProgressTracker complaint={complaint} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Dossier */}
        <div className="lg:col-span-2 space-y-6">
          <div className="gov-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-600">
                  {complaint.id}
                </span>
                <Badge status={complaint.status} />
                <Badge priority={complaint.priority} />
              </div>
              <span className="text-xs text-slate-500">
                SLA: {formatDate(complaint.slaDeadline)}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                {complaint.title}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {complaint.description}
              </p>
            </div>

            {/* Core Info Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-400 block mb-0.5">Location &amp; Ward:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {complaint.location}
                </span>
                <span className="text-[11px] text-slate-500 block">{complaint.ward}</span>
                {complaint.latitude && complaint.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    title="Open live coordinates in Google Maps"
                  >
                    <Navigation className="w-3 h-3 text-emerald-500" />
                    GPS: {Number(complaint.latitude).toFixed(5)}° N, {Number(complaint.longitude).toFixed(5)}° E &bull; View on Map &rarr;
                  </a>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Citizen Complainant:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {complaint.citizenName} ({complaint.citizenPhone})
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Users className="w-3 h-3 text-slate-400" />
                  {complaint.supporterCount} neighborhood endorsements
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Current Department:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {complaint.department}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Allocated Worker:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {complaint.assignedWorkerName || 'Pending Crew Allocation'}
                </span>
              </div>
            </div>
          </div>

          {/* Inter-Department Transfer History */}
          {complaint.transfers && complaint.transfers.length > 0 && (
            <div className="gov-card p-5 border-l-4 border-l-purple-600">
              <h3 className="text-xs font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ArrowRightLeft className="w-4 h-4" />
                Inter-Department Jurisdictional Transfers
              </h3>
              <div className="space-y-2">
                {complaint.transfers.map((tr) => (
                  <div key={tr.id} className="text-xs bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
                    <div className="flex justify-between items-center text-slate-600 dark:text-slate-300 font-medium">
                      <span>{tr.fromDepartmentName} &rarr; {tr.toDepartmentName}</span>
                      <span className="text-[10px] text-slate-400">{formatDateTime(tr.timestamp)}</span>
                    </div>
                    <p className="text-[11px] text-slate-700 dark:text-slate-300 mt-1 italic">
                      "{tr.reason}"
                    </p>
                    <span className="text-[10px] text-slate-400 block mt-1">
                      Transferred By: {tr.transferredBy}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Photos */}
          <div className="gov-card p-5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Photographic Evidence
            </h3>
            {complaint.evidence && complaint.evidence.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.evidence.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setPhotoModalUrl(getImageUrl(photo))}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 h-32 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                  >
                    <img src={getImageUrl(photo)} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                      Click to inspect
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No photos attached.</p>
            )}
          </div>

          {/* Field Remediation Proof (Before / After Photos) */}
          {complaint.resolutionEvidence && (
            <div className="gov-card p-5 border-emerald-300 dark:border-emerald-800">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Field Remediation Submission
                </h3>
              </div>

              {complaint.resolutionEvidence.completionNotes && (
                <div className="p-3 rounded-lg bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40 text-xs text-slate-700 dark:text-slate-300 mb-4">
                  <strong>Worker Report:</strong> {complaint.resolutionEvidence.completionNotes}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.resolutionEvidence.beforePhotos?.length > 0 && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-500 mb-1">
                      Before Work:
                    </span>
                    <img
                      src={getImageUrl(complaint.resolutionEvidence.beforePhotos[0])}
                      alt="Before"
                      onClick={() => setPhotoModalUrl(getImageUrl(complaint.resolutionEvidence.beforePhotos[0]))}
                      className="w-full h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer"
                    />
                  </div>
                )}
                {complaint.resolutionEvidence.afterPhotos?.length > 0 && (
                  <div>
                    <span className="block text-xs font-semibold text-emerald-600 mb-1">
                      After Work (Remediated):
                    </span>
                    <img
                      src={getImageUrl(complaint.resolutionEvidence.afterPhotos[0])}
                      alt="After"
                      onClick={() => setPhotoModalUrl(getImageUrl(complaint.resolutionEvidence.afterPhotos[0]))}
                      className="w-full h-40 object-cover rounded-lg border border-emerald-300 dark:border-emerald-700 cursor-pointer"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Timeline & Officer Quick Actions */}
        <div className="space-y-6">
          {/* Quick Action Widget */}
          <div className="gov-card p-5 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Officer Actions
            </h3>

            <div className="space-y-2">
              <Button
                variant="secondary"
                size="sm"
                icon={ArrowRightLeft}
                className="w-full justify-start"
                onClick={() => {
                  setTargetDeptId(otherDepartments[0]?.id || '');
                  setTransferReason('');
                  setTransferModalOpen(true);
                }}
              >
                Transfer to Another Department
              </Button>

              <Button
                variant="secondary"
                size="sm"
                icon={UserPlus}
                className="w-full justify-start"
                onClick={() => {
                  setSelectedWorkerId(availableWorkers[0]?.id || workers[0]?.id || '');
                  setAssignmentNotes('');
                  setAssignModalOpen(true);
                }}
              >
                {complaint.assignedWorkerId ? 'Reassign Contractor & Crew' : 'Assign Contractor & Crew'}
              </Button>

              {isPendingVerification && (
                <Button
                  variant="success"
                  size="sm"
                  icon={CheckCircle2}
                  className="w-full justify-start"
                  onClick={() => {
                    setVerifyDecision(true);
                    setVerifyNotes('');
                    setVerifyModalOpen(true);
                  }}
                >
                  Verify Field Completion
                </Button>
              )}
            </div>
          </div>

          {/* Timeline Feed */}
          <div className="gov-card p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              Audit Timeline
            </h3>
            <ComplaintTimeline
              timeline={complaint.timeline}
              transfers={complaint.transfers}
            />
          </div>
        </div>
      </div>

      {/* MODAL 1: Request Department Transfer */}
      <Modal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        title="Request Department Transfer"
        description="Submit a transfer request to the Supervisor Admin. The supervisor will review the grievance and assign it to the responsible municipal department."
        footer={
          <>
            <Button variant="secondary" onClick={() => setTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={ArrowRightLeft}
              onClick={handleTransferSubmit}
              disabled={!transferReason.trim()}
            >
              Send Request to Supervisor
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="p-3 bg-purple-50 dark:bg-purple-950/30 rounded-lg border border-purple-100 dark:border-purple-900/40 text-xs text-purple-900 dark:text-purple-300">
            <strong>Supervisor Routing Policy:</strong> Department officers cannot directly reassign departments. Your request will be queued for the Supervisor Admin to approve and reallocate to the correct department.
          </div>

          <Select
            label="Suggested Destination Department (Optional)"
            value={targetDeptId}
            onChange={(e) => setTargetDeptId(e.target.value)}
            options={[
              { value: '', label: '-- Recommend to Supervisor or Leave for Admin Decision --' },
              ...otherDepartments.map((d) => ({ value: d.id, label: `${d.name} (${d.code})` }))
            ]}
          />

          <Input
            label="Mandatory Transfer Justification / Technical Reason"
            type="textarea"
            rows={4}
            placeholder="Explain to the supervisor why this complaint does not belong to your department and why another department is responsible..."
            value={transferReason}
            onChange={(e) => setTransferReason(e.target.value)}
            required
          />
        </div>
      </Modal>

      {/* MODAL 2: Assign Worker */}
      <Modal
        isOpen={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        title={complaint.assignedWorkerId ? "Reassign Contractor & Crew / Reorder" : "Assign Contractor & Crew"}
        description={complaint.assignedWorkerId ? "Reallocate this work order or assign a different specialist to remediate the civic issue." : "Deploy on-ground staff to conduct site inspection and commence remediation."}
        footer={
          <>
            <Button variant="secondary" onClick={() => setAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={UserPlus}
              onClick={handleAssignSubmit}
              disabled={!selectedWorkerId}
            >
              {complaint.assignedWorkerId ? "Confirm Reassignment / Reorder" : "Confirm Assignment"}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Select
            label="Select Field Specialist"
            value={selectedWorkerId}
            onChange={(e) => setSelectedWorkerId(e.target.value)}
            options={workers.map((w) => ({
              value: w.id,
              label: `${w.name} — ${w.department} (${w.activeTasks} active tasks, Rating: ${w.rating})`,
            }))}
            required
          />

          <Input
            label="Internal Deployment Instructions / Priority Notes"
            type="textarea"
            rows={3}
            placeholder="e.g. Carry cold-mix asphalt, place safety cones during peak morning hours."
            value={assignmentNotes}
            onChange={(e) => setAssignmentNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* MODAL 3: Verify Resolution */}
      <Modal
        isOpen={verifyModalOpen}
        onClose={() => setVerifyModalOpen(false)}
        title="Remediation Quality Verification & Rework Control"
        description="Officer quality sign-off on completed field work. Approving marks grievance as Resolved; rejecting orders mandatory crew rework."
        footer={
          <>
            <Button variant="secondary" onClick={() => setVerifyModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={verifyDecision ? 'success' : 'danger'}
              onClick={handleVerifySubmit}
            >
              {verifyDecision ? 'Approve & Mark Resolved' : 'Reject & Order Rework'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setVerifyDecision(true)}
              className={`flex-1 p-3 rounded-lg border text-xs font-semibold transition-all ${verifyDecision
                  ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
            >
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
              Approve Resolution
            </button>
            <button
              type="button"
              onClick={() => setVerifyDecision(false)}
              className={`flex-1 p-3 rounded-lg border text-xs font-semibold transition-all ${!verifyDecision
                  ? 'border-rose-600 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600'
                }`}
            >
              <XCircle className="w-4 h-4 mx-auto mb-1 text-rose-600" />
              Reject &amp; Send for Rework
            </button>
          </div>

          <Input
            label={verifyDecision ? "Officer Quality Sign-off Remarks" : "Mandatory Rework Instructions for Field Crew"}
            type="textarea"
            rows={3}
            placeholder={verifyDecision ? 'Work meets municipal standards. Clean site.' : 'Asphalt uneven; requires hot roller compaction.'}
            value={verifyNotes}
            onChange={(e) => setVerifyNotes(e.target.value)}
          />
        </div>
      </Modal>

      {/* Photo Modal */}
      {photoModalUrl && (
        <Modal isOpen={!!photoModalUrl} onClose={() => setPhotoModalUrl(null)} title="Photo Zoom">
          <img src={getImageUrl(photoModalUrl)} alt="Zoom" className="max-h-[70vh] rounded-lg object-contain mx-auto" />
        </Modal>
      )}
    </div>
  );
};

export default ComplaintReview;

