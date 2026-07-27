// Central route table. Each module owns its own pages/ folder; this file only wires paths to them.
// TODO: add role-guarded routes once authentication module returns real roles.

import { Navigate, Route, Routes } from 'react-router-dom';
import { MainLayout } from '../layouts/MainLayout';
import { AuthLayout } from '../layouts/AuthLayout';
import { LoginPage } from '../modules/login/pages/LoginPage';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { TicketListPage } from '../modules/ticket/pages/TicketListPage';
import { ChatbotPage } from '../modules/chatbot/pages/ChatbotPage';
import { FaqPage } from '../modules/faq/pages/FaqPage';
import { AdminPage } from '../modules/admin/pages/AdminPage';
import { NotificationsPage } from '../modules/notifications/pages/NotificationsPage';
import { ProfilePage } from '../modules/profile/pages/ProfilePage';

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>

      <Route element={<MainLayout />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/tickets" element={<TicketListPage />} />
        <Route path="/chatbot" element={<ChatbotPage />} />
        <Route path="/faq" element={<FaqPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/notifications" element={<NotificationsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
