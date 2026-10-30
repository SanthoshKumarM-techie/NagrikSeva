import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Compass,
  PlusCircle,
  FileText,
  Bell,
  User,
  Shield,
  ArrowRightLeft,
  Users,
  BarChart3,
  CheckSquare,
  History,
  Building2,
  Clock,
  AlertOctagon,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';
import { ROLES, DEMO_CREDENTIALS } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

export const Sidebar = ({ isCollapsed, setIsCollapsed, mobileOpen, setMobileOpen }) => {
  const { currentUser, role, logout, switchRole } = useAuth();
  const { getUnreadCount } = useNotifications();
  const navigate = useNavigate();

  const unreadCount = getUnreadCount(currentUser?.id);

  const getNavLinks = () => {
    switch (role) {
      case ROLES.CITIZEN:
        return [
          { name: 'Overview', to: '/citizen', icon: LayoutDashboard, end: true },
          { name: 'Explore Complaints', to: '/citizen/explore', icon: Compass },
          { name: 'Register Complaint', to: '/citizen/create', icon: PlusCircle },
          { name: 'My Complaints', to: '/citizen/my-complaints', icon: FileText },
          { name: 'Notifications', to: '/citizen/notifications', icon: Bell, badge: unreadCount },
          { name: 'My Profile', to: '/citizen/profile', icon: User },
        ];
      case ROLES.OFFICER:
        return [
          { name: 'Overview', to: '/officer', icon: LayoutDashboard, end: true },
          { name: 'Department Complaints', to: '/officer/complaints', icon: FileText },
          { name: 'Complaint Transfers', to: '/officer/transfers', icon: ArrowRightLeft },
          { name: 'Worker Assignments', to: '/officer/assignments', icon: Users },
          { name: 'Analytics', to: '/officer/analytics', icon: BarChart3 },
          { name: 'Notifications', to: '/officer/notifications', icon: Bell, badge: unreadCount },
          { name: 'Profile', to: '/officer/profile', icon: User },
        ];
      case ROLES.WORKER:
        return [
          { name: 'Overview', to: '/worker', icon: LayoutDashboard, end: true },
          { name: 'Assigned Tasks', to: '/worker/tasks', icon: CheckSquare },
          { name: 'Task History', to: '/worker/history', icon: History },
          { name: 'Notifications', to: '/worker/notifications', icon: Bell, badge: unreadCount },
          { name: 'Profile', to: '/worker/profile', icon: User },
        ];
      case ROLES.ADMIN:
        return [
          { name: 'Overview', to: '/admin', icon: LayoutDashboard, end: true },
          { name: 'All Complaints', to: '/admin/complaints', icon: FileText },
          { name: 'Departments', to: '/admin/departments', icon: Building2 },
          { name: 'Users', to: '/admin/users', icon: Users },
          { name: 'SLA Configuration', to: '/admin/sla', icon: Clock },
          { name: 'Escalations', to: '/admin/escalations', icon: AlertOctagon },
          { name: 'Transfer Monitoring', to: '/admin/transfers', icon: ArrowRightLeft },
          { name: 'System Analytics', to: '/admin/analytics', icon: BarChart3 },
        ];
      default:
        return [];
    }
  };

  const navLinks = getNavLinks();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleQuickSwitch = (targetId) => {
    const user = switchRole(targetId);
    if (user) {
      if (user.role === ROLES.CITIZEN) navigate('/citizen');
      else if (user.role === ROLES.OFFICER) navigate('/officer');
      else if (user.role === ROLES.WORKER) navigate('/worker');
      else if (user.role === ROLES.ADMIN) navigate('/admin');
    }
    if (mobileOpen) setMobileOpen(false);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300">
      {/* Brand Header */}
      <div className="flex items-center justify-between h-16 px-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0 shadow-sm shadow-blue-500/30">
            <ShieldCheck className="w-5 h-5" />
          </div>
          {(!isCollapsed || mobileOpen) && (
            <div className="flex flex-col">
              <span className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-tight tracking-tight">
                NagrikSeva
              </span>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-medium tracking-normal">
                Citizen Grievance Platform
              </span>
            </div>
          )}
        </div>

        {mobileOpen ? (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        ) : (
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden md:flex p-1 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        )}
      </div>

      {/* Role Indicator Banner */}
      {(!isCollapsed || mobileOpen) && (
        <div className="mx-3 mt-3 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between">
          <div className="flex items-center gap-2 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">
              {role}
            </span>
          </div>
          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white dark:bg-slate-700 text-slate-500 dark:text-slate-300 border border-slate-200 dark:border-slate-600">
            {currentUser?.id}
          </span>
        </div>
      )}

      {/* Navigation Links */}
      <div className="flex-1 py-4 px-2 space-y-1 overflow-y-auto">
        {navLinks.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => mobileOpen && setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100/80 dark:hover:bg-slate-800/60'
                } ${isCollapsed && !mobileOpen ? 'justify-center px-2' : ''}`
              }
              title={isCollapsed && !mobileOpen ? item.name : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {(!isCollapsed || mobileOpen) && (
                <span className="flex-1 truncate">{item.name}</span>
              )}
              {(!isCollapsed || mobileOpen) && item.badge > 0 && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* User Footer Profile & Logout */}
      <div className="p-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <img
            src={currentUser?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120'}
            alt={currentUser?.name}
            className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 dark:ring-slate-700 shrink-0"
          />
          {(!isCollapsed || mobileOpen) && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                {currentUser?.name || 'Authorized User'}
              </p>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                {currentUser?.department || currentUser?.email}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={logout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:block shrink-0 transition-all duration-300 z-20 ${
          isCollapsed ? 'w-16' : 'w-64'
        }`}
      >
        <div className="fixed top-0 bottom-0 left-0 h-screen z-20 transition-all duration-300" style={{ width: isCollapsed ? '4rem' : '16rem' }}>
          {sidebarContent}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-72 bg-white dark:bg-slate-900 shadow-xl z-50">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;

