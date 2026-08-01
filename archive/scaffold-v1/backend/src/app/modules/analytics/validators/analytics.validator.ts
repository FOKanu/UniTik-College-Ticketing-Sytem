import { validateBody } from '../../../shared/validators/base.validator';
import { createAnalyticsSchema, updateAnalyticsSchema } from '../schemas/analytics.schema';

export const validateCreateAnalytics = validateBody(createAnalyticsSchema);
export const validateUpdateAnalytics = validateBody(updateAnalyticsSchema);
