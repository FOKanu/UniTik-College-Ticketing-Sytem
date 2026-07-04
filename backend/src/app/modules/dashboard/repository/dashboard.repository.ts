// Only this file (per module) should import the Prisma client directly.
// TODO: implement real Prisma queries once the Dashboard model's business rules are defined.

import { prisma } from '../../../database/prisma';
import { BaseRepository } from '../../../interfaces/base-repository.interface';
import { Dashboard } from '../types/dashboard.types';
import { CreateDashboardDto } from '../dto/create-dashboard.dto';
import { UpdateDashboardDto } from '../dto/update-dashboard.dto';

export class DashboardRepository implements BaseRepository<Dashboard, CreateDashboardDto, UpdateDashboardDto> {
  async findById(_id: string): Promise<Dashboard | null> {
    // TODO: replace with e.g. prisma.dashboard.findUnique(...)
    void prisma;
    return null;
  }

  async findAll(): Promise<Dashboard[]> {
    // TODO: replace with e.g. prisma.dashboard.findMany(...)
    return [];
  }

  async create(_data: CreateDashboardDto): Promise<Dashboard> {
    // TODO: replace with e.g. prisma.dashboard.create(...)
    throw new Error('Not implemented');
  }

  async update(_id: string, _data: UpdateDashboardDto): Promise<Dashboard> {
    // TODO: replace with e.g. prisma.dashboard.update(...)
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    // TODO: replace with e.g. prisma.dashboard.delete(...)
    return;
  }
}
