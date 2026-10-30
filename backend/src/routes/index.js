import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes.js';
import userRoutes from '../modules/users/user.routes.js';
import departmentRoutes from '../modules/departments/department.routes.js';
import wardRoutes from '../modules/wards/ward.routes.js';
import categoryRoutes from '../modules/categories/category.routes.js';
import evidenceRoutes from '../modules/evidence/evidence.routes.js';
import complaintRoutes from '../modules/complaints/complaint.routes.js';
import transferRoutes from '../modules/transfers/transfer.routes.js';
import assignmentRoutes from '../modules/assignments/assignment.routes.js';
import reviewRoutes from '../modules/reviews/review.routes.js';
import slaRoutes from '../modules/sla/sla.routes.js';
import escalationRoutes from '../modules/escalations/escalation.routes.js';
import notificationRoutes from '../modules/notifications/notification.routes.js';
import analyticsRoutes from '../modules/analytics/analytics.routes.js';

const router = Router();

// Health Check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'NagrikSeva API is healthy',
    data: {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development'
    }
  });
});

// Mount modules
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/departments', departmentRoutes);
router.use('/wards', wardRoutes);
router.use('/categories', categoryRoutes);
router.use('/evidence', evidenceRoutes);
router.use('/complaints', complaintRoutes);
router.use('/transfers', transferRoutes);
router.use('/assignments', assignmentRoutes);
router.use('/reviews', reviewRoutes);
router.use('/sla', slaRoutes);
router.use('/escalations', escalationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/analytics', analyticsRoutes);

export default router;

