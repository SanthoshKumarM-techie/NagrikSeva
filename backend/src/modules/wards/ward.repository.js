import db from '../../config/database.js';

export const findAll = async ({ isActive, zone } = {}) => {
  let query = `
    SELECT id, ward_number, name, zone_name as zone, zone_name, is_active
    FROM municipal_wards
    WHERE 1=1
  `;
  const params = [];

  if (typeof isActive === 'boolean') {
    params.push(isActive);
    query += ` AND is_active = $${params.length}`;
  }

  if (zone) {
    params.push(zone);
    query += ` AND zone_name = $${params.length}`;
  }

  query += ` ORDER BY ward_number ASC`;
  const result = await db.query(query, params);
  return result.rows;
};

export const findById = async (id) => {
  const query = `SELECT id, ward_number, name, zone_name as zone, zone_name, is_active FROM municipal_wards WHERE id = $1`;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export default {
  findAll,
  findById
};
