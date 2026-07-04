import { validateBody } from '../../../shared/validators/base.validator';
import { createNotificationsSchema, updateNotificationsSchema } from '../schemas/notifications.schema';

export const validateCreateNotifications = validateBody(createNotificationsSchema);
export const validateUpdateNotifications = validateBody(updateNotificationsSchema);
