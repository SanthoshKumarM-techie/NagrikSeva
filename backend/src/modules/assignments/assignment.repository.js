import db from '../../config/database.js';

export const createAssignment = async ({
  complaintId,
  workerId,
  assignedBy,
  instructions
}, client = db) => {
  const query = `
    INSERT INTO worker_assignments (complaint_id, worker_id, assigned_by, assignment_notes, status, assigned_at)
    VALUES ($1, $2, $3, $4, 'ASSIGNED', CURRENT_TIMESTAMP)
    RETURNING id, complaint_id, worker_id, assigned_by, assignment_notes as instructions, status, assigned_at;
  `;
  const result = await client.query(query, [complaintId, workerId, assignedBy, instructions || null]);
  return result.rows[0];
};

export const findById = async (id) => {
  const query = `
    SELECT a.id, a.complaint_id, a.worker_id, a.assigned_by, a.status,
           a.assigned_at, a.accepted_at, a.completed_at, a.assignment_notes as instructions,
           c.ticket_number, c.title as complaint_title, c.description as complaint_description,
           c.status as complaint_status, c.street_location as complaint_address,
           CASE WHEN c.location IS NOT NULL THEN ST_Y(c.location::geometry) ELSE 12.9716 END as complaint_latitude,
           CASE WHEN c.location IS NOT NULL THEN ST_X(c.location::geometry) ELSE 77.5946 END as complaint_longitude,
           c.submitted_by as citizen_id, c.current_department_id as department_id,
           u_w.full_name as worker_name, u_w.phone as worker_phone,
           u_a.full_name as assigned_by_name
    FROM worker_assignments a
    JOIN complaints c ON a.complaint_id = c.id
    JOIN users u_w ON a.worker_id = u_w.id
    JOIN users u_a ON a.assigned_by = u_a.id
    WHERE a.id::text = $1 OR a.complaint_id::text = $1 OR UPPER(c.ticket_number) = UPPER($1)
    ORDER BY a.assigned_at DESC
    LIMIT 1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const findByComplaintId = async (complaintId) => {
  const query = `
    SELECT a.id, a.complaint_id, a.worker_id, a.assigned_by, a.status,
           a.assigned_at, a.accepted_at, a.completed_at, a.assignment_notes as instructions,
           u_w.full_name as worker_name, u_w.phone as worker_phone,
           u_a.full_name as assigned_by_name
    FROM worker_assignments a
    JOIN users u_w ON a.worker_id = u_w.id
    JOIN users u_a ON a.assigned_by = u_a.id
    WHERE a.complaint_id = $1
    ORDER BY a.assigned_at DESC;
  `;
  const result = await db.query(query, [complaintId]);
  return result.rows;
};

export const findWorkerTasks = async (workerId, { status } = {}) => {
  let query = `
    SELECT a.id, a.complaint_id, a.worker_id, a.assigned_by, a.status,
           a.assigned_at, a.accepted_at, a.completed_at, a.assignment_notes as instructions,
           c.ticket_number, c.title as complaint_title, c.description as complaint_description,
           c.status as complaint_status, c.street_location as complaint_address,
           CASE WHEN c.location IS NOT NULL THEN ST_Y(c.location::geometry) ELSE 12.9716 END as complaint_latitude,
           CASE WHEN c.location IS NOT NULL THEN ST_X(c.location::geometry) ELSE 77.5946 END as complaint_longitude,
           c.sla_resolution_due_at as sla_deadline, c.priority as complaint_priority,
           cat.name as category_name,
           u_c.full_name as citizen_name, u_c.phone as citizen_phone
    FROM worker_assignments a
    JOIN complaints c ON a.complaint_id = c.id
    JOIN complaint_categories cat ON c.category_id = cat.id
    JOIN users u_c ON c.submitted_by = u_c.id
    WHERE a.worker_id = $1
  `;
  const params = [workerId];

  if (status) {
    if (status === 'ACTIVE') {
      query += ` AND a.status IN ('ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS', 'REWORK_REQUIRED')`;
    } else {
      params.push(status);
      query += ` AND a.status = $${params.length}::assignment_status`;
    }
  }

  query += ` ORDER BY c.priority = 'CRITICAL'::complaint_priority DESC, c.priority = 'HIGH'::complaint_priority DESC, a.assigned_at DESC;`;
  const result = await db.query(query, params);
  return result.rows;
};

export const updateAssignmentStatus = async (id, status, client = db) => {
  let query = `
    UPDATE worker_assignments
    SET status = $2::assignment_status,
        accepted_at = CASE WHEN $2 = 'ACCEPTED' AND accepted_at IS NULL THEN CURRENT_TIMESTAMP ELSE accepted_at END,
        completed_at = CASE WHEN $2 = 'COMPLETED' THEN CURRENT_TIMESTAMP ELSE completed_at END
    WHERE id = $1
    RETURNING id, status, accepted_at, completed_at;
  `;
  const result = await client.query(query, [id, status]);
  return result.rows[0];
};

export const createWorkUpdate = async ({
  assignmentId,
  workerId,
  updateType = 'PROGRESS',
  description,
  materialsUsed,
  technicalDetails
}, client = db) => {
  let mappedType = updateType;
  if (mappedType === 'COMPLETION') mappedType = 'COMPLETION_SUBMITTED';
  if (mappedType === 'MATERIAL_REQUEST') mappedType = 'PROGRESS';

  const query = `
    INSERT INTO work_updates (assignment_id, updated_by, update_type, notes, materials_used, technical_details)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, assignment_id, updated_by as worker_id, update_type, notes as description, materials_used, technical_details, created_at;
  `;
  const result = await client.query(query, [
    assignmentId,
    workerId,
    mappedType,
    description,
    materialsUsed || null,
    technicalDetails || null
  ]);
  return result.rows[0];
};

export const getWorkUpdatesByAssignment = async (assignmentId) => {
  const query = `
    SELECT u.id, u.assignment_id, u.updated_by as worker_id, u.update_type,
           u.notes as description, u.materials_used, u.technical_details, u.created_at,
           usr.full_name as worker_name, usr.user_code as worker_code
    FROM work_updates u
    LEFT JOIN users usr ON u.updated_by = usr.id
    WHERE u.assignment_id = $1
    ORDER BY u.created_at ASC;
  `;
  const result = await db.query(query, [assignmentId]);
  return result.rows;
};

export const getWorkUpdatesByComplaintId = async (complaintId) => {
  const query = `
    SELECT u.id, u.assignment_id, u.updated_by as worker_id, u.update_type,
           u.notes as description, u.materials_used, u.technical_details, u.created_at,
           usr.full_name as worker_name, usr.user_code as worker_code
    FROM work_updates u
    JOIN worker_assignments a ON u.assignment_id = a.id
    LEFT JOIN users usr ON u.updated_by = usr.id
    WHERE a.complaint_id = $1
    ORDER BY u.created_at ASC;
  `;
  const result = await db.query(query, [complaintId]);
  return result.rows;
};

export default {
  createAssignment,
  findById,
  findByComplaintId,
  findWorkerTasks,
  updateAssignmentStatus,
  createWorkUpdate,
  getWorkUpdatesByAssignment,
  getWorkUpdatesByComplaintId
};
