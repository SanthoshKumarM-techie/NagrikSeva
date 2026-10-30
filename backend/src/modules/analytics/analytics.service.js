import analyticsRepository from './analytics.repository.js';
import ApiError from '../../utils/ApiError.js';

export const getDepartmentAnalytics = async (departmentId) => {
  if (!departmentId) {
    throw ApiError.badRequest('Department ID is required');
  }
  return await analyticsRepository.getDepartmentAnalytics(departmentId);
};

export const getCityAnalytics = async () => {
  return await analyticsRepository.getCityAnalytics();
};

export default {
  getDepartmentAnalytics,
  getCityAnalytics
};

