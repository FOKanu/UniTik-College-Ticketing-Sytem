import { Router } from 'express';
import { ticketsController } from '../controller/tickets.controller';
import { asyncHandler } from '../../../utils/async-handler';
import { requireAuth } from '../../../middleware/auth.middleware';
import { validateCreateTickets, validateUpdateTickets } from '../validators/tickets.validator';

// Requirement(s) covered: NFR-1.1.2, NFR-1.1.3, NFR-1.7, NFR-1.7.1
// Ticket lifecycle: creation, correction, status transitions, and problem clustering placeholders.

export const ticketsRouter = Router();

ticketsRouter.get('/', requireAuth, asyncHandler(ticketsController.list));
ticketsRouter.get('/:id', requireAuth, asyncHandler(ticketsController.getById));
ticketsRouter.post('/', requireAuth, validateCreateTickets, asyncHandler(ticketsController.create));
ticketsRouter.patch('/:id', requireAuth, validateUpdateTickets, asyncHandler(ticketsController.update));
ticketsRouter.delete('/:id', requireAuth, asyncHandler(ticketsController.remove));
