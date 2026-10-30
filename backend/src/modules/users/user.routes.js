import { Router } from 'express';
import userController from './user.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';

const router = Router();

router.use(authenticate);

// Profile
router.patch('/profile', userController.updateProfile);

// Department workers (officers or admin)
router.get('/workers', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), userController.getDepartmentWorkers);
router.get('/workers/:departmentId', authorizeRole('SUPER_ADMIN'), userController.getDepartmentWorkers);

// Super Admin user management
router.get('/', authorizeRole('SUPER_ADMIN'), userController.listUsers);
router.post('/', authorizeRole('SUPER_ADMIN'), userController.createUser);
router.get('/:id', authorizeRole('SUPER_ADMIN'), userController.getUserById);
router.patch('/:id/status', authorizeRole('SUPER_ADMIN'), userController.updateUserStatus);

export default router;

