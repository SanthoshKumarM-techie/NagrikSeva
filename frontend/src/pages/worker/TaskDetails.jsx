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
  Phone
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
import { formatDate } from '../../utils/statusHelpers';

import complaintsApi from '../../api/complaints.api';
import assignmentsApi from '../../api/assignments.api';
import evidenceApi from '../../api/evidence.api';
import { mapBackendComplaint } from '../../context/ComplaintContext';
import { getImageUrl } from '../../utils/imageHelpers';

export const TaskDetails = () => {
  const { id } = useParams();
  const { complaints, acceptTask, updateWorkerTaskStatus } = useComplaints();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [backendTask, setBackendTask] = useState(null);
  const [loading, setLoading] = useState(false);
  const [acceptedLocal, setAcceptedLocal] = useState(false);
  const [inspectionModalOpen, setInspectionModalOpen] = useState(false);
  const [inspectionFindings, setInspectionFindings] = useState('Barricades deployed, area cleared');

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
  const isReworkActive = reworkAlert && (task?.status === COMPLAINT_STATUS.WORK_IN_PROGRESS || task?.current_status === 'WORK_IN_PROGRESS');

  const [notes, setNotes] = useState(task?.resolutionEvidence?.completionNotes || 'Pothole filled and leveled');
  const [afterPhotos, setAfterPhotos] = useState(task?.resolutionEvidence?.afterPhotos || []);
  const [photoInput, setPhotoInput] = useState('');
  const [submitModalOpen, setSubmitModalOpen] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isUploading, setIsUploading] = useState(false);

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

  if (!task) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-base font-semibold">Task Not Found</h2>
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
    setSuccessMsg('Status updated to Inspection Completed.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Step 3: Start Work (Remediation)
  const handleStartWork = async () => {
    setBackendTask(prev => prev ? {
      ...prev,
      status: COMPLAINT_STATUS.WORK_IN_PROGRESS,
      current_status: 'WORK_IN_PROGRESS'
    } : null);

    try {
      await updateWorkerTaskStatus(
        task.assignmentId || task.complaintId || task.id,
        COMPLAINT_STATUS.WORK_IN_PROGRESS,
        'Material deployed on ground. Remediation active.',
        task.evidence || [],
        [],
        currentUser,
        task.ticketNumber || task.id
      );
    } catch (err) {
      console.warn('Start work notice:', err.message);
    }

    setSuccessMsg('Status updated to In Progress.');
    setTimeout(() => setSuccessMsg(''), 3500);
  };

  // Action: Add After Photo
  const handleAddPhoto = (url) => {
    if (!url) return;
    setAfterPhotos((prev) => [...prev, url]);
    setPhotoInput('');
  };

  const handleRemovePhoto = (idx) => {
    setAfterPhotos((prev) => prev.filter((_, i) => i !== idx));
  };

  // Step 4: Final Submit for Verification
  const handleSubmitVerification = async () => {
    if (afterPhotos.length === 0) {
      alert('Please attach or select at least one photo showing the completed remediation.');
      return;
    }

    const updatedEvidence = {
      beforePhotos: task.evidence || [],
      afterPhotos,
      completionNotes: notes || 'Pothole filled and leveled',
      completedAt: new Date().toISOString()
    };

    setBackendTask(prev => prev ? {
      ...prev,
      status: COMPLAINT_STATUS.VERIFICATION,
      current_status: 'VERIFICATION',
      resolutionEvidence: updatedEvidence
    } : null);

    try {
      await updateWorkerTaskStatus(
        task.assignmentId || task.complaintId || task.id,
        COMPLAINT_STATUS.VERIFICATION,
        notes || 'Pothole filled and leveled',
        task.evidence || [],
        afterPhotos,
        currentUser,
        task.ticketNumber || task.id
      );
    } catch (err) {
      console.warn('Submit verification notice:', err.message);
    }

    setSubmitModalOpen(false);
    setSuccessMsg('Work submitted for Department Officer Verification! Status is now Verification Pending.');
    setTimeout(() => setSuccessMsg(''), 4500);
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

            {task.status === COMPLAINT_STATUS.INSPECTION && (
              <Button
                variant="primary"
                icon={Wrench}
                onClick={handleStartWork}
              >
                Start Remediation
              </Button>
            )}

            {task.status === COMPLAINT_STATUS.WORK_IN_PROGRESS && (
              <Button
                variant="success"
                icon={FileCheck2}
                onClick={() => setSubmitModalOpen(true)}
              >
                Submit Completion Proof
              </Button>
            )}

            {(task.status === COMPLAINT_STATUS.VERIFICATION || task.status === 'VERIFICATION' || task.status === 'Verification') && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                <Clock className="w-3.5 h-3.5" />
                Verification Pending
              </span>
            )}
          </div>
        }
      />

      {successMsg && (
        <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-center gap-2 animate-fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Visual Resolution Lifecycle Tracker */}
      <ComplaintProgressTracker complaint={task} />

      {isReworkActive && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-800 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <span className="font-bold text-rose-900 dark:text-rose-200 block text-sm">
              Action Required: Remediation Rework Ordered by Department Officer
            </span>
            <p className="text-rose-800 dark:text-rose-300 leading-relaxed">
              <strong>Officer Notes:</strong> {reworkAlert.description || 'Defects found during inspection. Remediation rework ordered.'}
            </p>
            <span className="text-[11px] text-rose-600 dark:text-rose-400 block pt-1">
              Please rectify the defect on site, then click <strong>Submit Completion Proof</strong> above to upload fresh verification photos.
            </span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Job Details & Evidence Submission Form */}
        <div className="lg:col-span-2 space-y-6">
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
              <span className="text-xs text-slate-400">
                {afterPhotos.length} Attached
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
                <span className="text-[11px] text-slate-400">JPG, PNG, or WebP photo taken after work</span>
              </div>

              <div className="flex gap-2">
                <Input
                  placeholder="Or paste direct image URL..."
                  value={photoInput}
                  onChange={(e) => setPhotoInput(e.target.value)}
                  className="flex-1"
                />
                <Button
                  size="md"
                  variant="secondary"
                  onClick={() => handleAddPhoto(photoInput)}
                  disabled={!photoInput.trim()}
                >
                  Add Image
                </Button>
              </div>
            </div>

            {/* Notes */}
            <Input
              label="Field Crew Completion Notes"
              type="textarea"
              rows={3}
              placeholder="e.g. Cleared 2 metric tonnes of debris. Hot asphalt compacted with 2-tonne vibrating roller. Site opened to two-way traffic."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />

            {/* Action Bar */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                variant="success"
                icon={FileCheck2}
                onClick={() => setSubmitModalOpen(true)}
                disabled={afterPhotos.length === 0}
              >
                Submit for Officer Verification
              </Button>
            </div>
          </div>
        </div>

        {/* Right Column: Timeline */}
        <div className="space-y-6">
          <div className="gov-card p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4">
              Work Order History
            </h3>
            <ComplaintTimeline timeline={task.timeline} transfers={task.transfers} />
          </div>
        </div>
      </div>

      {/* Inspection Modal */}
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
          />
        </div>
      </Modal>

      {/* Confirmation Modal */}
      <Modal
        isOpen={submitModalOpen}
        onClose={() => setSubmitModalOpen(false)}
        title="Confirm Work Submission"
        description="Are you sure you want to submit this work order for Officer Verification? The department officer will inspect your submitted before/after photos and remarks."
        footer={
          <>
            <Button variant="secondary" onClick={() => setSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="success"
              icon={Send}
              onClick={handleSubmitVerification}
            >
              Confirm &amp; Submit
            </Button>
          </>
        }
      >
        <div className="space-y-2 text-xs">
          <p className="text-slate-600 dark:text-slate-300">
            <strong>Photos Attached:</strong> {afterPhotos.length}
          </p>
          <p className="text-slate-600 dark:text-slate-300">
            <strong>Remarks:</strong> {notes || 'None specified'}
          </p>
        </div>
      </Modal>
    </div>
  );
};

export default TaskDetails;

