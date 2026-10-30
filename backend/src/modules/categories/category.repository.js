import db from '../../config/database.js';

export const findAll = async ({ departmentId, isActive } = {}) => {
  let query = `
    SELECT c.id, c.name, c.description, c.default_department_id as department_id, c.is_active, c.created_at,
           72 as sla_hours, 'MEDIUM' as severity_level,
           d.name as department_name, d.code as department_code
    FROM complaint_categories c
    LEFT JOIN departments d ON c.default_department_id = d.id
    WHERE 1=1
  `;
  const params = [];

  if (departmentId) {
    params.push(departmentId);
    query += ` AND c.default_department_id = $${params.length}`;
  }

  if (typeof isActive === 'boolean') {
    params.push(isActive);
    query += ` AND c.is_active = $${params.length}`;
  }

  query += ` ORDER BY c.name ASC`;
  const result = await db.query(query, params);
  return result.rows;
};

export const findById = async (id) => {
  const query = `
    SELECT c.id, c.name, c.description, c.default_department_id as department_id, c.is_active, c.created_at,
           72 as sla_hours, 'MEDIUM' as severity_level,
           d.name as department_name, d.code as department_code
    FROM complaint_categories c
    LEFT JOIN departments d ON c.default_department_id = d.id
    WHERE c.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const create = async ({ departmentId, name, description }) => {
  const query = `
    INSERT INTO complaint_categories (default_department_id, name, description, is_active)
    VALUES ($1, $2, $3, TRUE)
    RETURNING id, name, description, default_department_id as department_id, is_active, created_at;
  `;
  const result = await db.query(query, [departmentId || null, name, description || null]);
  return result.rows[0];
};

export const update = async (id, { name, description, isActive }) => {
  const updates = [];
  const params = [id];

  if (name !== undefined) {
    params.push(name);
    updates.push(`name = $${params.length}`);
  }
  if (description !== undefined) {
    params.push(description);
    updates.push(`description = $${params.length}`);
  }
  if (isActive !== undefined) {
    params.push(isActive);
    updates.push(`is_active = $${params.length}`);
  }

  const query = `
    UPDATE complaint_categories
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING id, name, description, default_department_id as department_id, is_active;
  `;
  const result = await db.query(query, params);
  return result.rows[0] || null;
};

export default {
  findAll,
  findById,
  create,
  update
};
