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
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(workerId);
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
      remarks: `Site inspection conducted: ${data.description}`
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
      details: { description: data.description },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return update;
  });
};

export const startRemediation = async (assignmentId, workerId, clientInfo = {}, currentUser = null) => {
  const assignment = await assignmentRepository.findById(assignmentId);
  if (!assignment) {
    throw ApiError.notFound('Assignment not found');
  }

  const isStaff = currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'DEPARTMENT_OFFICER' || currentUser?.role === 'ADMIN';
  if (assignment.worker_id !== workerId && !isStaff) {
    throw ApiError.forbidden('You are not assigned to this complaint');
  }

  return await db.withTransaction(async (client) => {
    await assignmentRepository.updateAssignmentStatus(assignment.id, 'IN_PROGRESS', client);
    await complaintRepository.updateStatus(assignment.complaint_id, 'WORK_IN_PROGRESS', client);

    await complaintRepository.addStatusHistory({
      complaintId: assignment.complaint_id,
      fromStatus: assignment.complaint_status,
      toStatus: 'WORK_IN_PROGRESS',
      changedBy: workerId,
      remarks: 'Remediation work has begun on site'
    }, client);

    notificationService.notifyUser({
      userId: assignment.citizen_id,
      complaintId: assignment.complaint_id,
      title: 'Work In Progress',
      message: `Field remediation work has officially started on complaint #${assignment.ticket_number}.`,
      notificationType: 'STATUS_UPDATED'
    }).catch(console.error);

    auditService.logEvent({
      userId: workerId,
      action: 'START_REMEDIATION',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: {},
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return {
      status: 'WORK_IN_PROGRESS',
      assignment: { id: assignment.id, status: 'IN_PROGRESS' }
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
      description: data.description
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

  const evidenceUrls = rawEvidence.length > 0
    ? rawEvidence
    : ['https://ikrdqbyrgzhjslnbqzqy.supabase.co/storage/v1/object/public/complaint-evidence/sample-work-completed.jpg'];

  const description = data.description || data.completionNotes || data.notes || 'Remediation completed';

  return await db.withTransaction(async (client) => {
    // 1. Create completion work update
    const update = await assignmentRepository.createWorkUpdate({
      assignmentId: assignment.id,
      workerId,
      updateType: 'COMPLETION_SUBMITTED',
      description
    }, client);

    // 2. Attach AFTER evidence
    for (const url of evidenceUrls) {
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
      remarks: `Work completed by contractor & crew: ${data.description}. Evidence submitted for officer verification.`
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
      message: `Work on complaint #${assignment.ticket_number} has been completed and submitted for officer inspection.`,
      notificationType: 'STATUS_UPDATED'
    }).catch(console.error);

    auditService.logEvent({
      userId: workerId,
      action: 'COMPLETE_WORK',
      entityType: 'ASSIGNMENT',
      entityId: assignment.id,
      details: { description: data.description, evidenceCount: data.evidenceUrls.length },
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
  addProgressUpdate,
  completeWork
};
