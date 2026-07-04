// Only this file (per module) should import the Prisma client directly.
// TODO: implement real Prisma queries once the Users model's business rules are defined.

import { prisma } from '../../../database/prisma';
import { BaseRepository } from '../../../interfaces/base-repository.interface';
import { Users } from '../types/users.types';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';

export class UsersRepository implements BaseRepository<Users, CreateUsersDto, UpdateUsersDto> {
  async findById(_id: string): Promise<Users | null> {
    // TODO: replace with e.g. prisma.users.findUnique(...)
    void prisma;
    return null;
  }

  async findAll(): Promise<Users[]> {
    // TODO: replace with e.g. prisma.users.findMany(...)
    return [];
  }

  async create(_data: CreateUsersDto): Promise<Users> {
    // TODO: replace with e.g. prisma.users.create(...)
    throw new Error('Not implemented');
  }

  async update(_id: string, _data: UpdateUsersDto): Promise<Users> {
    // TODO: replace with e.g. prisma.users.update(...)
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    // TODO: replace with e.g. prisma.users.delete(...)
    return;
  }
}
