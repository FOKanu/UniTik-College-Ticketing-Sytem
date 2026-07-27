import { Router } from 'express';
import { analyticsController } from '../controller/analytics.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateCreateAnalytics, validateUpdateAnalytics } from '../validators/analytics.validator';

// Requirement(s) covered: beyond NFR-1.6 (v3 reporting)
// Reporting/metrics beyond the live dashboard (trends, SLA stats).

export const analyticsRouter = Router();

analyticsRouter.get('/', requireAuth, asyncHandler(analyticsController.list));
analyticsRouter.get('/:id', requireAuth, asyncHandler(analyticsController.getById));
analyticsRouter.post('/', requireAuth, validateCreateAnalytics, asyncHandler(analyticsController.create));
analyticsRouter.patch('/:id', requireAuth, validateUpdateAnalytics, asyncHandler(analyticsController.update));
analyticsRouter.delete('/:id', requireAuth, asyncHandler(analyticsController.remove));
