import {
  copyFileSync,
  mkdirSync,
  readdirSync,
  rmSync,
  statSync,
} from 'fs';
import { basename, join, resolve } from 'path';

const CANONICAL_MARKDOWN_FILES = [
  'academics.md',
  'finance.md',
  'it-support.md',
  'maintenance.md',
] as const;

export interface CopyKnowledgeBaseContentResult {
  copiedFiles: string[];
}

export function copyKnowledgeBaseContent(
  sourceDirectory: string,
  destinationDirectory: string,
): CopyKnowledgeBaseContentResult {
  if (!statDirectoryExists(sourceDirectory)) {
    throw new Error('Canonical knowledge-base content directory is missing.');
  }

  const sourceFiles = new Set(
    readdirSync(sourceDirectory, { withFileTypes: true })
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name),
  );
  const markdownFiles = CANONICAL_MARKDOWN_FILES.filter((fileName) =>
    sourceFiles.has(fileName),
  );

  if (markdownFiles.length !== CANONICAL_MARKDOWN_FILES.length) {
    throw new Error('Canonical knowledge-base Markdown files are incomplete.');
  }

  rmSync(destinationDirectory, { recursive: true, force: true });
  mkdirSync(destinationDirectory, { recursive: true });
  for (const fileName of markdownFiles) {
    copyFileSync(join(sourceDirectory, fileName), join(destinationDirectory, fileName));
  }

  return { copiedFiles: markdownFiles };
}

function statDirectoryExists(directory: string): boolean {
  try {
    return statSync(directory).isDirectory();
  } catch {
    return false;
  }
}

if (require.main === module) {
  const sourceDirectory = resolve(
    process.cwd(),
    'src',
    'app',
    'modules',
    'knowledge-base',
    'content',
  );
  const destinationDirectory = resolve(__dirname, '..', 'content');
  const result = copyKnowledgeBaseContent(sourceDirectory, destinationDirectory);
  process.stdout.write(
    `Copied ${result.copiedFiles.length} knowledge-base Markdown files to ${basename(
      destinationDirectory,
    )}.\n`,
  );
}
