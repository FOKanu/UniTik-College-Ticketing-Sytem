// Business logic layer. Depends on the repository via its concrete type for now —
// swap the constructor param type to an interface if/when a DI container is introduced.
// TODO: implement real tickets business rules; currently returns mock data only.

import { TicketsRepository } from '../repository/tickets.repository';
import { Tickets } from '../types/tickets.types';
import { CreateTicketsDto } from '../dto/create-tickets.dto';
import { UpdateTicketsDto } from '../dto/update-tickets.dto';

export class TicketsService {
  constructor(private readonly repository: TicketsRepository = new TicketsRepository()) {}

  async getAll(): Promise<Tickets[]> {
    // TODO: replace mock with this.repository.findAll()
    return [{ id: "tkt_1", subject: "Cannot access course portal", status: "OPEN" }, { id: "tkt_2", subject: "WiFi outage in library", status: "IN_PROGRESS" }] as unknown as Tickets[];
  }

  async getById(id: string): Promise<Tickets | null> {
    // TODO: replace mock with this.repository.findById(id)
    return { ...({ id: "tkt_1", subject: "Cannot access course portal", status: "OPEN" } as unknown as Tickets), id };
  }

  async create(data: CreateTicketsDto): Promise<Tickets> {
    // TODO: replace mock with this.repository.create(data)
    void data;
    return { id: 'mock-id', ...data } as unknown as Tickets;
  }

  async update(id: string, data: UpdateTicketsDto): Promise<Tickets> {
    // TODO: replace mock with this.repository.update(id, data)
    return { id, ...data } as unknown as Tickets;
  }

  async remove(id: string): Promise<void> {
    // TODO: replace mock with this.repository.delete(id)
    void id;
    return;
  }
}
