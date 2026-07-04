// Optional direct endpoints for exercising the ai module in isolation during development.
// TODO: consider removing/gating these behind an internal-only flag once real logic lands.

import { Router } from 'express';
import { AiService } from '../service/ai.service';
import { asyncHandler } from '../../../utils/async-handler';
import { ApiResponse } from '../../../shared/response/api-response';

export const aiRouter = Router();
const service = new AiService();

aiRouter.post(
  '/classify',
  asyncHandler(async (req, res) => {
    const result = await service.classifyTicket(req.body?.text ?? '');
    ApiResponse.success(res, result);
  }),
);
