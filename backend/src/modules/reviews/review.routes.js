import { Router } from 'express';
import reviewController from './review.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';
import validateRequest from '../../middlewares/validateRequest.js';
import {
  officerVerificationSchema,
  citizenFeedbackSchema
} from './review.validation.js';

const router = Router();

router.use(authenticate);

// Get reviews for a complaint
router.get('/complaint/:complaintId', reviewController.getReviews);

// Officer verification
router.post('/complaint/:complaintId/officer-verify', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), validateRequest(officerVerificationSchema), reviewController.officerVerify);
router.post('/officer-verify/:complaintId', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), validateRequest(officerVerificationSchema), reviewController.officerVerify);
router.post('/:complaintId/officer-verify', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), validateRequest(officerVerificationSchema), reviewController.officerVerify);

// Citizen confirmation / dispute
router.post('/complaint/:complaintId/citizen-feedback', authorizeRole('CITIZEN'), validateRequest(citizenFeedbackSchema), reviewController.citizenReview);
router.post('/citizen-feedback/:complaintId', authorizeRole('CITIZEN'), validateRequest(citizenFeedbackSchema), reviewController.citizenReview);
router.post('/:complaintId/citizen-feedback', authorizeRole('CITIZEN'), validateRequest(citizenFeedbackSchema), reviewController.citizenReview);

export default router;

