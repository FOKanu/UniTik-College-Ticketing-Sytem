// Only this file (per module) should import the Prisma client directly.
// TODO: implement real Prisma queries once the Notifications model's business rules are defined.

import { prisma } from '../../../database/prisma';
import { BaseRepository } from '../../../interfaces/base-repository.interface';
import { Notifications } from '../types/notifications.types';
import { CreateNotificationsDto } from '../dto/create-notifications.dto';
import { UpdateNotificationsDto } from '../dto/update-notifications.dto';

export class NotificationsRepository implements BaseRepository<Notifications, CreateNotificationsDto, UpdateNotificationsDto> {
  async findById(_id: string): Promise<Notifications | null> {
    // TODO: replace with e.g. prisma.notifications.findUnique(...)
    void prisma;
    return null;
  }

  async findAll(): Promise<Notifications[]> {
    // TODO: replace with e.g. prisma.notifications.findMany(...)
    return [];
  }

  async create(_data: CreateNotificationsDto): Promise<Notifications> {
    // TODO: replace with e.g. prisma.notifications.create(...)
    throw new Error('Not implemented');
  }

  async update(_id: string, _data: UpdateNotificationsDto): Promise<Notifications> {
    // TODO: replace with e.g. prisma.notifications.update(...)
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    // TODO: replace with e.g. prisma.notifications.delete(...)
    return;
  }
}
