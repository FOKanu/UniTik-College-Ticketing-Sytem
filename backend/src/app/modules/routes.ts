// Single place where every module's router is mounted. Modules never register routes elsewhere.
// TODO: as modules gain real auth/role requirements, review the mount-level middleware here too.

import { Router } from 'express';
import { authenticationRouter } from './authentication/routes/authentication.routes';
import { usersRouter } from './users/routes/users.routes';
import { ticketsRouter } from './tickets/routes/tickets.routes';
import { chatbotRouter } from './chatbot/routes/chatbot.routes';
import { aiRouter } from './ai/routes/ai.routes';
import { knowledgeBaseRouter } from './knowledge-base/routes/knowledge-base.routes';
import { notificationsRouter } from './notifications/routes/notifications.routes';
import { dashboardRouter } from './dashboard/routes/dashboard.routes';
import { adminRouter } from './admin/routes/admin.routes';
import { analyticsRouter } from './analytics/routes/analytics.routes';

export const moduleRoutes = Router();

moduleRoutes.use('/auth', authenticationRouter);
moduleRoutes.use('/users', usersRouter);
moduleRoutes.use('/tickets', ticketsRouter);
moduleRoutes.use('/chatbot', chatbotRouter);
moduleRoutes.use('/ai', aiRouter);
moduleRoutes.use('/knowledge-base', knowledgeBaseRouter);
moduleRoutes.use('/notifications', notificationsRouter);
moduleRoutes.use('/dashboard', dashboardRouter);
moduleRoutes.use('/admin', adminRouter);
moduleRoutes.use('/analytics', analyticsRouter);
