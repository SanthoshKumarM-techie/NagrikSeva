import escalationService from './escalation.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const listEscalations = asyncHandler(async (req, res) => {
  const result = await escalationService.listEscalations(req.query, req.user);
  return ApiResponse.success(res, 200, result, 'Escalations retrieved successfully');
});

export const acknowledgeEscalation = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const escalation = await escalationService.acknowledgeEscalation(req.params.id, req.user, clientInfo);
  return ApiResponse.success(res, 200, { escalation }, 'Escalation acknowledged');
});

export const resolveEscalation = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const escalation = await escalationService.resolveEscalation(req.params.id, req.user, req.body.resolutionNotes, clientInfo);
  return ApiResponse.success(res, 200, { escalation }, 'Escalation resolved successfully');
});

export const manualEscalate = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const escalation = await escalationService.manualEscalate(req.user, req.body, clientInfo);
  return ApiResponse.created(res, { escalation }, 'Complaint escalated successfully');
});

export default {
  listEscalations,
  acknowledgeEscalation,
  resolveEscalation,
  manualEscalate
};

