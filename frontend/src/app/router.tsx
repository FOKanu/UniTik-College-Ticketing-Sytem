import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

import { Layout } from '../components/Layout';
import { LoginPage } from '../modules/auth/pages/LoginPage';
import { RegisterPage } from '../modules/auth/pages/RegisterPage';
import { ChatPage } from '../modules/chat/pages/ChatPage';
import { DashboardPage } from '../modules/dashboard/pages/DashboardPage';
import { FaqPage } from '../modules/faq/pages/FaqPage';
import { TicketDetailPage } from '../modules/tickets/pages/TicketDetailPage';
import { TicketsPage } from '../modules/tickets/pages/TicketsPage';
import { HomePage } from '../pages/HomePage';
import { AuthProvider } from '../store/auth.store';

export function AppRouter() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<HomePage />} />
            <Route path="login" element={<LoginPage />} />
            <Route path="register" element={<RegisterPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="tickets" element={<TicketsPage />} />
            <Route path="tickets/:id" element={<TicketDetailPage />} />
            <Route path="chat" element={<ChatPage />} />
            <Route path="faq" element={<FaqPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
