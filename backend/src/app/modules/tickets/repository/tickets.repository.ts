// Only this file (per module) should import the Prisma client directly.
// TODO: implement real Prisma queries once the Tickets model's business rules are defined.

import { prisma } from '../../../database/prisma';
import { BaseRepository } from '../../../interfaces/base-repository.interface';
import { Tickets } from '../types/tickets.types';
import { CreateTicketsDto } from '../dto/create-tickets.dto';
import { UpdateTicketsDto } from '../dto/update-tickets.dto';

export class TicketsRepository implements BaseRepository<Tickets, CreateTicketsDto, UpdateTicketsDto> {
  async findById(_id: string): Promise<Tickets | null> {
    // TODO: replace with e.g. prisma.tickets.findUnique(...)
    void prisma;
    return null;
  }

  async findAll(): Promise<Tickets[]> {
    // TODO: replace with e.g. prisma.tickets.findMany(...)
    return [];
  }

  async create(_data: CreateTicketsDto): Promise<Tickets> {
    // TODO: replace with e.g. prisma.tickets.create(...)
    throw new Error('Not implemented');
  }

  async update(_id: string, _data: UpdateTicketsDto): Promise<Tickets> {
    // TODO: replace with e.g. prisma.tickets.update(...)
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    // TODO: replace with e.g. prisma.tickets.delete(...)
    return;
  }
}
