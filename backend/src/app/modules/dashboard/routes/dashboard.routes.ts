import { Router } from 'express';
import { dashboardController } from '../controller/dashboard.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateCreateDashboard, validateUpdateDashboard } from '../validators/dashboard.validator';

// Requirement(s) covered: NFR-1.6 (live dashboards)
// Read-only aggregation of ticket counts per department, for the live admin dashboard.

export const dashboardRouter = Router();

dashboardRouter.get('/', requireAuth, asyncHandler(dashboardController.list));
dashboardRouter.get('/:id', requireAuth, asyncHandler(dashboardController.getById));
dashboardRouter.post('/', requireAuth, validateCreateDashboard, asyncHandler(dashboardController.create));
dashboardRouter.patch('/:id', requireAuth, validateUpdateDashboard, asyncHandler(dashboardController.update));
dashboardRouter.delete('/:id', requireAuth, asyncHandler(dashboardController.remove));
