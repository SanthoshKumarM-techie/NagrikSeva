import db from '../../config/database.js';

export const findAll = async ({ role, departmentId, search, isActive, limit = 50, offset = 0 } = {}) => {
  let query = `
    SELECT u.id, u.user_code, u.email, u.full_name, u.phone as phone_number, u.role, u.department_id, 
           NULL as avatar_url, u.is_active, u.created_at, u.updated_at,
           d.name as department_name, d.code as department_code,
           w.user_id as worker_profile_id, w.specializations as specialization, TRUE as is_available,
           (SELECT COUNT(*)::int FROM worker_assignments a WHERE a.worker_id = u.id AND a.status IN ('ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS')) as active_tasks_count,
           w.rating
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN worker_profiles w ON u.id = w.user_id
    WHERE 1=1
  `;
  const params = [];

  if (role) {
    params.push(role);
    query += ` AND u.role = $${params.length}::user_role`;
  }

  if (departmentId) {
    params.push(departmentId);
    query += ` AND u.department_id = $${params.length}`;
  }

  if (typeof isActive === 'boolean') {
    params.push(isActive);
    query += ` AND u.is_active = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
  }

  query += ` ORDER BY u.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  const result = await db.query(query, params);
  return result.rows;
};

export const countAll = async ({ role, departmentId, search, isActive } = {}) => {
  let query = `SELECT COUNT(*) FROM users u WHERE 1=1`;
  const params = [];

  if (role) {
    params.push(role);
    query += ` AND u.role = $${params.length}::user_role`;
  }
  if (departmentId) {
    params.push(departmentId);
    query += ` AND u.department_id = $${params.length}`;
  }
  if (typeof isActive === 'boolean') {
    params.push(isActive);
    query += ` AND u.is_active = $${params.length}`;
  }
  if (search) {
    params.push(`%${search}%`);
    query += ` AND (u.full_name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR u.phone ILIKE $${params.length})`;
  }

  const result = await db.query(query, params);
  return parseInt(result.rows[0].count, 10);
};

export const findById = async (id) => {
  const query = `
    SELECT u.id, u.user_code, u.email, u.full_name, u.phone as phone_number, u.role, u.department_id, 
           NULL as avatar_url, u.is_active, u.created_at, u.updated_at,
           d.name as department_name, d.code as department_code,
           w.user_id as worker_profile_id, w.specializations as specialization, TRUE as is_available,
           (SELECT COUNT(*)::int FROM worker_assignments a WHERE a.worker_id = u.id AND a.status IN ('ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS')) as active_tasks_count,
           w.rating, u.ward_id
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN worker_profiles w ON u.id = w.user_id
    WHERE u.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const findByEmail = async (email) => {
  const query = `SELECT * FROM users WHERE LOWER(email) = LOWER($1)`;
  const result = await db.query(query, [email]);
  return result.rows[0] || null;
};

export const create = async ({ userCode, email, passwordHash, fullName, phoneNumber, role, departmentId }, client = db) => {
  const prefix = role === 'DEPARTMENT_OFFICER' ? 'OFF' : role === 'FIELD_WORKER' ? 'WRK' : role === 'SUPER_ADMIN' ? 'ADM' : 'CIT';
  const cleanCode = (userCode || `${prefix}${Math.floor(100 + Math.random() * 900)}`).trim().toUpperCase();
  const query = `
    INSERT INTO users (user_code, email, password_hash, full_name, phone, role, department_id, is_active, identity_verified)
    VALUES ($1, LOWER($2), $3, $4, $5, $6::user_role, $7, TRUE, TRUE)
    RETURNING id, user_code, email, full_name, phone as phone_number, role, department_id, is_active, created_at;
  `;
  const result = await client.query(query, [cleanCode, email, passwordHash, fullName, phoneNumber || null, role, departmentId || null]);
  return result.rows[0];
};

export const createWorkerProfile = async ({ userId, specialization, assignedZone = 'Central' }, client = db) => {
  const query = `
    INSERT INTO worker_profiles (user_id, assigned_zone, specializations, rating)
    VALUES ($1, $2, $3, 4.80)
    RETURNING *;
  `;
  const specArray = Array.isArray(specialization) ? specialization : [specialization || 'General'];
  const result = await client.query(query, [userId, assignedZone, specArray]);
  return result.rows[0];
};

export const updateProfile = async (id, { fullName, phoneNumber }) => {
  const updates = [];
  const params = [id];

  if (fullName !== undefined) {
    params.push(fullName);
    updates.push(`full_name = $${params.length}`);
  }
  if (phoneNumber !== undefined) {
    params.push(phoneNumber);
    updates.push(`phone = $${params.length}`);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE users
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING id, email, full_name, phone as phone_number, role, department_id, is_active, updated_at;
  `;
  const result = await db.query(query, params);
  return result.rows[0] || null;
};

export const updateStatus = async (id, isActive) => {
  const query = `
    UPDATE users
    SET is_active = $2, updated_at = CURRENT_TIMESTAMP
    WHERE id = $1
    RETURNING id, email, full_name, is_active;
  `;
  const result = await db.query(query, [id, isActive]);
  return result.rows[0] || null;
};

export const findWorkersByDepartment = async (departmentId, { isAvailable } = {}) => {
  let query = `
    SELECT u.id, u.full_name, u.email, u.phone as phone_number, NULL as avatar_url,
           w.user_id as worker_profile_id, w.specializations as specialization, TRUE as is_available,
           (SELECT COUNT(*)::int FROM worker_assignments a WHERE a.worker_id = u.id AND a.status IN ('ASSIGNED', 'ACCEPTED', 'INSPECTION', 'IN_PROGRESS')) as active_tasks_count,
           w.rating,
           mw.ward_number, mw.name as ward_name
    FROM users u
    JOIN worker_profiles w ON u.id = w.user_id
    LEFT JOIN municipal_wards mw ON u.ward_id = mw.id
    WHERE u.department_id = $1 AND u.role = 'FIELD_WORKER'::user_role AND u.is_active = TRUE
    ORDER BY active_tasks_count ASC, w.rating DESC;
  `;
  const result = await db.query(query, [departmentId]);
  return result.rows;
};

export default {
  findAll,
  countAll,
  findById,
  findByEmail,
  create,
  createWorkerProfile,
  updateProfile,
  updateStatus,
  findWorkersByDepartment
};
