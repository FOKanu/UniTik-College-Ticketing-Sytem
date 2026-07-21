// Only this file (per module) should import the Prisma client directly.

import { prisma } from '../../../database/prisma';
import { BaseRepository } from '../../../interfaces/base-repository.interface';
import { Tickets } from '../types/tickets.types';
import { CreateTicketsDto } from '../dto/create-tickets.dto';
import { UpdateTicketsDto } from '../dto/update-tickets.dto';

export class TicketsRepository implements BaseRepository<Tickets, CreateTicketsDto, UpdateTicketsDto> {
  async findById(id: string): Promise<Tickets | null> {
    return prisma.ticket.findUnique({ where: { id } });
  }

  async findAll(): Promise<Tickets[]> {
    return prisma.ticket.findMany();
  }

  async create(data: CreateTicketsDto): Promise<Tickets> {
    return prisma.ticket.create({ data });
  }

  async update(id: string, data: UpdateTicketsDto): Promise<Tickets> {
    return prisma.ticket.update({ where: { id }, data });
  }

  async delete(id: string): Promise<void> {
    await prisma.ticket.delete({ where: { id } });
  }
}
