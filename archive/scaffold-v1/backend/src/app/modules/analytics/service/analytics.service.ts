// Business logic layer. Depends on the repository via its concrete type for now —
// swap the constructor param type to an interface if/when a DI container is introduced.
// TODO: implement real analytics business rules; currently returns mock data only.

import { AnalyticsRepository } from '../repository/analytics.repository';
import { Analytics } from '../types/analytics.types';
import { CreateAnalyticsDto } from '../dto/create-analytics.dto';
import { UpdateAnalyticsDto } from '../dto/update-analytics.dto';

export class AnalyticsService {
  constructor(private readonly repository: AnalyticsRepository = new AnalyticsRepository()) {}

  async getAll(): Promise<Analytics[]> {
    // TODO: replace mock with this.repository.findAll()
    return [{ metric: "avg_resolution_time_hours", value: 18.5 }, { metric: "tickets_per_week", value: 42 }] as unknown as Analytics[];
  }

  async getById(id: string): Promise<Analytics | null> {
    // TODO: replace mock with this.repository.findById(id)
    return { ...({ metric: "avg_resolution_time_hours", value: 18.5 } as unknown as Analytics), id };
  }

  async create(data: CreateAnalyticsDto): Promise<Analytics> {
    // TODO: replace mock with this.repository.create(data)
    void data;
    return { id: 'mock-id', ...data } as unknown as Analytics;
  }

  async update(id: string, data: UpdateAnalyticsDto): Promise<Analytics> {
    // TODO: replace mock with this.repository.update(id, data)
    return { id, ...data } as unknown as Analytics;
  }

  async remove(id: string): Promise<void> {
    // TODO: replace mock with this.repository.delete(id)
    void id;
    return;
  }
}
