import { Router } from 'express';
import slaController from './sla.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';

const router = Router();

router.use(authenticate);

router.get('/rules', slaController.listRules);
router.get('/rules/:id', slaController.getRuleById);

// Admin-only management
router.post('/rules', authorizeRole('SUPER_ADMIN'), slaController.createRule);
router.put('/rules/:id', authorizeRole('SUPER_ADMIN'), slaController.updateRule);

export default router;

