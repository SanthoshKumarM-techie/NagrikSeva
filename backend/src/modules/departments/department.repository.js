import db from '../../config/database.js';

export const findAll = async ({ isActive, search } = {}) => {
  let query = `
    SELECT d.id, d.code, d.name, d.description, d.contact_email, d.contact_phone, d.is_active,
           d.nodal_officer_id, d.created_at, d.updated_at,
           72 as sla_default_hours,
      (SELECT u.full_name FROM users u WHERE u.id = d.nodal_officer_id LIMIT 1) as nodal_officer_name,
      (SELECT COUNT(*)::int FROM users u WHERE u.department_id = d.id AND u.role = 'DEPARTMENT_OFFICER'::user_role) as officer_count,
      (SELECT COUNT(*)::int FROM users u WHERE u.department_id = d.id AND u.role = 'FIELD_WORKER'::user_role) as worker_count,
      (SELECT COUNT(*)::int FROM complaints c WHERE c.current_department_id = d.id) as total_complaints,
      (SELECT COUNT(*)::int FROM complaints c WHERE c.current_department_id = d.id AND c.status IN ('SUBMITTED', 'ACKNOWLEDGED', 'WORKER_ASSIGNED', 'WORK_IN_PROGRESS', 'INSPECTION')) as active_complaints
    FROM departments d
    WHERE 1=1
  `;
  const params = [];

  if (typeof isActive === 'boolean') {
    params.push(isActive);
    query += ` AND d.is_active = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` AND (d.name ILIKE $${params.length} OR d.code ILIKE $${params.length})`;
  }

  query += ` ORDER BY d.name ASC`;
  const result = await db.query(query, params);
  return result.rows;
};

export const findById = async (id) => {
  const query = `SELECT d.*, 72 as sla_default_hours FROM departments d WHERE d.id = $1`;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const findByCode = async (code) => {
  const query = `SELECT d.*, 72 as sla_default_hours FROM departments d WHERE UPPER(d.code) = UPPER($1)`;
  const result = await db.query(query, [code]);
  return result.rows[0] || null;
};

export const create = async ({ name, code, description, contactEmail, contactPhone, contact_email, contact_phone }) => {
  const email = contactEmail || contact_email || null;
  const phone = contactPhone || contact_phone || null;
  const cleanCode = (code || '').trim().toUpperCase();
  const query = `
    INSERT INTO departments (name, code, description, contact_email, contact_phone, is_active)
    VALUES ($1, $2, $3, $4, $5, TRUE)
    RETURNING *;
  `;
  const result = await db.query(query, [name.trim(), cleanCode, description || null, email, phone]);
  return result.rows[0];
};

export const update = async (id, { name, description, contactEmail, contactPhone, contact_email, contact_phone, isActive }) => {
  const email = contactEmail !== undefined ? contactEmail : contact_email;
  const phone = contactPhone !== undefined ? contactPhone : contact_phone;
  const updates = [];
  const params = [id];

  if (name !== undefined) {
    params.push(name.trim());
    updates.push(`name = $${params.length}`);
  }
  if (description !== undefined) {
    params.push(description);
    updates.push(`description = $${params.length}`);
  }
  if (email !== undefined) {
    params.push(email);
    updates.push(`contact_email = $${params.length}`);
  }
  if (phone !== undefined) {
    params.push(phone);
    updates.push(`contact_phone = $${params.length}`);
  }
  if (isActive !== undefined) {
    params.push(isActive);
    updates.push(`is_active = $${params.length}`);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE departments
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *;
  `;
  const result = await db.query(query, params);
  return result.rows[0] || null;
};

export default {
  findAll,
  findById,
  findByCode,
  create,
  update
};
