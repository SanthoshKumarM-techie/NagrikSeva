import ApiError from '../utils/ApiError.js';

export function authorizeDepartment(getDepartmentIdFromRequest = (req) => req.params.departmentId || req.body.department_id || req.body.departmentId) {
  return (req, res, next) => {
    if (!req.user) {
      return next(ApiError.unauthorized('Authentication required'));
    }

    // Super admin has municipal-wide authority across all departments
    if (req.user.role === 'SUPER_ADMIN') {
      return next();
    }

    const targetDeptId = getDepartmentIdFromRequest(req);
    if (!targetDeptId) {
      return next();
    }

    const userDeptId = req.user.departmentId || req.user.department_id;
    if (userDeptId !== targetDeptId) {
      return next(
        ApiError.forbidden(
          'Forbidden: You are only authorized to manage complaints and resources within your assigned department.'
        )
      );
    }

    next();
  };
}

export default authorizeDepartment;
