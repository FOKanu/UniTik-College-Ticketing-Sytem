// Rule-engine ticket routing (NFR-1.3). This is a keyword-matching placeholder, not a real
// classifier — see backend/src/app/modules/ai for the eventual model-backed replacement.
// NEG-6: never present a low-confidence guess as a confident one, so ties/no-matches return nulls
// rather than picking an arbitrary department.

import { DEPARTMENT_KEYWORDS } from './department-keywords';

export interface ClassificationResult {
  department: string | null;
  category: string | null;
  classificationSource: 'rule-engine' | null;
}

const NO_MATCH: ClassificationResult = {
  department: null,
  category: null,
  classificationSource: null,
};

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// \b anchors on the phrase's first/last characters, so multi-word keywords (e.g. "air
// conditioning") still match as a whole phrase without requiring boundaries around the
// internal space.
const KEYWORD_PATTERNS: Record<string, RegExp[]> = Object.fromEntries(
  Object.entries(DEPARTMENT_KEYWORDS).map(([department, keywords]) => [
    department,
    keywords.map((keyword) => new RegExp(`\\b${escapeRegExp(keyword)}\\b`)),
  ]),
);

export function classifyTicket(subject: string, description: string): ClassificationResult {
  const text = `${subject} ${description}`.toLowerCase();

  let bestDepartment: string | null = null;
  let bestCount = 0;
  let tie = false;

  for (const [department, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    const count = patterns.filter((pattern) => pattern.test(text)).length;

    if (count === 0) continue;

    if (count > bestCount) {
      bestDepartment = department;
      bestCount = count;
      tie = false;
    } else if (count === bestCount) {
      tie = true;
    }
  }

  if (bestDepartment === null || tie) {
    return NO_MATCH;
  }

  return {
    department: bestDepartment,
    category: bestDepartment.toLowerCase(),
    classificationSource: 'rule-engine',
  };
}
