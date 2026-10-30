import categoryService from './category.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const listCategories = asyncHandler(async (req, res) => {
  const departmentId = req.query.departmentId;
  const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
  const categories = await categoryService.listCategories({ departmentId, isActive });
  return ApiResponse.success(res, 200, { categories }, 'Categories retrieved successfully');
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  return ApiResponse.success(res, 200, { category }, 'Category retrieved successfully');
});

export const createCategory = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const category = await categoryService.createCategory(req.body, req.user.id, clientInfo);
  return ApiResponse.created(res, { category }, 'Category created successfully');
});

export const updateCategory = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const category = await categoryService.updateCategory(req.params.id, req.body, req.user.id, clientInfo);
  return ApiResponse.success(res, 200, { category }, 'Category updated successfully');
});

export default {
  listCategories,
  getCategoryById,
  createCategory,
  updateCategory
};

