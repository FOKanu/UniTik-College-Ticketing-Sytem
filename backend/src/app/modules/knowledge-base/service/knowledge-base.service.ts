// Business logic layer. Depends on the repository via its concrete type for now —
// swap the constructor param type to an interface if/when a DI container is introduced.
// TODO: implement real knowledge-base business rules; currently returns mock data only.

import { KnowledgeBaseRepository } from '../repository/knowledge-base.repository';
import { KnowledgeBase } from '../types/knowledge-base.types';
import { CreateKnowledgeBaseDto } from '../dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from '../dto/update-knowledge-base.dto';

export class KnowledgeBaseService {
  constructor(private readonly repository: KnowledgeBaseRepository = new KnowledgeBaseRepository()) {}

  async getAll(): Promise<KnowledgeBase[]> {
    // TODO: replace mock with this.repository.findAll()
    return [{ id: "faq_1", question: "How do I reset my student email password?", language: "en" }] as unknown as KnowledgeBase[];
  }

  async getById(id: string): Promise<KnowledgeBase | null> {
    // TODO: replace mock with this.repository.findById(id)
    return { ...({ id: "faq_1", question: "How do I reset my student email password?", language: "en" } as unknown as KnowledgeBase), id };
  }

  async create(data: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    // TODO: replace mock with this.repository.create(data)
    void data;
    return { id: 'mock-id', ...data } as unknown as KnowledgeBase;
  }

  async update(id: string, data: UpdateKnowledgeBaseDto): Promise<KnowledgeBase> {
    // TODO: replace mock with this.repository.update(id, data)
    return { id, ...data } as unknown as KnowledgeBase;
  }

  async remove(id: string): Promise<void> {
    // TODO: replace mock with this.repository.delete(id)
    void id;
    return;
  }
}
