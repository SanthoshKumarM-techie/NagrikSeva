import db from '../../config/database.js';

export const findAll = async ({ departmentId, status, level, limit = 50, offset = 0 } = {}) => {
  let query = `
    SELECT e.id, e.complaint_id, e.level as escalation_level, e.level,
           e.trigger_type as triggered_by, e.description as reason, e.assigned_to,
           e.status, e.created_at, e.acknowledged_at, e.resolved_at, e.resolution_notes,
           c.ticket_number, c.title as complaint_title, c.status as complaint_status,
           c.priority as complaint_priority, c.street_location as complaint_address,
           c.sla_resolution_due_at as sla_deadline,
           d.name as department_name, d.code as department_code,
           u_res.full_name as resolved_by_name
    FROM escalations e
    JOIN complaints c ON e.complaint_id = c.id
    JOIN departments d ON c.current_department_id = d.id
    LEFT JOIN users u_res ON e.assigned_to = u_res.id
    WHERE 1=1
  `;
  const params = [];

  if (departmentId) {
    params.push(departmentId);
    query += ` AND c.current_department_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND e.status = $${params.length}::escalation_status`;
  }
  if (level) {
    let lvl = level;
    if (lvl === 1 || lvl === '1') lvl = 'LEVEL_1';
    if (lvl === 2 || lvl === '2') lvl = 'LEVEL_2';
    if (lvl === 3 || lvl === '3') lvl = 'LEVEL_3';
    params.push(lvl);
    query += ` AND e.level = $${params.length}::escalation_level`;
  }

  query += ` ORDER BY e.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
};

export const countAll = async ({ departmentId, status, level } = {}) => {
  let query = `
    SELECT COUNT(*)
    FROM escalations e
    JOIN complaints c ON e.complaint_id = c.id
    WHERE 1=1
  `;
  const params = [];

  if (departmentId) {
    params.push(departmentId);
    query += ` AND c.current_department_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND e.status = $${params.length}::escalation_status`;
  }
  if (level) {
    let lvl = level;
    if (lvl === 1 || lvl === '1') lvl = 'LEVEL_1';
    if (lvl === 2 || lvl === '2') lvl = 'LEVEL_2';
    if (lvl === 3 || lvl === '3') lvl = 'LEVEL_3';
    params.push(lvl);
    query += ` AND e.level = $${params.length}::escalation_level`;
  }

  const result = await db.query(query, params);
  return parseInt(result.rows[0].count, 10);
};

export const findById = async (id) => {
  const query = `
    SELECT e.id, e.complaint_id, e.level as escalation_level, e.level,
           e.trigger_type as triggered_by, e.description as reason, e.assigned_to,
           e.status, e.created_at, e.acknowledged_at, e.resolved_at, e.resolution_notes,
           c.ticket_number, c.title as complaint_title, c.status as complaint_status,
           c.current_department_id as department_id,
           d.name as department_name, d.code as department_code,
           u_res.full_name as resolved_by_name
    FROM escalations e
    JOIN complaints c ON e.complaint_id = c.id
    JOIN departments d ON c.current_department_id = d.id
    LEFT JOIN users u_res ON e.assigned_to = u_res.id
    WHERE e.id = $1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const updateStatus = async (id, { status, resolvedBy, resolutionNotes }, client = db) => {
  let query = `
    UPDATE escalations
    SET status = $2::escalation_status,
        acknowledged_at = CASE WHEN $2 = 'ACKNOWLEDGED' AND acknowledged_at IS NULL THEN CURRENT_TIMESTAMP ELSE acknowledged_at END,
        resolved_at = CASE WHEN $2 = 'RESOLVED' THEN CURRENT_TIMESTAMP ELSE resolved_at END,
        assigned_to = CASE WHEN $3::uuid IS NOT NULL THEN $3::uuid ELSE assigned_to END,
        resolution_notes = CASE WHEN $4::text IS NOT NULL THEN $4::text ELSE resolution_notes END
    WHERE id = $1
    RETURNING id, complaint_id, status, acknowledged_at, resolved_at, resolution_notes;
  `;
  const result = await client.query(query, [id, status, resolvedBy || null, resolutionNotes || null]);
  return result.rows[0];
};

export const createManual = async ({
  complaintId,
  escalationLevel = 'LEVEL_1',
  reason
}, client = db) => {
  let lvl = escalationLevel;
  if (lvl === 1 || lvl === '1') lvl = 'LEVEL_1';
  if (lvl === 2 || lvl === '2') lvl = 'LEVEL_2';
  if (lvl === 3 || lvl === '3') lvl = 'LEVEL_3';

  const query = `
    INSERT INTO escalations (complaint_id, level, description, trigger_type, status)
    VALUES ($1, $2::escalation_level, $3, 'MANUAL_ADMIN', 'OPEN')
    RETURNING id, complaint_id, level as escalation_level, description as reason, status, created_at;
  `;
  const result = await client.query(query, [complaintId, lvl, reason]);
  return result.rows[0];
};

export default {
  findAll,
  countAll,
  findById,
  updateStatus,
  createManual
};
