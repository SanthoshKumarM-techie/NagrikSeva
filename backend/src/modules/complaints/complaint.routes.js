import { Router } from 'express';
import complaintController from './complaint.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';
import validateRequest from '../../middlewares/validateRequest.js';
import {
  createComplaintSchema,
  matchComplaintsSchema,
  cancelComplaintSchema
} from './complaint.validation.js';

const router = Router();

// Public / open query endpoints
router.post('/matches', validateRequest(matchComplaintsSchema), complaintController.findMatches);
router.get('/map', complaintController.getMapComplaints);

// Stats endpoints
router.get('/stats/citizen', authenticate, authorizeRole('CITIZEN'), complaintController.getCitizenStats);
router.get('/stats/department', authenticate, authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), complaintController.getDepartmentStats);

// Citizen my-complaints
router.get('/my', authenticate, authorizeRole('CITIZEN'), complaintController.getMyComplaints);

// Complaints listing & creation
router.get('/', complaintController.listComplaints);
router.post('/', authenticate, validateRequest(createComplaintSchema), complaintController.createComplaint);

// Single complaint actions
router.get('/:id', complaintController.getComplaintById);
router.post('/:id/support', authenticate, authorizeRole('CITIZEN'), complaintController.supportComplaint);
router.patch('/:id/cancel', authenticate, authorizeRole('CITIZEN'), validateRequest(cancelComplaintSchema), complaintController.cancelComplaint);

export default router;

