export interface BaseService<T, CreateInput, UpdateInput> {
  getById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  remove(id: string): Promise<void>;
}
