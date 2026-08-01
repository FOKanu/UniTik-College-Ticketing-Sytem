// HTTP layer only — parses request, calls the service, formats the response.
// No business logic belongs in this file.

import { Request, Response } from 'express';
import { AnalyticsService } from '../service/analytics.service';
import { ApiResponse } from '../../../shared/response/api-response';

const service = new AnalyticsService();

export const analyticsController = {
  async list(_req: Request, res: Response): Promise<void> {
    const items = await service.getAll();
    ApiResponse.success(res, items);
  },

  async getById(req: Request, res: Response): Promise<void> {
    const item = await service.getById(req.params.id);
    ApiResponse.success(res, item);
  },

  async create(req: Request, res: Response): Promise<void> {
    const created = await service.create(req.body);
    ApiResponse.success(res, created, 201);
  },

  async update(req: Request, res: Response): Promise<void> {
    const updated = await service.update(req.params.id, req.body);
    ApiResponse.success(res, updated);
  },

  async remove(req: Request, res: Response): Promise<void> {
    await service.remove(req.params.id);
    ApiResponse.success(res, null, 204);
  },
};
