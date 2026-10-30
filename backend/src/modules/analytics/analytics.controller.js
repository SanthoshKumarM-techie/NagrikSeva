import analyticsService from './analytics.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const getDepartmentAnalytics = asyncHandler(async (req, res) => {
  const departmentId = req.query.departmentId || req.user.departmentId;
  const data = await analyticsService.getDepartmentAnalytics(departmentId);
  return ApiResponse.success(res, 200, { analytics: data }, 'Department analytics retrieved successfully');
});

export const getCityAnalytics = asyncHandler(async (req, res) => {
  const data = await analyticsService.getCityAnalytics();
  return ApiResponse.success(res, 200, { analytics: data }, 'City analytics retrieved successfully');
});

export default {
  getDepartmentAnalytics,
  getCityAnalytics
};

