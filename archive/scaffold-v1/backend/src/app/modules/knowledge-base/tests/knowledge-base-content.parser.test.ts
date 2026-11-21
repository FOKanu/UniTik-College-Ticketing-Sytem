import { join } from 'path';
import {
  loadKnowledgeBaseCorpus,
  normalizeKnowledgeBaseQuestion,
  parseKnowledgeBaseDocument,
  validateKnowledgeBaseCorpus,
} from '../service/knowledge-base-content.parser';
import { ParsedKnowledgeBaseDocument } from '../types/knowledge-base.types';

const contentDirectory = join(__dirname, '..', 'content');

function markdown(
  overrides: {
    department?: string;
    entryCount?: string;
    metadataLine?: string;
    id?: string;
    question?: string;
    answer?: string;
    escalation?: string;
    related?: string;
    keywords?: string;
    extraSection?: string;
  } = {},
): string {
  return `---
department: ${overrides.department ?? 'Academics'}
audience: Student
language: en
status: synthetic-draft
source: team-synthetic-data
entryCount: ${overrides.entryCount ?? '1'}
${overrides.metadataLine ?? ''}---

# Test Knowledge Base

## ${overrides.id ?? 'faq-academics-001'}

### Question

${overrides.question ?? 'How do I test this?'}

### Answer

${overrides.answer ?? 'Use the documented test process.'}

### Escalation

${overrides.escalation ?? 'Contact the owning department.'}

### Related phrasings

${overrides.related ?? '- How can I test this'}

### Keywords

${overrides.keywords ?? '- testing'}
${overrides.extraSection ?? ''}
---
`;
}

function cloneCorpus(): ParsedKnowledgeBaseDocument[] {
  return structuredClone(loadKnowledgeBaseCorpus(contentDirectory));
}

describe('knowledge-base canonical content', () => {
  const documents = loadKnowledgeBaseCorpus(contentDirectory);
  const entries = validateKnowledgeBaseCorpus(documents);

  it('loads four documents and 75 entries', () => {
    expect(documents).toHaveLength(4);
    expect(entries).toHaveLength(75);
  });

  it.each([
    ['Academics', 30],
    ['Finance', 15],
    ['IT Support', 15],
    ['Maintenance', 15],
  ] as const)('loads the expected %s count', (department, count) => {
    const document = documents.find((item) => item.metadata.department === department);
    expect(document?.entries).toHaveLength(count);
    expect(document?.metadata.entryCount).toBe(count);
  });

  it('keeps IDs and normalized questions globally unique', () => {
    expect(new Set(entries.map((entry) => entry.id)).size).toBe(75);
    expect(
      new Set(entries.map((entry) => normalizeKnowledgeBaseQuestion(entry.question))).size,
    ).toBe(75);
  });

  it('preserves source order, sequential IDs, and department prefixes', () => {
    const prefixes = {
      Academics: 'faq-academics',
      Finance: 'faq-finance',
      'IT Support': 'faq-it-support',
      Maintenance: 'faq-maintenance',
    };
    for (const document of documents) {
      document.entries.forEach((entry, index) => {
        expect(entry.id).toBe(
          `${prefixes[document.metadata.department]}-${String(index + 1).padStart(3, '0')}`,
        );
      });
    }
  });

  it('populates all required fields and list items', () => {
    for (const entry of entries) {
      expect(entry.question.trim()).not.toBe('');
      expect(entry.answer.trim()).not.toBe('');
      expect(entry.escalation.trim()).not.toBe('');
      expect(entry.relatedPhrasings.length).toBeGreaterThan(0);
      expect(entry.keywords.length).toBeGreaterThan(0);
      expect(entry.relatedPhrasings.every((item) => item.trim().length > 0)).toBe(true);
      expect(entry.keywords.every((item) => item.trim().length > 0)).toBe(true);
      expect(entry.audience).toBe('Student');
      expect(entry.language).toBe('en');
      expect(entry.status).toBe('synthetic-draft');
      expect(entry.source).toBe('team-synthetic-data');
    }
  });
});

describe('knowledge-base document parser failures', () => {
  const parse = (value: string): ParsedKnowledgeBaseDocument =>
    parseKnowledgeBaseDocument(value, 'inline-test.md');

  it('rejects missing front matter', () => {
    expect(() => parse('# No front matter')).toThrow(/front-matter/);
  });

  it('rejects a missing front-matter field', () => {
    expect(() => parse(markdown().replace('language: en\n', ''))).toThrow(/missing.*language/);
  });

  it('rejects an unsupported department', () => {
    expect(() => parse(markdown({ department: 'Library' }))).toThrow(/invalid front matter/);
  });

  it('rejects malformed entryCount', () => {
    expect(() => parse(markdown({ entryCount: 'one' }))).toThrow(/positive integer/);
  });

  it.each([
    ['Question', /missing.*Question/],
    ['Answer', /missing.*Answer/],
    ['Escalation', /missing.*Escalation/],
    ['Related phrasings', /missing.*Related phrasings/],
    ['Keywords', /missing.*Keywords/],
  ])('rejects a missing %s section', (section, expected) => {
    const value = markdown().replace(
      new RegExp(`\\n### ${section}\\n\\n[\\s\\S]*?(?=\\n### |\\n---)`),
      '',
    );
    expect(() => parse(value)).toThrow(expected);
  });

  it('rejects a duplicate FAQ section', () => {
    expect(() =>
      parse(markdown({ extraSection: '\n### Question\n\nA duplicate question.\n' })),
    ).toThrow(/duplicate.*Question/);
  });

  it.each([
    ['question', { question: '   ' }, /invalid content/],
    ['answer', { answer: '   ' }, /invalid content/],
    ['escalation', { escalation: '   ' }, /invalid content/],
  ] as const)('rejects an empty %s', (_name, overrides, expected) => {
    expect(() => parse(markdown(overrides))).toThrow(expected);
  });

  it.each([
    ['related-phrasings', { related: '' }],
    ['keywords', { keywords: '' }],
  ] as const)('rejects an empty %s list', (_name, overrides) => {
    expect(() => parse(markdown(overrides))).toThrow(/at least one bullet/);
  });

  it('rejects a malformed bullet list', () => {
    expect(() => parse(markdown({ related: 'Not a bullet' }))).toThrow(/malformed bullet/);
  });

  it('rejects a duplicate FAQ ID', () => {
    const second = markdown().slice(markdown().indexOf('## faq-academics-001'));
    expect(() => parse(`${markdown().trim()}\n\n${second}`)).toThrow(/duplicate FAQ ID/);
  });

  it('rejects a front-matter entryCount mismatch', () => {
    expect(() => parse(markdown({ entryCount: '2' }))).toThrow(/does not match/);
  });

  it('rejects an unknown FAQ subsection', () => {
    expect(() => parse(markdown({ extraSection: '\n### Notes\n\nUnexpected.\n' }))).toThrow(
      /unknown FAQ subsection/,
    );
  });
});

describe('knowledge-base corpus validation failures', () => {
  it('rejects an ID prefix that does not match its department', () => {
    const documents = cloneCorpus();
    documents[0].entries[0].id = 'faq-finance-001';
    expect(() => validateKnowledgeBaseCorpus(documents)).toThrow(/expected sequential ID/);
  });

  it('rejects non-sequential IDs', () => {
    const documents = cloneCorpus();
    documents[1].entries[1].id = 'faq-finance-003';
    expect(() => validateKnowledgeBaseCorpus(documents)).toThrow(/expected sequential ID/);
  });

  it('rejects duplicate normalized questions', () => {
    const documents = cloneCorpus();
    documents[1].entries[0].question = `  ${documents[0].entries[0].question.toUpperCase()}!!! `;
    expect(() => validateKnowledgeBaseCorpus(documents)).toThrow(/duplicate normalized question/);
  });

  it('rejects duplicate IDs across the corpus', () => {
    const documents = cloneCorpus();
    documents[1].entries[0].id = documents[0].entries[0].id;
    expect(() => validateKnowledgeBaseCorpus(documents)).toThrow(/duplicate FAQ ID/);
  });
});
