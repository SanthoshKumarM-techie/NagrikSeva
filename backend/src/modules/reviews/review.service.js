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
        message: `Department officer verified the work for #${complaint.ticket_number}. Please inspect the fix and confirm or request rework.`,
        notificationType: 'STATUS_UPDATED'
      }).catch(console.error);
    } else {
      const assignments = await client.query(
        `SELECT id, worker_id FROM worker_assignments WHERE complaint_id = $1 ORDER BY assigned_at DESC LIMIT 1`,
        [complaint.id]
      );
      if (assignments.rows.length > 0) {
        await client.query(
          `UPDATE worker_assignments SET status = 'REWORK_REQUIRED' WHERE id = $1`,
          [assignments.rows[0].id]
        );
        notificationService.notifyUser({
          userId: assignments.rows[0].worker_id,
          complaintId: complaint.id,
          title: 'Remediation Rework Requested',
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

  const isAuthor = complaint.citizen_id === citizenId || complaint.submitted_by === citizenId;
  const isSupporter = await complaintRepository.isSupportedBy(complaint.id, citizenId);
  if (!isAuthor && !isSupporter) {
    throw ApiError.forbidden('Only the citizen who filed this complaint or registered supporters can confirm or dispute its resolution');
  }

  if (complaint.current_status !== 'RESOLVED' && complaint.current_status !== 'VERIFICATION') {
    throw ApiError.badRequest('Citizen review can only be submitted when complaint is in RESOLVED or VERIFICATION status');
  }

  const isConfirmed = data.decision === 'CONFIRMED' || data.decision === 'APPROVED';

  return await db.withTransaction(async (client) => {
    // 1. Create review entry
    const review = await reviewRepository.createReview({
      complaintId: complaint.id,
      reviewerId: citizenId,
      reviewType: 'CITIZEN_VERIFICATION',
      decision: isConfirmed ? 'CONFIRMED' : 'REWORK_REQUIRED',
      feedback: data.feedback || data.reason || (isConfirmed ? 'Resolution confirmed by citizen' : 'Rework requested')
    }, client);

    if (isConfirmed) {
      // 2. Status -> CLOSED
      await complaintRepository.updateStatus(complaint.id, 'CLOSED', client);

      // Record closed_at timestamp
      await client.query(`UPDATE complaints SET closed_at = CURRENT_TIMESTAMP WHERE id = $1`, [complaint.id]);

      // Status history: RESOLVED -> CLOSED
      await complaintRepository.addStatusHistory({
        complaintId: complaint.id,
        fromStatus: complaint.current_status,
        toStatus: 'CLOSED',
        changedBy: citizenId,
        remarks: `Resolution confirmed by citizen. Rating: ${data.rating || 'N/A'}/5. Feedback: ${data.feedback || 'None'}. Case is officially closed.`
      }, client);

      // Notify department officers
      notificationService.notifyDepartmentOfficers({
        departmentId: complaint.department_id,
        complaintId: complaint.id,
        title: 'Resolution Confirmed by Citizen',
        message: `Citizen confirmed resolution for #${complaint.ticket_number}. Ticket is now officially CLOSED.`,
        notificationType: 'STATUS_UPDATED'
      }).catch(console.error);

      // Notify assigned worker
      const workerRes = await client.query(
        `SELECT worker_id FROM worker_assignments WHERE complaint_id = $1 ORDER BY assigned_at DESC LIMIT 1`,
        [complaint.id]
      );
      if (workerRes.rows[0]?.worker_id) {
        notificationService.notifyUser({
          userId: workerRes.rows[0].worker_id,
          complaintId: complaint.id,
          title: 'Work Approved by Citizen',
          message: `Citizen inspected and confirmed remediation for #${complaint.ticket_number}. Work order successfully closed.`,
          notificationType: 'STATUS_UPDATED'
        }).catch(console.error);
      }
    } else {
      // REWORK: Restart the workflow until citizen approves
      const feedback = data.feedback || data.reason || 'Remediation unsatisfactory. Defect remains on site.';

      // 1. Move complaint status back to WORK_IN_PROGRESS
      await complaintRepository.updateStatus(complaint.id, 'WORK_IN_PROGRESS', client);

      // 2. Set active worker assignment to REWORK_REQUIRED
      const assignments = await client.query(
        `SELECT id, worker_id FROM worker_assignments WHERE complaint_id = $1 ORDER BY assigned_at DESC LIMIT 1`,
        [complaint.id]
      );
      if (assignments.rows.length > 0) {
        await client.query(
          `UPDATE worker_assignments SET status = 'REWORK_REQUIRED' WHERE id = $1`,
          [assignments.rows[0].id]
        );

        // Alert the worker directly with the citizen's rework reason
        notificationService.notifyUser({
          userId: assignments.rows[0].worker_id,
          complaintId: complaint.id,
          title: 'Remediation Rework Requested by Citizen',
          message: `Citizen rejected work on #${complaint.ticket_number}. Rework required: "${feedback}". Please return to site and rectify.`,
          notificationType: 'STATUS_UPDATED'
        }).catch(console.error);
      }

      // 3. Status history
      await complaintRepository.addStatusHistory({
        complaintId: complaint.id,
        fromStatus: complaint.current_status,
        toStatus: 'WORK_IN_PROGRESS',
        changedBy: citizenId,
        remarks: `Remediation Rework Requested by Citizen: "${feedback}". Workflow restarted for contractor remediation.`
      }, client);

      // 4. Alert Department Officers & Super Admin
      notificationService.notifyDepartmentOfficers({
        departmentId: complaint.department_id,
        complaintId: complaint.id,
        title: 'Work Rejected by Citizen (Rework Ordered)',
        message: `Citizen rejected resolution on #${complaint.ticket_number} and requested rework: "${feedback}".`,
        notificationType: 'SLA_ESCALATION'
      }).catch(console.error);

      notificationService.notifyAdmins({
        complaintId: complaint.id,
        title: 'Citizen Rework Loop Triggered',
        message: `Citizen rejected work on #${complaint.ticket_number} (Ward: ${complaint.ward_name || 'N/A'}). Rework required: "${feedback}".`,
        type: 'ADMIN_ALERT'
      }).catch(console.error);
    }

    // 5. Audit log
    auditService.logEvent({
      userId: citizenId,
      action: isConfirmed ? 'CITIZEN_CONFIRM_RESOLUTION' : 'CITIZEN_REJECT_REWORK',
      entityType: 'REVIEW',
      entityId: review.id,
      details: { complaintId, decision: isConfirmed ? 'CONFIRMED' : 'REWORK_REQUIRED', rating: data.rating, feedback: data.feedback },
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
