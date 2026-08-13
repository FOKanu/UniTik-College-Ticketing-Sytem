// Only this file (per module) should import the Prisma client directly.
// TODO: implement real Prisma queries once the Admin model's business rules are defined.

import { prisma } from '../../../database/prisma';
import { BaseRepository } from '../../../interfaces/base-repository.interface';
import { Admin } from '../types/admin.types';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';

export class AdminRepository implements BaseRepository<Admin, CreateAdminDto, UpdateAdminDto> {
  async findById(_id: string): Promise<Admin | null> {
    // TODO: replace with e.g. prisma.admin.findUnique(...)
    void prisma;
    return null;
  }

  async findAll(): Promise<Admin[]> {
    // TODO: replace with e.g. prisma.admin.findMany(...)
    return [];
  }

  async create(_data: CreateAdminDto): Promise<Admin> {
    // TODO: replace with e.g. prisma.admin.create(...)
    throw new Error('Not implemented');
  }

  async update(_id: string, _data: UpdateAdminDto): Promise<Admin> {
    // TODO: replace with e.g. prisma.admin.update(...)
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    // TODO: replace with e.g. prisma.admin.delete(...)
    return;
  }
}
