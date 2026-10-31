import assignmentRepository from './assignment.repository.js';
import complaintRepository from '../complaints/complaint.repository.js';
import userRepository from '../users/user.repository.js';
import evidenceRepository from '../evidence/evidence.repository.js';
import notificationService from '../notifications/notification.service.js';
import auditService from '../audit/audit.service.js';
import ApiError from '../../utils/ApiError.js';
import db from '../../config/database.js';

export const assignWorker = async (officerUser, { complaintId, workerId, priority, instructions, assignmentNotes }, clientInfo = {}) => {
  const effectiveInstructions = instructions || assignmentNotes;
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  // Officer must belong to complaint's department unless SUPER_ADMIN
  const userDeptId = officerUser.departmentId || officerUser.department_id;
  const isSuper = officerUser.role === 'SUPER_ADMIN' || officerUser.role === 'ADMIN';
  if (!isSuper && userDeptId && complaint.department_id && complaint.department_id !== userDeptId) {
    throw ApiError.forbidden('You can only assign workers to complaints in your department');
  }

  let worker = null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(workerId);
  if (isUuid) {
    worker = await userRepository.findById(workerId);
  } else {
    const res = await db.query('SELECT * FROM users WHERE user_code = $1 OR id::text = $1', [workerId]);
    worker = res.rows[0] || null;
  }

  if (!worker || worker.role !== 'FIELD_WORKER') {
    throw ApiError.badRequest('Selected user is not a valid contractor or crew member');
  }

  if (!isSuper && complaint.department_id && worker.department_id && worker.department_id !== complaint.department_id && worker.department_id !== userDeptId) {
    throw ApiError.badRequest('Worker must belong to the same department');
  }

  return await db.withTransaction(async (client) => {
    // Cancel any existing active assignment for this complaint to allow reassignment
    await client.query(`
      UPDATE worker_assignments
      SET status = 'CANCELLED'
      WHERE complaint_id = $1 AND status IN ('ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS', 'REWORK_REQUIRED', 'COMPLETED')
    `, [complaint.id]);

    // 1. Create assignment
    const assignment = await assignmentRepository.createAssignment({
      complaintId: complaint.id,
      workerId: worker.id,
      assignedBy: officerUser.id,
      priority: priority || complaint.priority || 'MEDIUM',
      instructions: effectiveInstructions
    }, client);

    // 2. Update complaint status to WORKER_ASSIGNED
    await complaintRepository.updateStatus(complaint.id, 'WORKER_ASSIGNED', client);

    // 3. Status history
    await complaintRepository.addStatusHistory({
      complaintId: complaint.id,
      fromStatus: complaint.current_status,
      toStatus: 'WORKER_ASSIGNED',
      changedBy: officerUser.id,
      remarks: `Assigned to field worker ${worker.full_name}. Priority: ${priority || 'MEDIUM'}`
    }, client);

    // 4. Notify worker
    notificationService.notifyUser({
      userId: worker.id,
      complaintId: complaint.id,
      title: 'New Work Assignment',
      message: `You have been assigned complaint #${complaint.ticket_number}: "${complaint.title}"`,
      notificationType: 'ASSIGNMENT_CREATED'
    }).catch(console.error);

    // 5. Notify citizen
    notificationService.notifyUser({
      userId: complaint.citizen_id,
      complaintId: complaint.id,
      title: 'Contractor & Crew Assigned',
      message: `A contractor & crew specialist (${worker.full_name}) has been assigned to your complaint #${complaint.ticket_number}.`,
      notificationType: 'STATUS_UPDATED'
    }).catch(console.error);

    // 6. Audit log
    auditService.logEvent({
      userId: officerUser.id,
      action: 'ASSIGN_WORKER',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: { complaintId, workerId, priority },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return assignment;
  });
};

export const getWorkerTasks = async (workerId, filters) => {
  return await assignmentRepository.findWorkerTasks(workerId, filters);
};

export const getAssignmentById = async (id) => {
  const assignment = await assignmentRepository.findById(id);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  const updates = await assignmentRepository.getWorkUpdatesByAssignment(id);
  return {
    ...assignment,
    updates
  };
};

export const acceptAssignment = async (assignmentId, workerId, clientInfo = {}, currentUser = null) => {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  const isStaff = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'DEPARTMENT_OFFICER' || currentUser?.role === 'ADMIN';
  if (assignment.worker_id !== workerId && !isStaff) {
    throw ApiError.forbidden('You can only accept assignments assigned to you');
  }

  return await db.withTransaction(async (client) => {
    const updated = await assignmentRepository.updateAssignmentStatus(assignment.id, 'ACCEPTED', client);

    auditService.logEvent({
      userId: workerId,
      action: 'ACCEPT_ASSIGNMENT',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: {},
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return updated;
  });
};

export const logInspection = async (assignmentId, workerId, data, clientInfo = {}, currentUser = null) => {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  const isStaff = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'DEPARTMENT_OFFICER' || currentUser?.role === 'ADMIN';
  if (assignment.worker_id !== workerId && !isStaff) {
    throw ApiError.forbidden('You are not assigned to this complaint');
  }

  const description = data.description || data.notes || 'Site inspection logged';

  return await db.withTransaction(async (client) => {
    // 1. Create work update
    const update = await assignmentRepository.createWorkUpdate({
      assignmentId: assignment.id,
      workerId,
      updateType: 'INSPECTION',
      description
    }, client);

    // 2. Attach evidence
    if (data.evidenceUrls && Array.isArray(data.evidenceUrls)) {
      for (const url of data.evidenceUrls) {
        await evidenceRepository.create({
          complaintId: assignment.complaint_id,
          uploadedBy: workerId,
          stage: 'WORKER_BEFORE',
          fileUrl: url,
          fileType: 'image/jpeg',
          fileSizeBytes: 0,
          caption: 'Site inspection photo'
        }, client);
      }
    }

    // 3. Update assignment & complaint status
    await assignmentRepository.updateAssignmentStatus(assignment.id, 'INSPECTION', client);
    await complaintRepository.updateStatus(assignment.complaint_id, 'INSPECTION', client);

    // 4. Status history
    await complaintRepository.addStatusHistory({
      complaintId: assignment.complaint_id,
      fromStatus: assignment.complaint_status,
      toStatus: 'INSPECTION',
      changedBy: workerId,
      remarks: `Site inspection conducted: ${description}`
    }, client);

    // 5. Notify citizen
    notificationService.notifyUser({
      userId: assignment.citizen_id,
      complaintId: assignment.complaint_id,
      title: 'Site Inspection Completed',
      message: `A contractor & crew specialist has inspected the site for #${assignment.ticket_number}. Remediation planning is underway.`,
      notificationType: 'STATUS_UPDATED'
    }).catch(console.error);

    auditService.logEvent({
      userId: workerId,
      action: 'LOG_INSPECTION',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: { description },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return update;
  });
};

export const startRemediation = async (assignmentId, workerId, data = {}, clientInfo = {}, currentUser = null) => {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  const isStaff = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'DEPARTMENT_OFFICER' || currentUser?.role === 'ADMIN';
  if (assignment.worker_id !== workerId && !isStaff) {
    throw ApiError.forbidden('You are not assigned to this complaint');
  }

  const description = data.description || data.notes || 'Remediation work has begun on site';
  const startDate = data.startDate || new Date().toISOString();

  return await db.withTransaction(async (client) => {
    // 1. Update assignment & complaint status
    await assignmentRepository.updateAssignmentStatus(assignment.id, 'IN_PROGRESS', client);
    await complaintRepository.updateStatus(assignment.complaint_id, 'WORK_IN_PROGRESS', client);

    // 2. Set work_started_at timestamp on complaint
    await client.query(`
      UPDATE complaints 
      SET work_started_at = $2 
      WHERE id = $1
    `, [assignment.complaint_id, startDate]);

    // 3. Create work update entry
    await assignmentRepository.createWorkUpdate({
      assignmentId: assignment.id,
      workerId,
      updateType: 'WORK_STARTED',
      description: `Work started on ${new Date(startDate).toLocaleDateString()}: ${description}`
    }, client);

    // 4. Attach any initial work start evidence photos
    if (data.evidenceUrls && Array.isArray(data.evidenceUrls)) {
      for (const url of data.evidenceUrls) {
        await evidenceRepository.create({
          complaintId: assignment.complaint_id,
          uploadedBy: workerId,
          stage: 'WORKER_BEFORE',
          fileUrl: url,
          fileType: 'image/jpeg',
          fileSizeBytes: 0,
          caption: 'Work start photo'
        }, client);
      }
    }

    // 5. Status history
    await complaintRepository.addStatusHistory({
      complaintId: assignment.complaint_id,
      fromStatus: assignment.complaint_status,
      toStatus: 'WORK_IN_PROGRESS',
      changedBy: workerId,
      remarks: `Remediation work officially begun. Start Date: ${new Date(startDate).toLocaleString()}. Plan: ${description}`
    }, client);

    // 6. Notify citizen
    notificationService.notifyUser({
      userId: assignment.citizen_id,
      complaintId: assignment.complaint_id,
      title: 'Work In Progress on Site',
      message: `Field remediation work has officially started on complaint #${assignment.ticket_number}. Plan: "${description}"`,
      notificationType: 'STATUS_UPDATED'
    }).catch(console.error);

    auditService.logEvent({
      userId: workerId,
      action: 'START_REMEDIATION',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: { startDate, description },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return {
      status: 'WORK_IN_PROGRESS',
      assignment: { id: assignment.id, status: 'IN_PROGRESS' }
    };
  });
};

export const reportWorkDelay = async (assignmentId, workerId, data, clientInfo = {}, currentUser = null) => {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  const isStaff = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'DEPARTMENT_OFFICER' || currentUser?.role === 'ADMIN';
  if (assignment.worker_id !== workerId && !isStaff) {
    throw ApiError.forbidden('You are not assigned to this complaint');
  }

  const { delayReason, description, estimatedCompletionDate, evidenceUrls = [] } = data;

  return await db.withTransaction(async (client) => {
    // 1. Create work update entry for DELAY
    const technicalDetails = JSON.stringify({
      delayReason,
      estimatedCompletionDate,
      reportedAt: new Date().toISOString()
    });

    const update = await assignmentRepository.createWorkUpdate({
      assignmentId: assignment.id,
      workerId,
      updateType: 'DELAY',
      description: `[Work Delay: ${delayReason}] ${description} (Revised Target: ${estimatedCompletionDate})`,
      technicalDetails
    }, client);

    // 2. Attach delay photo evidence
    for (const url of evidenceUrls) {
      await evidenceRepository.create({
        complaintId: assignment.complaint_id,
        uploadedBy: workerId,
        stage: 'WORKER_BEFORE',
        fileUrl: url,
        fileType: 'image/jpeg',
        fileSizeBytes: 0,
        caption: `Site Delay Evidence: ${delayReason}`
      }, client);
    }

    // 3. Status history entry
    await complaintRepository.addStatusHistory({
      complaintId: assignment.complaint_id,
      fromStatus: assignment.complaint_status,
      toStatus: assignment.complaint_status,
      changedBy: workerId,
      remarks: `Work Delay Reported by Contractor: "${delayReason}" - ${description}. Revised Target Date: ${estimatedCompletionDate}. Delay photographic proof attached.`
    }, client);

    // 4. Multi-role Notifications (immediately persisted):
    try {
      await Promise.allSettled([
        notificationService.notifyUser({
          userId: assignment.citizen_id,
          complaintId: assignment.complaint_id,
          title: `Work Delay Reported: #${assignment.ticket_number}`,
          message: `Contractor reported an on-site work delay for #${assignment.ticket_number} (${delayReason}): "${description}". Revised completion target: ${estimatedCompletionDate}.`,
          type: 'WORK_DELAY'
        }),
        notificationService.notifyDepartmentOfficers({
          departmentId: assignment.department_id,
          complaintId: assignment.complaint_id,
          title: `Field Work Delay: #${assignment.ticket_number}`,
          message: `Field worker ${assignment.worker_name} reported on-site delay for #${assignment.ticket_number} (${delayReason}): "${description}". Revised target: ${estimatedCompletionDate}.`,
          type: 'DEPARTMENT_ALERT'
        }),
        notificationService.notifyAdmins({
          complaintId: assignment.complaint_id,
          title: `Civic Work Delay Alert: #${assignment.ticket_number}`,
          message: `Work delay flagged on #${assignment.ticket_number} (${delayReason}). Revised completion target: ${estimatedCompletionDate}.`,
          type: 'ADMIN_ALERT'
        })
      ]);
    } catch (notifErr) {
      console.warn('Notification dispatch warning:', notifErr.message);
    }

    auditService.logEvent({
      userId: workerId,
      action: 'REPORT_WORK_DELAY',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: { delayReason, description, estimatedCompletionDate, evidenceCount: evidenceUrls.length },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return {
      message: 'Work delay reported successfully. Notifications dispatched to citizen, department, and super admin.',
      update
    };
  });
};

export const addProgressUpdate = async (assignmentId, workerId, data, clientInfo = {}) => {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  if (assignment.worker_id !== workerId) {
    throw ApiError.forbidden('You are not assigned to this complaint');
  }

  return await db.withTransaction(async (client) => {
    const update = await assignmentRepository.createWorkUpdate({
      assignmentId,
      workerId,
      updateType: data.updateType || 'PROGRESS',
      description: data.description,
      materialsUsed: data.materialsUsed,
      technicalDetails: data.technicalDetails
    }, client);

    if (data.evidenceUrls && Array.isArray(data.evidenceUrls)) {
      for (const url of data.evidenceUrls) {
        await evidenceRepository.create({
          complaintId: assignment.complaint_id,
          uploadedBy: workerId,
          stage: 'WORKER_BEFORE',
          fileUrl: url,
          fileType: 'image/jpeg',
          fileSizeBytes: 0,
          caption: 'Progress update photo'
        }, client);
      }
    }

    auditService.logEvent({
      userId: workerId,
      action: 'WORK_PROGRESS_UPDATE',
      entityType: 'ASSIGNMENT',
      entityId: assignmentId,
      details: { description: data.description },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return update;
  });
};

export const completeWork = async (assignmentId, workerId, data, clientInfo = {}, currentUser = null) => {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  const isStaff = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'DEPARTMENT_OFFICER' || currentUser?.role === 'ADMIN';
  if (assignment.worker_id !== workerId && !isStaff) {
    throw ApiError.forbidden('You are not assigned to this complaint');
  }

  const rawEvidence = (data.evidenceUrls && data.evidenceUrls.length > 0)
    ? data.evidenceUrls
    : (data.afterEvidenceUrls && data.afterEvidenceUrls.length > 0 ? data.afterEvidenceUrls : []);

  if (rawEvidence.length === 0) {
    throw ApiError.badRequest('Photo evidence of completed work is mandatory before marking work as completed.');
  }

  const description = data.description || data.completionNotes || data.notes;
  if (!description || description.trim().length < 5) {
    throw ApiError.badRequest('Mandatory completion details of at least 5 characters is required.');
  }

  return await db.withTransaction(async (client) => {
    // 1. Create completion work update
    const update = await assignmentRepository.createWorkUpdate({
      assignmentId: assignment.id,
      workerId,
      updateType: 'COMPLETION_SUBMITTED',
      description,
      materialsUsed: data.materialsUsed,
      technicalDetails: data.technicalDetails
    }, client);

    // 2. Attach AFTER evidence
    for (const url of rawEvidence) {
      await evidenceRepository.create({
        complaintId: assignment.complaint_id,
        uploadedBy: workerId,
        stage: 'WORKER_AFTER',
        fileUrl: url,
        fileType: 'image/jpeg',
        fileSizeBytes: 0,
        caption: 'Remediation completed AFTER photo'
      }, client);
    }

    // 3. Mark assignment completed
    await assignmentRepository.updateAssignmentStatus(assignment.id, 'COMPLETED', client);

    // 4. Update complaint status to VERIFICATION
    await complaintRepository.updateStatus(assignment.complaint_id, 'VERIFICATION', client);

    // 5. Status history
    await complaintRepository.addStatusHistory({
      complaintId: assignment.complaint_id,
      fromStatus: assignment.complaint_status,
      toStatus: 'VERIFICATION',
      changedBy: workerId,
      remarks: `Work completed by contractor & crew: ${description}. Evidence submitted for verification.`
    }, client);

    // 6. Notify Department Officers
    notificationService.notifyDepartmentOfficers({
      departmentId: assignment.department_id,
      complaintId: assignment.complaint_id,
      title: 'Work Completed – Verification Needed',
      message: `Worker ${assignment.worker_name} marked #${assignment.ticket_number} as completed. Please review and verify.`,
      notificationType: 'STATUS_UPDATED'
    }).catch(console.error);

    // 7. Notify Citizen
    notificationService.notifyUser({
      userId: assignment.citizen_id,
      complaintId: assignment.complaint_id,
      title: 'Work Completed on Site',
      message: `Work on complaint #${assignment.ticket_number} has been completed and submitted for inspection & confirmation.`,
      notificationType: 'STATUS_UPDATED'
    }).catch(console.error);

    auditService.logEvent({
      userId: workerId,
      action: 'COMPLETE_WORK',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: { description, evidenceCount: rawEvidence.length },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return {
      status: 'VERIFICATION',
      assignment: { id: assignment.id, status: 'SUBMITTED_FOR_VERIFICATION' },
      updateId: update.id
    };
  });
};

export default {
  assignWorker,
  getWorkerTasks,
  getAssignmentById,
  acceptAssignment,
  logInspection,
  startRemediation,
  reportWorkDelay,
  addProgressUpdate,
  completeWork
};
