// Business logic layer. Depends on the repository via its concrete type for now —
// swap the constructor param type to an interface if/when a DI container is introduced.
// TODO: implement real notifications business rules; currently returns mock data only.

import { NotificationsRepository } from '../repository/notifications.repository';
import { Notifications } from '../types/notifications.types';
import { CreateNotificationsDto } from '../dto/create-notifications.dto';
import { UpdateNotificationsDto } from '../dto/update-notifications.dto';

export class NotificationsService {
  constructor(private readonly repository: NotificationsRepository = new NotificationsRepository()) {}

  async getAll(): Promise<Notifications[]> {
    // TODO: replace mock with this.repository.findAll()
    return [{ id: "ntf_1", message: "Your ticket status changed to IN_PROGRESS", channel: "EMAIL" }] as unknown as Notifications[];
  }

  async getById(id: string): Promise<Notifications | null> {
    // TODO: replace mock with this.repository.findById(id)
    return { ...({ id: "ntf_1", message: "Your ticket status changed to IN_PROGRESS", channel: "EMAIL" } as unknown as Notifications), id };
  }

  async create(data: CreateNotificationsDto): Promise<Notifications> {
    // TODO: replace mock with this.repository.create(data)
    void data;
    return { id: 'mock-id', ...data } as unknown as Notifications;
  }

  async update(id: string, data: UpdateNotificationsDto): Promise<Notifications> {
    // TODO: replace mock with this.repository.update(id, data)
    return { id, ...data } as unknown as Notifications;
  }

  async remove(id: string): Promise<void> {
    // TODO: replace mock with this.repository.delete(id)
    void id;
    return;
  }
}
