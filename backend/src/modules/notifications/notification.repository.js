import { query } from '../../config/database.js';

export async function createNotification({ user_id, title, message, complaint_id, type = 'INFO' }, db = { query }) {
  const sql = `
    INSERT INTO notifications (recipient_id, title, message, complaint_id, notification_type, is_read)
    VALUES ($1, $2, $3, $4, $5, FALSE)
    RETURNING id, recipient_id as user_id, title, message, complaint_id, notification_type as type, is_read, created_at;
  `;
  const res = await db.query(sql, [user_id, title, message, complaint_id || null, type]);
  return res.rows[0];
}

export async function getUserNotifications(userId, { isRead, limit = 20, offset = 0 } = {}, db = { query }) {
  let sql = `
    SELECT n.id, n.recipient_id as user_id, n.recipient_id, n.title, n.message,
           n.complaint_id, n.notification_type as type, n.is_read, n.created_at, n.read_at,
           c.ticket_number
    FROM notifications n
    LEFT JOIN complaints c ON n.complaint_id = c.id
    WHERE n.recipient_id = $1
  `;
  const params = [userId];

  if (isRead !== undefined && isRead !== null) {
    params.push(isRead);
    sql += ` AND n.is_read = $${params.length}`;
  }

  sql += ` ORDER BY n.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const res = await db.query(sql, params);
  return res.rows;
}

export async function countUnreadNotifications(userId, db = { query }) {
  const sql = `
    SELECT COUNT(*)::int as unread_count
    FROM notifications
    WHERE recipient_id = $1 AND is_read = FALSE;
  `;
  const res = await db.query(sql, [userId]);
  return res.rows[0]?.unread_count || 0;
}

export async function markAsRead(notificationId, userId, db = { query }) {
  const sql = `
    UPDATE notifications
    SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND recipient_id = $2
    RETURNING id, recipient_id as user_id, is_read;
  `;
  const res = await db.query(sql, [notificationId, userId]);
  return res.rows[0];
}

export async function markAllAsRead(userId, db = { query }) {
  const sql = `
    UPDATE notifications
    SET is_read = TRUE, read_at = CURRENT_TIMESTAMP
    WHERE recipient_id = $1 AND is_read = FALSE
    RETURNING id;
  `;
  const res = await db.query(sql, [userId]);
  return res.rowCount;
}

export async function getUsersByRoleAndDepartment(role, departmentId = null, db = { query }) {
  let sql = `SELECT id, email, full_name FROM users WHERE role = $1::user_role AND is_active = TRUE`;
  const params = [role];
  if (departmentId) {
    sql += ` AND department_id = $2`;
    params.push(departmentId);
  }
  const res = await db.query(sql, params);
  return res.rows;
}

export async function createEmailNotificationLog({
  complaint_id,
  recipient_email,
  recipient_type,
  notification_type,
  delivery_attempt_status = 'SENT',
  error_message = null,
  sent_at = null
}, db = { query }) {
  const sql = `
    INSERT INTO email_notification_logs (
      complaint_id, recipient_email, recipient_type, notification_type, delivery_attempt_status, error_message, sent_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const res = await db.query(sql, [
    complaint_id || null,
    recipient_email,
    recipient_type,
    notification_type,
    delivery_attempt_status,
    error_message,
    sent_at
  ]);
  return res.rows[0];
}

export async function getEmailNotificationLogs(complaintId = null, db = { query }) {
  let sql = `SELECT * FROM email_notification_logs`;
  const params = [];
  if (complaintId) {
    sql += ` WHERE complaint_id = $1`;
    params.push(complaintId);
  }
  sql += ` ORDER BY created_at DESC LIMIT 100`;
  const res = await db.query(sql, params);
  return res.rows;
}

export default {
  createNotification,
  getUserNotifications,
  countUnreadNotifications,
  markAsRead,
  markAllAsRead,
  getUsersByRoleAndDepartment,
  createEmailNotificationLog,
  getEmailNotificationLogs
};
