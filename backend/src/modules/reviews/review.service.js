import reviewRepository from './review.repository.js';
import complaintRepository from '../complaints/complaint.repository.js';
import notificationService from '../notifications/notification.service.js';
import auditService from '../audit/audit.service.js';
import ApiError from '../../utils/ApiError.js';
import db from '../../config/database.js';

export const officerVerify = async (complaintId, officerUser, data, clientInfo = {}) => {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  const userDeptId = officerUser.departmentId || officerUser.department_id;
  const isSuper = officerUser.role === 'SUPER_ADMIN' || officerUser.role === 'ADMIN';
  if (!isSuper && userDeptId && complaint.department_id && complaint.department_id !== userDeptId) {
    throw ApiError.forbidden('You can only verify complaints within your department');
  }

  if (complaint.current_status !== 'VERIFICATION' && complaint.current_status !== 'WORK_IN_PROGRESS' && complaint.current_status !== 'INSPECTION' && complaint.current_status !== 'WORKER_ASSIGNED') {
    throw ApiError.badRequest(`Cannot verify complaint in status '${complaint.current_status}'. Status must be VERIFICATION or active remediation.`);
  }

  const isApproved = data.decision === 'APPROVED';
  const newStatus = isApproved ? 'RESOLVED' : 'WORK_IN_PROGRESS';

  return await db.withTransaction(async (client) => {
    // 1. Create review entry
    const review = await reviewRepository.createReview({
      complaintId: complaint.id,
      reviewerId: officerUser.id,
      reviewType: 'OFFICER_VERIFICATION',
      decision: isApproved ? 'APPROVED' : 'REWORK_REQUIRED',
      feedback: data.feedback || data.reworkInstructions
    }, client);

    // 2. Update complaint status
    await complaintRepository.updateStatus(complaint.id, newStatus, client);

    // 3. Status history
    await complaintRepository.addStatusHistory({
      complaintId: complaint.id,
      fromStatus: complaint.current_status,
      toStatus: newStatus,
      changedBy: officerUser.id,
      remarks: isApproved
        ? `Remediation verified and approved by officer. ${data.feedback || ''}`
        : `Work rejected by officer. Rework requested: ${data.reworkInstructions}`
    }, client);

    // 4. Notifications
    if (isApproved) {
      notificationService.notifyUser({
        userId: complaint.citizen_id,
        complaintId: complaint.id,
        title: 'Issue Resolved – Please Confirm',
        message: `Department officer verified the work for #${complaint.ticket_number}. Please inspect the fix and confirm or dispute resolution.`,
        notificationType: 'STATUS_UPDATED'
      }).catch(console.error);
    } else {
      const assignments = await client.query(
        `SELECT id, worker_id FROM worker_assignments WHERE complaint_id = $1 ORDER BY assigned_at DESC LIMIT 1`,
        [complaint.id]
      );
      if (assignments.rows.length > 0) {
        await client.query(
          `UPDATE worker_assignments SET status = 'IN_PROGRESS' WHERE id = $1`,
          [assignments.rows[0].id]
        );
        notificationService.notifyUser({
          userId: assignments.rows[0].worker_id,
          complaintId: complaint.id,
          title: 'Rework Requested',
          message: `Officer requested rework on #${complaint.ticket_number}: "${data.reworkInstructions}"`,
          notificationType: 'STATUS_UPDATED'
        }).catch(console.error);
      }
    }

    // 5. Audit log
    auditService.logEvent({
      userId: officerUser.id,
      action: isApproved ? 'OFFICER_APPROVE_WORK' : 'OFFICER_REJECT_WORK',
      entityType: 'REVIEW',
      entityId: review.id,
      details: { complaintId, decision: data.decision },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return review;
  });
};

export const citizenReview = async (complaintId, citizenId, data, clientInfo = {}) => {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  if (complaint.citizen_id !== citizenId) {
    throw ApiError.forbidden('Only the citizen who filed this complaint can confirm or dispute its resolution');
  }

  if (complaint.current_status !== 'RESOLVED') {
    throw ApiError.badRequest('Citizen review can only be submitted when complaint is in RESOLVED status');
  }

  const isConfirmed = data.decision === 'CONFIRMED';
  const newStatus = isConfirmed ? 'CLOSED' : 'DISPUTED';

  return await db.withTransaction(async (client) => {
    // 1. Create review entry
    const review = await reviewRepository.createReview({
      complaintId: complaint.id,
      reviewerId: citizenId,
      reviewType: 'CITIZEN_VERIFICATION',
      decision: isConfirmed ? 'CONFIRMED' : 'DISPUTED',
      feedback: data.feedback
    }, client);

    // 2. Update complaint status
    await complaintRepository.updateStatus(complaint.id, newStatus, client);

    if (isConfirmed) {
      // Status history: RESOLVED -> CLOSED
      await complaintRepository.addStatusHistory({
        complaintId: complaint.id,
        fromStatus: 'RESOLVED',
        toStatus: 'CLOSED',
        changedBy: citizenId,
        remarks: `Resolution confirmed by citizen. Rating: ${data.rating || 'N/A'}/5. Feedback: ${data.feedback || 'None'}`
      }, client);

      // Notify department officers
      notificationService.notifyDepartmentOfficers({
        departmentId: complaint.department_id,
        complaintId: complaint.id,
        title: 'Resolution Confirmed',
        message: `Citizen confirmed resolution for #${complaint.ticket_number}. Ticket is now officially CLOSED.`,
        notificationType: 'STATUS_UPDATED'
      }).catch(console.error);
    } else {
      // DISPUTED: Trigger Level 2 Escalation
      await reviewRepository.createEscalation({
        complaintId: complaint.id,
        escalationLevel: 'LEVEL_2',
        reason: `Citizen disputed resolution: ${data.feedback}`,
        triggeredBy: 'CITIZEN_DISPUTE'
      }, client);

      // Status history: RESOLVED -> DISPUTED
      await complaintRepository.addStatusHistory({
        complaintId: complaint.id,
        fromStatus: 'RESOLVED',
        toStatus: 'DISPUTED',
        changedBy: citizenId,
        remarks: `Citizen disputed resolution: ${data.feedback}. Escalated to Level 2.`
      }, client);

      // Alert Department Officers & Super Admin
      notificationService.notifyDepartmentOfficers({
        departmentId: complaint.department_id,
        complaintId: complaint.id,
        title: 'RESOLUTION DISPUTED (Level 2 Escalation)',
        message: `Citizen disputed resolution on #${complaint.ticket_number}: "${data.feedback}"`,
        notificationType: 'SLA_ESCALATION'
      }).catch(console.error);
    }

    // 3. Audit log
    auditService.logEvent({
      userId: citizenId,
      action: isConfirmed ? 'CITIZEN_CONFIRM_RESOLUTION' : 'CITIZEN_DISPUTE_RESOLUTION',
      entityType: 'REVIEW',
      entityId: review.id,
      details: { complaintId, decision: data.decision, rating: data.rating },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return review;
  });
};

export const getComplaintReviews = async (complaintId) => {
  return await reviewRepository.findByComplaintId(complaintId);
};

export default {
  officerVerify,
  citizenReview,
  getComplaintReviews
};
