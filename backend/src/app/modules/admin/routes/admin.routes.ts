import { Router } from 'express';
import { adminController } from '../controller/admin.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateCreateAdmin, validateUpdateAdmin } from '../validators/admin.validator';

// Requirement(s) covered: NFR-2.6 (audit log)
// Admin-only management endpoints and audit log review.

export const adminRouter = Router();

adminRouter.get('/', requireAuth, asyncHandler(adminController.list));
adminRouter.get('/:id', requireAuth, asyncHandler(adminController.getById));
adminRouter.post('/', requireAuth, validateCreateAdmin, asyncHandler(adminController.create));
adminRouter.patch('/:id', requireAuth, validateUpdateAdmin, asyncHandler(adminController.update));
adminRouter.delete('/:id', requireAuth, asyncHandler(adminController.remove));
