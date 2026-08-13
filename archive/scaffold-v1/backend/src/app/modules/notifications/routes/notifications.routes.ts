import { Router } from 'express';
import { notificationsController } from '../controller/notifications.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateCreateNotifications, validateUpdateNotifications } from '../validators/notifications.validator';

// Requirement(s) covered: NFR-1.2.2 (v2 priority)
// Ticket status-change notifications (email, in-app).

export const notificationsRouter = Router();

notificationsRouter.get('/', requireAuth, asyncHandler(notificationsController.list));
notificationsRouter.get('/:id', requireAuth, asyncHandler(notificationsController.getById));
notificationsRouter.post('/', requireAuth, validateCreateNotifications, asyncHandler(notificationsController.create));
notificationsRouter.patch('/:id', requireAuth, validateUpdateNotifications, asyncHandler(notificationsController.update));
notificationsRouter.delete('/:id', requireAuth, asyncHandler(notificationsController.remove));
