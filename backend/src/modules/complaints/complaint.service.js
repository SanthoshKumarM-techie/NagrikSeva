import complaintRepository from './complaint.repository.js';
import categoryRepository from '../categories/category.repository.js';
import departmentRepository from '../departments/department.repository.js';
import evidenceRepository from '../evidence/evidence.repository.js';
import assignmentRepository from '../assignments/assignment.repository.js';
import notificationService from '../notifications/notification.service.js';
import auditService from '../audit/audit.service.js';
import generateTicketNumber from '../../utils/generateTicketNumber.js';
import { isValidTransition } from '../../utils/statusTransitions.js';
import ApiError from '../../utils/ApiError.js';
import db from '../../config/database.js';

export const findNearbyMatches = async ({ latitude, longitude, categoryId, radiusMeters }) => {
  return await complaintRepository.findNearbyMatches({
    latitude,
    longitude,
    categoryId,
    radiusMeters
  });
};

export const createComplaint = async (citizenId, data, clientInfo = {}) => {
  const isUuid = (val) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(val);

  // Check category
  let category = null;
  if (isUuid(data.categoryId)) {
    category = await categoryRepository.findById(data.categoryId);
  }
  if (!category) {
    const allCats = await categoryRepository.findAll();
    const catQuery = (data.categoryId || '').toLowerCase();
    category = allCats.find(c => c.name.toLowerCase() === catQuery) ||
               allCats.find(c => c.name.toLowerCase().includes(catQuery) || catQuery.includes(c.name.toLowerCase())) ||
               allCats[0];
  }
  if (!category) {
    throw ApiError.badRequest('Invalid complaint category specified');
  }

  // Check department
  let department = null;
  if (isUuid(data.departmentId)) {
    department = await departmentRepository.findById(data.departmentId);
  }
  if (!department && category.department_id) {
    department = await departmentRepository.findById(category.department_id);
  }
  if (!department) {
    const allDepts = await departmentRepository.findAll();
    const deptQuery = (data.departmentId || '').toLowerCase();
    department = allDepts.find(d => (d.code && d.code.toLowerCase() === deptQuery) || (d.name && d.name.toLowerCase().includes(deptQuery))) ||
                 allDepts[0];
  }
  if (!department) {
    throw ApiError.badRequest('Invalid department specified');
  }

  // Calculate SLA deadline
  const slaHours = category.sla_hours || department.sla_default_hours || 72;
  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  // Generate ticket number BLR-YYYY-XXXX
  const ticketNumber = generateTicketNumber();

  return await db.withTransaction(async (client) => {
    // 1. Insert complaint
    const complaint = await complaintRepository.create({
      ticketNumber,
      title: data.title,
      description: data.description,
      citizenId,
      categoryId: category.id,
      departmentId: department.id,
      wardId: data.wardId && isUuid(data.wardId) ? data.wardId : null,
      latitude: data.latitude || 12.9716,
      longitude: data.longitude || 77.5946,
      address: data.address,
      landmark: data.landmark,
      priority: data.priority || 'MEDIUM',
      slaDeadline,
      isDuplicateOf: data.isDuplicateOf || null
    }, client);

    // 2. Add status history
    await complaintRepository.addStatusHistory({
      complaintId: complaint.id,
      fromStatus: null,
      toStatus: 'SUBMITTED',
      changedBy: citizenId,
      remarks: 'Complaint registered by citizen'
    }, client);

    // 3. Add initial evidence if provided
    if (data.evidenceUrls && Array.isArray(data.evidenceUrls)) {
      for (const url of data.evidenceUrls) {
        await evidenceRepository.create({
          complaintId: complaint.id,
          workUpdateId: null,
          uploadedBy: citizenId,
          evidenceType: 'BEFORE',
          fileUrl: url,
          fileType: 'image/jpeg',
          fileSizeBytes: 0,
          caption: 'Initial complaint evidence'
        }, client);
      }
    }

    // 4. Add citizen as supporter
    await complaintRepository.addSupporter(complaint.id, citizenId, client);

    // 5. Send notification to citizen
    notificationService.notifyUser({
      userId: citizenId,
      complaintId: complaint.id,
      title: 'Complaint Registered',
      message: `Your complaint #${complaint.ticket_number} has been registered successfully. SLA target: ${slaHours} hours.`,
      notificationType: 'COMPLAINT_REGISTERED'
    }).catch(console.error);

    // 6. Send notification to department officers
    notificationService.notifyDepartmentOfficers({
      departmentId: complaint.department_id,
      complaintId: complaint.id,
      title: 'New Complaint Received',
      message: `New complaint #${complaint.ticket_number} registered in category: ${category.name}`,
      notificationType: 'COMPLAINT_REGISTERED'
    }).catch(console.error);

    // 7. Audit log
    auditService.logEvent({
      userId: citizenId,
      action: 'CREATE_COMPLAINT',
      entityType: 'COMPLAINT',
      entityId: complaint.id,
      details: { ticketNumber: complaint.ticket_number, categoryId: data.categoryId, priority: data.priority },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return complaint;
  });
};

export const supportComplaint = async (complaintId, citizenId, clientInfo = {}) => {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  const alreadySupported = await complaintRepository.isSupportedBy(complaint.id, citizenId);
  if (alreadySupported) {
    throw ApiError.badRequest('You have already supported this complaint');
  }

  const added = await complaintRepository.addSupporter(complaint.id, citizenId);
  if (!added) {
    throw ApiError.badRequest('Could not support this complaint');
  }

  notificationService.notifyUser({
    userId: complaint.citizen_id,
    complaintId: complaint.id,
    title: 'New Citizen Support',
    message: `Another citizen has supported your complaint #${complaint.ticket_number}. Total supporters: ${complaint.support_count + 1}`,
    notificationType: 'COMMUNITY_SUPPORT'
  }).catch(console.error);

  auditService.logEvent({
    userId: citizenId,
    action: 'SUPPORT_COMPLAINT',
    entityType: 'COMPLAINT',
    entityId: complaintId,
    details: { ticketNumber: complaint.ticket_number },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return { supportCount: complaint.support_count + 1 };
};

export const listComplaints = async (filters, currentUser) => {
  const page = parseInt(filters.page || 1, 10);
  const limit = parseInt(filters.limit || 20, 10);
  const offset = (page - 1) * limit;

  // Officers only see their department complaints unless they query specific filters allowed
  let departmentId = filters.departmentId;
  if (currentUser && currentUser.role === 'DEPARTMENT_OFFICER') {
    departmentId = currentUser.departmentId;
  }

  const queryFilters = {
    ...filters,
    departmentId,
    limit,
    offset
  };

  const [complaints, total] = await Promise.all([
    complaintRepository.findAll(queryFilters),
    complaintRepository.countAll(queryFilters)
  ]);

  return {
    complaints,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getMyComplaints = async (citizenId, filters) => {
  const page = parseInt(filters.page || 1, 10);
  const limit = parseInt(filters.limit || 20, 10);
  const offset = (page - 1) * limit;

  const [complaints, total] = await Promise.all([
    complaintRepository.findMyComplaints(citizenId, { filter: filters.filter, limit, offset }),
    complaintRepository.countMyComplaints(citizenId, { filter: filters.filter })
  ]);

  return {
    complaints,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const getComplaintById = async (id, currentUserId = null) => {
  const complaint = await complaintRepository.findById(id);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  const [evidence, timeline, isSupported, workUpdates] = await Promise.all([
    evidenceRepository.findByComplaintId(complaint.id),
    complaintRepository.getStatusHistory(complaint.id),
    currentUserId ? complaintRepository.isSupportedBy(complaint.id, currentUserId) : Promise.resolve(false),
    assignmentRepository.getWorkUpdatesByComplaintId(complaint.id).catch(() => [])
  ]);

  return {
    ...complaint,
    is_supported_by_me: isSupported,
    evidence,
    timeline,
    work_updates: workUpdates || []
  };
};

export const cancelComplaint = async (id, citizenId, remarks, clientInfo = {}) => {
  const complaint = await complaintRepository.findById(id);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  if (complaint.citizen_id !== citizenId) {
    throw ApiError.forbidden('You can only cancel complaints filed by you');
  }

  if (complaint.current_status !== 'SUBMITTED') {
    throw ApiError.badRequest('Complaint cannot be cancelled once it has been processed or assigned');
  }

  return await db.withTransaction(async (client) => {
    const updated = await complaintRepository.updateStatus(id, 'CLOSED', client);

    await complaintRepository.addStatusHistory({
      complaintId: id,
      fromStatus: 'SUBMITTED',
      toStatus: 'CLOSED',
      changedBy: citizenId,
      remarks: `Cancelled by citizen: ${remarks}`
    }, client);

    auditService.logEvent({
      userId: citizenId,
      action: 'CANCEL_COMPLAINT',
      entityType: 'COMPLAINT',
      entityId: id,
      details: { remarks },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return updated;
  });
};

export const getCitizenStats = async (citizenId) => {
  const raw = await complaintRepository.getCitizenStats(citizenId);
  return {
    ...raw,
    totalComplaints: raw?.total_filed || 0,
    pendingCount: raw?.active_count || 0,
    inProgressCount: raw?.active_count || 0,
    resolvedCount: raw?.resolved_count || 0,
    supportedCount: raw?.supported_count || 0
  };
};

export const getDepartmentStats = async (departmentId) => {
  return await complaintRepository.getDepartmentStats(departmentId);
};

export const getMapComplaints = async (filters) => {
  return await complaintRepository.getMapComplaints(filters);
};

export default {
  findNearbyMatches,
  createComplaint,
  supportComplaint,
  listComplaints,
  getMyComplaints,
  getComplaintById,
  cancelComplaint,
  getCitizenStats,
  getDepartmentStats,
  getMapComplaints
};

