import slaService from './sla.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const listRules = asyncHandler(async (req, res) => {
  const departmentId = req.query.departmentId;
  const categoryId = req.query.categoryId;
  const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
  const rules = await slaService.listSlaRules({ departmentId, categoryId, isActive });
  return ApiResponse.success(res, 200, { rules }, 'SLA rules retrieved successfully');
});

export const getRuleById = asyncHandler(async (req, res) => {
  const rule = await slaService.getSlaRuleById(req.params.id);
  return ApiResponse.success(res, 200, { rule }, 'SLA rule retrieved successfully');
});

export const createRule = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const rule = await slaService.createSlaRule(req.body, req.user.id, clientInfo);
  return ApiResponse.created(res, { rule }, 'SLA rule created successfully');
});

export const updateRule = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const rule = await slaService.updateSlaRule(req.params.id, req.body, req.user.id, clientInfo);
  return ApiResponse.success(res, 200, { rule }, 'SLA rule updated successfully');
});

export default {
  listRules,
  getRuleById,
  createRule,
  updateRule
};

