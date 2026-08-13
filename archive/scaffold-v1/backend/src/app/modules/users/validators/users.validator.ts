import { validateBody } from '../../../shared/validators/base.validator';
import { createUsersSchema, updateUsersSchema } from '../schemas/users.schema';

export const validateCreateUsers = validateBody(createUsersSchema);
export const validateUpdateUsers = validateBody(updateUsersSchema);
