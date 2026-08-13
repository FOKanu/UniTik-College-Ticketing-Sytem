import { validateBody } from '../../../shared/validators/base.validator';
import { createAdminSchema, updateAdminSchema } from '../schemas/admin.schema';

export const validateCreateAdmin = validateBody(createAdminSchema);
export const validateUpdateAdmin = validateBody(updateAdminSchema);
