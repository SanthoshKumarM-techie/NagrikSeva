import { Router } from 'express';
import analyticsController from './analytics.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';

const router = Router();

router.use(authenticate);

// Department officer analytics
router.get('/department', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), analyticsController.getDepartmentAnalytics);

// City-wide super admin analytics
router.get('/city', authorizeRole('SUPER_ADMIN'), analyticsController.getCityAnalytics);

export default router;

