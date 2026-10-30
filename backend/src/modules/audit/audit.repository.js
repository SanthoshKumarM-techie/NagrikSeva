import { query } from '../../config/database.js';

export async function createAuditLog({ actor_id, action, entity_type, entity_id, details, ip_address }, db = { query }) {
  const sql = `
    INSERT INTO audit_logs (actor_user_id, action, entity_type, entity_id, details)
    VALUES ($1, $2, $3, $4, $5)
    RETURNING *;
  `;
  const auditDetails = details || {};
  if (ip_address) {
    auditDetails.ip_address = ip_address;
  }

  const params = [
    actor_id || null,
    action,
    entity_type,
    entity_id || null,
    JSON.stringify(auditDetails)
  ];
  const res = await db.query(sql, params);
  return res.rows[0];
}

export default {
  createAuditLog
};
