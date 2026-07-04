// Business logic layer. Depends on the repository via its concrete type for now —
// swap the constructor param type to an interface if/when a DI container is introduced.
// TODO: implement real admin business rules; currently returns mock data only.

import { AdminRepository } from '../repository/admin.repository';
import { Admin } from '../types/admin.types';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';

export class AdminService {
  constructor(private readonly repository: AdminRepository = new AdminRepository()) {}

  async getAll(): Promise<Admin[]> {
    // TODO: replace mock with this.repository.findAll()
    return [{ id: "log_1", action: "TICKET_STATUS_CHANGED", actor: "usr_2" }] as unknown as Admin[];
  }

  async getById(id: string): Promise<Admin | null> {
    // TODO: replace mock with this.repository.findById(id)
    return { ...({ id: "log_1", action: "TICKET_STATUS_CHANGED", actor: "usr_2" } as unknown as Admin), id };
  }

  async create(data: CreateAdminDto): Promise<Admin> {
    // TODO: replace mock with this.repository.create(data)
    void data;
    return { id: 'mock-id', ...data } as unknown as Admin;
  }

  async update(id: string, data: UpdateAdminDto): Promise<Admin> {
    // TODO: replace mock with this.repository.update(id, data)
    return { id, ...data } as unknown as Admin;
  }

  async remove(id: string): Promise<void> {
    // TODO: replace mock with this.repository.delete(id)
    void id;
    return;
  }
}
