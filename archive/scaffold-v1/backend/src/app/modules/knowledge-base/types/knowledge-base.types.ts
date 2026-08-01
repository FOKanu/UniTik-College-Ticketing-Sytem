// TODO: replace with real domain fields as the knowledge-base module is implemented.

export interface KnowledgeBase {
  id: string;
  // TODO: add real fields for knowledge-base
  [key: string]: unknown;
}

export type KnowledgeBaseDepartment = 'Academics' | 'Finance' | 'IT Support' | 'Maintenance';

export interface KnowledgeBaseDocumentMetadata {
  department: KnowledgeBaseDepartment;
  audience: 'Student';
  language: 'en';
  status: 'synthetic-draft';
  source: 'team-synthetic-data';
  entryCount: number;
}

export interface KnowledgeBaseContentEntry {
  id: string;
  department: KnowledgeBaseDepartment;
  audience: 'Student';
  language: 'en';
  status: 'synthetic-draft';
  source: 'team-synthetic-data';
  question: string;
  answer: string;
  escalation: string;
  relatedPhrasings: string[];
  keywords: string[];
}

export interface ParsedKnowledgeBaseDocument {
  filePath: string;
  metadata: KnowledgeBaseDocumentMetadata;
  entries: KnowledgeBaseContentEntry[];
}

export type KnowledgeBaseCorpus = ParsedKnowledgeBaseDocument[];
