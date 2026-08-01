import { Router } from 'express';
import { authenticationController } from '../controller/authentication.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateLogin, validateRegister } from '../validators/authentication.validator';

// Requirement(s) covered: NFR-2.5, Req-3.3, NFR-1.4

export const authenticationRouter = Router();

authenticationRouter.post('/register', validateRegister, asyncHandler(authenticationController.register));
authenticationRouter.post('/login', validateLogin, asyncHandler(authenticationController.login));
authenticationRouter.get('/me', requireAuth, asyncHandler(authenticationController.me));
