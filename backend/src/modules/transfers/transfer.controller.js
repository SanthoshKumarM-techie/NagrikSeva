import transferService from './transfer.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const initiateTransfer = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const transfer = await transferService.initiateTransfer(req.user, req.body, clientInfo);
  return ApiResponse.created(res, { transfer }, 'Transfer initiated successfully');
});

export const reviewTransfer = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const transfer = await transferService.reviewTransfer(req.params.id, req.user, req.body, clientInfo);
  return ApiResponse.success(res, 200, { transfer }, 'Transfer reviewed successfully');
});

export const getIncomingTransfers = asyncHandler(async (req, res) => {
  const departmentId = req.query.departmentId || req.user.departmentId;
  const transfers = await transferService.getIncomingTransfers(departmentId, req.query.status);
  return ApiResponse.success(res, 200, { transfers }, 'Incoming transfers retrieved');
});

export const getOutgoingTransfers = asyncHandler(async (req, res) => {
  const departmentId = req.query.departmentId || req.user.departmentId;
  const transfers = await transferService.getOutgoingTransfers(departmentId, req.query.status);
  return ApiResponse.success(res, 200, { transfers }, 'Outgoing transfers retrieved');
});

export const getComplaintTransfers = asyncHandler(async (req, res) => {
  const transfers = await transferService.getComplaintTransferHistory(req.params.complaintId);
  return ApiResponse.success(res, 200, { transfers }, 'Complaint transfer history retrieved');
});

export const getRepeatedTransfers = asyncHandler(async (req, res) => {
  const repeated = await transferService.getRepeatedTransfers();
  return ApiResponse.success(res, 200, { repeated }, 'Repeated transfers warning list retrieved');
});

export const listAllTransfers = asyncHandler(async (req, res) => {
  const transfers = await transferService.listAllTransfers(req.query);
  return ApiResponse.success(res, 200, { transfers }, 'All transfers retrieved');
});

export default {
  initiateTransfer,
  reviewTransfer,
  getIncomingTransfers,
  getOutgoingTransfers,
  getComplaintTransfers,
  getRepeatedTransfers,
  listAllTransfers
};

