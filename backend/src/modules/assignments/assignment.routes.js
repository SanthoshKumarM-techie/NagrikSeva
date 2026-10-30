import { Router } from 'express';
import assignmentController from './assignment.controller.js';
import authenticate from '../../middlewares/authenticate.js';
import authorizeRole from '../../middlewares/authorizeRole.js';
import validateRequest from '../../middlewares/validateRequest.js';
import {
  createAssignmentSchema,
  addWorkUpdateSchema,
  completeWorkSchema
} from './assignment.validation.js';

const router = Router();

router.use(authenticate);

// Worker task list
router.get('/my-tasks', authorizeRole('FIELD_WORKER'), assignmentController.getMyTasks);

// Assignment creation (Officer or Admin)
router.post('/', authorizeRole('DEPARTMENT_OFFICER', 'SUPER_ADMIN'), validateRequest(createAssignmentSchema), assignmentController.createAssignment);

// Single assignment details
router.get('/:id', assignmentController.getAssignmentById);

// Worker workflow actions
router.patch('/:id/accept', authorizeRole('FIELD_WORKER', 'SUPER_ADMIN', 'DEPARTMENT_OFFICER'), assignmentController.acceptAssignment);
router.post('/:id/inspection', authorizeRole('FIELD_WORKER', 'SUPER_ADMIN', 'DEPARTMENT_OFFICER'), validateRequest(addWorkUpdateSchema), assignmentController.logInspection);
router.patch('/:id/start', authorizeRole('FIELD_WORKER', 'SUPER_ADMIN', 'DEPARTMENT_OFFICER'), assignmentController.startRemediation);
router.post('/:id/progress', authorizeRole('FIELD_WORKER', 'SUPER_ADMIN', 'DEPARTMENT_OFFICER'), validateRequest(addWorkUpdateSchema), assignmentController.addProgressUpdate);
router.post('/:id/complete', authorizeRole('FIELD_WORKER', 'SUPER_ADMIN', 'DEPARTMENT_OFFICER'), validateRequest(completeWorkSchema), assignmentController.completeWork);

export default router;

