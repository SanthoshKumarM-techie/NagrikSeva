import departmentRepository from './department.repository.js';
import ApiError from '../../utils/ApiError.js';
import auditService from '../audit/audit.service.js';
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

  auditService.logEvent({
    userId: adminId,
    action: 'CREATE_DEPARTMENT',
    entityType: 'DEPARTMENT',
    entityId: dept.id,
    details: { code: dept.code, name: dept.name },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return dept;
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

