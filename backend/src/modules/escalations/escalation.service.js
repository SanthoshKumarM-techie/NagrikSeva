import escalationRepository from './escalation.repository.js';
import complaintRepository from '../complaints/complaint.repository.js';
import notificationService from '../notifications/notification.service.js';
import auditService from '../audit/audit.service.js';
import ApiError from '../../utils/ApiError.js';
import db from '../../config/database.js';

export const listEscalations = async (filters, currentUser) => {
  let departmentId = filters.departmentId;
  if (currentUser.role === 'DEPARTMENT_OFFICER') {
    departmentId = currentUser.departmentId;
  }

  const limit = parseInt(filters.limit || 50, 10);
  const page = parseInt(filters.page || 1, 10);
  const offset = (page - 1) * limit;

  const [escalations, total] = await Promise.all([
    escalationRepository.findAll({ ...filters, departmentId, limit, offset }),
    escalationRepository.countAll({ ...filters, departmentId })
  ]);

  return {
    escalations,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  };
};

export const acknowledgeEscalation = async (id, user, clientInfo = {}) => {
  const escalation = await escalationRepository.findById(id);
  if (!escalation) {
    throw ApiError.notFound('Escalation record not found');
  }

  if (user.role !== 'SUPER_ADMIN' && user.departmentId !== escalation.department_id) {
    throw ApiError.forbidden('You can only acknowledge escalations in your department');
  }

  const updated = await escalationRepository.updateStatus(id, {
    status: 'ACKNOWLEDGED',
    resolvedBy: user.id,
    resolutionNotes: null
  });

  auditService.logEvent({
    userId: user.id,
    action: 'ACKNOWLEDGE_ESCALATION',
    entityType: 'ESCALATION',
    entityId: id,
    details: { complaintId: escalation.complaint_id },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return updated;
};

export const resolveEscalation = async (id, user, resolutionNotes, clientInfo = {}) => {
  const escalation = await escalationRepository.findById(id);
  if (!escalation) {
    throw ApiError.notFound('Escalation record not found');
  }

  if (user.role !== 'SUPER_ADMIN' && user.departmentId !== escalation.department_id) {
    throw ApiError.forbidden('You can only resolve escalations in your department');
  }

  return await db.withTransaction(async (client) => {
    const updated = await escalationRepository.updateStatus(id, {
      status: 'RESOLVED',
      resolvedBy: user.id,
      resolutionNotes
    }, client);

    auditService.logEvent({
      userId: user.id,
      action: 'RESOLVE_ESCALATION',
      entityType: 'ESCALATION',
      entityId: id,
      details: { complaintId: escalation.complaint_id, resolutionNotes },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return updated;
  });
};

export const manualEscalate = async (adminUser, { complaintId, escalationLevel = 1, reason }, clientInfo = {}) => {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  return await db.withTransaction(async (client) => {
    const escalation = await escalationRepository.createManual({
      complaintId,
      escalationLevel,
      reason
    }, client);

    await complaintRepository.addStatusHistory({
      complaintId,
      fromStatus: complaint.current_status,
      toStatus: complaint.current_status,
      changedBy: adminUser.id,
      remarks: `Manual administrative escalation to Level ${escalationLevel}. Reason: ${reason}`
    }, client);

    notificationService.notifyDepartmentOfficers({
      departmentId: complaint.department_id,
      complaintId,
      title: `ADMIN ESCALATION: Level ${escalationLevel}`,
      message: `Administrator flagged #${complaint.ticket_number} for urgent intervention: "${reason}"`,
      notificationType: 'SLA_ESCALATION'
    }).catch(console.error);

    auditService.logEvent({
      userId: adminUser.id,
      action: 'MANUAL_ESCALATION',
      entityType: 'ESCALATION',
      entityId: escalation.id,
      details: { complaintId, escalationLevel, reason },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return escalation;
  });
};

export default {
  listEscalations,
  acknowledgeEscalation,
  resolveEscalation,
  manualEscalate
};
