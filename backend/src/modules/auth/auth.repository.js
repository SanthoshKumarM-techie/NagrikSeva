import db from '../../config/database.js';

export const findByEmail = async (email) => {
  const query = `
    SELECT u.id, u.user_code, u.email, u.password_hash, u.full_name, u.phone as phone_number, u.role, 
           u.department_id, NULL as avatar_url, u.is_active, u.created_at, u.updated_at,
           d.name as department_name, d.code as department_code,
           w.user_id as worker_profile_id, w.specializations as specialization, TRUE as is_available, 0 as active_tasks_count, w.rating
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN worker_profiles w ON u.id = w.user_id
    WHERE LOWER(u.email) = LOWER($1) OR UPPER(u.user_code) = UPPER($1) OR u.phone = $1
  `;
  const result = await db.query(query, [email]);
  return result.rows[0] || null;
};

export const findById = async (id) => {
  const query = `
    SELECT u.id, u.user_code, u.email, u.full_name, u.phone as phone_number, u.role, 
           u.department_id, NULL as avatar_url, u.is_active, u.created_at, u.updated_at,
           d.name as department_name, d.code as department_code,
           w.user_id as worker_profile_id, w.specializations as specialization, TRUE as is_available, 0 as active_tasks_count, w.rating
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN worker_profiles w ON u.id = w.user_id
    WHERE u.id = $1
  `;
  const result = await db.query(query, [id]);
  return result.rows[0] || null;
};

export const create = async ({
  userCode,
  email,
  passwordHash,
  fullName,
  phoneNumber,
  role,
  departmentId,
  address,
  specialization
}, client = db) => {
  return await db.withTransaction(async (txClient) => {
    const query = `
      INSERT INTO users (user_code, email, password_hash, full_name, phone, role, department_id, address, is_active, identity_verified)
      VALUES ($1, LOWER($2), $3, $4, $5, $6::user_role, $7, $8, TRUE, TRUE)
      RETURNING id, user_code, email, full_name, phone as phone_number, role, department_id, is_active, created_at;
    `;
    const result = await txClient.query(query, [
      userCode,
      email,
      passwordHash,
      fullName,
      phoneNumber || null,
      role,
      departmentId || null,
      address || null
    ]);
    const newUser = result.rows[0];

    let workerProfile = null;
    if (role === 'FIELD_WORKER') {
      const specArray = specialization ? [specialization] : ['General Maintenance'];
      const wpQuery = `
        INSERT INTO worker_profiles (user_id, assigned_zone, specializations, rating)
        VALUES ($1, 'Central', $2, 5.0)
        RETURNING user_id as worker_profile_id, specializations as specialization;
      `;
      const wpRes = await txClient.query(wpQuery, [newUser.id, specArray]);
      workerProfile = wpRes.rows[0];
    }

    let dept = null;
    if (departmentId) {
      const deptRes = await txClient.query('SELECT name, code FROM departments WHERE id = $1', [departmentId]);
      dept = deptRes.rows[0];
    }

    return {
      ...newUser,
      department_name: dept?.name || null,
      department_code: dept?.code || null,
      worker_profile_id: workerProfile?.worker_profile_id || null,
      specialization: workerProfile?.specialization || null,
      avatar_url: null
    };
  });
};

export default {
  findByEmail,
  findById,
  create
};
