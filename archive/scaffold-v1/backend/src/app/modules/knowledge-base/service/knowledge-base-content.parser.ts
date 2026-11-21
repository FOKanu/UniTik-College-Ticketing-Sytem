import { readFileSync } from 'fs';
import { basename, join, resolve } from 'path';
import {
  knowledgeBaseContentEntrySchema,
  knowledgeBaseDocumentMetadataSchema,
  parsedKnowledgeBaseDocumentSchema,
} from '../schemas/knowledge-base.schema';
import {
  KnowledgeBaseContentEntry,
  KnowledgeBaseDepartment,
  KnowledgeBaseDocumentMetadata,
  ParsedKnowledgeBaseDocument,
} from '../types/knowledge-base.types';

const CANONICAL_FILES = ['academics.md', 'finance.md', 'it-support.md', 'maintenance.md'] as const;

const EXPECTED_DEPARTMENTS: Record<(typeof CANONICAL_FILES)[number], KnowledgeBaseDepartment> = {
  'academics.md': 'Academics',
  'finance.md': 'Finance',
  'it-support.md': 'IT Support',
  'maintenance.md': 'Maintenance',
};

const EXPECTED_COUNTS: Record<KnowledgeBaseDepartment, number> = {
  Academics: 30,
  Finance: 15,
  'IT Support': 15,
  Maintenance: 15,
};

const ID_PREFIXES: Record<KnowledgeBaseDepartment, string> = {
  Academics: 'faq-academics',
  Finance: 'faq-finance',
  'IT Support': 'faq-it-support',
  Maintenance: 'faq-maintenance',
};

const REQUIRED_METADATA_KEYS = [
  'department',
  'audience',
  'language',
  'status',
  'source',
  'entryCount',
] as const;

const REQUIRED_SECTIONS = [
  'Question',
  'Answer',
  'Escalation',
  'Related phrasings',
  'Keywords',
] as const;

type SectionName = (typeof REQUIRED_SECTIONS)[number];

function fail(filePath: string, message: string): never {
  throw new Error(`${filePath}: ${message}`);
}

function parseMetadata(
  markdown: string,
  filePath: string,
): {
  metadata: KnowledgeBaseDocumentMetadata;
  body: string;
} {
  const normalized = markdown.replace(/\r\n?/g, '\n');
  if (!normalized.startsWith('---\n')) {
    fail(filePath, 'missing opening front-matter delimiter');
  }

  const closingIndex = normalized.indexOf('\n---\n', 4);
  if (closingIndex < 0) {
    fail(filePath, 'missing closing front-matter delimiter');
  }

  const rawValues = new Map<string, string>();
  for (const line of normalized.slice(4, closingIndex).split('\n')) {
    const match = /^([A-Za-z][A-Za-z0-9]*):\s*(.*?)\s*$/.exec(line);
    if (!match) {
      fail(filePath, `malformed front-matter line "${line}"`);
    }
    const [, key, value] = match;
    if (rawValues.has(key)) {
      fail(filePath, `duplicate front-matter key "${key}"`);
    }
    rawValues.set(key, value);
  }

  for (const key of REQUIRED_METADATA_KEYS) {
    if (!rawValues.has(key)) {
      fail(filePath, `missing front-matter field "${key}"`);
    }
  }
  for (const key of rawValues.keys()) {
    if (!(REQUIRED_METADATA_KEYS as readonly string[]).includes(key)) {
      fail(filePath, `unknown front-matter field "${key}"`);
    }
  }

  const entryCountText = rawValues.get('entryCount') as string;
  if (!/^[1-9]\d*$/.test(entryCountText)) {
    fail(filePath, 'entryCount must be a positive integer');
  }

  const result = knowledgeBaseDocumentMetadataSchema.safeParse({
    department: rawValues.get('department'),
    audience: rawValues.get('audience'),
    language: rawValues.get('language'),
    status: rawValues.get('status'),
    source: rawValues.get('source'),
    entryCount: Number(entryCountText),
  });
  if (!result.success) {
    fail(
      filePath,
      `invalid front matter: ${result.error.issues.map((issue) => issue.message).join('; ')}`,
    );
  }

  return {
    metadata: result.data,
    body: normalized.slice(closingIndex + 5),
  };
}

function parseBulletList(
  lines: string[],
  filePath: string,
  id: string,
  section: SectionName,
): string[] {
  const nonEmptyLines = lines.filter((line) => line.trim().length > 0);
  if (nonEmptyLines.length === 0) {
    fail(filePath, `${id}: "${section}" must contain at least one bullet`);
  }
  return nonEmptyLines.map((line) => {
    const match = /^-\s+(.+?)\s*$/.exec(line);
    if (!match || match[1].trim().length === 0) {
      fail(filePath, `${id}: malformed bullet in "${section}"`);
    }
    return match[1].trim();
  });
}

function parseEntries(
  body: string,
  filePath: string,
  metadata: KnowledgeBaseDocumentMetadata,
): KnowledgeBaseContentEntry[] {
  const lines = body.split('\n');
  const entries: KnowledgeBaseContentEntry[] = [];
  const seenIds = new Set<string>();
  let index = 0;

  while (index < lines.length && !lines[index].startsWith('## ')) {
    const line = lines[index].trim();
    if (line.length > 0 && !line.startsWith('# ') && !line.startsWith('>') && line !== '---') {
      fail(filePath, `unexpected text before first FAQ: "${line}"`);
    }
    index += 1;
  }

  while (index < lines.length) {
    const headingMatch = /^## (faq-[a-z-]+-\d{3})$/.exec(lines[index]);
    if (!headingMatch) {
      fail(filePath, `invalid FAQ heading "${lines[index]}"`);
    }
    const id = headingMatch[1];
    if (seenIds.has(id)) {
      fail(filePath, `duplicate FAQ ID "${id}"`);
    }
    seenIds.add(id);
    index += 1;

    const sections = new Map<SectionName, string[]>();
    while (index < lines.length && !lines[index].startsWith('## ')) {
      const line = lines[index];
      if (line.trim().length === 0 || line.trim() === '---') {
        index += 1;
        continue;
      }
      const sectionMatch = /^### (.+)$/.exec(line);
      if (!sectionMatch) {
        fail(filePath, `${id}: unexpected text outside a subsection: "${line.trim()}"`);
      }
      const section = sectionMatch[1] as SectionName;
      if (!(REQUIRED_SECTIONS as readonly string[]).includes(section)) {
        fail(filePath, `${id}: unknown FAQ subsection "${sectionMatch[1]}"`);
      }
      if (sections.has(section)) {
        fail(filePath, `${id}: duplicate FAQ subsection "${section}"`);
      }
      index += 1;

      const content: string[] = [];
      while (
        index < lines.length &&
        !lines[index].startsWith('### ') &&
        !lines[index].startsWith('## ') &&
        lines[index].trim() !== '---'
      ) {
        content.push(lines[index]);
        index += 1;
      }
      sections.set(section, content);
    }

    for (const section of REQUIRED_SECTIONS) {
      if (!sections.has(section)) {
        fail(filePath, `${id}: missing FAQ subsection "${section}"`);
      }
    }

    const text = (section: SectionName): string =>
      (sections.get(section) as string[]).join('\n').trim();
    const result = knowledgeBaseContentEntrySchema.safeParse({
      id,
      department: metadata.department,
      audience: metadata.audience,
      language: metadata.language,
      status: metadata.status,
      source: metadata.source,
      question: text('Question'),
      answer: text('Answer'),
      escalation: text('Escalation'),
      relatedPhrasings: parseBulletList(
        sections.get('Related phrasings') as string[],
        filePath,
        id,
        'Related phrasings',
      ),
      keywords: parseBulletList(sections.get('Keywords') as string[], filePath, id, 'Keywords'),
    });
    if (!result.success) {
      fail(
        filePath,
        `${id}: invalid content: ${result.error.issues.map((issue) => issue.message).join('; ')}`,
      );
    }
    entries.push(result.data);
  }

  return entries;
}

export function parseKnowledgeBaseDocument(
  markdown: string,
  filePath: string,
): ParsedKnowledgeBaseDocument {
  const { metadata, body } = parseMetadata(markdown, filePath);
  const entries = parseEntries(body, filePath, metadata);
  if (entries.length !== metadata.entryCount) {
    fail(
      filePath,
      `front-matter entryCount ${metadata.entryCount} does not match ${entries.length} parsed entries`,
    );
  }

  return parsedKnowledgeBaseDocumentSchema.parse({ filePath, metadata, entries });
}

export function loadKnowledgeBaseDocument(filePath: string): ParsedKnowledgeBaseDocument {
  return parseKnowledgeBaseDocument(readFileSync(filePath, 'utf8'), filePath);
}

export function loadKnowledgeBaseCorpus(
  contentDirectory = resolve(__dirname, '..', 'content'),
): ParsedKnowledgeBaseDocument[] {
  const documents = CANONICAL_FILES.map((fileName) =>
    loadKnowledgeBaseDocument(join(contentDirectory, fileName)),
  );
  validateKnowledgeBaseCorpus(documents);
  return documents;
}

export function normalizeKnowledgeBaseQuestion(question: string): string {
  return question
    .trim()
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[.!?]+$/g, '')
    .trim();
}

export function validateKnowledgeBaseCorpus(
  documents: ParsedKnowledgeBaseDocument[],
): KnowledgeBaseContentEntry[] {
  if (documents.length !== CANONICAL_FILES.length) {
    throw new Error(`corpus: expected exactly ${CANONICAL_FILES.length} documents`);
  }

  const documentsByFile = new Map(
    documents.map((document) => [basename(document.filePath), document]),
  );
  const allEntries: KnowledgeBaseContentEntry[] = [];
  const seenIds = new Set<string>();
  const seenQuestions = new Set<string>();

  for (const fileName of CANONICAL_FILES) {
    const document = documentsByFile.get(fileName);
    if (!document) {
      throw new Error(`corpus: missing canonical file "${fileName}"`);
    }
    parsedKnowledgeBaseDocumentSchema.parse(document);

    const expectedDepartment = EXPECTED_DEPARTMENTS[fileName];
    if (document.metadata.department !== expectedDepartment) {
      fail(document.filePath, `department must be "${expectedDepartment}"`);
    }
    const expectedCount = EXPECTED_COUNTS[expectedDepartment];
    if (
      document.entries.length !== expectedCount ||
      document.metadata.entryCount !== expectedCount
    ) {
      fail(document.filePath, `expected exactly ${expectedCount} entries`);
    }

    document.entries.forEach((entry, entryIndex) => {
      if (seenIds.has(entry.id)) {
        fail(document.filePath, `duplicate FAQ ID "${entry.id}" across corpus`);
      }
      seenIds.add(entry.id);

      const expectedId = `${ID_PREFIXES[expectedDepartment]}-${String(entryIndex + 1).padStart(3, '0')}`;
      if (entry.id !== expectedId) {
        fail(document.filePath, `expected sequential ID "${expectedId}", found "${entry.id}"`);
      }
      if (entry.department !== expectedDepartment) {
        fail(document.filePath, `${entry.id}: department does not match its document`);
      }

      const normalizedQuestion = normalizeKnowledgeBaseQuestion(entry.question);
      if (seenQuestions.has(normalizedQuestion)) {
        fail(document.filePath, `${entry.id}: duplicate normalized question`);
      }
      seenQuestions.add(normalizedQuestion);
      allEntries.push(entry);
    });
  }

  if (documentsByFile.size !== CANONICAL_FILES.length) {
    throw new Error('corpus: contains an unexpected canonical filename');
  }
  if (allEntries.length !== 75) {
    throw new Error(`corpus: expected exactly 75 entries, found ${allEntries.length}`);
  }
  return allEntries;
}
