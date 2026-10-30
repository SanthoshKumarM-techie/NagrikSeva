import db from '../../config/database.js';

export const findAll = async ({ departmentId, categoryId, isActive } = {}) => {
  let query = `
    SELECT s.*,
           d.name as department_name, d.code as department_code,
           cat.name as category_name
    FROM sla_rules s
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN complaint_categories cat ON s.category_id = cat.id
    WHERE 1=1
  `;
  const params = [];

  if (departmentId) {
    params.push(departmentId);
    query += ` AND s.department_id = $${params.length}`;
  }
  if (categoryId) {
    params.push(categoryId);
    query += ` AND s.category_id = $${params.length}`;
  }
  if (typeof isActive === 'boolean') {
    params.push(isActive);
    query += ` AND s.is_active = $${params.length}`;
  }

  query += ` ORDER BY s.resolution_hours ASC, s.created_at ASC`;
  const result = await db.query(query, params);
  return result.rows;
};

export const findById = async (id) => {
  const query = `
    SELECT s.*,
           d.name as department_name,
           cat.name as category_name
    FROM sla_rules s
    LEFT JOIN departments d ON s.department_id = d.id
    LEFT JOIN complaint_categories cat ON s.category_id = cat.id
    WHERE s.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const create = async ({
  departmentId,
  categoryId,
  acknowledgementHours = 4,
  assignmentHours = 12,
  inspectionHours = 24,
  resolutionHours = 48,
  updatedBy = null
}) => {
  const query = `
    INSERT INTO sla_rules (
      department_id, category_id, acknowledgement_hours, assignment_hours,
      inspection_hours, resolution_hours, updated_by
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *
  `;
  const result = await db.query(query, [
    departmentId || null,
    categoryId || null,
    acknowledgementHours,
    assignmentHours,
    inspectionHours,
    resolutionHours,
    updatedBy
  ]);
  return result.rows[0];
};

export const update = async (id, {
  acknowledgementHours,
  assignmentHours,
  inspectionHours,
  resolutionHours,
  resolutionTimeHours,
  isActive,
  updatedBy
}) => {
  const updates = [];
  const params = [id];

  if (acknowledgementHours !== undefined) {
    params.push(acknowledgementHours);
    updates.push(`acknowledgement_hours = $${params.length}`);
  }
  if (assignmentHours !== undefined) {
    params.push(assignmentHours);
    updates.push(`assignment_hours = $${params.length}`);
  }
  if (inspectionHours !== undefined) {
    params.push(inspectionHours);
    updates.push(`inspection_hours = $${params.length}`);
  }
  const resHours = resolutionHours !== undefined ? resolutionHours : resolutionTimeHours;
  if (resHours !== undefined) {
    params.push(resHours);
    updates.push(`resolution_hours = $${params.length}`);
  }
  if (isActive !== undefined) {
    params.push(isActive);
    updates.push(`is_active = $${params.length}`);
  }
  if (updatedBy !== undefined) {
    params.push(updatedBy);
    updates.push(`updated_by = $${params.length}`);
  }

  updates.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE sla_rules
    SET ${updates.join(', ')}
    WHERE id = $1
    RETURNING *
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

