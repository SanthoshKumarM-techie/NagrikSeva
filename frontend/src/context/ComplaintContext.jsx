import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import complaintsApi from '../api/complaints.api';
import lookupsApi from '../api/lookups.api';
import transfersApi from '../api/transfers.api';
import assignmentsApi from '../api/assignments.api';
import reviewsApi from '../api/reviews.api';
import usersApi from '../api/users.api';
import slaApi from '../api/sla.api';
import { COMPLAINT_STATUS, PRIORITIES, STORAGE_KEYS } from '../utils/constants';
import { INITIAL_COMPLAINTS } from '../data/mockComplaints';
import { normalizeStatus, normalizePriority } from '../utils/statusHelpers';
import { getImageUrl } from '../utils/imageHelpers';
import { getStorage, setStorage } from '../utils/storage';
import { useNotifications } from './NotificationContext';
import { useAuth } from './AuthContext';
import { sendWorkerAssignmentEmail, sendCitizenTrackerEmail } from '../services/email/emailService';
import { INITIAL_WORKERS } from '../data/mockWorkers';
import { INITIAL_USERS } from '../data/mockUsers';

const ComplaintContext = createContext();

export const FALLBACK_DEPARTMENTS = [
  {
    id: '11111111-1111-1111-1111-111111111101',
    code: 'ROAD',
    name: 'Road Infrastructure & Maintenance',
    description: 'Maintenance of asphalt roads, potholes, pedestrian paths, and storm drainage bridges.',
    contactEmail: 'roads@bbmp.gov.in',
    contactPhone: '+91 80 2266 0001',
    isActive: true,
    activeComplaints: 8,
    totalComplaints: 15,
    staffCount: 12,
    slaTargetPct: 92
  },
  {
    id: '11111111-1111-1111-1111-111111111102',
    code: 'SWM',
    name: 'Solid Waste Management',
    description: 'Garbage collection, illegal dumping removal, dry/wet waste segregation, and community dustbins.',
    contactEmail: 'swm@bbmp.gov.in',
    contactPhone: '+91 80 2266 0002',
    isActive: true,
    activeComplaints: 0,
    totalComplaints: 0,
    staffCount: 12,
    slaTargetPct: 92
  },
  {
    id: '11111111-1111-1111-1111-111111111103',
    code: 'BWSSB',
    name: 'Water Supply & Sewerage Board',
    description: 'Fresh drinking water pipelines, sewage overflows, open manholes, and underground drain blockages.',
    contactEmail: 'water@bbmp.gov.in',
    contactPhone: '+91 80 2266 0003',
    isActive: true,
    activeComplaints: 4,
    totalComplaints: 4,
    staffCount: 12,
    slaTargetPct: 92
  },
  {
    id: '11111111-1111-1111-1111-111111111104',
    code: 'ELEC',
    name: 'Street Lighting & Electrical',
    description: 'Public street illumination, solar lampposts, exposed underground cables, and timer repairs.',
    contactEmail: 'electrical@bbmp.gov.in',
    contactPhone: '+91 80 2266 0004',
    isActive: true,
    activeComplaints: 0,
    totalComplaints: 0,
    staffCount: 12,
    slaTargetPct: 92
  }
];

export const FALLBACK_CATEGORIES = [
  {
    id: '33333333-3333-3333-3333-333333333301',
    name: 'Pothole on Main Road',
    description: 'Damage or deep crater in paved road asphalt surface',
    department_id: '11111111-1111-1111-1111-111111111101',
    is_active: true,
    sla_hours: 72,
    severity_level: 'MEDIUM',
    department_name: 'Road Infrastructure & Maintenance',
    department_code: 'ROAD'
  },
  {
    id: '33333333-3333-3333-3333-333333333302',
    name: 'Broken Footpath & Paver Blocks',
    description: 'Hazardous missing slabs or broken footpath pavers',
    department_id: '11111111-1111-1111-1111-111111111101',
    is_active: true,
    sla_hours: 72,
    severity_level: 'MEDIUM',
    department_name: 'Road Infrastructure & Maintenance',
    department_code: 'ROAD'
  },
  {
    id: '33333333-3333-3333-3333-333333333303',
    name: 'Garbage Dump Overflow',
    description: 'Uncollected community waste accumulating on roadside',
    department_id: '11111111-1111-1111-1111-111111111102',
    is_active: true,
    sla_hours: 72,
    severity_level: 'MEDIUM',
    department_name: 'Solid Waste Management',
    department_code: 'SWM'
  },
  {
    id: '33333333-3333-3333-3333-333333333304',
    name: 'Drinking Water Pipe Leak',
    description: 'Pressurized water pipe rupture flooding streets',
    department_id: '11111111-1111-1111-1111-111111111103',
    is_active: true,
    sla_hours: 72,
    severity_level: 'MEDIUM',
    department_name: 'Water Supply & Sewerage Board',
    department_code: 'BWSSB'
  },
  {
    id: '33333333-3333-3333-3333-333333333305',
    name: 'Sewage Overflow on Street',
    description: 'Clogged manhole resulting in sewage backing up',
    department_id: '11111111-1111-1111-1111-111111111103',
    is_active: true,
    sla_hours: 72,
    severity_level: 'MEDIUM',
    department_name: 'Water Supply & Sewerage Board',
    department_code: 'BWSSB'
  },
  {
    id: '33333333-3333-3333-3333-333333333306',
    name: 'Non-Functional Streetlight',
    description: 'Street illumination light dead at night',
    department_id: '11111111-1111-1111-1111-111111111104',
    is_active: true,
    sla_hours: 72,
    severity_level: 'MEDIUM',
    department_name: 'Street Lighting & Electrical',
    department_code: 'ELEC'
  }
];

export const FALLBACK_WARDS = [
  { id: '22222222-2222-2222-2222-222222222201', ward_number: '101', name: 'Indiranagar', zone_name: 'East Zone' },
  { id: '22222222-2222-2222-2222-222222222202', ward_number: '102', name: 'Koramangala', zone_name: 'South Zone' },
  { id: '22222222-2222-2222-2222-222222222203', ward_number: '103', name: 'HSR Layout', zone_name: 'South Zone' },
  { id: '22222222-2222-2222-2222-222222222204', ward_number: '104', name: 'Whitefield', zone_name: 'East Zone' }
];

export const mapBackendComplaint = (c) => {
  if (!c) return null;
  const statusDisplay = normalizeStatus(c.status || c.current_status || COMPLAINT_STATUS.SUBMITTED);
  const priorityDisplay = normalizePriority(c.priority || PRIORITIES.MEDIUM);

  const rawLat = parseFloat(c.latitude);
  const rawLng = parseFloat(c.longitude);
  const lat = !isNaN(rawLat) ? rawLat : 12.9716;
  const lng = !isNaN(rawLng) ? rawLng : 77.5946;

  return {
    ...c,
    id: c.id,
    ticketNumber: c.ticket_number || c.ticketNumber || `BLR-${c.id?.slice(0, 8)}`,
    title: c.title,
    description: c.description,
    category: c.category_name || c.category || 'Civic Infrastructure',
    categoryId: c.category_id || c.categoryId,
    department: c.department_name || c.department || 'Municipal Corporation',
    departmentId: c.current_department_id || c.department_id || c.departmentId,
    departmentCode: c.department_code,
    citizenId: c.submitted_by || c.citizen_id || c.citizenId,
    citizenName: c.citizen_name || c.citizenName || 'Aarav Sharma',
    citizenPhone: c.citizen_phone || c.citizenPhone || '+91 98450 12345',
    citizenEmail: c.citizen_email || c.citizenEmail,
    ward: c.ward_name ? `${c.ward_number ? 'Ward ' + c.ward_number + ' - ' : ''}${c.ward_name}` : (c.ward || 'Ward 101 - Indiranagar'),
    wardId: c.ward_id || c.wardId,
    location: c.street_location || c.address || c.location || 'Bangalore, Karnataka',
    address: c.street_location || c.address || 'Bangalore, Karnataka',
    landmark: c.landmark || '',
    coordinates: { lat, lng },
    latitude: lat,
    longitude: lng,
    priority: priorityDisplay,
    rawPriority: c.priority,
    status: statusDisplay,
    rawStatus: c.status || c.current_status,
    submittedAt: c.submitted_at || c.created_at || c.submittedAt || new Date().toISOString(),
    createdAt: c.created_at || c.submitted_at,
    slaDeadline: c.sla_resolution_due_at || c.sla_deadline || c.slaDeadline || new Date(Date.now() + 72 * 3600 * 1000).toISOString(),
    supporterCount: c.support_count !== undefined ? parseInt(c.support_count, 10) : (c.supporterCount || 1),
    supporters: c.supporters || [c.submitted_by || c.citizen_id || 'CIT001'],
    isEscalated: !!c.is_escalated,
    escalationLevel: c.escalation_level || 0,
    evidence: (() => {
      const rawEvidence = Array.isArray(c.evidence) ? c.evidence : [];
      const extracted = rawEvidence
        .filter(e => typeof e === 'string' || e.stage === 'CITIZEN_INITIAL' || e.evidence_type === 'BEFORE' || !e.stage)
        .map(e => getImageUrl(e))
        .filter(Boolean);
      return extracted;
    })(),
    resolutionEvidence: (() => {
      const rawEvidence = Array.isArray(c.evidence) ? c.evidence : [];
      const workerAfter = rawEvidence
        .filter(e => typeof e === 'object' && (e.stage === 'WORKER_AFTER' || e.evidence_type === 'AFTER'))
        .map(e => getImageUrl(e))
        .filter(Boolean);
      const workerBefore = rawEvidence
        .filter(e => typeof e === 'object' && (e.stage === 'WORKER_BEFORE' || e.evidence_type === 'BEFORE'))
        .map(e => getImageUrl(e))
        .filter(Boolean);

      const resEv = c.resolution_evidence || c.resolutionEvidence || null;
      if (resEv || workerAfter.length > 0 || ['VERIFICATION', 'Verification', 'RESOLVED', 'Resolved', 'CLOSED', 'Closed'].includes(c.status || c.current_status)) {
        return {
          completionNotes: resEv?.completionNotes || resEv?.notes || c.remediation_notes || 'Remediation completed as inspected.',
          beforePhotos: (resEv?.beforePhotos?.map(getImageUrl) || []).length > 0
            ? resEv.beforePhotos.map(getImageUrl)
            : workerBefore,
          afterPhotos: (resEv?.afterPhotos?.map(getImageUrl) || []).length > 0
            ? resEv.afterPhotos.map(getImageUrl)
            : workerAfter,
          completedAt: resEv?.completedAt || c.resolved_at || c.updated_at || new Date().toISOString()
        };
      }
      return null;
    })(),
    timeline: (c.status_history || c.timeline || []).map((t, idx) => {
      const normStatus = normalizeStatus(t.to_status || t.status);
      const defaultTitle = {
        [COMPLAINT_STATUS.SUBMITTED]: 'Grievance Registered',
        [COMPLAINT_STATUS.ACKNOWLEDGED]: 'Complaint Acknowledged',
        [COMPLAINT_STATUS.DEPARTMENT_REVIEW]: 'Department Review',
        [COMPLAINT_STATUS.TRANSFERRED]: 'Inter-Department Transfer',
        [COMPLAINT_STATUS.WORKER_ASSIGNED]: 'Field Crew Assigned',
        [COMPLAINT_STATUS.INSPECTION]: 'Site Inspection Conducted',
        [COMPLAINT_STATUS.WORK_IN_PROGRESS]: 'Remediation Work Started',
        [COMPLAINT_STATUS.VERIFICATION]: 'Submitted for Verification',
        [COMPLAINT_STATUS.RESOLVED]: 'Resolution Verified & Completed',
        [COMPLAINT_STATUS.CLOSED]: 'Ticket Closed',
        [COMPLAINT_STATUS.DISPUTED]: 'Resolution Disputed by Citizen',
        [COMPLAINT_STATUS.REJECTED]: 'Complaint Rejected'
      }[normStatus] || (t.title || 'Status Updated');

      const remarksText = t.remarks || t.note || t.description;

      return {
        id: t.id || `tl-${idx}-${Date.now()}`,
        status: normStatus,
        title: (t.title && t.title !== 'Status Updated') ? t.title : defaultTitle,
        description: remarksText || `Status progressed to ${normStatus}`,
        timestamp: t.changed_at || t.timestamp || t.created_at || new Date().toISOString(),
        author: t.changed_by_name || t.author || 'Municipal Staff',
        role: t.changed_by_role || t.role || 'Staff'
      };
    }),
    transfers: c.transfers || [],
    assignedWorkerId: c.assigned_worker_id || c.assignedWorkerId || null,
    assignedWorkerName: c.assigned_worker_name || c.assignedWorkerName || null,
    assignmentId: c.assignment_id || c.assignmentId || null,
    assignmentStatus: c.assignment_status || c.assignmentStatus || null
  };
};

export const ComplaintProvider = ({ children }) => {
  const { addNotification } = useNotifications();
  const { currentUser } = useAuth();

  const [complaints, setComplaints] = useState(() => {
    const cached = getStorage(STORAGE_KEYS.COMPLAINTS, null);
    if (cached && Array.isArray(cached) && cached.length > 0) return cached;
    return INITIAL_COMPLAINTS;
  });
  const [departments, setDepartments] = useState(() => getStorage(STORAGE_KEYS.DEPARTMENTS, FALLBACK_DEPARTMENTS));
  const [categories, setCategories] = useState(() => getStorage('nagrikseva_categories', FALLBACK_CATEGORIES));
  const [wards, setWards] = useState(() => getStorage('nagrikseva_wards', FALLBACK_WARDS));
  const [workers, setWorkers] = useState(() => getStorage(STORAGE_KEYS.WORKERS, []));
  const [slas, setSlas] = useState(() => getStorage(STORAGE_KEYS.SLAS, []));
  const [users, setUsers] = useState(() => getStorage(STORAGE_KEYS.USERS, []));
  const [loading, setLoading] = useState(false);

  // Sync to local storage
  useEffect(() => { setStorage(STORAGE_KEYS.COMPLAINTS, complaints); }, [complaints]);
  useEffect(() => { setStorage(STORAGE_KEYS.DEPARTMENTS, departments); }, [departments]);
  useEffect(() => { setStorage('nagrikseva_categories', categories); }, [categories]);
  useEffect(() => { setStorage('nagrikseva_wards', wards); }, [wards]);
  useEffect(() => { setStorage(STORAGE_KEYS.WORKERS, workers); }, [workers]);
  useEffect(() => { setStorage(STORAGE_KEYS.SLAS, slas); }, [slas]);
  useEffect(() => { setStorage(STORAGE_KEYS.USERS, users); }, [users]);

  // Email recipient resolution helpers
  // Returns the registered worker object; email field comes from the live users/workers state.
  // If the worker cannot be located in any list the stub has NO email so the validation
  // layer in emailService.js will reject the send — never falls back to a hardcoded address.
  const resolveWorker = useCallback((workerId) => {
    return (
      workers.find(w => w.id === workerId) ||
      users.find(u => u.id === workerId) ||
      INITIAL_WORKERS.find(w => w.id === workerId) || {
        id: workerId,
        name: 'Field Specialist',
        email: '' // No email found — emailService validation will reject gracefully
      }
    );
  }, [workers, users]);

  // Returns the registered citizen's email, resolved from the complaint's backend join,
  // the live users state, or the currently authenticated user.
  // Returns empty string if unresolvable — emailService validation will reject gracefully.
  // NEVER falls back to a hardcoded example address.
  const resolveCitizenEmail = useCallback((complaint) => {
    if (!complaint) return '';
    return (
      complaint.citizenEmail ||
      complaint.citizen_email ||
      users.find(u => u.id === complaint.citizenId)?.email ||
      INITIAL_USERS.find(u => u.id === complaint.citizenId)?.email ||
      (complaint.citizenId === currentUser?.id ? currentUser?.email : null) ||
      '' // No registered email found — do not send to unknown address
    );
  }, [users, currentUser]);

  // Initial master data load from backend
  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);

      // Fast parallel fetch of lookups and complaints simultaneously to remove sequential delays
      const [deptsRes, catsRes, wardsRes, complaintsRes] = await Promise.allSettled([
        lookupsApi.getDepartments(),
        lookupsApi.getCategories(),
        lookupsApi.getWards(),
        complaintsApi.getComplaints({ limit: 100 })
      ]);

      if (deptsRes.status === 'fulfilled' && deptsRes.value) {
        const mappedDepts = deptsRes.value.map(d => ({
          id: d.id,
          code: d.code,
          name: d.name,
          description: d.description,
          contactEmail: d.contact_email,
          contactPhone: d.contact_phone,
          email: d.contact_email,
          phone: d.contact_phone,
          headOfficer: d.nodal_officer_name || 'Designated Nodal Officer',
          isActive: d.is_active,
          activeComplaints: d.active_complaints || 0,
          totalComplaints: d.total_complaints || 0,
          staffCount: d.worker_count || 12,
          slaTargetPct: 92
        }));
        setDepartments(mappedDepts);
      }

      if (catsRes.status === 'fulfilled' && catsRes.value) {
        setCategories(catsRes.value);
      }

      if (wardsRes.status === 'fulfilled' && wardsRes.value) {
        setWards(wardsRes.value);
      }

      if (complaintsRes.status === 'fulfilled' && complaintsRes.value) {
        const mapped = complaintsRes.value.map(mapBackendComplaint);
        setComplaints(mapped);
      }

      const roleStr = (currentUser?.role || '').toLowerCase();
      const isStaff = roleStr.includes('officer') || roleStr.includes('admin');
      const isAdmin = roleStr.includes('admin');

      // Fetch workers if available and role is staff
      if (isStaff) {
        try {
          const workersRes = await usersApi.getDepartmentWorkers();
          if (workersRes) {
            const mappedWorkers = workersRes.map(w => ({
              id: w.id,
              name: w.full_name || w.name,
              email: w.email,
              phone: w.phone,
              zone: w.assigned_zone || 'Central Zone',
              departmentId: w.department_id,
              department: w.department_name,
              specialization: Array.isArray(w.specializations) ? w.specializations.join(', ') : (w.specialization || 'Pothole Patching'),
              rating: parseFloat(w.rating || 4.8),
              activeTasks: w.active_tasks_count || 0,
              completedTasks: w.completed_tasks_count || 0,
              avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
            }));
            setWorkers(mappedWorkers);
          }
        } catch {
          // Silent fallback
        }
      }

      // Fetch SLA rules only if admin
      if (isAdmin) {
        try {
          const slaRes = await slaApi.getRules();
          if (slaRes) {
            setSlas(slaRes.map(s => ({
              id: s.id,
              departmentId: s.department_id,
              departmentName: s.department_name,
              categoryName: s.category_name,
              acknowledgementHours: Number(s.acknowledgement_hours || 4),
              assignmentHours: Number(s.assignment_hours || 12),
              inspectionHours: Number(s.inspection_hours || 24),
              resolutionHours: Number(s.resolution_hours || 48),
              isActive: s.is_active
            })));
          }
        } catch {
          // Silent fallback
        }
      }

    } catch (err) {
      console.warn('Initial data load warning:', err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // Actions
  const createComplaint = async (data, currentUser) => {
    try {
      const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

      const catInput = (data.category || '').toLowerCase();
      const catKeyword = catInput.split(' ')[0];

      // Robust Category Resolution:
      // 1. Direct UUID match
      // 2. Exact name match
      // 3. Keyword / partial matching (water, drain, sewer, garbage, waste, light, road, pothole, footpath)
      let targetCat = (categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES).find(c => 
        (data.categoryId && c.id === data.categoryId) ||
        (c.name && c.name.toLowerCase() === catInput) ||
        (c.name && (c.name.toLowerCase().includes(catInput) || catInput.includes(c.name.toLowerCase())))
      );

      if (!targetCat) {
        const pool = categories && categories.length > 0 ? categories : FALLBACK_CATEGORIES;
        if (catInput.includes('water')) {
          targetCat = pool.find(c => c.name.toLowerCase().includes('water'));
        } else if (catInput.includes('drain') || catInput.includes('sewag') || catInput.includes('sewer')) {
          targetCat = pool.find(c => c.name.toLowerCase().includes('sewage') || c.name.toLowerCase().includes('water'));
        } else if (catInput.includes('garbag') || catInput.includes('waste') || catInput.includes('sanitat') || catInput.includes('health')) {
          targetCat = pool.find(c => c.name.toLowerCase().includes('garbage'));
        } else if (catInput.includes('light') || catInput.includes('electr')) {
          targetCat = pool.find(c => c.name.toLowerCase().includes('light'));
        } else if (catInput.includes('road') || catInput.includes('pothole') || catInput.includes('footpath')) {
          targetCat = pool.find(c => c.name.toLowerCase().includes('pothole') || c.name.toLowerCase().includes('footpath'));
        }
      }

      if (!targetCat || !isUuid(targetCat.id)) {
        targetCat = (categories && categories.find(c => isUuid(c.id))) || FALLBACK_CATEGORIES[0];
      }

      // Department resolution based on category link or fallback
      const deptId = targetCat?.department_id || targetCat?.default_department_id;
      const deptPool = departments && departments.length > 0 ? departments : FALLBACK_DEPARTMENTS;
      let targetDept = deptPool.find(d => 
        (data.departmentId && d.id === data.departmentId) ||
        (deptId && d.id === deptId)
      );

      if (!targetDept && deptId) {
        targetDept = FALLBACK_DEPARTMENTS.find(d => d.id === deptId);
      }

      if (!targetDept || !isUuid(targetDept.id)) {
        targetDept = deptPool.find(d => isUuid(d.id) && (
          (d.name && d.name.toLowerCase().includes(catKeyword)) ||
          (d.code && catInput.includes(d.code.toLowerCase()))
        )) || deptPool.find(d => isUuid(d.id)) || FALLBACK_DEPARTMENTS[0];
      }

      // Ward resolution
      const wardInput = (data.ward || data.location || '').toLowerCase();
      const wardPool = wards && wards.length > 0 ? wards : FALLBACK_WARDS;
      let targetWard = wardPool.find(w => 
        (data.wardId && w.id === data.wardId) ||
        (w.name && wardInput.includes(w.name.toLowerCase())) ||
        (w.ward_number && wardInput.includes(String(w.ward_number))) ||
        (w.name && w.name.toLowerCase().includes(wardInput))
      );

      if (!targetWard || !isUuid(targetWard.id)) {
        targetWard = wardPool.find(w => isUuid(w.id)) || FALLBACK_WARDS[0];
      }

      // Priority normalization
      let cleanPriority = (data.priority || 'MEDIUM').toUpperCase();
      if (cleanPriority === 'EMERGENCY') cleanPriority = 'CRITICAL';
      if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(cleanPriority)) cleanPriority = 'MEDIUM';

      // Clean evidence URLs
      const rawEvidenceList = Array.isArray(data.evidence) ? data.evidence : [];
      const cleanEvidenceUrls = rawEvidenceList
        .map(item => {
          if (typeof item === 'string') return item.trim();
          if (item && typeof item === 'object') return item.fileUrl || item.storage_url || item.url || '';
          return '';
        })
        .filter(Boolean);

      const payload = {
        title: data.title?.trim() || 'Civic Grievance',
        description: data.description?.trim() || 'Civic issue report submitted by citizen.',
        categoryId: targetCat.id,
        departmentId: targetDept.id,
        wardId: targetWard?.id && isUuid(targetWard.id) ? targetWard.id : null,
        latitude: Number(data.coordinates?.lat) || 12.9716,
        longitude: Number(data.coordinates?.lng) || 77.5946,
        address: data.location || data.address || 'Indiranagar, Bangalore',
        landmark: data.landmark || (data.location ? `Near ${data.location}` : 'Indiranagar Zone'),
        priority: cleanPriority,
        evidenceUrls: cleanEvidenceUrls
      };

      const backendComplaint = await complaintsApi.createComplaint(payload);
      const mapped = mapBackendComplaint(backendComplaint);

      setComplaints(prev => [mapped, ...prev]);

      // Notify officer
      addNotification({
        userId: targetDept?.headOfficerId || 'OFF001',
        role: 'Department Officer',
        title: `New Grievance Submitted: ${mapped.ticketNumber}`,
        message: `${mapped.title} reported at ${mapped.location}. Awaiting review.`,
        complaintId: mapped.id,
        type: 'new_complaint'
      });

      // Send EmailJS Live Tracker notification to registered citizen
      sendCitizenTrackerEmail({
        complaint: mapped,
        recipientEmail: currentUser?.email || mapped.citizenEmail,
        recipientName: currentUser?.name || mapped.citizenName,
        eventType: 'COMPLAINT_RECEIVED'
      }).catch(err => console.warn('Citizen complaint received email dispatch notice:', err));

      return mapped;
    } catch (err) {
      console.error('Failed to create complaint:', err);
      throw err;
    }
  };

  const addSupporter = async (complaintId, citizenUser) => {
    const targetComp = complaints.find(c => c.id === complaintId || c.complaintId === complaintId || c.ticketNumber === complaintId);
    const realComplaintId = targetComp?.complaintId || targetComp?.id || complaintId;

    try {
      await complaintsApi.supportComplaint(realComplaintId);
    } catch (err) {
      console.warn('Backend support API note:', err.message);
    }

    let alreadySupported = false;
    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId || c.complaintId === complaintId || c.ticketNumber === complaintId) {
          const userId = citizenUser?.id || 'CIT001';
          if (c.supporters && c.supporters.includes(userId)) {
            alreadySupported = true;
            return c;
          }
          return {
            ...c,
            supporters: [...(c.supporters || []), userId],
            supporterCount: (c.supporterCount || 0) + 1
          };
        }
        return c;
      })
    );
    return !alreadySupported;
  };

  const transferDepartment = async (complaintId, targetDeptId, reason, officerUser) => {
    let backendTransfer = null;
    try {
      backendTransfer = await transfersApi.initiateTransfer({
        complaintId,
        toDepartmentId: targetDeptId || null,
        reason: reason || 'Transfer requested by department officer'
      });
    } catch (err) {
      console.warn('Backend transfer API warning:', err.message);
    }

    const targetDept = departments.find(d => d.id === targetDeptId);
    const timestamp = new Date().toISOString();

    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId || c.ticketNumber === complaintId || c.complaintId === complaintId) {
          const newEntry = {
            id: `tl-${Date.now()}`,
            status: COMPLAINT_STATUS.TRANSFERRED,
            title: targetDept ? `Transfer Requested to ${targetDept.name}` : 'Transfer Requested to Supervisor Admin',
            description: `Transfer request initiated by Officer ${officerUser?.name || ''}. Sent to Supervisor Admin for review & reallocation. Reason: ${reason}`,
            timestamp,
            author: officerUser?.name || 'Department Officer',
            role: 'Department Officer'
          };
          const transferRecord = {
            id: backendTransfer?.id || `tr-${Date.now()}`,
            complaintId: c.id,
            complaintTitle: c.title,
            fromDepartmentId: c.departmentId || officerUser?.departmentId,
            fromDepartmentName: c.department || officerUser?.department || 'Roads & Infrastructure',
            toDepartmentId: targetDeptId || null,
            toDepartmentName: targetDept?.name || 'Pending Supervisor Assignment',
            reason: reason,
            status: 'PENDING',
            transferredBy: officerUser?.name || 'Department Officer',
            timestamp
          };
          return {
            ...c,
            status: COMPLAINT_STATUS.TRANSFERRED,
            current_status: 'TRANSFERRED',
            transfers: [...(c.transfers || []), transferRecord],
            timeline: [...(c.timeline || []), newEntry]
          };
        }
        return c;
      })
    );
    return true;
  };

  const approveTransferRequest = async (transferId, complaintId, targetDeptId, reviewNotes, adminUser) => {
    try {
      await transfersApi.reviewTransfer(transferId, {
        action: 'ACCEPT',
        toDepartmentId: targetDeptId,
        reviewNotes
      });
    } catch (err) {
      console.warn('Backend review transfer API warning:', err.message);
    }

    const targetDept = departments.find(d => d.id === targetDeptId);
    const timestamp = new Date().toISOString();

    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId || c.ticketNumber === complaintId || c.complaintId === complaintId) {
          const newEntry = {
            id: `tl-${Date.now()}`,
            status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
            title: `Transfer Approved & Assigned to ${targetDept?.name || 'Department'}`,
            description: `Supervisor Admin (${adminUser?.name || 'Administrator'}) approved transfer. ${reviewNotes || ''}`,
            timestamp,
            author: adminUser?.name || 'Supervisor Admin',
            role: 'Super Admin'
          };
          const updatedTransfers = (c.transfers || []).map(tr => {
            if (tr.id === transferId) {
              return {
                ...tr,
                status: 'ACCEPTED',
                toDepartmentId: targetDeptId,
                toDepartmentName: targetDept?.name || tr.toDepartmentName,
                adminNotes: reviewNotes
              };
            }
            return tr;
          });
          return {
            ...c,
            departmentId: targetDeptId,
            department: targetDept?.name || c.department,
            status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
            current_status: 'DEPARTMENT_REVIEW',
            transfers: updatedTransfers,
            timeline: [...(c.timeline || []), newEntry]
          };
        }
        return c;
      })
    );

    const targetComp = complaints.find(c => c.id === complaintId || c.ticketNumber === complaintId || c.complaintId === complaintId);
    if (targetComp) {
      sendCitizenTrackerEmail({
        complaint: {
          ...targetComp,
          department: targetDept?.name || targetComp.department,
          status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
          citizenEmail: resolveCitizenEmail(targetComp)
        },
        eventType: 'DEPARTMENT_ASSIGNED'
      }).catch(err => console.warn('Citizen department assignment email notice:', err));
    }

    return true;
  };

  const rejectTransferRequest = async (transferId, complaintId, reviewNotes, adminUser) => {
    try {
      await transfersApi.reviewTransfer(transferId, {
        action: 'REJECT',
        reviewNotes
      });
    } catch (err) {
      console.warn('Backend review transfer API warning:', err.message);
    }

    const timestamp = new Date().toISOString();

    setComplaints(prev =>
      prev.map(c => {
        if (c.id === complaintId || c.ticketNumber === complaintId || c.complaintId === complaintId) {
          const newEntry = {
            id: `tl-${Date.now()}`,
            status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
            title: 'Transfer Request Rejected',
            description: `Supervisor Admin (${adminUser?.name || 'Administrator'}) rejected the transfer request. Retained in original department. Reason: ${reviewNotes || 'Declined'}`,
            timestamp,
            author: adminUser?.name || 'Supervisor Admin',
            role: 'Super Admin'
          };
          const updatedTransfers = (c.transfers || []).map(tr => {
            if (tr.id === transferId) {
              return {
                ...tr,
                status: 'REJECTED',
                adminNotes: reviewNotes
              };
            }
            return tr;
          });
          return {
            ...c,
            status: COMPLAINT_STATUS.DEPARTMENT_REVIEW,
            current_status: 'DEPARTMENT_REVIEW',
            transfers: updatedTransfers,
            timeline: [...(c.timeline || []), newEntry]
          };
        }
        return c;
      })
    );
    return true;
  };

  const acknowledgeComplaint = async (complaintId, officerUser, newPriority = null, fallbackId = null) => {
    const timestamp = new Date().toISOString();
    setComplaints(prev => {
      const updated = prev.map(c => {
        const matches =
          c.id === complaintId ||
          c.complaintId === complaintId ||
          c.assignmentId === complaintId ||
          c.ticketNumber === complaintId ||
          (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId));

        if (matches) {
          return {
            ...c,
            status: COMPLAINT_STATUS.ACKNOWLEDGED,
            priority: newPriority || c.priority,
            timeline: [
              ...(c.timeline || []),
              {
                id: `tl-${Date.now()}`,
                status: COMPLAINT_STATUS.ACKNOWLEDGED,
                title: 'Complaint Acknowledged',
                description: `Officer ${officerUser?.name || 'Department Officer'} accepted the grievance.`,
                timestamp,
                author: officerUser?.name || 'Department Officer',
                role: 'Department Officer'
              }
            ]
          };
        }
        return c;
      });

      setStorage(STORAGE_KEYS.COMPLAINTS, updated);
      return updated;
    });

    setTimeout(() => {
      fetchAllData().catch(() => {});
    }, 400);
  };

  const assignWorker = async (complaintId, workerId, notes, officerUser, fallbackId = null) => {
    try {
      await assignmentsApi.createAssignment({
        complaintId,
        workerId,
        assignmentNotes: notes || 'Site inspection and repair required.'
      });
    } catch (err) {
      console.warn('Backend assign worker API warning:', err.message);
    }

    const worker = workers.find(w => w.id === workerId);
    const timestamp = new Date().toISOString();

    setComplaints(prev => {
      const updated = prev.map(c => {
        const matches =
          c.id === complaintId ||
          c.complaintId === complaintId ||
          c.assignmentId === complaintId ||
          c.ticketNumber === complaintId ||
          (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId));

        if (matches) {
          return {
            ...c,
            assignedWorkerId: workerId,
            assignedWorkerName: worker?.name || 'Field Specialist',
            status: COMPLAINT_STATUS.WORKER_ASSIGNED,
            assignmentStatus: 'ASSIGNED',
            timeline: [
              ...(c.timeline || []),
              {
                id: `tl-${Date.now()}`,
                status: COMPLAINT_STATUS.WORKER_ASSIGNED,
                title: `Field Worker Assigned: ${worker?.name || 'Field Crew'}`,
                description: notes || `Assigned to ${worker?.name || 'specialist'}.`,
                timestamp,
                author: officerUser?.name || 'Department Officer',
                role: 'Department Officer'
              }
            ]
          };
        }
        return c;
      });

      setStorage(STORAGE_KEYS.COMPLAINTS, updated);
      return updated;
    });

    // 1. Retrieve worker registered email & full details
    const resolvedWorker = resolveWorker(workerId);
    const targetComp = complaints.find(c =>
      c.id === complaintId ||
      c.complaintId === complaintId ||
      c.assignmentId === complaintId ||
      c.ticketNumber === complaintId ||
      (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId))
    );

    // 2. Dispatch EmailJS Worker Assignment Email
    sendWorkerAssignmentEmail({
      worker: resolvedWorker,
      complaint: targetComp || { id: complaintId, ticketNumber: complaintId },
      officer: officerUser,
      notes
    }).catch(err => console.warn('Worker assignment email dispatch notice:', err));

    // 3. Dispatch EmailJS Citizen Live Tracker Email for worker assignment progress update
    if (targetComp) {
      sendCitizenTrackerEmail({
        complaint: {
          ...targetComp,
          status: COMPLAINT_STATUS.WORKER_ASSIGNED,
          citizenEmail: resolveCitizenEmail(targetComp),
          updatedAt: timestamp
        },
        eventType: 'WORKER_ASSIGNED'
      }).catch(err => console.warn('Citizen worker assigned tracker email notice:', err));
    }

    setTimeout(() => {
      fetchAllData().catch(() => {});
    }, 400);

    return true;
  };

  const acceptTask = async (taskIdOrComplaintId, workerUser) => {
    try {
      await assignmentsApi.acceptAssignment(taskIdOrComplaintId);
    } catch (err) {
      console.warn('Backend accept assignment notice:', err.message);
    }

    const timestamp = new Date().toISOString();
    setComplaints(prev => {
      const updated = prev.map(c => {
        if (c.id === taskIdOrComplaintId || c.complaintId === taskIdOrComplaintId || c.assignmentId === taskIdOrComplaintId || c.ticketNumber === taskIdOrComplaintId) {
          return {
            ...c,
            assignmentStatus: 'ACCEPTED',
            timeline: [
              ...(c.timeline || []),
              {
                id: `tl-${Date.now()}`,
                status: c.status,
                title: 'Assignment Accepted',
                description: `Field Worker ${workerUser?.name || 'Suresh Patil'} accepted the work order.`,
                timestamp,
                author: workerUser?.name || 'Field Worker',
                role: 'Field Worker'
              }
            ]
          };
        }
        return c;
      });

      setStorage(STORAGE_KEYS.COMPLAINTS, updated);
      return updated;
    });

    setTimeout(() => {
      fetchAllData().catch(() => {});
    }, 400);

    return true;
  };

  const updateWorkerTaskStatus = async (complaintId, newStatus, notes, beforePhotos, afterPhotos, workerUser, fallbackId = null) => {
    const timestamp = new Date().toISOString();

    // Async sync with assignments API
    const targetComp = complaints.find(c =>
      c.id === complaintId ||
      c.complaintId === complaintId ||
      c.ticketNumber === complaintId ||
      c.assignmentId === complaintId ||
      (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId))
    );
    const targetAssignmentId = targetComp?.assignmentId || targetComp?.id || complaintId;

    try {
      if (newStatus === COMPLAINT_STATUS.INSPECTION) {
        await assignmentsApi.logInspection(targetAssignmentId, {
          description: notes || 'Inspection completed on site.',
          notes: notes || 'Inspection completed on site.',
          evidenceUrls: beforePhotos && beforePhotos.length > 0 ? beforePhotos.filter(Boolean) : [],
          materialsUsed: [],
          technicalDetails: {}
        });
      } else if (newStatus === COMPLAINT_STATUS.WORK_IN_PROGRESS) {
        await assignmentsApi.startRemediation(targetAssignmentId);
      } else if (newStatus === COMPLAINT_STATUS.VERIFICATION) {
        const evidence = (afterPhotos && afterPhotos.length > 0)
          ? afterPhotos.filter(Boolean)
          : (beforePhotos && beforePhotos.length > 0 ? beforePhotos.filter(Boolean) : []);

        await assignmentsApi.completeWork(targetAssignmentId, {
          description: notes || 'Work completed and submitted for verification.',
          completionNotes: notes || 'Work completed and submitted for verification.',
          evidenceUrls: evidence,
          afterEvidenceUrls: evidence,
          materialsUsed: [],
          technicalDetails: {}
        });
      }
    } catch (err) {
      console.warn('Backend assignment status update note:', err.message);
    }

    setComplaints(prev => {
      const updated = prev.map(c => {
        const matches =
          c.id === complaintId ||
          c.complaintId === complaintId ||
          c.assignmentId === complaintId ||
          c.ticketNumber === complaintId ||
          (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId));

        if (matches) {
          const existingRes = c.resolutionEvidence || {};
          const updatedRes = {
            beforePhotos: beforePhotos && beforePhotos.length > 0 ? beforePhotos : (existingRes.beforePhotos || c.evidence || []),
            afterPhotos: afterPhotos && afterPhotos.length > 0 ? afterPhotos : (existingRes.afterPhotos || []),
            completionNotes: notes || existingRes.completionNotes || '',
            completedAt: newStatus === COMPLAINT_STATUS.VERIFICATION || newStatus === COMPLAINT_STATUS.RESOLVED ? timestamp : existingRes.completedAt
          };

          return {
            ...c,
            status: newStatus,
            assignmentStatus: newStatus === COMPLAINT_STATUS.VERIFICATION ? 'COMPLETED' : c.assignmentStatus,
            resolutionEvidence: updatedRes,
            timeline: [
              ...(c.timeline || []),
              {
                id: `tl-${Date.now()}`,
                status: newStatus,
                title: newStatus === COMPLAINT_STATUS.INSPECTION
                  ? 'Site Inspection Conducted'
                  : newStatus === COMPLAINT_STATUS.WORK_IN_PROGRESS
                  ? 'Remediation Work Started'
                  : newStatus === COMPLAINT_STATUS.VERIFICATION
                  ? 'Submitted for Verification'
                  : `Status updated to ${newStatus}`,
                description: notes || `Field crew update by ${workerUser?.name || 'Worker'}.`,
                timestamp,
                author: workerUser?.name || 'Field Worker',
                role: 'Field Worker'
              }
            ]
          };
        }
        return c;
      });

      setStorage(STORAGE_KEYS.COMPLAINTS, updated);
      return updated;
    });

    if (targetComp) {
      let eventType = 'PROGRESS_UPDATED';
      if (newStatus === COMPLAINT_STATUS.WORK_IN_PROGRESS) eventType = 'WORK_STARTED';
      else if (newStatus === COMPLAINT_STATUS.VERIFICATION) eventType = 'WORK_SUBMITTED_FOR_REVIEW';

      sendCitizenTrackerEmail({
        complaint: {
          ...targetComp,
          status: newStatus,
          citizenEmail: resolveCitizenEmail(targetComp),
          updatedAt: timestamp
        },
        eventType
      }).catch(err => console.warn('Citizen status update email notice:', err));
    }

    setTimeout(() => {
      fetchAllData().catch(() => {});
    }, 400);
  };

  const verifyResolution = async (complaintId, verified, notes, officerUser, fallbackId = null) => {
    try {
      await reviewsApi.officerVerify(complaintId, {
        decision: verified ? 'APPROVED' : 'REWORK_REQUIRED',
        reviewNotes: notes || (verified ? 'Approved on-site.' : 'Rework requested.'),
        reworkInstructions: verified ? undefined : (notes || 'Please rectify surface defects.')
      });
    } catch (err) {
      console.warn('Backend officer verify API warning:', err.message);
    }

    const targetStatus = verified ? COMPLAINT_STATUS.RESOLVED : COMPLAINT_STATUS.WORK_IN_PROGRESS;
    const timestamp = new Date().toISOString();

    setComplaints(prev => {
      const updated = prev.map(c => {
        const matches =
          c.id === complaintId ||
          c.complaintId === complaintId ||
          c.assignmentId === complaintId ||
          c.ticketNumber === complaintId ||
          (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId));

        if (matches) {
          return {
            ...c,
            status: targetStatus,
            assignmentStatus: verified ? 'COMPLETED' : 'IN_PROGRESS',
            timeline: [
              ...(c.timeline || []),
              {
                id: `tl-${Date.now()}`,
                status: targetStatus,
                title: verified ? 'Resolution Verified & Approved' : 'Resolution Rejected — Re-work Required',
                description: notes || (verified ? 'Officer confirmed work meets municipal standards.' : 'Defects found during inspection. Remediation rework ordered.'),
                timestamp,
                author: officerUser?.name || 'Department Officer',
                role: 'Department Officer'
              }
            ]
          };
        }
        return c;
      });

      setStorage(STORAGE_KEYS.COMPLAINTS, updated);
      return updated;
    });

    const targetComp = complaints.find(c =>
      c.id === complaintId ||
      c.complaintId === complaintId ||
      c.assignmentId === complaintId ||
      c.ticketNumber === complaintId ||
      (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId))
    );
    if (targetComp) {
      sendCitizenTrackerEmail({
        complaint: {
          ...targetComp,
          status: targetStatus,
          citizenEmail: resolveCitizenEmail(targetComp),
          updatedAt: timestamp
        },
        eventType: verified ? 'COMPLAINT_RESOLVED' : 'RESOLUTION_REJECTED'
      }).catch(err => console.warn('Citizen verify resolution email notice:', err));
    }

    setTimeout(() => {
      fetchAllData().catch(() => {});
    }, 400);
  };

  const citizenConfirmResolution = async (complaintId, citizenUser, fallbackId = null) => {
    const targetComp = complaints.find(
      c => c.id === complaintId || c.complaintId === complaintId || c.ticketNumber === complaintId || (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId))
    );
    const dbComplaintId = targetComp?.id || complaintId;

    try {
      await reviewsApi.citizenFeedback(dbComplaintId, {
        decision: 'CONFIRMED',
        rating: 5,
        feedback: 'Resolution confirmed by citizen. Case resolved satisfactorily.'
      });
    } catch (err) {
      console.warn('Backend citizen feedback API warning:', err.message);
    }

    const timestamp = new Date().toISOString();
    setComplaints(prev => {
      const updated = prev.map(c => {
        const matches =
          c.id === complaintId ||
          c.complaintId === complaintId ||
          c.assignmentId === complaintId ||
          c.ticketNumber === complaintId ||
          c.id === dbComplaintId ||
          (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId));

        if (matches) {
          return {
            ...c,
            status: COMPLAINT_STATUS.CLOSED,
            current_status: 'CLOSED',
            timeline: [
              ...(c.timeline || []),
              {
                id: `tl-${Date.now()}`,
                status: COMPLAINT_STATUS.CLOSED,
                title: 'Citizen Confirmed Resolution — Case Closed',
                description: `${citizenUser?.name || 'Citizen'} verified civic restoration and closed grievance.`,
                timestamp,
                author: citizenUser?.name || 'Citizen',
                role: 'Citizen'
              }
            ]
          };
        }
        return c;
      });

      setStorage(STORAGE_KEYS.COMPLAINTS, updated);
      return updated;
    });

    if (targetComp) {
      sendCitizenTrackerEmail({
        complaint: {
          ...targetComp,
          status: COMPLAINT_STATUS.CLOSED,
          citizenEmail: resolveCitizenEmail(targetComp),
          updatedAt: timestamp
        },
        eventType: 'COMPLAINT_CLOSED'
      }).catch(err => console.warn('Citizen confirm closure email notice:', err));
    }

    setTimeout(() => {
      fetchAllData().catch(() => {});
    }, 400);
  };

  const citizenDisputeResolution = async (complaintId, reason, citizenUser, fallbackId = null) => {
    const targetComp = complaints.find(
      c => c.id === complaintId || c.complaintId === complaintId || c.ticketNumber === complaintId || (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId))
    );
    const dbComplaintId = targetComp?.id || complaintId;

    try {
      await reviewsApi.citizenFeedback(dbComplaintId, {
        decision: 'DISPUTED',
        rating: 1,
        feedback: reason || 'Resolution is unsatisfactory. Issue remains unresolved.'
      });
    } catch (err) {
      console.warn('Backend citizen dispute API warning:', err.message);
    }

    const timestamp = new Date().toISOString();
    setComplaints(prev => {
      const updated = prev.map(c => {
        const matches =
          c.id === complaintId ||
          c.complaintId === complaintId ||
          c.assignmentId === complaintId ||
          c.ticketNumber === complaintId ||
          c.id === dbComplaintId ||
          (fallbackId && (c.id === fallbackId || c.ticketNumber === fallbackId || c.complaintId === fallbackId || c.assignmentId === fallbackId));

        if (matches) {
          return {
            ...c,
            status: COMPLAINT_STATUS.DISPUTED,
            current_status: 'DISPUTED',
            isEscalated: true,
            escalationLevel: 2,
            timeline: [
              ...(c.timeline || []),
              {
                id: `tl-${Date.now()}`,
                status: COMPLAINT_STATUS.DISPUTED,
                title: 'Resolution Disputed by Citizen',
                description: `Reason: "${reason}". Grievance escalated to Level 2.`,
                timestamp,
                author: citizenUser?.name || 'Citizen',
                role: 'Citizen'
              }
            ]
          };
        }
        return c;
      });

      setStorage(STORAGE_KEYS.COMPLAINTS, updated);
      return updated;
    });

    if (targetComp) {
      sendCitizenTrackerEmail({
        complaint: {
          ...targetComp,
          status: COMPLAINT_STATUS.DISPUTED,
          citizenEmail: resolveCitizenEmail(targetComp),
          updatedAt: timestamp
        },
        eventType: 'COMPLAINT_REOPENED'
      }).catch(err => console.warn('Citizen dispute reopen email notice:', err));
    }

    setTimeout(() => {
      fetchAllData().catch(() => {});
    }, 400);
  };

  // Admin management actions
  const updateSlaConfig = async (newSlas) => {
    setSlas(newSlas);
  };

  const addDepartment = async (dept) => {
    try {
      const created = await lookupsApi.createDepartment({
        name: dept.name,
        code: dept.code || dept.name.slice(0, 4).toUpperCase(),
        description: dept.description,
        contactEmail: dept.email || dept.contactEmail,
        contactPhone: dept.phone || dept.contactPhone
      });
      if (created) {
        const newDept = {
          ...dept,
          id: created.id,
          code: created.code,
          name: created.name,
          description: created.description,
          contactEmail: created.contact_email || dept.email,
          contactPhone: created.contact_phone || dept.phone,
          email: created.contact_email || dept.email,
          phone: created.contact_phone || dept.phone,
          headOfficer: dept.headOfficer || 'Designated Nodal Officer',
          isActive: true,
          activeComplaints: 0,
          totalComplaints: 0,
          staffCount: dept.staffCount || 10,
          slaTargetPct: dept.slaTargetPct || 90
        };
        setDepartments(prev => [...prev, newDept]);

        setTimeout(() => {
          fetchAllData().catch(() => {});
        }, 500);

        return newDept;
      }
    } catch (err) {
      console.error('Backend add department error:', err);
      throw err;
    }
  };

  const updateDepartment = async (id, updated) => {
    try {
      const res = await lookupsApi.updateDepartment(id, {
        name: updated.name,
        description: updated.description,
        contactEmail: updated.email || updated.contactEmail,
        contactPhone: updated.phone || updated.contactPhone,
        isActive: updated.isActive
      });
      setDepartments(prev => prev.map(d => (d.id === id ? {
        ...d,
        ...updated,
        contactEmail: updated.email || updated.contactEmail || d.contactEmail,
        contactPhone: updated.phone || updated.contactPhone || d.contactPhone,
        email: updated.email || updated.contactEmail || d.email,
        phone: updated.phone || updated.contactPhone || d.phone,
      } : d)));
      return res;
    } catch (err) {
      console.error('Backend update department error:', err);
      throw err;
    }
  };

  const addUser = async (userData) => {
    let resolvedDeptId = userData.departmentId;
    if (!resolvedDeptId && userData.department) {
      const match = departments.find(
        d => d.id === userData.department || d.name === userData.department || d.code === userData.department
      );
      resolvedDeptId = match?.id || null;
    }

    try {
      const created = await usersApi.createUser({
        email: (userData.email || '').trim().toLowerCase(),
        password: userData.password || 'officer123',
        fullName: userData.name,
        phone: userData.phone,
        role: userData.role === 'Citizen' ? 'CITIZEN' : userData.role === 'Department Officer' ? 'DEPARTMENT_OFFICER' : (userData.role === 'Field Worker' || userData.role === 'Contractor & Crew Operations' || userData.role === ROLES.WORKER) ? 'FIELD_WORKER' : 'SUPER_ADMIN',
        departmentId: resolvedDeptId
      });
      if (created) {
        const newUser = {
          ...userData,
          id: created.userCode || created.user_code || `USR${Math.floor(100 + Math.random() * 900)}`,
          dbId: created.id,
          userCode: created.userCode || created.user_code,
          name: created.fullName || created.full_name || userData.name,
          email: created.email,
          phone: created.phoneNumber || created.phone || userData.phone,
          role: userData.role,
          department: userData.department || departments.find(d => d.id === resolvedDeptId)?.name || 'General',
          status: 'Active',
          joinedDate: new Date().toISOString().split('T')[0],
          verified: true
        };
        setUsers(prev => [...prev, newUser]);
        return newUser;
      }
    } catch (err) {
      console.error('Backend add user error:', err.message);
      throw err;
    }
  };

  const updateUser = (id, updated) => {
    setUsers(prev => prev.map(u => (u.id === id ? { ...u, ...updated } : u)));
  };

  const toggleUserStatus = async (id) => {
    const targetUser = users.find(u => u.id === id);
    const newStatus = targetUser?.status === 'Active' ? false : true;
    try {
      await usersApi.updateUserStatus(id, newStatus);
    } catch (err) {
      console.warn('Backend toggle user status note:', err.message);
    }
    setUsers(prev =>
      prev.map(u => (u.id === id ? { ...u, status: u.status === 'Active' ? 'Inactive' : 'Active' } : u))
    );
  };

  const resetToDefaults = () => {
    fetchAllData();
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        departments,
        categories,
        wards,
        workers,
        slas,
        users,
        loading,
        fetchAllData,
        createComplaint,
        addSupporter,
        transferDepartment,
        approveTransferRequest,
        rejectTransferRequest,
        acknowledgeComplaint,
        assignWorker,
        acceptTask,
        updateWorkerTaskStatus,
        verifyResolution,
        citizenConfirmResolution,
        citizenDisputeResolution,
        updateSlaConfig,
        addDepartment,
        updateDepartment,
        addUser,
        updateUser,
        toggleUserStatus,
        resetToDefaults
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const context = useContext(ComplaintContext);
  if (!context) {
    throw new Error('useComplaints must be used within a ComplaintProvider');
  }
  return context;
};

export default ComplaintContext;
