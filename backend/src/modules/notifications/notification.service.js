import notificationRepository from './notification.repository.js';
import ApiError from '../../utils/ApiError.js';
import db from '../../config/database.js';

export async function sendNotification({ userId, title, message, complaintId, type, data }, clientDb = db) {
  const notif = await notificationRepository.createNotification({
    user_id: userId,
    title,
    message,
    complaint_id: complaintId || (data && data.complaintId) || null,
    type: type || 'SYSTEM'
  }, clientDb);

  return notif;
}

export const notifyUser = sendNotification;

export async function notifyDepartmentOfficers(firstArg, secondArg, db) {
  let targetDeptId;
  let payload;

  if (typeof firstArg === 'string') {
    targetDeptId = firstArg;
    payload = secondArg || {};
  } else if (typeof firstArg === 'object' && firstArg !== null) {
    targetDeptId = firstArg.departmentId;
    payload = firstArg;
  }

  const title = payload.title;
  const message = payload.message;
  const complaintId = payload.complaintId;
  const type = payload.type || payload.notificationType || 'DEPARTMENT_ALERT';

  if (!targetDeptId) return [];

  const officers = await notificationRepository.getUsersByRoleAndDepartment('DEPARTMENT_OFFICER', targetDeptId, db);
  const promises = officers.map((off) =>
    notificationRepository.createNotification({
      user_id: off.id,
      title,
      message,
      complaint_id: complaintId,
      type
    }, db)
  );
  return await Promise.all(promises);
}

export async function notifyAdmins({ title, message, complaintId, type = 'ADMIN_ALERT' }, db) {
  const admins = await notificationRepository.getUsersByRoleAndDepartment('SUPER_ADMIN', null, db);
  const promises = admins.map((adm) =>
    notificationRepository.createNotification({
      user_id: adm.id,
      title,
      message,
      complaint_id: complaintId,
      type
    }, db)
  );
  return await Promise.all(promises);
}

export async function getUserNotifications(userId, queryParams) {
  const isRead = queryParams.unread === 'true' ? false : queryParams.read === 'true' ? true : undefined;
  const limit = parseInt(queryParams.limit || '20', 10);
  const offset = parseInt(queryParams.offset || '0', 10);

  const notifications = await notificationRepository.getUserNotifications(userId, { isRead, limit, offset });
  const totalUnread = await notificationRepository.countUnreadNotifications(userId);

  return {
    notifications,
    totalUnread
  };
}

export async function getUnreadCount(userId) {
  const unreadCount = await notificationRepository.countUnreadNotifications(userId);
  return { unread_count: unreadCount };
}

export async function markNotificationAsRead(notificationId, userId) {
  const updated = await notificationRepository.markAsRead(notificationId, userId);
  if (!updated) {
    throw ApiError.notFound('Notification not found or unauthorized');
  }
  return updated;
}

export async function markAllNotificationsAsRead(userId) {
  const count = await notificationRepository.markAllAsRead(userId);
  return { marked_count: count };
}

export default {
  sendNotification,
  notifyUser,
  notifyDepartmentOfficers,
  notifyAdmins,
  getUserNotifications,
  getUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead
};

