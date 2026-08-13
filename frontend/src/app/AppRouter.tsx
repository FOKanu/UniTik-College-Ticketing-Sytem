import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { GuestRoute, ProtectedRoute } from '@/app/ProtectedRoute'
import { ADMIN_ROLES, AGENT_ROLES, ROUTES, STUDENT_ROLES } from '@/app/routes'
import { AppLayout } from '@/components/layout/AppLayout'
import { AuthLayout } from '@/components/layout/AuthLayout'
import { AdminDashboardPage } from '@/pages/admin/AdminDashboardPage'
import { DepartmentsPage } from '@/pages/admin/DepartmentsPage'
import { SettingsPage } from '@/pages/admin/SettingsPage'
import { AgentCreateTicketPage } from '@/pages/agent/AgentCreateTicketPage'
import { AgentDashboardPage } from '@/pages/agent/AgentDashboardPage'
import { AgentTicketDetailPage } from '@/pages/agent/AgentTicketDetailPage'
import { AnalyticsPage } from '@/pages/agent/AnalyticsPage'
import { KnowledgePage } from '@/pages/agent/KnowledgePage'
import { QueuePage } from '@/pages/agent/QueuePage'
import { AssistantPage } from '@/pages/assistant/AssistantPage'
import { InstitutionPage } from '@/pages/auth/InstitutionPage'
import { LoginPage } from '@/pages/auth/LoginPage'
import { RegisterPage } from '@/pages/auth/RegisterPage'
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
import { FaqPage } from '@/pages/faq/FaqPage'
import { ForbiddenPage } from '@/pages/ForbiddenPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { NotificationsPage } from '@/pages/notifications/NotificationsPage'
import { ProfilePage } from '@/pages/profile/ProfilePage'
import { TicketCreatePage } from '@/pages/tickets/TicketCreatePage'
import { TicketDetailPage } from '@/pages/tickets/TicketDetailPage'
import { TicketListPage } from '@/pages/tickets/TicketListPage'

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<GuestRoute />}>
          <Route
            path={ROUTES.home}
            element={<Navigate to={ROUTES.institution} replace />}
          />
          <Route path={ROUTES.institution} element={<InstitutionPage />} />
          <Route element={<AuthLayout />}>
            <Route path={ROUTES.login} element={<LoginPage />} />
            <Route path={ROUTES.register} element={<RegisterPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={STUDENT_ROLES} />}>
          <Route element={<AppLayout />}>
            <Route
              path="/app"
              element={<Navigate to={ROUTES.dashboard} replace />}
            />
            <Route path={ROUTES.dashboard} element={<DashboardPage />} />
            <Route path={ROUTES.tickets} element={<TicketListPage />} />
            <Route path={ROUTES.ticketNew} element={<TicketCreatePage />} />
            <Route path={ROUTES.ticketDetail} element={<TicketDetailPage />} />
            <Route path={ROUTES.assistant} element={<AssistantPage />} />
            <Route path={ROUTES.faq} element={<FaqPage />} />
            <Route
              path={ROUTES.notifications}
              element={<NotificationsPage />}
            />
            <Route path={ROUTES.profile} element={<ProfilePage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.forbidden} element={<ForbiddenPage />} />
          </Route>
        </Route>

        {/* Keep links from the pre-v2 shell from falling through to the bare
            404 page while users update bookmarks and open browser tabs. */}
        <Route
          path="/staff/*"
          element={<Navigate to={ROUTES.agent} replace />}
        />
        <Route
          path="/app/*"
          element={<Navigate to={ROUTES.dashboard} replace />}
        />

        <Route element={<ProtectedRoute allowedRoles={AGENT_ROLES} />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.agent} element={<AgentDashboardPage />} />
            <Route path={ROUTES.queue} element={<QueuePage />} />
            <Route
              path={ROUTES.agentTicketNew}
              element={<AgentCreateTicketPage />}
            />
            <Route
              path={ROUTES.agentTicketDetail}
              element={<AgentTicketDetailPage />}
            />
            <Route path={ROUTES.knowledge} element={<KnowledgePage />} />
            <Route path={ROUTES.analytics} element={<AnalyticsPage />} />
          </Route>
        </Route>

        <Route element={<ProtectedRoute allowedRoles={ADMIN_ROLES} />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.admin} element={<AdminDashboardPage />} />
            <Route path={ROUTES.departments} element={<DepartmentsPage />} />
            <Route path={ROUTES.settings} element={<SettingsPage />} />
            <Route
              path={ROUTES.settingsDepartments}
              element={<SettingsPage />}
            />
            <Route path={ROUTES.settingsPeople} element={<SettingsPage />} />
            <Route
              path={ROUTES.settingsKnowledge}
              element={<SettingsPage />}
            />
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
