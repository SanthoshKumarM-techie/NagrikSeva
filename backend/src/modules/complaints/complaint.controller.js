import complaintService from './complaint.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const findMatches = asyncHandler(async (req, res) => {
  const { latitude, longitude, categoryId, radiusMeters } = req.body;
  const matches = await complaintService.findNearbyMatches({
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    categoryId,
    radiusMeters: radiusMeters ? parseFloat(radiusMeters) : 500
  });
  return ApiResponse.success(res, 200, { matches }, 'Nearby complaints retrieved');
});

export const createComplaint = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const complaint = await complaintService.createComplaint(req.user.id, req.body, clientInfo);
  return ApiResponse.created(res, { complaint }, 'Complaint created successfully');
});

export const supportComplaint = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const result = await complaintService.supportComplaint(req.params.id, req.user.id, clientInfo);
  return ApiResponse.success(res, 200, result, 'Complaint supported successfully');
});

export const listComplaints = asyncHandler(async (req, res) => {
  const result = await complaintService.listComplaints(req.query, req.user);
  return ApiResponse.success(res, 200, result, 'Complaints retrieved successfully');
});

export const getMyComplaints = asyncHandler(async (req, res) => {
  const result = await complaintService.getMyComplaints(req.user.id, req.query);
  return ApiResponse.success(res, 200, result, 'My complaints retrieved successfully');
});

export const getComplaintById = asyncHandler(async (req, res) => {
  const currentUserId = req.user ? req.user.id : null;
  const complaint = await complaintService.getComplaintById(req.params.id, currentUserId);
  return ApiResponse.success(res, 200, { complaint }, 'Complaint details retrieved successfully');
});

export const cancelComplaint = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const complaint = await complaintService.cancelComplaint(req.params.id, req.user.id, req.body.remarks, clientInfo);
  return ApiResponse.success(res, 200, { complaint }, 'Complaint cancelled successfully');
});

export const getCitizenStats = asyncHandler(async (req, res) => {
  const stats = await complaintService.getCitizenStats(req.user.id);
  return ApiResponse.success(res, 200, { stats }, 'Citizen stats retrieved successfully');
});

export const getDepartmentStats = asyncHandler(async (req, res) => {
  const departmentId = req.params.departmentId || req.user.departmentId;
  const stats = await complaintService.getDepartmentStats(departmentId);
  return ApiResponse.success(res, 200, { stats }, 'Department stats retrieved successfully');
});

export const getMapComplaints = asyncHandler(async (req, res) => {
  const complaints = await complaintService.getMapComplaints(req.query);
  return ApiResponse.success(res, 200, { complaints }, 'Map complaints retrieved successfully');
});

export default {
  findMatches,
  createComplaint,
  supportComplaint,
  listComplaints,
  getMyComplaints,
  getComplaintById,
  cancelComplaint,
  getCitizenStats,
  getDepartmentStats,
  getMapComplaints
};

