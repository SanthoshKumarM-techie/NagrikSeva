import categoryRepository from './category.repository.js';
import ApiError from '../../utils/ApiError.js';
import auditService from '../audit/audit.service.js';

export const listCategories = async (filters) => {
  return await categoryRepository.findAll(filters);
};

export const getCategoryById = async (id) => {
  const category = await categoryRepository.findById(id);
  if (!category) {
    throw ApiError.notFound('Category not found');
  }
  return category;
};

export const createCategory = async (data, adminId, clientInfo = {}) => {
  const category = await categoryRepository.create(data);

  auditService.logEvent({
    userId: adminId,
    action: 'CREATE_CATEGORY',
    entityType: 'CATEGORY',
    entityId: category.id,
    details: { name: category.name, code: category.code, departmentId: category.department_id },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return category;
};

export const updateCategory = async (id, data, adminId, clientInfo = {}) => {
  const existing = await categoryRepository.findById(id);
  if (!existing) {
    throw ApiError.notFound('Category not found');
  }

  const updated = await categoryRepository.update(id, data);

  auditService.logEvent({
    userId: adminId,
    action: 'UPDATE_CATEGORY',
    entityType: 'CATEGORY',
    entityId: id,
    details: { changes: data },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return updated;
};

export default {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory
};

