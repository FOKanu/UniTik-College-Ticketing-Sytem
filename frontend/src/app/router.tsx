import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from '../components/Layout';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { RegisterPage } from '../modules/auth/pages/RegisterPage';
import { ChatPage } from '../modules/chat/pages/ChatPage';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { StaffDashboardPage } from '../modules/dashboard/pages/StaffDashboardPage';
import { FaqPage } from '../modules/faq/pages/FaqPage';
import { NotificationsPage } from '../modules/notifications/pages/NotificationsPage';
import { CreateTicketPage } from '../modules/tickets/pages/CreateTicketPage';
import { TicketDetailPage } from '../modules/tickets/pages/TicketDetailPage';
import { TicketsPage } from '../modules/tickets/pages/TicketsPage';
import { HomePage } from '../pages/HomePage';
import { AuthProvider, useAuth } from '../store/auth.store';

/**
 * `/` is a pure router: signed-out visitors go to Sign In, students to their
 * dashboard, staff/admin to the agent dashboard. The old health-check
 * landing page lives on at /status for developers (it's also still the
 * quickest way to see whether the backend and database are up).
 */
function RootRedirect() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'STUDENT' ? '/dashboard' : '/staff'} replace />;
}

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<RootRedirect />} />
            <Route path="status" element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="staff" element={<StaffDashboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/new" element={<CreateTicketPage />} />
            <Route path="tickets/:id" element={<TicketDetailPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
