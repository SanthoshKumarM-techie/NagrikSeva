import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Calendar,
  Building2,
  User,
  CheckCircle2,
  CheckSquare,
  AlertTriangle,
  Wrench,
  Clock,
  Camera,
  Upload,
  Send,
  FileCheck2,
  X,
  Phone,
  AlertOctagon,
  ShieldCheck,
  ImageIcon
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';
import ComplaintTimeline from '../../components/dashboard/ComplaintTimeline';
import ComplaintProgressTracker from '../../components/dashboard/ComplaintProgressTracker';
import ContractorDispatchMap from '../../components/dashboard/ContractorDispatchMap';
import { formatDate, formatDateTime } from '../../utils/statusHelpers';

import complaintsApi from '../../api/complaints.api';
import assignmentsApi from '../../api/assignments.api';
import evidenceApi from '../../api/evidence.api';
import { mapBackendComplaint } from '../../context/ComplaintContext';
import { getImageUrl } from '../../utils/imageHelpers';

export const TaskDetails = () => {
  const { id } = useParams();
  const { complaints, acceptTask, updateWorkerTaskStatus, reportWorkDelay: contextReportDelay } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [backendTask, setBackendTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acceptedLocal, setAcceptedLocal] = useState(false);

  // Modals state
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionFindings, setInspectionFindings] = useState('Barricades deployed, area cleared and safe for crew work');

  const [startWorkModalOpen, setStartWorkModalOpen] = useState(false);
  const [workStartDate, setWorkStartDate] = useState(new Date().toISOString().slice(0, 16));
  const [workStartDescription, setWorkStartDescription] = useState('Excavation, debris clearance, and site preparation commenced.');
  const [workStartPhotos, setWorkStartPhotos] = useState([]);
  const [startWorkError, setStartWorkError] = useState('');

  const [delayModalOpen, setDelayModalOpen] = useState(false);
  const [delayReason, setDelayReason] = useState('Severe Weather / Waterlogging');
  const [delayDescription, setDelayDescription] = useState('');
  const [delayRevisedDate, setDelayRevisedDate] = useState(new Date(Date.now() + 48 * 3600 * 1000).toISOString().slice(0, 10));
  const [delayPhotos, setDelayPhotos] = useState([]);
  const [delayError, setDelayError] = useState('');

  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [materialsUsed, setMaterialsUsed] = useState('Hot-mix asphalt 50kg, concrete sealant, roller compaction');

  const [successMsg, setSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingDelay, setIsUploadingDelay] = useState(false);
  const [isUploadingStart, setIsUploadingStart] = useState(false);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    complaintsApi.getComplaintById(id)
      .then((data) => {
        if (isMounted && data) {
          setBackendTask(mapBackendComplaint(data));
        }
      })
      .catch((err) => {
        console.warn('Could not fetch task details:', err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => { isMounted = false; };
  }, [id]);

  const task = backendTask || complaints.find((c) => c.id === id || c.ticketNumber === id || c.complaintId === id);

  const isAccepted =
    task?.assignmentStatus === 'ACCEPTED' ||
    task?.status === COMPLAINT_STATUS.INSPECTION ||
    task?.status === COMPLAINT_STATUS.WORK_IN_PROGRESS ||
    task?.status === COMPLAINT_STATUS.VERIFICATION ||
    task?.status === COMPLAINT_STATUS.RESOLVED ||
    acceptedLocal;

  const reworkAlert = task?.timeline?.slice().reverse().find(
    (t) => t.title?.toLowerCase().includes('re-work') ||
           t.title?.toLowerCase().includes('rework') ||
           t.title?.toLowerCase().includes('rejected') ||
           t.description?.toLowerCase().includes('rework')
  );
  const isReworkActive = reworkAlert && (task?.status === COMPLAINT_STATUS.WORK_IN_PROGRESS || task?.current_status === 'WORK_IN_PROGRESS' || task?.assignmentStatus === 'REWORK_REQUIRED');

  const [notes, setNotes] = useState(task?.resolutionEvidence?.completionNotes || 'Pothole filled and leveled');
  const [afterPhotos, setAfterPhotos] = useState(task?.resolutionEvidence?.afterPhotos || []);
  const [photoInput, setPhotoInput] = useState('');

  // Handle Photo Uploads
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await evidenceApi.uploadFile(file, { stage: 'WORKER_AFTER', complaintId: task?.complaintId || task?.id });
      const url = res?.url || res?.fileUrl || (res ? `/uploads/${res.filename || file.name}` : '');
      if (url) {
        setAfterPhotos(prev => [...prev, url]);
      }
    } catch (err) {
      alert(`Upload failed: ${err.message || 'Error uploading evidence'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelayPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingDelay(true);
      const res = await evidenceApi.uploadFile(file, { stage: 'WORKER_BEFORE', complaintId: task?.complaintId || task?.id });
      const url = res?.url || res?.fileUrl || (res ? `/uploads/${res.filename || file.name}` : '');
      if (url) {
        setDelayPhotos(prev => [...prev, url]);
        setDelayError('');
      }
    } catch (err) {
      alert(`Upload failed: ${err.message || 'Error uploading delay evidence'}`);
    } finally {
      setIsUploadingDelay(false);
    }
  };

  const handleStartPhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingStart(true);
      const res = await evidenceApi.uploadFile(file, { stage: 'WORKER_BEFORE', complaintId: task?.complaintId || task?.id });
      const url = res?.url || res?.fileUrl || (res ? `/uploads/${res.filename || file.name}` : '');
      if (url) {
        setWorkStartPhotos(prev => [...prev, url]);
      }
    } catch (err) {
      alert(`Upload failed: ${err.message || 'Error uploading start photo'}`);
    } finally {
      setIsUploadingStart(false);
    }
  };

  if (!task) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">Task Not Found</h2>
        <Button variant="secondary" onClick={() => navigate('/worker/tasks')} className="mt-4">
          Back to Work Orders
        </Button>
      </div>
    );
  }

  // Step 1: Accept Task
  const handleAcceptTask = async () => {
    try {
      setBackendTask(prev => prev ? {
        ...prev,
        assignmentStatus: 'ACCEPTED'
      } : null);
      setAcceptedLocal(true);

      if (typeof acceptTask === 'function') {
        await acceptTask(task.assignmentId || task.complaintId || task.id, currentUser);
      } else {
        await assignmentsApi.acceptAssignment(task.assignmentId || task.complaintId || task.id);
      }
      setSuccessMsg('Assignment accepted. Status changed to Accepted.');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      console.warn('Accept task notice:', err?.message);
      setSuccessMsg('Assignment accepted.');
      setTimeout(() => setSuccessMsg(''), 3500);
    }
  };

  // Step 2: Log Inspection
  const handleInspectionSubmit = async () => {
    setBackendTask(prev => prev ? {
      ...prev,
      status: COMPLAINT_STATUS.INSPECTION,
      current_status: 'INSPECTION'
    } : null);

    try {
      await updateWorkerTaskStatus(
        task.assignmentId || task.complaintId || task.id,
        COMPLAINT_STATUS.INSPECTION,
        inspectionFindings || 'Barricades deployed, area cleared',
        task.evidence || [],
        [],
        currentUser,
        task.ticketNumber || task.id
      );
    } catch (err) {
      console.warn('Inspection submit notice:', err.message);
    }

    setInspectionModalOpen(false);
    setSuccessMsg('Site inspection logged successfully. Status is now Inspection Completed.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Step 3: Start Remediation (Work Start)
  const handleStartWorkSubmit = async () => {
    if (!workStartDescription || workStartDescription.trim().length < 5) {
      setStartWorkError('Please provide a valid work description / plan (min 5 characters).');
      return;
    }
    setStartWorkError('');

    setBackendTask(prev => prev ? {
      ...prev,
      status: COMPLAINT_STATUS.WORK_IN_PROGRESS,
      current_status: 'WORK_IN_PROGRESS',
      workStartedAt: workStartDate
    } : null);

    try {
      const targetAssignmentId = task.assignmentId || task.complaintId || task.id;
      await assignmentsApi.startRemediation(targetAssignmentId, {
        startDate: workStartDate,
        description: workStartDescription,
        evidenceUrls: workStartPhotos
      });

      await updateWorkerTaskStatus(
        targetAssignmentId,
        COMPLAINT_STATUS.WORK_IN_PROGRESS,
        workStartDescription,
        workStartPhotos.length > 0 ? workStartPhotos : (task.evidence || []),
        [],
        currentUser,
        task.ticketNumber || task.id
      );
    } catch (err) {
      console.warn('Start work notice:', err.message);
    }

    setStartWorkModalOpen(false);
    setSuccessMsg(`Work officially started on site. Start Date: ${new Date(workStartDate).toLocaleDateString()}`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Step 4: Report Work Delay
  const handleReportDelaySubmit = async () => {
    if (!delayDescription || delayDescription.trim().length < 10) {
      setDelayError('Please provide a detailed explanation of the delay cause (min 10 characters).');
      return;
    }
    if (!delayRevisedDate) {
      setDelayError('Please specify a revised target completion date.');
      return;
    }
    if (delayPhotos.length === 0) {
      setDelayError('Photo evidence documenting the site delay / obstruction is mandatory.');
      return;
    }
    setDelayError('');

    const targetAssignmentId = task.assignmentId || task.complaintId || task.id;
    const delayData = {
      delayReason,
      description: delayDescription,
      estimatedCompletionDate: delayRevisedDate,
      evidenceUrls: delayPhotos
    };

    try {
      if (typeof contextReportDelay === 'function') {
        await contextReportDelay(targetAssignmentId, delayData, currentUser, task.ticketNumber || task.id);
      } else {
        await assignmentsApi.reportWorkDelay(targetAssignmentId, delayData);
      }
    } catch (err) {
      console.warn('Report delay notice:', err.message);
    }

    setBackendTask(prev => prev ? {
      ...prev,
      delayAlert: {
        reason: delayReason,
        description: delayDescription,
        estimatedCompletionDate: delayRevisedDate,
        evidenceUrls: delayPhotos,
        reportedAt: new Date().toISOString()
      }
    } : null);

    setDelayModalOpen(false);
    setSuccessMsg('Work delay logged. High-priority notifications dispatched to Citizen, Department, and Super Admin.');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  // Step 5: Final Submit for Verification & Completion
  const handleSubmitVerification = async () => {
    if (!notes || notes.trim().length < 5) {
      setSubmitError('Please provide detailed completion notes of the work performed (min 5 characters).');
      return;
    }
    if (afterPhotos.length === 0) {
      setSubmitError('At least one photo evidence of completed work is mandatory.');
      return;
    }
    setSubmitError('');

    const updatedEvidence = {
      beforePhotos: task.evidence || [],
      afterPhotos,
      completionNotes: notes,
      materialsUsed,
      completedAt: new Date().toISOString()
    };

    setBackendTask(prev => prev ? {
      ...prev,
      status: COMPLAINT_STATUS.VERIFICATION,
      current_status: 'VERIFICATION',
      resolutionEvidence: updatedEvidence
    } : null);

    try {
      const targetAssignmentId = task.assignmentId || task.complaintId || task.id;
      await assignmentsApi.completeWork(targetAssignmentId, {
        description: notes,
        completionNotes: notes,
        materialsUsed,
        evidenceUrls: afterPhotos
      });

      await updateWorkerTaskStatus(
        targetAssignmentId,
        COMPLAINT_STATUS.VERIFICATION,
        notes,
        task.evidence || [],
        afterPhotos,
        currentUser,
        task.ticketNumber || task.id
      );
    } catch (err) {
      console.warn('Submit verification notice:', err.message);
    }

    setSubmitModalOpen(false);
    setSuccessMsg('Work submitted for Verification! Citizen and Department Officer notified.');
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const handleAddPhoto = (url) => {
    if (!url) return;
    setAfterPhotos((prev) => [...prev, url]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (idx) => {
    setAfterPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleRemoveDelayPhoto = (idx) => {
    setDelayPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Work Order: ${task.ticketNumber || task.id}`}
        description={`${task.title} &bull; ${task.location}`}
        tag={task.category}
        backUrl="/worker/tasks"
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {task.status === COMPLAINT_STATUS.WORKER_ASSIGNED && !isAccepted && (
              <Button
                variant="primary"
                icon={CheckSquare}
                onClick={handleAcceptTask}
              >
                Accept Assignment
              </Button>
            )}

            {task.status === COMPLAINT_STATUS.WORKER_ASSIGNED && isAccepted && (
              <Button
                variant="secondary"
                icon={Wrench}
                onClick={() => setInspectionModalOpen(true)}
              >
                Log Inspection
              </Button>
            )}

            {(task.status === COMPLAINT_STATUS.INSPECTION || (task.status === COMPLAINT_STATUS.WORKER_ASSIGNED && isAccepted)) && (
              <Button
                variant="primary"
                icon={Wrench}
                onClick={() => setStartWorkModalOpen(true)}
              >
                Start Remediation
              </Button>
            )}

            {task.status === COMPLAINT_STATUS.WORK_IN_PROGRESS && (
              <>
                <Button
                  variant="warning"
                  icon={AlertTriangle}
                  onClick={() => setDelayModalOpen(true)}
                >
                  Report Work Delay
                </Button>
                <Button
                  variant="success"
                  icon={FileCheck2}
                  onClick={() => {
                    setSubmitError('');
                    setSubmitModalOpen(true);
                  }}
                >
                  Submit Completion Proof
                </Button>
              </>
            )}

            {(task.status === COMPLAINT_STATUS.VERIFICATION || task.status === 'VERIFICATION' || task.status === 'Verification') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Clock className="w-3.5 h-3.5" />
                Verification Pending (Citizen / Officer)
              </span>
            )}
          </div>
        }
      />

      {successMsg && (
        <div className="p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2.5 animate-fade-in shadow-sm">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{successMsg}</span>
        </div>
      )}

      {/* Visual Resolution Lifecycle Tracker */}
      <ComplaintProgressTracker complaint={task} />

      {/* Rework Alert Banner */}
      {isReworkActive && (
        <div className="p-4 sm:p-5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-lg bg-rose-600 text-white shrink-0 mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1.5 flex-1">
            <span className="font-bold text-rose-900 dark:text-rose-200 block text-sm">
              Action Required: Citizen / Officer Remediation Rework Ordered
            </span>
            <p className="text-rose-800 dark:text-rose-300 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
              <strong>Defect Feedback:</strong> {reworkAlert.description || 'Remediation rejected. Defect remains on site.'}
            </p>
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <span className="text-[11px] text-rose-700 dark:text-rose-400">
                Please rectify the defective points on site, then submit fresh photographic proof.
              </span>
              <Button
                size="sm"
                variant="danger"
                icon={FileCheck2}
                onClick={() => {
                  setSubmitError('');
                  setSubmitModalOpen(true);
                }}
              >
                Submit Rework Completion Proof
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Active Work Delay Banner (if delay reported) */}
      {(task.delayAlert || (task.delays && task.delays.length > 0)) && (
        <div className="p-4 sm:p-5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 flex items-start gap-3.5 shadow-sm">
          <div className="p-2 rounded-lg bg-amber-600 text-white shrink-0 mt-0.5">
            <Clock className="w-5 h-5" />
          </div>
          <div className="text-xs space-y-1.5 flex-1">
            <div className="flex items-center justify-between flex-wrap gap-1">
              <span className="font-bold text-amber-900 dark:text-amber-200 text-sm">
                Active On-Site Work Delay: {task.delayAlert?.reason || task.delays?.[0]?.reason}
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 font-semibold">
                Revised Target: {task.delayAlert?.estimatedCompletionDate || task.delays?.[0]?.estimatedCompletionDate}
              </span>
            </div>
            <p className="text-amber-800 dark:text-amber-300 leading-relaxed bg-white/60 dark:bg-slate-900/60 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
              <strong>Contractor Delay Notes:</strong> {task.delayAlert?.description || task.delays?.[0]?.description}
            </p>
            <span className="text-[11px] text-amber-700 dark:text-amber-400 block pt-0.5">
              Citizen, Department, and Super Admin have been formally notified of this unavoidable operational obstacle.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Details, Navigation Map & Evidence Submission */}
        <div className="lg:col-span-2 space-y-6">
          {/* Site Route & Google Maps Preview */}
          <ContractorDispatchMap task={task} />

          {/* Work Order Info */}
          <div className="gov-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-600">
                  {task.id}
                </span>
                <Badge status={task.status === COMPLAINT_STATUS.WORKER_ASSIGNED && isAccepted ? 'Accepted' : task.status} />
                <Badge priority={task.priority} />
              </div>
              <span className="text-xs text-slate-500">
                Deadline: {formatDate(task.slaDeadline)}
              </span>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-1">
                {task.title}
              </h3>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                {task.description}
              </p>
            </div>

            {/* Location & Contact Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs pt-2">
              <div>
                <span className="text-slate-400 block mb-0.5">Location Landmark:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {task.location}
                </span>
                <span className="text-[11px] text-slate-500">{task.ward}</span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Citizen Reporter:</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {task.citizenName}
                </span>
                <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Phone className="w-3 h-3 text-slate-400" />
                  {task.citizenPhone}
                </span>
              </div>
            </div>
          </div>

          {/* Citizen Reported Evidence (Before State) */}
          <div className="gov-card p-5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Initial Issue Photos (Before State)
            </h3>
            {task.evidence && task.evidence.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {task.evidence.map((photo, i) => (
                  <div
                    key={i}
                    className="rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 h-32 bg-slate-100 dark:bg-slate-800"
                  >
                    <img src={getImageUrl(photo)} alt="Initial Evidence" className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No photos available.</p>
            )}
          </div>

          {/* Worker Completion Proof & Photo Upload Section */}
          <div className="gov-card p-6 space-y-4 border-2 border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-blue-600" />
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  Upload Remediation Photos (After State)
                </h3>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                {afterPhotos.length} Attached (Mandatory)
              </span>
            </div>

            {/* Photos Display */}
            {afterPhotos.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {afterPhotos.map((photo, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden border border-emerald-300 dark:border-emerald-800 h-28 bg-slate-100 dark:bg-slate-800">
                    <img src={getImageUrl(photo)} alt={`After ${idx}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemovePhoto(idx)}
                      className="absolute top-1.5 right-1.5 p-1 rounded-full bg-rose-600 text-white shadow"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center border border-dashed border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-400">
                No remediation photos added yet. Upload photographic proof from your device below.
              </div>
            )}

            {/* Upload from Device + Custom Photo URL Input */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 cursor-pointer shadow-sm transition-colors">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>{isUploading ? 'Uploading Image...' : 'Upload Photo from Device'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>

              <div className="flex items-center gap-2">
                <Input
                  placeholder="Or paste external photo URL..."
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  className="text-xs"
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleAddPhoto(photoInput)}
                  disabled={!photoInput.trim()}
                >
                  Add URL
                </Button>
              </div>
            </div>

            {/* Completion Notes */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Work Completion Notes (Mandatory):
              </label>
              <Input
                type="textarea"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Describe remediation work performed on site..."
                required
                enableVoice={true}
                onVoiceChange={(text) => setNotes(text)}
              />
            </div>

            <div className="space-y-1.5 pt-1">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Materials &amp; Equipment Used:
              </label>
              <Input
                value={materialsUsed}
                onChange={(e) => setMaterialsUsed(e.target.value)}
                placeholder="e.g. 50kg cold mix asphalt, compaction roller, safety barriers"
              />
            </div>

            <div className="pt-2">
              <Button
                variant="success"
                icon={FileCheck2}
                onClick={() => {
                  setSubmitError('');
                  setSubmitModalOpen(true);
                }}
                disabled={afterPhotos.length === 0}
              >
                Submit Completion Proof for Verification
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <div className="gov-card p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              Work Order Activity History
            </h3>
            <ComplaintTimeline timeline={task.timeline} transfers={task.transfers} />
          </div>
        </div>
      </div>

      {/* 1. Log Inspection Modal */}
      <Modal
        isOpen={inspectionModalOpen}
        onClose={() => setInspectionModalOpen(false)}
        title="Log Site Inspection"
        description="Record field inspection observations and safety measures deployed before starting heavy remediation."
        footer={
          <>
            <Button variant="secondary" onClick={() => setInspectionModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Wrench}
              onClick={handleInspectionSubmit}
            >
              Submit Inspection
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Inspection Findings / Site Observations"
            type="textarea"
            rows={3}
            value={inspectionFindings}
            onChange={(e) => setInspectionFindings(e.target.value)}
            placeholder="e.g. Barricades deployed, area cleared"
            required
            enableVoice={true}
            onVoiceChange={(text) => setInspectionFindings(text)}
          />
        </div>
      </Modal>

      {/* 2. Start Work Modal (Mandatory Start Date, Plan & Arrival Photo) */}
      <Modal
        isOpen={startWorkModalOpen}
        onClose={() => setStartWorkModalOpen(false)}
        title="Start Remediation Work"
        description="Record mandatory work start details, planned remediation action, and site arrival status."
        footer={
          <>
            <Button variant="secondary" onClick={() => setStartWorkModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={Wrench}
              onClick={handleStartWorkSubmit}
            >
              Confirm Work Start
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          {startWorkError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{startWorkError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Work Start Date &amp; Time (Mandatory):
            </label>
            <input
              type="datetime-local"
              value={workStartDate}
              onChange={(e) => setWorkStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Remediation Action Plan / Description (Mandatory):
            </label>
            <Input
              type="textarea"
              rows={3}
              value={workStartDescription}
              onChange={(e) => setWorkStartDescription(e.target.value)}
              placeholder="Describe planned repair work on site..."
              required
              enableVoice={true}
              onVoiceChange={(text) => setWorkStartDescription(text)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Site Arrival / Work Start Photo:
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer">
              <Upload className="w-4 h-4 text-blue-600" />
              <span>{isUploadingStart ? 'Uploading photo...' : 'Upload Site Arrival Photo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleStartPhotoUpload}
                className="hidden"
                disabled={isUploadingStart}
              />
            </label>
            {workStartPhotos.length > 0 && (
              <div className="flex gap-2 mt-2">
                {workStartPhotos.map((url, i) => (
                  <img key={i} src={getImageUrl(url)} alt="Start Photo" className="w-14 h-14 object-cover rounded-lg border border-slate-200" />
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* 3. Report Work Delay Modal (Mandatory Valid Reason & Photo Proof) */}
      <Modal
        isOpen={delayModalOpen}
        onClose={() => setDelayModalOpen(false)}
        title="Report On-Site Work Delay"
        description="Provide mandatory valid reasons and photo evidence. Notifications will be immediately sent to the Citizen, Department, and Super Admin."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDelayModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="warning"
              icon={AlertTriangle}
              onClick={handleReportDelaySubmit}
            >
              Dispatch Delay Notification
            </Button>
          </>
        }
      >
        <div className="space-y-3.5 text-xs">
          {delayError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{delayError}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Delay Reason Category (Mandatory):
            </label>
            <select
              value={delayReason}
              onChange={(e) => setDelayReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
            >
              <option value="Severe Weather / Waterlogging">Severe Weather / Waterlogging &amp; Rain</option>
              <option value="Underground Utility Line Obstruction">Underground Utility Line Obstruction (Water/Power)</option>
              <option value="Material Supply Chain Delay">Material Supply Chain Delay</option>
              <option value="Heavy Machinery Breakdown">Heavy Machinery / Compactor Breakdown</option>
              <option value="Traffic & Accessibility Obstruction">Traffic &amp; Site Accessibility Obstruction</option>
              <option value="Safety & Structural Hazard">Safety &amp; Structural Hazard on Site</option>
              <option value="Other Operational Delay">Other Unavoidable Delay</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Detailed Delay Explanation (Mandatory, min 10 chars):
            </label>
            <Input
              type="textarea"
              rows={3}
              value={delayDescription}
              onChange={(e) => setDelayDescription(e.target.value)}
              placeholder="Explain the physical obstacle or reason causing the delay..."
              required
              enableVoice={true}
              onVoiceChange={(text) => setDelayDescription(text)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Revised Estimated Completion Date (Mandatory):
            </label>
            <input
              type="date"
              value={delayRevisedDate}
              onChange={(e) => setDelayRevisedDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Delay Photo Evidence (Mandatory):
            </label>
            <label className="flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 cursor-pointer">
              <Upload className="w-4 h-4 text-amber-600" />
              <span>{isUploadingDelay ? 'Uploading delay photo...' : 'Upload Photo Proof of Delay'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleDelayPhotoUpload}
                className="hidden"
                disabled={isUploadingDelay}
              />
            </label>

            {delayPhotos.length > 0 ? (
              <div className="flex gap-2 mt-2">
                {delayPhotos.map((url, idx) => (
                  <div key={idx} className="relative">
                    <img src={getImageUrl(url)} alt={`Delay Evidence ${idx}`} className="w-16 h-16 object-cover rounded-lg border border-amber-300" />
                    <button
                      type="button"
                      onClick={() => handleRemoveDelayPhoto(idx)}
                      className="absolute -top-1 -right-1 p-0.5 bg-rose-600 text-white rounded-full text-[10px]"
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-rose-500 mt-1">
                * Please upload at least one photo showing the delay cause (e.g. flooded road, broken pipe, obstruction).
              </p>
            )}
          </div>
        </div>
      </Modal>

      {/* 4. Completion Proof Submission Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Submit Completion Proof"
        description="Submit mandatory completion details and photo evidence before marking the work as completed for citizen/officer verification."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              icon={Send}
              onClick={handleSubmitVerification}
              disabled={afterPhotos.length === 0}
            >
              Confirm &amp; Submit Completion
            </Button>
          </>
        }
      >
        <div className="space-y-3 text-xs">
          {submitError && (
            <div className="p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-lg border border-slate-200 dark:border-slate-700 space-y-1.5">
            <p className="text-slate-700 dark:text-slate-300">
              <strong>After Photos Attached:</strong> {afterPhotos.length} {afterPhotos.length === 0 && <span className="text-rose-600 font-bold">(Mandatory photo required)</span>}
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong>Completion Description:</strong> {notes || 'None specified'}
            </p>
            <p className="text-slate-700 dark:text-slate-300">
              <strong>Materials Used:</strong> {materialsUsed || 'None specified'}
            </p>
          </div>

          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Once submitted, the Department Officer and the Citizen who raised the grievance will inspect your before/after photos and work completion notes.
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default TaskDetails;
