import transferRepository from './transfer.repository.js';
import complaintRepository from '../complaints/complaint.repository.js';
import departmentRepository from '../departments/department.repository.js';
import notificationService from '../notifications/notification.service.js';
import auditService from '../audit/audit.service.js';
import ApiError from '../../utils/ApiError.js';
import db from '../../config/database.js';

export const initiateTransfer = async (officerUser, { complaintId, toDepartmentId, reason }, clientInfo = {}) => {
  const complaint = await complaintRepository.findById(complaintId);
  if (!complaint) {
    throw ApiError.notFound('Complaint not found');
  }

  // Officer must belong to complaint's current department unless SUPER_ADMIN
  if (officerUser.role !== 'SUPER_ADMIN' && complaint.department_id !== officerUser.departmentId) {
    throw ApiError.forbidden('You can only transfer complaints belonging to your department');
  }

  if (toDepartmentId && complaint.department_id === toDepartmentId) {
    throw ApiError.badRequest('Target department must be different from current department');
  }

  let targetDept = null;
  if (toDepartmentId) {
    targetDept = await departmentRepository.findById(toDepartmentId);
    if (!targetDept) {
      throw ApiError.badRequest('Target department does not exist');
    }
  }

  const fromDepartmentId = complaint.department_id;
  const fromStatus = complaint.current_status || complaint.status;

  return await db.withTransaction(async (client) => {
    // 1. Create transfer record with PENDING decision
    const transfer = await transferRepository.createTransfer({
      complaintId,
      fromDepartmentId,
      toDepartmentId: toDepartmentId || null,
      initiatedBy: officerUser.id,
      reason
    }, client);

    // 2. Update complaint status to TRANSFERRED
    await complaintRepository.updateStatus(complaintId, 'TRANSFERRED', client);

    // 3. Status history
    await complaintRepository.addStatusHistory({
      complaintId,
      fromStatus,
      toStatus: 'TRANSFERRED',
      changedBy: officerUser.id,
      remarks: targetDept 
        ? `Department transfer requested for ${targetDept.name} awaiting supervisor review. Reason: ${reason}`
        : `Department transfer requested to supervisor admin. Reason: ${reason}`
    }, client);

    // 4. Notify citizen
    notificationService.notifyUser({
      userId: complaint.citizen_id,
      complaintId,
      title: 'Complaint Transfer Requested',
      message: `Your complaint #${complaint.ticket_number} is under administrative transfer review to ensure it reaches the correct department.`,
      notificationType: 'STATUS_UPDATED'
    }).catch(console.error);

    // 5. Audit log
    auditService.logEvent({
      userId: officerUser.id,
      action: 'INITIATE_TRANSFER_REQUEST',
      entityType: 'TRANSFER',
      entityId: transfer.id,
      details: { complaintId, fromDepartmentId, toDepartmentId, reason },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return transfer;
  });
};

export const reviewTransfer = async (transferId, user, { action, toDepartmentId, reviewNotes }, clientInfo = {}) => {
  const transfer = await transferRepository.findById(transferId);
  if (!transfer) {
    throw ApiError.notFound('Transfer record not found');
  }

  if (transfer.status !== 'PENDING') {
    throw ApiError.badRequest(`Transfer has already been ${transfer.status.toLowerCase()}`);
  }

  // Only SUPER_ADMIN can review and assign department for transfers
  if (user.role !== 'SUPER_ADMIN') {
    throw ApiError.forbidden('Only supervisor / super admin can review and assign departments for transfer requests');
  }

  const complaint = await complaintRepository.findById(transfer.complaint_id);
  if (!complaint) {
    throw ApiError.notFound('Associated complaint not found');
  }

  const isApproved = action === 'ACCEPT' || action === 'APPROVE';
  const newStatus = isApproved ? 'ACCEPTED' : 'REJECTED';

  // If approved, target department is required (either from request or selected by supervisor)
  const finalTargetDeptId = toDepartmentId || transfer.to_department_id;
  if (isApproved && !finalTargetDeptId) {
    throw ApiError.badRequest('Please select the target department to assign this complaint to');
  }

  let finalTargetDept = null;
  if (isApproved && finalTargetDeptId) {
    finalTargetDept = await departmentRepository.findById(finalTargetDeptId);
    if (!finalTargetDept) {
      throw ApiError.badRequest('Target department does not exist');
    }
  }

  return await db.withTransaction(async (client) => {
    // 1. Update transfer record
    const updatedTransfer = await transferRepository.updateTransferReview(transferId, {
      status: newStatus,
      reviewedBy: user.id,
      toDepartmentId: finalTargetDeptId,
      adminNotes: reviewNotes
    }, client);

    if (isApproved) {
      // Re-route complaint to new department and set status to DEPARTMENT_REVIEW
      await complaintRepository.updateDepartment(complaint.id, finalTargetDeptId, client);
      await complaintRepository.updateStatus(complaint.id, 'DEPARTMENT_REVIEW', client);

      await complaintRepository.addStatusHistory({
        complaintId: complaint.id,
        fromStatus: 'TRANSFERRED',
        toStatus: 'DEPARTMENT_REVIEW',
        changedBy: user.id,
        remarks: `Supervisor approved transfer and assigned to ${finalTargetDept.name}. ${reviewNotes || ''}`
      }, client);

      // Notify citizen
      notificationService.notifyUser({
        userId: complaint.citizen_id,
        complaintId: complaint.id,
        title: 'Department Transfer Completed',
        message: `Your complaint #${complaint.ticket_number} has been transferred and assigned to ${finalTargetDept.name}.`,
        notificationType: 'STATUS_UPDATED'
      }).catch(console.error);

      // Notify new department officers
      notificationService.notifyDepartmentOfficers({
        departmentId: finalTargetDeptId,
        complaintId: complaint.id,
        title: 'Transferred Complaint Assigned',
        message: `Complaint #${complaint.ticket_number} has been assigned to your department by Supervisor Admin.`,
        notificationType: 'STATUS_UPDATED'
      }).catch(console.error);
    } else {
      // Rejected: return back to original department in DEPARTMENT_REVIEW status
      await complaintRepository.updateStatus(complaint.id, 'DEPARTMENT_REVIEW', client);

      await complaintRepository.addStatusHistory({
        complaintId: complaint.id,
        fromStatus: 'TRANSFERRED',
        toStatus: 'DEPARTMENT_REVIEW',
        changedBy: user.id,
        remarks: `Transfer request rejected by Supervisor Admin. Returned to ${transfer.from_department_name}. Reason: ${reviewNotes || 'Declined'}`
      }, client);

      // Notify originating department
      notificationService.notifyDepartmentOfficers({
        departmentId: transfer.from_department_id,
        complaintId: complaint.id,
        title: 'Transfer Request Rejected',
        message: `Transfer request for #${complaint.ticket_number} was rejected by Supervisor Admin: "${reviewNotes || 'Declined'}"`,
        notificationType: 'STATUS_UPDATED'
      }).catch(console.error);
    }

    auditService.logEvent({
      userId: user.id,
      action: isApproved ? 'APPROVE_TRANSFER' : 'REJECT_TRANSFER',
      entityType: 'TRANSFER',
      entityId: transferId,
      details: { complaintId: complaint.id, action, toDepartmentId: finalTargetDeptId, reviewNotes },
      ipAddress: clientInfo.ip,
      userAgent: clientInfo.userAgent
    }).catch(console.error);

    return updatedTransfer;
  });
};

export const getIncomingTransfers = async (departmentId, status) => {
  return await transferRepository.findIncomingTransfers(departmentId, { status });
};

export const getOutgoingTransfers = async (departmentId, status) => {
  return await transferRepository.findOutgoingTransfers(departmentId, { status });
};

export const getComplaintTransferHistory = async (complaintId) => {
  return await transferRepository.findByComplaintId(complaintId);
};

export const getRepeatedTransfers = async () => {
  return await transferRepository.findRepeatedTransfers();
};

export const listAllTransfers = async (filters) => {
  const limit = parseInt(filters.limit || 50, 10);
  const page = parseInt(filters.page || 1, 10);
  const offset = (page - 1) * limit;
  return await transferRepository.findAllTransfers({ limit, offset, status: filters.status });
};

export default {
  initiateTransfer,
  reviewTransfer,
  getIncomingTransfers,
  getOutgoingTransfers,
  getComplaintTransferHistory,
  getRepeatedTransfers,
  listAllTransfers
};

