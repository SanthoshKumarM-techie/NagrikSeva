import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { ComplaintProvider } from './context/ComplaintContext';
import { ROLES } from './utils/constants';

// Layout
import AppLayout from './components/layout/AppLayout';

// Auth Page
import Login from './pages/auth/Login';
import { PortalSelection } from './pages/auth/PortalSelection';

// Citizen Pages
import CitizenDashboard from './pages/citizen/CitizenDashboard';
import ExploreComplaints from './pages/citizen/ExploreComplaints';
import CreateComplaint from './pages/citizen/CreateComplaint';
import MyComplaints from './pages/citizen/MyComplaints';
import ComplaintDetails from './pages/citizen/ComplaintDetails';
import Notifications from './pages/citizen/Notifications';
import CitizenProfile from './pages/citizen/CitizenProfile';

// Officer Pages
import OfficerDashboard from './pages/officer/OfficerDashboard';
import DepartmentComplaints from './pages/officer/DepartmentComplaints';
import ComplaintReview from './pages/officer/ComplaintReview';
import DepartmentTransfers from './pages/officer/DepartmentTransfers';
import WorkerAssignments from './pages/officer/WorkerAssignments';
import OfficerAnalytics from './pages/officer/OfficerAnalytics';

// Worker Pages
import WorkerDashboard from './pages/worker/WorkerDashboard';
import AssignedTasks from './pages/worker/AssignedTasks';
import TaskDetails from './pages/worker/TaskDetails';
import WorkerHistory from './pages/worker/WorkerHistory';

// Admin Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AllComplaints from './pages/admin/AllComplaints';
import Departments from './pages/admin/Departments';
import UsersManagement from './pages/admin/UsersManagement';
import SLAConfiguration from './pages/admin/SLAConfiguration';
import Escalations from './pages/admin/Escalations';
import TransferMonitoring from './pages/admin/TransferMonitoring';
import SystemAnalytics from './pages/admin/SystemAnalytics';

// Role-based Route Guard Component
const ProtectedRoute = ({ allowedRoles = [], children }) => {
  const { isAuthenticated, role, loading, getDashboardPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium tracking-wide">Validating session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return children;
};

// Root Redirect Component
const RootRedirect = () => {
  const { isAuthenticated, role, loading, getDashboardPath } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs text-slate-500 font-medium tracking-wide">Connecting to NagrikSeva...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return <PortalSelection />;
};

export const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
          <ComplaintProvider>
            <BrowserRouter>
              <Routes>
                {/* Public Route */}
                <Route path="/login" element={<Login />} />

                {/* Root Route */}
                <Route path="/" element={<RootRedirect />} />

                {/* Citizen Routes */}
                <Route
                  path="/citizen"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.CITIZEN]}>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<CitizenDashboard />} />
                  <Route path="explore" element={<ExploreComplaints />} />
                  <Route path="create" element={<CreateComplaint />} />
                  <Route path="my-complaints" element={<MyComplaints />} />
                  <Route path="complaints/:id" element={<ComplaintDetails />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<CitizenProfile />} />
                </Route>

                {/* Department Officer Routes */}
                <Route
                  path="/officer"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.OFFICER]}>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<OfficerDashboard />} />
                  <Route path="complaints" element={<DepartmentComplaints />} />
                  <Route path="complaints/:id" element={<ComplaintReview />} />
                  <Route path="transfers" element={<DepartmentTransfers />} />
                  <Route path="assignments" element={<WorkerAssignments />} />
                  <Route path="analytics" element={<OfficerAnalytics />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<CitizenProfile />} />
                </Route>

                {/* Field Worker Routes */}
                <Route
                  path="/worker"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.WORKER]}>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<WorkerDashboard />} />
                  <Route path="tasks" element={<AssignedTasks />} />
                  <Route path="tasks/:id" element={<TaskDetails />} />
                  <Route path="history" element={<WorkerHistory />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="profile" element={<CitizenProfile />} />
                </Route>

                {/* Super Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
                      <AppLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="complaints" element={<AllComplaints />} />
                  <Route path="departments" element={<Departments />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="sla" element={<SLAConfiguration />} />
                  <Route path="escalations" element={<Escalations />} />
                  <Route path="transfers" element={<TransferMonitoring />} />
                  <Route path="analytics" element={<SystemAnalytics />} />
                </Route>

                {/* Fallback */}
                <Route path="*" element={<RootRedirect />} />
              </Routes>
            </BrowserRouter>
          </ComplaintProvider>
        </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
