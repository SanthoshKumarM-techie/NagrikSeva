import { Router } from 'express';
import transferController from './transfer.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';
import validateRequest from '../../middlewares/validateRequest.js';
import { initiateTransferSchema, reviewTransferSchema } from './transfer.validation.js';

const router = Router();

router.use(authenticate);

// Department officer / Admin transfer queues
router.get('/incoming', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), transferController.getIncomingTransfers);
router.get('/outgoing', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), transferController.getOutgoingTransfers);
router.get('/repeated', authorizeRole('SUPER_ADMIN'), transferController.getRepeatedTransfers);
router.get('/all', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), transferController.listAllTransfers);
router.get('/complaint/:complaintId', transferController.getComplaintTransfers);

// Initiate (Officer requests transfer) & Review (Supervisor Admin approves and assigns department)
router.post('/', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), validateRequest(initiateTransferSchema), transferController.initiateTransfer);
router.patch('/:id/review', authorizeRole('SUPER_ADMIN'), validateRequest(reviewTransferSchema), transferController.reviewTransfer);

export default router;

