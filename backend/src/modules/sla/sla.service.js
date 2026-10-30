import slaRepository from './sla.repository.js';
import ApiError from '../../utils/ApiError.js';
import auditService from '../audit/audit.service.js';

export const listSlaRules = async (filters) => {
  return await slaRepository.findAll(filters);
};

export const getSlaRuleById = async (id) => {
  const rule = await slaRepository.findById(id);
  if (!rule) {
    throw ApiError.notFound('SLA rule not found');
  }
  return rule;
};

export const createSlaRule = async (data, adminId, clientInfo = {}) => {
  const rule = await slaRepository.create(data);

  auditService.logEvent({
    userId: adminId,
    action: 'CREATE_SLA_RULE',
    entityType: 'SLA_RULE',
    entityId: rule.id,
    details: { resolutionHours: rule.resolution_hours, departmentId: rule.department_id },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return rule;
};

export const updateSlaRule = async (id, data, adminId, clientInfo = {}) => {
  const existing = await slaRepository.findById(id);
  if (!existing) {
    throw ApiError.notFound('SLA rule not found');
  }

  const updated = await slaRepository.update(id, data);

  auditService.logEvent({
    userId: adminId,
    action: 'UPDATE_SLA_RULE',
    entityType: 'SLA_RULE',
    entityId: id,
    details: { changes: data },
    ipAddress: clientInfo.ip,
    userAgent: clientInfo.userAgent
  }).catch(console.error);

  return updated;
};

export default {
  listSlaRules,
  getSlaRuleById,
  createSlaRule,
  updateSlaRule
};

