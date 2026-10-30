import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import notificationsApi from '../api/notifications.api';
import { getStorage, setStorage } from '../utils/storage';
import { STORAGE_KEYS } from '../utils/constants';
import { useAuth } from './AuthContext';

const NotificationContext = createContext();

const mapBackendNotification = (n) => ({
  id: n.id,
  userId: n.recipientId || n.recipient_id || n.userId,
  complaintId: n.complaintId || n.complaint_id,
  title: n.title,
  message: n.message,
  type: n.notificationType || n.notification_type || n.type || 'info',
  read: n.isRead !== undefined ? n.isRead : (n.is_read !== undefined ? n.is_read : !!n.read),
  timestamp: n.createdAt || n.created_at || n.timestamp || new Date().toISOString(),
});

export const NotificationProvider = ({ children }) => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState(() => {
    return getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      setLoading(true);
      const data = await notificationsApi.getNotifications();
      const mapped = (data || []).map(mapBackendNotification);
      setNotifications(mapped);
      setStorage(STORAGE_KEYS.NOTIFICATIONS, mapped);

      const count = await notificationsApi.getUnreadCount();
      setUnreadCount(typeof count === 'number' ? count : mapped.filter(n => !n.read).length);
    } catch {
      // Fallback to existing notifications state
      const count = notifications.filter(n => !n.read).length;
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [currentUser, notifications]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

  const addNotification = ({ userId, role, title, message, complaintId, type = 'info' }) => {
    const newNotif = {
      id: `NOTIF-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      userId,
      role,
      title,
      message,
      complaintId,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    setNotifications(prev => [newNotif, ...prev]);
    setUnreadCount(prev => prev + 1);
    return newNotif;
  };

  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.warn('Backend markAsRead warning:', err.message);
    }
    setNotifications(prev =>
      prev.map(n => (n.id === id ? { ...n, read: true } : n))
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.warn('Backend markAllAsRead warning:', err.message);
    }
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const getUserNotifications = (userId) => {
    return notifications.filter(n => !userId || n.userId === userId);
  };

  const getUnreadCount = (userId) => {
    if (!userId) return unreadCount;
    return notifications.filter(n => n.userId === userId && !n.read).length;
  };

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        getUserNotifications,
        getUnreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
