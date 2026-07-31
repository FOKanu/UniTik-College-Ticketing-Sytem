// Business logic layer. Depends on the repository via its concrete type for now —
// swap the constructor param type to an interface if/when a DI container is introduced.

import { TicketsRepository } from '../repository/tickets.repository';
import { Tickets } from '../types/tickets.types';
import { CreateTicketsDto } from '../dto/create-tickets.dto';
import { UpdateTicketsDto } from '../dto/update-tickets.dto';
import { classifyTicket } from '../routing/ticket-router';

export class TicketsService {
  constructor(private readonly repository: TicketsRepository = new TicketsRepository()) {}

  async getAll(): Promise<Tickets[]> {
    return this.repository.findAll();
  }

  async getById(id: string): Promise<Tickets | null> {
    return this.repository.findById(id);
  }

  async create(data: CreateTicketsDto): Promise<Tickets> {
    if (data.department) {
      const dataToCreate = { ...data, classificationSource: 'manual' as const };
      return this.repository.create(dataToCreate);
    }

    const result = classifyTicket(data.subject, data.description);
    const dataToCreate = {
      ...data,
      department: result.department ?? data.department,
      category: result.category ?? data.category,
      classificationSource: result.classificationSource,
    };

    return this.repository.create(dataToCreate);
  }

  async update(id: string, data: UpdateTicketsDto): Promise<Tickets> {
    return this.repository.update(id, data);
  }

  async remove(id: string): Promise<void> {
    return this.repository.delete(id);
  }
}
