import { Request, Response } from 'express';
import { ConversationService } from '../service/conversation.service';
import { ApiResponse } from '../../../shared/response/api-response';

const service = new ConversationService();

export const conversationController = {
  async sendMessage(req: Request, res: Response): Promise<void> {
    const result = await service.handleMessage(req.body);
    ApiResponse.success(res, result);
  },
};
