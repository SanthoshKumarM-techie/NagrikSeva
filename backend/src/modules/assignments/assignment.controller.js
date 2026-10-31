import assignmentService from './assignment.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const createAssignment = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const assignment = await assignmentService.assignWorker(req.user, req.body, clientInfo);
  return ApiResponse.created(res, { assignment }, 'Worker assigned successfully');
});

export const getMyTasks = asyncHandler(async (req, res) => {
  const tasks = await assignmentService.getWorkerTasks(req.user.id, req.query);
  return ApiResponse.success(res, 200, { tasks }, 'Worker tasks retrieved successfully');
});

export const getAssignmentById = asyncHandler(async (req, res) => {
  const assignment = await assignmentService.getAssignmentById(req.params.id);
  return ApiResponse.success(res, 200, { assignment }, 'Assignment details retrieved successfully');
});

export const acceptAssignment = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const assignment = await assignmentService.acceptAssignment(req.params.id, req.user.id, clientInfo, req.user);
  return ApiResponse.success(res, 200, { assignment }, 'Assignment accepted');
});

export const logInspection = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const update = await assignmentService.logInspection(req.params.id, req.user.id, req.body, clientInfo, req.user);
  return ApiResponse.success(res, 200, { update }, 'Inspection logged successfully');
});

export const startRemediation = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const result = await assignmentService.startRemediation(req.params.id, req.user.id, req.body, clientInfo, req.user);
  return ApiResponse.success(res, 200, result, 'Remediation work marked as in-progress');
});

export const reportWorkDelay = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const result = await assignmentService.reportWorkDelay(req.params.id, req.user.id, req.body, clientInfo, req.user);
  return ApiResponse.success(res, 200, result, 'Work delay reported and notifications dispatched');
});

export const addProgressUpdate = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const update = await assignmentService.addProgressUpdate(req.params.id, req.user.id, req.body, clientInfo, req.user);
  return ApiResponse.success(res, 200, { update }, 'Progress update submitted');
});

export const completeWork = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const result = await assignmentService.completeWork(req.params.id, req.user.id, req.body, clientInfo, req.user);
  return ApiResponse.success(res, 200, result, 'Work completed and submitted for verification');
});

export default {
  createAssignment,
  getMyTasks,
  getAssignmentById,
  acceptAssignment,
  logInspection,
  startRemediation,
  reportWorkDelay,
  addProgressUpdate,
  completeWork
};
