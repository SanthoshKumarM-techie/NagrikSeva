import { COMPLAINT_STATUS, PRIORITIES } from './constants.js';

export const STATUS_LOOKUP = {
  'SUBMITTED': COMPLAINT_STATUS.SUBMITTED,
  'DEPARTMENT_REVIEW': COMPLAINT_STATUS.DEPARTMENT_REVIEW,
  'TRANSFERRED': COMPLAINT_STATUS.TRANSFERRED,
  'ACKNOWLEDGED': COMPLAINT_STATUS.ACKNOWLEDGED,
  'INSPECTION': COMPLAINT_STATUS.INSPECTION,
  'WORKER_ASSIGNED': COMPLAINT_STATUS.WORKER_ASSIGNED,
  'WORK_IN_PROGRESS': COMPLAINT_STATUS.WORK_IN_PROGRESS,
  'VERIFICATION': COMPLAINT_STATUS.VERIFICATION,
  'RESOLVED': COMPLAINT_STATUS.RESOLVED,
  'DISPUTED': COMPLAINT_STATUS.DISPUTED,
  'CLOSED': COMPLAINT_STATUS.CLOSED,
  'REJECTED': COMPLAINT_STATUS.REJECTED
};

export const PRIORITY_LOOKUP = {
  'CRITICAL': PRIORITIES.CRITICAL,
  'HIGH': PRIORITIES.HIGH,
  'MEDIUM': PRIORITIES.MEDIUM,
  'LOW': PRIORITIES.LOW
};

export const normalizeStatus = (status) => STATUS_LOOKUP[status] || status;
export const normalizePriority = (priority) => PRIORITY_LOOKUP[priority] || priority;

export const getStatusBadgeVariant = (status) => {
  const norm = normalizeStatus(status);
  switch (norm) {
    case COMPLAINT_STATUS.SUBMITTED:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400'
      };
    case COMPLAINT_STATUS.DEPARTMENT_REVIEW:
      return {
        bg: 'bg-blue-50 dark:bg-blue-950/40',
        text: 'text-blue-700 dark:text-blue-300',
        border: 'border-blue-200 dark:border-blue-800',
        dot: 'bg-blue-500'
      };
    case COMPLAINT_STATUS.TRANSFERRED:
      return {
        bg: 'bg-purple-50 dark:bg-purple-950/40',
        text: 'text-purple-700 dark:text-purple-300',
        border: 'border-purple-200 dark:border-purple-800',
        dot: 'bg-purple-500'
      };
    case COMPLAINT_STATUS.ACKNOWLEDGED:
      return {
        bg: 'bg-cyan-50 dark:bg-cyan-950/40',
        text: 'text-cyan-700 dark:text-cyan-300',
        border: 'border-cyan-200 dark:border-cyan-800',
        dot: 'bg-cyan-500'
      };
    case COMPLAINT_STATUS.INSPECTION:
      return {
        bg: 'bg-amber-50 dark:bg-amber-950/40',
        text: 'text-amber-700 dark:text-amber-300',
        border: 'border-amber-200 dark:border-amber-800',
        dot: 'bg-amber-500'
      };
    case COMPLAINT_STATUS.WORKER_ASSIGNED:
      return {
        bg: 'bg-indigo-50 dark:bg-indigo-950/40',
        text: 'text-indigo-700 dark:text-indigo-300',
        border: 'border-indigo-200 dark:border-indigo-800',
        dot: 'bg-indigo-500'
      };
    case COMPLAINT_STATUS.WORK_IN_PROGRESS:
      return {
        bg: 'bg-yellow-50 dark:bg-yellow-950/40',
        text: 'text-yellow-700 dark:text-yellow-300',
        border: 'border-yellow-200 dark:border-yellow-800',
        dot: 'bg-yellow-500'
      };
    case COMPLAINT_STATUS.VERIFICATION:
      return {
        bg: 'bg-orange-50 dark:bg-orange-950/40',
        text: 'text-orange-700 dark:text-orange-300',
        border: 'border-orange-200 dark:border-orange-800',
        dot: 'bg-orange-500'
      };
    case COMPLAINT_STATUS.RESOLVED:
    case COMPLAINT_STATUS.CLOSED:
      return {
        bg: 'bg-emerald-50 dark:bg-emerald-950/40',
        text: 'text-emerald-700 dark:text-emerald-300',
        border: 'border-emerald-200 dark:border-emerald-800',
        dot: 'bg-emerald-500'
      };
    case COMPLAINT_STATUS.DISPUTED:
      return {
        bg: 'bg-rose-50 dark:bg-rose-950/40',
        text: 'text-rose-700 dark:text-rose-300',
        border: 'border-rose-200 dark:border-rose-800',
        dot: 'bg-rose-500'
      };
    case COMPLAINT_STATUS.REJECTED:
      return {
        bg: 'bg-red-50 dark:bg-red-950/40',
        text: 'text-red-700 dark:text-red-300',
        border: 'border-red-200 dark:border-red-800',
        dot: 'bg-red-500'
      };
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        dot: 'bg-slate-400'
      };
  }
};

export const getPriorityBadgeVariant = (priority) => {
  const norm = normalizePriority(priority);
  switch (norm) {
    case PRIORITIES.CRITICAL:
      return {
        bg: 'bg-red-100 dark:bg-red-950/50',
        text: 'text-red-800 dark:text-red-200',
        border: 'border-red-300 dark:border-red-800',
        icon: 'text-red-600'
      };
    case PRIORITIES.HIGH:
      return {
        bg: 'bg-orange-100 dark:bg-orange-950/50',
        text: 'text-orange-800 dark:text-orange-200',
        border: 'border-orange-300 dark:border-orange-800',
        icon: 'text-orange-600'
      };
    case PRIORITIES.MEDIUM:
      return {
        bg: 'bg-amber-100 dark:bg-amber-950/50',
        text: 'text-amber-800 dark:text-amber-200',
        border: 'border-amber-300 dark:border-amber-800',
        icon: 'text-amber-600'
      };
    case PRIORITIES.LOW:
    default:
      return {
        bg: 'bg-slate-100 dark:bg-slate-800',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-200 dark:border-slate-700',
        icon: 'text-slate-500'
      };
  }
};

export const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

export const formatDateTime = (dateString) => {
  if (!dateString) return 'N/A';
  const d = new Date(dateString);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const timeAgo = (dateString) => {
  if (!dateString) return '';
  const now = new Date();
  const past = new Date(dateString);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 60) {
    return `${Math.max(1, diffMins)}m ago`;
  } else if (diffHours < 24) {
    return `${diffHours}h ago`;
  } else {
    return `${diffDays}d ago`;
  }
};

