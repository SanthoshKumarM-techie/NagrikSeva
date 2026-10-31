import departmentRepository from './department.repository.js';
import ApiError from '../../utils/ApiError.js';
import auditService from '../audit/audit.service.js';
import mailService from '../../services/mail.service.js';
import bcrypt from 'bcrypt';
import db from '../../config/database.js';

export const listDepartments = async ({ isActive, search } = {}) => {
  return await departmentRepository.findAll({ isActive, search });
};

export const getDepartmentById = async (id) => {
  const department = await departmentRepository.findById(id);
  if (!department) {
    throw ApiError.notFound('Department not found');
  }
  return department;
};

export const createDepartment = async (data, adminId, clientInfo = {}) => {
  if (!data.name || !data.name.trim()) {
    throw ApiError.badRequest('Department name is required');
  }

  const cleanName = data.name.trim();
  const cleanCode = (data.code || cleanName.slice(0, 4)).trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const existing = await departmentRepository.findByCode(cleanCode);
  if (existing) {
    throw ApiError.conflict(`Department with code '${cleanCode}' already exists`);
  }

  const dept = await departmentRepository.create({
    ...data,
    name: cleanName,
    code: cleanCode
  });

  // Ensure default complaint category exists for the new department
  try {
    await db.query(`
      INSERT INTO complaint_categories (default_department_id, name, description, is_active)
      VALUES ($1, $2, $3, TRUE)
      ON CONFLICT DO NOTHING;
    `, [dept.id, `${cleanName} Services`, dept.description || `Civic issues and maintenance for ${cleanName}`]);
  } catch (catErr) {
    console.warn('Auto-category creation note:', catErr.message);
  }

  // Ensure default SLA rule exists for the new department
  try {
    await db.query(`
      INSERT INTO sla_rules (department_id, acknowledgement_hours, assignment_hours, inspection_hours, resolution_hours, is_active)
      VALUES ($1, 4.00, 12.00, 24.00, 48.00, TRUE)
      ON CONFLICT DO NOTHING;
    `, [dept.id]);
  } catch (slaErr) {
    console.warn('Auto-SLA creation note:', slaErr.message);
  }

  // Automatically provision Nodal Department Officer Account and Credentials
  let officerAccount = null;
  const officerEmail = (data.email || data.contactEmail || `${cleanCode.toLowerCase()}.grievance@bbmp.gov.in`).trim().toLowerCase();
  const officerName = (data.headOfficer || data.nodalOfficer || `${cleanName} Nodal Officer`).trim();
  const officerPhone = (data.phone || data.contactPhone || '+91 80 2266 0000').trim();
  const initialPassword = data.initialPassword || data.password || `Officer@${cleanCode}123`;

  try {
    // Generate sequential user code for the department officer (e.g. OFF001, OFF002, OFF003)
    const codeQuery = `SELECT user_code FROM users WHERE user_code LIKE 'OFF%' ORDER BY user_code DESC LIMIT 1;`;
    const codeRes = await db.query(codeQuery);
    let nextNum = 3;
    if (codeRes.rows.length > 0 && codeRes.rows[0].user_code) {
      const match = codeRes.rows[0].user_code.match(/\d+/);
      if (match) {
        nextNum = parseInt(match[0], 10) + 1;
      }
    }
    const officerUserCode = `OFF${String(nextNum).padStart(3, '0')}`;
    const passwordHash = await bcrypt.hash(initialPassword, 10);

    // Check if user already exists with this email
    const existingUserRes = await db.query(`SELECT id, user_code FROM users WHERE email = $1 LIMIT 1;`, [officerEmail]);

    let officerId;
    let finalUserCode = officerUserCode;

    if (existingUserRes.rows.length > 0) {
      officerId = existingUserRes.rows[0].id;
      finalUserCode = existingUserRes.rows[0].user_code || officerUserCode;
      await db.query(`
        UPDATE users
        SET department_id = $1, role = 'DEPARTMENT_OFFICER', full_name = $2, phone = $3, updated_at = NOW()
        WHERE id = $4;
      `, [dept.id, officerName, officerPhone, officerId]);
    } else {
      const newUserRes = await db.query(`
        INSERT INTO users (
          user_code, password_hash, full_name, email, phone, role, department_id, address, is_active, is_verified
        ) VALUES (
          $1, $2, $3, $4, $5, 'DEPARTMENT_OFFICER', $6, $7, TRUE, TRUE
        )
        RETURNING id, user_code, full_name, email, role, department_id;
      `, [
        officerUserCode,
        passwordHash,
        officerName,
        officerEmail,
        officerPhone,
        dept.id,
        data.address || `${cleanName} Wing, BBMP Administrative Building, Bengaluru`
      ]);
      officerId = newUserRes.rows[0].id;
    }

    // Link Nodal Officer to Department
    await db.query(`UPDATE departments SET nodal_officer_id = $1 WHERE id = $2;`, [officerId, dept.id]);

    // Dispatch official credentials email via Brevo SMTP relay
    let emailDispatched = false;
    try {
      emailDispatched = await mailService.sendDepartmentOfficerWelcomeEmail({
        toEmail: officerEmail,
        fullName: officerName,
        userCode: finalUserCode,
        temporaryPassword: initialPassword,
        departmentName: cleanName,
        departmentCode: cleanCode,
        loginUrl: 'http://localhost:5174/login?portal=officer'
      });
    } catch (mailErr) {
      console.warn('Mail dispatch note for new department officer:', mailErr.message);
    }

    officerAccount = {
      userCode: finalUserCode,
      fullName: officerName,
      email: officerEmail,
      phone: officerPhone,
      temporaryPassword: initialPassword,
      portalUrl: '/login?portal=officer',
      emailDispatched: Boolean(emailDispatched)
    };
  } catch (userErr) {
    console.error('Auto-officer account creation error:', userErr);
  }

  auditService.logEvent({
    userId: adminId,
    action: 'CREATE_DEPARTMENT',
    entityType: 'DEPARTMENT',
    entityId: dept.id,
    details: { code: dept.code, name: dept.name, nodalOfficer: officerAccount?.userCode },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return {
    ...dept,
    officerAccount
  };
};

export const updateDepartment = async (id, data, adminId, clientInfo = {}) => {
  const existing = await departmentRepository.findById(id);
  if (!existing) {
    throw ApiError.notFound('Department not found');
  }

  const updated = await departmentRepository.update(id, data);

  auditService.logEvent({
    userId: adminId,
    action: 'UPDATE_DEPARTMENT',
    entityType: 'DEPARTMENT',
    entityId: id,
    details: { changes: data },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return updated;
};

export const toggleDepartmentStatus = async (id, isActive, adminId, clientInfo = {}) => {
  const existing = await departmentRepository.findById(id);
  if (!existing) {
    throw ApiError.notFound('Department not found');
  }

  const updated = await departmentRepository.update(id, { isActive });

  auditService.logEvent({
    userId: adminId,
    action: isActive ? 'ENABLE_DEPARTMENT' : 'DISABLE_DEPARTMENT',
    entityType: 'DEPARTMENT',
    entityId: id,
    details: { isActive },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return updated;
};

export default {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus
};

