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

      setNotifications(prev => {
        const localCached = getStorage(STORAGE_KEYS.NOTIFICATIONS, []) || prev || [];
        const combined = [...mapped];
        for (const local of localCached) {
          if (!combined.some(c => c.id === local.id || (c.title === local.title && c.complaintId === local.complaintId && c.userId === local.userId))) {
            combined.push(local);
          }
        }
        setStorage(STORAGE_KEYS.NOTIFICATIONS, combined);
        return combined;
      });

      const count = await notificationsApi.getUnreadCount();
      if (typeof count === 'number') {
        setUnreadCount(count);
      } else {
        const stored = getStorage(STORAGE_KEYS.NOTIFICATIONS, []);
        const unread = stored.filter(n => !n.read && (!currentUser.id || n.userId === currentUser.id || n.userId === currentUser.userCode || n.role === currentUser.role)).length;
        setUnreadCount(unread);
      }
    } catch {
      const stored = getStorage(STORAGE_KEYS.NOTIFICATIONS, notifications);
      const count = stored.filter(n => !n.read && (!currentUser?.id || n.userId === currentUser.id || n.userId === currentUser.userCode || n.role === currentUser.role)).length;
      setUnreadCount(count);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser, fetchNotifications]);

  const addNotification = (notifData) => {
    const list = Array.isArray(notifData) ? notifData : [notifData];
    const createdNotifs = list.map(item => ({
      id: item.id || `NOTIF-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      userId: item.userId || null,
      role: item.role || null,
      title: item.title,
      message: item.message,
      complaintId: item.complaintId || null,
      type: item.type || 'info',
      read: false,
      timestamp: item.timestamp || new Date().toISOString()
    }));

    setNotifications(prev => {
      const updated = [...createdNotifs, ...prev];
      setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return updated;
    });

    setUnreadCount(prev => prev + createdNotifs.length);
    return createdNotifs[0];
  };

  const markAsRead = async (id) => {
    try {
      await notificationsApi.markAsRead(id);
    } catch (err) {
      console.warn('Backend markAsRead warning:', err.message);
    }
    setNotifications(prev => {
      const updated = prev.map(n => (n.id === id ? { ...n, read: true } : n));
      setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return updated;
    });
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = async () => {
    try {
      await notificationsApi.markAllAsRead();
    } catch (err) {
      console.warn('Backend markAllAsRead warning:', err.message);
    }
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, read: true }));
      setStorage(STORAGE_KEYS.NOTIFICATIONS, updated);
      return updated;
    });
    setUnreadCount(0);
  };

  const getUserNotifications = (userId, role = null) => {
    return notifications.filter(n => {
      if (!userId && !role) return true;
      if (userId && (n.userId === userId || (currentUser?.userCode && n.userId === currentUser.userCode))) return true;
      if (role && (n.role === role || n.role?.toLowerCase() === role?.toLowerCase())) return true;
      return !n.userId && !n.role;
    });
  };

  const getUnreadCount = (userId, role = null) => {
    const userList = getUserNotifications(userId, role);
    return userList.filter(n => !n.read).length;
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
