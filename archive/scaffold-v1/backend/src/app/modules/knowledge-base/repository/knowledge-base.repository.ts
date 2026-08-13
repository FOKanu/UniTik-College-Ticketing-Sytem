// Only this file (per module) should import the Prisma client directly.
// TODO: implement real Prisma queries once the KnowledgeBase model's business rules are defined.

import { prisma } from '../../../database/prisma';
import { BaseRepository } from '../../../interfaces/base-repository.interface';
import { KnowledgeBase } from '../types/knowledge-base.types';
import { CreateKnowledgeBaseDto } from '../dto/create-knowledge-base.dto';
import { UpdateKnowledgeBaseDto } from '../dto/update-knowledge-base.dto';

export class KnowledgeBaseRepository implements BaseRepository<KnowledgeBase, CreateKnowledgeBaseDto, UpdateKnowledgeBaseDto> {
  async findById(_id: string): Promise<KnowledgeBase | null> {
    // TODO: replace with e.g. prisma.knowledgeBase.findUnique(...)
    void prisma;
    return null;
  }

  async findAll(): Promise<KnowledgeBase[]> {
    // TODO: replace with e.g. prisma.knowledgeBase.findMany(...)
    return [];
  }

  async create(_data: CreateKnowledgeBaseDto): Promise<KnowledgeBase> {
    // TODO: replace with e.g. prisma.knowledgeBase.create(...)
    throw new Error('Not implemented');
  }

  async update(_id: string, _data: UpdateKnowledgeBaseDto): Promise<KnowledgeBase> {
    // TODO: replace with e.g. prisma.knowledgeBase.update(...)
    throw new Error('Not implemented');
  }

  async delete(_id: string): Promise<void> {
    // TODO: replace with e.g. prisma.knowledgeBase.delete(...)
    return;
  }
}
