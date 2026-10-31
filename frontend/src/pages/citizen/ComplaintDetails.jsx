import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
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
  ThumbsUp,
  Image as ImageIcon,
  Check,
  Navigation,
  LocateFixed,
  Star
} from 'lucide-react';
import { useComplaints } from '../../context/ComplaintContext';
import { useAuth } from '../../context/AuthContext';
import { COMPLAINT_STATUS } from '../../utils/constants';
import PageHeader from '../../components/layout/PageHeader';
import Badge from '../../components/common/Badge';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import CitizenFeedbackModal from '../../components/common/CitizenFeedbackModal';
import Input from '../../components/common/Input';
import ComplaintTimeline from '../../components/dashboard/ComplaintTimeline';
import ComplaintProgressTracker from '../../components/dashboard/ComplaintProgressTracker';
import { formatDate, formatDateTime } from '../../utils/statusHelpers';
import { getImageUrl } from '../../utils/imageHelpers';

import complaintsApi from '../../api/complaints.api';
import { mapBackendComplaint } from '../../context/ComplaintContext';

export const ComplaintDetails = () => {
  const { id } = useParams();
  const { complaints, addSupporter, citizenConfirmResolution, citizenDisputeResolution } = useComplaints();
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

  const [searchParams] = useSearchParams();
  const emailAction = searchParams.get('action'); // 'confirm' | 'dispute'

  const [disputeModalOpen, setDisputeModalOpen] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [disputeLoading, setDisputeLoading] = useState(false);
  const [photoModalUrl, setPhotoModalUrl] = useState(null);

  useEffect(() => {
    if (emailAction === 'dispute') {
      setDisputeModalOpen(true);
    } else if (emailAction === 'confirm') {
      setConfirmModalOpen(true);
    }
  }, [emailAction]);

  if (loading && !complaint) {
    return (
      <div className="p-12 text-center">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-xs text-slate-500 font-medium">Loading grievance details from municipal registry...</p>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="p-12 text-center">
        <h2 className="text-base font-semibold text-slate-800 dark:text-slate-200">
          Complaint Not Found
        </h2>
        <p className="text-xs text-slate-500 mt-1 mb-4">
          The requested complaint identifier "{id}" does not exist in the municipal record.
        </p>
        <Button variant="secondary" onClick={() => navigate('/citizen/my-complaints')}>
          Return to Complaints
        </Button>
      </div>
    );
  }

  const isSupporter = complaint.supporters && complaint.supporters.includes(currentUser?.id);

  const handleSupportClick = () => {
    addSupporter(complaint.id, currentUser);
  };

  const [confirmLoading, setConfirmLoading] = useState(false);

  const handleConfirmSubmit = async ({ rating = 5, feedback = '' } = {}) => {
    setConfirmLoading(true);
    try {
      const citizenRating = Number(rating) || 5;
      const citizenFeedback = feedback.trim() || 'Resolution confirmed by citizen.';

      setBackendComplaint(prev => prev ? {
        ...prev,
        status: COMPLAINT_STATUS.CLOSED,
        current_status: 'CLOSED',
        citizenRating,
        citizenFeedback,
        timeline: [
          ...(prev.timeline || []),
          {
            id: `tl-${Date.now()}`,
            status: COMPLAINT_STATUS.CLOSED,
            title: 'Citizen Confirmed Resolution — Case Closed',
            description: `${currentUser?.name || 'Citizen'} verified civic restoration (Rated: ${citizenRating}/5 ⭐). ${citizenFeedback ? `Feedback: "${citizenFeedback}"` : ''}`.trim(),
            timestamp: new Date().toISOString(),
            author: currentUser?.name || 'Citizen',
            role: 'Citizen'
          }
        ]
      } : null);

      await citizenConfirmResolution(complaint.id, currentUser, null, { rating: citizenRating, feedback: citizenFeedback });
      setConfirmModalOpen(false);
    } catch (err) {
      console.error('Error confirming resolution with feedback:', err);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleConfirmClick = () => {
    setConfirmModalOpen(true);
  };

  const handleDisputeSubmit = async () => {
    if (!disputeReason.trim()) return;
    setDisputeLoading(true);

    const disputeText = disputeReason.trim();

    setBackendComplaint(prev => prev ? {
      ...prev,
      status: COMPLAINT_STATUS.DISPUTED,
      current_status: 'DISPUTED',
      isEscalated: true,
      escalationLevel: 2,
      timeline: [
        ...(prev.timeline || []),
        {
          id: `tl-${Date.now()}`,
          status: COMPLAINT_STATUS.DISPUTED,
          title: 'Resolution Disputed by Citizen',
          description: `Reason: "${disputeText}". Grievance escalated to Level 2.`,
          timestamp: new Date().toISOString(),
          author: currentUser?.name || 'Citizen',
          role: 'Citizen'
        }
      ]
    } : null);

    try {
      await citizenDisputeResolution(complaint.id, disputeText, currentUser);
    } catch (err) {
      console.warn('Dispute submission notice:', err?.message);
    } finally {
      setDisputeLoading(false);
      setDisputeModalOpen(false);
      setDisputeReason('');
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={complaint.title}
        description={`Complaint Reference: ${complaint.id} • Registered by ${complaint.citizenName}`}
        tag={complaint.category}
        backUrl="/citizen/my-complaints"
        actions={
          <div className="flex items-center gap-2">
            {!isSupporter ? (
              <Button
                variant="secondary"
                icon={ThumbsUp}
                onClick={handleSupportClick}
              >
                Support Issue ({complaint.supporterCount})
              </Button>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <Check className="w-3.5 h-3.5" /> Endorsed by You
              </span>
            )}
          </div>
        }
      />

      {/* Citizen Resolution Action Banner if Status is Resolved */}
      {complaint.status === COMPLAINT_STATUS.RESOLVED && (
        <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-600 text-white shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
                Remediation Completed &amp; Verified by Department
              </h4>
              <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-0.5">
                Please inspect the site proof below. Confirm if the issue is solved, or dispute if incomplete.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2.5 shrink-0">
            <Button
              variant="danger"
              size="sm"
              icon={AlertTriangle}
              onClick={() => setDisputeModalOpen(true)}
            >
              Dispute Resolution
            </Button>
            <Button
              variant="success"
              size="sm"
              icon={CheckCircle2}
              onClick={handleConfirmClick}
            >
              Confirm &amp; Close Case
            </Button>
          </div>
        </div>
      )}

      {/* Escalation Alert Banner if Disputed or Overdue */}
      {complaint.escalation && (
        <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-rose-800 dark:text-rose-200 block">
              Active Municipal Escalation: Level {complaint.escalation.level} ({complaint.escalation.title})
            </span>
            <span className="text-rose-700 dark:text-rose-300">
              This grievance has exceeded standard timeline thresholds and is escalated for priority supervision by the {complaint.escalation.title}.
            </span>
          </div>
        </div>
      )}

      {/* Visual Resolution Lifecycle Tracker */}
      <ComplaintProgressTracker complaint={complaint} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Complaint Details & Evidence */}
        <div className="lg:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="gov-card p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-blue-600 dark:text-blue-400">
                  {complaint.id}
                </span>
                <Badge status={complaint.status} />
                <Badge priority={complaint.priority} />
              </div>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Submitted {formatDate(complaint.submittedAt)}
              </span>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Grievance Description
              </h3>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {complaint.description}
              </p>
            </div>

            {/* Metadata Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Location &amp; Ward:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {complaint.location}
                </span>
                <span className="text-[11px] text-slate-500 ml-4.5 block">{complaint.ward}</span>
                {complaint.latitude && complaint.longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${complaint.latitude},${complaint.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline mt-1"
                    title="Open live coordinates in Google Maps"
                  >
                    <Navigation className="w-3 h-3 text-emerald-500" />
                    GPS: {Number(complaint.latitude).toFixed(5)}° N, {Number(complaint.longitude).toFixed(5)}° E &bull; View Map &rarr;
                  </a>
                )}
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Department:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {complaint.department}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">Assigned Field Crew:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {complaint.assignedWorkerName || 'Pending Crew Allocation'}
                </span>
              </div>

              <div>
                <span className="text-slate-400 block mb-0.5">SLA Target Deadline:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                  {formatDate(complaint.slaDeadline)}
                </span>
              </div>
            </div>
          </div>

          {/* Inter-Department Transfer Banner if Transferred */}
          {complaint.transfers && complaint.transfers.length > 0 && (
            <div className="gov-card p-5 border-l-4 border-l-purple-600">
              <div className="flex items-center gap-2 mb-2 text-purple-700 dark:text-purple-300 font-bold text-xs">
                <ArrowRightLeft className="w-4 h-4" />
                Inter-Department Transfer Record
              </div>
              {complaint.transfers.map((tr) => (
                <div key={tr.id} className="text-xs space-y-1.5 bg-purple-50/50 dark:bg-purple-950/20 p-3 rounded-lg border border-purple-100 dark:border-purple-900/30">
                  <div className="flex justify-between items-center text-slate-600 dark:text-slate-300">
                    <span>
                      Transferred from <strong>{tr.fromDepartmentName}</strong> &rarr; <strong>{tr.toDepartmentName}</strong>
                    </span>
                    <span className="text-[11px] text-slate-400">{formatDateTime(tr.timestamp)}</span>
                  </div>
                  <p className="text-[11px] text-slate-700 dark:text-slate-300 italic">
                    Reason: "{tr.reason}"
                  </p>
                  <p className="text-[10px] text-slate-400">
                    Authorized By: {tr.transferredBy}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Citizen Verification & Rating Display Card */}
          {(complaint.citizenRating || complaint.citizenFeedback) && (
            <div className="gov-card p-5 border-l-4 border-l-emerald-500 bg-emerald-50/20 dark:bg-emerald-950/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Citizen Verification & Feedback
                </span>
                {complaint.citizenRating && (
                  <div className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={`w-3.5 h-3.5 ${s <= complaint.citizenRating ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}`}
                      />
                    ))}
                    <span className="text-xs font-bold text-amber-800 dark:text-amber-300 ml-1">
                      {complaint.citizenRating}/5
                    </span>
                  </div>
                )}
              </div>
              {complaint.citizenFeedback && (
                <p className="text-xs text-slate-700 dark:text-slate-300 italic pl-1">
                  "{complaint.citizenFeedback}"
                </p>
              )}
            </div>
          )}

          {/* Citizen Evidence Gallery */}
          <div className="gov-card p-5">
            <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 uppercase tracking-wider mb-3">
              Citizen Photographic Evidence ({complaint.evidence?.length || 0})
            </h3>
            {complaint.evidence && complaint.evidence.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {complaint.evidence.map((photo, i) => (
                  <div
                    key={i}
                    onClick={() => setPhotoModalUrl(getImageUrl(photo))}
                    className="relative group rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 h-32 bg-slate-100 dark:bg-slate-800 cursor-pointer"
                  >
                    <img
                      src={getImageUrl(photo)}
                      alt={`Evidence ${i + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-medium transition-opacity">
                      Click to expand
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">No photographic evidence attached.</p>
            )}
          </div>

          {/* Resolution Evidence (Before / After Photos) */}
          {complaint.resolutionEvidence && (
            <div className="gov-card p-5 border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <h3 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
                  Field Remediation Proof &amp; Notes
                </h3>
              </div>

              {complaint.resolutionEvidence.completionNotes && (
                <p className="text-xs text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 mb-4">
                  <strong>Worker Notes:</strong> {complaint.resolutionEvidence.completionNotes}
                </p>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {complaint.resolutionEvidence.beforePhotos?.length > 0 && (
                  <div>
                    <span className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Before Remediation:
                    </span>
                    <img
                      src={getImageUrl(complaint.resolutionEvidence.beforePhotos[0])}
                      alt="Before"
                      onClick={() => setPhotoModalUrl(getImageUrl(complaint.resolutionEvidence.beforePhotos[0]))}
                      className="w-full h-40 object-cover rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}
                {complaint.resolutionEvidence.afterPhotos?.length > 0 && (
                  <div>
                    <span className="block text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-1">
                      After Remediation (Certified):
                    </span>
                    <img
                      src={getImageUrl(complaint.resolutionEvidence.afterPhotos[0])}
                      alt="After"
                      onClick={() => setPhotoModalUrl(getImageUrl(complaint.resolutionEvidence.afterPhotos[0]))}
                      className="w-full h-40 object-cover rounded-lg border border-emerald-300 dark:border-emerald-800 cursor-pointer hover:opacity-90 transition-opacity"
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Complaint Timeline */}
        <div className="space-y-6">
          <div className="gov-card p-5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight mb-4 flex items-center justify-between">
              <span>Grievance Lifecycle</span>
              <span className="text-[10px] text-slate-400 font-mono">
                {complaint.timeline?.length || 0} Events
              </span>
            </h3>

            <ComplaintTimeline
              timeline={complaint.timeline}
              transfers={complaint.transfers}
            />
          </div>
        </div>
      </div>

      {/* Dispute Modal Dialog */}
      <Modal
        isOpen={disputeModalOpen}
        onClose={() => setDisputeModalOpen(false)}
        title="Dispute Grievance Resolution"
        description="If the civic issue was not fixed properly, filing a dispute automatically reopens the ticket and escalates to a senior supervisor."
        footer={
          <>
            <Button variant="secondary" onClick={() => setDisputeModalOpen(false)} disabled={disputeLoading}>
              Cancel
            </Button>
            <Button
              variant="danger"
              icon={AlertTriangle}
              onClick={handleDisputeSubmit}
              loading={disputeLoading}
              disabled={disputeReason.trim().length < 10}
            >
              Submit Dispute &amp; Escalate
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Input
            label="Reason for Dispute (min 10 characters)"
            type="textarea"
            rows={4}
            placeholder="Explain why the resolution is unsatisfactory (e.g. debris left behind, water still leaking, pothole patched improperly)..."
            value={disputeReason}
            onChange={(e) => setDisputeReason(e.target.value)}
            enableVoice={true}
            onVoiceChange={(text) => setDisputeReason(text)}
            required
          />
          <div className="flex items-center justify-between text-[11px]">
            <p className={disputeReason.trim().length < 10 ? "text-amber-600 dark:text-amber-400 font-medium" : "text-slate-500"}>
              {disputeReason.trim().length < 10
                ? `Minimum 10 characters required (${disputeReason.trim().length}/10)`
                : 'A Level 2 Department Supervisor will be notified immediately to re-inspect this site.'}
            </p>
          </div>
        </div>
      </Modal>

      {/* Citizen Resolution & Rating Feedback Modal */}
      <CitizenFeedbackModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmSubmit}
        complaint={complaint}
        loading={confirmLoading}
      />

      {/* Photo Zoom Modal */}
      {photoModalUrl && (
        <Modal
          isOpen={!!photoModalUrl}
          onClose={() => setPhotoModalUrl(null)}
          title="Evidence Photo Preview"
          size="lg"
        >
          <div className="flex items-center justify-center p-2">
            <img
              src={photoModalUrl}
              alt="Expanded preview"
              className="max-h-[70vh] rounded-lg object-contain shadow-lg"
            />
          </div>
        </Modal>
      )}
    </div>
  );
};

export default ComplaintDetails;

