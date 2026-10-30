import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES, DEMO_CREDENTIALS, STORAGE_KEYS } from '../utils/constants';
import { getStorage, setStorage, removeStorage } from '../utils/storage';
import authApi from '../api/auth.api';

const AuthContext = createContext();

export const mapBackendUser = (user) => {
  if (!user) return null;
  let displayRole = ROLES.CITIZEN;
  const rawRole = (user.role || '').toUpperCase();

  if (rawRole === 'DEPARTMENT_OFFICER' || user.role === ROLES.OFFICER) {
    displayRole = ROLES.OFFICER;
  } else if (rawRole === 'FIELD_WORKER' || user.role === ROLES.WORKER) {
    displayRole = ROLES.WORKER;
  } else if (rawRole === 'SUPER_ADMIN' || user.role === ROLES.ADMIN) {
    displayRole = ROLES.ADMIN;
  }

  return {
    ...user,
    id: user.id,
    userCode: user.userCode || user.user_code,
    name: user.fullName || user.full_name || user.name || 'User',
    email: user.email,
    phone: user.phoneNumber || user.phone || '+91 98765 43210',
    role: displayRole,
    rawRole: user.role,
    departmentId: user.departmentId || user.department_id,
    department: user.departmentName || user.department_name || user.department,
    avatar: user.avatarUrl || user.avatar || (
      displayRole === ROLES.CITIZEN
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'
        : displayRole === ROLES.OFFICER
        ? 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80'
        : displayRole === ROLES.WORKER
        ? 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80'
    ),
    workerProfileId: user.workerProfileId,
    specialization: user.specialization,
  };
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    return getStorage(STORAGE_KEYS.AUTH_USER, null);
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sync session with backend on initial load / refresh
  const restoreSession = useCallback(async () => {
    try {
      setLoading(true);
      const sessionData = await authApi.getSession();
      if (sessionData?.authenticated && sessionData?.user) {
        const mapped = mapBackendUser(sessionData.user);
        setCurrentUser(mapped);
        setStorage(STORAGE_KEYS.AUTH_USER, mapped);
      } else {
        setCurrentUser(null);
        removeStorage(STORAGE_KEYS.AUTH_USER);
      }
    } catch {
      // Offline / server not reachable fallback to local storage
      const cached = getStorage(STORAGE_KEYS.AUTH_USER, null);
      if (cached) setCurrentUser(cached);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    restoreSession();

    // Listen for unauthorized events from axios
    const handleUnauthorized = () => {
      setCurrentUser(null);
      removeStorage(STORAGE_KEYS.AUTH_USER);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, [restoreSession]);

  const login = async (userId, password) => {
    setLoading(true);
    setError(null);

    try {
      // Find matching demo credential password if user code is passed
      const cred = DEMO_CREDENTIALS.find(
        (c) => c.id.toLowerCase() === (userId || '').trim().toLowerCase()
      );
      const effectivePassword = password || cred?.pass || 'citizen123';

      const payload = {
        email: userId.includes('@') ? userId.trim() : undefined,
        userId: !userId.includes('@') ? userId.trim() : undefined,
        password: effectivePassword,
      };

      const backendUser = await authApi.login(payload);
      const userObj = mapBackendUser(backendUser);

      setCurrentUser(userObj);
      setStorage(STORAGE_KEYS.AUTH_USER, userObj);
      setLoading(false);
      return { success: true, user: userObj };
    } catch (err) {
      setLoading(false);
      const errMsg = err?.message || 'Invalid User ID or Password.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const backendUser = await authApi.register(userData);
      const userObj = mapBackendUser(backendUser);

      setCurrentUser(userObj);
      setStorage(STORAGE_KEYS.AUTH_USER, userObj);
      setLoading(false);
      return { success: true, user: userObj };
    } catch (err) {
      setLoading(false);
      const errMsg = err?.message || 'Registration failed. Please check your details.';
      setError(errMsg);
      return { success: false, error: errMsg };
    }
  };

  const switchRole = async (targetRoleId) => {
    const cred = DEMO_CREDENTIALS.find((c) => c.id === targetRoleId || c.role === targetRoleId);
    if (cred) {
      const res = await login(cred.id, cred.pass);
      if (res.success) return res.user;
    }
    return null;
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } catch (err) {
      console.warn('Backend logout warning:', err.message);
    } finally {
      setCurrentUser(null);
      removeStorage(STORAGE_KEYS.AUTH_USER);
    }
  };

  const updateUserProfile = (updatedData) => {
    setCurrentUser((prev) => {
      const updated = prev ? { ...prev, ...updatedData } : null;
      if (updated) setStorage(STORAGE_KEYS.AUTH_USER, updated);
      return updated;
    });
  };

  const getDashboardPath = (role = currentUser?.role) => {
    switch (role) {
      case ROLES.CITIZEN:
        return '/citizen';
      case ROLES.OFFICER:
        return '/officer';
      case ROLES.WORKER:
        return '/worker';
      case ROLES.ADMIN:
        return '/admin';
      default:
        return '/login';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        role: currentUser?.role || null,
        isAuthenticated: !!currentUser,
        loading,
        error,
        login,
        register,
        switchRole,
        logout,
        restoreSession,
        updateUserProfile,
        getDashboardPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
