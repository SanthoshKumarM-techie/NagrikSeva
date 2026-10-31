import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  LogOut,
  ChevronDown,
  Check,
  ExternalLink,
  Shield,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';
import { ThemeToggle } from './ThemeToggle';
import { LanguageSelector } from './LanguageSelector';
import { DEMO_CREDENTIALS, ROLES } from '../../utils/constants';
import { timeAgo } from '../../utils/statusHelpers';

export const Header = ({ onMobileMenuClick }) => {
  const { currentUser, role, logout, switchRole } = useAuth();
  const { notifications, getUnreadCount, markAsRead, markAllAsRead } = useNotifications();
  const navigate = useNavigate();
  const location = useLocation();

  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifMenuOpen, setNotifMenuOpen] = useState(false);

  const userMenuRef = useRef(null);
  const notifMenuRef = useRef(null);

  const unreadCount = getUnreadCount(currentUser?.id, role);
  const userNotifs = notifications
    .filter(n => {
      if (!currentUser?.id && !role) return true;
      if (n.userId && (n.userId === currentUser?.id || n.userId === currentUser?.userCode)) return true;
      if (n.role && (n.role === role || n.role?.toLowerCase() === role?.toLowerCase())) return true;
      return !n.userId && !n.role;
    })
    .slice(0, 10);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (notifMenuRef.current && !notifMenuRef.current.contains(e.target)) {
        setNotifMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getBreadcrumbs = () => {
    const pathParts = location.pathname.split('/').filter(Boolean);
    if (pathParts.length === 0) return 'Dashboard';
    const roleMap = {
      citizen: 'Citizen Portal',
      officer: 'Officer Desk',
      worker: 'Contractor & Crew Operations',
      admin: 'Administration',
    };
    const roleTitle = roleMap[pathParts[0]] || pathParts[0];
    const subPage = pathParts[1] ? pathParts[1].replace(/-/g, ' ') : 'Overview';
    return `${roleTitle} / ${subPage.charAt(0).toUpperCase() + subPage.slice(1)}`;
  };

  const handleQuickSwitch = (targetId) => {
    const user = switchRole(targetId);
    setUserMenuOpen(false);
    if (user) {
      if (user.role === ROLES.CITIZEN) navigate('/citizen');
      else if (user.role === ROLES.OFFICER) navigate('/officer');
      else if (user.role === ROLES.WORKER) navigate('/worker');
      else if (user.role === ROLES.ADMIN) navigate('/admin');
    }
  };

  const handleNotificationClick = (notif) => {
    markAsRead(notif.id);
    setNotifMenuOpen(false);
    if (notif.complaintId) {
      if (role === ROLES.CITIZEN) navigate(`/citizen/complaints/${notif.complaintId}`);
      else if (role === ROLES.OFFICER) navigate(`/officer/complaints/${notif.complaintId}`);
      else if (role === ROLES.WORKER) navigate(`/worker/tasks/${notif.complaintId}`);
      else if (role === ROLES.ADMIN) navigate(`/admin/complaints`);
    }
  };

  return (
    <header className="sticky top-0 z-30 h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between transition-colors">
      {/* Left: Mobile hamburger & breadcrumbs */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMobileMenuClick}
          className="p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 md:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400 capitalize">
            {getBreadcrumbs()}
          </span>
        </div>
      </div>

      {/* Right controls: Language, Theme, Notifications, Profile dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        <LanguageSelector />
        <ThemeToggle />

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifMenuRef}>
          <button
            type="button"
            onClick={() => setNotifMenuOpen(!notifMenuOpen)}
            className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {notifMenuOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-900 dark:text-slate-100">
                    Notifications
                  </span>
                  {unreadCount > 0 && (
                    <span className="text-[10px] bg-blue-100 dark:bg-blue-900/60 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={() => markAllAsRead(currentUser?.id)}
                    className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800">
                {userNotifs.length > 0 ? (
                  userNotifs.map((n) => (
                    <div
                      key={n.id}
                      onClick={() => handleNotificationClick(n)}
                      className={`p-3 text-xs cursor-pointer transition-colors ${
                        !n.read
                          ? 'bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                          : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <span className={`font-semibold ${!n.read ? 'text-blue-900 dark:text-blue-300' : 'text-slate-800 dark:text-slate-200'}`}>
                          {n.title}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {timeAgo(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2">
                        {n.message}
                      </p>
                      {n.complaintId && (
                        <span className="inline-block mt-1 font-mono text-[10px] text-blue-600 dark:text-blue-400">
                          {n.complaintId}
                        </span>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No recent notifications
                  </div>
                )}
              </div>

              <div className="p-2 border-t border-slate-100 dark:border-slate-800 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setNotifMenuOpen(false);
                    if (role === ROLES.CITIZEN) navigate('/citizen/notifications');
                    else if (role === ROLES.OFFICER) navigate('/officer/notifications');
                    else if (role === ROLES.WORKER) navigate('/worker/notifications');
                    else navigate('/admin');
                  }}
                  className="text-xs text-blue-600 dark:text-blue-400 font-medium hover:underline"
                >
                  View all notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            type="button"
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <img
              src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
              alt={currentUser?.name}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700"
            />
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-none">
                {currentUser?.name || 'User'}
              </span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400">
                {role}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-fade-in text-xs">
              <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  {currentUser?.name}
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {currentUser?.email}
                </p>
                <div className="mt-1.5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                  <Shield className="w-3 h-3" /> {role}
                </div>
              </div>

              {/* Navigation & Logout */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    if (role === ROLES.CITIZEN) navigate('/citizen/profile');
                    else if (role === ROLES.OFFICER) navigate('/officer/profile');
                    else if (role === ROLES.WORKER) navigate('/worker/profile');
                    else navigate('/admin/users');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>My Profile</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUserMenuOpen(false);
                    logout();
                    navigate('/');
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 hover:bg-rose-50 dark:hover:bg-rose-950/30 text-rose-600 dark:text-rose-400"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;

