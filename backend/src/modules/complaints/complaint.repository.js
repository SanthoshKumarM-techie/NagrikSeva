import db from '../../config/database.js';

const BASE_COMPLAINT_SELECT = `
  SELECT c.id, c.ticket_number, c.title, c.description, c.category_id, c.priority,
         c.status as current_status, c.status,
         c.submitted_by as citizen_id, c.submitted_by,
         c.current_department_id as department_id, c.current_department_id,
         c.ward_id, c.street_location as address, c.street_location, c.landmark,
         CASE WHEN c.location IS NOT NULL THEN ST_Y(c.location::geometry) ELSE 12.9716 END as latitude,
         CASE WHEN c.location IS NOT NULL THEN ST_X(c.location::geometry) ELSE 77.5946 END as longitude,
         c.sla_resolution_due_at as sla_deadline, c.sla_resolution_due_at,
         c.submitted_at, c.acknowledged_at, c.resolved_at, c.closed_at,
         c.created_at, c.updated_at,
         COALESCE((SELECT COUNT(*) FROM complaint_supporters s WHERE s.complaint_id = c.id), 0)::int as support_count,
         EXISTS(SELECT 1 FROM escalations e WHERE e.complaint_id = c.id AND e.status IN ('OPEN', 'ACKNOWLEDGED')) as is_escalated,
         COALESCE((
           SELECT CASE WHEN e.level = 'LEVEL_3' THEN 3 WHEN e.level = 'LEVEL_2' THEN 2 WHEN e.level = 'LEVEL_1' THEN 1 ELSE 0 END
           FROM escalations e WHERE e.complaint_id = c.id AND e.status IN ('OPEN', 'ACKNOWLEDGED')
           ORDER BY e.created_at DESC LIMIT 1
         ), 0)::int as escalation_level,
         cat.name as category_name,
         d.name as department_name, d.code as department_code,
         w.ward_number, w.name as ward_name,
         u.full_name as citizen_name, u.email as citizen_email, u.phone as citizen_phone,
         (SELECT a.worker_id FROM worker_assignments a WHERE a.complaint_id = c.id AND a.status != 'CANCELLED' ORDER BY a.assigned_at DESC LIMIT 1) as assigned_worker_id,
         (SELECT u_w.full_name FROM worker_assignments a JOIN users u_w ON a.worker_id = u_w.id WHERE a.complaint_id = c.id AND a.status != 'CANCELLED' ORDER BY a.assigned_at DESC LIMIT 1) as assigned_worker_name,
         (SELECT a.id FROM worker_assignments a WHERE a.complaint_id = c.id AND a.status != 'CANCELLED' ORDER BY a.assigned_at DESC LIMIT 1) as assignment_id,
         (SELECT a.status FROM worker_assignments a WHERE a.complaint_id = c.id AND a.status != 'CANCELLED' ORDER BY a.assigned_at DESC LIMIT 1) as assignment_status
  FROM complaints c
  JOIN complaint_categories cat ON c.category_id = cat.id
  JOIN departments d ON c.current_department_id = d.id
  LEFT JOIN municipal_wards w ON c.ward_id = w.id
  JOIN users u ON c.submitted_by = u.id
`;

export const findAll = async ({
  status,
  categoryId,
  departmentId,
  wardId,
  priority,
  isEscalated,
  search,
  citizenId,
  limit = 20,
  offset = 0
} = {}) => {
  let query = `${BASE_COMPLAINT_SELECT} WHERE 1=1`;
  const params = [];

  if (status) {
    if (Array.isArray(status)) {
      params.push(status);
      query += ` AND c.status = ANY($${params.length}::complaint_status[])`;
    } else {
      params.push(status);
      query += ` AND c.status = $${params.length}::complaint_status`;
    }
  }

  if (categoryId) {
    params.push(categoryId);
    query += ` AND c.category_id = $${params.length}`;
  }

  if (departmentId) {
    params.push(departmentId);
    query += ` AND c.current_department_id = $${params.length}`;
  }

  if (wardId) {
    params.push(wardId);
    query += ` AND c.ward_id = $${params.length}`;
  }

  if (priority) {
    params.push(priority);
    query += ` AND c.priority = $${params.length}::complaint_priority`;
  }

  if (typeof isEscalated === 'boolean') {
    if (isEscalated) {
      query += ` AND EXISTS(SELECT 1 FROM escalations e WHERE e.complaint_id = c.id AND e.status IN ('OPEN', 'ACKNOWLEDGED'))`;
    } else {
      query += ` AND NOT EXISTS(SELECT 1 FROM escalations e WHERE e.complaint_id = c.id AND e.status IN ('OPEN', 'ACKNOWLEDGED'))`;
    }
  }

  if (citizenId) {
    params.push(citizenId);
    query += ` AND c.submitted_by = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (c.ticket_number ILIKE $${params.length} OR c.title ILIKE $${params.length} OR c.street_location ILIKE $${params.length})`;
  }

  query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
};

export const countAll = async ({
  status,
  categoryId,
  departmentId,
  wardId,
  priority,
  isEscalated,
  search,
  citizenId
} = {}) => {
  let query = `SELECT COUNT(*) FROM complaints c WHERE 1=1`;
  const params = [];

  if (status) {
    if (Array.isArray(status)) {
      params.push(status);
      query += ` AND c.status = ANY($${params.length}::complaint_status[])`;
    } else {
      params.push(status);
      query += ` AND c.status = $${params.length}::complaint_status`;
    }
  }

  if (categoryId) {
    params.push(categoryId);
    query += ` AND c.category_id = $${params.length}`;
  }

  if (departmentId) {
    params.push(departmentId);
    query += ` AND c.current_department_id = $${params.length}`;
  }

  if (wardId) {
    params.push(wardId);
    query += ` AND c.ward_id = $${params.length}`;
  }

  if (priority) {
    params.push(priority);
    query += ` AND c.priority = $${params.length}::complaint_priority`;
  }

  if (typeof isEscalated === 'boolean') {
    if (isEscalated) {
      query += ` AND EXISTS(SELECT 1 FROM escalations e WHERE e.complaint_id = c.id AND e.status IN ('OPEN', 'ACKNOWLEDGED'))`;
    } else {
      query += ` AND NOT EXISTS(SELECT 1 FROM escalations e WHERE e.complaint_id = c.id AND e.status IN ('OPEN', 'ACKNOWLEDGED'))`;
    }
  }

  if (citizenId) {
    params.push(citizenId);
    query += ` AND c.submitted_by = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (c.ticket_number ILIKE $${params.length} OR c.title ILIKE $${params.length} OR c.street_location ILIKE $${params.length})`;
  }

  const result = await db.query(query, params);
  return parseInt(result.rows[0].count, 10);
};

export const findById = async (id) => {
  const query = `
    ${BASE_COMPLAINT_SELECT}
    WHERE c.id::text = $1
       OR UPPER(c.ticket_number) = UPPER($1)
       OR EXISTS(SELECT 1 FROM worker_assignments wa WHERE wa.id::text = $1 AND wa.complaint_id = c.id)
    ORDER BY c.created_at DESC
    LIMIT 1;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const findByTicketNumber = async (ticketNumber) => {
  const query = `${BASE_COMPLAINT_SELECT} WHERE UPPER(c.ticket_number) = UPPER($1)`;
  const result = await db.query(query, [ticketNumber]);
  return result.rows[0] || null;
};

export const findNearbyMatches = async ({ latitude, longitude, categoryId, radiusMeters = 500 }) => {
  let query = `
    SELECT c.id, c.ticket_number, c.title, c.description,
           c.street_location as address,
           c.status as current_status,
           COALESCE((SELECT COUNT(*) FROM complaint_supporters s WHERE s.complaint_id = c.id), 0)::int as support_count,
           c.created_at,
           cat.name as category_name,
           d.name as department_name,
           ST_Distance(
             c.location::geography,
             ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography
           ) as distance_meters
    FROM complaints c
    JOIN complaint_categories cat ON c.category_id = cat.id
    JOIN departments d ON c.current_department_id = d.id
    WHERE c.status NOT IN ('CLOSED', 'REJECTED')
      AND c.location IS NOT NULL
  `;
  const params = [latitude, longitude];

  if (categoryId) {
    params.push(categoryId);
    query += ` AND c.category_id = $${params.length}`;
  }

  params.push(radiusMeters);
  query += `
    AND ST_DWithin(
      c.location::geography,
      ST_SetSRID(ST_MakePoint($2, $1), 4326)::geography,
      $${params.length}
    )
    ORDER BY distance_meters ASC
    LIMIT 10;
  `;

  const result = await db.query(query, params);
  return result.rows;
};

export const create = async ({
  ticketNumber,
  title,
  description,
  citizenId,
  categoryId,
  departmentId,
  wardId,
  latitude,
  longitude,
  address,
  landmark,
  priority = 'MEDIUM',
  slaDeadline
}, client = db) => {
  const query = `
    INSERT INTO complaints (
      ticket_number, title, description, category_id, priority, status,
      submitted_by, current_department_id, ward_id, street_location, landmark,
      location, sla_resolution_due_at, submitted_at
    )
    VALUES (
      $1, $2, $3, $4, $5::complaint_priority, 'SUBMITTED',
      $6, $7, $8, $9, $10,
      ST_SetSRID(ST_MakePoint($12, $11), 4326),
      $13, CURRENT_TIMESTAMP
    )
    RETURNING id, ticket_number, title, description, status, current_department_id, submitted_by, created_at;
  `;
  const result = await client.query(query, [
    ticketNumber,
    title,
    description,
    categoryId,
    priority,
    citizenId,
    departmentId,
    wardId || null,
    address,
    landmark || null,
    latitude,
    longitude,
    slaDeadline
  ]);
  return result.rows[0];
};

export const updateStatus = async (id, status, client = db) => {
  const isResolved = status === 'RESOLVED' || status === 'CLOSED';
  const isClosed = status === 'CLOSED';
  const query = `
    UPDATE complaints
    SET status = $2::complaint_status,
        resolved_at = CASE WHEN $3 = TRUE AND resolved_at IS NULL THEN CURRENT_TIMESTAMP ELSE resolved_at END,
        closed_at = CASE WHEN $4 = TRUE AND closed_at IS NULL THEN CURRENT_TIMESTAMP ELSE closed_at END,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const result = await client.query(query, [id, status, isResolved, isClosed]);
  return result.rows[0];
};

export const updateDepartment = async (id, newDepartmentId, client = db) => {
  const query = `
    UPDATE complaints
    SET current_department_id = $2,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING *;
  `;
  const result = await client.query(query, [id, newDepartmentId]);
  return result.rows[0];
};

export const addStatusHistory = async ({
  complaintId,
  fromStatus,
  toStatus,
  changedBy,
  remarks
}, client = db) => {
  const query = `
    INSERT INTO complaint_status_history (complaint_id, from_status, to_status, changed_by, note)
    VALUES ($1, $2::complaint_status, $3::complaint_status, $4, $5)
    RETURNING *;
  `;
  const result = await client.query(query, [
    complaintId,
    fromStatus || null,
    toStatus,
    changedBy,
    remarks || null
  ]);
  return result.rows[0];
};

export const getStatusHistory = async (complaintId) => {
  const query = `
    SELECT h.id, h.complaint_id, h.from_status, h.to_status, h.note as remarks, h.changed_at as created_at,
           u.full_name as changed_by_name, u.role as changed_by_role
    FROM complaint_status_history h
    JOIN users u ON h.changed_by = u.id
    WHERE h.complaint_id = $1
    ORDER BY h.changed_at ASC;
  `;
  const result = await db.query(query, [complaintId]);
  return result.rows;
};

export const addSupporter = async (complaintId, citizenId, client = db) => {
  const insertQuery = `
    INSERT INTO complaint_supporters (complaint_id, user_id)
    VALUES ($1, $2)
    ON CONFLICT (complaint_id, user_id) DO NOTHING
    RETURNING *;
  `;
  const res = await client.query(insertQuery, [complaintId, citizenId]);
  return res.rows.length > 0;
};

export const isSupportedBy = async (complaintId, citizenId) => {
  const query = `SELECT 1 FROM complaint_supporters WHERE complaint_id = $1 AND user_id = $2`;
  const res = await db.query(query, [complaintId, citizenId]);
  return res.rows.length > 0;
};

export const findMyComplaints = async (citizenId, { filter = 'all', limit = 20, offset = 0 } = {}) => {
  let query = `
    ${BASE_COMPLAINT_SELECT}
    WHERE (c.submitted_by = $1 OR EXISTS(SELECT 1 FROM complaint_supporters s WHERE s.complaint_id = c.id AND s.user_id = $1))
  `;
  const params = [citizenId];

  if (filter === 'created') {
    query += ` AND c.submitted_by = $1`;
  } else if (filter === 'supported') {
    query += ` AND c.submitted_by != $1 AND EXISTS(SELECT 1 FROM complaint_supporters s WHERE s.complaint_id = c.id AND s.user_id = $1)`;
  } else if (filter === 'resolved') {
    query += ` AND c.status IN ('RESOLVED', 'CLOSED')`;
  } else if (filter === 'active') {
    query += ` AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')`;
  }

  query += ` ORDER BY c.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
};

export const countMyComplaints = async (citizenId, { filter = 'all' } = {}) => {
  let query = `
    SELECT COUNT(*)
    FROM complaints c
    WHERE (c.submitted_by = $1 OR EXISTS(SELECT 1 FROM complaint_supporters s WHERE s.complaint_id = c.id AND s.user_id = $1))
  `;
  const params = [citizenId];

  if (filter === 'created') {
    query += ` AND c.submitted_by = $1`;
  } else if (filter === 'supported') {
    query += ` AND c.submitted_by != $1 AND EXISTS(SELECT 1 FROM complaint_supporters s WHERE s.complaint_id = c.id AND s.user_id = $1)`;
  } else if (filter === 'resolved') {
    query += ` AND c.status IN ('RESOLVED', 'CLOSED')`;
  } else if (filter === 'active') {
    query += ` AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')`;
  }

  const result = await db.query(query, params);
  return parseInt(result.rows[0].count, 10);
};

export const getCitizenStats = async (citizenId) => {
  const query = `
    SELECT
      COUNT(DISTINCT c.id) FILTER (WHERE c.submitted_by = $1)::int as total_filed,
      COUNT(DISTINCT c.id) FILTER (WHERE c.submitted_by = $1 AND c.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED'))::int as active_count,
      COUNT(DISTINCT c.id) FILTER (WHERE c.submitted_by = $1 AND c.status IN ('RESOLVED', 'CLOSED'))::int as resolved_count,
      (SELECT COUNT(*) FROM complaint_supporters WHERE user_id = $1)::int as supported_count
    FROM complaints c
    WHERE c.submitted_by = $1;
  `;
  const res = await db.query(query, [citizenId]);
  return res.rows[0];
};

export const getDepartmentStats = async (departmentId) => {
  const query = `
    SELECT
      COUNT(*)::int as total_complaints,
      COUNT(*) FILTER (WHERE status = 'SUBMITTED')::int as pending_assignment,
      COUNT(*) FILTER (WHERE status IN ('ACKNOWLEDGED', 'WORKER_ASSIGNED', 'INSPECTION', 'WORK_IN_PROGRESS'))::int as in_progress,
      COUNT(*) FILTER (WHERE status = 'VERIFICATION')::int as pending_verification,
      COUNT(*) FILTER (WHERE status IN ('RESOLVED', 'CLOSED'))::int as resolved,
      COUNT(*) FILTER (WHERE EXISTS(SELECT 1 FROM escalations e WHERE e.complaint_id = complaints.id AND e.status IN ('OPEN', 'ACKNOWLEDGED')))::int as escalated,
      COUNT(*) FILTER (WHERE status NOT IN ('RESOLVED', 'CLOSED') AND sla_resolution_due_at < CURRENT_TIMESTAMP)::int as sla_breached
    FROM complaints
    WHERE current_department_id = $1;
  `;
  const res = await db.query(query, [departmentId]);
  return res.rows[0];
};

export const getMapComplaints = async ({ departmentId, status, wardId } = {}) => {
  let query = `
    SELECT c.id, c.ticket_number, c.title,
           CASE WHEN c.location IS NOT NULL THEN ST_Y(c.location::geometry) ELSE 12.9716 END as latitude,
           CASE WHEN c.location IS NOT NULL THEN ST_X(c.location::geometry) ELSE 77.5946 END as longitude,
           c.status as current_status, c.priority,
           cat.name as category_name, d.code as department_code, d.name as department_name,
           c.created_at
    FROM complaints c
    JOIN complaint_categories cat ON c.category_id = cat.id
    JOIN departments d ON c.current_department_id = d.id
    WHERE c.status NOT IN ('CLOSED', 'REJECTED')
  `;
  const params = [];

  if (departmentId) {
    params.push(departmentId);
    query += ` AND c.current_department_id = $${params.length}`;
  }
  if (status) {
    params.push(status);
    query += ` AND c.status = $${params.length}::complaint_status`;
  }
  if (wardId) {
    params.push(wardId);
    query += ` AND c.ward_id = $${params.length}`;
  }

  query += ` LIMIT 200;`;
  const res = await db.query(query, params);
  return res.rows;
};

export default {
  findAll,
  countAll,
  findById,
  findByTicketNumber,
  findNearbyMatches,
  create,
  updateStatus,
  updateDepartment,
  addStatusHistory,
  getStatusHistory,
  addSupporter,
  isSupportedBy,
  findMyComplaints,
  countMyComplaints,
  getCitizenStats,
  getDepartmentStats,
  getMapComplaints
};
