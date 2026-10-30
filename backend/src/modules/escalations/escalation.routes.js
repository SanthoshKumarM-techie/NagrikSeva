import { Router } from 'express';
import escalationController from './escalation.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';

const router = Router();

router.use(authenticate);

// Officers & Admin can view escalations
router.get('/', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), escalationController.listEscalations);
router.patch('/:id/acknowledge', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), escalationController.acknowledgeEscalation);
router.patch('/:id/resolve', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), escalationController.resolveEscalation);

// Manual escalation by Super Admin
router.post('/manual', authorizeRole('SUPER_ADMIN'), escalationController.manualEscalate);

export default router;

