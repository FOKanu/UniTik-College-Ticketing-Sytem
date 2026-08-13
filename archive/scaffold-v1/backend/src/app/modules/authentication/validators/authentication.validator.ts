import { validateBody } from '../../../shared/validators/base.validator';
import { loginSchema, registerSchema } from '../schemas/authentication.schema';

export const validateLogin = validateBody(loginSchema);
export const validateRegister = validateBody(registerSchema);
