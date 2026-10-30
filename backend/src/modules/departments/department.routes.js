import { Router } from 'express';
import departmentController from './department.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';

const router = Router();

// General list for all authenticated or public users (defaults to active departments if not admin)
router.get('/', departmentController.listDepartments);
router.get('/:id', departmentController.getDepartmentById);

// Admin-only management endpoints
router.post('/', authenticate, authorizeRole('SUPER_ADMIN'), departmentController.createDepartment);
router.put('/:id', authenticate, authorizeRole('SUPER_ADMIN'), departmentController.updateDepartment);
router.patch('/:id/status', authenticate, authorizeRole('SUPER_ADMIN'), departmentController.toggleDepartmentStatus);

export default router;

