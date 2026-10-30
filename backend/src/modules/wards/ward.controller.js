import wardService from './ward.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const listWards = asyncHandler(async (req, res) => {
  const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
  const zone = req.query.zone;
  const wards = await wardService.listWards({ isActive, zone });
  return ApiResponse.success(res, 200, { wards }, 'Municipal wards retrieved successfully');
});

export const getWardById = asyncHandler(async (req, res) => {
  const ward = await wardService.getWardById(req.params.id);
  return ApiResponse.success(res, 200, { ward }, 'Ward retrieved successfully');
});

export default {
  listWards,
  getWardById
};

