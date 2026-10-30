import { Router } from 'express';
import authenticate from '../../middlewares/authenticate.js';
import notificationController from './notification.controller.js';

const router = Router();

router.use(authenticate);

router.get('/', notificationController.listNotifications);
router.get('/unread-count', notificationController.getUnreadCount);
router.patch('/read-all', notificationController.markAllAsRead);
router.patch('/:id/read', notificationController.markAsRead);

export default router;

