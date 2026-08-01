import { Router } from 'express';
import { usersController } from '../controller/users.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateCreateUsers, validateUpdateUsers } from '../validators/users.validator';

// Requirement(s) covered: NFR-1.4 (role-based access)
// User profile CRUD and role assignment.

export const usersRouter = Router();

usersRouter.get('/', requireAuth, asyncHandler(usersController.list));
usersRouter.get('/:id', requireAuth, asyncHandler(usersController.getById));
usersRouter.post('/', requireAuth, validateCreateUsers, asyncHandler(usersController.create));
usersRouter.patch('/:id', requireAuth, validateUpdateUsers, asyncHandler(usersController.update));
usersRouter.delete('/:id', requireAuth, asyncHandler(usersController.remove));
