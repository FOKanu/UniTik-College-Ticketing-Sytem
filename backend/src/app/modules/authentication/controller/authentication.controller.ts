import { Request, Response } from 'express';
import { AuthenticationService } from '../service/authentication.service';
import { ApiResponse } from '../../../shared/response/api-response';

const service = new AuthenticationService();

export const authenticationController = {
  async login(req: Request, res: Response): Promise<void> {
    const result = await service.login(req.body);
    ApiResponse.success(res, result);
  },

  async register(req: Request, res: Response): Promise<void> {
    const result = await service.register(req.body);
    ApiResponse.success(res, result, 201);
  },

  async me(req: Request, res: Response): Promise<void> {
    const result = await service.me(req.user?.id ?? 'unknown');
    ApiResponse.success(res, result);
  },
};
