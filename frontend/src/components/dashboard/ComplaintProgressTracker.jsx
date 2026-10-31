import React from 'react';
import {
  FileText,
  UserCheck,
  Search,
  Wrench,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Check
} from 'lucide-react';
import { COMPLAINT_STATUS } from '../../utils/constants';
import { formatDateTime, formatDate } from '../../utils/statusHelpers';

/**
 * ComplaintProgressTracker
 * Responsive 5-stage lifecycle progress tracker for citizens and municipal officers.
 * Highlights Site Inspection and Work Started (Work in Progress) stages with dynamic notes & timestamps.
 */
export const ComplaintProgressTracker = ({ complaint, className = '' }) => {
  if (!complaint) return null;

  const currentStatus = complaint.status || complaint.current_status || 'SUBMITTED';
  const timeline = complaint.timeline || [];

  // Stage rank helper
  const getStatusRank = (status) => {
    const s = String(status || '').toUpperCase();
    if (s === 'CLOSED') return 6;
    if (s === 'RESOLVED') return 5.5;
    if (s === 'VERIFICATION') return 5;
    if (s === 'WORK_IN_PROGRESS' || s.includes('PROGRESS')) return 4;
    if (s === 'INSPECTION' || s.includes('INSPECT')) return 3;
    if (s === 'WORKER_ASSIGNED' || s.includes('ASSIGN')) return 2;
    if (s === 'DISPUTED') return 4; // Treated as active rework
    return 1; // SUBMITTED, ACKNOWLEDGED, DEPARTMENT_REVIEW, TRANSFERRED
  };

  const currentRank = getStatusRank(currentStatus);

  // Helper to find timeline event for a stage
  const findTimelineEvent = (matcher) => {
    return [...timeline]
      .reverse()
      .find((t) => {
        const s = String(t.status || t.to_status || '').toUpperCase();
        return matcher(s, t);
      });
  };

  const lodgedEvent = findTimelineEvent((s) => s.includes('SUBMIT') || s.includes('REGISTER'));
  const assignedEvent = findTimelineEvent((s) => s.includes('ASSIGN'));
  const inspectionEvent = findTimelineEvent((s) => s.includes('INSPECT'));
  const workStartedEvent = findTimelineEvent((s) => s.includes('PROGRESS') || s.includes('WORK'));
  const resolvedEvent = findTimelineEvent((s) => s.includes('RESOLV') || s.includes('CLOSE') || s.includes('VERIF'));

  // Define the 5 core stages
  const stages = [
    {
      id: 'lodged',
      stepNum: 1,
      title: 'Grievance Lodged',
      shortTitle: 'Lodged',
      icon: FileText,
      stageRank: 1,
      timestamp: lodgedEvent?.timestamp || complaint.submittedAt || complaint.createdAt,
      detail: complaint.department ? `Routing: ${complaint.department}` : 'Ticket queued',
      note: lodgedEvent?.description || 'Complaint registered in municipal portal'
    },
    {
      id: 'assigned',
      stepNum: 2,
      title: 'Crew Assigned',
      shortTitle: 'Assigned',
      icon: UserCheck,
      stageRank: 2,
      timestamp: assignedEvent?.timestamp,
      detail: complaint.assignedWorkerName
        ? `Worker: ${complaint.assignedWorkerName}`
        : 'Crew allocation',
      note: assignedEvent?.description || (complaint.assignedWorkerName ? `Assigned to ${complaint.assignedWorkerName}` : 'Awaiting worker assignment')
    },
    {
      id: 'inspected',
      stepNum: 3,
      title: 'Site Inspected',
      shortTitle: 'Inspection',
      icon: Search,
      stageRank: 3,
      timestamp: inspectionEvent?.timestamp,
      detail: inspectionEvent
        ? 'Physical inspection recorded'
        : (currentRank === 3 ? 'Inspection underway' : 'Pending site check'),
      note: inspectionEvent?.description || (currentRank === 3 ? 'Contractor & crew conducting site damage assessment' : 'Awaiting on-site inspection')
    },
    {
      id: 'work_started',
      stepNum: 4,
      title: 'Work In Progress',
      shortTitle: 'In Progress',
      icon: Wrench,
      stageRank: 4,
      timestamp: workStartedEvent?.timestamp,
      detail: workStartedEvent
        ? 'Remediation active on site'
        : (currentRank === 4 ? 'Crew on site' : 'Pending remediation'),
      note: workStartedEvent?.description || (currentRank === 4 ? 'Remediation work has begun on site' : 'Scheduled following inspection')
    },
    {
      id: 'resolved',
      stepNum: 5,
      title: currentRank >= 6 ? 'Confirmed & Closed' : (currentRank === 5.5 ? 'Resolved (Awaiting Citizen Approval)' : 'Verification & Closure'),
      shortTitle: currentRank >= 6 ? 'Closed' : (currentRank === 5.5 ? 'Awaiting Approval' : 'Verification'),
      icon: ShieldCheck,
      stageRank: 5,
      timestamp: resolvedEvent?.timestamp || complaint.resolvedAt,
      detail: currentRank >= 6 ? 'Confirmed by Citizen/Supporters & Closed' : (currentRank === 5.5 ? 'Department resolved — Citizen confirmation needed' : 'Pending verification sign-off'),
      note: resolvedEvent?.description || (currentRank >= 6 ? 'Remediation approved by citizen/supporters & closed' : 'Citizen or supporter approval required before closure')
    }
  ];

  // Determine stage status: 'completed' | 'current' | 'pending'
  const getStageState = (stage, idx) => {
    if (currentRank >= 6) {
      return 'completed';
    }

    if (stage.stageRank < currentRank) {
      return 'completed';
    }

    if (stage.stageRank === currentRank) {
      // For stage 5: if verification, it's active. If rank 6, it's completed
      return 'current';
    }

    return 'pending';
  };

  // Phase Callout Message
  const getPhaseCallout = () => {
    switch (currentRank) {
      case 1:
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900 text-blue-800 dark:text-blue-300',
          title: 'Grievance Under Review',
          desc: `Your complaint is registered with ${complaint.department || 'the civic authority'} and is queued for crew dispatch.`
        };
      case 2:
        return {
          bg: 'bg-indigo-50 dark:bg-indigo-950/30 border-indigo-200 dark:border-indigo-900 text-indigo-800 dark:text-indigo-300',
          title: 'Field Crew Allocated',
          desc: `Contractor & crew ${complaint.assignedWorkerName || 'assigned'} has received the job order and is preparing for site visit.`
        };
      case 3:
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200',
          title: 'Site Inspection in Progress / Logged',
          desc: inspectionEvent?.description
            ? `Inspector findings: "${inspectionEvent.description}"`
            : 'Field crew is on-site conducting initial damage inspection and deploying safety barricades.'
        };
      case 4:
        const isReworkOrder = complaint.assignmentStatus === 'REWORK_REQUIRED' || (complaint.timeline || []).some(t => String(t.title || '').toLowerCase().includes('rework'));
        if (isReworkOrder) {
          return {
            bg: 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-800 text-rose-900 dark:text-rose-200',
            title: 'Remediation Rework in Progress (Citizen Ordered)',
            desc: 'Citizen inspected the site and requested rework. Field crew is actively rectifying the defect on site before resubmitting for final approval.'
          };
        }
        return {
          bg: 'bg-yellow-50 dark:bg-yellow-950/30 border-yellow-300 dark:border-yellow-800 text-yellow-900 dark:text-yellow-200',
          title: 'Remediation Work in Progress',
          desc: workStartedEvent?.description
            ? `Field update: "${workStartedEvent.description}"`
            : 'Active physical repairs and material work are currently underway at the site location.'
        };
      case 5:
        return {
          bg: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900 text-purple-900 dark:text-purple-200',
          title: 'Remediation Completed — Verification Pending',
          desc: 'Field crew has concluded repairs. Before and after photo proof is submitted for Department Officer sign-off.'
        };
      case 5.5:
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200',
          title: 'Resolved by Department — Citizen / Supporter Approval Required',
          desc: 'The department has verified the remediation and marked the grievance as Resolved. Before this complaint can be closed, the citizen who raised it or any registered supporters must confirm and approve the work.'
        };
      case 6:
        return {
          bg: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200',
          title: 'Grievance Confirmed & Closed',
          desc: 'Remediation work has been verified and confirmed by the citizen / community supporters. Case is officially closed.'
        };
      default:
        return null;
    }
  };

  const callout = getPhaseCallout();

  return (
    <div className={`gov-card p-5 sm:p-6 space-y-5 ${className}`}>
      {/* Header with Title and Current Stage Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Grievance Resolution Progress
            </h3>
            <span className="font-mono text-[11px] font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded">
              Ticket: {complaint.ticketNumber || complaint.id}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Transparent real-time tracking from citizen lodging to field inspection, remediation, and resolution sign-off.
          </p>
        </div>

        {/* Current Stage Indicator */}
        <div className="flex items-center gap-2">
          {currentStatus === COMPLAINT_STATUS.DISPUTED ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Resolution Disputed
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              <span className="w-2 h-2 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
              Phase {Math.min(currentRank, 5)} of 5: {stages[Math.min(currentRank - 1, 4)]?.title}
            </span>
          )}
        </div>
      </div>

      {/* Stepper Progress Bar */}
      <div className="relative pt-2 pb-1">
        {/* Horizontal Connector Line for Desktop / Tablet */}
        <div className="hidden md:block absolute top-7 left-10 right-10 h-1 bg-slate-200 dark:bg-slate-800 -z-0" />

        {/* Stepper Nodes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 md:gap-2 relative z-10">
          {stages.map((stage, idx) => {
            const state = getStageState(stage, idx);
            const IconComponent = stage.icon;
            const isCompleted = state === 'completed';
            const isCurrent = state === 'current';
            const isPending = state === 'pending';

            return (
              <div
                key={stage.id}
                className={`flex md:flex-col items-start md:items-center text-left md:text-center gap-3 md:gap-2 p-3 md:p-1 rounded-xl transition-all ${
                  isCurrent
                    ? 'bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 shadow-sm'
                    : isCompleted
                    ? 'bg-slate-50/50 dark:bg-slate-800/30 md:bg-transparent md:dark:bg-transparent'
                    : 'opacity-70 md:opacity-100'
                }`}
              >
                {/* Node Icon Circle */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 transition-transform ${
                    isCompleted
                      ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30 ring-4 ring-emerald-50 dark:ring-emerald-950/50'
                      : isCurrent
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/40 ring-4 ring-blue-100 dark:ring-blue-900/60 scale-110 animate-pulse'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-700'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5 stroke-[2.5]" />
                  ) : (
                    <IconComponent className="w-4 h-4" />
                  )}
                </div>

                {/* Step Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 md:justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Step {stage.stepNum}
                    </span>
                    {isCurrent && (
                      <span className="md:hidden inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200">
                        Active
                      </span>
                    )}
                  </div>

                  <h4
                    className={`text-xs font-bold leading-snug mt-0.5 truncate ${
                      isCurrent
                        ? 'text-blue-700 dark:text-blue-400'
                        : isCompleted
                        ? 'text-slate-900 dark:text-slate-100'
                        : 'text-slate-500 dark:text-slate-500'
                    }`}
                  >
                    {stage.title}
                  </h4>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                    {stage.detail}
                  </p>

                  {/* Timestamp if available */}
                  {stage.timestamp && (
                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 md:justify-center">
                      <Calendar className="w-3 h-3 shrink-0" />
                      <span>{formatDate(stage.timestamp)}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Dynamic Active Phase Context Banner */}
      {callout && (
        <div className={`p-3.5 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${callout.bg}`}>
          {currentRank === 3 ? (
            <Search className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
          ) : currentRank === 4 ? (
            <Wrench className="w-4 h-4 shrink-0 mt-0.5 text-yellow-600 dark:text-yellow-400" />
          ) : currentRank >= 6 ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Clock className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
          )}
          <div className="flex-1">
            <span className="font-bold block mb-0.5">{callout.title}</span>
            <span>{callout.desc}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplaintProgressTracker;

