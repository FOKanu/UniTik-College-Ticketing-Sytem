import { validateBody } from '../../../shared/validators/base.validator';
import { createDashboardSchema, updateDashboardSchema } from '../schemas/dashboard.schema';

export const validateCreateDashboard = validateBody(createDashboardSchema);
export const validateUpdateDashboard = validateBody(updateDashboardSchema);
