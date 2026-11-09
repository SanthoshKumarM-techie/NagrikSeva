export const ROLES = {
  CITIZEN: 'Citizen',
  OFFICER: 'Department Officer',
  WORKER: 'Contractor & Crew Operations',
  ADMIN: 'Super Admin',
};

export const ROLE_KEYS = {
  CITIZEN: 'citizen',
  OFFICER: 'officer',
  WORKER: 'worker',
  ADMIN: 'admin',
};

export const COMPLAINT_STATUS = {
  SUBMITTED: "Submitted",
  DEPARTMENT_REVIEW: "Department Review",
  TRANSFERRED: "Transferred",
  ACKNOWLEDGED: "Acknowledged",
  INSPECTION: "Inspection",
  WORKER_ASSIGNED: "Worker Assigned",
  WORK_IN_PROGRESS: "Work in Progress",
  VERIFICATION: "Verification",
  RESOLVED: "Resolved",
  DISPUTED: "Disputed",
  CLOSED: "Closed",
  REJECTED: "Rejected"
};

export const PRIORITIES = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  CRITICAL: 'Critical',
};

export const ESCALATION_LEVELS = {
  LEVEL_1: { level: 1, title: 'Department Officer', slaHours: 24 },
  LEVEL_2: { level: 2, title: 'Department Supervisor', slaHours: 48 },
  LEVEL_3: { level: 3, title: 'Municipal Administrator', slaHours: 72 },
};

export const CATEGORIES = [
  'Roads & Infrastructure',
  'Water Supply',
  'Sanitation & Solid Waste',
  'Street Lighting',
  'Drainage & Sewage',
  'Public Health',
];

export const DEMO_CREDENTIALS = [
  { role: ROLES.CITIZEN, id: 'citizen01', pass: 'pass123', email: 'citizen01@example.com', name: 'Aarav Sharma', department: null, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.OFFICER, id: 'officer01', pass: 'pass123', email: 'officer01@bbmp.gov.in', name: 'Rajesh Kumar', department: 'Civil Works & Municipal Redressal Department', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.WORKER, id: 'contractor01', pass: 'pass123', email: 'contractor01@bbmp.gov.in', name: 'Suresh Patil', department: 'Civil Works & Municipal Redressal Department', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.ADMIN, id: 'admin01', pass: 'pass123', email: 'admin01@bbmp.gov.in', name: 'Dr. Priya Sundaram', department: 'Central Administration', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.CITIZEN, id: 'citizen02', pass: 'pass123', email: 'citizen02@example.com', name: 'Meera Krishnan', department: null, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.OFFICER, id: 'officer02', pass: 'pass123', email: 'officer02@bbmp.gov.in', name: 'Sunita Deshmukh', department: 'Civil Works & Municipal Redressal Department', avatar: 'https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.WORKER, id: 'contractor02', pass: 'pass123', email: 'contractor02@bbmp.gov.in', name: 'Kiran Gowda', department: 'Civil Works & Municipal Redressal Department', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.ADMIN, id: 'admin02', pass: 'pass123', email: 'admin02@bbmp.gov.in', name: 'Anand Murthy', department: 'Central Administration', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.CITIZEN, id: 'CIT001', pass: 'pass123', email: 'citizen@example.com', name: 'Aarav Sharma', department: null, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.OFFICER, id: 'OFF001', pass: 'pass123', email: 'officer@bbmp.gov.in', name: 'Rajesh Kumar', department: 'Civil Works & Municipal Redressal Department', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.WORKER, id: 'WRK001', pass: 'pass123', email: 'worker@bbmp.gov.in', name: 'Suresh Patil', department: 'Civil Works & Municipal Redressal Department', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80' },
  { role: ROLES.ADMIN, id: 'ADM001', pass: 'pass123', email: 'admin@bbmp.gov.in', name: 'Dr. Priya Sundaram', department: 'Central Administration', avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80' },
];

export const STORAGE_KEYS = {
  AUTH_USER: 'nagrik_auth_user',
  THEME: 'nagrik_theme',
  COMPLAINTS: 'nagrik_complaints_data',
  DEPARTMENTS: 'nagrik_departments_data',
  WORKERS: 'nagrik_workers_data',
  NOTIFICATIONS: 'nagrik_notifications_data',
  USERS: 'nagrik_users_data',
  SLAS: 'nagrik_sla_configs',
  EMAIL_LOGS: 'nagrik_email_logs',
};

