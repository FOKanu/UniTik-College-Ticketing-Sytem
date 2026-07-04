// Business logic layer. Depends on the repository via its concrete type for now —
// swap the constructor param type to an interface if/when a DI container is introduced.
// TODO: implement real dashboard business rules; currently returns mock data only.

import { DashboardRepository } from '../repository/dashboard.repository';
import { Dashboard } from '../types/dashboard.types';
import { CreateDashboardDto } from '../dto/create-dashboard.dto';
import { UpdateDashboardDto } from '../dto/update-dashboard.dto';

export class DashboardService {
  constructor(private readonly repository: DashboardRepository = new DashboardRepository()) {}

  async getAll(): Promise<Dashboard[]> {
    // TODO: replace mock with this.repository.findAll()
    return [{ department: "IT", open: 12, inProgress: 4, resolved: 30 }, { department: "FACILITY", open: 3, inProgress: 1, resolved: 8 }] as unknown as Dashboard[];
  }

  async getById(id: string): Promise<Dashboard | null> {
    // TODO: replace mock with this.repository.findById(id)
    return { ...({ department: "IT", open: 12, inProgress: 4, resolved: 30 } as unknown as Dashboard), id };
  }

  async create(data: CreateDashboardDto): Promise<Dashboard> {
    // TODO: replace mock with this.repository.create(data)
    void data;
    return { id: 'mock-id', ...data } as unknown as Dashboard;
  }

  async update(id: string, data: UpdateDashboardDto): Promise<Dashboard> {
    // TODO: replace mock with this.repository.update(id, data)
    return { id, ...data } as unknown as Dashboard;
  }

  async remove(id: string): Promise<void> {
    // TODO: replace mock with this.repository.delete(id)
    void id;
    return;
  }
}
