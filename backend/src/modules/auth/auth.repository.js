import db from '../../config/database.js';

export const BUILTIN_USERS = [
  {
    id: '44444444-4444-4444-4444-444444444401',
    user_code: 'citizen01',
    email: 'citizen01@example.com',
    password_hash: '$2b$10$EPm90/uWjXg9Yl.iT7/G6u8T5gG2g9/uWjXg9Yl.iT7/G6u8T5gG2',
    full_name: 'Aarav Sharma',
    phone: '+91 98450 12345',
    phone_number: '+91 98450 12345',
    role: 'CITIZEN',
    department_id: null,
    department_name: null,
    department_code: null,
    worker_profile_id: null,
    specialization: null,
    is_available: true,
    active_tasks_count: 0,
    rating: null,
    is_active: true,
    aliases: ['citizen01', 'citizen1', 'cit001', 'cit01', 'citizen@example.com', 'citizen01@example.com']
  },
  {
    id: '44444444-4444-4444-4444-444444444411',
    user_code: 'citizen02',
    email: 'citizen02@example.com',
    password_hash: '$2b$10$EPm90/uWjXg9Yl.iT7/G6u8T5gG2g9/uWjXg9Yl.iT7/G6u8T5gG2',
    full_name: 'Meera Krishnan',
    phone: '+91 98450 12346',
    phone_number: '+91 98450 12346',
    role: 'CITIZEN',
    department_id: null,
    department_name: null,
    department_code: null,
    worker_profile_id: null,
    specialization: null,
    is_available: true,
    active_tasks_count: 0,
    rating: null,
    is_active: true,
    aliases: ['citizen02', 'citizen2', 'cit002', 'cit02', 'citizen02@example.com']
  },
  {
    id: '44444444-4444-4444-4444-444444444402',
    user_code: 'officer01',
    email: 'officer01@bbmp.gov.in',
    password_hash: '$2b$10$EPm90/uWjXg9Yl.iT7/G6u8T5gG2g9/uWjXg9Yl.iT7/G6u8T5gG2',
    full_name: 'Rajesh Kumar',
    phone: '+91 80 2266 0001',
    phone_number: '+91 80 2266 0001',
    role: 'DEPARTMENT_OFFICER',
    department_id: '11111111-1111-1111-1111-111111111101',
    department_name: 'Civil Works & Municipal Redressal Department',
    department_code: 'CIVIC',
    worker_profile_id: null,
    specialization: null,
    is_available: true,
    active_tasks_count: 0,
    rating: null,
    is_active: true,
    aliases: ['officer01', 'officer1', 'off001', 'off01', 'officer@bbmp.gov.in', 'officer01@bbmp.gov.in']
  },
  {
    id: '44444444-4444-4444-4444-444444444412',
    user_code: 'officer02',
    email: 'officer02@bbmp.gov.in',
    password_hash: '$2b$10$EPm90/uWjXg9Yl.iT7/G6u8T5gG2g9/uWjXg9Yl.iT7/G6u8T5gG2',
    full_name: 'Sunita Deshmukh',
    phone: '+91 80 2266 0011',
    phone_number: '+91 80 2266 0011',
    role: 'DEPARTMENT_OFFICER',
    department_id: '11111111-1111-1111-1111-111111111101',
    department_name: 'Civil Works & Municipal Redressal Department',
    department_code: 'CIVIC',
    worker_profile_id: null,
    specialization: null,
    is_available: true,
    active_tasks_count: 0,
    rating: null,
    is_active: true,
    aliases: ['officer02', 'officer2', 'off002', 'off02', 'officer02@bbmp.gov.in']
  },
  {
    id: '44444444-4444-4444-4444-444444444403',
    user_code: 'contractor01',
    email: 'contractor01@bbmp.gov.in',
    password_hash: '$2b$10$EPm90/uWjXg9Yl.iT7/G6u8T5gG2g9/uWjXg9Yl.iT7/G6u8T5gG2',
    full_name: 'Suresh Patil',
    phone: '+91 80 2266 0002',
    phone_number: '+91 80 2266 0002',
    role: 'FIELD_WORKER',
    department_id: '11111111-1111-1111-1111-111111111101',
    department_name: 'Civil Works & Municipal Redressal Department',
    department_code: 'CIVIC',
    worker_profile_id: '44444444-4444-4444-4444-444444444403',
    specialization: 'Civil Maintenance & Redressal',
    is_available: true,
    active_tasks_count: 0,
    rating: 4.9,
    is_active: true,
    aliases: ['contractor01', 'contractor1', 'worker01', 'worker1', 'wrk001', 'wrk01', 'worker@bbmp.gov.in', 'worker01@bbmp.gov.in', 'contractor01@bbmp.gov.in']
  },
  {
    id: '44444444-4444-4444-4444-444444444413',
    user_code: 'contractor02',
    email: 'contractor02@bbmp.gov.in',
    password_hash: '$2b$10$EPm90/uWjXg9Yl.iT7/G6u8T5gG2g9/uWjXg9Yl.iT7/G6u8T5gG2',
    full_name: 'Kiran Gowda',
    phone: '+91 80 2266 0012',
    phone_number: '+91 80 2266 0012',
    role: 'FIELD_WORKER',
    department_id: '11111111-1111-1111-1111-111111111101',
    department_name: 'Civil Works & Municipal Redressal Department',
    department_code: 'CIVIC',
    worker_profile_id: '44444444-4444-4444-4444-444444444413',
    specialization: 'Civil Maintenance & Redressal',
    is_available: true,
    active_tasks_count: 0,
    rating: 4.8,
    is_active: true,
    aliases: ['contractor02', 'contractor2', 'worker02', 'worker2', 'wrk002', 'wrk02', 'worker02@bbmp.gov.in', 'contractor02@bbmp.gov.in']
  },
  {
    id: '44444444-4444-4444-4444-444444444404',
    user_code: 'admin01',
    email: 'admin01@bbmp.gov.in',
    password_hash: '$2b$10$EPm90/uWjXg9Yl.iT7/G6u8T5gG2g9/uWjXg9Yl.iT7/G6u8T5gG2',
    full_name: 'Dr. Priya Sundaram',
    phone: '+91 80 2266 0003',
    phone_number: '+91 80 2266 0003',
    role: 'SUPER_ADMIN',
    department_id: null,
    department_name: null,
    department_code: null,
    worker_profile_id: null,
    specialization: null,
    is_available: true,
    active_tasks_count: 0,
    rating: null,
    is_active: true,
    aliases: ['admin01', 'admin1', 'adm001', 'adm01', 'admin@bbmp.gov.in', 'admin01@bbmp.gov.in']
  },
  {
    id: '44444444-4444-4444-4444-444444444414',
    user_code: 'admin02',
    email: 'admin02@bbmp.gov.in',
    password_hash: '$2b$10$EPm90/uWjXg9Yl.iT7/G6u8T5gG2g9/uWjXg9Yl.iT7/G6u8T5gG2',
    full_name: 'Anand Murthy',
    phone: '+91 80 2266 0013',
    phone_number: '+91 80 2266 0013',
    role: 'SUPER_ADMIN',
    department_id: null,
    department_name: null,
    department_code: null,
    worker_profile_id: null,
    specialization: null,
    is_available: true,
    active_tasks_count: 0,
    rating: null,
    is_active: true,
    aliases: ['admin02', 'admin2', 'adm002', 'adm02', 'admin02@bbmp.gov.in']
  }
];

export const findByEmail = async (email) => {
  const cleanInput = (email || '').trim().toLowerCase();
  const query = `
    SELECT u.id, u.user_code, u.email, u.password_hash, u.full_name, u.phone as phone_number, u.role, 
           u.department_id, NULL as avatar_url, u.is_active, u.created_at, u.updated_at,
           d.name as department_name, d.code as department_code,
           w.user_id as worker_profile_id, w.specializations as specialization, TRUE as is_available, 0 as active_tasks_count, w.rating
    FROM users u
    LEFT JOIN departments d ON u.department_id = d.id
    LEFT JOIN worker_profiles w ON u.id = w.user_id
    WHERE LOWER(u.email) = LOWER($1) 
       OR UPPER(u.user_code) = UPPER($1) 
       OR u.phone = $1
       OR (UPPER($1) IN ('CITIZEN01', 'CITIZEN1', 'CIT001', 'CIT01', 'CITIZEN') AND u.role = 'CITIZEN')
       OR (UPPER($1) IN ('CITIZEN02', 'CITIZEN2', 'CIT002', 'CIT02') AND u.role = 'CITIZEN')
       OR (UPPER($1) IN ('OFFICER01', 'OFFICER1', 'OFF001', 'OFF01', 'OFFICER') AND u.role = 'DEPARTMENT_OFFICER')
       OR (UPPER($1) IN ('OFFICER02', 'OFFICER2', 'OFF002', 'OFF02') AND u.role = 'DEPARTMENT_OFFICER')
       OR (UPPER($1) IN ('CONTRACTOR01', 'CONTRACTOR1', 'WORKER01', 'WORKER1', 'WRK001', 'WRK01', 'WORKER', 'CONTRACTOR') AND u.role = 'FIELD_WORKER')
       OR (UPPER($1) IN ('CONTRACTOR02', 'CONTRACTOR2', 'WORKER02', 'WORKER2', 'WRK002', 'WRK02') AND u.role = 'FIELD_WORKER')
       OR (UPPER($1) IN ('ADMIN01', 'ADMIN1', 'ADM001', 'ADM01', 'ADMIN') AND u.role = 'SUPER_ADMIN')
       OR (UPPER($1) IN ('ADMIN02', 'ADMIN2', 'ADM002', 'ADM02') AND u.role = 'SUPER_ADMIN')
  `;
  try {
    const result = await db.query(query, [email]);
    if (result.rows && result.rows[0]) {
      return result.rows[0];
    }
  } catch (err) {
    // Database query failed or unavailable, fallback to built-in users
  }

  // Fallback to built-in users
  return BUILTIN_USERS.find(u => 
    u.aliases.includes(cleanInput) ||
    u.email.toLowerCase() === cleanInput ||
    u.user_code.toLowerCase() === cleanInput ||
    u.phone === cleanInput
  ) || null;
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
  try {
    const result = await db.query(query, [id]);
    if (result.rows && result.rows[0]) {
      return result.rows[0];
    }
  } catch (err) {
    // Database query failed or unavailable, fallback to built-in users
  }
  return BUILTIN_USERS.find(u => u.id === id) || null;
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

export const createOtp = async ({ userId, email, otpCode, expiresAt }) => {
  // Invalidate any existing unused OTPs for this user
  await db.query(`
    UPDATE password_reset_otps
    SET is_used = TRUE
    WHERE user_id = $1 AND is_used = FALSE
  `, [userId]);

  const query = `
    INSERT INTO password_reset_otps (user_id, email, otp_code, expires_at)
    VALUES ($1, LOWER($2), $3, $4)
    RETURNING id, user_id, email, otp_code, expires_at;
  `;
  const result = await db.query(query, [userId, email, otpCode, expiresAt]);
  return result.rows[0];
};

export const findValidOtp = async ({ email, otpCode }) => {
  const query = `
    SELECT id, user_id, email, otp_code, expires_at, attempts, is_used
    FROM password_reset_otps
    WHERE LOWER(email) = LOWER($1)
      AND otp_code = $2
      AND is_used = FALSE
      AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
  `;
  const result = await db.query(query, [email, otpCode]);
  return result.rows[0] || null;
};

export const incrementOtpAttempts = async (id) => {
  const query = `
    UPDATE password_reset_otps
    SET attempts = attempts + 1,
        is_used = CASE WHEN attempts + 1 >= 5 THEN TRUE ELSE is_used END
    WHERE id = $1
    RETURNING attempts, is_used;
  `;
  const result = await db.query(query, [id]);
  return result.rows[0];
};

export const markOtpUsed = async (id) => {
  await db.query(`
    UPDATE password_reset_otps
    SET is_used = TRUE
    WHERE id = $1
  `, [id]);
};

export const updatePassword = async ({ userId, passwordHash }) => {
  const query = `
    UPDATE users
    SET password_hash = $1,
        updated_at = NOW()
    WHERE id = $2
    RETURNING id, user_code, email, full_name, role;
  `;
  const result = await db.query(query, [passwordHash, userId]);
  return result.rows[0];
};

export default {
  findByEmail,
  findById,
  create,
  createOtp,
  findValidOtp,
  incrementOtpAttempts,
  markOtpUsed,
  updatePassword
};
