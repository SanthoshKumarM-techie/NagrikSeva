import userService from './user.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const listUsers = asyncHandler(async (req, res) => {
  const result = await userService.listUsers(req.query);
  return ApiResponse.success(res, 200, result, 'Users retrieved successfully');
});

export const getUserById = asyncHandler(async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  return ApiResponse.success(res, 200, { user }, 'User retrieved successfully');
});

export const createUser = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const user = await userService.createUser(req.body, req.user.id, clientInfo);
  return ApiResponse.created(res, { user }, 'User created successfully');
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user.id, req.body);
  if (req.session && req.session.user) {
    req.session.user.fullName = user.full_name;
    req.session.user.phoneNumber = user.phone_number;
    req.session.user.avatarUrl = user.avatar_url;
  }
  return ApiResponse.success(res, 200, { user }, 'Profile updated successfully');
});

export const updateUserStatus = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const { isActive } = req.body;
  const user = await userService.updateUserStatus(req.params.id, isActive, req.user.id, clientInfo);
  return ApiResponse.success(res, 200, { user }, 'User status updated successfully');
});

export const getDepartmentWorkers = asyncHandler(async (req, res) => {
  const departmentId = req.params.departmentId || req.user.departmentId;
  const workers = await userService.getDepartmentWorkers(departmentId, req.query);
  return ApiResponse.success(res, 200, { workers }, 'Department workers retrieved successfully');
});

export default {
  listUsers,
  getUserById,
  createUser,
  updateProfile,
  updateUserStatus,
  getDepartmentWorkers
};

