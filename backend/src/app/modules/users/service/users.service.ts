// Business logic layer. Depends on the repository via its concrete type for now —
// swap the constructor param type to an interface if/when a DI container is introduced.
// TODO: implement real users business rules; currently returns mock data only.

import { UsersRepository } from '../repository/users.repository';
import { Users } from '../types/users.types';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';

export class UsersService {
  constructor(private readonly repository: UsersRepository = new UsersRepository()) {}

  async getAll(): Promise<Users[]> {
    // TODO: replace mock with this.repository.findAll()
    return [{ id: "usr_1", displayName: "Ada Lovelace", role: "STUDENT" }, { id: "usr_2", displayName: "Grace Hopper", role: "STAFF" }] as unknown as Users[];
  }

  async getById(id: string): Promise<Users | null> {
    // TODO: replace mock with this.repository.findById(id)
    return { ...({ id: "usr_1", displayName: "Ada Lovelace", role: "STUDENT" } as unknown as Users), id };
  }

  async create(data: CreateUsersDto): Promise<Users> {
    // TODO: replace mock with this.repository.create(data)
    void data;
    return { id: 'mock-id', ...data } as unknown as Users;
  }

  async update(id: string, data: UpdateUsersDto): Promise<Users> {
    // TODO: replace mock with this.repository.update(id, data)
    return { id, ...data } as unknown as Users;
  }

  async remove(id: string): Promise<void> {
    // TODO: replace mock with this.repository.delete(id)
    void id;
    return;
  }
}
