import notificationService from './notification.service.js';
import ApiResponse from '../../utils/ApiResponse.js';
import asyncHandler from '../../utils/asyncHandler.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const result = await notificationService.getUserNotifications(req.user.id, req.query);
  return ApiResponse.success(res, 200, result, 'Notifications retrieved successfully');
});

export const getUnreadCount = asyncHandler(async (req, res) => {
  const result = await notificationService.getUnreadCount(req.user.id);
  return ApiResponse.success(res, 200, result, 'Unread notification count retrieved');
});

export const markAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markNotificationAsRead(req.params.id, req.user.id);
  return ApiResponse.success(res, 200, result, 'Notification marked as read');
});

export const markAllAsRead = asyncHandler(async (req, res) => {
  const result = await notificationService.markAllNotificationsAsRead(req.user.id);
  return ApiResponse.success(res, 200, result, 'All notifications marked as read');
});

export default {
  listNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};

