import departmentService from './department.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const listDepartments = asyncHandler(async (req, res) => {
  const isActive = req.query.isActive !== undefined ? req.query.isActive === 'true' : undefined;
  const search = req.query.search;
  const departments = await departmentService.listDepartments({ isActive, search });
  const nextOfficerCode = await departmentService.getNextOfficerCode();
  return ApiResponse.success(res, 200, { departments, nextOfficerCode }, 'Departments retrieved successfully');
});

export const getDepartmentById = asyncHandler(async (req, res) => {
  const department = await departmentService.getDepartmentById(req.params.id);
  return ApiResponse.success(res, 200, { department }, 'Department retrieved successfully');
});

export const createDepartment = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const department = await departmentService.createDepartment(req.body, req.user.id, clientInfo);
  return ApiResponse.created(res, { department }, 'Department created successfully');
});

export const updateDepartment = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const department = await departmentService.updateDepartment(req.params.id, req.body, req.user.id, clientInfo);
  return ApiResponse.success(res, 200, { department }, 'Department updated successfully');
});

export const toggleDepartmentStatus = asyncHandler(async (req, res) => {
  const clientInfo = { ip: req.ip, userAgent: req.get('user-agent') };
  const { isActive } = req.body;
  const department = await departmentService.toggleDepartmentStatus(req.params.id, isActive, req.user.id, clientInfo);
  return ApiResponse.success(res, 200, { department }, 'Department status updated successfully');
});

export default {
  listDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  toggleDepartmentStatus
};

