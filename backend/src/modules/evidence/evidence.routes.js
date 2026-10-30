import { Router } from 'express';
import evidenceController from './evidence.controller.js';
import uploadMiddleware from '../../middlewares/uploadMiddleware.js';

const router = Router();

// Upload single file (citizen initial proof, worker remediation photos)
router.post('/upload', (req, res, next) => {
  if (req.session && req.session.user) {
    req.user = req.session.user;
  }
  next();
}, uploadMiddleware.single('file'), evidenceController.uploadSingleFile);

// Complaint evidence listing
router.get('/complaint/:complaintId', evidenceController.getEvidenceByComplaint);

export default router;