import {
  existsSync,
  mkdtempSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { copyKnowledgeBaseContent } from '../scripts/copy-knowledge-base-content';

const canonicalFiles = [
  'academics.md',
  'finance.md',
  'it-support.md',
  'maintenance.md',
];

describe('copyKnowledgeBaseContent', () => {
  let temporaryDirectory: string;

  beforeEach(() => {
    temporaryDirectory = mkdtempSync(join(tmpdir(), 'uts-kb-copy-'));
  });

  afterEach(() => {
    rmSync(temporaryDirectory, { recursive: true, force: true });
  });

  it('creates the destination and copies only canonical Markdown files', () => {
    const source = join(temporaryDirectory, 'source');
    const destination = join(temporaryDirectory, 'nested', 'content');
    mkdirSync(source);
    for (const fileName of canonicalFiles) {
      writeFileSync(join(source, fileName), `# ${fileName}\n`);
    }
    writeFileSync(join(source, 'notes.txt'), 'not canonical');
    writeFileSync(join(source, 'extra.md'), 'not canonical');

    expect(copyKnowledgeBaseContent(source, destination)).toEqual({
      copiedFiles: canonicalFiles,
    });
    expect(readdirSync(destination).sort()).toEqual([...canonicalFiles].sort());
    expect(existsSync(join(destination, 'notes.txt'))).toBe(false);
    expect(existsSync(join(destination, 'extra.md'))).toBe(false);
  });

  it('fails clearly when the source directory is missing', () => {
    expect(() =>
      copyKnowledgeBaseContent(
        join(temporaryDirectory, 'missing'),
        join(temporaryDirectory, 'destination'),
      ),
    ).toThrow('Canonical knowledge-base content directory is missing.');
  });

  it('removes stale generated files before copying canonical Markdown', () => {
    const source = join(temporaryDirectory, 'source');
    const destination = join(temporaryDirectory, 'destination');
    mkdirSync(source);
    mkdirSync(destination);
    for (const fileName of canonicalFiles) {
      writeFileSync(join(source, fileName), `# ${fileName}\n`);
    }
    writeFileSync(join(destination, 'extra.md'), 'stale Markdown');
    writeFileSync(join(destination, 'marker.txt'), 'stale generated file');

    copyKnowledgeBaseContent(source, destination);

    expect(readdirSync(destination).sort()).toEqual([...canonicalFiles].sort());
  });

  it('preserves the destination when canonical Markdown is incomplete', () => {
    const source = join(temporaryDirectory, 'source');
    const destination = join(temporaryDirectory, 'destination');
    mkdirSync(source);
    mkdirSync(destination);
    for (const fileName of canonicalFiles.slice(0, 3)) {
      writeFileSync(join(source, fileName), `# ${fileName}\n`);
    }
    writeFileSync(join(destination, 'marker.txt'), 'must remain');

    expect(() => copyKnowledgeBaseContent(source, destination)).toThrow(
      'Canonical knowledge-base Markdown files are incomplete.',
    );
    expect(readdirSync(destination)).toEqual(['marker.txt']);
  });
});
